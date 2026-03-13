import { ethers } from "ethers";
import { createClient } from "@supabase/supabase-js";

// Environment variables - never commit private keys to source code
const PRIVATE_KEY = process.env.PRIVATE_KEY || process.env.PLATFORM_PRIVATE_KEY;
const RPC_URL = process.env.RPC_URL || process.env.VITE_RPC_URL_BASE_SEPOLIA;
const USDC_ADDRESS = process.env.USDC_ADDRESS || process.env.VITE_USDC_ADDRESS_BASE_SEPOLIA;
const ESCROW_ADDRESS = process.env.ESCROW_ADDRESS || process.env.VITE_ESCROW_CONTRACT_ADDRESS_BASE_SEPOLIA;

const SUPABASE_URL = process.env.SUPABASE_URL || process.env.VITE_SUPABASE_URL;
const SUPABASE_SERVICE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY;
const RESEND_API_KEY = process.env.RESEND_API_KEY;

// Validate required environment variables
if (!PRIVATE_KEY) {
  console.error("ERROR: PRIVATE_KEY environment variable is required");
  process.exit(1);
}

if (!RPC_URL) {
  console.error("ERROR: RPC_URL environment variable is required");
  process.exit(1);
}

if (!SUPABASE_URL || !SUPABASE_SERVICE_KEY) {
  console.error("ERROR: Supabase environment variables are required");
  process.exit(1);
}

const USDC_ABI = [
  "function approve(address spender, uint256 amount) external returns (bool)",
  "function allowance(address owner, address spender) external view returns (uint256)",
  "function balanceOf(address account) external view returns (uint256)"
];

const ESCROW_ABI = [
  "function createPaymentWithDefaultExpiry(address token, uint256 amount, bytes32 claimHash, string calldata memo) external returns (bytes32 paymentId)"
];

const supabase = createClient(SUPABASE_URL!, SUPABASE_SERVICE_KEY!);

async function main() {
  const RECIPIENT_EMAIL = "moses.main21@gmail.com";
  const AMOUNT_USDC = 2;

  console.log("=== Creating Payment ===");
  console.log(`Recipient: ${RECIPIENT_EMAIL}`);
  console.log(`Amount: ${AMOUNT_USDC} USDC`);

  const provider = new ethers.JsonRpcProvider(RPC_URL!);
  const wallet = new ethers.Wallet(PRIVATE_KEY!, provider);
  
  const usdc = new ethers.Contract(USDC_ADDRESS!, USDC_ABI, wallet);
  const escrow = new ethers.Contract(ESCROW_ADDRESS!, ESCROW_ABI, wallet);
  
  const amount = ethers.parseUnits(AMOUNT_USDC.toString(), 6);
  
  const balance = await usdc.balanceOf(wallet.address);
  console.log(`Wallet USDC balance: ${ethers.formatUnits(balance, 6)}`);
  
  if (balance < amount) {
    console.error("Insufficient balance!");
    process.exit(1);
  }
  
  const claimSecret = crypto.randomUUID();
  const claimLink = crypto.randomUUID();
  const paymentId = `peys_${claimLink.replace(/-/g, "").slice(0, 16)}`;
  
  const claimHash = ethers.keccak256(ethers.toUtf8Bytes(claimSecret));
  
  const expiresAt = new Date();
  expiresAt.setDate(expiresAt.getDate() + 7);
  
  console.log("\n1. Saving payment to database...");
  
  const { data: payment, error: insertError } = await supabase
    .from("payments")
    .insert({
      payment_id: paymentId,
      sender_user_id: null,
      sender_email: "",
      sender_wallet: wallet.address,
      recipient_email: RECIPIENT_EMAIL,
      amount: AMOUNT_USDC,
      token: "USDC",
      memo: `Payment to ${RECIPIENT_EMAIL}`,
      claim_secret: claimSecret,
      claim_link: claimLink,
      status: "pending",
      expires_at: expiresAt.toISOString(),
    })
    .select()
    .single();

  if (insertError) {
    console.error("Database insert error:", insertError);
    process.exit(1);
  }

  console.log(`   Payment created in DB: ${payment.id}`);
  
  console.log("\n2. Approving USDC...");
  const approveTx = await usdc.approve(ESCROW_ADDRESS, ethers.MaxUint256);
  await approveTx.wait();
  console.log(`   Approved: ${approveTx.hash}`);
  
  console.log("\n3. Creating escrow payment on blockchain...");
  const createTx = await escrow.createPaymentWithDefaultExpiry(
    USDC_ADDRESS,
    amount,
    claimHash,
    `Payment to ${RECIPIENT_EMAIL}`
  );
  const receipt = await createTx.wait();
  console.log(`   Transaction: ${createTx.hash}`);
  
  const iface = new ethers.Interface([
    "event PaymentCreated(bytes32 indexed paymentId, address indexed sender, address token, uint256 amount, uint256 expiry, string memo)"
  ]);
  
  let blockchainPaymentId = "";
  for (const log of receipt.logs) {
    try {
      const parsed = iface.parseLog({ topics: log.topics, data: log.data });
      if (parsed && parsed.name === "PaymentCreated") {
        blockchainPaymentId = parsed.args.paymentId;
        break;
      }
    } catch (e) {
      // Ignore parsing errors
    }
  }
  
  console.log(`   Blockchain Payment ID: ${blockchainPaymentId}`);
  
  console.log("\n4. Updating database with blockchain info...");
  await supabase
    .from("payments")
    .update({
      tx_hash: createTx.hash,
      blockchain_payment_id: blockchainPaymentId,
    })
    .eq("id", payment.id);

  console.log("\n5. Sending email notification...");
  
  const appUrl = "https://peys-mauve.vercel.app";
  const fullClaimLink = `${appUrl}/claim/${claimLink}`;
  
  const emailHtml = `
<!DOCTYPE html>
<html>
<head>
  <style>
    body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; line-height: 1.6; color: #333; margin: 0; padding: 0; background: #f5f5f5; }
    .container { max-width: 600px; margin: 40px auto; background: white; border-radius: 16px; overflow: hidden; box-shadow: 0 4px 20px rgba(0,0,0,0.1); }
    .header { background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); padding: 40px 30px; text-align: center; }
    .header h1 { color: white; margin: 0; font-size: 28px; }
    .content { padding: 40px 30px; text-align: center; }
    .amount { font-size: 48px; font-weight: 800; color: #667eea; }
    .token { font-size: 24px; color: #666; }
    .cta-button { display: inline-block; background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); color: white; text-decoration: none; padding: 18px 50px; border-radius: 30px; font-weight: 700; font-size: 18px; margin: 30px 0; }
    .footer { background: #f8f9fa; padding: 20px 30px; text-align: center; font-size: 13px; color: #999; }
  </style>
</head>
<body>
  <div class="container">
    <div class="header">
      <h1>You've received money!</h1>
      <p>Someone sent you crypto on Peys Magic Links</p>
    </div>
    <div class="content">
      <div class="amount">$${AMOUNT_USDC.toFixed(2)}</div>
      <div class="token">USDC</div>
      <p style="color: #666; margin: 25px 0;">
        Click below to claim your funds. If you don't have an account yet, you'll be able to create one instantly.
      </p>
      <a href="${fullClaimLink}" class="cta-button">Claim Your Funds</a>
      <p style="color: #999; font-size: 14px;">
        Or copy this link:<br>
        <a href="${fullClaimLink}" style="color: #667eea;">${fullClaimLink}</a>
      </p>
    </div>
    <div class="footer">
      <p><strong>Peys Magic Links</strong> - Send crypto to anyone via email</p>
      <p>This payment expires in 7 days.</p>
    </div>
  </div>
</body>
</html>
  `;

  const emailResponse = await fetch("https://api.resend.com/emails", {
    method: "POST",
    headers: {
      "Authorization": `Bearer ${RESEND_API_KEY}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      from: "Peys <onboarding@resend.dev>",
      to: [RECIPIENT_EMAIL],
      subject: `You've received ${AMOUNT_USDC.toFixed(2)} USDC on Peys!`,
      html: emailHtml,
    }),
  });

  if (emailResponse.ok) {
    console.log("   Email sent successfully!");
  } else {
    const err = await emailResponse.text();
    console.log(`   Email error: ${err}`);
  }

  console.log("\n=== SUMMARY ===");
  console.log(`Payment of ${AMOUNT_USDC} USDC created for ${RECIPIENT_EMAIL}`);
  console.log(`Claim Link: ${fullClaimLink}`);
  console.log(`Claim Secret: ${claimSecret}`);
  console.log(`Blockchain Payment ID: ${blockchainPaymentId}`);
  console.log(`Transaction Hash: ${createTx.hash}`);
  console.log("\nThe recipient should check their email to claim the funds!");
}

main().catch(console.error);
