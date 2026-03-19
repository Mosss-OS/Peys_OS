import { ethers } from "ethers";

// Environment variables - never commit private keys to source code
const PRIVATE_KEY = process.env.PRIVATE_KEY || process.env.PLATFORM_PRIVATE_KEY;
const RPC_URL = process.env.RPC_URL || process.env.VITE_RPC_URL_BASE_SEPOLIA;
const USDC_ADDRESS = process.env.USDC_ADDRESS || process.env.VITE_USDC_ADDRESS_BASE_SEPOLIA;
const ESCROW_ADDRESS = process.env.ESCROW_ADDRESS || process.env.VITE_ESCROW_CONTRACT_ADDRESS_BASE_SEPOLIA;

// Validate required environment variables
if (!PRIVATE_KEY) {
  console.error("ERROR: PRIVATE_KEY environment variable is required");
  process.exit(1);
}

if (!RPC_URL) {
  console.error("ERROR: RPC_URL environment variable is required");
  process.exit(1);
}

if (!USDC_ADDRESS || !ESCROW_ADDRESS) {
  console.error("ERROR: Contract address environment variables are required");
  process.exit(1);
}

const RECIPIENT_EMAIL = process.env.RECIPIENT_EMAIL || "moses.main21@gmail.com";
const AMOUNT_USDC = parseFloat(process.env.AMOUNT_USDC || "2");

const ESCROW_ABI = [
  "function createPaymentExternal(address token, uint256 amount, bytes32 claimHash, uint256 expiry, string calldata memo) external returns (bytes32 paymentId)",
  "function createPaymentWithDefaultExpiry(address token, uint256 amount, bytes32 claimHash, string calldata memo) external returns (bytes32 paymentId)"
];

const USDC_ABI = [
  "function approve(address spender, uint256 amount) external returns (bool)",
  "function allowance(address owner, address spender) external view returns (uint256)",
  "function balanceOf(address account) external view returns (uint256)"
];

async function main() {
  console.log("Connecting to Base Sepolia...");
  const provider = new ethers.JsonRpcProvider(RPC_URL!);
  const wallet = new ethers.Wallet(PRIVATE_KEY!, provider);
  
  console.log("Wallet address:", wallet.address);
  
  const usdc = new ethers.Contract(USDC_ADDRESS!, USDC_ABI, wallet);
  const escrow = new ethers.Contract(ESCROW_ADDRESS!, ESCROW_ABI, wallet);
  
  const amount = ethers.parseUnits(AMOUNT_USDC.toString(), 6);
  console.log(`Amount: ${AMOUNT_USDC} USDC (${amount} in wei)`);
  
  const balance = await usdc.balanceOf(wallet.address);
  console.log(`Wallet USDC balance: ${ethers.formatUnits(balance, 6)} USDC`);
  
  if (balance < amount) {
    console.error("Insufficient USDC balance!");
    process.exit(1);
  }
  
  const claimSecret = ethers.randomBytes(32);
  const claimHash = ethers.keccak256(claimSecret);
  console.log("Claim secret (save this!):", Buffer.from(claimSecret).toString("hex"));
  console.log("Claim hash:", claimHash);
  
  console.log("\nApproving USDC to escrow contract...");
  const approveTx = await usdc.approve(ESCROW_ADDRESS, amount);
  await approveTx.wait();
  console.log("Approval confirmed:", approveTx.hash);
  
  console.log("\nCreating payment...");
  const expiry = 7 * 24 * 60 * 60;
  const memo = `Payment to ${RECIPIENT_EMAIL}`;
  
  const createTx = await escrow.createPaymentWithDefaultExpiry(
    USDC_ADDRESS,
    amount,
    claimHash,
    memo
  );
  const receipt = await createTx.wait();
  console.log("Payment created! Transaction:", createTx.hash);
  
  console.log("\n=== SUMMARY ===");
  console.log(`Payment of ${AMOUNT_USDC} USDC created for ${RECIPIENT_EMAIL}`);
  console.log("Claim secret (hex):", Buffer.from(claimSecret).toString("hex"));
  console.log("Transaction hash:", createTx.hash);
  console.log("\nIMPORTANT: Save the claim secret! It's needed to claim the funds.");
}

main().catch(console.error);
