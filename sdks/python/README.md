# Peys SDK for Python

[![PyPI version](https://img.shields.io/pypi/v/peys-sdk)](https://pypi.org/project/peys-sdk/)
[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](https://opensource.org/licenses/MIT)

The official Peys payment SDK for Python applications.

## Installation

```bash
pip install peys-sdk
```

Or using poetry:
```bash
poetry add peys-sdk
```

## Authentication

You need a Peys API key from your [dashboard](https://peys-os.github.io/dashboard).

```python
from peys import PeysClient

client = PeysClient(api_key='your-api-key')
```

## Quick Start

### Send a Payment

```python
payment = client.payments.create(
    recipient='recipient@example.com',
    amount=1000000,  # in smallest unit (USDC has 6 decimals)
    token='USDC'
)

print(f'Payment link: {payment.claim_link}')
```

### Check Payment Status

```python
status = client.payments.get(payment.id)
print(f'Status: {status.status}')
```

### Claim a Payment

```python
client.payments.claim(
    payment_id=payment.id,
    wallet_address='0x...',
    secret=payment.secret
)
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
