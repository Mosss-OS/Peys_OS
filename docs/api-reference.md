# Peys API Documentation

> Stablecoin Payment Platform API Reference

---

## Base URL

```
Production: https://api.peys.app/v1
Sandbox:    https://api.sandbox.peys.app/v1
```

---

## Authentication

All API requests require authentication using an API key.

### Header Authentication

```bash
curl -X GET "https://api.peys.app/v1/payments" \
  -H "Authorization: Bearer sk_live_xxxxxxxxxxxxx" \
  -H "Content-Type: application/json"
```

### API Keys

| Type | Prefix | Usage |
|------|--------|-------|
| Secret Key | `sk_live_` | Server-side operations |
| Public Key | `pk_live_` | Client-side operations |

---

## Endpoints

### Payments

#### Create Payment

Create a new payment with escrow.

```http
POST /v1/payments
```

**Request Body:**

```json
{
  "amount": 100.00,
  "token": "USDC",
  "recipient": "user@example.com",
  "chain_id": 420420417,
  "memo": "Payment for services",
  "expiry_days": 7
}
```

**Response:**

```json
{
  "id": "pay_abc123xyz",
  "status": "pending",
  "amount": 100,
  "token": "USDC",
  "recipient": "user@example.com",
  "claim_link": "https://peys.app/claim/pay_abc123xyz",
  "expires_at": "2026-03-23T12:00:00Z",
  "created_at": "2026-03-16T12:00:00Z"
}
```

#### Get Payment

Retrieve payment details.

```http
GET /v1/payments/:id
```

**Response:**

```json
{
  "id": "pay_abc123xyz",
  "status": "claimed",
  "amount": 100,
  "token": "USDC",
  "recipient": "user@example.com",
  "sender": "0x123...abc",
  "tx_hash": "0x456...def",
  "claimed_at": "2026-03-16T14:30:00Z",
  "expires_at": "2026-03-23T12:00:00Z"
}
```

#### Claim Payment

Claim a pending payment.

```http
POST /v1/payments/:id/claim
```

**Request Body:**

```json
{
  "secret": "your_claim_secret"
}
```

#### List Payments

List all payments for the authenticated user.

```http
GET /v1/payments?status=claimed&limit=20&offset=0
```

**Query Parameters:**

| Parameter | Type | Default | Description |
|-----------|------|---------|-------------|
| status | string | all | `pending`, `claimed`, `expired`, `refunded` |
| limit | number | 20 | Max results (max 100) |
| offset | number | 0 | Pagination offset |
| chain_id | number | all | Filter by chain |

---

### Balances

#### Get Balance

Get account balance across all chains.

```http
GET /v1/balance
```

**Response:**

```json
{
  "total_usd": 1250.00,
  "breakdown": [
    {
      "chain_id": 420420417,
      "chain_name": "Polkadot Asset Hub",
      "usdc": 500,
      "usdt": 0,
      "pass": 750,
      "usd_value": 1250
    }
  ]
}
```

---

### Webhooks

#### Register Webhook

```http
POST /v1/webhooks
```

**Request Body:**

```json
{
  "url": "https://your-server.com/webhook",
  "events": ["payment.claimed", "payment.expired"],
  "secret": "your_webhook_secret"
}
```

#### Webhook Events

| Event | Description |
|-------|-------------|
| `payment.created` | New payment created |
| `payment.claimed` | Payment successfully claimed |
| `payment.expired` | Payment link expired |
| `payment.refunded` | Unclaimed payment refunded |

**Webhook Payload:**

```json
{
  "id": "evt_abc123",
  "type": "payment.claimed",
  "created_at": "2026-03-16T14:30:00Z",
  "data": {
    "payment_id": "pay_xyz789",
    "amount": 100,
    "token": "USDC",
    "recipient": "user@example.com"
  }
}
```

---

### Chains

#### List Supported Chains

```http
GET /v1/chains
```

**Response:**

```json
{
  "chains": [
    {
      "id": 420420417,
      "name": "Polkadot Asset Hub",
      "symbol": "PAS",
      "tokens": ["PASS"],
      "status": "active"
    },
    {
      "id": 84532,
      "name": "Base Sepolia",
      "symbol": "ETH",
      "tokens": ["USDC"],
      "status": "active"
    }
  ]
}
```

---

## Error Codes

| Code | Description |
|------|-------------|
| 400 | Bad Request - Invalid parameters |
| 401 | Unauthorized - Invalid API key |
| 403 | Forbidden - Insufficient permissions |
| 404 | Not Found - Resource doesn't exist |
| 429 | Rate Limited - Too many requests |
| 500 | Internal Error - Server error |

---

## Rate Limits

| Plan | Requests/minute | Webhooks/day |
|------|-----------------|--------------|
| Free | 60 | 100 |
| Pro | 300 | 1,000 |
| Enterprise | Unlimited | Unlimited |

---

## SDK Examples

### JavaScript

```javascript
import { Peys } from '@peys/sdk';

const client = new Peys('sk_live_xxxxx');

// Create payment
const payment = await client.payments.create({
  amount: 100,
  token: 'USDC',
  recipient: 'user@example.com'
});

// Claim payment
await client.payments.claim(payment.id, secret);

// Get balance
const balance = await client.balance.get();
```

### Python

```python
from peys import Peys

client = Peys('sk_live_xxxxx')

# Create payment
payment = client.payments.create(
    amount=100,
    token='USDC',
    recipient='user@example.com'
)
```

### cURL

```bash
# Create payment
curl -X POST "https://api.peys.app/v1/payments" \
  -H "Authorization: Bearer sk_live_xxxxx" \
  -H "Content-Type: application/json" \
  -d '{
    "amount": 100,
    "token": "USDC",
    "recipient": "user@example.com"
  }'
```

---

## Changelog

See [CHANGELOG.md](./CHANGELOG.md) for version history.
