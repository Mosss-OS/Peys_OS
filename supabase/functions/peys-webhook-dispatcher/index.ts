import "jsr:@supabase/functions-js/edge-runtime.d.ts";
import { createClient } from "jsr:@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": Deno.env.get("ALLOWED_ORIGINS") || "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
};

// Security constants
const TIMESTAMP_TOLERANCE_MS = 5 * 60 * 1000; // 5 minutes
const MAX_RETRY_COUNT = 5;
const RETRY_DELAYS = [0, 300, 1800, 7200, 86400]; // 0, 5min, 30min, 2hr, 24hr
const DEBUG = Deno.env.get("DEBUG") === "true";

// Debug logger - only logs in debug mode
const debugLog = (...args: unknown[]) => {
  if (DEBUG) console.log(...args);
};

interface WebhookEvent {
  event_type: string;
  payment_id?: string;
  payload: Record<string, unknown>;
  timestamp?: number; // Unix timestamp in ms
  nonce?: string; // Unique identifier to prevent replay
}

interface Webhook {
  id: string;
  url: string;
  events: string[];
  secret: string;
  is_active: boolean;
}

interface ProcessedNonce {
  nonce: string;
  processed_at: number;
  webhook_id: string;
}

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  if (req.method !== "POST") {
    return new Response(
      JSON.stringify({ error: "Method not allowed" }),
      { status: 405, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }

  try {
    const supabaseClient = createClient(
      Deno.env.get("SUPABASE_URL") ?? "",
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? ""
    );

    // Check rate limit
    const clientIp = req.headers.get("x-forwarded-for")?.split(",")[0]?.trim() || 
                      req.headers.get("cf-connecting-ip") || 
                      "unknown";
    
    const rateLimitOk = await checkRateLimit(supabaseClient, clientIp);
    if (!rateLimitOk) {
      return new Response(
        JSON.stringify({ error: "Rate limit exceeded" }),
        { status: 429, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const event: WebhookEvent = await req.json();

    // Validate timestamp
    if (event.timestamp) {
      const now = Date.now();
      const diff = Math.abs(now - event.timestamp);
      if (diff > TIMESTAMP_TOLERANCE_MS) {
        console.error(`Webhook timestamp out of range: ${diff}ms`);
        return new Response(
          JSON.stringify({ error: "Request timestamp out of range" }),
          { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }
    }

    // Check nonce to prevent replay attacks
    if (event.nonce) {
      const nonceExists = await checkNonce(supabaseClient, event.nonce);
      if (nonceExists) {
        console.error(`Duplicate nonce: ${event.nonce}`);
        return new Response(
          JSON.stringify({ error: "Duplicate request" }),
          { status: 409, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }
      await storeNonce(supabaseClient, event.nonce);
    }

    // Get all active webhooks that subscribe to this event type
    const { data: webhooks, error } = await supabaseClient
      .from("webhooks")
      .select("id, url, events, secret, is_active")
      .eq("is_active", true)
      .contains("events", [event.event_type]);

    if (error) {
      console.error("Error fetching webhooks:", error);
      return new Response(
        JSON.stringify({ error: "Failed to fetch webhooks" }),
        { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    debugLog(`Found ${webhooks.length} webhooks for event ${event.event_type}`);

    // Dispatch to each webhook
    const results = await Promise.allSettled(
      webhooks.map((webhook) => dispatchToWebhook(supabaseClient, webhook, event))
    );

    // Log results
    const successful = results.filter((r) => r.status === "fulfilled").length;
    const failed = results.filter((r) => r.status === "rejected").length;

    debugLog(`Dispatched to ${successful} webhooks, ${failed} failed`);

    return new Response(
      JSON.stringify({
        success: true,
        dispatched: successful,
        failed: failed,
      }),
      { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  } catch (error) {
    console.error("Error in webhook dispatcher:", error);
    return new Response(
      JSON.stringify({ error: error.message }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});

async function dispatchToWebhook(
  supabaseClient: ReturnType<typeof createClient>,
  webhook: Webhook,
  event: WebhookEvent
): Promise<void> {
  const startTime = Date.now();

  try {
    // Create delivery record
    const { data: delivery, error: insertError } = await supabaseClient
      .from("webhook_deliveries")
      .insert({
        webhook_id: webhook.id,
        event_type: event.event_type,
        payload: event.payload,
        success: false,
      })
      .select()
      .single();

    if (insertError || !delivery) {
      throw new Error(`Failed to create delivery record: ${insertError?.message}`);
    }

    const deliveryId = delivery.id;

    // Generate signature with timestamp
    const signature = await generateSignature(webhook.secret, event);

    // Send webhook request
    const response = await fetch(webhook.url, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "X-Webhook-Signature": signature,
        "X-Webhook-Event": event.event_type,
        "X-Webhook-ID": webhook.id,
        "X-Webhook-Timestamp": String(event.timestamp || Date.now()),
      },
      body: JSON.stringify(event.payload),
      signal: AbortSignal.timeout(10000),
    });

    const endTime = Date.now();
    const duration = endTime - startTime;
    const responseBody = await response.text().catch(() => "");

    // Update delivery record
    await supabaseClient
      .from("webhook_deliveries")
      .update({
        success: response.ok,
        response_status: response.status,
        response_body: responseBody.substring(0, 1000), // Limit response size
        duration_ms: duration,
      })
      .eq("id", deliveryId);

    // Update webhook last triggered time
    await supabaseClient
      .from("webhooks")
      .update({ last_triggered_at: new Date().toISOString() })
      .eq("id", webhook.id);

    if (!response.ok) {
      throw new Error(`Webhook returned ${response.status}`);
    }

    debugLog(`Successfully dispatched to ${webhook.url} in ${duration}ms`);

    // Schedule retry if failed
    if (!response.ok) {
      await scheduleRetry(supabaseClient, webhook.id, event, 0);
    }
  } catch (error) {
    console.error(`Failed to dispatch to ${webhook.url}:`, error.message);
    throw error;
  }
}

async function scheduleRetry(
  supabaseClient: ReturnType<typeof createClient>,
  webhookId: string,
  event: WebhookEvent,
  retryCount: number
): Promise<void> {
  if (retryCount >= MAX_RETRY_COUNT) {
    debugLog(`Max retries reached for webhook ${webhookId}`);
    return;
  }

  const delay = RETRY_DELAYS[retryCount] * 1000; // Convert to ms
  
  // In production, use a proper job queue (like Inngest, Trigger.dev, or QStash)
  // This is a placeholder for the retry logic
  debugLog(`Scheduling retry ${retryCount + 1} for webhook ${webhookId} in ${delay}ms`);
}

async function generateSignature(secret: string, event: WebhookEvent): Promise<string> {
  const timestamp = event.timestamp || Date.now();
  const payload = JSON.stringify(event.payload);
  const signatureBase = `${timestamp}.${payload}`;
  
  const encoder = new TextEncoder();
  const data = encoder.encode(signatureBase);
  const key = await crypto.subtle.importKey(
    "raw",
    encoder.encode(secret),
    { name: "HMAC", hash: "SHA-256" },
    false,
    ["sign"]
  );
  const signature = await crypto.subtle.sign("HMAC", key, data);
  return Array.from(new Uint8Array(signature))
    .map((b) => b.toString(16).padStart(2, "0"))
    .join("");
}

async function checkRateLimit(
  supabaseClient: ReturnType<typeof createClient>,
  clientIp: string
): Promise<boolean> {
  const windowMs = 60 * 1000; // 1 minute
  const maxRequests = 100;

  // Get current count for this IP
  const { data: rateLimit } = await supabaseClient
    .from("webhook_rate_limits")
    .select("request_count, window_start")
    .eq("ip_address", clientIp)
    .single();

  const now = Date.now();

  if (!rateLimit) {
    // First request from this IP
    await supabaseClient
      .from("webhook_rate_limits")
      .insert({
        ip_address: clientIp,
        request_count: 1,
        window_start: new Date(now).toISOString(),
      });
    return true;
  }

  const windowStart = new Date(rateLimit.window_start).getTime();
  
  if (now - windowStart > windowMs) {
    // Window expired, reset
    await supabaseClient
      .from("webhook_rate_limits")
      .update({
        request_count: 1,
        window_start: new Date(now).toISOString(),
      })
      .eq("ip_address", clientIp);
    return true;
  }

  if (rateLimit.request_count >= maxRequests) {
    return false;
  }

  // Increment count
  await supabaseClient
    .from("webhook_rate_limits")
    .update({
      request_count: rateLimit.request_count + 1,
    })
    .eq("ip_address", clientIp);

  return true;
}

async function checkNonce(
  supabaseClient: ReturnType<typeof createClient>,
  nonce: string
): Promise<boolean> {
  // Check if nonce exists and is recent (within 24 hours)
  const { data } = await supabaseClient
    .from("webhook_nonces")
    .select("id")
    .eq("nonce", nonce)
    .gte("processed_at", new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString())
    .single();

  return !!data;
}

async function storeNonce(
  supabaseClient: ReturnType<typeof createClient>,
  nonce: string
): Promise<void> {
  await supabaseClient
    .from("webhook_nonces")
    .insert({
      nonce,
      processed_at: new Date().toISOString(),
    });

  // Cleanup old nonces (older than 48 hours)
  await supabaseClient
    .from("webhook_nonces")
    .delete()
    .lt("processed_at", new Date(Date.now() - 48 * 60 * 60 * 1000).toISOString());
}

// Verify webhook signature (for receiving webhooks)
export async function verifyWebhookSignature(
  payload: string,
  signature: string,
  timestamp: string,
  secret: string
): Promise<boolean> {
  // Check timestamp freshness
  const webhookTime = parseInt(timestamp);
  if (isNaN(webhookTime)) {
    return false;
  }
  const now = Math.floor(Date.now());
  if (Math.abs(now - webhookTime) > TIMESTAMP_TOLERANCE_MS) {
    return false;
  }

  // Verify HMAC signature
  const signatureBase = `${timestamp}.${payload}`;
  const encoder = new TextEncoder();
  const data = encoder.encode(signatureBase);
  const key = await crypto.subtle.importKey(
    "raw",
    encoder.encode(secret),
    { name: "HMAC", hash: "SHA-256" },
    false,
    ["sign"]
  );
  const expectedSignature = await crypto.subtle.sign("HMAC", key, data);
  const expectedHex = Array.from(new Uint8Array(expectedSignature))
    .map((b) => b.toString(16).padStart(2, "0"))
    .join("");

  return signature === expectedHex;
}
