import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const FLUTTERWAVE_API_BASE = "https://api.flutterwave.com/v3";
const SANDBOX_API_BASE = "https://developersandbox-api.flutterwave.com/v3";

const corsHeaders = {
  "Access-Control-Allow-Origin": Deno.env.get("ALLOWED_ORIGINS") || "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

interface CreateVARequest {
  userId: string;
  email: string;
  firstName: string;
  lastName: string;
  phone: string;
  currency?: string;
}

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }

  try {
    const supabaseClient = createClient(
      Deno.env.get("SUPABASE_URL") ?? "",
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? "",
      { auth: { persistSession: false } }
    );

    const authHeader = req.headers.get("Authorization");
    if (!authHeader) {
      return new Response(JSON.stringify({ error: "No authorization header" }), {
        status: 401,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const { data: userData, error: userError } = await supabaseClient.auth.getUser(
      authHeader.replace("Bearer ", "")
    );

    if (userError || !userData.user) {
      return new Response(JSON.stringify({ error: "Invalid user" }), {
        status: 401,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const body: CreateVARequest = await req.json();
    const { email, firstName, lastName, phone, currency } = body;

    const isSandbox = Deno.env.get("FLUTTERWAVE_ENVIRONMENT") !== "live";
    const baseUrl = isSandbox ? SANDBOX_API_BASE : FLUTTERWAVE_API_BASE;
    const secretKey = Deno.env.get("FLUTTERWAVE_SECRET_KEY");

    if (!secretKey) {
      return new Response(JSON.stringify({ error: "Flutterwave not configured" }), {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const response = await fetch(`${baseUrl}/virtual-account-numbers`, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${secretKey}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        email,
        first_name: firstName,
        last_name: lastName,
        phone,
        currency: currency || "NGN",
        is_permanent: true,
        narration: `Peydot-${userData.user.id.slice(0, 8)}`,
      }),
    });

    const data = await response.json();

    if (data.status === "success") {
      const vaData = {
        user_id: userData.user.id,
        flutterwave_ref: data.data.flw_ref,
        account_number: data.data.account_number,
        bank_name: data.data.bank_name,
        frequency: data.data.frequency,
        status: "active",
        currency: currency || "NGN",
        created_at: new Date().toISOString(),
      };

      await supabaseClient.from("virtual_accounts").insert(vaData);

      return new Response(
        JSON.stringify({
          success: true,
          account_number: data.data.account_number,
          bank_name: data.data.bank_name,
          reference: data.data.flw_ref,
          frequency: data.data.frequency,
        }),
        {
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        }
      );
    }

    return new Response(
      JSON.stringify({
        success: false,
        error: data.message || "Failed to create virtual account",
      }),
      {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      }
    );
  } catch (error) {
    console.error("Virtual account error:", error);
    return new Response(JSON.stringify({ error: "Internal server error" }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
