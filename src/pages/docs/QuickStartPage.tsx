import { Link } from "react-router-dom";
import { ArrowRight, ArrowLeft, Terminal, Copy, Check } from "lucide-react";
import { useState } from "react";
import DocsLayout from "@/components/DocsLayout";

function CodeBlock({ code, lang = "bash" }: { code: string; lang?: string }) {
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

export default function QuickStartPage() {
  return (
    <DocsLayout>
      <div className="prose prose-invert max-w-none">
        <Link to="/docs" className="inline-flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground mb-4">
          <ArrowLeft className="h-4 w-4" /> Introduction
        </Link>

        <h1 className="text-4xl font-bold text-foreground">Quick Start</h1>
        <p className="mt-4 text-xl text-muted-foreground">
          Get started with Peys in under 5 minutes. This guide will walk you through your first payment integration.
        </p>

        <div className="mt-8 rounded-lg border border-green-500/20 bg-green-500/10 p-4">
          <p className="text-sm text-green-400">
            <strong>New:</strong> Get your API key from the <Link to="/api-keys" className="underline">API Keys page</Link> and start integrating in minutes!
          </p>
        </div>

        <section id="step-1-install" className="mt-12">
          <h2 className="text-2xl font-bold text-foreground">Step 1: Install the SDK</h2>
          <p className="mt-4 text-muted-foreground">
            Install the Peys SDK using your preferred package manager:
          </p>
          <div className="mt-4 space-y-4">
            <CodeBlock
              lang="npm"
              code={`npm install @peys/sdk`}
            />
            <CodeBlock
              lang="yarn"
              code={`yarn add @peys/sdk`}
            />
            <CodeBlock
              lang="pnpm"
              code={`pnpm add @peys/sdk`}
            />
          </div>
        </section>

        <section id="step-2-initialize" className="mt-12">
          <h2 className="text-2xl font-bold text-foreground">Step 2: Initialize the Client</h2>
          <p className="mt-4 text-muted-foreground">
            Create a Peys client instance with your API key:
          </p>
          <div className="mt-4">
            <CodeBlock
              lang="typescript"
              code={`import { Peys } from '@peys/sdk';

const peys = new Peys({
  apiKey: process.env.PEYS_API_KEY || 'pk_xxxxxxxxxxxxx',
  // Optional: specify base URL (defaults to https://api.peys.io)
  // baseUrl: 'https://api.peys.io',
});`}
            />
          </div>
        </section>

        <section id="step-3-create" className="mt-12">
          <h2 className="text-2xl font-bold text-foreground">Step 3: Create a Payment</h2>
          <p className="mt-4 text-muted-foreground">
            Create a payment link that you can share with your user:
          </p>
          <div className="mt-4">
            <CodeBlock
              lang="typescript"
              code={`// Create a new payment
const payment = await peys.payments.create({
  amount: 100,           // Amount in smallest unit (e.g., cents for USDC)
  token: 'USDC',         // Token symbol
  recipient: 'alice@example.com',  // Recipient email or wallet address
  description: 'Payment for Order #12345',
  expiresIn: 3600,      // Payment link expires in 1 hour (optional)
});

console.log(payment);
// {
//   id: 'pay_abc123',
//   link: 'https://peys.app/pay/abc123',
//   amount: 100,
//   status: 'pending',
//   createdAt: '2024-01-15T10:30:00Z'
// }`}
            />
          </div>
        </section>

        <section id="step-4-webhooks" className="mt-12">
          <h2 className="text-2xl font-bold text-foreground">Step 4: Handle Webhooks</h2>
          <p className="mt-4 text-muted-foreground">
            Subscribe to payment events to know when a payment is completed:
          </p>
          <div className="mt-4">
            <CodeBlock
              lang="typescript"
              code={`// Example webhook handler (Express.js)
app.post('/webhooks/peys', express.raw({type: 'application/json'}), 
  async (req, res) => {
    const event = peys.webhooks.constructEvent(
      req.body,
      req.headers['x-peys-signature'] as string,
      process.env.PEYS_WEBHOOK_SECRET!
    );

    switch (event.type) {
      case 'payment.completed':
        const payment = event.data;
        console.log('Payment received:', payment.id);
        // TODO: Fulfill the order
        break;
      case 'payment.expired':
        console.log('Payment expired:', event.data.id);
        break;
    }

    res.json({ received: true });
  }
);`}
            />
          </div>
        </section>

        <section id="step-5-verify" className="mt-12">
          <h2 className="text-2xl font-bold text-foreground">Step 5: Verify Payment Status</h2>
          <p className="mt-4 text-muted-foreground">
            You can always check the status of a payment:
          </p>
          <div className="mt-4">
            <CodeBlock
              lang="typescript"
              code={`// Get payment details
const payment = await peys.payments.get('pay_abc123');

console.log(payment.status);
// 'pending' | 'completed' | 'expired' | 'cancelled'

if (payment.status === 'completed') {
  console.log('Payment verified!');
  // TODO: Mark order as paid
}`}
            />
          </div>
        </section>

        <section className="mt-12">
          <h2 className="text-2xl font-bold text-foreground">Alternative: Use REST API Directly</h2>
          <p className="mt-4 text-muted-foreground">
            You can also use the Peys API directly without the SDK. Here's an example using fetch:
          </p>
          <div className="mt-4">
            <CodeBlock
              lang="bash"
              code={`# Create a payment using REST API
curl -X POST https://api.peys.io/v1/payments \\
  -H "Content-Type: application/json" \\
  -H "X-API-Key: pk_xxxxxxxxxxxxx" \\
  -d '{
    "recipient": "alice@example.com",
    "amount": 100,
    "token": "USDC",
    "memo": "Payment for Order #12345"
  }'`}
            />
          </div>
          <p className="mt-4 text-sm text-muted-foreground">
            See the <Link to="/docs/api/payments" className="text-primary hover:underline">API Reference</Link> for all available endpoints.
          </p>
        </section>

        <section className="mt-16 rounded-xl border border-green-500/20 bg-green-500/10 p-6">
          <h2 className="text-xl font-bold text-green-400">Congratulations! 🎉</h2>
          <p className="mt-2 text-muted-foreground">
            You've successfully integrated payments into your application. Here's what you can do next:
          </p>
          <ul className="mt-4 space-y-2 text-muted-foreground">
            <li className="flex items-center gap-2">
              <Check className="h-4 w-4 text-green-500" />
              <Link to="/docs/api/payments" className="text-primary hover:underline">Explore the full Payments API →</Link>
            </li>
            <li className="flex items-center gap-2">
              <Check className="h-4 w-4 text-green-500" />
              <Link to="/docs/sdks/javascript" className="text-primary hover:underline">Learn about SDK features →</Link>
            </li>
            <li className="flex items-center gap-2">
              <Check className="h-4 w-4 text-green-500" />
              <Link to="/docs/webhooks" className="text-primary hover:underline">Set up webhooks →</Link>
            </li>
          </ul>
        </section>

        <div className="mt-12 flex justify-between border-t border-border pt-8">
          <Link to="/docs" className="inline-flex items-center gap-2 text-muted-foreground hover:text-foreground">
            <ArrowLeft className="h-4 w-4" /> Introduction
          </Link>
          <Link to="/docs/installation" className="inline-flex items-center gap-2 text-primary hover:underline">
            Installation <ArrowRight className="h-4 w-4" />
          </Link>
        </div>
      </div>
    </DocsLayout>
  );
}
