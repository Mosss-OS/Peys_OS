import "jsr:@supabase/functions-js/edge-runtime.d.ts";
import { createWalletClient, http, keccak256, stringToHex } from "viem";
import { privateKeyToAccount } from "viem/accounts";
import { getCorsHeaders } from "../_shared/cors.ts";
import { ESCROW_ABI, getRpcUrl, getEscrowContractAddress } from "../_shared/blockchain.ts";

enum Action {
  Claim = "claim",
  CreateWithPermit = "createWithPermit",
}

interface ClaimRequest {
  action: Action.Claim;
  paymentId: number;
  secret: string;
  chainId?: number;
}

interface CreateWithPermitRequest {
  action: Action.CreateWithPermit;
  sender: string;
  recipient: string;
  amount: string;
  secret: string;
  duration?: number;
  deadline: number;
  v: number;
  r: string;
  s: string;
  chainId?: number;
}

type SignerRequest = ClaimRequest | CreateWithPermitRequest;

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
    const privateKey = Deno.env.get("SIGNER_PRIVATE_KEY");
    if (!privateKey) {
      return new Response(
        JSON.stringify({ error: "Signer not configured" }),
        { status: 500, headers: { ...getCorsHeaders(), "Content-Type": "application/json" } }
      );
    }

    const body: SignerRequest = await req.json();

    if (!body.action || !Object.values(Action).includes(body.action)) {
      return new Response(
        JSON.stringify({ error: "Invalid action" }),
        { status: 400, headers: { ...getCorsHeaders(), "Content-Type": "application/json" } }
      );
    }

    const chainId = body.chainId || 84532;
    const rpcUrl = getRpcUrl(chainId);
    const contractAddress = getEscrowContractAddress(chainId);

    if (!contractAddress) {
      return new Response(
        JSON.stringify({ error: "Contract address not configured for this chain" }),
        { status: 500, headers: { ...getCorsHeaders(), "Content-Type": "application/json" } }
      );
    }

    const account = privateKeyToAccount(privateKey as `0x${string}`);

    const walletClient = createWalletClient({
      account,
      transport: http(rpcUrl),
    });

    switch (body.action) {
      case Action.Claim: {
        const { paymentId, secret } = body;

        if (!paymentId || !secret) {
          return new Response(
            JSON.stringify({ error: "Missing paymentId or secret" }),
            { status: 400, headers: { ...getCorsHeaders(), "Content-Type": "application/json" } }
          );
        }

        const txHash = await walletClient.writeContract({
          address: contractAddress as `0x${string}`,
          abi: ESCROW_ABI,
          functionName: "claimPayment",
          args: [BigInt(paymentId), secret],
          chain: null,
        } as any);

        return new Response(
          JSON.stringify({
            success: true,
            transactionHash: txHash,
            action: Action.Claim,
            paymentId,
          }),
          { status: 200, headers: { ...getCorsHeaders(), "Content-Type": "application/json" } }
        );
      }

      case Action.CreateWithPermit: {
        const { sender, recipient, amount, secret, duration, deadline, v, r, s } = body;

        if (!sender || !recipient || !amount || !secret || !deadline || v === undefined || !r || !s) {
          return new Response(
            JSON.stringify({ error: "Missing required fields for createWithPermit" }),
            { status: 400, headers: { ...getCorsHeaders(), "Content-Type": "application/json" } }
          );
        }

        const secretHash = keccak256(stringToHex(secret));

        const txHash = await walletClient.writeContract({
          address: contractAddress as `0x${string}`,
          abi: ESCROW_ABI,
          functionName: "createPaymentWithPermit",
          args: [
            sender as `0x${string}`,
            recipient as `0x${string}`,
            BigInt(amount),
            secretHash,
            BigInt(duration || 0),
            BigInt(deadline),
            v,
            r as `0x${string}`,
            s as `0x${string}`,
          ],
          chain: null,
        } as any);

        return new Response(
          JSON.stringify({
            success: true,
            transactionHash: txHash,
            action: Action.CreateWithPermit,
            secretHash,
          }),
          { status: 200, headers: { ...getCorsHeaders(), "Content-Type": "application/json" } }
        );
      }

      default:
        return new Response(
          JSON.stringify({ error: "Unsupported action" }),
          { status: 400, headers: { ...getCorsHeaders(), "Content-Type": "application/json" } }
        );
    }
  } catch (error) {
    console.error("Signer error:", error instanceof Error ? error.message : "Unknown error");
    return new Response(
      JSON.stringify({
        error: "Transaction failed",
        details: error instanceof Error ? error.message : "Unknown error",
      }),
      { status: 500, headers: { ...getCorsHeaders(), "Content-Type": "application/json" } }
    );
  }
});
