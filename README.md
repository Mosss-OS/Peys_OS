# PeyDot - Magic Claim Links for P2P Payments

<div align="center">

![PeyDot](./docs/images/peydot-logo.png)

**Zero-friction stablecoin payments for everyone**

[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](https://opensource.org/licenses/MIT)
[![Solidity](https://img.shields.io/badge/Solidity-0.8.20-blue)](https://docs.soliditylang.org/)
[![React](https://img.shields.io/badge/React-18.3-green)](https://react.dev/)
[![TypeScript](https://img.shields.io/badge/TypeScript-5.0-blue)](https://www.typescriptlang.org/)
[![Base](https://img.shields.io/badge/Base-Sepolia-0056FF)](https://base.org/)
[![Celo](https://img.shields.io/badge/Celo-Alfajores-35D07F)](https://celo.org/)
[![Polkadot](https://img.shields.io/badge/Polkadot-Hub-E6007A)](https://polkadot.network/)

</div>

---

## Overview

PeyDot is a revolutionary P2P payments application that enables anyone to send and receive stablecoins (USDC/USDT) using **Magic Claim Links**. Recipients can claim funds via email without needing a pre-existing wallet or account.

### The Problem

Traditional crypto payments require:
- Recipient must have a wallet
- Recipient must understand seed phrases
- Complex gas fee concepts
- Multiple steps to receive funds

### The Solution

PeyDot's **Magic Claim Links** allow senders to create secure, time-limited links where recipients can:
1. Click the link to open PeyDot
2. Sign up with email (via Privy)
3. Auto-create an embedded wallet
4. Claim funds with 1-click
5. Withdraw to any address

---

## Features

- 🌍 **Multi-Chain Support** - Send on Base, Celo, or Polkadot with one tap
- 🔗 **Magic Claim Links** - Send crypto via email, recipient claims with one click
- 🔐 **Escrow Security** - Funds held securely in smart contract until claimed
- ⏰ **Auto-expiry** - Unclaimed payments auto-refund after 7 days
- 📧 **Email Notifications** - Recipients get notified when they receive funds
- 📊 **Real-time Tracking** - Dashboard shows all sent/received payments
- 🎨 **Beautiful UX** - Intuitive network selector, color-coded chains
- ✅ **Testnet Ready** - Fully tested on Base Sepolia, Celo Alfajores

---

## Supported Networks

| Network | Chain ID | Status | USDC Token |
|---------|----------|--------|-------------|
| **Base Sepolia** | 84532 | ✅ Active | `0x036CbD53842c5426634e7929541eC2318f3dCF7e` |
| **Celo Alfajores** | 44787 | ✅ Active | `0x2F25deB3848C207fc8E0c34035B3Ba7fC157602B` |
| **Polkadot Asset Hub** | 420420421 | ✅ Active | Asset ID 1337 |

---

## Tech Stack

### Frontend
- **React 18** - UI framework
- **TypeScript** - Type safety
- **Vite** - Build tool
- **Wagmi + Viem** - Ethereum interactions
- **Privy** - Embedded wallet & auth
- **Tailwind CSS** - Styling
- **Shadcn UI** - Component library
- **Framer Motion** - Animations

### Backend
- **Supabase** - Database & Edge Functions
- **PostgreSQL** - Data persistence
- **Resend** - Email notifications

### Smart Contracts
- **Solidity 0.8** - Smart contract language
- **Foundry** - Testing & deployment

---

## Quick Start

### Prerequisites

- Node.js 18+
- npm or yarn
- MetaMask or other Web3 wallet
- Supabase account (free tier)

### Installation

```bash
# Clone the repository
git clone https://github.com/Moses-main/peydot-magic-links.git
cd peydot-magic-links

# Install dependencies
npm install
```

### Environment Setup

```bash
# Copy environment file
cp .env.example .env
```

Update `.env` with your values:

```env
# Supabase (get from https://supabase.com)
VITE_SUPABASE_URL=your_supabase_url
VITE_SUPABASE_PUBLISHABLE_KEY=your_publishable_key

# Privy (get from https://dashboard.privy.io)
VITE_PRIVY_APP_ID=your_privy_app_id

# RPC URLs
VITE_RPC_URL_BASE_SEPOLIA=https://base-sepolia.g.alchemy.com/v2/your-api-key
VITE_RPC_URL_CELO=https://alfajores-forno.celo-testnet.org
VITE_RPC_URL_POLKADOT=https://eth-asset-hub-paseo.dotters.network

# Contract Addresses
VITE_ESCROW_CONTRACT_ADDRESS_BASE_SEPOLIA=***REMOVED***
VITE_USDC_ADDRESS_BASE_SEPOLIA=0x036CbD53842c5426634e7929541eC2318f3dCF7e
```

### Run Development Server

```bash
npm run dev
```

Open http://localhost:8080 to view the app.

---

## How It Works

### For Senders

1. **Connect Wallet** - Sign in with email or connect wallet
2. **Select Network** - Choose Base, Celo, or Polkadot
3. **Enter Details** - Amount, token (USDC/USDT), recipient email
4. **Confirm & Send** - Approve transaction
5. **Share Link** - Recipient gets email notification with claim link

### For Recipients

1. **Receive Email** - Click claim link in notification
2. **Sign Up** - Create account with email (auto-wallet created)
3. **Claim Funds** - One-click claim to your wallet
4. **Withdraw** - Send to any address

---

## Smart Contract

### Deployment

```bash
cd contracts

# Deploy to Base Sepolia (testnet)
forge script script/DeployBaseSepolia.s.sol --rpc-url $BASE_SEPOLIA_RPC --broadcast

# Deploy to Celo Alfajores
forge script script/DeployCeloAlfajores.s.sol --rpc-url $CELO_ALFAJORES_RPC --broadcast

# Deploy to Base Mainnet
forge script script/DeployBase.s.sol --rpc-url $BASE_RPC --broadcast
```

### Contract Addresses

| Network | Escrow Contract | USDC Token | Explorer |
|---------|---------------|------------|----------|
| Base Sepolia | `***REMOVED***` | `0x036CbD53842c5426634e7929541eC2318f3dCF7e` | [Basescan](https://sepolia.basescan.org) |
| Celo Alfajores | `0x0000000000000000000000000000000000000001` | `0x2F25deB3848C207fc8E0c34035B3Ba7fC157602B` | [CeloScan](https://alfajores.celoscan.io) |

---

## Architecture

```
┌─────────────┐     ┌─────────────┐     ┌─────────────┐
│   Sender    │────▶│  Frontend   │────▶│ Supabase    │
│  (Wallet)   │     │   (React)   │     │  (Backend)  │
└─────────────┘     └─────────────┘     └─────────────┘
                           │                   │
                           ▼                   ▼
                    ┌─────────────┐     ┌─────────────┐
                    │  Escrow     │     │   Resend    │
                    │  Contract   │     │  (Email)    │
                    └─────────────┘     └─────────────┘
                           │
                           ▼
                    ┌─────────────┐
                    │  Recipient │
                    │  (Claim)   │
                    └─────────────┘
```

### Flow

1. **Sender** creates payment in frontend, selects network
2. **Frontend** calls Supabase edge function to create payment record
3. **Smart Contract** locks funds in escrow on chosen network
4. **Supabase** sends email with claim link to recipient
5. **Recipient** clicks link, signs up via Privy
6. **Recipient** claims payment - funds transferred to their wallet
7. **Sender** notified when payment is claimed

---

## API Reference

### Edge Functions

| Function | Description |
|----------|-------------|
| `create-payment` | Create a new payment and escrow |
| `claim-payment` | Claim a pending payment |
| `get-payment` | Get payment details by claim link |
| `get-user-payments` | List user's sent/received payments |
| `send-payment-notification` | Send email notification to recipient |
| `payment-assistant` | AI-powered payment assistance |

### Database Schema

- **profiles** - User wallet mappings
- **payments** - Payment records with escrow info
- **notifications** - In-app notifications

---

## Contributing

We welcome contributions! Please see our [Contributing Guide](./CONTRIBUTING.md) for details.

### Development Workflow

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Run tests
5. Submit a pull request

---

## Support

- **Discord**: [Join our community](https://discord.gg/peydot)
- **Email**: peys.xyz@gmail.com
- **Twitter**: [@peydot_io](https://twitter.com/peydot_io)

---

## License

MIT License - see [LICENSE](./LICENSE) for details.

---

## Acknowledgments

- [Base](https://base.org/) - Ethereum L2 network
- [Celo](https://celo.org/) - Mobile-first blockchain
- [Polkadot](https://polkadot.network/) - Multi-chain ecosystem
- [Circle](https://circle.com/) - USDC stablecoin
- [Privy](https://privy.io/) - Embedded wallets

---

<div align="center">

**Built with ❤️ for the future of payments**

</div>
