# Peys SDK for JavaScript/TypeScript

[![npm version](https://img.shields.io/npm/v/@peys-os/sdk)](https://www.npmjs.com/package/@peys-os/sdk)
[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](https://opensource.org/licenses/MIT)

The official Peys payment SDK for JavaScript and TypeScript applications.

## Features

- **Magic Claim Links**: Send crypto payments via shareable links
- **Multi-chain Support**: Works with Base, Celo, and Polkadot Asset Hub
- **WhatsApp Integration**: Build WhatsApp bot integrations
- **TypeScript Support**: Full TypeScript definitions included
- **REST API Client**: Easy integration with Peys API

## Installation

```bash
npm install @peys-os/sdk
```

Or using yarn:
```bash
yarn add @peys-os/sdk
```

Or using pnpm:
```bash
pnpm add @peys-os/sdk
```

## Authentication

You need a Peys API key from your [dashboard](https://peys-os.github.io/dashboard).

```typescript
import { PeysClient } from '@peys-os/sdk';

const client = new PeysClient({
  apiKey: 'your-api-key'
});
```

## Quick Start

### Send a Payment

```typescript
const payment = await client.payments.create({
  recipient: 'recipient@example.com',
  amount: 1000000, // in smallest unit (USDC has 6 decimals)
  token: 'USDC'
});

console.log('Payment link:', payment.claimLink);
```

### Check Payment Status

```typescript
const status = await client.payments.get(payment.id);
console.log('Status:', status.status);
```

### Claim a Payment

```typescript
await client.payments.claim(payment.id, {
  walletAddress: '0x...',
  secret: payment.secret
});
```

## All SDKs

| Language | Package | Install |
|----------|---------|---------|
| JavaScript/TypeScript | `@peys-os/sdk` | `npm install @peys-os/sdk` |
| Python | `peys-sdk` | `pip install peys-sdk` |
| Go | `github.com/Peys-OS/Peys_OS/sdks/go` | `go get github.com/Peys-OS/Peys_OS/sdks/go` |

## Documentation

For full documentation, visit [docs.peys.io](https://docs.peys.io).

## License

MIT
