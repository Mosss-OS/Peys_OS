/// Shared webhook dispatch logic for Peys Edge Functions.
/// Imported directly by internal callers to avoid HTTP round-trips with service role key.

import { createClient } from "jsr:@supabase/supabase-js@2";

const DEBUG = Deno.env.get("DEBUG") === "true";
const debugLog = (...args: unknown[]) => { if (DEBUG) console.log(...args); };

export interface WebhookEvent {
  event_type: string;
  payment_id?: string;
  payload: Record<string, unknown>;
  timestamp?: number;
  nonce?: string;
}

export async function dispatchWebhookEvent(
  supabaseUrl: string,
  serviceRoleKey: string,
  event: WebhookEvent
): Promise<{ success: boolean; dispatched: number }> {
  const supabaseClient = createClient(supabaseUrl, serviceRoleKey);

  // Get active webhooks subscribing to this event type
  const { data: webhooks, error } = await supabaseClient
    .from("webhooks")
    .select("id, url, events, secret, is_active")
    .eq("is_active", true)
    .contains("events", [event.event_type]);

  if (error) {
    console.error("Error fetching webhooks:", error);
    return { success: false, dispatched: 0 };
  }

  debugLog(`Found ${webhooks.length} webhooks for event ${event.event_type}`);

  // Dispatch to each webhook
  const results = await Promise.allSettled(
    webhooks.map((webhook) => dispatchToWebhook(supabaseClient, webhook, event))
  );

  const successful = results.filter((r) => r.status === "fulfilled").length;
  debugLog(`Dispatched to ${successful} webhooks`);
  return { success: true, dispatched: successful };
}

async function dispatchToWebhook(
  supabaseClient: ReturnType<typeof createClient>,
  webhook: { id: string; url: string; secret: string },
  event: WebhookEvent
): Promise<void> {
  const startTime = Date.now();

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

  // Generate HMAC signature
  const timestamp = event.timestamp || Date.now();
  const signature = await generateSignature(webhook.secret, event);

  // Send webhook request
  const response = await fetch(webhook.url, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "X-Webhook-Signature": signature,
      "X-Webhook-Event": event.event_type,
      "X-Webhook-ID": webhook.id,
      "X-Webhook-Timestamp": String(timestamp),
    },
    body: JSON.stringify(event.payload),
    signal: AbortSignal.timeout(10000),
  });

  const responseBody = await response.text().catch(() => "");

  // Update delivery record
  await supabaseClient
    .from("webhook_deliveries")
    .update({
      success: response.ok,
      response_status: response.status,
      response_body: responseBody.substring(0, 1000),
      duration_ms: Date.now() - startTime,
    })
    .eq("id", delivery.id);

  // Update webhook last triggered time
  await supabaseClient
    .from("webhooks")
    .update({ last_triggered_at: new Date().toISOString() })
    .eq("id", webhook.id);
}

async function generateSignature(secret: string, event: WebhookEvent): Promise<string> {
  const timestamp = event.timestamp || Date.now();
  const payload = JSON.stringify(event.payload);
  const signatureBase = `${timestamp}.${payload}`;

  const encoder = new TextEncoder();
  const key = await crypto.subtle.importKey(
    "raw",
    encoder.encode(secret),
    { name: "HMAC", hash: "SHA-256" },
    false,
    ["sign"]
  );
  const signature = await crypto.subtle.sign("HMAC", key, encoder.encode(signatureBase));
  return Array.from(new Uint8Array(signature))
    .map((b) => b.toString(16).padStart(2, "0"))
    .join("");
}

// Verify webhook signature (for receiving webhooks from external sources)
export async function verifyWebhookSignature(
  payload: string,
  signature: string,
  timestamp: string,
  secret: string
): Promise<boolean> {
  const TIMESTAMP_TOLERANCE_MS = 5 * 60 * 1000;
  const webhookTime = parseInt(timestamp);
  if (isNaN(webhookTime)) return false;
  if (Math.abs(Date.now() - webhookTime) > TIMESTAMP_TOLERANCE_MS) return false;

  const signatureBase = `${timestamp}.${payload}`;
  const encoder = new TextEncoder();
  const key = await crypto.subtle.importKey(
    "raw",
    encoder.encode(secret),
    { name: "HMAC", hash: "SHA-256" },
    false,
    ["sign"]
  );
  const expectedSignature = await crypto.subtle.sign("HMAC", key, encoder.encode(signatureBase));
  const expectedHex = Array.from(new Uint8Array(expectedSignature))
    .map((b) => b.toString(16).padStart(2, "0"))
    .join("");

  return signature === expectedHex;
}
