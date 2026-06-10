import "jsr:@supabase/functions-js/edge-runtime.d.ts";
import { createClient } from "jsr:@supabase/supabase-js@2";
import { getCorsHeaders, corsResponse, corsError } from "../_shared/cors.ts";
import { CreatePaymentApiSchema, PaginationSchema, validateSchema } from "../_shared/schemas.ts";
import { isUrlSafe } from "../_shared/urlValidation.ts";

interface ApiKey {
  id: string;
  key: string;
  name: string;
  user_id: string;
  rate_limit: number;
  monthly_api_calls: number;
  monthly_limit: number;
  is_active: boolean;
  locked_until: string | null;
  failed_attempts: number;
  created_at: string;
}

interface PricingTier {
  name: string;
  monthly_fee: number;
  api_calls_included: number;
  per_request_fee: number;
  rate_limit: number;
  features: string[];
}

const PRICING_TIERS: Record<string, PricingTier> = {
  free: {
    name: "Free",
    monthly_fee: 0,
    api_calls_included: 1000,
    per_request_fee: 0.001,
    rate_limit: 10,
    features: ["1000 API calls/mo", "Basic support", "Testnet only"],
  },
  pro: {
    name: "Pro",
    monthly_fee: 99,
    api_calls_included: 100000,
    per_request_fee: 0.0005,
    rate_limit: 100,
    features: ["100K API calls/mo", "Priority support", "Mainnet + Testnet", "Webhooks"],
  },
  enterprise: {
    name: "Enterprise",
    monthly_fee: 0,
    api_calls_included: -1,
    per_request_fee: 0.0003,
    rate_limit: 1000,
    features: ["Unlimited calls", "Dedicated support", "Custom chains", "SLA", "Account manager"],
  },
};

function calculateFee(tier: string, requestCount: number): { fee: number; currency: string } {
  const tierData = PRICING_TIERS[tier] || PRICING_TIERS.free;
  
  if (tier === "enterprise") {
    return { fee: 0, currency: "USD" };
  }
  
  if (requestCount <= tierData.api_calls_included) {
    return { fee: 0, currency: "USD" };
  }
  
  const overage = requestCount - tierData.api_calls_included;
  return { fee: overage * tierData.per_request_fee, currency: "USD" };
}

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: getCorsHeaders() });
  }

  try {
    const supabaseClient = createClient(
      Deno.env.get("SUPABASE_URL") ?? "",
      Deno.env.get("SUPABASE_ANON_KEY") ?? "",
    );

    const apiKey = req.headers.get("x-api-key");
    const path = new URL(req.url).pathname.replace("/public-api", "") || "/";
    const method = req.method;

    if (!apiKey) {
      return new Response(
        JSON.stringify({ 
          error: "API key required", 
          message: "Include your API key in the X-API-Key header",
          example: { "X-API-Key": "pk_live_xxxxxxxxxxxxx" }
        }),
        { status: 401, headers: { ...getCorsHeaders(), "Content-Type": "application/json" } }
      );
    }

    const { data: apiKeyData, error: keyError } = await supabaseClient
      .from("api_keys")
      .select("*")
      .eq("key", apiKey)
      .eq("is_active", true)
      .single();

    if (keyError || !apiKeyData) {
      return new Response(
        JSON.stringify({ 
          error: "Invalid API key", 
          message: "The provided API key is invalid or has been revoked"
        }),
        { status: 401, headers: { ...getCorsHeaders(), "Content-Type": "application/json" } }
      );
    }

    const keyRecord = apiKeyData as unknown as ApiKey;
    
    // Check if API key is locked out
    if (keyRecord.locked_until && new Date(keyRecord.locked_until) > new Date()) {
      return new Response(
        JSON.stringify({ 
          error: "API key locked", 
          message: "Too many failed attempts. Please try again later or contact support",
          locked_until: keyRecord.locked_until
        }),
        { status: 403, headers: { ...getCorsHeaders(), "Content-Type": "application/json" } }
      );
    }

    // Reset failed attempts if last failure was more than 30 minutes ago
    if (keyRecord.failed_attempts && keyRecord.failed_attempts > 0) {
      const lastAttempt = keyRecord.failed_attempts;
      if (lastAttempt >= 5) {
        // Lock the account for 30 minutes
        const lockUntil = new Date();
        lockUntil.setMinutes(lockUntil.getMinutes() + 30);
        await supabaseClient
          .from("api_keys")
          .update({ 
            failed_attempts: 0,
            locked_until: lockUntil.toISOString()
          })
          .eq("id", keyRecord.id);
        return new Response(
          JSON.stringify({ 
            error: "API key locked", 
            message: "Too many failed attempts. Account locked for 30 minutes.",
            locked_until: lockUntil.toISOString()
          }),
          { status: 403, headers: { ...getCorsHeaders(), "Content-Type": "application/json" } }
        );
      }
    }

    const now = new Date();
    const currentMonth = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, "0")}`;

    if (keyRecord.monthly_limit > 0 && keyRecord.monthly_api_calls >= keyRecord.monthly_limit) {
      return new Response(
        JSON.stringify({ 
          error: "Rate limit exceeded", 
          message: `Monthly API limit of ${keyRecord.monthly_limit} calls reached. Upgrade your plan at https://peys.io/dashboard`,
          tier: "free",
          upgrade: "https://peys.io/dashboard"
        }),
        { status: 429, headers: { ...getCorsHeaders(), "Content-Type": "application/json", "Retry-After": "3600" } }
      );
    }

    await supabaseClient.rpc("increment_api_call", {
      p_api_key_id: keyRecord.id,
      p_month: currentMonth,
    });

    let response: unknown;
    let status = 200;

    switch (true) {
      case path === "/health" && method === "GET":
        response = {
          status: "healthy",
          timestamp: new Date().toISOString(),
          version: "1.0.0",
          tiers: Object.keys(PRICING_TIERS),
        };
        break;

      case path === "/v1/payments" && method === "POST":
        response = await handleCreatePayment(req, supabaseClient, keyRecord);
        break;

      case path.match(/^\/v1\/payments\/[\w-]+$/) && method === "GET":
        const paymentId = path.split("/").pop();
        response = await handleGetPayment(paymentId!, supabaseClient);
        break;

      case path === "/v1/payments" && method === "GET":
        response = await handleListPayments(req, supabaseClient, keyRecord);
        break;

      case path.match(/^\/v1\/payments\/[\w-]+\/claim$/) && method === "POST":
        const claimPaymentId = path.split("/")[2];
        response = await handleClaimPayment(claimPaymentId, req, supabaseClient, keyRecord);
        break;

      case path.match(/^\/v1\/payments\/[\w-]+\/refund$/) && method === "POST":
        const refundPaymentId = path.split("/")[2];
        response = await handleRefundPayment(refundPaymentId, req, supabaseClient, keyRecord);
        break;

      case path === "/v1/webhooks" && method === "POST":
        response = await handleCreateWebhook(req, supabaseClient, keyRecord);
        break;

      case path === "/v1/webhooks" && method === "GET":
        response = await handleListWebhooks(supabaseClient, keyRecord);
        break;

      case path.match(/^\/v1\/webhooks\/[\w-]+$/) && method === "DELETE":
        const webhookId = path.split("/").pop();
        response = await handleDeleteWebhook(webhookId!, supabaseClient, keyRecord);
        break;

      case path === "/v1/pricing" && method === "GET":
        response = {
          tiers: PRICING_TIERS,
          currency: "USD",
          period: "monthly",
        };
        break;

      case path === "/v1/usage" && method === "GET":
        response = await handleGetUsage(supabaseClient, keyRecord, currentMonth);
        break;

      case path === "/v1/account" && method === "GET":
        response = await handleGetAccount(supabaseClient, keyRecord);
        break;

      default:
        status = 404;
        response = {
          error: "Not found",
          message: `Endpoint ${method} ${path} not found`,
          available_endpoints: [
            "GET  /health",
            "GET  /v1/pricing",
            "GET  /v1/usage",
            "GET  /v1/account",
            "GET  /v1/payments",
            "POST /v1/payments",
            "GET  /v1/payments/:id",
            "POST /v1/payments/:id/claim",
            "POST /v1/payments/:id/refund",
            "GET  /v1/webhooks",
            "POST /v1/webhooks",
            "DELETE /v1/webhooks/:id",
          ],
        };
    }

    return new Response(JSON.stringify(response), {
      status,
      headers: { ...getCorsHeaders(), "Content-Type": "application/json" },
    });
  } catch (error) {
    console.error("API Error:", error instanceof Error ? error.message : "Unknown error");
    return new Response(
      JSON.stringify({ error: "Internal server error" }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});

async function handleCreatePayment(req: Request, supabaseClient: unknown, apiKey: ApiKey) {
  const body = await req.json();

  const validation = validateSchema(CreatePaymentApiSchema, body);
  if (!validation.success) {
    return { 
      error: "Invalid request data",
      details: validation.errors.flatten().fieldErrors 
    };
  }

  const { recipient, amount, token, memo, expiresIn } = validation.data;

  const paymentId = `PAY-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
  const claimLink = crypto.randomUUID();
  const claimSecret = crypto.randomUUID();
  const expiresAt = new Date();
  expiresAt.setDate(expiresAt.getDate() + (expiresIn || 7));

  const { data, error } = await supabaseClient
    .from("payments")
    .insert({
      payment_id: paymentId,
      sender_user_id: apiKey.user_id,
      sender_email: "",
      recipient_email: recipient,
      amount,
      token,
      memo,
      claim_link: claimLink,
      claim_secret: claimSecret,
      expires_at: expiresAt.toISOString(),
      status: "pending",
      api_key_id: apiKey.id,
    })
    .select()
    .single();

  if (error) throw error;

  return {
    id: data.id,
    paymentId: data.payment_id,
    amount: data.amount,
    token: data.token,
    status: data.status,
    expiresAt: data.expires_at,
    claimLink: `${Deno.env.get("APP_URL") || "https://peys.io"}/claim/${data.claim_link}`,
    createdAt: data.created_at,
  };
}

async function handleGetPayment(paymentId: string, supabaseClient: unknown) {
  const { data, error } = await supabaseClient
    .from("payments")
    .select("*")
    .eq("payment_id", paymentId)
    .single();

  if (error || !data) {
    return { error: "Payment not found" };
  }

  return {
    id: data.payment_id,
    amount: data.amount,
    token: data.token,
    status: data.status,
    memo: data.memo,
    expiresAt: data.expires_at,
    createdAt: data.created_at,
    claimedAt: data.claimed_at,
    refundedAt: data.refunded_at,
  };
}

async function handleListPayments(req: Request, supabaseClient: unknown, apiKey: ApiKey) {
  const url = new URL(req.url);
  
  const paginationValidation = validateSchema(PaginationSchema, {
    limit: url.searchParams.get("limit"),
    offset: url.searchParams.get("offset"),
    status: url.searchParams.get("status"),
  });
  
  const { limit, offset, status } = paginationValidation.success 
    ? paginationValidation.data 
    : { limit: 10, offset: 0, status: undefined };

  let query = supabaseClient
    .from("payments")
    .select("*", { count: "exact" })
    .eq("api_key_id", apiKey.id)
    .order("created_at", { ascending: false })
    .range(offset, offset + limit - 1);

  if (status) {
    query = query.eq("status", status);
  }

  const { data, count, error } = await query;

  if (error) throw error;

  return {
    data: data?.map(p => ({
      id: p.payment_id,
      amount: p.amount,
      token: p.token,
      status: p.status,
      expiresAt: p.expires_at,
      createdAt: p.created_at,
    })) || [],
    pagination: {
      total: count || 0,
      limit,
      offset,
      hasMore: (offset + limit) < (count || 0),
    },
  };
}

async function handleClaimPayment(paymentId: string, req: Request, supabaseClient: unknown, apiKey: ApiKey) {
  const body = await req.json();
  const { recipientWallet, secret } = body;

  const { data: payment, error: paymentError } = await supabaseClient
    .from("payments")
    .select("*")
    .eq("payment_id", paymentId)
    .single();

  if (paymentError || !payment) {
    return { error: "Payment not found" };
  }

  if (payment.api_key_id !== apiKey.id) {
    return { error: "Not authorized to claim this payment" };
  }

  if (payment.status !== "pending") {
    return { error: `Payment is already ${payment.status}` };
  }

  if (new Date(payment.expires_at) < new Date()) {
    return { error: "Payment has expired" };
  }

  if (secret && payment.claim_secret && secret !== payment.claim_secret) {
    return { error: "Invalid claim secret" };
  }

  const { data, error } = await supabaseClient
    .from("payments")
    .update({ 
      status: "claimed", 
      claimed_at: new Date().toISOString(),
      recipient_wallet: recipientWallet,
    })
    .eq("payment_id", paymentId)
    .eq("status", "pending")
    .select()
    .single();

  if (error) throw error;

  return {
    success: true,
    paymentId: data.payment_id,
    claimedAt: data.claimed_at,
  };
}

async function handleRefundPayment(paymentId: string, req: Request, supabaseClient: unknown, apiKey: ApiKey) {
  const { data: payment, error: paymentError } = await supabaseClient
    .from("payments")
    .select("*")
    .eq("payment_id", paymentId)
    .single();

  if (paymentError || !payment) {
    return { error: "Payment not found" };
  }

  if (payment.api_key_id !== apiKey.id) {
    return { error: "Not authorized to refund this payment" };
  }

  if (payment.status !== "pending") {
    return { error: `Cannot refund payment with status ${payment.status}` };
  }

  if (new Date(payment.expires_at) > new Date()) {
    return { error: "Payment has not expired yet" };
  }

  const { data, error } = await supabaseClient
    .from("payments")
    .update({ 
      status: "refunded", 
      refunded_at: new Date().toISOString(),
    })
    .eq("payment_id", paymentId)
    .eq("status", "pending")
    .select()
    .single();

  if (error) throw error;

  return {
    success: true,
    paymentId: data.payment_id,
    refundedAt: data.refunded_at,
  };
}

async function handleCreateWebhook(req: Request, supabaseClient: unknown, apiKey: ApiKey) {
  const body = await req.json();
  const { url, events, secret } = body;

  if (!url) {
    return { error: "Missing required field: url" };
  }

  const urlValidation = isUrlSafe(url);
  if (!urlValidation.valid) {
    return { error: urlValidation.error };
  }

  const { data, error } = await supabaseClient
    .from("webhooks")
    .insert({
      user_id: apiKey.user_id,
      url,
      events: events || ["payment.created", "payment.claimed", "payment.expired"],
      secret: secret || crypto.randomUUID(),
      is_active: true,
    })
    .select()
    .single();

  if (error) throw error;

  return {
    id: data.id,
    url: data.url,
    events: data.events,
    createdAt: data.created_at,
  };
}

async function handleListWebhooks(supabaseClient: unknown, apiKey: ApiKey) {
  const { data, error } = await supabaseClient
    .from("webhooks")
    .select("*")
    .eq("user_id", apiKey.user_id);

  if (error) throw error;

  return {
    data: data?.map(w => ({
      id: w.id,
      url: w.url,
      events: w.events,
      isActive: w.is_active,
      createdAt: w.created_at,
    })) || [],
  };
}

async function handleDeleteWebhook(webhookId: string, supabaseClient: unknown, apiKey: ApiKey) {
  const { data: webhook, error: fetchError } = await supabaseClient
    .from("webhooks")
    .select("user_id")
    .eq("id", webhookId)
    .single();

  if (fetchError || !webhook) {
    throw new Error("Webhook not found");
  }

  if (webhook.user_id !== apiKey.user_id) {
    throw new Error("Unauthorized: You do not own this webhook");
  }

  const { error } = await supabaseClient
    .from("webhooks")
    .delete()
    .eq("id", webhookId);

  if (error) throw error;

  return { success: true, message: "Webhook deleted" };
}

async function handleGetUsage(supabaseClient: unknown, apiKey: ApiKey, month: string) {
  const { data, error } = await supabaseClient
    .from("api_key_usage")
    .select("*")
    .eq("api_key_id", apiKey.id)
    .eq("month", month)
    .single();

  if (error || !data) {
    return { month, apiCalls: 0, limit: apiKey.monthly_limit };
  }

  return {
    month,
    apiCalls: data.api_calls,
    limit: apiKey.monthly_limit,
    remaining: Math.max(0, apiKey.monthly_limit - data.api_calls),
  };
}

async function handleGetAccount(supabaseClient: unknown, apiKey: ApiKey) {
  const { data: profile } = await supabaseClient
    .from("profiles")
    .select("*")
    .eq("user_id", apiKey.user_id)
    .single();

  return {
    apiKeyId: apiKey.id,
    apiKeyName: apiKey.name,
    tier: apiKey.monthly_limit === 0 ? "free" : apiKey.monthly_limit >= 100000 ? "pro" : "enterprise",
    monthlyLimit: apiKey.monthly_limit,
    email: profile?.email,
    createdAt: apiKey.created_at,
  };
}
