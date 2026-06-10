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

export default function WebhooksPage() {
  return (
    <DocsLayout>
      <div className="prose prose-invert max-w-none">
        <Link to="/docs" className="inline-flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground mb-4">
          <ArrowLeft className="h-4 w-4" /> Introduction
        </Link>

        <h1 className="text-4xl font-bold text-foreground">Webhooks</h1>
        <p className="mt-4 text-xl text-muted-foreground">
          Receive real-time notifications when payment events occur.
        </p>

        <section id="overview" className="mt-12">
          <h2 className="text-2xl font-bold text-foreground">Overview</h2>
          <p className="mt-4 text-muted-foreground">
            Webhooks allow your application to receive real-time notifications when events occur in your Peys account. Instead of polling the API, you can subscribe to events and receive HTTP POST requests when those events happen.
          </p>
        </section>

        <section id="event-types" className="mt-12">
          <h2 className="text-2xl font-bold text-foreground">Event Types</h2>
          <div className="mt-4 overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-border">
                  <th className="text-left py-3 px-4 font-medium text-foreground">Event</th>
                  <th className="text-left py-3 px-4 font-medium text-foreground">Description</th>
                </tr>
              </thead>
              <tbody className="text-muted-foreground">
                <tr className="border-b border-border">
                  <td className="py-3 px-4"><code className="bg-secondary px-2 py-1 rounded text-green-500">payment.completed</code></td>
                  <td className="py-3 px-4">A payment has been successfully completed</td>
                </tr>
                <tr className="border-b border-border">
                  <td className="py-3 px-4"><code className="bg-secondary px-2 py-1 rounded text-yellow-500">payment.pending</code></td>
                  <td className="py-3 px-4">A new payment has been created</td>
                </tr>
                <tr className="border-b border-border">
                  <td className="py-3 px-4"><code className="bg-secondary px-2 py-1 rounded text-red-500">payment.expired</code></td>
                  <td className="py-3 px-4">A payment link has expired</td>
                </tr>
                <tr className="border-b border-border">
                  <td className="py-3 px-4"><code className="bg-secondary px-2 py-1 rounded text-red-500">payment.cancelled</code></td>
                  <td className="py-3 px-4">A payment has been cancelled</td>
                </tr>
                <tr className="border-b border-border">
                  <td className="py-3 px-4"><code className="bg-secondary px-2 py-1 rounded text-green-500">claim.completed</code></td>
                  <td className="py-3 px-4">A payment claim has been completed</td>
                </tr>
                <tr className="border-b border-border">
                  <td className="py-3 px-4"><code className="bg-secondary px-2 py-1 rounded text-red-500">claim.failed</code></td>
                  <td className="py-3 px-4">A payment claim has failed</td>
                </tr>
              </tbody>
            </table>
          </div>
        </section>

        <section id="setup" className="mt-12">
          <h2 className="text-2xl font-bold text-foreground">Setting Up Webhooks</h2>
          <p className="mt-4 text-muted-foreground">
            Register a webhook endpoint to start receiving events:
          </p>
          <div className="mt-4">
            <CodeBlock
              code={`const webhook = await peys.webhooks.create({
  url: 'https://your-server.com/webhooks/peys',
  events: [
    'payment.completed',
    'payment.expired',
    'claim.completed',
    'claim.failed'
  ],
  secret: 'whsec_your_secret_key'  // Used for signature verification
});

console.log(webhook);
// {
//   id: 'wh_abc123',
//   url: 'https://your-server.com/webhooks/peys',
//   events: ['payment.completed', ...],
//   active: true
// }`}
            />
          </div>
        </section>

        <section id="verify" className="mt-12">
          <h2 className="text-2xl font-bold text-foreground">Verifying Webhook Signatures</h2>
          <p className="mt-4 text-muted-foreground">
            Always verify webhook signatures to ensure requests come from Peys:
          </p>
          <div className="mt-4">
            <CodeBlock
              code={`// Express.js example
app.post('/webhooks/peys', express.raw({type: 'application/json'}), 
  (req, res) => {
    const signature = req.headers['x-peys-signature'];
    const webhookSecret = process.env.PEYS_WEBHOOK_SECRET;
    
    try {
      const event = peys.webhooks.constructEvent(
        req.body,
        signature,
        webhookSecret
      );
      
      // Handle the event
      switch (event.type) {
        case 'payment.completed':
          const payment = event.data;
          console.log('Payment completed:', payment.id);
          // TODO: Fulfill order
          break;
        // Handle other event types
      }
      
      res.json({ received: true });
    } catch (err) {
      console.error('Webhook signature verification failed');
      res.status(400).json({ error: 'Invalid signature' });
    }
  }
);`}
            />
          </div>
        </section>

        <section id="payload" className="mt-12">
          <h2 className="text-2xl font-bold text-foreground">Webhook Payload</h2>
          <p className="mt-4 text-muted-foreground">
            All webhook payloads follow this structure:
          </p>
          <div className="mt-4">
            <CodeBlock
              code={`{
  "id": "evt_abc123",
  "type": "payment.completed",
  "createdAt": "2024-01-15T10:30:00Z",
  "data": {
    // Event-specific data
    "id": "pay_xyz789",
    "amount": 10000,
    "token": "USDC",
    "status": "completed",
    "recipient": "alice@example.com",
    "transactionHash": "0x123abc...",
    "metadata": {
      "orderId": "12345"
    }
  }
}`}
            />
          </div>
        </section>

        <section id="retry" className="mt-12">
          <h2 className="text-2xl font-bold text-foreground">Retry Policy</h2>
          <p className="mt-4 text-muted-foreground">
            If your webhook endpoint returns a non-2xx status code or times out, Peys will retry the webhook:
          </p>
          <ul className="mt-4 space-y-2 text-muted-foreground">
            <li>• First retry: 1 minute after failure</li>
            <li>• Second retry: 5 minutes after failure</li>
            <li>• Third retry: 30 minutes after failure</li>
            <li>• Fourth retry: 2 hours after failure</li>
            <li>• Fifth retry: 24 hours after failure</li>
          </ul>
          <div className="mt-4 rounded-lg border border-yellow-500/20 bg-yellow-500/10 p-4">
            <p className="text-sm text-yellow-400">
              <strong>Note:</strong> After 5 failed attempts, the webhook is marked as failed and will no longer be retried automatically.
            </p>
          </div>
        </section>

        <div className="mt-16 flex justify-between border-t border-border pt-8">
          <Link to="/docs/claims" className="inline-flex items-center gap-2 text-muted-foreground hover:text-foreground">
            <ArrowLeft className="h-4 w-4" /> Payment Claims
          </Link>
          <Link to="/docs/api/authentication" className="inline-flex items-center gap-2 text-primary hover:underline">
            Authentication <ArrowRight className="h-4 w-4" />
          </Link>
        </div>
      </div>
    </DocsLayout>
  );
}
