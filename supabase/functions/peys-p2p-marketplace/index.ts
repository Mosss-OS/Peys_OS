import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";
import { parseSafeInt, parseSafeFloat } from "../_shared/schemas.ts";

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

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: getCorsHeaders() });
  }

  try {
    // Use ANON_KEY with RLS instead of SERVICE_ROLE_KEY for security
    const authHeader = req.headers.get("Authorization");

    const supabaseClient = createClient(
      Deno.env.get("SUPABASE_URL") ?? "",
      Deno.env.get("SUPABASE_ANON_KEY") ?? "",
      {
        auth: { persistSession: false },
        global: {
          headers: authHeader ? { Authorization: authHeader } : {},
        },
      }
    );

    const url = new URL(req.url);
    const action = url.pathname.split("/").pop();

    switch (action) {
      case "orders":
        return handleOrders(req, supabaseClient);
      case "match":
        return handleMatch(req, supabaseClient);
      case "complete":
        return handleComplete(req, supabaseClient);
      case "dispute":
        return handleDispute(req, supabaseClient);
      default:
        return new Response(JSON.stringify({ error: "Unknown action" }), {
          status: 400,
          headers: { ...getCorsHeaders(), "Content-Type": "application/json" },
        });
    }
  } catch (error) {
    console.error("P2P marketplace error:", error);
    return new Response(JSON.stringify({ error: "Internal server error" }), {
      status: 500,
      headers: { ...getCorsHeaders(), "Content-Type": "application/json" },
    });
  }
});

async function handleOrders(req: Request, supabaseClient: any) {
  const url = new URL(req.url);
  const type = url.searchParams.get("type");
  const currency = url.searchParams.get("currency");
  const limit = parseSafeInt(url.searchParams.get("limit"), 20, 1, 100);

  let query = supabaseClient
    .from("p2p_orders")
    .select(`
      *,
      creator:auth.users!created_by(id, email, metadata)
    `)
    .eq("status", "open");

  if (type) query = query.eq("type", type);
  if (currency) query = query.eq("currency", currency);

  query = query.order("price_per_usdc", { 
    ascending: type === "buy" ? false : true 
  }).limit(limit);

  const { data, error } = await query;

  if (error) {
    return new Response(JSON.stringify({ error: "An unexpected error occurred. Please try again." }), {
      status: 500,
      headers: { ...getCorsHeaders(), "Content-Type": "application/json" },
    });
  }

  const ordersWithRating = await Promise.all(
    (data || []).map(async (order: any) => {
      const { data: ratingData } = await supabaseClient.rpc("get_user_p2p_rating", {
        user_uuid: order.created_by,
      });
      return {
        ...order,
        creator_rating: ratingData || 0,
        creator: order.creator ? {
          id: order.creator.id,
          email: order.creator.email,
        } : null,
      };
    })
  );

  return new Response(
    JSON.stringify({ success: true, orders: ordersWithRating }),
    {
      headers: { ...getCorsHeaders(), "Content-Type": "application/json" },
    }
  );
}

async function handleMatch(req: Request, supabaseClient: any) {
  const authHeader = req.headers.get("Authorization");
  if (!authHeader) {
    return new Response(JSON.stringify({ error: "No authorization" }), {
      status: 401,
      headers: { ...getCorsHeaders(), "Content-Type": "application/json" },
    });
  }

  const { data: userData } = await supabaseClient.auth.getUser(
    authHeader.replace("Bearer ", "")
  );

  if (!userData.user) {
    return new Response(JSON.stringify({ error: "Invalid user" }), {
      status: 401,
      headers: { ...getCorsHeaders(), "Content-Type": "application/json" },
    });
  }

  const { orderId, amountUsdc, idempotencyKey } = await req.json();

  if (!orderId) {
    return new Response(JSON.stringify({ error: "Order ID is required" }), {
      status: 400,
      headers: { ...getCorsHeaders(), "Content-Type": "application/json" },
    });
  }

  if (idempotencyKey && !/^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(idempotencyKey)) {
    return new Response(JSON.stringify({ error: "Invalid idempotency key format" }), {
      status: 400,
      headers: { ...getCorsHeaders(), "Content-Type": "application/json" },
    });
  }

  const validatedAmount = amountUsdc ? parseSafeFloat(String(amountUsdc), 0, 0.01, 1000000) : null;

  const { data: result, error: rpcError } = await supabaseClient.rpc("match_p2p_order_with_lock", {
    p_order_id: orderId,
    p_matched_with: userData.user.id,
    p_amount_usdc: validatedAmount,
    p_idempotency_key: idempotencyKey || null,
  });

  if (rpcError) {
    return new Response(JSON.stringify({ error: "Failed to match order" }), {
      status: 500,
      headers: { ...getCorsHeaders(), "Content-Type": "application/json" },
    });
  }

  if (!result.success) {
    return new Response(JSON.stringify({ error: result.error }), {
      status: result.error === "Order not found" ? 404 : 400,
      headers: { ...getCorsHeaders(), "Content-Type": "application/json" },
    });
  }

  const order = result.order;

  if (order.status === "matched" && order.matched_with === userData.user.id && order.idempotency_key) {
    return new Response(
      JSON.stringify({
        success: true,
        message: result.message || "Order already matched with this user",
        order,
        idempotencyKey: order.idempotency_key,
      }),
      {
        status: 200,
        headers: { ...getCorsHeaders(), "Content-Type": "application/json" },
      }
    );
  }

  await supabaseClient.from("notifications").insert({
    user_id: order.created_by,
    type: "p2p_matched",
    title: "P2P Order Matched!",
    message: `Your ${order.type === "sell" ? "sell" : "buy"} order for ${order.amount_usdc} USDC has been matched. Please complete the transaction.`,
  });

  return new Response(
    JSON.stringify({
      success: true,
      message: "Order matched successfully",
      order,
      idempotencyKey: order.idempotency_key,
    }),
    {
      headers: { ...getCorsHeaders(), "Content-Type": "application/json" },
    }
  );
}

async function handleComplete(req: Request, supabaseClient: any) {
  const authHeader = req.headers.get("Authorization");
  if (!authHeader) {
    return new Response(JSON.stringify({ error: "No authorization" }), {
      status: 401,
      headers: { ...getCorsHeaders(), "Content-Type": "application/json" },
    });
  }

  const { data: userData } = await supabaseClient.auth.getUser(
    authHeader.replace("Bearer ", "")
  );

  if (!userData.user) {
    return new Response(JSON.stringify({ error: "Invalid user" }), {
      status: 401,
      headers: { ...getCorsHeaders(), "Content-Type": "application/json" },
    });
  }

  const { orderId, action } = await req.json();

  const { data: order, error: fetchError } = await supabaseClient
    .from("p2p_orders")
    .select("*")
    .eq("id", orderId)
    .single();

  if (fetchError || !order) {
    return new Response(JSON.stringify({ error: "Order not found" }), {
      status: 404,
      headers: { ...getCorsHeaders(), "Content-Type": "application/json" },
    });
  }

  if (order.created_by !== userData.user.id && order.matched_with !== userData.user.id) {
    return new Response(JSON.stringify({ error: "Not authorized" }), {
      status: 403,
      headers: { ...getCorsHeaders(), "Content-Type": "application/json" },
    });
  }

  if (action === "confirm") {
    await supabaseClient
      .from("p2p_orders")
      .update({
        status: "completed",
        completed_at: new Date().toISOString(),
      })
      .eq("id", orderId);

    const otherUserId = order.created_by === userData.user.id ? order.matched_with : order.created_by;

    await supabaseClient.from("notifications").insert({
      user_id: otherUserId,
      type: "p2p_completed",
      title: "P2P Transaction Completed!",
      message: `The P2P transaction for ${order.amount_usdc} USDC has been confirmed.`,
    });

    return new Response(
      JSON.stringify({ success: true, message: "Transaction completed" }),
      {
        headers: { ...getCorsHeaders(), "Content-Type": "application/json" },
      }
    );
  } else if (action === "cancel") {
    await supabaseClient
      .from("p2p_orders")
      .update({
        status: "cancelled",
      })
      .eq("id", orderId);

    return new Response(
      JSON.stringify({ success: true, message: "Transaction cancelled" }),
      {
        headers: { ...getCorsHeaders(), "Content-Type": "application/json" },
      }
    );
  }

  return new Response(JSON.stringify({ error: "Invalid action" }), {
    status: 400,
    headers: { ...getCorsHeaders(), "Content-Type": "application/json" },
  });
}

async function handleDispute(req: Request, supabaseClient: any) {
  const authHeader = req.headers.get("Authorization");
  if (!authHeader) {
    return new Response(JSON.stringify({ error: "No authorization" }), {
      status: 401,
      headers: { ...getCorsHeaders(), "Content-Type": "application/json" },
    });
  }

  const { data: userData } = await supabaseClient.auth.getUser(
    authHeader.replace("Bearer ", "")
  );

  if (!userData.user) {
    return new Response(JSON.stringify({ error: "Invalid user" }), {
      status: 401,
      headers: { ...getCorsHeaders(), "Content-Type": "application/json" },
    });
  }

  const { orderId, reason, evidence } = await req.json();

  if (!orderId) {
    return new Response(JSON.stringify({ error: "Order ID is required" }), {
      status: 400,
      headers: { ...getCorsHeaders(), "Content-Type": "application/json" },
    });
  }

  if (reason && reason.length > 500) {
    return new Response(JSON.stringify({ error: "Reason too long (max 500 characters)" }), {
      status: 400,
      headers: { ...getCorsHeaders(), "Content-Type": "application/json" },
    });
  }

  if (evidence && evidence.length > 2000) {
    return new Response(JSON.stringify({ error: "Evidence too long (max 2000 characters)" }), {
      status: 400,
      headers: { ...getCorsHeaders(), "Content-Type": "application/json" },
    });
  }

  const { data: order, error: fetchError } = await supabaseClient
    .from("p2p_orders")
    .select("*")
    .eq("id", orderId)
    .single();

  if (fetchError || !order) {
    return new Response(JSON.stringify({ error: "Order not found" }), {
      status: 404,
      headers: { ...getCorsHeaders(), "Content-Type": "application/json" },
    });
  }

  if (order.created_by !== userData.user.id && order.matched_with !== userData.user.id) {
    return new Response(JSON.stringify({ error: "Not authorized" }), {
      status: 403,
      headers: { ...getCorsHeaders(), "Content-Type": "application/json" },
    });
  }

  const { error: disputeError } = await supabaseClient
    .from("p2p_disputes")
    .insert({
      order_id: orderId,
      raised_by: userData.user.id,
      reason,
      evidence,
    });

  if (disputeError) {
    return new Response(JSON.stringify({ error: disputeError.message }), {
      status: 500,
      headers: { ...getCorsHeaders(), "Content-Type": "application/json" },
    });
  }

  await supabaseClient
    .from("p2p_orders")
    .update({ status: "disputed" })
    .eq("id", orderId);

  return new Response(
    JSON.stringify({ success: true, message: "Dispute raised" }),
    {
      headers: { ...getCorsHeaders(), "Content-Type": "application/json" },
    }
  );
}
