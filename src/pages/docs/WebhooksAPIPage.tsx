import { Link } from "react-router-dom";
import { ArrowRight, ArrowLeft } from "lucide-react";
import DocsLayout from "@/components/DocsLayout";

export default function WebhooksAPIPage() {
  return (
    <DocsLayout>
      <div className="prose prose-invert max-w-none">
        <Link to="/docs" className="inline-flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground mb-4">
          <ArrowLeft className="h-4 w-4" /> Introduction
        </Link>

        <h1 className="text-4xl font-bold text-foreground">Webhooks API Reference</h1>
        <p className="mt-4 text-xl text-muted-foreground">
          Manage webhook endpoints for receiving event notifications.
        </p>

        <section id="create-webhook" className="mt-12">
          <h2 className="text-2xl font-bold text-foreground">Create Webhook</h2>
          <div className="mt-4 rounded-lg border border-border bg-card overflow-hidden">
            <div className="flex items-center gap-4 border-b border-border bg-secondary/30 px-4 py-3">
              <span className="rounded bg-green-500/10 px-2 py-1 text-xs font-bold text-green-500">POST</span>
              <code className="text-foreground">/webhooks</code>
            </div>
            <div className="p-4">
              <h4 className="font-medium text-foreground mb-2">Request Body</h4>
              <pre className="text-sm font-mono text-muted-foreground overflow-x-auto">
{`{
  "url": "https://your-server.com/webhooks",
  "events": ["payment.completed", "payment.expired"],
  "secret": "whsec_xxxxx"  // Auto-generated if not provided
}`}
              </pre>
              <h4 className="font-medium text-foreground mt-4 mb-2">Response</h4>
              <pre className="text-sm font-mono text-muted-foreground overflow-x-auto">
{`{
  "id": "wh_abc123",
  "url": "https://your-server.com/webhooks",
  "events": ["payment.completed", "payment.expired"],
  "secret": "whsec_xxxxx",
  "active": true,
  "createdAt": "2024-01-15T10:30:00Z"
}`}
              </pre>
            </div>
          </div>
        </section>

        <section id="list-webhooks" className="mt-12">
          <h2 className="text-2xl font-bold text-foreground">List Webhooks</h2>
          <div className="mt-4 rounded-lg border border-border bg-card overflow-hidden">
            <div className="flex items-center gap-4 border-b border-border bg-secondary/30 px-4 py-3">
              <span className="rounded bg-green-500/10 px-2 py-1 text-xs font-bold text-green-500">GET</span>
              <code className="text-foreground">/webhooks</code>
            </div>
          </div>
        </section>

        <section id="get-webhook" className="mt-12">
          <h2 className="text-2xl font-bold text-foreground">Get Webhook</h2>
          <div className="mt-4 rounded-lg border border-border bg-card overflow-hidden">
            <div className="flex items-center gap-4 border-b border-border bg-secondary/30 px-4 py-3">
              <span className="rounded bg-green-500/10 px-2 py-1 text-xs font-bold text-green-500">GET</span>
              <code className="text-foreground">/webhooks/:id</code>
            </div>
          </div>
        </section>

        <section id="update-webhook" className="mt-12">
          <h2 className="text-2xl font-bold text-foreground">Update Webhook</h2>
          <div className="mt-4 rounded-lg border border-border bg-card overflow-hidden">
            <div className="flex items-center gap-4 border-b border-border bg-secondary/30 px-4 py-3">
              <span className="rounded bg-yellow-500/10 px-2 py-1 text-xs font-bold text-yellow-500">PATCH</span>
              <code className="text-foreground">/webhooks/:id</code>
            </div>
            <div className="p-4">
              <h4 className="font-medium text-foreground mb-2">Request Body</h4>
              <pre className="text-sm font-mono text-muted-foreground overflow-x-auto">
{`{
  "url": "https://new-url.com/webhooks",  // optional
  "events": ["payment.completed"],       // optional
  "active": true                          // optional
}`}
              </pre>
            </div>
          </div>
        </section>

        <section id="delete-webhook" className="mt-12">
          <h2 className="text-2xl font-bold text-foreground">Delete Webhook</h2>
          <div className="mt-4 rounded-lg border border-border bg-card overflow-hidden">
            <div className="flex items-center gap-4 border-b border-border bg-secondary/30 px-4 py-3">
              <span className="rounded bg-red-500/10 px-2 py-1 text-xs font-bold text-red-500">DELETE</span>
              <code className="text-foreground">/webhooks/:id</code>
            </div>
          </div>
        </section>

        <section id="test-webhook" className="mt-12">
          <h2 className="text-2xl font-bold text-foreground">Test Webhook</h2>
          <div className="mt-4 rounded-lg border border-border bg-card overflow-hidden">
            <div className="flex items-center gap-4 border-b border-border bg-secondary/30 px-4 py-3">
              <span className="rounded bg-blue-500/10 px-2 py-1 text-xs font-bold text-blue-500">POST</span>
              <code className="text-foreground">/webhooks/:id/test</code>
            </div>
            <div className="p-4">
              <p className="text-sm text-muted-foreground">
                Send a test event to your webhook endpoint. Returns the test result.
              </p>
            </div>
          </div>
        </section>

        <div className="mt-16 flex justify-between border-t border-border pt-8">
          <Link to="/docs/api/payments" className="inline-flex items-center gap-2 text-muted-foreground hover:text-foreground">
            <ArrowLeft className="h-4 w-4" /> Payments API
          </Link>
          <Link to="/docs/sdks/javascript" className="inline-flex items-center gap-2 text-primary hover:underline">
            JavaScript SDK <ArrowRight className="h-4 w-4" />
          </Link>
        </div>
      </div>
    </DocsLayout>
  );
}
