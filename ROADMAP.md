# Peys - Stablecoin Payment Platform Roadmap

> **Vision**: Become the dominant stablecoin payment infrastructure for Africa, empowering individuals, organizations, and developers to send/receive USD-pegged digital currency seamlessly.

---

## Current State (v1.0)

### ✅ Working Features
- Magic Claim Links (send funds via email)
- Multi-chain support (Base Sepolia, Celo Alfajores, Polkadot Asset Hub)
- Embedded wallet via Privy
- Basic dashboard with transaction history
- Email notifications via Resend
- Escrow smart contract for secure payments

### ⚠️ Known Issues
- Transaction nonce handling issues with certain wallets
- Some pages use mock data (Analytics, Batch, Requests, Streaming)
- Celo contract not deployed
- No real payment streaming implementation

---

## Stage 1: Foundation & Polish (Months 1-2)

### 1.1 Core Stability Fixes
- [ ] Fix wallet transaction nonce issues (BitGet, MetaMask)
- [x] Deploy contracts to all supported testnets (Paseo, Base Sepolia, Celo Alfajores)
- [ ] Add comprehensive error handling & user feedback
- [ ] Implement proper transaction status tracking

### 1.2 Complete Existing Features
- [ ] Connect Analytics page to real data
- [ ] Connect Payment Requests/Invoicing to database
- [ ] Implement Batch Payments with CSV upload
- [ ] Implement Contacts management with CRUD
- [ ] Implement Payment Streaming (with streaming contract)

### 1.3 User Experience
- [ ] Add transaction status indicators (pending/confirmed/failed)
- [ ] Add loading states and better UX
- [ ] Mobile responsiveness improvements
- [ ] Add multi-language support (English, French, Portuguese, Swahili)

---

## Stage 2: Africa Market Features (Months 3-4)

### 2.1 Fiat On/Off Ramps 🌍
- [ ] Integrate mobile money (M-Pesa, MTN MoMo, Airtel Money)
- [ ] Add local bank transfer support (Nigeria, Kenya, Ghana, South Africa)
- [ ] Implement fiat-to-stablecoin conversion API
- [ ] Implement stablecoin-to-fiat withdrawal API
- [ ] Add KYC/AML compliance flow

### 2.2 Local Currency Support
- [ ] Add Naira (NGN) settlement
- [ ] Add Kenyan Shilling (KES) settlement
- [ ] Add Ghanaian Cedi (GHS) settlement
- [ ] Add South African Rand (ZAR) settlement
- [ ] Real-time exchange rate integration

### 2.3 Payment Methods
- [ ] USSD payment support (feature phone users)
- [ ] QR code payments for in-store
- [ ] QR code generation for merchants
- [ ] Payment links for invoices

---

## Stage 3: Business & Organization Features (Months 5-6)

### 3.1 Organization Dashboard
- [ ] Organization profiles with team management
- [ ] Role-based access control (Admin, Manager, Viewer)
- [ ] Organization-wide transaction history
- [ ] Spending limits and approvals workflow

### 3.2 Merchant Tools
- [ ] Merchant onboarding & KYC
- [ ] Payment checkout pages
- [ ] Store/inventory integration
- [ ] Transaction analytics for merchants
- [ ] Refund management

### 3.3 B2B Payments
- [ ] Bulk payment processing
- [ ] Vendor payment management
- [ ] Supplier invoice handling
- [ ] Intercompany transfers (treasury)

### 3.4 Payroll & Gig Economy
- [ ] Bulk salary/contractor payments
- [ ] Scheduled/repeating payments
- [ ] Payment approval workflows
- [ ] Contractor management

---

## Stage 4: Developer Platform (Months 7-9)

### 4.1 Developer API 🛠️
- [ ] RESTful API for all operations
- [ ] API authentication (API keys, OAuth)
- [ ] Rate limiting & usage analytics
- [ ] Webhook notifications
- [ ] Sandbox/Testing environment

### 4.2 SDKs & Libraries
- [ ] JavaScript/TypeScript SDK
- [ ] Python SDK
- [ ] Mobile SDKs (iOS, Android)
- [ ] WordPress/WooCommerce plugin
- [ ] Shopify integration

### 4.3 Documentation
- [ ] Comprehensive API documentation
- [ ] Integration guides
- [ ] Code examples & tutorials
- [ ] Postman collection
- [ ] Status page & uptime monitoring

### 4.4 Embedded Wallet API
- [ ] White-label wallet solution
- [ ] Custom branding options
- [ ] KYC-as-a-service
- [ ] Multi-tenant architecture

---

## Stage 5: Advanced Features (Months 10-12)

### 5.1 DeFi Integration
- [ ] Yield on stablecoin balances
- [ ] Auto-compounding for merchants
- [ ] USD-based savings accounts

### 5.2 Smart Contracts
- [ ] Escrow with multi-sig support
- [ ] Time-locked payments
- [ ] Conditional payments (milestone-based)
- [ ] Recurring subscription payments

### 5.3 AI Integration
- [ ] Payment assistant (expand existing)
- [ ] Fraud detection
- [ ] Exchange rate predictions
- [ ] Automated treasury management

### 5.4 Cross-Border Trade
- [ ] Letter of Credit simulation
- [ ] Trade finance integration
- [ ] Multi-currency hedging
- [ ] Supplier financing

---

## Technical Architecture

```
┌─────────────────────────────────────────────────────────────┐
│                      Peys Platform                         │
├─────────────────────────────────────────────────────────────┤
│  Frontend (React + Vite)                                   │
│  ├── Web App (peys.io)                                   │
│  ├── Mobile App (React Native)                              │
│  └── Admin Dashboard                                        │
├─────────────────────────────────────────────────────────────┤
│  API Layer                                                 │
│  ├── REST API (Primary)                                    │
│  ├── GraphQL (Optional)                                    │
│  └── Webhooks                                              │
├─────────────────────────────────────────────────────────────┤
│  Backend Services                                          │
│  ├── Supabase (Auth, DB, Edge Functions)                  │
│  ├── Payment Processing Service                             │
│  ├── KYC/AML Service                                       │
│  ├── Notification Service                                   │
│  └── Analytics Service                                     │
├─────────────────────────────────────────────────────────────┤
│  Blockchain Layer                                          │
│  ├── Escrow Contract (Current)                            │
│  ├── Streaming Contract (New)                              │
│  └── Cross-chain Bridges (Future)                          │
├─────────────────────────────────────────────────────────────┤
│  Fiat Rails (Africa)                                       │
│  ├── Mobile Money (M-Pesa, MTN, Airtel)                  │
│  ├── Bank Transfers (Nigeria, Kenya, Ghana, SA)           │
│  └── Card Processing                                       │
└─────────────────────────────────────────────────────────────┘
```

---

## Monetization Strategy

### Individual Users
- Free tier: Up to $100/month
- Premium: 1% fee on transactions above threshold

### Organizations
- Starter: $49/month
- Business: $199/month  
- Enterprise: Custom pricing

### Developers
- Free API keys: 1000 requests/month
- Pro: $99/month - 100k requests
- Enterprise: Custom limits

### Revenue Streams
1. Transaction fees (0.5-1%)
2. Fiat on/off ramp spread
3. API subscription plans
4. Merchant services fees
5. Enterprise licensing

---

## Success Metrics (Year 1)

| Metric | Target |
|--------|--------|
| Registered Users | 100,000 |
| Monthly Active Users | 25,000 |
| Transaction Volume | $10M/month |
| Countries Supported | 15 African countries |
| Developer Integrations | 500+ API keys |
| Merchant Partners | 1,000 |

---

## Contributing

See [CONTRIBUTING.md](./CONTRIBUTING.md) for development guidelines.

## License

MIT License - see [LICENSE](./LICENSE) for details.

---

*Last Updated: March 2026*
*Version: 1.0.0*
*Roadmap Version: 2.0.0*
