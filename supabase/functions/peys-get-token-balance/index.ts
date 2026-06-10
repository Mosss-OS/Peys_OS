import "jsr:@supabase/functions-js/edge-runtime.d.ts";
import { createClient } from "jsr:@supabase/supabase-js@2";
import { createPublicClient, http, parseAbi } from "npm:viem";
import { getCorsHeaders } from "../_shared/cors.ts";

const ERC20_ABI = parseAbi([
  "function balanceOf(address account) view returns (uint256)",
]);

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: getCorsHeaders() });
  }

  if (req.method !== "POST") {
    return new Response(
      JSON.stringify({ error: "Method not allowed" }),
      { status: 405, headers: { ...getCorsHeaders(), "Content-Type": "application/json" } }
    );
  }

  try {
    const supabaseUrl = Deno.env.get("SUPABASE_URL") ?? "";
    const authHeader = req.headers.get("Authorization");

    const supabaseClient = createClient(
      supabaseUrl,
      Deno.env.get("SUPABASE_ANON_KEY") ?? "",
      {
        global: {
          headers: authHeader ? { Authorization: authHeader } : {},
        },
      }
    );

    const {
      data: { user },
      error: authError,
    } = await supabaseClient.auth.getUser();

    if (authError || !user) {
      return new Response(
        JSON.stringify({ error: "Unauthorized" }),
        { status: 401, headers: { ...getCorsHeaders(), "Content-Type": "application/json" } }
      );
    }

    const { tokenAddress, walletAddress, chainId } = await req.json();

    if (!tokenAddress || !walletAddress) {
      return new Response(
        JSON.stringify({ error: "Missing required fields: tokenAddress, walletAddress" }),
        { status: 400, headers: { ...getCorsHeaders(), "Content-Type": "application/json" } }
      );
    }

    // Get RPC URL based on chain ID
    const rpcUrl = getRpcUrl(chainId);

    // Create public client
    const publicClient = createPublicClient({
      transport: http(rpcUrl),
    });

    // Get balance
    const balance = await publicClient.readContract({
      address: tokenAddress as `0x${string}`,
      abi: ERC20_ABI,
      functionName: "balanceOf",
      args: [walletAddress as `0x${string}`],
    });

    return new Response(
      JSON.stringify({
        balance: balance.toString(),
        tokenAddress,
        walletAddress,
      }),
      { status: 200, headers: { ...getCorsHeaders(), "Content-Type": "application/json" } }
    );
  } catch (error) {
    console.error("Error getting token balance:", error);
    return new Response(
      JSON.stringify({ error: "An unexpected error occurred. Please try again." }),
      { status: 500, headers: { ...getCorsHeaders(), "Content-Type": "application/json" } }
    );
  }
});

function getRpcUrl(chainId?: number): string {
  // Default to Base Sepolia
  if (!chainId) {
    return Deno.env.get("VITE_RPC_URL_BASE_SEPOLIA") || "https://sepolia.base.org";
  }

  // Chain-specific RPC URLs
  const rpcUrls: Record<number, string> = {
    84532: Deno.env.get("VITE_RPC_URL_BASE_SEPOLIA") || "https://sepolia.base.org",
    44787: Deno.env.get("VITE_RPC_URL_CELO") || "https://alfajores-forno.celo-testnet.org",
    420420421: Deno.env.get("VITE_RPC_URL_POLKADOT") || "https://eth-asset-hub-paseo.dotters.network",
    8453: Deno.env.get("VITE_RPC_URL_BASE") || "https://mainnet.base.org",
    42220: Deno.env.get("VITE_RPC_URL_CELO_MAINNET") || "https://forno.celo.org",
  };

  return rpcUrls[chainId] || rpcUrls[84532]!;
}
