import { Link } from "react-router-dom";
import { ArrowRight, ArrowLeft, Copy, Check } from "lucide-react";
import { useState } from "react";
import DocsLayout from "@/components/DocsLayout";

function CodeBlock({ code, lang = "python" }: { code: string; lang?: string }) {
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

export default function PythonSDKPage() {
  return (
    <DocsLayout>
      <div className="prose prose-invert max-w-none">
        <Link to="/docs" className="inline-flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground mb-4">
          <ArrowLeft className="h-4 w-4" /> Introduction
        </Link>

        <h1 className="text-4xl font-bold text-foreground">Python SDK</h1>
        <p className="mt-4 text-xl text-muted-foreground">
          Official Peys SDK for Python applications.
        </p>

        <section id="installation" className="mt-12">
          <h2 className="text-2xl font-bold text-foreground">Installation</h2>
          <div className="mt-4">
            <CodeBlock
              code={`pip install peys-sdk`}
            />
            <div className="mt-2">
              <CodeBlock
                lang="bash"
                code={`pip install peys-sdk[fast]  # With async support`}
              />
            </div>
          </div>
        </section>

        <section id="initialization" className="mt-12">
          <h2 className="text-2xl font-bold text-foreground">Initialization</h2>
          <div className="mt-4">
            <CodeBlock
              code={`from peys import Peys

peys_client = Peys(
    api_key="sk_live_xxxxx",
    network="base-sepolia"  # optional
)`}
            />
          </div>
        </section>

        <section id="usage" className="mt-12">
          <h2 className="text-2xl font-bold text-foreground">Usage Examples</h2>
          
          <h3 className="text-xl font-semibold text-foreground mt-6">Create Payment</h3>
          <div className="mt-4">
            <CodeBlock
              code={`payment = peys_client.payments.create(
    amount=10000,
    token="USDC",
    recipient="user@example.com",
    description="Order #123"
)

print(payment.id)
print(payment.link)`}
            />
          </div>

          <h3 className="text-xl font-semibold text-foreground mt-6">Get Payment</h3>
          <div className="mt-4">
            <CodeBlock
              code={`payment = peys_client.payments.get("pay_abc123")
print(payment.status)`}
            />
          </div>

          <h3 className="text-xl font-semibold text-foreground mt-6">List Payments</h3>
          <div className="mt-4">
            <CodeBlock
              code={`payments = peys_client.payments.list(limit=20)
for payment in payments:
    print(payment.id, payment.status)`}
            />
          </div>

          <h3 className="text-xl font-semibold text-foreground mt-6">Webhooks</h3>
          <div className="mt-4">
            <CodeBlock
              code={`from peys.webhooks import construct_event

event = construct_event(
    payload=request.body,
    signature=request.headers["x-peys-signature"],
    secret="whsec_xxxxx"
)

if event.type == "payment.completed":
    payment = event.data
    # Handle payment`}
            />
          </div>
        </section>

        <section id="async" className="mt-12">
          <h2 className="text-2xl font-bold text-foreground">Async Support</h2>
          <div className="mt-4">
            <CodeBlock
              code={`import asyncio
from peys import AsyncPeys

async def main():
    peys = AsyncPeys(api_key="sk_live_xxxxx")
    
    payment = await peys.payments.create(
        amount=10000,
        token="USDC",
        recipient="user@example.com"
    )
    
    await peys.close()

asyncio.run(main())`}
            />
          </div>
        </section>

        <div className="mt-16 flex justify-between border-t border-border pt-8">
          <Link to="/docs/sdks/javascript" className="inline-flex items-center gap-2 text-muted-foreground hover:text-foreground">
            <ArrowLeft className="h-4 w-4" /> JavaScript SDK
          </Link>
          <Link to="/docs/sdks/go" className="inline-flex items-center gap-2 text-primary hover:underline">
            Go SDK <ArrowRight className="h-4 w-4" />
          </Link>
        </div>
      </div>
    </DocsLayout>
  );
}
