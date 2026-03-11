import { ethers } from "ethers";

const PRIVATE_KEY = "***REMOVED***";
const RPC_URL = "https://base-sepolia.g.alchemy.com/v2/***REMOVED***";
const USDC_ADDRESS = "0x036CbD53842c5426634e7929541eC2318f3dCF7e";
const ESCROW_ADDRESS = "***REMOVED***";
const RECIPIENT_EMAIL = "moses.main21@gmail.com";
const AMOUNT_USDC = 2;

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
  const provider = new ethers.JsonRpcProvider(RPC_URL);
  const wallet = new ethers.Wallet(PRIVATE_KEY, provider);
  
  console.log("Wallet address:", wallet.address);
  
  const usdc = new ethers.Contract(USDC_ADDRESS, USDC_ABI, wallet);
  const escrow = new ethers.Contract(ESCROW_ADDRESS, ESCROW_ABI, wallet);
  
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
