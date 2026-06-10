import { Link } from "react-router-dom";
import { ArrowRight, ArrowLeft, Copy, Check, Shield, Key, Lock } from "lucide-react";
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

export default function AuthenticationPage() {
  return (
    <DocsLayout>
      <div className="prose prose-invert max-w-none">
        <Link to="/docs" className="inline-flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground mb-4">
          <ArrowLeft className="h-4 w-4" /> Introduction
        </Link>

        <h1 className="text-4xl font-bold text-foreground">Authentication</h1>
        <p className="mt-4 text-xl text-muted-foreground">
          Learn how to authenticate with the Peys API.
        </p>

        <section id="api-keys" className="mt-12">
          <h2 className="text-2xl font-bold text-foreground">API Keys</h2>
          <p className="mt-4 text-muted-foreground">
            The Peys API uses API keys to authenticate requests. You can view and manage your API keys in the developer dashboard.
          </p>
          
          <div className="mt-6 grid gap-4 sm:grid-cols-2">
            <div className="rounded-lg border border-border bg-card p-4">
              <div className="flex items-center gap-2 mb-2">
                <Key className="h-5 w-5 text-primary" />
                <h3 className="font-semibold text-foreground">Secret Keys</h3>
              </div>
              <p className="text-sm text-muted-foreground">
                Start with <code className="text-primary">sk_</code>. Used for server-side operations. Keep these secret!
              </p>
            </div>
            <div className="rounded-lg border border-border bg-card p-4">
              <div className="flex items-center gap-2 mb-2">
                <Shield className="h-5 w-5 text-green-500" />
                <h3 className="font-semibold text-foreground">Publishable Keys</h3>
              </div>
              <p className="text-sm text-muted-foreground">
                Start with <code className="text-primary">pk_</code>. Used in client-side code. Safe to expose.
              </p>
            </div>
          </div>
        </section>

        <section id="using-keys" className="mt-12">
          <h2 className="text-2xl font-bold text-foreground">Using API Keys</h2>
          <p className="mt-4 text-muted-foreground">
            Pass your API key in the Authorization header:
          </p>
          <div className="mt-4">
            <CodeBlock
              lang="bash"
              code={`curl -X GET https://api.peys.io/v1/payments \\
  -H "Authorization: Bearer sk_live_xxxxxxxxxxxxx" \\
  -H "Content-Type: application/json"`}
            />
          </div>
          <p className="mt-4 text-muted-foreground">
            Or using the SDK (recommended):
          </p>
          <div className="mt-4">
            <CodeBlock
              code={`import { Peys } from '@peys/sdk';

const peys = new Peys({
  apiKey: process.env.PEYS_API_KEY
});`}
            />
          </div>
        </section>

        <section id="key-types" className="mt-12">
          <h2 className="text-2xl font-bold text-foreground">Key Types</h2>
          <div className="mt-4 overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-border">
                  <th className="text-left py-3 px-4 font-medium text-foreground">Environment</th>
                  <th className="text-left py-3 px-4 font-medium text-foreground">Prefix</th>
                  <th className="text-left py-3 px-4 font-medium text-foreground">Use Case</th>
                </tr>
              </thead>
              <tbody className="text-muted-foreground">
                <tr className="border-b border-border">
                  <td className="py-3 px-4">Live</td>
                  <td className="py-3 px-4"><code className="bg-secondary px-2 py-1 rounded text-green-500">sk_live_</code></td>
                  <td className="py-3 px-4">Production transactions</td>
                </tr>
                <tr className="border-b border-border">
                  <td className="py-3 px-4">Test</td>
                  <td className="py-3 px-4"><code className="bg-secondary px-2 py-1 rounded text-yellow-500">sk_test_</code></td>
                  <td className="py-3 px-4">Testing and development</td>
                </tr>
              </tbody>
            </table>
          </div>
        </section>

        <section id="security" className="mt-12">
          <h2 className="text-2xl font-bold text-foreground">Security Best Practices</h2>
          <div className="mt-4 space-y-4">
            <div className="rounded-lg border border-green-500/20 bg-green-500/10 p-4">
              <div className="flex items-center gap-2 mb-2">
                <Lock className="h-5 w-5 text-green-500" />
                <h3 className="font-semibold text-green-400">Store Keys Securely</h3>
              </div>
              <p className="text-sm text-muted-foreground">
                Never store API keys in source control. Use environment variables or a secrets manager.
              </p>
            </div>
            <div className="rounded-lg border border-green-500/20 bg-green-500/10 p-4">
              <div className="flex items-center gap-2 mb-2">
                <Shield className="h-5 w-5 text-green-500" />
                <h3 className="font-semibold text-green-400">Use Test Keys for Development</h3>
              </div>
              <p className="text-sm text-muted-foreground">
                Use test API keys during development to avoid making real transactions.
              </p>
            </div>
            <div className="rounded-lg border border-green-500/20 bg-green-500/10 p-4">
              <div className="flex items-center gap-2 mb-2">
                <Key className="h-5 w-5 text-green-500" />
                <h3 className="font-semibold text-green-400">Rotate Keys Regularly</h3>
              </div>
              <p className="text-sm text-muted-foreground">
                Periodically rotate your API keys and revoke old ones that are no longer needed.
              </p>
            </div>
          </div>
        </section>

        <section id="rate-limiting" className="mt-12">
          <h2 className="text-2xl font-bold text-foreground">Rate Limiting</h2>
          <p className="mt-4 text-muted-foreground">
            API requests are rate limited to ensure fair usage:
          </p>
          <div className="mt-4 overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-border">
                  <th className="text-left py-3 px-4 font-medium text-foreground">Plan</th>
                  <th className="text-left py-3 px-4 font-medium text-foreground">Requests/Minute</th>
                  <th className="text-left py-3 px-4 font-medium text-foreground">Requests/Day</th>
                </tr>
              </thead>
              <tbody className="text-muted-foreground">
                <tr className="border-b border-border">
                  <td className="py-3 px-4">Free</td>
                  <td className="py-3 px-4">60</td>
                  <td className="py-3 px-4">1,000</td>
                </tr>
                <tr className="border-b border-border">
                  <td className="py-3 px-4">Pro</td>
                  <td className="py-3 px-4">300</td>
                  <td className="py-3 px-4">50,000</td>
                </tr>
                <tr className="border-b border-border">
                  <td className="py-3 px-4">Enterprise</td>
                  <td className="py-3 px-4">Custom</td>
                  <td className="py-3 px-4">Unlimited</td>
                </tr>
              </tbody>
            </table>
          </div>
        </section>

        <div className="mt-16 flex justify-between border-t border-border pt-8">
          <Link to="/docs/webhooks" className="inline-flex items-center gap-2 text-muted-foreground hover:text-foreground">
            <ArrowLeft className="h-4 w-4" /> Webhooks
          </Link>
          <Link to="/docs/api/payments" className="inline-flex items-center gap-2 text-primary hover:underline">
            Payments API <ArrowRight className="h-4 w-4" />
          </Link>
        </div>
      </div>
    </DocsLayout>
  );
}
