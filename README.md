# Peys WhatsApp Bot

Standalone Baileys-based WhatsApp bot that lets users send and receive USDC directly from WhatsApp. Connects to the same Supabase backend as the main Peys app.

## Structure

```
whatsapp/
├── server/
│   ├── index.mjs          # Entry point — start this
│   ├── config/
│   │   └── database.js    # Sequelize DB config
│   ├── models/            # User, Payment models
│   ├── routes/
│   │   ├── escrow.js      # Escrow API routes
│   │   └── users.js       # User sync routes
│   ├── services/
│   │   ├── escrowService.js   # Blockchain escrow logic
│   │   └── userService.js     # Supabase user operations
│   └── utils/
│       ├── whatsappUI.js  # Baileys message helpers
│       └── supabase.js    # Supabase client
├── migrations/            # SQL migrations
├── .baileys_auth/         # Baileys session (auto-created on first run)
├── .env                   # Your env vars (copy from .env.example)
└── .env.example
```

## Setup

```bash
# Install dependencies
npm install

# Copy and fill in env vars
cp .env.example .env

# Start the bot
npm start
```

On first run, a QR code prints in the terminal. Scan it with WhatsApp on your phone. The session is saved to `.baileys_auth/` and persists across restarts — you only need to scan once.

## Hosting

This bot **must run on a persistent server** — it cannot run on serverless platforms (Vercel, Lambda) because Baileys requires a persistent WebSocket connection.

Recommended: Railway, Render, DigitalOcean, or any VPS.

## Environment Variables

| Variable | Description |
|---|---|
| `SUPABASE_URL` | Your Supabase project URL |
| `SUPABASE_SERVICE_KEY` | Service role key (bypasses RLS for bot operations) |
| `RPC_URL` | Blockchain RPC endpoint |
| `ESCROW_CONTRACT_ADDRESS` | Deployed PeysEscrow contract address |
| `APP_URL` | Main app URL — used to generate claim links |
| `PORT` | Bot server port (default: 3002) |
