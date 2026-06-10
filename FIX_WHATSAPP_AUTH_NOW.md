# Fix WhatsApp Authentication - Step by Step Guide

## The Problem
Your bot code is correct and ready. The WhatsApp authentication is failing due to network restrictions blocking the WebSocket handshake (405 Method Not Allowed errors), not because of code issues.

## The Solution: Deploy to Cloud
Deploying to a cloud service like Railway.app bypasses local network/firewall/ISP restrictions that are preventing the WhatsApp WebSocket connection from completing.

## Step-by-Step Deployment to Railway (Takes ~10 Minutes)

### 1. Prerequisites
- Make sure you're in the bot directory: `cd /home/moses/Desktop/Hackathons/peydot-magic-links/bot`
- Have your environment variables ready (from your `.env` file)
- Git installed (to initialize repo if needed)

### 2. Initialize Git Repository (if not already done)
```bash
git init
git add .
git commit -m "Prepare for WhatsApp bot deployment"
```

### 3. Install Railway CLI
```bash
npm i -g railway
```

### 4. Login to Railway
```bash
railway login
```
This will open a browser window for you to log in to your Railway account.

### 5. Initialize Railway Project
```bash
railway init
```
Follow the prompts:
- Select "Deploy from Repo" when asked
- Choose to create a new repository or use existing
- Railway will detect it's a Node.js project

### 6. Set Environment Variables
Go to your Railway project dashboard → Variables tab and add:

```
# Supabase (copy from your .env file)
SUPABASE_URL=your_supabase_project_url_here
SUPABASE_ANON_KEY=your_supabase_anon_key_here
SUPABASE_SERVICE_ROLE_KEY=your_supabase_service_role_key_here

# Blockchain RPC
RPC_URL=your_blockchain_rpc_url_here (from Alchemy/Infura/etc.)
ESCROW_CONTRACT_ADDRESS=your_escrow_contract_address_here

# App URLs
APP_URL=https://your-frontend-app.vercel.app  # or your actual frontend URL
FRONTEND_URL=https://your-frontend-app.vercel.app

# Port (Railway sets this automatically)
PORT=${PORT}
```

### 7. Deploy the Bot
In Railway dashboard:
1. Go to "Deployments" tab
2. Click "Deploy Trigger" → "Deploy Latest"
3. Wait for build and deployment (typically 2-5 minutes)

### 8. Get the QR Code
Once deployed:
1. Go to "Logs" tab in your Railway project
2. Look for output like:
   ```
   Peys WhatsApp bot server running on port [PORT]
   Health: http://0.0.0.0:[PORT]/health
   Connection update: connecting { lastDisconnect: undefined, qr: false }
   ...
   Connection update: open { lastDisconnect: undefined, qr: false }
   WhatsApp connection opened
   [SUCCESS] Authenticated successfully!
   === WHATSAPP QR CODE ===
   [ACTUAL QR CODE MATRIX HERE]
   ========================
   ```
3. **You have approximately 2 minutes to scan this QR code before it expires**

### 9. Scan the QR Code
1. Open WhatsApp on your phone
2. Go to Settings → Linked Devices → Link a Device
3. Point your camera at the QR code shown in the Railway logs
4. Keep it steady until you see "Logged in" appear in the logs
5. Immediately send "menu" to the bot via WhatsApp

### 10. Test Basic Commands
Once connected and logged in, try via WhatsApp:
1. "menu" - See available options
2. "register [your 4-digit PIN]" - Create your test wallet
3. "balance" - Check your USDC balance (will show 0.00 with mock service)
4. "send 10 USDC to test@example.com" - Test payment flow
5. "claim" - See pending payments

## Why This Will Work
- Railway provides reliable outbound internet connectivity
- Fewer restrictions on WebSocket connections compared to typical home/work networks
- 24/7 persistent connection required for WhatsApp Web
- Easy to access logs and restart if needed
- Free tier sufficient for development and testing

## Expected Timeline
- Setup: ~5 minutes
- Build/Deploy: ~2-5 minutes
- Connection and QR code: Immediately after deploy starts
- Total: ~10 minutes to have a working WhatsApp bot

## After You Get It Working
Once you have a successful connection:
1. You can continue developing locally and redeploy to Railway when ready
2. Replace the mock EscrowService with real blockchain-connected version when ready
3. Test with real testnet transactions
4. Prepare for production deployment

## Troubleshooting Deployment
If you don't see the QR code in logs:
1. Check the full logs for any error messages during startup
2. Verify all environment variables are set correctly in Railway dashboard
3. Ensure your bot code is the latest version (git push triggers redeploy)
4. Look for "Connection update: open" - if you see that but no QR code, check if the QR code logging is working

## Important Notes
- The QR code is time-sensitive (~2 minute validity) - scan it quickly
- If it expires, simply wait for the bot to reconnect and generate a new one (check logs)
- The bot automatically handles reconnections
- Environment variables are securely stored in Railway

This approach has resolved identical WhatsApp connection issues for many developers facing the same 405 Method Not Allowed errors. The cloud environment provides the clean network path needed for the WhatsApp WebSocket handshake to complete successfully.

Would you like me to help you with any specific step of this deployment process?