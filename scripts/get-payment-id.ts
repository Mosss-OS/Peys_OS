import { ethers } from "ethers";

const RPC_URL = "https://base-sepolia.g.alchemy.com/v2/***REMOVED***";
const ESCROW_ABI = [
  "event PaymentCreated(bytes32 indexed paymentId, address indexed sender, address token, uint256 amount, uint256 expiry, string memo)"
];

async function main() {
  const provider = new ethers.JsonRpcProvider(RPC_URL);
  
  const txHash = "0xaa2ed2f2d6569ab6e1c3adb4f7840b77b41e62c170e7138ec8e93543034ce71e";
  
  const receipt = await provider.getTransactionReceipt(txHash);
  
  console.log("Transaction receipt:");
  console.log("  Block number:", receipt.blockNumber);
  console.log("  Gas used:", receipt.gasUsed);
  
  const iface = new ethers.Interface(ESCROW_ABI);
  
  for (const log of receipt.logs) {
    try {
      const parsed = iface.parseLog({
        topics: log.topics,
        data: log.data
      });
      
      if (parsed) {
        console.log("\nPaymentCreated event:");
        console.log("  paymentId:", parsed.args.paymentId);
        console.log("  sender:", parsed.args.sender);
        console.log("  token:", parsed.args.token);
        console.log("  amount:", parsed.args.amount.toString());
        console.log("  expiry:", new Date(Number(parsed.args.expiry) * 1000).toISOString());
        console.log("  memo:", parsed.args.memo);
      }
    } catch (e) {
      // Not our event
    }
  }
}

main().catch(console.error);
