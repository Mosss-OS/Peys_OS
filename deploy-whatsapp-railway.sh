#!/bin/bash

# Deploy WhatsApp Bot to Railway
# This script deploys the WhatsApp bot to Railway

echo "🚀 Deploying WhatsApp Bot to Railway..."

# Check if railway CLI is installed
if ! command -v railway &> /dev/null; then
    echo "Installing Railway CLI..."
    npm install -g @railway/cli
fi

# Check if logged in
if ! railway whoami &> /dev/null; then
    echo "Please login to Railway first:"
    echo "  railway login"
    echo ""
    echo "Or create a new project and link it:"
    echo "  railway init"
    echo "  railway link"
    exit 1
fi

# Navigate to whatsapp directory
cd whatsapp

# Deploy
echo "Deploying..."
railway up --service whatsapp-bot

echo "✅ Deployment complete!"
echo ""
echo "Check status: railway status"
echo "View logs: railway logs"
echo "Set environment variables: railway variables set KEY=VALUE"
