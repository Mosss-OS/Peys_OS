import { Link } from "react-router-dom";
import { ArrowLeft, Check, Zap, Shield, Rocket, X } from "lucide-react";
import DocsLayout from "@/components/DocsLayout";

const tiers = [
  {
    name: "Free",
    price: "$0",
    description: "Perfect for testing and small projects",
    features: [
      "1,000 API calls/month",
      "Testnet only",
      "Community support",
      "Basic analytics",
    ],
    notIncluded: [
      "Mainnet access",
      "Priority support",
      "Webhooks",
    ],
    cta: "Get Started",
    popular: false,
  },
  {
    name: "Pro",
    price: "$99",
    period: "/month",
    description: "For growing businesses and production apps",
    features: [
      "100,000 API calls/month",
      "Mainnet + Testnet",
      "Priority support",
      "Webhooks",
      "Advanced analytics",
      "Multiple organization seats",
    ],
    notIncluded: [
      "Custom rate limits",
      "Dedicated account manager",
    ],
    cta: "Upgrade to Pro",
    popular: true,
  },
  {
    name: "Enterprise",
    price: "Custom",
    description: "For high-volume enterprises",
    features: [
      "Unlimited API calls",
      "Dedicated support",
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

const faqs = [
  {
    q: "How does billing work?",
    a: "We bill monthly based on your tier. Overage charges apply if you exceed your API call limit. You can upgrade or downgrade anytime.",
  },
  {
    q: "What happens if I exceed my API limit?",
    a: "You'll be charged a small per-request fee ($0.001 for Free, $0.0005 for Pro). For Enterprise, we work with you to find the best solution.",
  },
  {
    q: "Can I use testnet for free?",
    a: "Yes! Testnet access is completely free on all plans. Use it to test your integration before going to production.",
  },
  {
    q: "How do I upgrade my plan?",
    a: "Go to your Dashboard > API Keys > Upgrade. Changes are applied immediately and you'll be charged on a pro-rated basis.",
  },
  {
    q: "Is there a trial period?",
    a: "The Free tier gives you 1,000 API calls to try things out. For Pro, we offer a 14-day free trial with full features.",
  },
];

export default function PricingPage() {
  return (
    <DocsLayout>
      <div className="prose prose-invert max-w-none">
        <Link to="/docs" className="inline-flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground mb-4">
          <ArrowLeft className="h-4 w-4" /> Introduction
        </Link>

        <h1 className="text-4xl font-bold text-foreground">Pricing</h1>
        <p className="mt-4 text-xl text-muted-foreground">
          Simple, transparent pricing that scales with your business.
        </p>

        {/* Pricing Cards */}
        <div className="mt-12 grid gap-6 md:grid-cols-3">
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
          <h2 className="text-2xl font-bold text-foreground">API Usage</h2>
          <p className="mt-4 text-muted-foreground">
            Monitor your API usage in real-time from your dashboard. Each API key tracks its own usage independently.
          </p>
          
          <div className="mt-6 grid gap-4 sm:grid-cols-3">
            <div className="rounded-lg border border-border bg-card p-4">
              <div className="flex items-center gap-2 text-muted-foreground mb-2">
                <Zap className="h-4 w-4" />
                <span className="text-sm">Rate Limit</span>
              </div>
              <div className="text-2xl font-bold text-foreground">10-1000</div>
              <div className="text-xs text-muted-foreground">requests/minute</div>
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
                <span className="text-sm">Response</span>
              </div>
              <div className="text-2xl font-bold text-foreground">&lt;100ms</div>
              <div className="text-xs text-muted-foreground">average latency</div>
            </div>
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
            Create your free API key and start accepting payments in minutes.
          </p>
          <div className="mt-6 flex justify-center gap-4">
            <Link
              to="/api-keys"
              className="inline-flex items-center gap-2 rounded-lg bg-primary px-4 py-2 font-semibold text-primary-foreground hover:opacity-90"
            >
              Get API Key
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
