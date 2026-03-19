# Peys — Stablecoin Payments via Magic Links

Send USDC/USDT/PASS to anyone using a magic claim link — no wallet required on the recipient's end. Built on Base, Celo, and Polkadot.

## Project Structure

```
peydot-magic-links/
├── src/              # React 18 + TypeScript frontend (Vite)
├── server/           # Express backend (shared API)
├── bot/              # WhatsApp bot (Baileys) — deploy separately
│   ├── server/       # Bot server entry point
│   ├── migrations/   # SQL migrations
│   ├── .env.example
│   └── README.md
├── contracts/        # Solidity smart contracts (Foundry)
├── supabase/         # Supabase Edge Functions + migrations
├── sdks/             # JS, Python, Go SDKs
└── docs/             # API reference
```

## Main App Setup

```bash
npm install
cp .env.example .env   # fill in your values
npm run dev
```

## WhatsApp Bot Setup

The bot runs separately on a persistent server (Railway, Render, VPS). See [`bot/README.md`](./bot/README.md) for full setup.

```bash
cd bot
npm install
cp .env.example .env
npm start              # scan the QR code on first run
```

## Environment Variables

| Variable | Description |
|---|---|
| `VITE_SUPABASE_URL` | Supabase project URL |
| `VITE_SUPABASE_ANON_KEY` | Supabase anon key |
| `VITE_PRIVY_APP_ID` | Privy app ID for embedded wallets |
| `VITE_WALLETCONNECT_PROJECT_ID` | WalletConnect project ID |

See `.env.example` for the full list.

## Hosting

| Part | Platform |
|---|---|
| Frontend (`src/`) | Vercel |
| Backend (`server/`) | Railway / Render |
| WhatsApp bot (`bot/`) | Railway / Render / VPS (must be persistent) |
| Database | Supabase |
| Contracts | Base Sepolia, Celo Alfajores, Polkadot |

## Smart Contracts

Contracts are in `contracts/src/`. Deploy with Foundry:

```bash
forge build
forge script script/Deploy.s.sol --rpc-url $RPC_URL --broadcast
```

## License

MIT
