# PeyDot - Magic Claim Links for P2P Payments

<div align="center">

![PeyDot](./docs/images/peydot-logo.png)

**Zero-friction stablecoin payments for everyone**

[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](https://opensource.org/licenses/MIT)
[![Solidity](https://img.shields.io/badge/Solidity-0.8.20-blue)](https://docs.soliditylang.org/)
[![React](https://img.shields.io/badge/React-18.3-green)](https://react.dev/)
[![Polkadot](https://img.shields.io/badge/Polkadot-Hub-E6007A)](https://polkadot.com/)

</div>

---

## Table of Contents

- [About PeyDot](#about-peydot)
- [Features](#features)
- [Architecture](#architecture)
- [Tech Stack](#tech-stack)
- [Getting Started](#getting-started)
- [Smart Contracts](#smart-contracts)
- [Frontend](#frontend)
- [API Documentation](#api-documentation)
- [Deployment](#deployment)
- [Testing](#testing)
- [Demo Walkthrough](#demo-walkthrough)
- [Roadmap](#roadmap)
- [Contributing](#contributing)
- [Support](#support)
- [License](#license)

---

## About PeyDot

PeyDot is a simple, user-friendly P2P and merchant payments app using stablecoins (USDC/USDT) on Polkadot Asset Hub. The core killer feature is **"Magic Claim Links"** — allowing senders to create shareable links for funds where recipients can claim via link with **NO existing account or wallet needed** (just email/social login via Privy → auto-embedded wallet creation → 1-click claim).

### Problem Statement

Traditional crypto payments require:
- Recipient must have a wallet
- Recipient must understand seed phrases
- Complex gas fee concepts
- Multiple steps to receive funds

### PeyDot Solution

- Sender creates payment → generates magic link
- Recipient clicks link → logs in with email/Google/Apple
- Privy auto-creates embedded wallet
- 1-click claim → funds arrive in wallet
- Gas sponsorship available (low DOT fees)

---

## Features

### Core Features

1. **Privy Authentication**
   - Login with email, Google, Apple
   - Auto-create embedded wallet on first login
   - Display connected wallet address and balances

2. **Send Payment (Sender Flow)**
   - Select amount + token (USDC/USDT)
   - Enter recipient email/phone or generate link
   - Generate magic claim link
   - Funds deposited into escrow contract
   - Optional memo/note
   - QR code for in-person send

3. **Magic Claim Link (Recipient Flow)**
   - Public claim page at `/claim/:id`
   - Shows: sender, amount, token, note, expiry
   - Privy login modal if not authenticated
   - Auto-create embedded wallet if none exists
   - 1-click "Claim" button
   - Gas sponsored if possible
   - Post-claim: redirect to dashboard

4. **Escrow Smart Contract**
   - `createPayment()` - sender deposits funds
   - `claim()` - recipient claims funds
   - `refundAfterExpiry()` - auto-refund if unclaimed
   - Events for tracking
   - Security: non-reentrant, events, expiry

5. **Dashboard**
   - Show balance (USDC/USDT)
   - Transaction history (sent/claimed)
   - Merchant mode: generate QR for payments

### Additional Features

- **Yield Tease**: Mention escrowed funds could earn yield (future via Bifrost LSTs)
- **Fiat Ramps**: Links to Transak/Ramp for off-ramp
- **Expiry**: 7 days default (configurable)
- **Modern UI**: Mobile-first, Tailwind CSS, dark mode

---

## Architecture

### System Architecture

```
┌─────────────────────────────────────────────────────────────────────────┐
│                              USER LAYER                                  │
│  ┌─────────────┐  ┌─────────────┐  ┌─────────────┐  ┌─────────────┐  │
│  │  Web App   │  │ Mobile App  │  │   Wallet    │  │  QR Code   │  │
│  │  (Next.js) │  │  (PWA)      │  │  (Privy)    │  │  Scanner   │  │
│  └─────────────┘  └─────────────┘  └─────────────┘  └─────────────┘  │
└─────────────────────────────────────────────────────────────────────────┘
                                    │
                                    ▼
┌─────────────────────────────────────────────────────────────────────────┐
│                           SERVICE LAYER                                 │
│  ┌─────────────┐  ┌─────────────┐  ┌─────────────┐  ┌─────────────┐  │
│  │  Auth      │  │   Payment   │  │   Escrow    │  │  Database   │  │
│  │  (Privy)   │  │   Service   │  │   Service   │  │  (SQLite)  │  │
│  └─────────────┘  └─────────────┘  └─────────────┘  └─────────────┘  │
└─────────────────────────────────────────────────────────────────────────┘
                                    │
                                    ▼
┌─────────────────────────────────────────────────────────────────────────┐
│                          BLOCKCHAIN LAYER                               │
│  ┌─────────────────────────────────────────────────────────────────┐   │
│  │                    POLKADOT HUB (EVM)                           │   │
│  │  ┌─────────────────┐    ┌─────────────────┐                    │   │
│  │  │ PeyDotEscrow    │    │   USDC/USDT     │                    │   │
│  │  │ Contract        │    │   (ERC20)       │                    │   │
│  │  └─────────────────┘    └─────────────────┘                    │   │
│  │         │                        │                              │   │
│  │         ▼                        ▼                              │   │
│  │  ┌─────────────────────────────────────────────────────────┐   │   │
│  │  │              XCM PRECOMPILES (Optional)                   │   │   │
│  │  │         Asset Hub ←→ Polkadot Hub                        │   │   │
│  │  └─────────────────────────────────────────────────────────┘   │   │
│  └─────────────────────────────────────────────────────────────────┘   │
└─────────────────────────────────────────────────────────────────────────┘
```

### Payment Flow Diagram

```
┌─────────────────────────────────────────────────────────────────────────┐
│                        SEND PAYMENT FLOW                                │
└─────────────────────────────────────────────────────────────────────────┘

  1. User logs in via Privy (email/Google/Apple)
           │
           ▼
  2. User selects token (USDC/USDT) and amount
           │
           ▼
  3. Generate secret hash for claim link
           │
           ▼
  4. Call createPayment() on Escrow contract
           │ ──► Deposit tokens to escrow
           │
           ▼
  5. Store payment metadata in database
           │
           ▼
  6. Generate magic claim link: peydot.app/claim/{id}
           │
           ▼
  7. Share link via email/WhatsApp/QR

┌─────────────────────────────────────────────────────────────────────────┐
│                       CLAIM PAYMENT FLOW                                │
└─────────────────────────────────────────────────────────────────────────┘

  1. Recipient clicks magic claim link
           │
           ▼
  2. View payment details (sender, amount, expiry)
           │
           ▼
  3. If not logged in → Privy login modal
           │ ──► Auto-create embedded wallet
           │
           ▼
  4. Recipient clicks "Claim Funds"
           │
           ▼
  5. Call claim() on Escrow contract
           │ ──► Transfer tokens to recipient
           │
           ▼
  6. Update payment status in database
           │
           ▼
  7. Redirect to dashboard with balance
```

---

## Tech Stack

| Layer | Technology | Purpose |
|-------|------------|---------|
| **Frontend** | React 18 + Vite | UI Framework |
| **Styling** | Tailwind CSS + shadcn/ui | Modern UI |
| **Authentication** | Privy.io | Email/Social login + Embedded wallets |
| **Smart Contracts** | Solidity 0.8.20 + Foundry | Escrow logic |
| **Blockchain** | Polkadot Hub (EVM) | L1 chain |
| **Wallet** | Privy Embedded (ERC-4337) | Gas sponsorship |
| **Data Fetching** | TanStack Query | Server state |
| **Chain Interaction** | Wagmi + Viem | Read/write contracts |
| **Testing** | Foundry | Smart contract tests |

---

## Getting Started

### Prerequisites

- Node.js 18+
- npm or yarn
- Foundry (for smart contracts)
- Privy App ID (get from [privy.io](https://privy.io))
- RPC URL for Polkadot Hub testnet

### Installation

1. **Clone the repository**

```bash
git clone https://github.com/peydot/peydot-magic-links.git
cd peydot-magic-links
```

2. **Install dependencies**

```bash
npm install
```

3. **Set up environment variables**

```bash
cp .env.example .env
```

Edit `.env` with your values:

```env
# Privy Configuration
VITE_PRIVY_APP_ID=your_privy_app_id

# Blockchain RPC URLs
VITE_RPC_URL=https://rpc.paseo.io

# Smart Contract Addresses (after deployment)
VITE_ESCROW_CONTRACT_ADDRESS=0x...
VITE_USDC_ADDRESS=0x...
VITE_USDT_ADDRESS=0x...
```

4. **Start development server**

```bash
npm run dev
```

Open [http://localhost:5173](http://localhost:5173) to view the app.

### Smart Contract Development

1. **Install Foundry**

```bash
curl -L https://foundry.paradigm.xyz | bash
foundryup
```

2. **Build contracts**

```bash
forge build
```

3. **Run tests**

```bash
forge test
```

4. **Deploy to testnet**

```bash
source .env
forge script script/Deploy.s.sol --rpc-url $RPC_URL --broadcast --verify
```

---

## Smart Contracts

### PeyDotEscrow.sol

The core escrow contract handles payment creation, claiming, and refunds.

#### Key Functions

```solidity
// Create a payment with custom expiry
function createPaymentExternal(
    address token,      // USDC or USDT address
    uint256 amount,    // Amount in wei (6 decimals for USDC)
    bytes32 claimHash, // Hash of secret for claiming
    uint256 expiry,    // Expiry in seconds
    string calldata memo // Optional note
) external returns (bytes32 paymentId);

// Create payment with default 7-day expiry
function createPaymentWithDefaultExpiry(
    address token,
    uint256 amount,
    bytes32 claimHash,
    string calldata memo
) external returns (bytes32 paymentId);

// Claim funds as recipient
function claim(
    bytes32 paymentId,    // Payment ID
    bytes32 secretHash,  // Secret hash to verify claim
    address recipient    // Recipient address (embedded wallet)
) external returns (uint256);

// Refund if payment expired and unclaimed
function refundAfterExpiry(bytes32 paymentId) external;

// Get payment details
function getPayment(bytes32 paymentId) external view returns (
    address sender,
    address token,
    uint256 amount,
    uint256 expiry,
    bool claimed,
    bool refunded,
    string memory memo
);
```

#### Events

```solidity
event PaymentCreated(
    bytes32 indexed paymentId,
    address indexed sender,
    address token,
    uint256 amount,
    uint256 expiry,
    string memo
);

event PaymentClaimed(
    bytes32 indexed paymentId,
    address indexed recipient,
    uint256 amount
);

event PaymentRefunded(
    bytes32 indexed paymentId,
    address indexed sender,
    uint256 amount
);
```

#### Security Features

- **Non-reentrant**: Uses Check-Effects-Interactions pattern
- **Access Control**: Only sender can refund
- **Expiry**: Automatic expiration check
- **Events**: Full audit trail

---

## Frontend

### Project Structure

```
src/
├── components/           # React components
│   ├── ui/              # shadcn/ui components
│   ├── SendPaymentForm.tsx
│   ├── ClaimPage.tsx
│   └── ...
├── contexts/             # React contexts
│   ├── PrivyContext.tsx  # Privy authentication
│   └── AppContext.tsx   # App state
├── hooks/               # Custom hooks
│   ├── useEscrow.ts     # Escrow contract interactions
│   └── useMockData.ts   # Mock data for demo
├── lib/                 # Utilities
│   ├── abis.ts         # Contract ABIs
│   ├── contracts.ts    # Contract addresses
│   └── wagmi.ts        # Wagmi config
└── pages/               # Route pages
    ├── Index.tsx        # Landing page
    ├── SendPage.tsx     # Send payment
    ├── ClaimPage.tsx    # Claim payment
    └── DashboardPage.tsx # User dashboard
```

### Key Components

#### PrivyProvider

Wraps the app with Privy authentication:

```tsx
<PrivyProvider 
  appId={PRIVY_APP_ID}
  config={{
    loginMethods: ['email', 'google', 'apple'],
    embeddedWallets: {
      ethereum: { createOnLogin: 'all-users' },
    },
  }}
>
  <App />
</PrivyProvider>
```

#### SendPaymentForm

Multi-step form for creating payments:
1. Select token (USDC/USDT)
2. Enter amount
3. Add memo (optional)
4. Review and confirm
5. Generate magic link

#### ClaimPage

Public page for claiming payments:
- Shows payment details
- Prompts login if not authenticated
- 1-click claim button
- Success state with dashboard link

---

## API Documentation

### Payment Creation

```bash
POST /api/escrow/create

{
  "token": "0x...",
  "amount": "1000000",
  "secret": "random-secret-string",
  "memo": "Lunch money 🍕",
  "expiryDays": 7
}

Response:
{
  "paymentId": "0x...",
  "claimLink": "https://peydot.app/claim/abc123",
  "expiry": "2024-01-15T00:00:00Z"
}
```

### Get Payment Details

```bash
GET /api/escrow/:id

Response:
{
  "paymentId": "0x...",
  "sender": "0x...",
  "amount": "1000000",
  "token": "USDC",
  "memo": "Lunch money 🍕",
  "expiry": "2024-01-15T00:00:00Z",
  "claimed": false,
  "refunded": false
}
```

### Claim Payment

```bash
POST /api/escrow/:id/claim

{
  "secret": "random-secret-string"
}

Response:
{
  "success": true,
  "transactionHash": "0x..."
}
```

---

## Deployment

### Smart Contract Deployment

1. **Configure deployment**

Edit `foundry.toml` or set environment variables:

```bash
export PRIVATE_KEY=your_private_key
export RPC_URL=https://rpc.paseo.io
```

2. **Deploy**

```bash
forge script script/Deploy.s.sol --rpc-url $RPC_URL --broadcast
```

3. **Verify on explorer**

```bash
forge verify-contract <CONTRACT_ADDRESS> PeyDotEscrow --chain 1
```

### Frontend Deployment

1. **Build for production**

```bash
npm run build
```

2. **Deploy to Vercel/Netlify**

```bash
# Vercel
vercel deploy --prod

# Netlify
netlify deploy --prod
```

---

## Testing

### Smart Contract Tests

```bash
# Run all tests
forge test

# Run with verbosity
forge test -vv

# Run specific test
forge test --match-test testClaimPayment
```

### Frontend Tests

```bash
# Run unit tests
npm run test

# Run in watch mode
npm run test:watch
```

---

## Demo Walkthrough

### For Judges

1. **Landing Page**
   - Show the modern UI
   - Highlight "Magic Claim Links" feature

2. **Send Payment Flow**
   - Click "Send Payment"
   - Login with email (Privy)
   - Select USDC, enter amount ($50)
   - Add memo "Lunch money 🍕"
   - Confirm transaction
   - Copy generated magic link

3. **Claim Flow (Incognito)**
   - Open magic link in new tab
   - Show payment preview
   - Click "Sign In & Claim"
   - Login with different email
   - Auto-created embedded wallet
   - Click "Claim Funds"
   - Show success state

4. **Dashboard**
   - Show updated balance
   - View transaction history

### Testnet Setup

Use these addresses for testing:

- **Escrow Contract**: `0x...` (deploy to get)
- **USDC (Test)**: `0x...` (use testnet faucet)
- **USDT (Test)**: `0x...` (use testnet faucet)

---

## Roadmap

### Phase 1: Foundation (Week 1-2)
- [x] Smart contract development
- [x] Basic frontend UI
- [x] Privy integration

### Phase 2: Backend (Week 2-3)
- [ ] API routes for payments
- [ ] Database integration
- [ ] Payment link storage

### Phase 3: Integration (Week 3-4)
- [ ] Connect frontend to contracts
- [ ] Wallet balance queries
- [ ] Transaction history

### Phase 4: Polish (Week 4-6)
- [ ] XCM integration
- [ ] Gas sponsorship
- [ ] Fiat ramps
- [ ] Production deployment

---

## Contributing

We welcome contributions! Please see our [Contributing Guide](./CONTRIBUTING.md).

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Run tests
5. Submit a pull request

---

## Support

### Getting Help

- **Documentation**: [docs.peydot.app](https://docs.peydot.app)
- **Discord**: [Join our community](https://discord.gg/peydot)
- **Twitter**: [@peydotapp](https://twitter.com/peydotapp)

### Reporting Issues

- **Bug Reports**: [GitHub Issues](https://github.com/peydot/peydot-magic-links/issues)
- **Security**: security@peydot.app

---

## License

This project is licensed under the MIT License - see the [LICENSE](./LICENSE) file for details.

```
MIT License

Copyright (c) 2024 PeyDot

Permission is hereby granted, free of charge, to any person obtaining a copy
of this software and associated documentation files (the "Software"), to deal
in the Software without restriction, including without limitation the rights
to use, copy, modify, merge, publish, distribute, sublicense, and/or sell
copies of the Software, and to permit persons to whom the Software is
furnished to do so, subject to the following conditions:

The above copyright notice and this permission notice shall be included in all
copies or substantial portions of the Software.

THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR
IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY,
FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE
AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER
LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM,
OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN THE
SOFTWARE.
```

---

## Acknowledgments

- [Polkadot](https://polkadot.com/) - Blockchain infrastructure
- [Privy](https://privy.io/) - Embedded wallets
- [OpenZeppelin](https://openzeppelin.com/) - Smart contract安全
- [Foundry](https://getfoundry.sh/) - Smart contract development
- [shadcn/ui](https://ui.shadcn.com/) - UI components

---

<div align="center">

**Built with ❤️ for the Polkadot Solidity Hackathon**

</div>
