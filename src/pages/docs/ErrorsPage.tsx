import { Link } from "react-router-dom";
import { ArrowLeft, AlertTriangle, Clock, Shield, Key } from "lucide-react";
import DocsLayout from "@/components/DocsLayout";

const errorCodes = [
  { code: 400, name: "Bad Request", description: "The request was invalid or missing required parameters." },
  { code: 401, name: "Unauthorized", description: "Invalid or missing API key." },
  { code: 403, name: "Forbidden", description: "You don't have permission to access this resource." },
  { code: 404, name: "Not Found", description: "The requested resource doesn't exist." },
  { code: 422, name: "Unprocessable Entity", description: "The request was valid but couldn't be processed." },
  { code: 429, name: "Too Many Requests", description: "You've exceeded the rate limit." },
  { code: 500, name: "Internal Server Error", description: "Something went wrong on our end." },
  { code: 503, name: "Service Unavailable", description: "The API is temporarily unavailable." },
];

const paymentErrors = [
  { code: "PAYMENT_INVALID_AMOUNT", description: "The amount must be greater than 0" },
  { code: "PAYMENT_INVALID_TOKEN", description: "The specified token is not supported" },
  { code: "PAYMENT_INVALID_RECIPIENT", description: "The recipient email or wallet address is invalid" },
  { code: "PAYMENT_EXPIRED", description: "The payment link has expired" },
  { code: "PAYMENT_ALREADY_CLAIMED", description: "This payment has already been claimed" },
  { code: "PAYMENT_INSUFFICIENT_BALANCE", description: "Insufficient balance to create payment" },
  { code: "PAYMENT_CANCELLED", description: "This payment has been cancelled" },
];

export default function ErrorsPage() {
  return (
    <DocsLayout>
      <div className="prose prose-invert max-w-none">
        <Link to="/docs" className="inline-flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground mb-4">
          <ArrowLeft className="h-4 w-4" /> Introduction
        </Link>

        <h1 className="text-4xl font-bold text-foreground">Errors & Rate Limiting</h1>
        <p className="mt-4 text-xl text-muted-foreground">
          Understand API error codes and rate limiting.
        </p>

        <section id="http-status-codes" className="mt-12">
          <h2 className="text-2xl font-bold text-foreground">HTTP Status Codes</h2>
          <p className="mt-4 text-muted-foreground">
            The Peys API uses standard HTTP response codes to indicate success or failure.
          </p>
          
          <div className="mt-6 overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-border">
                  <th className="text-left py-3 px-4 font-medium text-foreground">Code</th>
                  <th className="text-left py-3 px-4 font-medium text-foreground">Status</th>
                  <th className="text-left py-3 px-4 font-medium text-foreground">Description</th>
                </tr>
              </thead>
              <tbody>
                {errorCodes.map((error) => (
                  <tr key={error.code} className="border-b border-border">
                    <td className="py-3 px-4 font-mono text-primary">{error.code}</td>
                    <td className="py-3 px-4 font-medium text-foreground">{error.name}</td>
                    <td className="py-3 px-4 text-muted-foreground">{error.description}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </section>

        <section id="payment-errors" className="mt-12">
          <h2 className="text-2xl font-bold text-foreground">Payment Error Codes</h2>
          <p className="mt-4 text-muted-foreground">
            Specific error codes returned in the <code className="text-primary">error.code</code> field.
          </p>
          
          <div className="mt-6 overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-border">
                  <th className="text-left py-3 px-4 font-medium text-foreground">Error Code</th>
                  <th className="text-left py-3 px-4 font-medium text-foreground">Description</th>
                </tr>
              </thead>
              <tbody>
                {paymentErrors.map((error) => (
                  <tr key={error.code} className="border-b border-border">
                    <td className="py-3 px-4 font-mono text-primary">{error.code}</td>
                    <td className="py-3 px-4 text-muted-foreground">{error.description}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </section>

        <section id="error-response-format" className="mt-12">
          <h2 className="text-2xl font-bold text-foreground">Error Response Format</h2>
          <p className="mt-4 text-muted-foreground">
            When an error occurs, the API returns a JSON object with details.
          </p>
          
          <div className="mt-4 rounded-lg border border-border bg-secondary/50 p-4">
            <pre className="text-sm font-mono text-muted-foreground overflow-x-auto">
{`{
  "error": "Bad Request",
  "message": "The recipient email is required",
  "code": "PAYMENT_INVALID_RECIPIENT",
  "requestId": "req_abc123"
}`}
            </pre>
          </div>
        </section>

        <section id="rate-limiting" className="mt-12">
          <h2 className="text-2xl font-bold text-foreground">Rate Limiting</h2>
          <p className="mt-4 text-muted-foreground">
            API requests are rate limited based on your subscription tier.
          </p>

          <div className="mt-6 grid gap-4 sm:grid-cols-3">
            <div className="rounded-lg border border-border bg-card p-4">
              <div className="flex items-center gap-2 text-muted-foreground mb-2">
                <Key className="h-4 w-4" />
                <span className="text-sm font-medium">Free Tier</span>
              </div>
              <div className="text-2xl font-bold text-foreground">1,000</div>
              <div className="text-xs text-muted-foreground">requests/month</div>
            </div>
            <div className="rounded-lg border border-border bg-card p-4">
              <div className="flex items-center gap-2 text-muted-foreground mb-2">
                <Shield className="h-4 w-4" />
                <span className="text-sm font-medium">Pro Tier</span>
              </div>
              <div className="text-2xl font-bold text-foreground">100,000</div>
              <div className="text-xs text-muted-foreground">requests/month</div>
            </div>
            <div className="rounded-lg border border-border bg-card p-4">
              <div className="flex items-center gap-2 text-muted-foreground mb-2">
                <AlertTriangle className="h-4 w-4" />
                <span className="text-sm font-medium">Enterprise</span>
              </div>
              <div className="text-2xl font-bold text-foreground">Unlimited</div>
              <div className="text-xs text-muted-foreground">custom limits</div>
            </div>
          </div>

          <h3 className="text-lg font-semibold text-foreground mt-8">Rate Limit Headers</h3>
          <p className="mt-4 text-muted-foreground">
            Each response includes headers to help you track your usage:
          </p>
          
          <div className="mt-4 rounded-lg border border-border bg-secondary/50 p-4">
            <pre className="text-sm font-mono text-muted-foreground overflow-x-auto">
{`X-RateLimit-Limit: 1000
X-RateLimit-Remaining: 950
X-RateLimit-Reset: 1640995200`}
            </pre>
          </div>

          <h3 className="text-lg font-semibold text-foreground mt-8">Handling Rate Limits</h3>
          <p className="mt-4 text-muted-foreground">
            When you exceed the rate limit, you'll receive a <code className="text-primary">429 Too Many Requests</code> response.
          </p>
          
          <div className="mt-4 rounded-lg border border-border bg-secondary/50 p-4">
            <pre className="text-sm font-mono text-muted-foreground overflow-x-auto">
{`{
  "error": "Too Many Requests",
  "message": "Monthly API limit of 1000 calls reached. Upgrade your plan at https://peys.io/dashboard",
  "upgrade": "https://peys.io/dashboard",
  "tier": "free"
}`}
            </pre>
          </div>
        </section>

        <section id="best-practices" className="mt-12">
          <h2 className="text-2xl font-bold text-foreground">Best Practices</h2>
          <div className="mt-6 space-y-4">
            <div className="flex gap-3">
              <div className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-primary/10 text-primary text-sm font-medium">1</div>
              <div>
                <h3 className="font-medium text-foreground">Implement exponential backoff</h3>
                <p className="text-sm text-muted-foreground">When rate limited, wait before retrying with increasing delays.</p>
              </div>
            </div>
            <div className="flex gap-3">
              <div className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-primary/10 text-primary text-sm font-medium">2</div>
              <div>
                <h3 className="font-medium text-foreground">Cache responses</h3>
                <p className="text-sm text-muted-foreground">Cache payment status and account info to reduce API calls.</p>
              </div>
            </div>
            <div className="flex gap-3">
              <div className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-primary/10 text-primary text-sm font-medium">3</div>
              <div>
                <h3 className="font-medium text-foreground">Use webhooks</h3>
                <p className="text-sm text-muted-foreground">Subscribe to events instead of polling for status changes.</p>
              </div>
            </div>
            <div className="flex gap-3">
              <div className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-primary/10 text-primary text-sm font-medium">4</div>
              <div>
                <h3 className="font-medium text-foreground">Monitor your usage</h3>
                <p className="text-sm text-muted-foreground">Check the developer dashboard to track your API usage.</p>
              </div>
            </div>
          </div>
        </section>
      </div>
    </DocsLayout>
  );
}
