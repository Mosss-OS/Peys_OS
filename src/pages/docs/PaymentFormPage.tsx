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

export default function PaymentFormPage() {
  return (
    <DocsLayout>
      <div className="prose prose-invert max-w-none">
        <Link to="/docs" className="inline-flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground mb-4">
          <ArrowLeft className="h-4 w-4" /> Introduction
        </Link>

        <h1 className="text-4xl font-bold text-foreground">Payment Form</h1>
        <p className="mt-4 text-xl text-muted-foreground">
          An embeddable payment form for custom checkout experiences.
        </p>

        <section id="overview" className="mt-12">
          <h2 className="text-2xl font-bold text-foreground">Overview</h2>
          <p className="mt-4 text-muted-foreground">
            The Payment Form is a full embeddable component that provides a complete payment experience. 
            Unlike the Pay Button, the form can be embedded directly in your page and customized extensively.
          </p>
        </section>

        <section id="quick-start" className="mt-12">
          <h2 className="text-2xl font-bold text-foreground">Quick Start</h2>
          <div className="mt-4">
            <CodeBlock
              code={`<!-- Add the script -->
<script src="https://js.peys.io/v1/widget.js"></script>

<!-- Add the form -->
<peys-form 
  pk="pk_live_xxxxx"
  amount="10000"
  token="USDC"
></peys-form>`}
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
                  <td className="py-3 px-4"><code className="text-primary">pk</code></td>
                  <td className="py-3 px-4">string</td>
                  <td className="py-3 px-4">Your publishable key (required)</td>
                </tr>
                <tr className="border-b border-border">
                  <td className="py-3 px-4"><code className="text-primary">amount</code></td>
                  <td className="py-3 px-4">number</td>
                  <td className="py-3 px-4">Default payment amount</td>
                </tr>
                <tr className="border-b border-border">
                  <td className="py-3 px-4"><code className="text-primary">token</code></td>
                  <td className="py-3 px-4">string</td>
                  <td className="py-3 px-4">Default token (USDC, USDT)</td>
                </tr>
                <tr className="border-b border-border">
                  <td className="py-3 px-4"><code className="text-primary">editable-amount</code></td>
                  <td className="py-3 px-4">boolean</td>
                  <td className="py-3 px-4">Allow user to change amount (default: true)</td>
                </tr>
                <tr className="border-b border-border">
                  <td className="py-3 px-4"><code className="text-primary">theme</code></td>
                  <td className="py-3 px-4">string</td>
                  <td className="py-3 px-4">Theme: "light", "dark", "auto"</td>
                </tr>
                <tr className="border-b border-border">
                  <td className="py-3 px-4"><code className="text-primary">locale</code></td>
                  <td className="py-3 px-4">string</td>
                  <td className="py-3 px-4">UI language (en, es, fr, etc.)</td>
                </tr>
              </tbody>
            </table>
          </div>
        </section>

        <section id="full-example" className="mt-12">
          <h2 className="text-2xl font-bold text-foreground">Full Example</h2>
          <div className="mt-4">
            <CodeBlock
              code={`<peys-form 
  pk="pk_live_xxxxx"
  amount="10000"
  token="USDC"
  editable-amount="true"
  theme="dark"
  locale="en"
  onPaymentCreated="handlePaymentCreated"
  onPaymentCompleted="handlePaymentCompleted"
  onError="handleError"
></peys-form>

<script>
  const form = document.querySelector('peys-form');
  
  // Listen for payment creation
  form.addEventListener('paymentCreated', (e) => {
    console.log('Payment created:', e.detail);
    // Payment link: e.detail.link
  });
  
  // Listen for payment completion
  form.addEventListener('paymentCompleted', (e) => {
    console.log('Payment completed!', e.detail);
    // Update UI to show success
  });
  
  function handleError(e) {
    console.error('Error:', e.detail);
  }
</script>`}
            />
          </div>
        </section>

        <section id="events" className="mt-12">
          <h2 className="text-2xl font-bold text-foreground">Events</h2>
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
                  <td className="py-3 px-4"><code className="text-primary">paymentCreated</code></td>
                  <td className="py-3 px-4">Fired when payment is created, contains payment link</td>
                </tr>
                <tr className="border-b border-border">
                  <td className="py-3 px-4"><code className="text-primary">paymentCompleted</code></td>
                  <td className="py-3 px-4">Fired when on-chain payment is confirmed</td>
                </tr>
                <tr className="border-b border-border">
                  <td className="py-3 px-4"><code className="text-primary">error</code></td>
                  <td className="py-3 px-4">Fired when an error occurs</td>
                </tr>
                <tr className="border-b border-border">
                  <td className="py-3 px-4"><code className="text-primary">ready</code></td>
                  <td className="py-3 px-4">Fired when form is fully loaded</td>
                </tr>
              </tbody>
            </table>
          </div>
        </section>

        <section id="styling" className="mt-12">
          <h2 className="text-2xl font-bold text-foreground">Styling</h2>
          <p className="mt-4 text-muted-foreground">
            Customize the form appearance using CSS variables:
          </p>
          <div className="mt-4">
            <CodeBlock
              code={`.peys-form {
  --peys-primary: #6366f1;
  --peys-primary-foreground: #ffffff;
  --peys-background: #1e1e1e;
  --peys-foreground: #ffffff;
  --peys-border: #3f3f46;
  --peys-radius: 8px;
  --peys-font: system-ui, sans-serif;
}`}
            />
          </div>
        </section>

        <div className="mt-16 flex justify-between border-t border-border pt-8">
          <Link to="/docs/widgets/pay-button" className="inline-flex items-center gap-2 text-muted-foreground hover:text-foreground">
            <ArrowLeft className="h-4 w-4" /> Pay Button
          </Link>
          <Link to="/docs" className="inline-flex items-center gap-2 text-primary hover:underline">
            Back to Docs <ArrowRight className="h-4 w-4" />
          </Link>
        </div>
      </div>
    </DocsLayout>
  );
}
