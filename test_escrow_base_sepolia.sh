#!/bin/bash
set -e

echo "=========================================="
echo "  Testing PeyDot Escrow on Base Sepolia"
echo "=========================================="
echo ""

# Configuration
PRIVATE_KEY="***REMOVED***"
SENDER_ADDR=$(cast wallet address $PRIVATE_KEY)
RECIPIENT_WALLET="0x03a33E8A69f1A5b61178f70BC5c8E674aB571334"
RECIPIENT_EMAIL="moses.main21@gmail.com"
USDC_BASE_SEPOLIA="0x036CbD53842c5426634e7929541eC2318f3dCF7e"
ESCROW_BASE_SEPOLIA="0x34eD806F9F7D9F8CE1b3d30B665D3cB701a91670"
RPC_URL="https://sepolia.base.org"

# Contract ABIs (simplified)
USDC_ABI='[{"inputs":[{"internalType":"address","name":"account","type":"address"}],"name":"balanceOf","outputs":[{"internalType":"uint256","name":"","type":"uint256"}],"stateMutability":"view","type":"function"},{"inputs":[{"internalType":"address","name":"spender","type":"address"},{"internalType":"uint256","name":"amount","type":"uint256"}],"name":"approve","outputs":[{"internalType":"bool","name":"","type":"bool"}],"stateMutability":"nonpayable","type":"function"},{"inputs":[{"internalType":"address","name":"owner","type":"address"},{"internalType":"address","name":"spender","type":"address"}],"name":"allowance","outputs":[{"internalType":"uint256","name":"","type":"uint256"}],"stateMutability":"view","type":"function"}]'

ESCROW_ABI='[{"inputs":[{"internalType":"address","name":"token","type":"address"},{"internalType":"uint256","name":"amount","type":"uint256"},{"internalType":"bytes32","name":"claimHash","type":"bytes32"},{"internalType":"uint256","name":"expiry","type":"uint256"},{"internalType":"string","name":"memo","type":"string"}],"name":"createPaymentExternal","outputs":[{"internalType":"bytes32","name":"paymentId","type":"bytes32"}],"stateMutability":"nonpayable","type":"function"},{"inputs":[{"internalType":"bytes32","name":"paymentId","type":"bytes32"},{"internalType":"bytes32","name":"secretHash","type":"bytes32"},{"internalType":"address","name":"recipient","type":"address"}],"name":"claim","outputs":[{"internalType":"uint256","name":"","type":"uint256"}],"stateMutability":"nonpayable","type":"function"},{"inputs":[{"internalType":"bytes32","name":"paymentId","type":"bytes32"}],"name":"getPayment","outputs":[{"internalType":"address","name":"sender","type":"address"},{"internalType":"address","name":"token","type":"address"},{"internalType":"uint256","name":"amount","type":"uint256"},{"internalType":"uint256","name":"expiry","type":"uint256"},{"internalType":"bool","name":"claimed","type":"bool"},{"internalType":"bool","name":"refunded","type":"bool"},{"internalType":"string","name":"memo","type":"string"}],"stateMutability":"view","type":"function"}]'

echo "📊 WALLETS"
echo "=========="
echo "Sender:    $SENDER_ADDR"
echo "Recipient: $RECIPIENT_WALLET"
echo "Email:     $RECIPIENT_EMAIL"
echo ""

# Check balances
echo "🔍 CHECKING BALANCES"
echo "===================="
echo ""

# Native ETH balance
SENDER_ETH=$(cast balance $SENDER_ADDR --rpc-url $RPC_URL)
echo "Sender ETH Balance: $(cast to-unit $SENDER_ETH eth) ETH"

# USDC balance (6 decimals)
SENDER_USDC_RAW=$(cast call $USDC_BASE_SEPOLIA "balanceOf(address)(uint256)" $SENDER_ADDR --rpc-url $RPC_URL 2>/dev/null || echo "0")
SENDER_USDC=$(echo "scale=6; $SENDER_USDC_RAW / 1000000" | bc 2>/dev/null || echo "0")
echo "Sender USDC Balance: $SENDER_USDC USDC"

RECIPIENT_USDC_RAW=$(cast call $USDC_BASE_SEPOLIA "balanceOf(address)(uint256)" $RECIPIENT_WALLET --rpc-url $RPC_URL 2>/dev/null || echo "0")
RECIPIENT_USDC=$(echo "scale=6; $RECIPIENT_USDC_RAW / 1000000" | bc 2>/dev/null || echo "0")
echo "Recipient USDC Balance (before): $RECIPIENT_USDC USDC"
echo ""

if [ "$SENDER_USDC_RAW" = "0" ] || [ "$SENDER_USDC_RAW" -lt 100000 ]; then
    echo "❌ ERROR: Insufficient USDC balance. You need at least 0.1 USDC"
    exit 1
fi

# Check allowance
ALLOWANCE=$(cast call $USDC_BASE_SEPOLIA "allowance(address,address)(uint256)" $SENDER_ADDR $ESCROW_BASE_SEPOLIA --rpc-url $RPC_URL 2>/dev/null || echo "0")
echo "Current USDC Allowance for Escrow: $ALLOWANCE"
echo ""

# Approve if needed
if [ "$ALLOWANCE" -lt 1000000 ]; then
    echo "🔓 Approving USDC for Escrow Contract..."
    cast send $USDC_BASE_SEPOLIA "approve(address,uint256)" $ESCROW_BASE_SEPOLIA 999999999999999999999 --private-key $PRIVATE_KEY --rpc-url $RPC_URL
    echo "✅ Approval granted"
    echo ""
fi

# Test 1: Create a small payment (0.01 USDC = 10000 units)
AMOUNT=10000
SECRET1="test_secret_email_$(date +%s)"
SECRET1_HASH=$(cast keccak $(cast to-bytes32 $(cast from-utf8 $SECRET1)))
EXPIRY_DAYS=7
EXPIRY_SECONDS=$((7 * 24 * 60 * 60))
MEMO1="Test payment to $RECIPIENT_EMAIL"

echo "💸 TEST 1: Creating Payment to Email ($RECIPIENT_EMAIL)"
echo "======================================================="
echo "Amount: 0.01 USDC"
echo "Secret: $SECRET1"
echo "Secret Hash: $SECRET1_HASH"
echo "Memo: $MEMO1"
echo ""

echo "📤 Sending transaction to create payment..."
TX1=$(cast send $ESCROW_BASE_SEPOLIA "createPaymentExternal(address,uint256,bytes32,uint256,string)" \
    $USDC_BASE_SEPOLIA \
    $AMOUNT \
    $SECRET1_HASH \
    $EXPIRY_SECONDS \
    "$MEMO1" \
    --private-key $PRIVATE_KEY \
    --rpc-url $RPC_URL \
    2>&1)

echo "$TX1"
TX1_HASH=$(echo "$TX1" | grep "transactionHash" | awk '{print $2}' || echo "")

if [ -z "$TX1_HASH" ]; then
    echo ""
    echo "❌ ERROR: Failed to get transaction hash for Test 1"
    exit 1
fi

echo ""
echo "✅ Payment created!"
echo "Transaction Hash: $TX1_HASH"
echo ""

# Get the payment ID from the transaction receipt
echo "⏳ Waiting for receipt and extracting Payment ID..."
sleep 5

# Try to get payment details from the logs - using cast receipt to get logs
# For simplicity, we'll query the latest payment (the contract would have created one)

echo ""
echo "💸 TEST 2: Creating Payment to Wallet Address ($RECIPIENT_WALLET)"
echo "==============================================================="

AMOUNT2=10000
SECRET2="test_secret_wallet_$(date +%s)"
SECRET2_HASH=$(cast keccak $(cast to-bytes32 $(cast from-utf8 $SECRET2)))
MEMO2="Test payment to wallet $RECIPIENT_WALLET"

echo "Amount: 0.01 USDC"
echo "Secret: $SECRET2"
echo "Secret Hash: $SECRET2_HASH"
echo "Memo: $MEMO2"
echo ""

echo "📤 Sending transaction to create payment..."
TX2=$(cast send $ESCROW_BASE_SEPOLIA "createPaymentExternal(address,uint256,bytes32,uint256,string)" \
    $USDC_BASE_SEPOLIA \
    $AMOUNT2 \
    $SECRET2_HASH \
    $EXPIRY_SECONDS \
    "$MEMO2" \
    --private-key $PRIVATE_KEY \
    --rpc-url $RPC_URL \
    2>&1)

echo "$TX2"
TX2_HASH=$(echo "$TX2" | grep "transactionHash" | awk '{print $2}' || echo "")

if [ -z "$TX2_HASH" ]; then
    echo ""
    echo "❌ ERROR: Failed to get transaction hash for Test 2"
    exit 1
fi

echo ""
echo "✅ Payment created!"
echo "Transaction Hash: $TX2_HASH"
echo ""

echo "⏳ Waiting a few seconds for transactions to settle..."
sleep 3

echo ""
echo "📊 Final Balances"
echo "================="
SENDER_USDC_FINAL=$(cast call $USDC_BASE_SEPOLIA "balanceOf(address)(uint256)" $SENDER_ADDR --rpc-url $RPC_URL 2>/dev/null || echo "0")
SENDER_USDC_FINAL_FMT=$(echo "scale=6; $SENDER_USDC_FINAL / 1000000" | bc 2>/dev/null || echo "0")
echo "Sender USDC Balance: $SENDER_USDC_FINAL_FMT USDC"

RECIPIENT_USDC_FINAL=$(cast call $USDC_BASE_SEPOLIA "balanceOf(address)(uint256)" $RECIPIENT_WALLET --rpc-url $RPC_URL 2>/dev/null || echo "0")
RECIPIENT_USDC_FINAL_FMT=$(echo "scale=6; $RECIPIENT_USDC_FINAL / 1000000" | bc 2>/dev/null || echo "0")
echo "Recipient USDC Balance: $RECIPIENT_USDC_FINAL_FMT USDC (unchanged - payments are in escrow, not transferred yet)"
echo ""

echo "=========================================="
echo "  Test Complete! ✅"
echo "=========================================="
echo ""
echo "📋 Summary:"
echo "  • Payment 1 (Email): 0.01 USDC created"
echo "    - Recipient: $RECIPIENT_EMAIL"
echo "    - Secret: $SECRET1"
echo "    - Tx: $TX1_HASH"
echo "    - Claim with: cast send $ESCROW_BASE_SEPOLIA \"claim(bytes32,bytes32,address)\" [paymentId] $SECRET1_HASH $RECIPIENT_WALLET --private-key [recipient_key] --rpc-url $RPC_URL"
echo ""
echo "  • Payment 2 (Wallet): 0.01 USDC created"
echo "    - Recipient: $RECIPIENT_WALLET"
echo "    - Secret: $SECRET2"
echo "    - Tx: $TX2_HASH"
echo ""
echo "💡 To claim these payments:"
echo "   The recipient needs to call the 'claim' function on the escrow contract"
echo "   with the correct payment ID and the secret (not the hash)."
echo ""
echo "   Note: Since these are email-based payments, the recipient would normally"
echo "   receive a claim link and use the frontend to claim."
