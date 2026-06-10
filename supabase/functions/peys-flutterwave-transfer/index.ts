import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const FLUTTERWAVE_API_BASE = "https://api.flutterwave.com/v3";

function getCorsHeaders() {
  const allowedOrigins = Deno.env.get("ALLOWED_ORIGINS") || "*";
  
  const headers: Record<string, string> = {
    "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
    "Access-Control-Allow-Methods": "GET, POST, PUT, DELETE, OPTIONS",
  };

  if (allowedOrigins === "*") {
    headers["Access-Control-Allow-Origin"] = "*";
  } else {
    headers["Access-Control-Allow-Origin"] = allowedOrigins;
    headers["Vary"] = "Origin";
  }

  return headers;
}

interface TransferRequest {
  withdrawalId: string;
  amount: number;
  currency: string;
  bankCode: string;
  accountNumber: string;
  accountName: string;
  narration?: string;
}

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: getCorsHeaders() });
  }

  try {
    const supabaseUrl = Deno.env.get("SUPABASE_URL") ?? "";
    
    const authHeader = req.headers.get("Authorization");
    if (!authHeader) {
      return new Response(JSON.stringify({ error: "No authorization header" }), {
        status: 401,
        headers: { ...getCorsHeaders(), "Content-Type": "application/json" },
      });
    }

    const supabaseClient = createClient(
      supabaseUrl,
      Deno.env.get("SUPABASE_ANON_KEY") ?? "",
      {
        global: {
          headers: { Authorization: authHeader },
        },
      }
    );

    const { data: userData, error: userError } = await supabaseClient.auth.getUser(
      authHeader.replace("Bearer ", "")
    );

    if (userError || !userData.user) {
      return new Response(JSON.stringify({ error: "Invalid user" }), {
        status: 401,
        headers: { ...getCorsHeaders(), "Content-Type": "application/json" },
      });
    }

    const body: TransferRequest = await req.json();
    const { withdrawalId, amount, currency, bankCode, accountNumber, accountName, narration } = body;

    if (!withdrawalId || !amount || !currency || !bankCode || !accountNumber || !accountName) {
      return new Response(JSON.stringify({ error: "Missing required fields" }), {
        status: 400,
        headers: { ...getCorsHeaders(), "Content-Type": "application/json" },
      });
    }

    const { data: withdrawal, error: withdrawalError } = await supabaseClient
      .from("fiat_withdrawals")
      .select("*")
      .eq("id", withdrawalId)
      .single();

    if (withdrawalError || !withdrawal) {
      return new Response(JSON.stringify({ error: "Withdrawal not found" }), {
        status: 404,
        headers: { ...getCorsHeaders(), "Content-Type": "application/json" },
      });
    }

    if (withdrawal.user_id !== userData.user.id) {
      return new Response(JSON.stringify({ error: "Not authorized to process this withdrawal" }), {
        status: 403,
        headers: { ...getCorsHeaders(), "Content-Type": "application/json" },
      });
    }

    if (withdrawal.status !== "pending") {
      return new Response(JSON.stringify({ error: "Withdrawal already processed" }), {
        status: 400,
        headers: { ...getCorsHeaders(), "Content-Type": "application/json" },
      });
    }

    const flutterwaveSecret = Deno.env.get("FLUTTERWAVE_SECRET_KEY");
    if (!flutterwaveSecret) {
      return new Response(JSON.stringify({ error: "Flutterwave not configured" }), {
        status: 500,
        headers: { ...getCorsHeaders(), "Content-Type": "application/json" },
      });
    }

    const serviceRoleClient = createClient(
      supabaseUrl,
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? "",
      { auth: { persistSession: false } }
    );

    const response = await fetch(`${FLUTTERWAVE_API_BASE}/transfers`, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${flutterwaveSecret}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        account_bank: bankCode,
        account_number: accountNumber,
        amount,
        currency,
        account_name: accountName,
        narration: narration || "Peydot Withdrawal",
        debit_currency: currency,
        callback_url: `${Deno.env.get("SUPABASE_URL")}/functions/v1/flutterwave-transfer-webhook`,
        reference: `peydot_${withdrawalId}_${Date.now()}`,
      }),
    });

    const data = await response.json();

    if (data.status === "success") {
      await serviceRoleClient
        .from("fiat_withdrawals")
        .update({
          status: "processing",
          flutterwave_reference: data.data.id.toString(),
          processed_at: new Date().toISOString(),
        })
        .eq("id", withdrawalId);

      return new Response(
        JSON.stringify({
          success: true,
          reference: data.data.id,
          status: data.data.status,
        }),
        {
          headers: { ...getCorsHeaders(), "Content-Type": "application/json" },
        }
      );
    }

    await serviceRoleClient
      .from("fiat_withdrawals")
      .update({
        status: "failed",
        failure_reason: data.message,
      })
      .eq("id", withdrawalId);

    return new Response(
      JSON.stringify({
        success: false,
        error: data.message || "Transfer failed",
      }),
      {
        status: 400,
        headers: { ...getCorsHeaders(), "Content-Type": "application/json" },
      }
    );
  } catch (error) {
    console.error("Transfer error:", error);
    return new Response(JSON.stringify({ error: "Internal server error" }), {
      status: 500,
      headers: { ...getCorsHeaders(), "Content-Type": "application/json" },
    });
  }
});
