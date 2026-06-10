import { Link } from "react-router-dom";
import { ArrowRight, ArrowLeft, Copy, Check } from "lucide-react";
import { useState } from "react";
import DocsLayout from "@/components/DocsLayout";

function CodeBlock({ code, lang = "typescript" }: { code: string; lang?: string }) {
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

export default function JavaScriptSDKPage() {
  return (
    <DocsLayout>
      <div className="prose prose-invert max-w-none">
        <Link to="/docs" className="inline-flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground mb-4">
          <ArrowLeft className="h-4 w-4" /> Introduction
        </Link>

        <h1 className="text-4xl font-bold text-foreground">JavaScript SDK</h1>
        <p className="mt-4 text-xl text-muted-foreground">
          Official Peys SDK for JavaScript and TypeScript applications.
        </p>

        <section id="installation" className="mt-12">
          <h2 className="text-2xl font-bold text-foreground">Installation</h2>
          <div className="mt-4">
            <CodeBlock
              code={`npm install @peys/sdk`}
            />
          </div>
        </section>

        <section id="initialization" className="mt-12">
          <h2 className="text-2xl font-bold text-foreground">Initialization</h2>
          <div className="mt-4">
            <CodeBlock
              code={`import { Peys } from '@peys/sdk';

const peys = new Peys({
  apiKey: process.env.PEYS_API_KEY,
  
  // Optional configuration
          network: 'base-sepolia',
  baseUrl: 'https://api.peys.io',  // Custom API URL (for testing)
  timeout: 30000,  // Request timeout in ms
});`}
            />
          </div>
        </section>

        <section id="payments-api" className="mt-12">
          <h2 className="text-2xl font-bold text-foreground">Payments API</h2>
          
          <h3 className="text-xl font-semibold text-foreground mt-6">Create Payment</h3>
          <div className="mt-4">
            <CodeBlock
              code={`const payment = await peys.payments.create({
  amount: 10000,
  token: 'USDC',
  recipient: 'user@example.com',
  description: 'Order #123',
  metadata: { orderId: '123' }
});`}
            />
          </div>

          <h3 className="text-xl font-semibold text-foreground mt-6">Get Payment</h3>
          <div className="mt-4">
            <CodeBlock
              code={`const payment = await peys.payments.get('pay_abc123');
console.log(payment.status);`}
            />
          </div>

          <h3 className="text-xl font-semibold text-foreground mt-6">List Payments</h3>
          <div className="mt-4">
            <CodeBlock
              code={`const { data, hasMore } = await peys.payments.list({
  limit: 20,
  status: 'completed'
});`}
            />
          </div>

          <h3 className="text-xl font-semibold text-foreground mt-6">Cancel Payment</h3>
          <div className="mt-4">
            <CodeBlock
              code={`const cancelled = await peys.payments.cancel('pay_abc123');`}
            />
          </div>
        </section>

        <section id="webhooks-api" className="mt-12">
          <h2 className="text-2xl font-bold text-foreground">Webhooks API</h2>
          
          <h3 className="text-xl font-semibold text-foreground mt-6">Create Webhook</h3>
          <div className="mt-4">
            <CodeBlock
              code={`const webhook = await peys.webhooks.create({
  url: 'https://your-server.com/webhooks',
  events: ['payment.completed', 'payment.expired']
});`}
            />
          </div>

          <h3 className="text-xl font-semibold text-foreground mt-6">Verify Webhook</h3>
          <div className="mt-4">
            <CodeBlock
              code={`const event = peys.webhooks.constructEvent(
  payload,
  signature,
  secret
);`}
            />
          </div>
        </section>

        <section id="typescript" className="mt-12">
          <h2 className="text-2xl font-bold text-foreground">TypeScript Types</h2>
          <p className="mt-4 text-muted-foreground">
            The SDK exports all TypeScript types for easy use:
          </p>
          <div className="mt-4">
            <CodeBlock
              code={`import { 
  Peys, 
  Payment, 
  PaymentStatus, 
  Webhook, 
  CreatePaymentParams 
} from '@peys/sdk';

// Use types directly
const params: CreatePaymentParams = {
  amount: 10000,
  token: 'USDC',
  recipient: 'user@example.com'
};`}
            />
          </div>
        </section>

        <section id="error-handling" className="mt-12">
          <h2 className="text-2xl font-bold text-foreground">Error Handling</h2>
          <div className="mt-4">
            <CodeBlock
              code={`import { Peys, PeysError } from '@peys/sdk';

try {
  const payment = await peys.payments.get('invalid_id');
} catch (error) {
  if (error instanceof PeysError) {
    console.log(error.code);    // 'not_found'
    console.log(error.message); // 'Payment not found'
    console.log(error.statusCode); // 404
  }
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
                  <td className="py-3 px-4"><code className="text-primary">peys.payments.create()</code></td>
                  <td className="py-3 px-4">Create a new payment</td>
                </tr>
                <tr className="border-b border-border">
                  <td className="py-3 px-4"><code className="text-primary">peys.payments.get(id)</code></td>
                  <td className="py-3 px-4">Get payment by ID</td>
                </tr>
                <tr className="border-b border-border">
                  <td className="py-3 px-4"><code className="text-primary">peys.payments.list()</code></td>
                  <td className="py-3 px-4">List all payments</td>
                </tr>
                <tr className="border-b border-border">
                  <td className="py-3 px-4"><code className="text-primary">peys.payments.cancel(id)</code></td>
                  <td className="py-3 px-4">Cancel a payment</td>
                </tr>
                <tr className="border-b border-border">
                  <td className="py-3 px-4"><code className="text-primary">peys.webhooks.create()</code></td>
                  <td className="py-3 px-4">Create a webhook</td>
                </tr>
                <tr className="border-b border-border">
                  <td className="py-3 px-4"><code className="text-primary">peys.webhooks.constructEvent()</code></td>
                  <td className="py-3 px-4">Verify webhook signature</td>
                </tr>
              </tbody>
            </table>
          </div>
        </section>

        <div className="mt-16 flex justify-between border-t border-border pt-8">
          <Link to="/docs/api/webhooks-api" className="inline-flex items-center gap-2 text-muted-foreground hover:text-foreground">
            <ArrowLeft className="h-4 w-4" /> Webhooks API
          </Link>
          <Link to="/docs/sdks/python" className="inline-flex items-center gap-2 text-primary hover:underline">
            Python SDK <ArrowRight className="h-4 w-4" />
          </Link>
        </div>
      </div>
    </DocsLayout>
  );
}
