import { ethers } from "ethers";

const PRIVATE_KEY = process.env.PRIVATE_KEY || process.env.PLATFORM_PRIVATE_KEY;
if (!PRIVATE_KEY) {
  console.error("Error: PRIVATE_KEY or PLATFORM_PRIVATE_KEY environment variable is required");
  console.log("Usage: PRIVATE_KEY=0x... npx tsx scripts/create-payment-debug.ts");
  process.exit(1);
}

const RPC_URL = process.env.RPC_URL || process.env.BASE_SEPOLIA_RPC || "https://base-sepolia.g.alchemy.com/v2/your-api-key";
const USDC_ADDRESS = process.env.USDC_ADDRESS || "0x036CbD53842c5426634e7929541eC2318f3dCF7e";
const ESCROW_ADDRESS = process.env.ESCROW_ADDRESS || "***REMOVED***";

const USDC_ABI = [
  "function approve(address spender, uint256 amount) external returns (bool)",
  "function allowance(address owner, address spender) external view returns (uint256)",
  "function balanceOf(address account) external view returns (uint256)"
];

const ESCROW_ABI = [
  "function createPaymentExternal(address token, uint256 amount, bytes32 claimHash, uint256 expiry, string calldata memo) external returns (bytes32 paymentId)",
  "function createPaymentWithDefaultExpiry(address token, uint256 amount, bytes32 claimHash, string calldata memo) external returns (bytes32 paymentId)"
];

async function main() {
  const provider = new ethers.JsonRpcProvider(RPC_URL);
  const wallet = new ethers.Wallet(PRIVATE_KEY as string, provider);
  
  const usdc = new ethers.Contract(USDC_ADDRESS, USDC_ABI, wallet);
  const escrow = new ethers.Contract(ESCROW_ADDRESS, ESCROW_ABI, wallet);
  
  const amount = ethers.parseUnits("2", 6);
  const walletAddress = wallet.address;
  
  console.log("Wallet:", walletAddress);
  
  const balance = await usdc.balanceOf(walletAddress);
  console.log("USDC Balance:", ethers.formatUnits(balance, 6));
  
  const allowance = await usdc.allowance(walletAddress, ESCROW_ADDRESS);
  console.log("Current allowance:", ethers.formatUnits(allowance, 6));
  
  if (allowance < amount) {
    console.log("\nApproving USDC...");
    const approveTx = await usdc.approve(ESCROW_ADDRESS, ethers.MaxUint256);
    await approveTx.wait();
    console.log("Approved!");
    
    const newAllowance = await usdc.allowance(walletAddress, ESCROW_ADDRESS);
    console.log("New allowance:", ethers.formatUnits(newAllowance, 6));
  }
  
  console.log("\nChecking escrow contract code...");
  const code = await provider.getCode(ESCROW_ADDRESS);
  console.log("Escrow contract code length:", code.length);
  
  console.log("\nCreating payment...");
  const claimSecret = ethers.randomBytes(32);
  const claimHash = ethers.keccak256(claimSecret);
  
  try {
    const tx = await escrow.createPaymentWithDefaultExpiry.populateTransaction(
      USDC_ADDRESS,
      amount,
      claimHash,
      `Payment to moses.main21@gmail.com`
    );
    
    console.log("Transaction data:", tx.data);
    
    const gasEstimate = await provider.estimateGas({
      from: walletAddress,
      to: ESCROW_ADDRESS,
      data: tx.data
    });
    console.log("Gas estimate:", gasEstimate.toString());
    
    const createTx = await escrow.createPaymentWithDefaultExpiry(
      USDC_ADDRESS,
      amount,
      claimHash,
      `Payment to moses.main21@gmail.com`
    );
    
    await createTx.wait();
    console.log("Success! Tx:", createTx.hash);
    console.log("Claim secret:", Buffer.from(claimSecret).toString("hex"));
  } catch (err: unknown) {
    const error = err as { message?: string; data?: unknown };
    console.error("Error:", error.message);
    if (error.data) {
      console.error("Error data:", error.data);
    }
  }
}

main().catch(console.error);
