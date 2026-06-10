import { Link } from "react-router-dom";
import { ArrowRight, ArrowLeft, Copy, Check } from "lucide-react";
import { useState } from "react";
import DocsLayout from "@/components/DocsLayout";

function CodeBlock({ code, lang = "go" }: { code: string; lang?: string }) {
  const [copied, setCopied] = useState(false);

  const copyCode = () => {
    navigator.clipboard.writeText(code);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="relative rounded-lg border border-border bg-secondary/50 overflow-hidden">
      <div className="flex items-center justify-between border-b border-border px-4 py-2">
        <span className="text-xs font-medium text-muted-foreground uppercase">{lang}</span>
        <button
          onClick={copyCode}
          className="flex items-center gap-1 text-xs text-muted-foreground hover:text-foreground"
        >
          {copied ? <Check className="h-3 w-3" /> : <Copy className="h-3 w-3" />}
          {copied ? "Copied!" : "Copy"}
        </button>
      </div>
      <pre className="overflow-x-auto p-4">
        <code className="text-sm font-mono text-foreground whitespace-pre">{code}</code>
      </pre>
    </div>
  );
}

export default function GoSDKPage() {
  return (
    <DocsLayout>
      <div className="prose prose-invert max-w-none">
        <Link to="/docs" className="inline-flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground mb-4">
          <ArrowLeft className="h-4 w-4" /> Introduction
        </Link>

        <h1 className="text-4xl font-bold text-foreground">Go SDK</h1>
        <p className="mt-4 text-xl text-muted-foreground">
          Official Peys SDK for Go applications.
        </p>

        <section id="installation" className="mt-12">
          <h2 className="text-2xl font-bold text-foreground">Installation</h2>
          <div className="mt-4">
            <CodeBlock
              code={`go get github.com/peys/sdk-go`}
            />
          </div>
        </section>

        <section id="initialization" className="mt-12">
          <h2 className="text-2xl font-bold text-foreground">Initialization</h2>
          <div className="mt-4">
            <CodeBlock
              code={`package main

import (
    "os"
    "github.com/peys/sdk-go"
)

func main() {
    client := peys.New(peys.Config{
        APIKey: os.Getenv("PEYS_API_KEY"),
        Network: "base-sepolia",  // optional
    })
}`}
            />
          </div>
        </section>

        <section id="usage" className="mt-12">
          <h2 className="text-2xl font-bold text-foreground">Usage Examples</h2>
          
          <h3 className="text-xl font-semibold text-foreground mt-6">Create Payment</h3>
          <div className="mt-4">
            <CodeBlock
              code={`payment, err := client.Payments.Create(context.Background(), &peys.CreatePaymentParams{
    Amount:    10000,
    Token:     "USDC",
    Recipient: "user@example.com",
    Description: peys.String("Order #123"),
})

if err != nil {
    log.Fatal(err)
}

fmt.Println(payment.ID)
fmt.Println(payment.Link)`}
            />
          </div>

          <h3 className="text-xl font-semibold text-foreground mt-6">Get Payment</h3>
          <div className="mt-4">
            <CodeBlock
              code={`payment, err := client.Payments.Get(context.Background(), "pay_abc123")

if err != nil {
    log.Fatal(err)
}

fmt.Println(payment.Status)`}
            />
          </div>

          <h3 className="text-xl font-semibold text-foreground mt-6">List Payments</h3>
          <div className="mt-4">
            <CodeBlock
              code={`payments, err := client.Payments.List(context.Background(), &peys.ListPaymentsParams{
    Limit: peys.Int(20),
})

for _, payment := range payments.Data {
    fmt.Println(payment.ID, payment.Status)
}`}
            />
          </div>

          <h3 className="text-xl font-semibold text-foreground mt-6">Webhooks</h3>
          <div className="mt-4">
            <CodeBlock
              code={`event, err := peys.ConstructEvent(
    payload,
    signature,
    secret,
)

if err != nil {
    http.Error(w, err.Error(), 400)
    return
}

switch event.Type {
case "payment.completed":
    payment := event.Data
    // Handle payment completion
}`}
            />
          </div>
        </section>

        <section id="error-handling" className="mt-12">
          <h2 className="text-2xl font-bold text-foreground">Error Handling</h2>
          <div className="mt-4">
            <CodeBlock
              code={`import "github.com/peys/sdk-go/peyserror"

payment, err := client.Payments.Get(context.Background(), "invalid")

if errors.Is(err, peyserror.NotFound) {
    fmt.Println("Payment not found")
} else if errors.Is(err, peyserror.RateLimited) {
    fmt.Println("Rate limited, retry later")
} else if err != nil {
    log.Fatal(err)
}`}
            />
          </div>
        </section>

        <section className="mt-12">
          <h2 className="text-2xl font-bold text-foreground">Supported Methods</h2>
          <div className="mt-4 overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-border">
                  <th className="text-left py-3 px-4 font-medium text-foreground">Method</th>
                  <th className="text-left py-3 px-4 font-medium text-foreground">Description</th>
                </tr>
              </thead>
              <tbody className="text-muted-foreground">
                <tr className="border-b border-border">
                  <td className="py-3 px-4"><code className="text-primary">client.Payments.Create()</code></td>
                  <td className="py-3 px-4">Create a new payment</td>
                </tr>
                <tr className="border-b border-border">
                  <td className="py-3 px-4"><code className="text-primary">client.Payments.Get()</code></td>
                  <td className="py-3 px-4">Get payment by ID</td>
                </tr>
                <tr className="border-b border-border">
                  <td className="py-3 px-4"><code className="text-primary">client.Payments.List()</code></td>
                  <td className="py-3 px-4">List all payments</td>
                </tr>
                <tr className="border-b border-border">
                  <td className="py-3 px-4"><code className="text-primary">client.Payments.Cancel()</code></td>
                  <td className="py-3 px-4">Cancel a payment</td>
                </tr>
              </tbody>
            </table>
          </div>
        </section>

        <div className="mt-16 flex justify-between border-t border-border pt-8">
          <Link to="/docs/sdks/python" className="inline-flex items-center gap-2 text-muted-foreground hover:text-foreground">
            <ArrowLeft className="h-4 w-4" /> Python SDK
          </Link>
          <Link to="/docs/widgets/overview" className="inline-flex items-center gap-2 text-primary hover:underline">
            Widgets Overview <ArrowRight className="h-4 w-4" />
          </Link>
        </div>
      </div>
    </DocsLayout>
  );
}
