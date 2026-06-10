# Project Cost Breakdown

This document outlines all the services and technologies used in the PeyDot Magic Links project along with their costs in both USD and Nigerian Naira (NGN).

**Exchange Rate**: $1 = ₦1,415 (Black Market - March 2026)

---

## Infrastructure & Hosting

| Service | Description | Free Tier | Paid Plan | Monthly Cost (USD) | Monthly Cost (NGN) | Location |
|---------|-------------|-----------|-----------|-------------------|-------------------|----------|
| **Vercel** | Frontend hosting (React/Vite) | 100GB bandwidth/month | Pro Plan | $20/user/month | ₦28,300/user | [vercel.com](https://vercel.com) |
| **Railway** | Backend/VPS hosting | $5 credit/month | Starter/Pro | $5-50/month | ₦7,075-70,750 | [railway.app](https://railway.app) |
| **Render** | Alternative VPS hosting | None | Starter | $7/month | ₦9,905 | [render.com](https://render.com) |
| **Supabase** | Database, Auth, Edge Functions | 500MB DB, 1GB Storage, 500K Edge Functions | Pro Plan | $25/month | ₦35,375 | [supabase.com](https://supabase.com) |

---

## Third-Party APIs & Services

| Service | Description | Free Tier | Paid Plan | Monthly Cost (USD) | Monthly Cost (NGN) | Location |
|---------|-------------|-----------|-----------|-------------------|-------------------|----------|
| **Privy** | Embedded wallet authentication | 50K signatures/month | Growth Plan | $299-499/month | ₦423,085-706,435 | [privy.io](https://privy.io) |
| **Resend** | Email delivery service | 3,000 emails/month | Essential | $20/month | ₦28,300 | [resend.com](https://resend.com) |
| **Alchemy** | RPC provider (Base, Celo, Polygon) | 30M CU/month | Pay as you go | $0.45/M CU | ₦637/M CU | [alchemy.com](https://alchemy.com) |
| **Infura** | Alternative RPC provider | 100K requests/day | Developer | $50/month | ₦70,750 | [infura.io](https://infura.io) |

---

## Development Tools

| Service | Description | Cost (USD) | Cost (NGN) | Location |
|---------|-------------|-----------|-----------|----------|
| **Foundry** | Smart contract development | Free | Free | [book.getfoundry.sh](https://book.getfoundry.sh) |
| **GitHub** | Code repository | Free | Free | [github.com](https://github.com) |
| **ESLint/Prettier** | Code linting | Free | Free | Open source |

---

## Blockchain Networks (RPC Costs)

| Network | RPC Provider | Free Tier | Cost After Free | Location |
|---------|--------------|-----------|-----------------|----------|
| **Base Sepolia** | Alchemy | 30M CU | $0.45/M CU | [alchemy.com](https://alchemy.com) |
| **Celo Alfajores** | Alchemy | 30M CU | $0.45/M CU | [alchemy.com](https://alchemy.com) |
| **Polkadot** | Parity/Subsquid | Free | Varies | [polkadot.network](https://polkadot.network) |
| **Polygon Amoy** | Alchemy | 30M CU | $0.45/M CU | [alchemy.com](https://alchemy.com) |

---

## Estimated Monthly Costs Summary

### Starter/Beginner Project (Free Tier Usage)

| Service | Monthly Cost (USD) | Monthly Cost (NGN) |
|---------|-------------------|---------------------|
| Vercel (Hobby) | $0 | ₦0 |
| Supabase (Free) | $0 | ₦0 |
| Privy (Free) | $0 | ₦0 |
| Resend (Free) | $0 | ₦0 |
| Alchemy (Free) | $0 | ₦0 |
| **TOTAL** | **$0** | **₦0** |

---

### Small Project (Growth Phase)

| Service | Monthly Cost (USD) | Monthly Cost (NGN) |
|---------|-------------------|---------------------|
| Vercel (Pro) | $20 | ₦28,300 |
| Railway (Starter) | $5 | ₦7,075 |
| Supabase (Pro) | $25 | ₦35,375 |
| Privy (Developer) | $0* | ₦0* |
| Resend (Essential) | $20 | ₦28,300 |
| Alchemy (Pay as you go) | $10 | ₦14,150 |
| **TOTAL** | **~$80** | **~₦113,200** |

*Privy Developer plan includes 50K free signatures/month

---

### Production Project

| Service | Monthly Cost (USD) | Monthly Cost (NGN) |
|---------|-------------------|---------------------|
| Vercel (Pro) | $20 | ₦28,300 |
| Railway (Pro) | $25-50 | ₦35,375-70,750 |
| Supabase (Pro) | $25 | ₦35,375 |
| Privy (Growth) | $499 | ₦706,435 |
| Resend (Growing) | $49 | ₦69,335 |
| Alchemy (Pay as you go) | $25 | ₦35,375 |
| **TOTAL** | **~$643-668** | **~₦910,000-945,000** |

---

## Where Each Service is Used in Code

### Package.json Dependencies

| Package | Service | File Location |
|---------|--------|---------------|
| `@privy-io/react-auth` | Privy Auth | `package.json:23-24` |
| `@privy-io/wagmi` | Privy Wagmi | `package.json:24` |
| `@supabase/supabase-js` | Supabase Client | `package.json:52` |
| `ethers` / `viem` / `wagmi` | Blockchain Interaction | `package.json:62,83-84` |
| `resend` | Email Service (Backend) | Edge Functions |
| `sequelize` / `pg` | PostgreSQL | `package.json:77,103` |
| `express` | Backend Server | `package.json:63` |

### Environment Variables

| Variable | Service | File Location |
|----------|--------|---------------|
| `VITE_SUPABASE_URL` | Supabase | `.env.example:8` |
| `VITE_SUPABASE_PUBLISHABLE_KEY` | Supabase | `.env.example:9` |
| `VITE_PRIVY_APP_ID` | Privy | `.env.example:13` |
| `RESEND_API_KEY` | Resend | `.env.example:64` |
| `VITE_RPC_URL_*` | Alchemy/Infura | `.env.example:16-43` |

---

## Cost Optimization Tips

1. **Stay on Free Tier**: For MVP/testing, all services have generous free tiers
2. **Use Self-Hosted Alternatives**: 
   - Instead of Railway/Render: DigitalOcean Droplet ($5/month)
   - Instead of Vercel: Cloudflare Pages (Free)
3. **Alchemy Free Tier**: 30M CU/month is enough for ~100K transactions
4. **Resend**: 3K free emails/month covers most early-stage apps
5. **Supabase**: Free tier covers up to 500K Edge Function invocations

---

## References

- [Supabase Pricing](https://supabase.com/pricing)
- [Privy Pricing](https://privy.io/pricing)
- [Resend Pricing](https://resend.com/pricing)
- [Vercel Pricing](https://vercel.com/pricing)
- [Railway Pricing](https://railway.app/pricing)
- [Render Pricing](https://render.com/pricing)
- [Alchemy Pricing](https://alchemy.com/pricing)
