import { Link } from "react-router-dom";
import { ArrowRight, Code, Globe, Box, Terminal, Shield, Zap, CreditCard, Key, Clock, CheckCircle, Send, Wallet, FileText, BarChart3, Layers, Link2, Megaphone } from "lucide-react";
import DocsLayout from "@/components/DocsLayout";

const products = [
  {
    name: "Magic Claim Links",
    description: "Send stablecoin payments via email. Recipients claim with one click—no wallet required.",
    icon: Send,
    href: "/docs/payments",
    category: "Core",
  },
  {
    name: "REST API",
    description: "Programmatic access to create payments, handle claims, and manage transactions.",
    icon: Globe,
    href: "/docs/api/payments",
    category: "API",
  },
  {
    name: "SDKs",
    description: "Official libraries for JavaScript, Python, and Go. Integrate in minutes.",
    icon: Code,
    href: "/docs/sdks/javascript",
    category: "SDKs",
  },
  {
    name: "Widgets",
    description: "Embeddable payment buttons and forms. Customize to match your brand.",
    icon: Box,
    href: "/docs/widgets/overview",
    category: "UI Components",
  },
  {
    name: "Webhooks",
    description: "Real-time event notifications for payments, claims, and refunds.",
    icon: Link2,
    href: "/docs/webhooks",
    category: "Integrations",
  },
  {
    name: "Smart Contracts",
    description: "Advanced contracts for streaming, escrow, subscriptions, and DeFi.",
    icon: FileText,
    href: "/docs/smart-contracts",
    category: "Advanced",
  },
  {
    name: "Batch Payments",
    description: "Pay multiple recipients in a single transaction. Perfect for payroll.",
    icon: Layers,
    href: "/batch",
    category: "Core",
  },
  {
    name: "Streaming",
    description: "Stream payments in real-time. Ideal for salaries and subscriptions.",
    icon: Clock,
    href: "/streaming",
    category: "Core",
  },
  {
    name: "Analytics",
    description: "Real-time dashboard for tracking payments, revenue, and trends.",
    icon: BarChart3,
    href: "/analytics",
    category: "Tools",
  },
];

const guides = [
  { title: "Quick Start", desc: "Get started in 5 minutes", to: "/docs/quickstart" },
  { title: "Installation", desc: "Set up the SDK", to: "/docs/installation" },
  { title: "Authentication", desc: "API keys and security", to: "/docs/api/authentication" },
  { title: "Pricing", desc: "Plans and billing", to: "/docs/sdks/pricing" },
];

export default function DocsPage() {
  return (
    <DocsLayout>
      <div className="prose prose-invert max-w-none">
        <div className="mb-8">
          <Link to="/developers" className="inline-flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground mb-4">
            <ArrowRight className="h-4 w-4 rotate-180" /> Back to Developers
          </Link>
          <h1 className="text-4xl font-bold text-foreground">Peys Developer Documentation</h1>
          <p className="mt-4 text-xl text-muted-foreground">
            Integrate stablecoin payments into your applications. Build Magic Claim Links, 
            accept crypto, and manage transactions with our comprehensive APIs and SDKs.
          </p>
        </div>

        {/* Getting Started */}
        <section id="getting-started" className="mt-8">
          <h2 className="text-2xl font-bold text-foreground mb-6">Getting Started</h2>
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
            {guides.map((guide) => (
              <Link
                key={guide.title}
                to={guide.to}
                className="group rounded-lg border border-border bg-card p-4 transition-colors hover:border-primary/50 hover:bg-secondary/50"
              >
                <h3 className="font-semibold text-foreground group-hover:text-primary">{guide.title}</h3>
                <p className="mt-1 text-sm text-muted-foreground">{guide.desc}</p>
              </Link>
            ))}
          </div>
        </section>

        {/* Products */}
        <section id="products" className="mt-16">
          <h2 className="text-2xl font-bold text-foreground mb-6">Products</h2>
          <p className="text-muted-foreground mb-8">
            Everything you need to build payment flows into your products. Each product can be used independently or combined.
          </p>
          
          <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
            {products.map((product) => {
              const Icon = product.icon;
              return (
                <Link
                  key={product.name}
                  to={product.href}
                  className="group rounded-xl border border-border bg-card p-6 transition-colors hover:border-primary/50 hover:bg-secondary/50"
                >
                  <div className="flex items-center gap-2 mb-3">
                    <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-primary/10 text-primary">
                      <Icon className="h-4 w-4" />
                    </div>
                    <span className="text-xs font-medium text-muted-foreground">{product.category}</span>
                  </div>
                  <h3 className="font-semibold text-foreground group-hover:text-primary">{product.name}</h3>
                  <p className="mt-2 text-sm text-muted-foreground">{product.description}</p>
                </Link>
              );
            })}
          </div>
        </section>

        {/* Popular Use Cases */}
        <section id="use-cases" className="mt-16">
          <h2 className="text-2xl font-bold text-foreground mb-6">Popular Use Cases</h2>
          <div className="grid gap-6 sm:grid-cols-2">
            {[
              {
                title: "Pay Freelancers Globally",
                description: "Send stablecoin payments to contractors worldwide. No bank accounts needed.",
                icon: Wallet,
              },
              {
                title: "Request Payment Links",
                description: "Create payment links and send to customers. They pay with one click.",
                icon: FileText,
              },
              {
                title: "Batch Payroll",
                description: "Pay multiple employees or contractors in a single transaction.",
                icon: Layers,
              },
              {
                title: "Streaming Salaries",
                description: "Stream payments in real-time. Employees can withdraw anytime.",
                icon: Clock,
              },
            ].map((useCase) => {
              const Icon = useCase.icon;
              return (
                <div key={useCase.title} className="flex gap-4 rounded-xl border border-border bg-card p-6">
                  <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-lg bg-primary/10 text-primary">
                    <Icon className="h-6 w-6" />
                  </div>
                  <div>
                    <h3 className="font-semibold text-foreground">{useCase.title}</h3>
                    <p className="mt-1 text-sm text-muted-foreground">{useCase.description}</p>
                  </div>
                </div>
              );
            })}
          </div>
        </section>

        {/* Supported Networks */}
        <section id="networks" className="mt-16">
          <h2 className="text-2xl font-bold text-foreground mb-6">Supported Networks</h2>
          <p className="text-muted-foreground mb-6">
            Peys supports multiple blockchain networks. Start with testnets, then go to mainnet.
          </p>
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {[
            { name: "Base Sepolia", symbol: "USDC", network: "Testnet", status: "Active" },
            { name: "Base", symbol: "USDC", network: "Mainnet", status: "Coming Soon" },
            { name: "USDT", symbol: "USDT", network: "All Networks", status: "Coming Soon" },
          ].map((chain) => (
              <div key={chain.name} className="flex items-center justify-between rounded-lg border border-border bg-card px-4 py-3">
                <div>
                  <p className="font-medium text-foreground">{chain.name}</p>
                  <p className="text-sm text-muted-foreground">{chain.symbol}</p>
                </div>
                <span className={`rounded-full px-2 py-1 text-xs font-medium ${
                  chain.status === "Active" 
                    ? "bg-green-500/10 text-green-500" 
                    : "bg-secondary text-muted-foreground"
                }`}>
                  {chain.status}
                </span>
              </div>
            ))}
          </div>
        </section>

        {/* Not a developer? */}
        <section className="mt-16 rounded-xl border border-dashed border-border bg-secondary/30 p-6">
          <h2 className="text-xl font-bold text-foreground">Not a developer?</h2>
          <p className="mt-2 text-muted-foreground">
            You can use Peys without writing code. Send and receive payments directly from our web app.
          </p>
          <div className="mt-4 flex gap-4">
            <Link
              to="/send"
              className="inline-flex items-center gap-2 rounded-lg bg-primary px-4 py-2 font-semibold text-primary-foreground transition-opacity hover:opacity-90"
            >
              Send Payment <ArrowRight className="h-4 w-4" />
            </Link>
            <Link
              to="/request"
              className="inline-flex items-center gap-2 rounded-lg border border-border px-4 py-2 font-semibold text-foreground transition-colors hover:bg-secondary"
            >
              Request Payment
            </Link>
          </div>
        </section>

        {/* CTA */}
        <section className="mt-16 rounded-xl border border-border bg-card p-6">
          <h2 className="text-xl font-bold text-foreground">Ready to get started?</h2>
          <p className="mt-2 text-muted-foreground">
            Create your free API key and start accepting stablecoin payments in minutes.
          </p>
          <div className="mt-4 flex gap-4 flex-wrap">
            <Link
              to="/docs/quickstart"
              className="inline-flex items-center gap-2 rounded-lg bg-primary px-4 py-2 font-semibold text-primary-foreground transition-opacity hover:opacity-90"
            >
              Quick Start Guide <ArrowRight className="h-4 w-4" />
            </Link>
            <Link
              to="/api-keys"
              className="inline-flex items-center gap-2 rounded-lg border border-border px-4 py-2 font-semibold text-foreground transition-colors hover:bg-secondary"
            >
              Get API Key
            </Link>
            <a
              href="mailto:peys.xyz@gmail.com"
              className="inline-flex items-center gap-2 rounded-lg border border-border px-4 py-2 font-semibold text-foreground transition-colors hover:bg-secondary"
            >
              Contact Sales
            </a>
          </div>
        </section>
      </div>
    </DocsLayout>
  );
}
