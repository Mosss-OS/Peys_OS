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

Peys is a **stablecoin payment platform** that enables anyone to send and receive USDC and USDT payments using **Magic Claim Links**. It's built on the Polkadot Asset Hub and supports multiple chains including Base, Celo, and Polkadot.

### The Problem with Crypto Payments

Traditional cryptocurrency payments require:
- Recipients must have a pre-existing wallet
- Recipients must understand seed phrases and private keys
- Complex gas fee concepts and terminology
- Multiple steps just to receive funds
- No way to request payment from someone

### The Solution

Peys's **Magic Claim Links** solve these issues by allowing senders to create secure, time-limited links where recipients can claim funds with:

1. **No wallet required** - Recipients don't need a wallet to receive
2. **One-click claiming** - Just click the link and claim
3. **Auto wallet creation** - Embedded wallets created automatically via email
4. **Multiple chains** - Send on Base, Celo, or Polkadot

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
