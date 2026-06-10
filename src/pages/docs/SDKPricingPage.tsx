import { Link } from "react-router-dom";
import { ArrowLeft, Check, Zap, Shield, Rocket, X, Terminal, Package, CreditCard } from "lucide-react";
import DocsLayout from "@/components/DocsLayout";

const tiers = [
  {
    name: "Starter",
    price: "$0",
    description: "Perfect for hobby projects and testing",
    features: [
      "1,000 API calls/month",
      "All SDK languages",
      "Community support",
      "Basic payment features",
      "Testnet support",
    ],
    notIncluded: [
      "Production support",
      "Advanced analytics",
      "Custom integrations",
    ],
    cta: "Get Started",
    popular: false,
  },
  {
    name: "Professional",
    price: "$49",
    period: "/month",
    description: "For growing applications and teams",
    features: [
      "50,000 API calls/month",
      "All SDK languages",
      "Priority email support",
      "Advanced payment features",
      "Webhooks",
      "Mainnet access",
      "Basic analytics",
    ],
    notIncluded: [
      "Dedicated account manager",
      "Custom rate limits",
    ],
    cta: "Upgrade to Pro",
    popular: true,
  },
  {
    name: "Enterprise",
    price: "Custom",
    description: "For high-volume applications",
    features: [
      "Unlimited API calls",
      "All SDK languages",
      "24/7 dedicated support",
      "Custom rate limits",
      "SLA guarantee",
      "Account manager",
      "Custom integrations",
      "On-premise option",
    ],
    notIncluded: [],
    cta: "Contact Sales",
    popular: false,
  },
];

const sdks = [
  {
    name: "JavaScript / TypeScript",
    icon: Terminal,
    description: "NPM package for browser and Node.js",
    install: "npm install @peys/sdk",
    popularity: "Most Popular",
  },
  {
    name: "Python",
    icon: Package,
    description: "PyPI package for Python applications",
    install: "pip install peys-sdk",
    popularity: "Popular",
  },
  {
    name: "Go",
    icon: Zap,
    description: "Go module for high-performance apps",
    install: "go get github.com/peys/sdk-go",
    popularity: "Growing",
  },
];

const faqs = [
  {
    q: "Are the SDKs free to use?",
    a: "Yes! Our SDKs are open source and free to use. You only pay for the API calls made through the SDK based on your pricing tier.",
  },
  {
    q: "Do I need an API key to use the SDKs?",
    a: "Yes, you'll need to sign up for an account and get an API key. The Starter tier includes 1,000 free API calls per month.",
  },
  {
    q: "Which SDK should I use?",
    a: "Use the SDK that matches your application stack. All SDKs provide the same functionality and are fully supported.",
  },
  {
    q: "Can I use multiple SDKs together?",
    a: "Absolutely! You can use different SDKs in different parts of your application. All SDKs connect to the same backend services.",
  },
  {
    q: "Do the SDKs support both testnet and mainnet?",
    a: "Yes, all SDKs support both testnet (for development) and mainnet (for production). Testnet is always free to use.",
  },
];

export default function SDKPricingPage() {
  return (
    <DocsLayout>
      <div className="prose prose-invert max-w-none">
        <Link to="/docs" className="inline-flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground mb-4">
          <ArrowLeft className="h-4 w-4" /> Introduction
        </Link>

        <h1 className="text-4xl font-bold text-foreground">SDK Pricing</h1>
        <p className="mt-4 text-xl text-muted-foreground">
          Simple, transparent pricing for our SDKs that scales with your application.
        </p>

        {/* Supported SDKs */}
        <section className="mt-8">
          <h2 className="text-2xl font-bold text-foreground">Supported SDKs</h2>
          <p className="mt-4 text-muted-foreground">
            We provide official SDKs for the most popular programming languages.
          </p>
          
          <div className="mt-6 grid gap-4 sm:grid-cols-3">
            {sdks.map((sdk) => {
              const Icon = sdk.icon;
              return (
                <div key={sdk.name} className="rounded-xl border border-border bg-card p-5">
                  <div className="flex items-center gap-3 mb-3">
                    <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-secondary">
                      <Icon className="h-5 w-5 text-foreground" />
                    </div>
                    <div>
                      <h3 className="font-semibold text-foreground">{sdk.name}</h3>
                      <span className="text-xs text-primary">{sdk.popularity}</span>
                    </div>
                  </div>
                  <p className="text-sm text-muted-foreground mb-3">{sdk.description}</p>
                  <code className="text-xs bg-secondary px-2 py-1 rounded block overflow-x-auto">
                    {sdk.install}
                  </code>
                </div>
              );
            })}
          </div>
        </section>

        {/* Pricing Cards */}
        <div className="mt-12">
          <h2 className="text-2xl font-bold text-foreground">Pricing Plans</h2>
          <p className="mt-4 text-muted-foreground">
            Choose the plan that fits your needs. All plans include access to all SDKs.
          </p>
        </div>
        
        <div className="mt-6 grid gap-6 md:grid-cols-3">
          {tiers.map((tier) => (
            <div
              key={tier.name}
              className={`relative rounded-2xl border p-6 ${
                tier.popular
                  ? "border-primary bg-card/50 shadow-lg shadow-primary/10"
                  : "border-border bg-card"
              }`}
            >
              {tier.popular && (
                <div className="absolute -top-3 left-1/2 -translate-x-1/2">
                  <span className="bg-primary text-primary-foreground text-xs font-medium px-3 py-1 rounded-full">
                    Most Popular
                  </span>
                </div>
              )}
              
              <div className="mb-4">
                <h3 className="text-xl font-bold text-foreground">{tier.name}</h3>
                <p className="text-sm text-muted-foreground mt-1">{tier.description}</p>
              </div>
              
              <div className="mb-6">
                <span className="text-4xl font-bold text-foreground">{tier.price}</span>
                {tier.period && (
                  <span className="text-muted-foreground">{tier.period}</span>
                )}
              </div>
              
              <ul className="space-y-3 mb-6">
                {tier.features.map((feature) => (
                  <li key={feature} className="flex items-center gap-2 text-sm">
                    <Check className="h-4 w-4 text-green-500 shrink-0" />
                    <span className="text-foreground">{feature}</span>
                  </li>
                ))}
                {tier.notIncluded.map((feature) => (
                  <li key={feature} className="flex items-center gap-2 text-sm opacity-50">
                    <X className="h-4 w-4 shrink-0" />
                    <span>{feature}</span>
                  </li>
                ))}
              </ul>
              
              <Link
                to="/api-keys"
                className={`block w-full text-center py-2 rounded-lg font-medium transition-colors ${
                  tier.popular
                    ? "bg-primary text-primary-foreground hover:opacity-90"
                    : "bg-secondary text-foreground hover:bg-secondary/80"
                }`}
              >
                {tier.cta}
              </Link>
            </div>
          ))}
        </div>

        {/* API Usage */}
        <section className="mt-16">
          <h2 className="text-2xl font-bold text-foreground">SDK Performance</h2>
          <p className="mt-4 text-muted-foreground">
            Our SDKs are optimized for performance and reliability across all platforms.
          </p>
          
          <div className="mt-6 grid gap-4 sm:grid-cols-3">
            <div className="rounded-lg border border-border bg-card p-4">
              <div className="flex items-center gap-2 text-muted-foreground mb-2">
                <Zap className="h-4 w-4" />
                <span className="text-sm">Response Time</span>
              </div>
              <div className="text-2xl font-bold text-foreground">&lt;50ms</div>
              <div className="text-xs text-muted-foreground">average SDK overhead</div>
            </div>
            <div className="rounded-lg border border-border bg-card p-4">
              <div className="flex items-center gap-2 text-muted-foreground mb-2">
                <Shield className="h-4 w-4" />
                <span className="text-sm">Uptime</span>
              </div>
              <div className="text-2xl font-bold text-foreground">99.99%</div>
              <div className="text-xs text-muted-foreground">SLA guarantee</div>
            </div>
            <div className="rounded-lg border border-border bg-card p-4">
              <div className="flex items-center gap-2 text-muted-foreground mb-2">
                <Rocket className="h-4 w-4" />
                <span className="text-sm">Bundle Size</span>
              </div>
              <div className="text-2xl font-bold text-foreground">&lt;15kb</div>
              <div className="text-xs text-muted-foreground">minified JS SDK</div>
            </div>
          </div>
        </section>

        {/* Features Comparison */}
        <section className="mt-16">
          <h2 className="text-2xl font-bold text-foreground">Feature Comparison</h2>
          
          <div className="mt-6 overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-border">
                  <th className="text-left py-3 px-4 font-medium text-foreground">Feature</th>
                  <th className="text-center py-3 px-4 font-medium text-foreground">Starter</th>
                  <th className="text-center py-3 px-4 font-medium text-foreground">Professional</th>
                  <th className="text-center py-3 px-4 font-medium text-foreground">Enterprise</th>
                </tr>
              </thead>
              <tbody>
                {[
                  { f: "API calls/month", s: "1,000", p: "50,000", e: "Unlimited" },
                  { f: "All SDK languages", s: true, p: true, e: true },
                  { f: "Testnet access", s: true, p: true, e: true },
                  { f: "Mainnet access", s: false, p: true, e: true },
                  { f: "Webhooks", s: false, p: true, e: true },
                  { f: "Analytics", s: "Basic", p: "Advanced", e: "Custom" },
                  { f: "Priority support", s: false, p: true, e: true },
                  { f: "Custom rate limits", s: false, p: false, e: true },
                  { f: "Dedicated account manager", s: false, p: false, e: true },
                  { f: "SLA guarantee", s: false, p: false, e: true },
                ].map((row, i) => (
                  <tr key={i} className="border-b border-border">
                    <td className="py-3 px-4 text-foreground">{row.f}</td>
                    <td className="py-3 px-4 text-center">
                      {typeof row.s === "boolean" ? (
                        row.s ? <Check className="h-4 w-4 mx-auto text-green-500" /> : <X className="h-4 w-4 mx-auto text-muted-foreground" />
                      ) : (
                        <span className="text-muted-foreground">{row.s}</span>
                      )}
                    </td>
                    <td className="py-3 px-4 text-center">
                      {typeof row.p === "boolean" ? (
                        row.p ? <Check className="h-4 w-4 mx-auto text-green-500" /> : <X className="h-4 w-4 mx-auto text-muted-foreground" />
                      ) : (
                        <span className="text-muted-foreground">{row.p}</span>
                      )}
                    </td>
                    <td className="py-3 px-4 text-center">
                      {typeof row.e === "boolean" ? (
                        row.e ? <Check className="h-4 w-4 mx-auto text-green-500" /> : <X className="h-4 w-4 mx-auto text-muted-foreground" />
                      ) : (
                        <span className="text-muted-foreground">{row.e}</span>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </section>

        {/* FAQs */}
        <section className="mt-16">
          <h2 className="text-2xl font-bold text-foreground">Frequently Asked Questions</h2>
          <div className="mt-6 space-y-6">
            {faqs.map((faq) => (
              <div key={faq.q} className="rounded-lg border border-border bg-card p-4">
                <h3 className="font-medium text-foreground">{faq.q}</h3>
                <p className="mt-2 text-sm text-muted-foreground">{faq.a}</p>
              </div>
            ))}
          </div>
        </section>

        {/* CTA */}
        <section className="mt-16 rounded-xl border border-primary/20 bg-primary/5 p-8 text-center">
          <h2 className="text-2xl font-bold text-foreground">Ready to get started?</h2>
          <p className="mt-2 text-muted-foreground">
            Install our SDK and start integrating payments in minutes.
          </p>
          <div className="mt-6 flex justify-center gap-4 flex-wrap">
            <Link
              to="/docs/sdks/javascript"
              className="inline-flex items-center gap-2 rounded-lg bg-primary px-4 py-2 font-semibold text-primary-foreground hover:opacity-90"
            >
              Get JavaScript SDK
            </Link>
            <Link
              to="/docs/quickstart"
              className="inline-flex items-center gap-2 rounded-lg border border-border px-4 py-2 font-semibold text-foreground hover:bg-secondary"
            >
              Read the Docs
            </Link>
          </div>
        </section>
      </div>
    </DocsLayout>
  );
}
