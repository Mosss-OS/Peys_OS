# Peys - Stablecoin Payment Platform

<div align="center">

![Peys](./docs/images/peydot-logo.png)

**The stablecoin payment OS for the Polkadot ecosystem**

[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](https://opensource.org/licenses/MIT)
[![TypeScript](https://img.shields.io/badge/TypeScript-5.0-blue)](https://www.typescriptlang.org/)
[![React](https://img.shields.io/badge/React-18.3-green)](https://react.dev/)
[![Polkadot](https://img.shields.io/badge/Polkadot-E6007A)](https://polkadot.network/)
[![Hackathon](https://img.shields.io/badge/DoraHacks-2026-orange)](https://dorahacks.io/hackathon/polkadot-solidity-hackathon)

[Website](https://peys.app) · [Documentation](https://docs.peys.app) · [API](https://api.peys.app) · [GitHub](https://github.com/Moses-main/peydot-magic-links)

</div>

---

## What is Peys?

Peys is a **stablecoin payment platform** that enables anyone to send and receive USDC/USDT/PASS payments using **Magic Claim Links**. Built on **Polkadot Asset Hub** with multi-chain support including Base, Celo, and Ethereum.

### Why Peys?

- **No wallet required** - Recipients claim via email, no crypto experience needed
- **Near-zero fees** - ~$0.01 per transaction on Polkadot
- **Multi-chain** - Deploy on Polkadot, Base, Celo, or Ethereum
- **Secure escrow** - Funds locked until claimed
- **Auto-refunds** - Unclaimed payments return after 7 days

### Hackathon Highlights

| Track | Status |
|-------|--------|
| OpenZeppelin Sponsor Track | ✅ Eligible ($1000 bounty) |
| DeFi / Stablecoin dapps | ✅ Working |
| AI-powered dapps | 🔶 Payment Assistant |
| Polkadot Native Assets | ✅ PASS token |
| Precompiles | ✅ ERC20 |

---

## Quick Start

### Installation

```bash
# Clone the repository
git clone https://github.com/Moses-main/peydot-magic-links.git
cd peydot-magic-links

# Install dependencies
npm install

# Copy environment variables
cp .env.example .env
```

### Environment Setup

Update `.env` with your credentials:

```env
# Privy Authentication (Required)
VITE_PRIVY_APP_ID=your-privy-app-id

# Polkadot Asset Hub Configuration
VITE_RPC_URL_POLKADOT=https://eth-asset-hub-paseo.dotters.network
VITE_ESCROW_CONTRACT_ADDRESS_POLKADOT=***REMOVED***
VITE_USDC_ADDRESS_POLKADOT=0x0000000000000000000000000000000000000D39
VITE_PASS_ADDRESS_POLKADOT=0x00000001000000000000000000000000000007c0

# Base Sepolia Configuration
VITE_ESCROW_CONTRACT_ADDRESS_BASE_SEPOLIA=***REMOVED***
VITE_USDC_ADDRESS_BASE_SEPOLIA=0x036CbD53842c5426634e7929541eC2318f3dCF7e

# Supabase (Optional for features)
VITE_SUPABASE_URL=your-supabase-url
VITE_SUPABASE_PUBLISHABLE_KEY=your-supabase-key
```

### Start Development Server

```bash
npm run dev
```

### Add Polkadot Asset Hub to MetaMask

If using MetaMask, add this network:

| Field | Value |
|-------|-------|
| **Network Name** | Polkadot Asset Hub Testnet |
| **Chain ID** | 420420417 |
| **RPC URL** | https://eth-asset-hub-paseo.dotters.network |
| **Currency Symbol** | PAS |
| **Block Explorer** | https://polkadot.testnet.routescan.io |

---

## Wallet Integration

### Supported Wallets

| Wallet | Status | Notes |
|--------|--------|-------|
| **Privy Embedded** | ✅ Full | Auto-created on email login |
| **MetaMask** | ✅ Full | Add Polkadot network manually |
| **Coinbase Wallet** | ✅ Full | Built-in Polkadot support |
| **WalletConnect** | ✅ Full | Connect any wallet |

### Login Methods

1. **Email Magic Link** - No wallet needed initially
2. **Google/Apple** - OAuth with embedded wallet
3. **External Wallet** - MetaMask, Coinbase, etc.

### User Flow

```mermaid
graph TD
    A[User Opens App] --> B{Choose Login Method}
    B -->|Email| C[Send Magic Link]
    B -->|Google/Apple| D[OAuth Flow]
    B -->|Wallet| E[Connect MetaMask]
    C --> F[Embedded Wallet Created]
    D --> F
    E --> F
    F --> G[Switch to Polkadot]
    G --> H[Ready to Use]
```

---

## Quick Start

```bash
# Clone the repository
git clone https://github.com/Moses-main/peydot-magic-links.git
cd peydot-magic-links

# Install dependencies
npm install

# Copy environment file
cp .env.example .env

# Start development server
npm run dev
```

### Create a Payment

```typescript
import { Peys } from '@peys/sdk';

const peys = new Peys({ apiKey: 'your_api_key' });

const payment = await peys.payments.create({
  amount: 100,
  token: 'USDC',
  recipient: 'recipient@email.com',
  message: 'Thanks for the work!'
});

console.log(payment.link);
// https://peys.app/claim/abc123
```

---

## Architecture

### System Overview

```mermaid
flowchart TB
    subgraph Frontend["FRONTEND (React + Vite)"]
        Send[Send Page]
        Claim[Claim Page]
        Dashboard[Dashboard]
        AI[AI Assistant]
        Wagmi[Wagmi + Viem]
    end
    
    subgraph Blockchain["BLOCKCHAIN LAYER"]
        Polkadot[Polkadot Asset Hub<br/>Chain: 420420417]
        Base[Base Sepolia<br/>Chain: 84532]
        Celo[Celo Alfajores<br/>Chain: 44787]
        Escrow[PeysEscrow.sol]
        Streaming[PeyStreaming.sol]
        Batch[PeyBatchPayroll.sol]
    end
    
    subgraph Backend["BACKEND (Supabase)"]
        DB[(PostgreSQL)]
        Edge[Edge Functions]
        Auth[Auth]
        Webhooks[Webhooks]
    end
    
    subgraph External["EXTERNAL SERVICES"]
        Resend[Resend<br/>Email]
        Privy[Privy<br/>Embedded Wallets]
        OpenAI[OpenAI<br/>AI Assistant]
        WhatsApp[WhatsApp<br/>Notifications]
    end
    
    Frontend -->|Transactions| Wagmi
    Wagmi -->|EVM Calls| Polkadot
    Wagmi -->|EVM Calls| Base
    Wagmi -->|EVM Calls| Celo
    
    Polkadot --> Escrow
    Polkadot --> Streaming
    Polkadot --> Batch
    
    Frontend -->|API Calls| Edge
    Edge --> DB
    Edge --> Resend
    Edge --> OpenAI
    Edge --> WhatsApp
    
    Auth --> Privy
    Webhooks --> External
```

### Payment Flow

```mermaid
sequenceDiagram
    participant S as Sender
    participant F as Frontend
    participant C as Smart Contract
    participant R as Resend
    participant Re as Recipient
    participant P as Privy
    
    S->>F: Connect Wallet
    S->>F: Create Payment<br/>(token, amount, email)
    F->>C: createPayment()<br/>Funds locked in escrow
    C-->>F: Payment created<br/>Transaction hash
    F->>R: Send email notification<br/>with claim link
    R->>Re: Email with claim link
    Re->>F: Click claim link
    Re->>P: Sign up with email<br/>(auto-create wallet)
    F->>C: claim()<br/>Transfer funds
    C-->>Re: Funds released<br/>to recipient wallet
```

### Smart Contracts

```mermaid
classDiagram
    class PeysEscrow {
        +address owner
        +bool paused
        +uint256 platformFee
        +createPayment()
        +claim()
        +refundAfterExpiry()
        +pause()
        +unpause()
    }
    
    class PeyStreaming {
        +IERC20 TOKEN
        +createStream()
        +pauseStream()
        +cancelStream()
        +claimStream()
    }
    
    class PeyBatchPayroll {
        +IERC20 TOKEN
        +address admin
        +createBatch()
        +executeBatch()
        +createPayroll()
        +processPayroll()
    }
    
    PeysEscrow --|> Ownable
    PeysEscrow --|> ReentrancyGuard
    PeyStreaming --|> ReentrancyGuard
    PeyBatchPayroll --|> ReentrancyGuard
```

### Database Schema

```mermaid
erDiagram
    profiles {
        uuid id
        uuid user_id
        string email
        string wallet_address
        timestamp created_at
        timestamp updated_at
    }
    
    payments {
        uuid id
        string payment_id
        uuid sender_id
        string recipient_email
        string token
        decimal amount
        integer chain_id
        string status
        string tx_hash
        string claim_link
        timestamp expires_at
        timestamp created_at
    }
    
    notifications {
        uuid id
        uuid user_id
        string type
        string status
        timestamp sent_at
        timestamp delivered_at
    }
    
    api_keys {
        uuid id
        uuid user_id
        string key_hash
        string name
        timestamp last_used
        timestamp created_at
    }
    
    profiles ||--o{ payments : "creates"
    profiles ||--o{ notifications : "receives"
    profiles ||--o{ api_keys : "owns"
```

---

## Supported Networks

| Network | Chain ID | Status | Tokens | RPC |
|---------|----------|--------|--------|-----|
| **Polkadot Asset Hub** (Paseo) | 420420417 | ✅ Active | PASS | `https://eth-rpc-testnet.polkadot.io` |
| **Base Sepolia** | 84532 | ✅ Active | USDC | `https://sepolia.base.org` |
| **Celo Alfajores** | 44787 | ✅ Active | USDC, USDT | `https://alfajores-forno.celo-testnet.org` |
| **Base Mainnet** | 8453 | 🔶 Coming Soon | USDC, USDT | `https://mainnet.base.org` |
| **Ethereum Mainnet** | 1 | 🔶 Coming Soon | USDC, USDT | `https://eth.llamarpc.com` |

---

## API Reference

### REST Endpoints

```base
https://api.peys.app/v1
```

### Authentication

```bash
curl -H "Authorization: Bearer sk_live_..." \
     https://api.peys.app/v1/payments
```

### Key Endpoints

| Method | Endpoint | Description |
|--------|----------|-------------|
| POST | `/v1/payments` | Create a payment |
| GET | `/v1/payments/:id` | Get payment details |
| POST | `/v1/payments/:id/claim` | Claim a payment |
| GET | `/v1/payments` | List payments |
| GET | `/v1/balance` | Get account balance |
| POST | `/v1/webhooks` | Register webhook |

### Webhook Events

- `payment.created` - New payment created
- `payment.claimed` - Payment claimed
- `payment.expired` - Payment link expired
- `payment.refunded` - Payment refunded

---

## Tech Stack

### Frontend
- **React 18** - UI Framework
- **TypeScript** - Type Safety
- **Vite** - Build Tool
- **Wagmi + Viem** - Blockchain Interactions
- **Privy** - Embedded Wallets
- **Tailwind CSS** - Styling
- **Framer Motion** - Animations

### Backend
- **Supabase** - Database & Edge Functions
- **PostgreSQL** - Data Persistence
- **Resend** - Email Service
- **Deno** - Edge Runtime

### Smart Contracts
- **Solidity 0.8** - Contract Language
- **Foundry** - Development Framework
- **OpenZeppelin** - Security Libraries

### Infrastructure
- **Vercel** - Frontend Hosting
- **Polkadot** - Multi-chain Support

---

## Deployment

### Smart Contracts

```bash
cd contracts

# Build contracts
forge build

# Deploy to Polkadot Testnet
forge script script/DeployPolkadot.s.sol --rpc-url polkadotHubTestnet --broadcast --private-key $PRIVATE_KEY
```

### Frontend

```bash
# Build for production
npm run build

# Deploy to Vercel
vercel --prod
```

### Environment Variables

See `.env.example` for required configuration.

---

## Hackathon Submission

### Demo Video

Watch our demo: [Peys Demo Video](./docs/demo-video.md)

### Key Features Implemented

1. ✅ Magic Claim Links - Send crypto via email
2. ✅ Multi-chain Support - Polkadot, Base, Celo
3. ✅ PASS Token - Native Polkadot asset via ERC20 precompile
4. ✅ OpenZeppelin Contracts - Ownable, ReentrancyGuard
5. ✅ AI Payment Assistant - Natural language interface
6. ✅ WhatsApp Notifications - Alternative delivery
7. ✅ Embedded Wallets - Privy integration

### Contract Addresses

| Network | Escrow Contract |
|---------|-----------------|
| Polkadot (Paseo) | `***REMOVED***` |
| Base Sepolia | `***REMOVED***` |
| Celo Alfajores | `***REMOVED***` |

> Note: PeyStreaming and PeyBatchPayroll contracts pending deployment.

---

## Contributing

See [CONTRIBUTING.md](./CONTRIBUTING.md) for details.

---

## License

See [LICENSE](./LICENSE) for details.

---

## Support

- **Email**: peys.xyz@gmail.com
- **Discord**: [Join our community](https://discord.gg/peys)
- **X**: [@Peys_io](https://x.com/Peys_io)
- **GitHub**: [Open an issue](https://github.com/Moses-main/peydot-magic-links/issues)

---

<div align="center">

**Built for the future of payments** 🌍

[![Powered by Polkadot](https://img.shields.io/badge/Powered%20by-Polkadot-E6007A?style=for-the-badge)](https://polkadot.network/)
[![DoraHacks 2026](https://img.shields.io/badge/DoraHacks-2026-orange?style=for-the-badge)](https://dorahacks.io)

</div>
