# System Architecture

## Overview

PeyDot uses a **hybrid architecture** combining Supabase Edge Functions with a dedicated WhatsApp microservice for optimal cost and functionality.

## Architecture Diagram (Mermaid)

```mermaid
flowchart TB
    subgraph Frontend["Frontend (Vercel/Netlify)"]
        UI[React/Vite App]
        Auth[Privy Auth]
        Wallet[Wagmi/Viem]
    end

    subgraph Backend["Backend Services"]
        subgraph Supabase["Supabase (Primary)"]
            DB[(PostgreSQL)]
            Auth_Supabase[Auth]
            EdgeFuncs[Edge Functions]
            Blockchain_Signer[blockchain-signer]
            Storage[Storage]
        end
        
        subgraph WhatsApp["WhatsApp Microservice"]
            Cloud_API[Cloud API]
        end
    end

    subgraph External["External Services"]
        Email[Resend Email]
        RPC[Infura/Alchemy]
        Privy[Privy]
    end

    subgraph Blockchain["Blockchain Networks"]
        Base[Base Sepolia]
        Celo[Celo Alfajores]
        Polkadot[Polkadot]
    end

    UI --> Auth
    UI --> Wallet
    UI --> EdgeFuncs
    Auth --> Auth_Supabase
    Wallet --> RPC
    Wallet --> Base
    Wallet --> Celo
    Wallet --> Polkadot
    EdgeFuncs --> DB
    EdgeFuncs --> Storage
    EdgeFuncs --> Email
    EdgeFuncs --> WhatsApp
    Cloud_API --> EdgeFuncs
    Email --> Privy
```

## Payment Flow (Mermaid)

```mermaid
sequenceDiagram
    participant S as Sender
    participant F as Frontend
    participant Sup as Supabase
    participant E as Escrow Contract
    participant R as Recipient
    participant Email as Email Service

    S->>F: Create payment (amount, recipient, token)
    F->>Sup: POST /create-payment
    Sup->>Sup: Generate claim link & secret
    Sup->>Sup: Save to database
    Sup->>Email: Send email notification
    Email->>R: Claim link email
    
    R->>F: Open claim link
    F->>Sup: Verify payment exists
    Sup->>F: Payment details
    R->>F: Sign claim transaction
    F->>E: claim(paymentId, secretHash)
    E->>E: Verify & transfer tokens
    E-->>R: Tokens transferred
    F->>Sup: Update payment status
    Sup->>S: Notification: payment claimed
```

## Contract Addresses

| Network | Chain ID | Escrow Contract | USDC Token |
|---------|----------|-----------------|-------------|
| Base Sepolia | 84532 | `0xb5e4A3130D774A8F3Bc0c081800b304A12a07aD1` | `0x036CbD53842c5426634e7929541eC2318f3dCF7e` |
| Polygon Amoy | 80002 | `0xeb2923503953c5Ed2772917771b850315D030f24` | `0x41E94EB09554da6d1DE6384F89b8c2C5B2c7f3f7` |
| Celo Alfajores | 44787 | `0xcDe14d966e546D70F9B0b646c203cFC1BdC2a961` | `0x2F25deB3848C207fc8E0c34035B3Ba7fC157602B` |
| Polkadot (Paseo) | 420420417 | `***REMOVED***` | PASS Token |

## Architecture Diagram (ASCII)

```
┌─────────────────────────────────────────────────────────────────┐
│                     Production Architecture                      │
├─────────────────────────────────────────────────────────────────┤
│                                                                 │
│  ┌─────────────────────────────────────────────────────────┐   │
│  │                     Frontend (Vercel)                    │   │
│  │  • React/Vite application                                │   │
│  │  • Privy authentication                                  │   │
│  │  • Wagmi/viem blockchain interactions                    │   │
│  └─────────────────────────────────────────────────────────┘   │
│                            │                                    │
│  ┌─────────────────────────┼──────────────────────────────┐    │
│  │                         │                              │    │
│  │  ┌──────────────┐       │       ┌──────────────────┐  │    │
│  │  │   Supabase   │       │       │   WhatsApp       │  │    │
│  │  │  (Primary)   │       │       │   Microservice   │  │    │
│  │  │              │       │       │                  │  │    │
│  │  │ • Database   │◄──────┼──────►│ • Cloud API      │  │    │
│  │  │ • Auth       │  Webhooks    │                  │  │    │
│  │  │ • Edge Funcs │       │       │                  │  │    │
│  │  │ • Storage    │       │       │                  │  │    │
│  │  └──────────────┘       │       └──────────────────┘  │    │
│  │                         │                              │    │
│  └─────────────────────────┼──────────────────────────────┘    │
│                            │                                    │
│  ┌─────────────────────────┴──────────────────────────────┐    │
│  │                  External Services                     │    │
│  │  • Resend (Email)      • Infura/Alchemy (RPC)         │    │
│  │  • Privy (Auth)        • WhatsApp Cloud API            │    │
│  └─────────────────────────────────────────────────────────┘    │
└─────────────────────────────────────────────────────────────────┘
```

## Component Details

### 1. Supabase (Primary Backend)
**Cost**: Free tier (500K invocations/month) → $0-25/month

**Responsibilities:**
- **Database**: PostgreSQL for user data, payments, notifications
- **Authentication**: User signup/login (Privy integration)
- **Edge Functions**: API endpoints for payments, webhooks, user management
- **Storage**: File storage (if needed)
- **Real-time**: Live updates for payment status

**Key Functions:**
- `create-payment` - Create escrow payments
- `claim-payment` - Claim payments via link
- `send-payment-notification` - Email notifications
- `webhook-register` - Developer webhook registration
- `webhook-dispatcher` - Event broadcasting
- `public-api` - Developer API endpoints

### 2. WhatsApp Microservice
**Cost**: $5-10/month (small VPS)

**Responsibilities:**
- **WhatsApp Automation**: Meta's official Cloud API
- **Event Forwarding**: Send WhatsApp events to Supabase

**Why it needs its own server:**
- Manages webhook verification and message processing
- Handles rate limiting and retry logic
- Can't run reliably in stateless Edge Functions

**Endpoints:**
- `POST /whatsapp/webhook` - Receive WhatsApp messages via Cloud API
- `POST /whatsapp/send` - Send messages via WhatsApp Cloud API

### 3. Frontend
**Cost**: Free (Vercel/Netlify)

**Responsibilities:**
- User interface
- Privy wallet integration
- Blockchain interactions via wagmi/viem
- API calls to Supabase and WhatsApp service

## Data Flow Examples

### Magic Link Payment Flow:
```
1. User → Frontend: Create payment request
2. Frontend → Supabase: POST /create-payment
3. Supabase Edge Function:
   - Save payment to database
   - Generate claim link
   - Send email notification
4. Recipient clicks claim link
5. Frontend → Supabase: POST /claim-payment
6. Supabase updates database status
```

### WhatsApp Payment Flow:
```
1. User → WhatsApp: "Send 50 USDC to alice@email.com"
2. WhatsApp Microservice:
   - Parse message
   - Call Supabase API to create payment
   - Send confirmation to user
3. Supabase: Process payment, send email to recipient
4. Recipient claims via link
```

### Developer API Flow:
```
1. Developer → Supabase: POST /public-api/create-payment
2. Supabase Edge Function:
   - Validate API key
   - Process payment
   - Dispatch webhook events
3. Developer's webhook URL receives events
```

## Cost Breakdown

| Component | Monthly Cost | Notes |
|-----------|-------------|-------|
| WhatsApp Microservice (VPS) | $5-10 | Small instance, 24/7 |
| Supabase Free Tier | $0 | 500K invocations, 500MB storage |
| Supabase Pro (if needed) | $25 | For higher usage |
| Email (Resend) | $0-10 | 3K free emails/month |
| **Total Estimated** | **$5-35/month** | vs $20-50 with monolithic server |

## Migration Strategy

### Phase 1: Separate Services (Current)
- ✅ WhatsApp service already separate
- ✅ Supabase Edge Functions exist
- ✅ Migrated remaining Express endpoints to Supabase

### Phase 2: Documentation & Monitoring
- Document dual-backend architecture
- Add cost monitoring
- Optimize WhatsApp service

### Phase 3: Future Optimization
- Evaluate warm instances for WhatsApp
- Consider serverless alternatives
- Scale based on usage patterns

## Environment Configuration

### Main App (.env)
```
# Supabase
VITE_SUPABASE_URL=https://xxx.supabase.co
VITE_SUPABASE_PUBLISHABLE_KEY=xxx
SUPABASE_SERVICE_ROLE_KEY=xxx

# WhatsApp Microservice
WHATSAPP_SERVICE_URL=http://localhost:3002
WHATSAPP_SERVICE_SECRET=xxx

# Blockchain
VITE_ESCROW_CONTRACT_ADDRESS=0x...
VITE_USDC_ADDRESS=0x...
```

### WhatsApp Service (.env)
```
# WhatsApp Cloud API
WHATSAPP_TOKEN=EAAT...
WHATSAPP_PHONE_NUMBER_ID=123...
WHATSAPP_VERIFY_TOKEN=xxx

# Supabase Integration
SUPABASE_URL=https://xxx.supabase.co
SUPABASE_SERVICE_KEY=xxx

# Privy Integration
PRIVY_APP_ID=xxx
```

## Security Considerations

1. **Private Keys**: Never expose in client-side code
2. **API Keys**: Use Supabase Row Level Security
3. **WhatsApp Sessions**: Encrypt at rest
4. **Webhook Signatures**: HMAC verification
5. **Rate Limiting**: Protect against abuse

## Monitoring & Logging

1. **Supabase Dashboard**: Function invocations, errors
2. **WhatsApp Logs**: Session status, message delivery
3. **Cost Alerts**: Set up alerts for usage spikes
4. **Error Tracking**: Sentry or similar for frontend

## Next Steps

1. **Immediate**: Migrate payment APIs to Supabase Edge Functions
2. **Short-term**: Update documentation with architecture
3. **Long-term**: Monitor costs and optimize
