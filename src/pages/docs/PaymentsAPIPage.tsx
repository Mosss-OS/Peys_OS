import { Link } from "react-router-dom";
import { ArrowRight, ArrowLeft } from "lucide-react";
import DocsLayout from "@/components/DocsLayout";

export default function PaymentsAPIPage() {
  return (
    <DocsLayout>
      <div className="prose prose-invert max-w-none">
        <Link to="/docs" className="inline-flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground mb-4">
          <ArrowLeft className="h-4 w-4" /> Introduction
        </Link>

        <h1 className="text-4xl font-bold text-foreground">Payments API Reference</h1>
        <p className="mt-4 text-xl text-muted-foreground">
          Complete reference for the Payments API endpoints.
        </p>

        <section id="base-url" className="mt-12">
          <h2 className="text-2xl font-bold text-foreground">Base URL</h2>
          <div className="mt-4 rounded-lg border border-border bg-secondary/50 p-4">
            <code className="text-primary">https://api.peys.io/v1</code>
          </div>
        </section>

        <section id="create-payment" className="mt-12">
          <h2 className="text-2xl font-bold text-foreground">Create Payment</h2>
          <div className="mt-4 rounded-lg border border-border bg-card overflow-hidden">
            <div className="flex items-center gap-4 border-b border-border bg-secondary/30 px-4 py-3">
              <span className="rounded bg-green-500/10 px-2 py-1 text-xs font-bold text-green-500">POST</span>
              <code className="text-foreground">/payments</code>
            </div>
            <div className="p-4">
              <h4 className="font-medium text-foreground mb-2">Request Body</h4>
              <pre className="text-sm font-mono text-muted-foreground overflow-x-auto">
{`{
  "amount": 10000,              // integer (required) - Amount in smallest units
  "token": "USDC",             // string (required) - Token symbol
  "recipient": "user@email.com", // string (required) - Email or wallet address
  "description": "Order #123", // string (optional) - Payment description
  "expiresIn": 3600,          // integer (optional) - Seconds until expiry
  "metadata": {}               // object (optional) - Custom metadata
}`}
              </pre>
              <h4 className="font-medium text-foreground mt-4 mb-2">Response</h4>
              <pre className="text-sm font-mono text-muted-foreground overflow-x-auto">
{`{
  "id": "pay_abc123",
  "link": "https://peys.app/pay/abc123",
  "amount": 10000,
  "token": "USDC",
  "status": "pending",
  "description": "Order #123",
  "createdAt": "2024-01-15T10:30:00Z",
  "expiresAt": "2024-01-15T11:30:00Z"
}`}
              </pre>
            </div>
          </div>
        </section>

        <section id="get-payment" className="mt-12">
          <h2 className="text-2xl font-bold text-foreground">Get Payment</h2>
          <div className="mt-4 rounded-lg border border-border bg-card overflow-hidden">
            <div className="flex items-center gap-4 border-b border-border bg-secondary/30 px-4 py-3">
              <span className="rounded bg-green-500/10 px-2 py-1 text-xs font-bold text-green-500">GET</span>
              <code className="text-foreground">/payments/:id</code>
            </div>
            <div className="p-4">
              <h4 className="font-medium text-foreground mb-2">Path Parameters</h4>
              <ul className="text-sm text-muted-foreground space-y-1">
                <li><code className="text-primary">id</code> - The payment ID</li>
              </ul>
              <h4 className="font-medium text-foreground mt-4 mb-2">Response</h4>
              <pre className="text-sm font-mono text-muted-foreground overflow-x-auto">
{`{
  "id": "pay_abc123",
  "amount": 10000,
  "token": "USDC",
  "status": "completed",
  "recipient": "user@email.com",
  "transactionHash": "0x123...",
  "createdAt": "2024-01-15T10:30:00Z",
  "completedAt": "2024-01-15T10:35:00Z"
}`}
              </pre>
            </div>
          </div>
        </section>

        <section id="list-payments" className="mt-12">
          <h2 className="text-2xl font-bold text-foreground">List Payments</h2>
          <div className="mt-4 rounded-lg border border-border bg-card overflow-hidden">
            <div className="flex items-center gap-4 border-b border-border bg-secondary/30 px-4 py-3">
              <span className="rounded bg-green-500/10 px-2 py-1 text-xs font-bold text-green-500">GET</span>
              <code className="text-foreground">/payments</code>
            </div>
            <div className="p-4">
              <h4 className="font-medium text-foreground mb-2">Query Parameters</h4>
              <ul className="text-sm text-muted-foreground space-y-1">
                <li><code className="text-primary">limit</code> - Number of results (default: 10, max: 100)</li>
                <li><code className="text-primary">status</code> - Filter by status</li>
                <li><code className="text-primary">startingAfter</code> - Pagination cursor</li>
              </ul>
              <h4 className="font-medium text-foreground mt-4 mb-2">Response</h4>
              <pre className="text-sm font-mono text-muted-foreground overflow-x-auto">
{`{
  "data": [
    { "id": "pay_abc123", "amount": 10000, ... }
  ],
  "hasMore": true,
  "startingAfter": "pay_abc123"
}`}
              </pre>
            </div>
          </div>
        </section>

        <section id="cancel-payment" className="mt-12">
          <h2 className="text-2xl font-bold text-foreground">Cancel Payment</h2>
          <div className="mt-4 rounded-lg border border-border bg-card overflow-hidden">
            <div className="flex items-center gap-4 border-b border-border bg-secondary/30 px-4 py-3">
              <span className="rounded bg-yellow-500/10 px-2 py-1 text-xs font-bold text-yellow-500">POST</span>
              <code className="text-foreground">/payments/:id/cancel</code>
            </div>
            <div className="p-4">
              <p className="text-sm text-muted-foreground">
                Cancels a pending payment. Returns the updated payment object with status "cancelled".
              </p>
            </div>
          </div>
        </section>

        <section id="claim-payment" className="mt-12">
          <h2 className="text-2xl font-bold text-foreground">Claim Payment</h2>
          <div className="mt-4 rounded-lg border border-border bg-card overflow-hidden">
            <div className="flex items-center gap-4 border-b border-border bg-secondary/30 px-4 py-3">
              <span className="rounded bg-yellow-500/10 px-2 py-1 text-xs font-bold text-yellow-500">POST</span>
              <code className="text-foreground">/payments/:id/claim</code>
            </div>
            <div className="p-4">
              <h4 className="font-medium text-foreground mb-2">Request Body</h4>
              <pre className="text-sm font-mono text-muted-foreground overflow-x-auto">
{`{
  "recipientAddress": "0x1234...",  // Wallet address
  "signature": "0xabcd..."          // Wallet signature
}`}
              </pre>
            </div>
          </div>
        </section>

        <div className="mt-16 flex justify-between border-t border-border pt-8">
          <Link to="/docs/api/authentication" className="inline-flex items-center gap-2 text-muted-foreground hover:text-foreground">
            <ArrowLeft className="h-4 w-4" /> Authentication
          </Link>
          <Link to="/docs/api/webhooks-api" className="inline-flex items-center gap-2 text-primary hover:underline">
            Webhooks API <ArrowRight className="h-4 w-4" />
          </Link>
        </div>
      </div>
    </DocsLayout>
  );
}
