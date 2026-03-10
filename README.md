# PeyDot - Magic Claim Links for P2P Payments

<div align="center">

![PeyDot](./docs/images/peydot-logo.png)

**Zero-friction stablecoin payments for everyone**

[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](https://opensource.org/licenses/MIT)
[![Solidity](https://img.shields.io/badge/Solidity-0.8.20-blue)](https://docs.soliditylang.org/)
[![React](https://img.shields.io/badge/React-18.3-green)](https://react.dev/)
[![TypeScript](https://img.shields.io/badge/TypeScript-5.0-blue)](https://www.typescriptlang.org/)
[![Base](https://img.shields.io/badge/Base-Sepolia-0056FF)](https://base.org/)

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

- **Magic Claim Links** - Send crypto via email, recipient claims with one click
- **Multi-chain Support** - Deploy on Base, Celo, and Polkadot Asset Hub
- **Escrow Security** - Funds held securely in smart contract until claimed
- **Auto-expiry** - Unclaimed payments auto-refund after 7 days
- **Email Notifications** - Recipients get notified when they receive funds
- **Real-time Tracking** - Dashboard shows all sent/received payments
- **Testnet Ready** - Fully tested on Base Sepolia, Celo Alfajores

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

# Update with your values:
# - VITE_PRIVY_APP_ID from https://dashboard.privy.io
# - SUPABASE_URL and keys from your Supabase project
# - RPC URLs for your chosen networks
```

### Run Development Server

```bash
npm run dev
```

Open http://localhost:8080 to view the app.

---

## Smart Contract

### Deployment

```bash
cd contracts

# Deploy to Base Sepolia (testnet)
forge script script/DeployBaseSepolia.s.sol --rpc-url $BASE_SEPOLIA_RPC --broadcast

# Deploy to Base Mainnet
forge script script/DeployBase.s.sol --rpc-url $BASE_RPC --broadcast
```

### Contract Addresses

| Network | Escrow Contract | USDC Token |
|---------|---------------|------------|
| Base Sepolia | `***REMOVED***` | `0x036CbD53842c5426634e7929541eC2318f3dCF7e` |
| Celo Alfajores | `0x0000000000000000000000000000000000000001` | `0x2F25deB3848C207fc8E0c34035B3Ba7fC157602B` |

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
                    │  Recipient  │
                    │  (Claim)    │
                    └─────────────┘
```

### Flow

1. **Sender** creates payment in frontend
2. **Frontend** calls Supabase edge function to create payment record
3. **Smart Contract** locks funds in escrow
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
4. Submit a pull request

---

## Support

- **Discord**: [Join our community](https://discord.gg/peydot)
- **Email**: support@peydot.io
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
