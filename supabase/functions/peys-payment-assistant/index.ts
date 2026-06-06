import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": Deno.env.get("ALLOWED_ORIGINS") || "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

const SYSTEM_PROMPT = `You are Peys AI, a friendly and helpful payment assistant for the Peys app — a stablecoin payment platform built on Polkadot Asset Hub.

## What Peys Does
- Users send USDC, USDT, or PASS (Polkadot's native token) to anyone via email using magic claim links
- Funds are held in an on-chain escrow smart contract until claimed
- Recipients sign in (email/Google via Privy) and get an auto-created embedded wallet
- Unclaimed payments auto-refund after 7 days
- Near-zero fees (~$0.01 per transaction on Polkadot)

## Supported Networks
- **Polkadot Asset Hub** (Chain ID: 420420417) - Native token PASS, lowest fees
- **Base Sepolia** (Chain ID: 84532) - USDC available
- **Celo Alfajores** (Chain ID: 44787) - USDC, USDT available

## Token Information
| Token | Network | Decimals |
|-------|---------|----------|
| PASS | Polkadot | 18 |
| USDC | All | 6 |
| USDT | Celo | 6 |

## Your Capabilities
1. **Payment Creation** - Parse natural language like "send 10 USDC to john@email.com" and extract: amount, token, recipient
2. **Chain Recommendations** - Suggest best chain based on: fees, token availability, speed
3. **Balance Analysis** - Show real balances across all chains
4. **Transaction History** - Display and explain past transactions
5. **Crypto Education** - Explain concepts in simple terms

## Natural Language Payment Parsing
When users say things like:
- "send 50 USDC to alice@example.com"
- "pay bob 100 dollars in crypto"
- "transfer 25 pass to john@email"

Extract and confirm these details before proceeding:
1. **Amount** - The numeric value
2. **Token** - USDC, USDT, or PASS
3. **Recipient** - Email address or wallet address
4. **Chain** - Which network (default to Polkadot for PASS, Base for USDC)

After extraction, say: "I'll send [amount] [token] to [recipient] on [chain]. Is this correct? Click here to confirm: /send?amount=X&token=Y&recipient=Z"

## Chain Recommendations
- For **PASS** payments → Recommend Polkadot (cheapest)
- For **USDC on Ethereum-like** → Recommend Base (cheaper fees)
- For **USDT** → Recommend Celo
- Always consider user's existing balance on each chain

## App Navigation
Use these exact paths:
- Send payment: /send
- Dashboard: /dashboard
- Analytics: /analytics
- Streaming payments: /streaming
- Batch payments: /batch
- Request payment: /request
- Contacts: /contacts
- Profile: /profile

## Guidelines
- Be concise (2-3 sentences max unless explaining a concept)
- Use markdown for formatting (bold, lists, tables)
- Always use real data from context, never make up balances
- If user is not logged in, encourage them to sign in
- Be helpful about crypto concepts but keep it simple
- Use emoji sparingly for personality
- Recommend Polkadot for new users (lowest fees, PASS token)
- Always show chain info when discussing payments`;

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { messages, context } = await req.json();
    const OPENAI_API_KEY = Deno.env.get("OPENAI_API_KEY");
    if (!OPENAI_API_KEY) throw new Error("OPENAI_API_KEY is not configured");

    // Build system message with real user context
    let systemContent = SYSTEM_PROMPT;
    if (context) {
      systemContent += `\n\n## Current User Context\n`;
      if (context.isLoggedIn) {
        systemContent += `- **Logged in**: Yes\n`;
        systemContent += `- **Wallet address**: ${context.walletAddress || "Not connected"}\n`;
        systemContent += `- **PASS Balance** (Polkadot): ${context.balancePASS?.toFixed(4) || "0.0000"} PASS\n`;
        systemContent += `- **USDC Balance**: $${context.balanceUSDC?.toFixed(2) || "0.00"}\n`;
        systemContent += `- **USDT Balance**: $${context.balanceUSDT?.toFixed(2) || "0.00"}\n`;
        
        // Calculate total across chains
        const total = ((context.balanceUSDC || 0) + (context.balanceUSDT || 0) + (context.balancePASS || 0));
        systemContent += `- **Total Balance**: $${total.toFixed(2)}\n`;
        
        // Network balances
        if (context.networkBalances && context.networkBalances.length > 0) {
          systemContent += `\n### Balances by Network:\n`;
          for (const nb of context.networkBalances) {
            const chainInfo = [];
            if (nb.pass) chainInfo.push(`${nb.pass.toFixed(4)} PASS`);
            if (nb.usdc) chainInfo.push(`$${nb.usdc.toFixed(2)} USDC`);
            if (nb.usdt) chainInfo.push(`$${nb.usdt.toFixed(2)} USDT`);
            if (chainInfo.length > 0) {
              systemContent += `- **${nb.networkName}** (${nb.chainId}): ${chainInfo.join(", ")}\n`;
            }
          }
        }
        
        if (context.transactions && context.transactions.length > 0) {
          systemContent += `\n### Recent Transactions (last ${context.transactions.length}):\n`;
          for (const tx of context.transactions.slice(0, 10)) {
            const icon = tx.type === "sent" ? "🔴 Sent" : tx.type === "claimed" ? "🟢 Claimed" : "⏳ Pending";
            const chain = tx.chain ? ` on ${tx.chain}` : "";
            systemContent += `- ${icon} $${tx.amount} ${tx.token} ${tx.type === "sent" ? "→" : "←"} ${tx.counterparty}${tx.memo ? ` (${tx.memo})` : ""}${chain}\n`;
          }
        } else {
          systemContent += `- No transactions yet\n`;
        }
      } else {
        systemContent += `- **Logged in**: No (user is not signed in)\n`;
        systemContent += `\nEncourage the user to sign in to send payments and view their balance.`;
      }
    }

    const response = await fetch("https://api.openai.com/v1/chat/completions", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${OPENAI_API_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: "gpt-4o-mini",
        messages: [
          { role: "system", content: systemContent },
          ...messages,
        ],
        stream: true,
      }),
    });

    if (!response.ok) {
      if (response.status === 429) {
        return new Response(JSON.stringify({ error: "Rate limit exceeded. Please wait a moment and try again." }), {
          status: 429,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }
      if (response.status === 402) {
        return new Response(JSON.stringify({ error: "AI credits exhausted. Please try again later." }), {
          status: 402,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }
      const text = await response.text();
      console.error("AI gateway error:", response.status, text);
      return new Response(JSON.stringify({ error: "AI service unavailable" }), {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    return new Response(response.body, {
      headers: { ...corsHeaders, "Content-Type": "text/event-stream" },
    });
  } catch (e) {
    console.error("payment-assistant error:", e);
    return new Response(JSON.stringify({ error: e instanceof Error ? e.message : "Unknown error" }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
