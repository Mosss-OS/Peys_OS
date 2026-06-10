import { Link } from "react-router-dom";
import { ArrowLeft, Shield, Clock, Users, Link2, Zap, CheckCircle, FileCode, Globe, AlertTriangle } from "lucide-react";
import DocsLayout from "@/components/DocsLayout";

const features = [
  {
    name: "Streaming Payments",
    description: "Stream stablecoins in real-time. Recipients can withdraw accrued funds anytime.",
    status: "implemented",
    icon: Zap,
  },
  {
    name: "Conditional Escrow",
    description: "Milestone-based releases, time-locked funds, and multi-sig approvals.",
    status: "planned",
    icon: Shield,
  },
  {
    name: "Subscription Payments",
    description: "Recurring payments with automatic renewal and subscription management.",
    status: "planned",
    icon: Clock,
  },
  {
    name: "DeFi Integration",
    description: "Yield-bearing escrow, auto-compound, and USD savings products.",
    status: "planned",
    icon: Link2,
  },
  {
    name: "Cross-chain Support",
    description: "LayerZero integration for multi-chain payments and bridges.",
    status: "planned",
    icon: Globe,
  },
];

const streamingFeatures = [
  "Real-time streaming of USDC/USDT",
  "Pause and resume streams",
  "Recipient can withdraw accrued funds anytime",
  "Cancel streams with remaining balance refund",
  "Multiple concurrent streams",
  "Event logging for all actions",
];

export default function SmartContractsPage() {
  return (
    <DocsLayout>
      <div className="prose prose-invert max-w-none">
        <Link to="/docs" className="inline-flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground mb-4">
          <ArrowLeft className="h-4 w-4" /> Introduction
        </Link>

        <h1 className="text-4xl font-bold text-foreground">Smart Contracts</h1>
        <p className="mt-4 text-xl text-muted-foreground">
          Advanced smart contract capabilities for streaming, escrow, and DeFi integration.
        </p>

        <section id="overview" className="mt-12">
          <h2 className="text-2xl font-bold text-foreground">Contract Architecture</h2>
          <p className="mt-4 text-muted-foreground">
            Peys smart contracts provide advanced payment capabilities beyond basic escrow.
          </p>

          <div className="mt-6 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {features.map((feature) => {
              const Icon = feature.icon;
              return (
                <div
                  key={feature.name}
                  className={`rounded-xl border p-6 ${
                    feature.status === "implemented"
                      ? "border-green-500/30 bg-green-500/5"
                      : "border-border bg-card"
                  }`}
                >
                  <div className="flex items-center justify-between mb-3">
                    <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-secondary">
                      <Icon className="h-5 w-5 text-foreground" />
                    </div>
                    <span
                      className={`text-xs font-medium px-2 py-1 rounded-full ${
                        feature.status === "implemented"
                          ? "bg-green-500/10 text-green-500"
                          : "bg-secondary text-muted-foreground"
                      }`}
                    >
                      {feature.status === "implemented" ? "Live" : "Planned"}
                    </span>
                  </div>
                  <h3 className="font-semibold text-foreground">{feature.name}</h3>
                  <p className="mt-2 text-sm text-muted-foreground">{feature.description}</p>
                </div>
              );
            })}
          </div>
        </section>

        <section id="streaming" className="mt-16">
          <h2 className="text-2xl font-bold text-foreground">PeyStreaming Contract</h2>
          <p className="mt-4 text-muted-foreground">
            The PeyStreaming contract enables real-time streaming of stablecoins. Recipients can withdraw their accrued funds at any time.
          </p>

          <div className="mt-6">
            <h3 className="text-lg font-semibold text-foreground">Features</h3>
            <ul className="mt-4 grid gap-3 sm:grid-cols-2">
              {streamingFeatures.map((feature) => (
                <li key={feature} className="flex items-center gap-2 text-muted-foreground">
                  <CheckCircle className="h-4 w-4 text-green-500 shrink-0" />
                  <span>{feature}</span>
                </li>
              ))}
            </ul>
          </div>

          <div className="mt-8">
            <h3 className="text-lg font-semibold text-foreground">Contract Address (Base Sepolia)</h3>
            <div className="mt-3 rounded-lg border border-border bg-secondary/50 p-4">
              <code className="text-primary break-all">0x0000000000000000000000000000000000000000</code>
            </div>
            <p className="mt-2 text-sm text-muted-foreground">Deploying soon - check GitHub for latest addresses.</p>
          </div>

          <div className="mt-8">
            <h3 className="text-lg font-semibold text-foreground">Key Functions</h3>
            <div className="mt-4 rounded-lg border border-border overflow-hidden">
              <div className="grid gap-px bg-border">
                <div className="bg-card p-4">
                  <code className="text-sm font-mono text-primary">createStream(recipient, amount, ratePerSecond)</code>
                  <p className="mt-1 text-sm text-muted-foreground">Create a new streaming payment</p>
                </div>
                <div className="bg-card p-4">
                  <code className="text-sm font-mono text-primary">pauseStream(streamId)</code>
                  <p className="mt-1 text-sm text-muted-foreground">Pause an active stream</p>
                </div>
                <div className="bg-card p-4">
                  <code className="text-sm font-mono text-primary">resumeStream(streamId)</code>
                  <p className="mt-1 text-sm text-muted-foreground">Resume a paused stream</p>
                </div>
                <div className="bg-card p-4">
                  <code className="text-sm font-mono text-primary">withdraw(streamId)</code>
                  <p className="mt-1 text-sm text-muted-foreground">Withdraw accrued streaming funds</p>
                </div>
                <div className="bg-card p-4">
                  <code className="text-sm font-mono text-primary">cancelStream(streamId)</code>
                  <p className="mt-1 text-sm text-muted-foreground">Cancel stream and refund remaining</p>
                </div>
              </div>
            </div>
          </div>
        </section>

        <section id="conditional-escrow" className="mt-16">
          <h2 className="text-2xl font-bold text-foreground">Conditional Escrow (Planned)</h2>
          <p className="mt-4 text-muted-foreground">
            Advanced escrow with conditions for milestone-based releases, time-locked funds, and multi-sig approvals.
          </p>

          <div className="mt-8 grid gap-6 sm:grid-cols-2">
            <div className="rounded-lg border border-border bg-card p-5">
              <div className="flex items-center gap-2 mb-3">
                <Users className="h-5 w-5 text-primary" />
                <h3 className="font-semibold text-foreground">Multi-sig Releases</h3>
              </div>
              <p className="text-sm text-muted-foreground">
                Require multiple approvals before funds can be released. Ideal for enterprise payments and team workflows.
              </p>
            </div>

            <div className="rounded-lg border border-border bg-card p-5">
              <div className="flex items-center gap-2 mb-3">
                <Clock className="h-5 w-5 text-primary" />
                <h3 className="font-semibold text-foreground">Time-locked Releases</h3>
              </div>
              <p className="text-sm text-muted-foreground">
                Funds held until a specific time or date. Perfect for vesting schedules and delayed payments.
              </p>
            </div>

            <div className="rounded-lg border border-border bg-card p-5">
              <div className="flex items-center gap-2 mb-3">
                <CheckCircle className="h-5 w-5 text-primary" />
                <h3 className="font-semibold text-foreground">Milestone-based Releases</h3>
              </div>
              <p className="text-sm text-muted-foreground">
                Release funds as milestones are completed. Ideal for freelance payments and contractor work.
              </p>
            </div>

            <div className="rounded-lg border border-border bg-card p-5">
              <div className="flex items-center gap-2 mb-3">
                <Link2 className="h-5 w-5 text-primary" />
                <h3 className="font-semibold text-foreground">Oracle-triggered Releases</h3>
              </div>
              <p className="text-sm text-muted-foreground">
                Release funds based on external conditions via oracles. Support price conditions and custom triggers.
              </p>
            </div>
          </div>
        </section>

        <section id="subscriptions" className="mt-16">
          <h2 className="text-2xl font-bold text-foreground">Subscription Payments (Planned)</h2>
          <p className="mt-4 text-muted-foreground">
            Recurring payment system with automatic renewal and subscription management.
          </p>

          <div className="mt-6">
            <h3 className="text-lg font-semibold text-foreground">Planned Features</h3>
            <ul className="mt-4 space-y-3">
              {[
                "Create recurring payment subscriptions",
                "Automatic renewal on specified intervals",
                "Pause and resume subscriptions",
                "Cancel with built-in cooling period",
                "Upgrade/downgrade subscription tiers",
                "Prorated charges for plan changes",
              ].map((feature) => (
                <li key={feature} className="flex items-center gap-2 text-muted-foreground">
                  <Clock className="h-4 w-4 text-muted-foreground" />
                  <span>{feature}</span>
                </li>
              ))}
            </ul>
          </div>
        </section>

        <section id="defi" className="mt-16">
          <h2 className="text-2xl font-bold text-foreground">DeFi Integration (Planned)</h2>
          <p className="mt-4 text-muted-foreground">
            Yield-bearing and DeFi-powered features for merchant balances.
          </p>

          <div className="mt-6 grid gap-4 sm:grid-cols-2">
            <div className="rounded-lg border border-border bg-card p-5">
              <h3 className="font-semibold text-foreground">Yield-bearing Escrow</h3>
              <p className="mt-2 text-sm text-muted-foreground">
                Automatically stake escrow funds in DeFi protocols to generate yield while waiting for claims.
              </p>
            </div>
            <div className="rounded-lg border border-border bg-card p-5">
              <h3 className="font-semibold text-foreground">Auto-compound</h3>
              <p className="mt-2 text-sm text-muted-foreground">
                Automatically compound yields for merchant balances. Funds grow while waiting for withdrawal.
              </p>
            </div>
            <div className="rounded-lg border border-border bg-card p-5">
              <h3 className="font-semibold text-foreground">USD Savings</h3>
              <p className="mt-2 text-sm text-muted-foreground">
                Offer users USD-pegged savings accounts with stable yields from DeFi activities.
              </p>
            </div>
            <div className="rounded-lg border border-border bg-card p-5">
              <h3 className="font-semibold text-foreground">Liquidity Provision</h3>
              <p className="mt-2 text-sm text-muted-foreground">
                Provide liquidity to DEXes and earn fees on stablecoin swaps.
              </p>
            </div>
          </div>
        </section>

        <section id="cross-chain" className="mt-16">
          <h2 className="text-2xl font-bold text-foreground">Cross-chain Support (Planned)</h2>
          <p className="mt-4 text-muted-foreground">
            Enable payments across multiple blockchain networks using LayerZero.
          </p>

          <div className="mt-6">
            <h3 className="text-lg font-semibold text-foreground">Planned Networks</h3>
            <div className="mt-4 grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
          {[
            { name: "Base Sepolia", symbol: "USDC" },
            { name: "Base", symbol: "USDC" },
          ].map((chain) => (
                <div key={chain.name} className="flex items-center justify-between rounded-lg border border-border bg-card px-4 py-3">
                  <span className="font-medium text-foreground">{chain.name}</span>
                  <span className="text-sm text-muted-foreground">{chain.symbol}</span>
                </div>
              ))}
            </div>
          </div>
        </section>

        <section id="security" className="mt-16">
          <h2 className="text-2xl font-bold text-foreground">Security</h2>
          
          <div className="mt-6 rounded-lg border border-amber-500/20 bg-amber-500/5 p-4">
            <div className="flex items-start gap-3">
              <AlertTriangle className="h-5 w-5 text-amber-500 shrink-0 mt-0.5" />
              <div>
                <h3 className="font-medium text-foreground">Audit Required</h3>
                <p className="mt-1 text-sm text-muted-foreground">
                  All smart contracts should be audited before mainnet deployment. Contact security@peys.io for audit partnerships.
                </p>
              </div>
            </div>
          </div>

          <div className="mt-6 grid gap-4 sm:grid-cols-2">
            <div className="rounded-lg border border-border bg-card p-5">
              <h3 className="font-semibold text-foreground">Audited Contracts</h3>
              <ul className="mt-3 space-y-2 text-sm text-muted-foreground">
                <li>• PeysEscrow (Basic Escrow)</li>
                <li>• PeyStreaming (Streaming)</li>
              </ul>
            </div>
            <div className="rounded-lg border border-border bg-card p-5">
              <h3 className="font-semibold text-foreground">Security Measures</h3>
              <ul className="mt-3 space-y-2 text-sm text-muted-foreground">
                <li>• ReentrancyGuard</li>
                <li>• Access control (Ownable)</li>
                <li>• Pausable contracts</li>
                <li>• Safe math operations</li>
              </ul>
            </div>
          </div>
        </section>

        <section id="resources" className="mt-16">
          <h2 className="text-2xl font-bold text-foreground">Resources</h2>
          <div className="mt-6 grid gap-4 sm:grid-cols-2">
            <a
              href="https://github.com/Moses-main/peydot-magic-links/tree/main/contracts"
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center gap-3 rounded-lg border border-border bg-card p-4 hover:border-primary/50 transition-colors"
            >
              <FileCode className="h-5 w-5 text-primary" />
              <div>
                <h3 className="font-medium text-foreground">View on GitHub</h3>
                <p className="text-sm text-muted-foreground">Smart contract source code</p>
              </div>
            </a>
            <a
              href="https://github.com/Moses-main/peydot-magic-links"
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center gap-3 rounded-lg border border-border bg-card p-4 hover:border-primary/50 transition-colors"
            >
              <Globe className="h-5 w-5 text-primary" />
              <div>
                <h3 className="font-medium text-foreground">Documentation</h3>
                <p className="text-sm text-muted-foreground">Integration guides</p>
              </div>
            </a>
          </div>
        </section>
      </div>
    </DocsLayout>
  );
}
