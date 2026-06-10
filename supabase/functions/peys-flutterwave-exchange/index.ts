import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { parseSafeFloat } from "../_shared/schemas.ts";

const FLUTTERWAVE_API_BASE = "https://api.flutterwave.com/v3";

const corsHeaders = {
  "Access-Control-Allow-Origin": Deno.env.get("ALLOWED_ORIGINS") || "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

const MOCK_RATES: Record<string, Record<string, number>> = {
  USDC: {
    NGN: 1520,
    GHS: 13.5,
    KES: 155,
    ZAR: 19,
    UGX: 3850,
    TZS: 2650,
    XOF: 610,
    XAF: 610,
    ZMW: 27,
    EGP: 48,
    MAD: 10,
  },
  USDT: {
    NGN: 1520,
    GHS: 13.5,
    KES: 155,
    ZAR: 19,
    UGX: 3850,
    TZS: 2650,
    XOF: 610,
    XAF: 610,
    ZMW: 27,
    EGP: 48,
    MAD: 10,
  },
};

const FEE_PERCENTAGES: Record<string, number> = {
  NGN: 1,
  GHS: 1.5,
  KES: 1,
  ZAR: 1.25,
  UGX: 1,
  TZS: 1,
  XOF: 1,
  XAF: 1,
  ZMW: 1.5,
  EGP: 1,
  MAD: 1,
};

const MIN_FEES: Record<string, number> = {
  NGN: 50,
  GHS: 1,
  KES: 25,
  ZAR: 5,
  UGX: 1000,
  TZS: 1000,
  XOF: 100,
  XAF: 100,
  ZMW: 5,
  EGP: 5,
  MAD: 10,
};

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }

  try {
    const url = new URL(req.url);
    const fromCurrency = url.searchParams.get("from") || "USDC";
    const toCurrency = url.searchParams.get("to") || "NGN";
    const amount = parseSafeFloat(url.searchParams.get("amount"), 1, 0.01, 1_000_000);

    let rate = MOCK_RATES[fromCurrency]?.[toCurrency];

    if (!rate) {
      const flutterwaveSecret = Deno.env.get("FLUTTERWAVE_SECRET_KEY");
      if (flutterwaveSecret) {
        try {
          const response = await fetch(
            `${FLUTTERWAVE_API_BASE}/rates?from=${fromCurrency}&to=${toCurrency}`,
            {
              headers: {
                Authorization: `Bearer ${flutterwaveSecret}`,
              },
            }
          );
          const data = await response.json();
          if (data.status === "success") {
            rate = data.data.rate;
          }
        } catch (e) {
          console.error("Flutterwave rate fetch failed:", e);
        }
      }
    }

    if (!rate) {
      return new Response(
        JSON.stringify({ error: "Currency pair not supported" }),
        {
          status: 400,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        }
      );
    }

    const feePercentage = FEE_PERCENTAGES[toCurrency] || 1;
    const minFee = MIN_FEES[toCurrency] || 1;
    const fee = Math.max(amount * rate * (feePercentage / 100), minFee);
    const netAmount = amount * rate - fee;

    return new Response(
      JSON.stringify({
        success: true,
        from_currency: fromCurrency,
        to_currency: toCurrency,
        rate,
        amount_in: amount,
        amount_out: amount * rate,
        fee,
        fee_percentage: feePercentage,
        net_amount: netAmount,
        updated_at: new Date().toISOString(),
      }),
      {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      }
    );
  } catch (error) {
    console.error("Exchange rate error:", error);
    return new Response(JSON.stringify({ error: "Internal server error" }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
