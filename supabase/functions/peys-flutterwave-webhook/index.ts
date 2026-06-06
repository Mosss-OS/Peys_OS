import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";
import { z } from "https://deno.land/x/zod@v3.22.4/mod.ts";
import { verifyHmacSignature } from "../_shared/crypto.ts";

const FlutterwaveWebhookSchema = z.object({
  event: z.string(),
  data: z.object({
    amount: z.number().positive(),
    currency: z.string(),
    tx_ref: z.string().optional(),
    id: z.string().optional(),
    virtual_account_number: z.string().optional(),
    account_number: z.string().optional(),
  }).passthrough(),
});

function getCorsHeaders() {
  const allowedOrigins = Deno.env.get("ALLOWED_ORIGINS") || "*";
  
  const headers: Record<string, string> = {
    "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type, webhook-verification-hash",
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

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: getCorsHeaders() });
  }

  try {
    const supabaseClient = createClient(
      Deno.env.get("SUPABASE_URL") ?? "",
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? "",
      { auth: { persistSession: false } }
    );

    const secretHash = Deno.env.get("FLUTTERWAVE_WEBHOOK_SECRET");
    const signature = req.headers.get("verif-hash");
    const rawBody = await req.text();
    
    if (secretHash) {
      if (!signature) {
        return new Response(JSON.stringify({ error: "Missing signature" }), {
          status: 401,
          headers: { ...getCorsHeaders(), "Content-Type": "application/json" },
        });
      }
      
      const isValid = await verifyHmacSignature(rawBody, signature, secretHash);
      if (!isValid) {
        return new Response(JSON.stringify({ error: "Invalid signature" }), {
          status: 401,
          headers: { ...getCorsHeaders(), "Content-Type": "application/json" },
        });
      }
    }
    
    const body = JSON.parse(rawBody);
    
    const validation = FlutterwaveWebhookSchema.safeParse(body);
    if (!validation.success) {
      return new Response(JSON.stringify({ error: "Invalid webhook payload" }), {
        status: 400,
        headers: { ...getCorsHeaders(), "Content-Type": "application/json" },
      });
    }
    
    const validatedBody = validation.data;
    
    if (validatedBody.event === "charge.completed" || validatedBody.event === "virtual_account_tx.completed") {
      const webhookData = validatedBody.data;
      
      const accountNumber = webhookData.virtual_account_number || webhookData.account_number;
      const amount = webhookData.amount;
      const currency = webhookData.currency;
      const txRef = webhookData.tx_ref || webhookData.id;
      
      const { data: vaData, error: vaError } = await supabaseClient
        .from("virtual_accounts")
        .select("user_id, currency")
        .eq("account_number", accountNumber)
        .single();

      if (vaData && !vaError) {
        const { data: profile } = await supabaseClient
          .from("profiles")
          .select("email")
          .eq("user_id", vaData.user_id)
          .single();

        await supabaseClient.from("fiat_deposits").insert({
          user_id: vaData.user_id,
          amount: amount,
          currency: currency,
          reference: txRef,
          source: "virtual_account",
          account_number: accountNumber,
          status: "completed",
          metadata: webhookData,
        });

        await supabaseClient.from("notifications").insert({
          user_id: vaData.user_id,
          type: "deposit_received",
          title: "💰 Fiat Deposit Received!",
          message: `You received ${currency} ${amount.toLocaleString()} via bank transfer.`,
        });

        await supabaseClient.from("transactions").insert({
          profile_id: vaData.user_id,
          type: "deposit",
          amount: amount,
          currency: currency,
          status: "completed",
          description: `Fiat deposit via virtual account`,
          tx_hash: txRef,
          metadata: {
            source: "flutterwave",
            account_number: accountNumber,
          },
        });
      }
    }

    return new Response(JSON.stringify({ status: "received" }), {
      headers: { ...getCorsHeaders(), "Content-Type": "application/json" },
    });
  } catch (error) {
    console.error("Webhook error:", error instanceof Error ? error.message : "Unknown error");
    return new Response(JSON.stringify({ error: "Internal server error" }), {
      status: 500,
      headers: { ...getCorsHeaders(), "Content-Type": "application/json" },
    });
  }
});
