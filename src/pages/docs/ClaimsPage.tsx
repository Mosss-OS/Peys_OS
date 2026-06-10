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

export default function ClaimsPage() {
  return (
    <DocsLayout>
      <div className="prose prose-invert max-w-none">
        <Link to="/docs" className="inline-flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground mb-4">
          <ArrowLeft className="h-4 w-4" /> Introduction
        </Link>

        <h1 className="text-4xl font-bold text-foreground">Payment Claims</h1>
        <p className="mt-4 text-xl text-muted-foreground">
          Learn how recipients can claim payments and the claim flow.
        </p>

        <section id="overview" className="mt-12">
          <h2 className="text-2xl font-bold text-foreground">Overview</h2>
          <p className="mt-4 text-muted-foreground">
            When a payment is created, the recipient receives a payment link. The claim flow allows the recipient to:
          </p>
          <ul className="mt-4 space-y-2 text-muted-foreground">
            <li>• Verify their identity (email verification or wallet connection)</li>
            <li>• Provide a wallet address to receive the funds</li>
            <li>• Complete the on-chain transaction</li>
          </ul>
        </section>

        <section id="claim-flow" className="mt-12">
          <h2 className="text-2xl font-bold text-foreground">Claim Flow</h2>
          <div className="mt-4 space-y-4">
            <div className="rounded-lg border border-border bg-card p-4">
              <h3 className="font-semibold text-foreground">Step 1: Recipient opens payment link</h3>
              <p className="mt-2 text-sm text-muted-foreground">
                The recipient clicks the payment link (e.g., peys.app/pay/abc123) and is directed to the payment page.
              </p>
            </div>
            <div className="rounded-lg border border-border bg-card p-4">
              <h3 className="font-semibold text-foreground">Step 2: Identity verification</h3>
              <p className="mt-2 text-sm text-muted-foreground">
                If the payment was sent to an email, the recipient must verify their email address. If sent to a wallet, they connect their wallet.
              </p>
            </div>
            <div className="rounded-lg border border-border bg-card p-4">
              <h3 className="font-semibold text-foreground">Step 3: Claim payment</h3>
              <p className="mt-2 text-sm text-muted-foreground">
                The recipient reviews the payment details and clicks "Claim Payment" to initiate the on-chain transfer.
              </p>
            </div>
            <div className="rounded-lg border border-border bg-card p-4">
              <h3 className="font-semibold text-foreground">Step 4: Transaction confirmation</h3>
              <p className="mt-2 text-sm text-muted-foreground">
                The transaction is submitted to the blockchain. Once confirmed, the payment status changes to "completed".
              </p>
            </div>
          </div>
        </section>

        <section id="claim-api" className="mt-12">
          <h2 className="text-2xl font-bold text-foreground">Claim via API</h2>
          <p className="mt-4 text-muted-foreground">
            You can also programmatically claim payments using the API (requires the recipient's wallet signature):
          </p>
          <div className="mt-4">
            <CodeBlock
              code={`// Claim a payment programmatically
const claim = await peys.payments.claim('pay_abc123', {
  recipientAddress: '0x1234...',  // Wallet address to receive funds
  signature: '0xabcd...',          // Signature from recipient wallet
});

console.log(claim);
// {
//   id: 'claim_xyz',
//   paymentId: 'pay_abc123',
//   status: 'pending',
//   transactionHash: '0x...'
// }`}
            />
          </div>
        </section>

        <section id="check-status" className="mt-12">
          <h2 className="text-2xl font-bold text-foreground">Check Claim Status</h2>
          <p className="mt-4 text-muted-foreground">
            Track the status of a claim:
          </p>
          <div className="mt-4">
            <CodeBlock
              code={`const claim = await peys.claims.get('claim_xyz');

console.log(claim.status);
// 'pending' | 'processing' | 'completed' | 'failed'

// Get transaction details
console.log(claim.transactionHash);
// '0xabc123...' `}
            />
          </div>
        </section>

        <section id="statuses" className="mt-12">
          <h2 className="text-2xl font-bold text-foreground">Claim Statuses</h2>
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
                  <td className="py-3 px-4"><code className="bg-secondary px-2 py-1 rounded text-yellow-500">pending</code></td>
                  <td className="py-3 px-4">Claim initiated, awaiting blockchain confirmation</td>
                </tr>
                <tr className="border-b border-border">
                  <td className="py-3 px-4"><code className="bg-secondary px-2 py-1 rounded text-blue-500">processing</code></td>
                  <td className="py-3 px-4">Transaction submitted, confirming on-chain</td>
                </tr>
                <tr className="border-b border-border">
                  <td className="py-3 px-4"><code className="bg-secondary px-2 py-1 rounded text-green-500">completed</code></td>
                  <td className="py-3 px-4">Funds successfully transferred to recipient</td>
                </tr>
                <tr className="border-b border-border">
                  <td className="py-3 px-4"><code className="bg-secondary px-2 py-1 rounded text-red-500">failed</code></td>
                  <td className="py-3 px-4">Transaction failed (see failure reason)</td>
                </tr>
              </tbody>
            </table>
          </div>
        </section>

        <div className="mt-16 flex justify-between border-t border-border pt-8">
          <Link to="/docs/payments" className="inline-flex items-center gap-2 text-muted-foreground hover:text-foreground">
            <ArrowLeft className="h-4 w-4" /> Payments
          </Link>
          <Link to="/docs/webhooks" className="inline-flex items-center gap-2 text-primary hover:underline">
            Webhooks <ArrowRight className="h-4 w-4" />
          </Link>
        </div>
      </div>
    </DocsLayout>
  );
}
