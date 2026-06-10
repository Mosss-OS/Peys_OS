# Peys SDK for Go

[![Go Reference](https://pkg.go.dev/badge/github.com/Peys-OS/Peys_OS/sdks/go.svg)](https://pkg.go.dev/github.com/Peys-OS/Peys_OS/sdks/go)
[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](https://opensource.org/licenses/MIT)

The official Peys payment SDK for Go applications.

## Installation

```bash
go get github.com/Peys-OS/Peys_OS/sdks/go@v1.0.0
```

## Authentication

You need a Peys API key from your [dashboard](https://peys-os.github.io/dashboard).

```go
import "github.com/Peys-OS/Peys_OS/sdks/go/peys"

client := peys.NewClient("your-api-key")
```

## Quick Start

### Send a Payment

```go
payment, err := client.Payments.Create(peys.CreatePaymentParams{
    Recipient: "recipient@example.com",
    Amount:   1000000, // in smallest unit (USDC has 6 decimals)
    Token:    "USDC",
})
if err != nil {
    log.Fatal(err)
}

fmt.Printf("Payment link: %s\n", payment.ClaimLink)
```

### Check Payment Status

```go
status, err := client.Payments.Get(payment.ID)
if err != nil {
    log.Fatal(err)
}

fmt.Printf("Status: %s\n", status.Status)
```

### Claim a Payment

```go
err = client.Payments.Claim(peys.ClaimPaymentParams{
    PaymentID:    payment.ID,
    WalletAddress: "0x...",
    Secret:       payment.Secret,
})
if err != nil {
    log.Fatal(err)
}
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
