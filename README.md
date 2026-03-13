# Peys - Stablecoin Payment Platform

![PeyDot](./docs/images/peydot-logo.png)

**The stablecoin payment OS for the Polkadot ecosystem**

[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](https://opensource.org/licenses/MIT)
[![TypeScript](https://img.shields.io/badge/TypeScript-5.0-blue)](https://www.typescriptlang.org/)
[![React](https://img.shields.io/badge/React-18.3-green)](https://react.dev/)
[![Polkadot](https://img.shields.io/badge/Polkadot-E6007A)](https://polkadot.network/)

[Website](https://peys.app) · [Documentation](https://peys.app/docs) · [X](https://x.com/Peys_io) · [GitHub](https://github.com/Moses-main/peydot-magic-links)

</div>

---

## What is Peys?

Peys (formerly PeyDot) is a **stablecoin payment platform** that enables anyone to send and receive USDC and USDT payments using **Magic Claim Links**. It's built on the Polkadot Asset Hub and supports multiple chains including Base, Celo, and Polkadot.

### Core Functionality

**Magic Claim Links** allow senders to send crypto via email. The flow works as follows:

1. **Sender** connects their wallet and creates a payment with recipient's email
2. **Smart Contract** locks funds in escrow with a secure claim hash
3. **Email** is sent to recipient via Resend with a unique claim link
4. **Recipient** clicks the link, signs up with email (auto-creates embedded wallet via Privy)
5. **Claim** executes the smart contract to transfer funds to recipient's wallet

### Key Features

- **No pre-existing wallet needed** - Recipients sign up via email
- **Auto wallet creation** - Privy creates embedded wallets automatically
- **Secure escrow** - Funds held in smart contracts until claimed
- **Time-limited links** - 7-day expiry with automatic refunds
- **Multi-chain support** - Base Sepolia, Celo Alfajores, Polkadot Asset Hub
- **Email notifications** - Resend integration for claim links

### Architecture Overview

```
┌─────────────────────────────────────────────────────────────┐
│                     Frontend (React/Vite)                   │
│  ┌─────────────┐  ┌─────────────┐  ┌─────────────┐          │
│  │  Send Page  │  │  Claim Page │  │  Dashboard  │          │
│  └─────────────┘  └─────────────┘  └─────────────┘          │
│           │               │               │                 │
│  ┌─────────────────────────────────────────────┐            │
│  │         Wagmi + Viem (Blockchain)           │            │
│  └─────────────────────────────────────────────┘            │
└──────────────────┬──────────────────────────┬────────────────┘
                   │                          │
┌──────────────────▼──────────────────────────▼────────────────┐
│              Backend (Supabase + Resend)                     │
│  ┌─────────────┐  ┌─────────────┐  ┌─────────────┐          │
│  │  Database   │  │ Edge Funcs  │  │  Email (R)  │          │
│  └─────────────┘  └─────────────┘  └─────────────┘          │
└──────────────────────────────────────────────────────────────┘
```

### User Flow

**For Senders:**
1. Connect wallet via Privy (email or Web3 wallet)
2. Select network (Base, Celo, or Polkadot)
3. Enter amount, token (USDC/USDT), recipient email
4. Confirm transaction - funds locked in escrow smart contract
5. Recipient receives email with claim link
6. Track status in dashboard

**For Recipients:**
1. Receive email notification with claim link
2. Click link and sign up with email (auto-creates Privy embedded wallet)
3. Claim funds with one click
4. Funds transferred to their embedded wallet
5. Can withdraw to external wallet or use for payments

### Developer Platform

- **REST API** - Programmatic access to all payment features
- **SDKs** - JavaScript, Python, Go libraries
- **Webhooks** - Real-time payment event notifications
- **API Keys** - Secure access management

---

## Use Cases

### For Individuals
- Send money to friends and family via email
- Request payments from colleagues or clients
- Split bills or reimburse expenses
- Send gifts or allowances

### For Businesses
- **Freelance payments** - Pay contractors globally in stablecoins
- **Payroll** - Batch payments to employees
- **Streaming payments** - Stream salaries in real-time
- **Invoice payments** - Send payment links to clients
- **E-commerce** - Accept stablecoin payments online

### For Platforms
- **Marketplaces** - Accept crypto payments from users
- **DeFi apps** - Integrate stablecoin transfers
- **Wallet apps** - Add send/receive functionality
- **Gaming** - In-game currency payouts

---

## Products & Features

### Magic Claim Links
Send crypto via email. Recipients claim funds with one click—no wallet needed.

- **Time-limited links** - Auto-expiry after 7 days with automatic refunds
- **Secure escrow** - Funds held safely in smart contracts
- **Email notifications** - Recipients get instant notifications

### REST API
Programmatic access to all payment features.

- Create and manage payments
- Handle payment claims
- Webhook integrations
- Full transaction history

### SDKs
Official libraries for popular languages:

- **JavaScript/TypeScript** - For web and Node.js applications
- **Python** - For backend services and scripts
- **Go** - For high-performance applications

### Widgets
Pre-built UI components for quick integration:

- **Pay Button** - Simple payment button
- **Payment Form** - Full-featured payment form

### Dashboard
Real-time analytics and management:

- Track all sent/received payments
- Monitor transaction history
- Manage API keys
- Analytics and reporting

---

## Getting Started

### Quick Start (5 minutes)

```bash
# 1. Install the SDK
npm install @peys/sdk

# 2. Initialize with your API key
import { Peys } from '@peys/sdk';

const peys = new Peys({ apiKey: 'your_api_key' });

# 3. Create a payment
const payment = await peys.payments.create({
  amount: 100,
  token: 'USDC',
  recipient: 'recipient@email.com'
});

console.log(payment.link);
// https://peys.app/pay/abc123
```

### Prerequisites

- Node.js 18+ 
- Peys account (free)
- API key from dashboard

### Installation

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

---

## Supported Networks

| Network | Chain ID | Status | USDC Token |
|---------|----------|--------|-------------|
| **Base Sepolia** (Testnet) | 84532 | ✅ Active | `0x036CbD53842c5426634e7929541eC2318f3dCF7e` |
| **Celo Alfajores** (Testnet) | 44787 | ✅ Active | `0x2F25deB3848C207fc8E0c34035B3Ba7fC157602B` |
| **Polkadot Asset Hub** (Paseo) | 420420421 | ✅ Active | Asset ID 1337 |

---

## How It Works

### Sending Payments

```
1. Sender connects wallet (email or Web3)
2. Selects network (Base, Celo, or Polkadot)
3. Enters amount, token (USDC/USDT), recipient email
4. Confirms transaction - funds locked in escrow
5. Recipient receives email with claim link
6. Sender can track status in dashboard
```

### Receiving Payments

```
1. Recipient receives email notification
2. Clicks claim link
3. Signs up with email (auto-creates wallet)
4. Claims funds with one click
5. Funds transferred to their wallet
6. Can withdraw to any address
```

### Claim Flow

```typescript
// Recipient claims payment
const claim = await peys.payments.claim({
  claimId: 'pay_abc123'
});

// Or check claim status
const status = await peys.payments.getStatus({
  claimId: 'pay_abc123'
});
```

---

## API Reference

### Base URL

```
https://api.peys.app/v1
```

### Authentication

All API requests require an API key in the header:

```bash
curl -H "Authorization: Bearer sk_live_..." \
     https://api.peys.app/v1/payments
```

### Key Endpoints

| Method | Endpoint | Description |
|--------|----------|-------------|
| POST | `/v1/payments` | Create a new payment |
| GET | `/v1/payments/:id` | Get payment details |
| POST | `/v1/payments/:id/claim` | Claim a payment |
| GET | `/v1/payments` | List payments |
| POST | `/v1/webhooks` | Register webhook |
| GET | `/v1/accounts/:id` | Get account info |

### Webhooks

Receive real-time notifications for:

- `payment.created` - New payment created
- `payment.claimed` - Payment claimed by recipient
- `payment.expired` - Payment link expired
- `payment.cancelled` - Payment cancelled by sender
- `payment.refunded` - Unclaimed payment refunded

---

## Architecture

### System Components

**1. Frontend (React/Vite)**
- **Location**: `/src/`
- **Purpose**: User interface for sending, claiming, and managing payments
- **Key Components**:
  - `SendPage.tsx` - Payment creation form
  - `ClaimPage.tsx` - Payment claiming interface
  - `Dashboard.tsx` - Transaction history and analytics
  - `SendPaymentForm.tsx` - Main payment flow logic

**2. Backend (Supabase)**
- **Location**: `/supabase/`
- **Purpose**: Database storage, Edge Functions, and email notifications
- **Key Components**:
  - Database Tables: `payments`, `profiles`, `notifications`, `api_keys`
  - Edge Functions: `create-payment`, `claim-payment`, `send-payment-notification`
  - Authentication: Supabase Auth + Privy integration

**3. Smart Contracts (Ethereum)**
- **Location**: `/contracts/`
- **Purpose**: Escrow, streaming, and batch payment logic
- **Key Contracts**:
  - `PeysEscrow.sol` - Main escrow contract for magic link payments
  - `PeyStreaming.sol` - Streaming payments contract
  - `PeyBatchPayroll.sol` - Batch payments contract

**4. Developer Platform**
- **Location**: `/server/` and `/sdks/`
- **Purpose**: REST API and SDKs for programmatic access
- **Key Components**:
  - Express.js REST API server
  - JavaScript, Python, Go SDKs
  - API key management

### Data Flow

**Magic Link Payment Flow:**
1. Frontend → Supabase: Save preliminary payment record
2. Frontend → Smart Contract: Create escrow payment on-chain
3. Supabase → Resend: Send email notification with claim link
4. Recipient → Frontend: Click claim link and sign up
5. Frontend → Smart Contract: Claim payment on-chain
6. Frontend → Supabase: Update payment status

**User Authentication Flow:**
1. User signs in via Privy (email or Web3 wallet)
2. Privy creates embedded wallet if needed
3. Frontend syncs with Supabase profiles
4. User can send/receive payments using their wallet

### Environment Configuration

Each component has its own environment configuration:

**Frontend** (`/.env`):
- `VITE_SUPABASE_URL` - Supabase project URL
- `VITE_SUPABASE_PUBLISHABLE_KEY` - Supabase anon key
- `VITE_PRIVY_APP_ID` - Privy application ID
- Chain-specific contract addresses

**Backend** (`/supabase/.env`):
- `SUPABASE_DB_URL` - Database connection string
- `RESEND_API_KEY` - Resend email service key
- `PRIVY_APP_ID` - Privy application ID

**Smart Contracts** (`/contracts/.env`):
- Private keys for deployment
- RPC URLs for each network

## Tech Stack

### Frontend
- **React 18** - UI framework
- **TypeScript** - Type safety
- **Vite** - Build tool
- **Wagmi + Viem** - Ethereum interactions
- **Privy** - Embedded wallet & auth
- **Tailwind CSS** - Styling
- **React Router** - Navigation

### Backend (Hybrid Architecture)

**Primary: Supabase (Serverless)**
- PostgreSQL database
- Edge Functions for payment APIs
- Authentication (Supabase + Privy)
- Email notifications via Resend
- Webhook system for developers
- **Cost**: Free tier (500K invocations) → $0-25/month

**Secondary: WhatsApp Microservice (Dedicated VPS)**
- WhatsApp Web automation (whatsapp-web.js)
- QR code generation and scanning
- Persistent session management
- Event forwarding to Supabase
- **Cost**: $5-10/month (small VPS)

**Total Estimated Cost**: $5-35/month (vs $20-50 for monolithic server)

### Smart Contracts
- **Solidity 0.8.20** - Contract language
- **Foundry** - Development framework
- **Escrow System** - PeysEscrow.sol for magic link payments
- **Streaming** - PeyStreaming.sol for continuous payments
- **Batch** - PeyBatchPayroll.sol for bulk payments

### Infrastructure
- **Multi-chain** - Base Sepolia, Celo Alfajores, Polkadot Asset Hub
- **Privy** - Embedded wallet management
- **Vercel** - Frontend hosting
- **Shadcn UI** - Component library

### Backend
- **Supabase** - Database & Edge Functions
- **PostgreSQL** - Data persistence
- **Resend** - Email notifications

### Smart Contracts
- **Solidity 0.8** - Smart contract language
- **Foundry** - Testing & deployment

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

---

## SDK Examples

### JavaScript

```typescript
import { Peys } from '@peys/sdk';

const peys = new Peys({ apiKey: process.env.PEYS_API_KEY });

// Create payment
const payment = await peys.payments.create({
  amount: 50,
  token: 'USDC',
  recipient: 'user@example.com',
  description: 'Payment for services'
});

// Get payment status
const status = await peys.payments.get(payment.id);
```

### Python

```python
from peys import Peys

peys = Peys(api_key="your_api_key")

# Create payment
payment = peys.payments.create(
    amount=50,
    token="USDC",
    recipient="user@example.com"
)
```

### Go

```go
import "github.com/peys/sdk-go"

peys := peys.New("your_api_key")

payment, err := peys.Payments.Create(&peys.PaymentParams{
    Amount: 50,
    Token: "USDC",
    Recipient: "user@example.com",
})
```

---

## Resources

- [Documentation](https://peys.app/docs) - Full developer docs
- [API Reference](https://peys.app/docs/api/payments) - REST API endpoints
- [SDK Guides](https://peys.app/docs/sdks/javascript) - Language-specific tutorials
- [Widgets Guide](https://peys.app/docs/widgets/overview) - Embeddable UI components
- [Pricing](https://peys.app/docs/sdks/pricing) - SDK pricing plans

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

- **Email**: peys.xyz@gmail.com
- **X**: [@Peys_io](https://x.com/Peys_io)
- **GitHub**: [Open an issue](https://github.com/Moses-main/peydot-magic-links/issues)

---

## License

MIT License - see [LICENSE](./LICENSE) for details.

---

## Acknowledgments

- [Polkadot](https://polkadot.network/) - Multi-chain ecosystem
- [Base](https://base.org/) - Ethereum L2 network
- [Celo](https://celo.org/) - Mobile-first blockchain
- [Circle](https://circle.com/) - USDC stablecoin
- [Privy](https://privy.io/) - Embedded wallets

---

<div align="center">

**Built for the future of payments**

</div>
