# Peys Payment SDKs

Official SDKs for integrating Peys payments into your applications.

## Available SDKs

| Language | Package | Install |
|----------|---------|---------|
| JavaScript/TypeScript | `@peys/sdk` | `npm install @peys/sdk` |
| Python | `peys` | `pip install peys` |
| Go | `github.com/peys-os/peys-sdk-go` | `go get github.com/peys-os/peys-sdk-go` |
| PHP | `peys/peys-sdk` | `composer require peys/peys-sdk` |

## Quick Start

### JavaScript/TypeScript

```bash
npm install @peys/sdk
```

```typescript
import { Peys } from '@peys/sdk';

const peys = new Peys({ apiKey: 'pk_live_xxx' });

const payment = await peys.payments.create({
  amount: 1000000,
  currency: 'USDC',
  recipient: '0x123...'
});

console.log(payment.claimLink);
```

### Python

```bash
pip install peys
```

```python
from peys import Peys

client = Peys(api_key="pk_live_xxx")

payment = client.payments.create(
    amount="1000000",
    currency="USDC",
    recipient="0x123..."
)

print(payment['claimLink'])
```

### Go

```bash
go get github.com/peys-os/peys-sdk-go
```

```go
package main

import (
    "fmt"
    "github.com/peys-os/peys-sdk-go"
)

func main() {
    client, _ := peys.NewClient("pk_live_xxx")
    
    payment, err := client.Payments().Create(peys.CreatePaymentInput{
        Amount:    "1000000",
        Currency:  "USDC",
        Recipient: "0x123...",
    })
    
    fmt.Println(payment.ClaimLink)
}
```

### PHP

```bash
composer require peys/peys-sdk
```

```php
<?php

use Peys\PeysClient;

$client = new PeysClient('pk_live_xxx');

$payment = $client->getPayments()->create([
    'amount' => '1000000',
    'currency' => 'USDC',
    'recipient' => '0x123...'
]);

echo $payment['claimLink'];
```

## Features

- **Payments**: Create, confirm, and refund USDC payments
- **Payment Links**: Generate shareable payment links
- **Fiat Withdrawal**: Withdraw to African bank accounts
- **Bills Payment**: Pay airtime, data, TV, electricity bills
- **P2P Marketplace**: Trade USDC for fiat currency
- **Webhooks**: Receive real-time payment notifications

## Supported Networks

- Base Sepolia (Chain ID: 84532)
- Polygon Amoy (Chain ID: 80002)
- Celo Alfajores (Chain ID: 44787)

## Documentation

For full documentation, visit [https://docs.peys.app](https://docs.peys.app)

## Support

- Email: peys.xyz@gmail.com
- GitHub Issues: [https://github.com/peys-OS/peys-sdk/issues](https://github.com/peys-OS/peys-sdk/issues)

## License

MIT License
