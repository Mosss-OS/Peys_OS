# Deploy WhatsApp Bot to Railway.app (Quick Start Guide)

This will bypass your local network restrictions and give you a reliable WhatsApp bot connection.

## Why Railway?
- Free tier available
- Easy setup (under 10 minutes)
- Typically fewer network restrictions than home/work networks
- Reliable 24/7 operation for WhatsApp Web connections
- Easy to view logs and see QR code

## Step-by-Step Deployment

### 1. Prerequisites
- GitHub account (your code should be in a git repo)
- Railway account (free at [railway.app](https://railway.app))
- Your environment variables ready (see below)

### 2. Prepare Your Code
Make sure your bot code is committed to git:
```bash
cd /home/moses/Desktop/Hackathons/peydot-magic-links/bot
git init
git add .
git commit -m "Initial commit for WhatsApp bot deployment"
```

### 3. Create Railway Project
1. Go to [railway.app](https://railway.app) and sign up/login
2. Click "New Project" → "Deploy from Repo"
3. Connect your GitHub account and select your peydot-magic-links repo
4. Railway will auto-detect it's a Node.js project

### 4. Set Environment Variables
In your Railway project dashboard:
1. Go to "Variables" tab
2. Add these variables (get values from your `.env` file or create them):

```
# Supabase (same as your main app)
SUPABASE_URL=your_supabase_project_url
SUPABASE_ANON_KEY=your_supabase_anon_key
SUPABASE_SERVICE_ROLE_KEY=your_supabase_service_role_key

# Blockchain
RPC_URL=your_blockchain_rpc_url (e.g., from Alchemy/Infura)
ESCROW_CONTRACT_ADDRESS=your_deployed_escrow_contract_address

# App URLs
APP_URL=https://your-frontend-app.vercel.app  # or your frontend URL
FRONTEND_URL=https://your-frontend-app.vercel.app

# Port (Railway sets this automatically, but include for consistency)
PORT=${PORT}

# Optional: For debugging
NODE_ENV=development
```

### 5. Deploy
1. Go to "Deployments" tab
2. Click "Deploy Trigger" → "Deploy Latest"
3. Wait for build and deployment (usually 2-5 minutes)

### 6. Get the QR Code
Once deployed:
1. Go to "Logs" tab in your Railway project
2. Look for the QR code in the logs - it will appear like:
   ```
   === WHATSAPP QR CODE ===
   [actual QR code matrix here]
   ========================
   ```
3. **IMPORTANT:** You have ~2 minutes to scan it before it expires

### 7. Scan the QR Code
1. Open WhatsApp on your phone
2. Go to Settings → Linked Devices → Link a Device
3. Point your phone camera at the QR code in the Railway logs
4. Wait for "Logged in" to appear in the logs
5. Immediately send "menu" to the bot via WhatsApp

## What to Expect When It Works
In your Railway logs, you should see:
```
Peys WhatsApp bot server running on port [PORT]
Health: http://0.0.0.0:[PORT]/health
Connection update: connecting { lastDisconnect: undefined, qr: false }
...
Connection update: open { lastDisconnect: undefined, qr: false }
WhatsApp connection opened
[INFO] Successfully connected to WhatsApp!
=== WHATSAPP QR CODE ===
[QR CODE MATRIX]
========================
```

## First Commands to Try via WhatsApp
Once connected and scanned:
1. Send "menu" - See available options
2. Send "register [your 4-digit PIN]" - Create your test wallet
3. Send "balance" - Check your USDC balance
4. Send "send 10 USDC to test@example.com" - Test payment flow
5. Send "claim" - See pending payments

## Managing Your Deployment
- **View logs**: Railway → Logs tab (real-time)
- **Restart**: Railway → Settings → Restart Application
- **Update variables**: Railway → Variables tab
- **Redeploy**: Make changes to your repo → Railway auto-detects and redeploys (or manual trigger)

## Troubleshooting Deployment Issues
If you don't see a QR code in the logs:
1. Check the full logs for any error messages
2. Verify all environment variables are set correctly
3. Ensure your bot code is the latest version (git push to trigger redeploy)
4. Look for "Connection update: open" in logs - if you see that but no QR code, check if the QR code logging is working

## Benefits of This Approach
✅ Bypasses local network/router/firewall restrictions
✅ Provides reliable 24/7 connection for WhatsApp Web
✅ Easy to scale and manage
✅ Free tier sufficient for development and testing
✅ Simple to update and maintain
✅ Logs are persistent and easy to access

## Next Steps After Successful Deployment
Once you have the WhatsApp bot working via Railway:
1. Test all payment flows thoroughly
2. Replace mock EscrowService with real blockchain-connected version
3. Set up proper environment variables with real keys
4. Test with real testnet transactions
5. Prepare for production deployment

## Need Help?
If you get stuck during deployment:
1. Check Railway's documentation: https://docs.railway.app
2. Look at the deploy logs for specific error messages
3. Verify your Node.js version is compatible (we're using v18+)
4. Ensure your package.json has "type": "module" (we already fixed this)

Would you like me to help you with any specific step of this deployment process?