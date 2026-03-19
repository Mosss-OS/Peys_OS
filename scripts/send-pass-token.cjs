#!/usr/bin/env node

/**
 * Script to send PASS tokens on Polkadot Asset Hub
 * This script uses the private key from the .env file to sign transactions
 */

const {
  createWalletClient,
  createPublicClient,
  http,
  parseEther,
  keccak256,
  toBytes,
} = require("viem");
const { privateKeyToAccount } = require("viem/accounts");

// Load environment variables
require("dotenv").config();

// Configuration
const RPC_URL =
  process.env.VITE_RPC_URL_POLKADOT ||
  "https://eth-asset-hub-paseo.dotters.network";
const ESCROW_CONTRACT =
  process.env.VITE_ESCROW_CONTRACT_ADDRESS_POLKADOT ||
  "***REMOVED***";
const PASS_TOKEN_ADDRESS =
  process.env.VITE_PASS_ADDRESS_POLKADOT ||
  "0x00000001000000000000000000000000000007c0";
const PRIVATE_KEY = process.env.PRIVATE_KEY;

// Arguments
const RECIPIENT_EMAIL = process.argv[2] || "moseschizaram8@gmail.com";
const AMOUNT = process.argv[3] || "2"; // 2 PASS tokens

console.log("=== Sending PASS Token via Polkadot ===");
console.log("RPC:", RPC_URL);
console.log("Escrow Contract:", ESCROW_CONTRACT);
console.log("PASS Token:", PASS_TOKEN_ADDRESS);
console.log("Amount:", AMOUNT, "PASS");
console.log("Recipient:", RECIPIENT_EMAIL);
console.log("");

// Abi for the escrow contract (simplified)
const ESCROW_ABI = [
  {
    inputs: [
      { name: "token", type: "address" },
      { name: "amount", type: "uint256" },
      { name: "claimHash", type: "bytes32" },
      { name: "expiry", type: "uint256" },
      { name: "memo", type: "string" },
    ],
    name: "createPaymentExternal",
    outputs: [{ name: "paymentId", type: "bytes32" }],
    stateMutability: "nonpayable",
    type: "function",
  },
  {
    inputs: [
      { name: "owner", type: "address" },
      { name: "spender", type: "address" },
    ],
    name: "allowance",
    outputs: [{ name: "", type: "uint256" }],
    stateMutability: "view",
    type: "function",
  },
  {
    inputs: [
      { name: "spender", type: "address" },
      { name: "amount", type: "uint256" },
    ],
    name: "approve",
    outputs: [{ name: "", type: "bool" }],
    stateMutability: "nonpayable",
    type: "function",
  },
];

// Create clients
const account = privateKeyToAccount(PRIVATE_KEY);
const publicClient = createPublicClient({
  transport: http(RPC_URL),
});

const walletClient = createWalletClient({
  account,
  transport: http(RPC_URL),
});

async function sendTransaction() {
  try {
    console.log("Step 1: Skipping allowance check (native token)");

    // Generate claim secret (hash)
    const secret =
      Math.random().toString(36).substring(2) + Date.now().toString(36);
    const claimHash = keccak256(toBytes(secret));

    console.log("Step 2: Creating payment...");
    console.log("Claim secret:", secret);
    console.log("Claim hash:", claimHash);

    // Create payment
    const expiryDays = 7;
    const expiry = BigInt(expiryDays * 24 * 60 * 60);
    const memo = `Payment to ${RECIPIENT_EMAIL}`;

    // For native token, we need to send value with the transaction
    const amountWei = parseEther(AMOUNT);

    console.log("Sending value:", amountWei.toString(), "wei");
    console.log("");

    const paymentTxHash = await walletClient.writeContract({
      address: ESCROW_CONTRACT,
      abi: ESCROW_ABI,
      functionName: "createPaymentExternal",
      args: [PASS_TOKEN_ADDRESS, amountWei, claimHash, expiry, memo],
      value: amountWei, // Send native value
    });

    console.log("Payment transaction hash:", paymentTxHash);

    const paymentReceipt = await publicClient.waitForTransactionReceipt({
      hash: paymentTxHash,
    });
    console.log(
      "Payment status:",
      paymentReceipt.status === "success" ? "Success" : "Failed",
    );

    if (paymentReceipt.status === "success") {
      console.log("");
      console.log("=== Transaction Successful! ===");
      console.log("Transaction hash:", paymentTxHash);
      console.log("Amount sent:", AMOUNT, "PASS");
      console.log("To:", RECIPIENT_EMAIL);
      console.log("Claim secret:", secret);
      console.log("");
      console.log(
        "Save the claim secret! The recipient will need it to claim the payment.",
      );
    }
  } catch (error) {
    console.error("Error:", error.message);
    console.error("Full error:", error);
    process.exit(1);
  }
}

sendTransaction();
