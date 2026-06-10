import { Link } from "react-router-dom";
import { ArrowRight, ArrowLeft, Copy, Check } from "lucide-react";
import { useState } from "react";
import DocsLayout from "@/components/DocsLayout";

function CodeBlock({ code, lang = "html" }: { code: string; lang?: string }) {
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

export default function PayButtonPage() {
  return (
    <DocsLayout>
      <div className="prose prose-invert max-w-none">
        <Link to="/docs" className="inline-flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground mb-4">
          <ArrowLeft className="h-4 w-4" /> Introduction
        </Link>

        <h1 className="text-4xl font-bold text-foreground">Pay Button</h1>
        <p className="mt-4 text-xl text-muted-foreground">
          A simple drop-in button that opens a payment modal.
        </p>

        <section id="quick-start" className="mt-12">
          <h2 className="text-2xl font-bold text-foreground">Quick Start</h2>
          <div className="mt-4">
            <CodeBlock
              code={`<!-- Add the script -->
<script src="https://js.peys.io/v1/widget.js"></script>

<!-- Add the button -->
<peys-button 
  amount="10000" 
  token="USDC"
  label="Pay Now"
></peys-button>`}
            />
          </div>
        </section>

        <section id="attributes" className="mt-12">
          <h2 className="text-2xl font-bold text-foreground">Attributes</h2>
          <div className="mt-4 overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-border">
                  <th className="text-left py-3 px-4 font-medium text-foreground">Attribute</th>
                  <th className="text-left py-3 px-4 font-medium text-foreground">Type</th>
                  <th className="text-left py-3 px-4 font-medium text-foreground">Description</th>
                </tr>
              </thead>
              <tbody className="text-muted-foreground">
                <tr className="border-b border-border">
                  <td className="py-3 px-4"><code className="text-primary">amount</code></td>
                  <td className="py-3 px-4">number</td>
                  <td className="py-3 px-4">Payment amount in smallest units</td>
                </tr>
                <tr className="border-b border-border">
                  <td className="py-3 px-4"><code className="text-primary">token</code></td>
                  <td className="py-3 px-4">string</td>
                  <td className="py-3 px-4">Token symbol (USDC, USDT)</td>
                </tr>
                <tr className="border-b border-border">
                  <td className="py-3 px-4"><code className="text-primary">label</code></td>
                  <td className="py-3 px-4">string</td>
                  <td className="py-3 px-4">Button text (default: "Pay")</td>
                </tr>
                <tr className="border-b border-border">
                  <td className="py-3 px-4"><code className="text-primary">description</code></td>
                  <td className="py-3 px-4">string</td>
                  <td className="py-3 px-4">Payment description</td>
                </tr>
                <tr className="border-b border-border">
                  <td className="py-3 px-4"><code className="text-primary">pk</code></td>
                  <td className="py-3 px-4">string</td>
                  <td className="py-3 px-4">Your publishable key</td>
                </tr>
                <tr className="border-b border-border">
                  <td className="py-3 px-4"><code className="text-primary">theme</code></td>
                  <td className="py-3 px-4">string</td>
                  <td className="py-3 px-4">Theme: "light", "dark", "auto"</td>
                </tr>
              </tbody>
            </table>
          </div>
        </section>

        <section id="full-example" className="mt-12">
          <h2 className="text-2xl font-bold text-foreground">Full Example</h2>
          <div className="mt-4">
            <CodeBlock
              code={`<peys-button 
  amount="10000" 
  token="USDC"
  label="Pay $10.00"
  description="Order #12345"
  pk="pk_live_xxxxx"
  theme="dark"
  onSuccess="handleSuccess"
  onError="handleError"
></peys-button>

<script>
  function handleSuccess(payment) {
    console.log('Payment created:', payment.id);
    console.log('Link:', payment.link);
  }
  
  function handleError(error) {
    console.error('Payment failed:', error.message);
  }
</script>`}
            />
          </div>
        </section>

        <section id="callbacks" className="mt-12">
          <h2 className="text-2xl font-bold text-foreground">Callbacks</h2>
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
                  <td className="py-3 px-4"><code className="text-primary">onSuccess</code></td>
                  <td className="py-3 px-4">Called when payment is created successfully</td>
                </tr>
                <tr className="border-b border-border">
                  <td className="py-3 px-4"><code className="text-primary">onError</code></td>
                  <td className="py-3 px-4">Called when an error occurs</td>
                </tr>
                <tr className="border-b border-border">
                  <td className="py-3 px-4"><code className="text-primary">onClose</code></td>
                  <td className="py-3 px-4">Called when the modal is closed</td>
                </tr>
              </tbody>
            </table>
          </div>
        </section>

        <section id="programmatic" className="mt-12">
          <h2 className="text-2xl font-bold text-foreground">Programmatic Usage</h2>
          <p className="mt-4 text-muted-foreground">
            You can also trigger the payment modal programmatically:
          </p>
          <div className="mt-4">
            <CodeBlock
              code={`// Open payment modal programmatically
const widget = document.querySelector('peys-button');

widget.open({
  amount: 10000,
  token: 'USDC',
  description: 'Order #12345'
});

// Or create a payment directly
widget.createPayment({
  amount: 10000,
  token: 'USDC',
  recipient: 'user@example.com'
}).then(payment => {
  console.log('Payment link:', payment.link);
});`}
            />
          </div>
        </section>

        <div className="mt-16 flex justify-between border-t border-border pt-8">
          <Link to="/docs/widgets/overview" className="inline-flex items-center gap-2 text-muted-foreground hover:text-foreground">
            <ArrowLeft className="h-4 w-4" /> Widgets Overview
          </Link>
          <Link to="/docs/widgets/payment-form" className="inline-flex items-center gap-2 text-primary hover:underline">
            Payment Form <ArrowRight className="h-4 w-4" />
          </Link>
        </div>
      </div>
    </DocsLayout>
  );
}
