import { Link } from "react-router-dom";
import { ArrowRight, ArrowLeft, Copy, Check } from "lucide-react";
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

export default function InstallationPage() {
  return (
    <DocsLayout>
      <div className="prose prose-invert max-w-none">
        <Link to="/docs" className="inline-flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground mb-4">
          <ArrowLeft className="h-4 w-4" /> Introduction
        </Link>

        <h1 className="text-4xl font-bold text-foreground">Installation</h1>
        <p className="mt-4 text-xl text-muted-foreground">
          Install the Peys SDK in your project using your preferred package manager.
        </p>

        <section id="requirements" className="mt-12">
          <h2 className="text-2xl font-bold text-foreground">Requirements</h2>
          <ul className="mt-4 space-y-2 text-muted-foreground">
            <li>• Node.js 18.0 or later</li>
            <li>• npm, yarn, or pnpm</li>
            <li>• A Peys API key (get one from the developer dashboard)</li>
          </ul>
        </section>

        <section id="install-sdk" className="mt-12">
          <h2 className="text-2xl font-bold text-foreground">Install the SDK</h2>
          <div className="mt-4 space-y-4">
            <div>
              <p className="mb-2 text-sm font-medium text-foreground">npm</p>
              <CodeBlock code={`npm install @peys/sdk`} />
            </div>
            <div>
              <p className="mb-2 text-sm font-medium text-foreground">yarn</p>
              <CodeBlock code={`yarn add @peys/sdk`} />
            </div>
            <div>
              <p className="mb-2 text-sm font-medium text-foreground">pnpm</p>
              <CodeBlock code={`pnpm add @peys/sdk`} />
            </div>
          </div>
        </section>

        <section id="environment-variables" className="mt-12">
          <h2 className="text-2xl font-bold text-foreground">Environment Variables</h2>
          <p className="mt-4 text-muted-foreground">
            We recommend storing your API key as an environment variable. Create a <code className="text-primary">.env</code> file in your project root:
          </p>
          <div className="mt-4">
            <CodeBlock
              lang="bash"
              code={`# .env
PEYS_API_KEY=sk_live_xxxxxxxxxxxxx
PEYS_WEBHOOK_SECRET=whsec_xxxxxxxxxxxxx`}
            />
          </div>
          <div className="mt-4 rounded-lg border border-yellow-500/20 bg-yellow-500/10 p-4">
            <p className="text-sm text-yellow-400">
              <strong>Security Note:</strong> Never commit your API keys to version control. Add <code className="text-yellow-300">.env</code> to your <code className="text-yellow-300">.gitignore</code> file.
            </p>
          </div>
        </section>

        <section id="typescript" className="mt-12">
          <h2 className="text-2xl font-bold text-foreground">TypeScript Support</h2>
          <p className="mt-4 text-muted-foreground">
            The SDK is written in TypeScript and provides full type definitions out of the box. No additional @types packages are required.
          </p>
          <div className="mt-4">
            <CodeBlock
              lang="typescript"
              code={`import { Peys, Payment, PaymentStatus } from '@peys/sdk';

// Types are automatically inferred
const payment: Payment = await peys.payments.get('pay_abc123');
const status: PaymentStatus = payment.status;`}
            />
          </div>
        </section>

        <section id="browser-vs-node" className="mt-12">
          <h2 className="text-2xl font-bold text-foreground">Browser vs Node.js</h2>
          <p className="mt-4 text-muted-foreground">
            The SDK works in both browser and Node.js environments:
          </p>
          <div className="mt-4">
            <CodeBlock
              lang="typescript"
              code={`// Browser environment (using bundler like Vite/Webpack)
import { Peys } from '@peys/sdk';

// Node.js environment
import { Peys } from '@peys/sdk/node';

// Both exports the same functionality`}
            />
          </div>
        </section>

        <section id="verify" className="mt-12">
          <h2 className="text-2xl font-bold text-foreground">Verify Installation</h2>
          <p className="mt-4 text-muted-foreground">
            Test that the SDK is properly installed by initializing the client:
          </p>
          <div className="mt-4">
            <CodeBlock
              lang="typescript"
              code={`import { Peys } from '@peys/sdk';

const peys = new Peys({
  apiKey: 'pk_test_xxxxxxxxxxxxx',
});

console.log('SDK initialized successfully!');`}
            />
          </div>
        </section>

        <section className="mt-16 rounded-xl border border-green-500/20 bg-green-500/10 p-6">
          <h2 className="text-xl font-bold text-green-400">Next Steps</h2>
          <p className="mt-2 text-muted-foreground">
            Now that you have the SDK installed, learn how to authenticate and make your first API call:
          </p>
          <div className="mt-4">
            <Link
              to="/docs/quickstart"
              className="inline-flex items-center gap-2 text-primary hover:underline"
            >
              Continue to Quick Start <ArrowRight className="h-4 w-4" />
            </Link>
          </div>
        </section>

        <div className="mt-12 flex justify-between border-t border-border pt-8">
          <Link to="/docs/quickstart" className="inline-flex items-center gap-2 text-muted-foreground hover:text-foreground">
            <ArrowLeft className="h-4 w-4" /> Quick Start
          </Link>
          <Link to="/docs/payments" className="inline-flex items-center gap-2 text-primary hover:underline">
            Payments <ArrowRight className="h-4 w-4" />
          </Link>
        </div>
      </div>
    </DocsLayout>
  );
}
