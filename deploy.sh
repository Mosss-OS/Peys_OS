#!/bin/bash

# PeyDot Deployment Script
# Usage: ./deploy.sh

set -e

echo "=========================================="
echo "PeyDot Smart Contract Deployment"
echo "=========================================="

# Check if .env file exists
if [ ! -f ".env" ]; then
    echo "Error: .env file not found!"
    echo "Please copy foundry.env.example to .env and fill in your values"
    exit 1
fi

# Load environment variables
source .env

# Check PRIVATE_KEY
if [ -z "$PRIVATE_KEY" ] || [ "$PRIVATE_KEY" == "your_private_key_here" ]; then
    echo "Error: PRIVATE_KEY not set in .env!"
    echo "Please add your private key to .env"
    exit 1
fi

# Check NETWORK
if [ -z "$NETWORK" ]; then
    echo "Error: NETWORK not set in .env!"
    echo "Please set NETWORK in .env (e.g., polkadotHubTestnet)"
    exit 1
fi

# Get RPC URL based on network
RPC_URL_VAR="${NETWORK}_RPC_URL"
RPC_URL=${!RPC_URL_VAR}

if [ -z "$RPC_URL" ]; then
    echo "Error: RPC URL not found for network: $NETWORK"
    exit 1
fi

echo "Network: $NETWORK"
echo "RPC URL: $RPC_URL"
echo "Deployer: $(cast wallet address $PRIVATE_KEY)"
echo ""

# Build contracts first
echo "Building contracts..."
forge build

# Deploy
echo ""
echo "Deploying PeyDotEscrow..."
forge script script/Deploy.s.sol --rpc-url "$RPC_URL" --broadcast --verify

echo ""
echo "=========================================="
echo "Deployment Complete!"
echo "=========================================="
echo ""
echo "IMPORTANT: Update your .env file with the deployed contract address:"
echo "  ESCROW_CONTRACT_ADDRESS=<address_from_output>"
echo ""
echo "Then update your frontend .env:"
echo "  VITE_ESCROW_CONTRACT_ADDRESS=<address_from_output>"
