import "jsr:@supabase/functions-js/edge-runtime.d.ts";
import { createClient } from "jsr:@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": Deno.env.get("ALLOWED_ORIGINS") || "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
};

interface WebhookRegistration {
  url: string;
  events?: string[];
  secret?: string;
  organization_id?: string;
}

// SSRF Protection: Check if URL points to private/local IP
function isPrivateUrl(url: string): boolean {
  try {
    const parsed = new URL(url);

    // Block non-http(s) schemes
    if (!["http:", "https:"].includes(parsed.protocol)) {
      return true;
    }

    const hostname = parsed.hostname.toLowerCase();

    // Block localhost
    if (hostname === "localhost" || hostname === "127.0.0.1" || hostname === "::1" || hostname === "0.0.0.0") {
      return true;
    }

    // Block private IP ranges (IPv4)
    const ipv4Match = hostname.match(/^(\d{1,3})\.(\d{1,3})\.(\d{1,3})\.(\d{1,3})$/);
    if (ipv4Match) {
      const [, a, b, c, d] = ipv4Match.map(Number);
      // 10.0.0.0/8
      if (a === 10) return true;
      // 172.16.0.0/12
      if (a === 172 && b >= 16 && b <= 31) return true;
      // 192.168.0.0/16
      if (a === 192 && b === 168) return true;
      // 127.0.0.0/8
      if (a === 127) return true;
      // 0.0.0.0/8
      if (a === 0) return true;
      // 169.254.0.0/16 (link-local)
      if (a === 169 && b === 254) return true;
    }

    // Block internal/private hostnames
    if (hostname.endsWith(".local") || hostname.endsWith(".internal") || hostname.endsWith(".localhost")) {
      return true;
    }

    return false;
  } catch {
    return true; // Block invalid URLs
  }
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
    // Use ANON_KEY with RLS instead of SERVICE_ROLE_KEY for user authentication
    const authHeader = req.headers.get("Authorization");

    const supabaseClient = createClient(
      Deno.env.get("SUPABASE_URL") ?? "",
      Deno.env.get("SUPABASE_ANON_KEY") ?? "",
      {
        global: {
          headers: authHeader ? { Authorization: authHeader } : {},
        },
      }
    );

    // Get authenticated user via RLS-protected client
    if (!authHeader) {
      return new Response(
        JSON.stringify({ error: "Unauthorized" }),
        { status: 401, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const { data: { user }, error: authError } = await supabaseClient.auth.getUser();

    if (authError || !user) {
      return new Response(
        JSON.stringify({ error: "Invalid authentication" }),
        { status: 401, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const body: WebhookRegistration = await req.json();

    // Validate URL - SSRF protection
    if (!body.url) {
      return new Response(
        JSON.stringify({ error: "URL is required" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    if (isPrivateUrl(body.url)) {
      return new Response(
        JSON.stringify({ error: "Invalid URL: private/internal URLs are not allowed" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Generate secret if not provided
    const secret = body.secret || crypto.randomUUID();

    // Create webhook
    const { data: webhook, error } = await supabaseClient
      .from("webhooks")
      .insert({
        user_id: user.id,
        organization_id: body.organization_id || null,
        url: body.url,
        events: body.events || [
          "payment.created",
          "payment.claimed",
          "payment.expired",
          "payment.refunded",
        ],
        secret: secret,
        is_active: true,
      })
      .select()
      .single();

    if (error) {
      console.error("Error creating webhook:", error);
      return new Response(
        JSON.stringify({ error: "Failed to create webhook" }),
        { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    return new Response(
      JSON.stringify({
        success: true,
        webhook: {
          id: webhook.id,
          url: webhook.url,
          events: webhook.events,
          secret: webhook.secret,
          is_active: webhook.is_active,
          created_at: webhook.created_at,
        },
      }),
      { status: 201, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  } catch (error) {
    console.error("Error in webhook registration:", error);
    return new Response(
      JSON.stringify({ error: "An unexpected error occurred. Please try again." }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
