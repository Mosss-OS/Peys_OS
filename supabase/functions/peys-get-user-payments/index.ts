import "jsr:@supabase/functions-js/edge-runtime.d.ts";
import { createClient } from "jsr:@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": Deno.env.get("ALLOWED_ORIGINS") || "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
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

    // Get authenticated user
    const {
      data: { user },
      error: authError,
    } = await supabaseClient.auth.getUser();

    if (authError || !user) {
      return new Response(
        JSON.stringify({ error: "Unauthorized" }),
        {
          status: 401,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        }
      );
    }

    // Get user's email from profile
    const { data: profile } = await supabaseClient
      .from("profiles")
      .select("email")
      .eq("user_id", user.id)
      .single();

    const userEmail = profile?.email || user.email || "";

    // Get sent payments
    const { data: sentPayments, error: sentError } = await supabaseClient
      .from("payments")
      .select("*")
      .eq("sender_user_id", user.id)
      .order("created_at", { ascending: false });

    if (sentError) {
      console.error("Error fetching sent payments:", sentError);
    }

    // Get received payments (claimed by this user)
    const { data: receivedPayments, error: receivedError } = await supabaseClient
      .from("payments")
      .select("*")
      .eq("claimed_by_user_id", user.id)
      .order("created_at", { ascending: false });

    if (receivedError) {
      console.error("Error fetching received payments:", receivedError);
    }

    // Get pending payments sent to user's email (not yet claimed)
    const { data: pendingPayments, error: pendingError } = await supabaseClient
      .from("payments")
      .select("*")
      .eq("recipient_email", userEmail)
      .eq("status", "pending")
      .order("created_at", { ascending: false });

    if (pendingError) {
      console.error("Error fetching pending payments:", pendingError);
    }

    return new Response(
      JSON.stringify({
        sent: sentPayments || [],
        received: receivedPayments || [],
        pending: pendingPayments || [],
      }),
      {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      }
    );
  } catch (error) {
    console.error("Error fetching user payments:", error);
    return new Response(
      JSON.stringify({ error: "An unexpected error occurred. Please try again." }),
      {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      }
    );
  }
});
