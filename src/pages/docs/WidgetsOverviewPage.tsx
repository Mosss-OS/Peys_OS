import { Link } from "react-router-dom";
import { ArrowRight, ArrowLeft, Box, Code, CreditCard, Globe } from "lucide-react";
import DocsLayout from "@/components/DocsLayout";

export default function WidgetsOverviewPage() {
  return (
    <DocsLayout>
      <div className="prose prose-invert max-w-none">
        <Link to="/docs" className="inline-flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground mb-4">
          <ArrowLeft className="h-4 w-4" /> Introduction
        </Link>

        <h1 className="text-4xl font-bold text-foreground">Widgets</h1>
        <p className="mt-4 text-xl text-muted-foreground">
          Pre-built UI components to accept payments on your website.
        </p>

        <section id="overview" className="mt-12">
          <h2 className="text-2xl font-bold text-foreground">Overview</h2>
          <p className="mt-4 text-muted-foreground">
            Peys Widgets are drop-in UI components that make it easy to accept crypto payments on your website. 
            They handle the entire payment flow, from displaying payment options to confirming the transaction.
          </p>
        </section>

        <section id="available-widgets" className="mt-12">
          <h2 className="text-2xl font-bold text-foreground">Available Widgets</h2>
          
          <div className="mt-6 grid gap-6 sm:grid-cols-2">
            <Link
              to="/docs/widgets/pay-button"
              className="group rounded-xl border border-border bg-card p-6 transition-colors hover:border-primary/50 hover:bg-secondary/50"
            >
              <div className="mb-4 flex h-12 w-12 items-center justify-center rounded-lg bg-primary/10 text-primary">
                <CreditCard className="h-6 w-6" />
              </div>
              <h3 className="font-semibold text-foreground group-hover:text-primary">Pay Button</h3>
              <p className="mt-2 text-sm text-muted-foreground">
                A simple button that opens a payment modal when clicked. Perfect for simple integrations.
              </p>
            </Link>

            <Link
              to="/docs/widgets/payment-form"
              className="group rounded-xl border border-border bg-card p-6 transition-colors hover:border-primary/50 hover:bg-secondary/50"
            >
              <div className="mb-4 flex h-12 w-12 items-center justify-center rounded-lg bg-primary/10 text-primary">
                <Box className="h-6 w-6" />
              </div>
              <h3 className="font-semibold text-foreground group-hover:text-primary">Payment Form</h3>
              <p className="mt-2 text-sm text-muted-foreground">
                A full payment form that can be embedded directly on your page. Best for custom checkout flows.
              </p>
            </Link>
          </div>
        </section>

        <section id="installation" className="mt-12">
          <h2 className="text-2xl font-bold text-foreground">Installation</h2>
          <p className="mt-4 text-muted-foreground">
            Add the Peys widgets script to your website:
          </p>
          <div className="mt-4 rounded-lg border border-border bg-secondary/50 p-4">
            <pre className="text-sm font-mono text-foreground">
{`<script src="https://js.peys.io/v1/widget.js"></script>`}
            </pre>
          </div>
          <p className="mt-4 text-muted-foreground">
            Or install via npm:
          </p>
          <div className="mt-4 rounded-lg border border-border bg-secondary/50 p-4">
            <pre className="text-sm font-mono text-foreground">
{`npm install @peys/widget`}
            </pre>
          </div>
        </section>

        <section id="quick-example" className="mt-12">
          <h2 className="text-2xl font-bold text-foreground">Quick Example</h2>
          <div className="mt-4 rounded-lg border border-border bg-secondary/50 p-4">
            <pre className="text-sm font-mono text-foreground">
{`<!-- Add the widget button -->
<peys-button 
  amount="10000" 
  token="USDC"
  label="Pay with USDC"
></peys-button>

<script src="https://js.peys.io/v1/widget.js"></script>`}
            </pre>
          </div>
        </section>

        <section id="features" className="mt-12">
          <h2 className="text-2xl font-bold text-foreground">Features</h2>
          <ul className="mt-4 space-y-3 text-muted-foreground">
            <li className="flex items-start gap-2">
              <ArrowRight className="h-5 w-5 text-primary mt-0.5" />
              <span>Multiple token support (USDC, USDT)</span>
            </li>
            <li className="flex items-start gap-2">
              <ArrowRight className="h-5 w-5 text-primary mt-0.5" />
              <span>Responsive design that works on all devices</span>
            </li>
            <li className="flex items-start gap-2">
              <ArrowRight className="h-5 w-5 text-primary mt-0.5" />
              <span>Customizable appearance to match your brand</span>
            </li>
            <li className="flex items-start gap-2">
              <ArrowRight className="h-5 w-5 text-primary mt-0.5" />
              <span>Built-in wallet connection (MetaMask, WalletConnect)</span>
            </li>
            <li className="flex items-start gap-2">
              <ArrowRight className="h-5 w-5 text-primary mt-0.5" />
              <span>Real-time payment status updates</span>
            </li>
          </ul>
        </section>

        <section id="browser-support" className="mt-12">
          <h2 className="text-2xl font-bold text-foreground">Browser Support</h2>
          <div className="mt-4 overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-border">
                  <th className="text-left py-3 px-4 font-medium text-foreground">Browser</th>
                  <th className="text-left py-3 px-4 font-medium text-foreground">Version</th>
                </tr>
              </thead>
              <tbody className="text-muted-foreground">
                <tr className="border-b border-border">
                  <td className="py-3 px-4">Chrome</td>
                  <td className="py-3 px-4">80+</td>
                </tr>
                <tr className="border-b border-border">
                  <td className="py-3 px-4">Firefox</td>
                  <td className="py-3 px-4">75+</td>
                </tr>
                <tr className="border-b border-border">
                  <td className="py-3 px-4">Safari</td>
                  <td className="py-3 px-4">14+</td>
                </tr>
                <tr className="border-b border-border">
                  <td className="py-3 px-4">Edge</td>
                  <td className="py-3 px-4">80+</td>
                </tr>
              </tbody>
            </table>
          </div>
        </section>

        <div className="mt-16 flex justify-between border-t border-border pt-8">
          <Link to="/docs/sdks/go" className="inline-flex items-center gap-2 text-muted-foreground hover:text-foreground">
            <ArrowLeft className="h-4 w-4" /> Go SDK
          </Link>
          <Link to="/docs/widgets/pay-button" className="inline-flex items-center gap-2 text-primary hover:underline">
            Pay Button <ArrowRight className="h-4 w-4" />
          </Link>
        </div>
      </div>
    </DocsLayout>
  );
}
