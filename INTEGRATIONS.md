# Peys OS - Third-Party Integrations & Services

This document lists all third-party services, APIs, and dependencies used in the Peys OS platform.

---

## Authentication & Identity

### Privy
- **Purpose**: Wallet connection and authentication
- **Website**: https://www.privy.io
- **Package**: `@privy-io/react-auth`, `@privy-io/wagmi`
- **Usage**: 
  - Social login (Google, Apple, etc.)
  - Wallet connection (MetaMask, Coinbase, etc.)
  - Session management
- **Env Variables**:
  - `VITE_PRIVY_APP_ID`
- **Documentation**: https://docs.privy.io/

---

## Database & Backend

### Supabase
- **Purpose**: Backend-as-a-Service - Database, Auth, Edge Functions, Storage
- **Website**: https://supabase.com
- **Package**: `@supabase/supabase-js`
- **Usage**:
  - PostgreSQL database
  - User authentication
  - Row Level Security (RLS)
  - Edge Functions (serverless)
  - Real-time subscriptions
  - File storage
- **Env Variables**:
  - `VITE_SUPABASE_URL`
  - `VITE_SUPABASE_PUBLISHABLE_KEY`
  - `SUPABASE_SERVICE_ROLE_KEY` (backend only)
- **Documentation**: https://supabase.com/docs

---

## Email Services

### Resend
- **Purpose**: Transactional email delivery
- **Website**: https://resend.com
- **Pricing**: Free tier - 3,000 emails/month
- **Usage**:
  - Payment notifications
  - Payment claim alerts
  - Account verification
- **Env Variables**:
  - `RESEND_API_KEY`
  - `RESEND_FROM_EMAIL` (optional, for custom domain)
- **Documentation**: https://resend.com/docs

---

## Payment Processing

### Flutterwave
- **Purpose**: African payment gateway - Virtual accounts, Bank transfers, FX
- **Website**: https://flutterwave.com
- **Usage**:
  - Virtual Naira accounts (NGN)
  - Bank transfers
  - Currency exchange
  - Fiat deposits
- **Env Variables**:
  - `FLUTTERWAVE_SECRET_KEY`
  - `FLUTTERWAVE_PUBLIC_KEY`
  - `FLUTTERWAVE_WEBHOOK_SECRET`
  - `FLUTTERWAVE_ENVIRONMENT` (sandbox/live)
- **Documentation**: https://developer.flutterwave.com

---

## Blockchain & Web3

### viem
- **Purpose**: Ethereum JSON-RPC client
- **Package**: `viem`
- **Usage**:
  - Reading blockchain data
  - Transaction validation
  - Event parsing
- **Documentation**: https://viem.sh/

### wagmi
- **Purpose**: React hooks for Ethereum
- **Package**: `wagmi`
- **Usage**:
  - Wallet connection UI
  - Transaction hooks
  - Chain management
- **Documentation**: https://wagmi.sh/

### ethers.js
- **Purpose**: Ethereum library for contract interaction
- **Package**: `ethers`
- **Usage**:
  - Smart contract calls
  - ABI encoding/decoding
  - Transaction signing
- **Documentation**: https://docs.ethers.org/

### Supported Blockchains

| Chain | Chain ID | Network | Status |
|-------|----------|---------|--------|
| Base | 8453 | Mainnet | Production |
| Base Sepolia | 84532 | Testnet | Testing |
| Celo | 42220 | Mainnet | Production |
| Celo Alfajores | 44787 | Testnet | Testing |
| Polkadot Asset Hub | 420420421 | Testnet | Testing |

#### RPC Providers (per chain)
- **Env Variables**: `VITE_RPC_URL_BASE`, `VITE_RPC_URL_BASE_SEPOLIA`, `VITE_RPC_URL_CELO`, `VITE_RPC_URL_CELO_MAINNET`, `VITE_RPC_URL_POLKADOT`

### Foundry/Forge
- **Purpose**: Smart contract development framework
- **Website**: https://book.getfoundry.sh/
- **Usage**: Compiling and deploying Solidity smart contracts
- **Contracts**: Located in `/contracts` directory

---

## AI & Chat

### OpenAI
- **Purpose**: AI-powered payment assistant
- **Website**: https://openai.com
- **Usage**:
  - Payment assistant chatbot
  - Natural language transaction queries
- **Env Variables**:
  - `OPENAI_API_KEY`
- **Documentation**: https://platform.openai.com/docs

---

## Frontend Libraries

### React
- **Purpose**: UI framework
- **Package**: `react`, `react-dom`

### Vite
- **Purpose**: Build tool and dev server
- **Package**: `vite`
- **Documentation**: https://vitejs.dev/

### Tailwind CSS
- **Purpose**: Utility-first CSS framework
- **Package**: `tailwindcss`
- **Documentation**: https://tailwindcss.com/

### shadcn/ui
- **Purpose**: Reusable UI components
- **Components**: Built on Radix UI primitives
- **Documentation**: https://ui.shadcn.com/

### Radix UI
- **Purpose**: Unstyled, accessible UI primitives
- **Packages**: Multiple `@radix-ui/*` packages
- **Documentation**: https://www.radix-ui.com/

### Framer Motion
- **Purpose**: Animation library
- **Package**: `framer-motion`
- **Documentation**: https://www.framer.com/motion/

### React Query
- **Purpose**: Server state management
- **Package**: `@tanstack/react-query`
- **Documentation**: https://tanstack.com/query/

### React Router
- **Purpose**: Client-side routing
- **Package**: `react-router-dom`
- **Documentation**: https://reactrouter.com/

### React Hook Form
- **Purpose**: Form management
- **Package**: `react-hook-form`
- **Documentation**: https://react-hook-form.com/

### Zod
- **Purpose**: Schema validation
- **Package**: `zod`
- **Documentation**: https://zod.dev/

### Lucide React
- **Purpose**: Icon library
- **Package**: `lucide-react`
- **Documentation**: https://lucide.dev/

### Sonner
- **Purpose**: Toast notifications
- **Package**: `sonner`
- **Documentation**: https://sonner.emilkowalski.ski/

### Recharts
- **Purpose**: Chart library
- **Package**: `recharts`
- **Documentation**: https://recharts.org/

### QR Code
- **Purpose**: QR code generation
- **Package**: `qrcode.react`
- **Usage**: Payment QR codes

---

## Development Tools

### TypeScript
- **Purpose**: Type safety
- **Package**: `typescript`

### ESLint
- **Purpose**: Code linting
- **Package**: `eslint`

### Vitest
- **Purpose**: Unit testing
- **Package**: `vitest`

### Deno
- **Purpose**: Edge Functions runtime
- **Website**: https://deno.land
- **Documentation**: https://docs.deno.com/

---

## Getting Started with Integrations

### 1. Supabase Setup
```bash
# Create project at https://supabase.com
# Get API keys from Settings > API
# Set environment variables
```

### 2. Privy Setup
```bash
# Create app at https://dashboard.privy.io
# Get App ID
# Configure allowed domains
```

### 3. Resend Setup
```bash
# Create account at https://resend.com
# Verify domain (optional)
# Get API key
# Set as Supabase secret
```

### 4. Flutterwave Setup
```bash
# Create merchant account at https://flutterwave.com
# Get API keys from Dashboard
# Configure webhook URL
# Set as Supabase secrets
```

### 5. Smart Contract Deployment
```bash
# Install Foundry
curl -L https://foundry.paradigm.xyz | bash
foundryup

# Deploy to testnet
npm run contract:deploy:celo-alfajores
npm run contract:deploy:base-sepolia
npm run contract:deploy:polkadot
```

---

## Environment Variables Reference

### Frontend (.env)
```bash
# Supabase
VITE_SUPABASE_URL=https://xxx.supabase.co
VITE_SUPABASE_PUBLISHABLE_KEY=eyJ...

# Privy
VITE_PRIVY_APP_ID=your_privy_app_id

# Blockchain RPC URLs
VITE_RPC_URL_BASE_SEPOLIA=https://sepolia.base.org
VITE_RPC_URL_CELO=https://alfajores-forno.celo-testnet.org
VITE_RPC_URL_POLKADOT=https://eth-asset-hub-paseo.dotters.network

# Contract Addresses
VITE_ESCROW_CONTRACT_ADDRESS_CELO=0x...
VITE_ESCROW_CONTRACT_ADDRESS_BASE_SEPOLIA=0x...
VITE_ESCROW_CONTRACT_ADDRESS_POLKADOT=0x...
```

### Backend (Supabase Secrets)
```bash
# Supabase
supabase secrets set SUPABASE_URL=https://xxx.supabase.co
supabase secrets set SUPABASE_SERVICE_ROLE_KEY=eyJ...

# Email
supabase secrets set RESEND_API_KEY=re_xxx
supabase secrets set RESEND_FROM_EMAIL=notifications@yoursite.com

# Flutterwave
supabase secrets set FLUTTERWAVE_SECRET_KEY=FLWSECK-xxx
supabase secrets set FLUTTERWAVE_WEBHOOK_SECRET=xxx
supabase secrets set FLUTTERWAVE_ENVIRONMENT=sandbox

# AI
supabase secrets set OPENAI_API_KEY=sk-xxx

# Security
supabase secrets set WEBHOOK_SECRET=secure_random_string
supabase secrets set ALLOWED_ORIGINS=https://yourdomain.com,https://app.yourdomain.com
```

---

## Security Considerations

1. **Never expose secrets to frontend**: Use backend-only environment variables for sensitive data
2. **Use CORS properly**: Set `ALLOWED_ORIGINS` in Supabase, not `*` in production
3. **Webhook signatures**: Always verify webhook authenticity using HMAC
4. **API keys**: Rotate keys periodically and use environment-specific keys
5. **Rate limiting**: Enable rate limits on all public endpoints

---

## Support & Documentation Links

| Service | Documentation | Support |
|---------|--------------|---------|
| Supabase | https://supabase.com/docs | https://supabase.com/dashboard/support |
| Privy | https://docs.privy.io | support@privy.io |
| Resend | https://resend.com/docs | support@resend.com |
| Flutterwave | https://developer.flutterwave.com | support@flutterwave.com |
| OpenAI | https://platform.openai.com/docs | https://help.openai.com |
