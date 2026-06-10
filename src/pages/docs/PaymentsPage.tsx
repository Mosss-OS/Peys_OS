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

export default function PaymentsPage() {
  return (
    <DocsLayout>
      <div className="prose prose-invert max-w-none">
        <Link to="/docs" className="inline-flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground mb-4">
          <ArrowLeft className="h-4 w-4" /> Introduction
        </Link>

        <h1 className="text-4xl font-bold text-foreground">Payments</h1>
        <p className="mt-4 text-xl text-muted-foreground">
          Learn how to create, manage, and track payments using the Peys SDK.
        </p>

        <section id="overview" className="mt-12">
          <h2 className="text-2xl font-bold text-foreground">Overview</h2>
          <p className="mt-4 text-muted-foreground">
            Payments are the core resource in Peys. A payment represents a request for money that can be fulfilled via blockchain transactions. Payments can be created with an email address or wallet address as the recipient.
          </p>
        </section>

        <section id="create-payment" className="mt-12">
          <h2 className="text-2xl font-bold text-foreground">Create a Payment</h2>
          <p className="mt-4 text-muted-foreground">
            To create a payment, use the <code className="text-primary">payments.create()</code> method:
          </p>
          <div className="mt-4">
            <CodeBlock
              code={`const payment = await peys.payments.create({
  amount: 10000,              // Amount in smallest token units (e.g., 10000 = $10.00 USDC)
  token: 'USDC',              // Token symbol: 'USDC' | 'USDT'
  recipient: 'alice@example.com', // Recipient email or wallet address
  description: 'Order #12345',   // Optional description
  expiresIn: 3600,            // Link expires in 1 hour (optional, default: 24 hours)
  metadata: {                 // Custom metadata (optional)
    orderId: '12345',
    customerId: 'cust_abc'
  }
});

console.log(payment);
// {
//   id: 'pay_abc123',
//   link: 'https://peys.app/pay/abc123',
//   amount: 10000,
//   token: 'USDC',
//   status: 'pending',
//   description: 'Order #12345',
//   createdAt: '2024-01-15T10:30:00Z',
//   expiresAt: '2024-01-15T11:30:00Z'
// }`}
            />
          </div>
        </section>

        <section id="statuses" className="mt-12">
          <h2 className="text-2xl font-bold text-foreground">Payment Statuses</h2>
          <p className="mt-4 text-muted-foreground">
            A payment can have one of the following statuses:
          </p>
          <div className="mt-4 overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-border">
                  <th className="text-left py-3 px-4 font-medium text-foreground">Status</th>
                  <th className="text-left py-3 px-4 font-medium text-foreground">Description</th>
                </tr>
              </thead>
              <tbody className="text-muted-foreground">
                <tr className="border-b border-border">
                  <td className="py-3 px-4"><code className="bg-secondary px-2 py-1 rounded text-primary">pending</code></td>
                  <td className="py-3 px-4">Payment link created, awaiting payment</td>
                </tr>
                <tr className="border-b border-border">
                  <td className="py-3 px-4"><code className="bg-secondary px-2 py-1 rounded text-green-500">completed</code></td>
                  <td className="py-3 px-4">Payment has been completed on-chain</td>
                </tr>
                <tr className="border-b border-border">
                  <td className="py-3 px-4"><code className="bg-secondary px-2 py-1 rounded text-yellow-500">expired</code></td>
                  <td className="py-3 px-4">Payment link has expired</td>
                </tr>
                <tr className="border-b border-border">
                  <td className="py-3 px-4"><code className="bg-secondary px-2 py-1 rounded text-red-500">cancelled</code></td>
                  <td className="py-3 px-4">Payment was cancelled by the sender</td>
                </tr>
              </tbody>
            </table>
          </div>
        </section>

        <section id="get-payment" className="mt-12">
          <h2 className="text-2xl font-bold text-foreground">Get Payment Details</h2>
          <p className="mt-4 text-muted-foreground">
            Retrieve a payment by its ID:
          </p>
          <div className="mt-4">
            <CodeBlock
              code={`const payment = await peys.payments.get('pay_abc123');

console.log(payment.status);
// 'pending' | 'completed' | 'expired' | 'cancelled'

// Access payment details
console.log(payment.amount);     // 10000
console.log(payment.token);       // 'USDC'
console.log(payment.recipient);   // 'alice@example.com'`}
            />
          </div>
        </section>

        <section id="list-payments" className="mt-12">
          <h2 className="text-2xl font-bold text-foreground">List Payments</h2>
          <p className="mt-4 text-muted-foreground">
            List all payments with optional filtering:
          </p>
          <div className="mt-4">
            <CodeBlock
              code={`// List all payments
const payments = await peys.payments.list();

// List with filters
const filteredPayments = await peys.payments.list({
  status: 'completed',           // Filter by status
  limit: 20,                     // Number of results (default: 10, max: 100)
  startingAfter: 'pay_abc123',   // Pagination cursor
  createdAfter: '2024-01-01',   // Filter by creation date
});

console.log(filteredPayments.data);
console.log(filteredPayments.hasMore);`}
            />
          </div>
        </section>

        <section id="cancel" className="mt-12">
          <h2 className="text-2xl font-bold text-foreground">Cancel a Payment</h2>
          <p className="mt-4 text-muted-foreground">
            Cancel a pending payment to prevent it from being claimed:
          </p>
          <div className="mt-4">
            <CodeBlock
              code={`const cancelled = await peys.payments.cancel('pay_abc123');

console.log(cancelled.status);
// 'cancelled'`}
            />
          </div>
          <div className="mt-4 rounded-lg border border-yellow-500/20 bg-yellow-500/10 p-4">
            <p className="text-sm text-yellow-400">
              <strong>Note:</strong> Only pending payments can be cancelled. Once a payment is completed, it cannot be reversed.
            </p>
          </div>
        </section>

        <section id="request" className="mt-12">
          <h2 className="text-2xl font-bold text-foreground">Request Payment</h2>
          <p className="mt-4 text-muted-foreground">
            Request payment from a user (they will receive an email notification):
          </p>
          <div className="mt-4">
            <CodeBlock
              code={`const request = await peys.paymentRequests.create({
  amount: 5000,
  token: 'USDC',
  requester: 'merchant@example.com',  // Your email
  requestedFrom: 'bob@example.com',    // Who to request from
  description: 'Invoice #67890',
});

console.log(request);
// {
//   id: 'req_xyz789',
//   status: 'pending',
//   link: 'https://peys.app/request/xyz789'
// }`}
            />
          </div>
        </section>

        <div className="mt-16 flex justify-between border-t border-border pt-8">
          <Link to="/docs/installation" className="inline-flex items-center gap-2 text-muted-foreground hover:text-foreground">
            <ArrowLeft className="h-4 w-4" /> Installation
          </Link>
          <Link to="/docs/claims" className="inline-flex items-center gap-2 text-primary hover:underline">
            Payment Claims <ArrowRight className="h-4 w-4" />
          </Link>
        </div>
      </div>
    </DocsLayout>
  );
}
