import { motion } from "framer-motion";
import { Code, Terminal, Box, Globe, ArrowRight, Lock, FileText, Zap, CreditCard, Key, Shield, Clock, CheckCircle, Link } from "lucide-react";
import { Link as RouterLink } from "react-router-dom";
import AppHeader from "@/components/AppHeader";
import Footer from "@/components/Footer";

const pricingTiers = [
  {
    name: "Free",
    price: "$0",
    period: "/month",
    description: "Perfect for testing and small projects",
    features: [
      "1,000 API calls/month",
      "Testnet only",
      "Community support",
      "Basic analytics",
      "All SDK languages",
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
    ],
    cta: "Contact Sales",
    popular: false,
  },
];

const features = [
  {
    icon: Globe,
    title: "REST API",
    description: "Full programmatic access to all payment features. Send, receive, and manage payments via simple HTTP requests."
  },
  {
    icon: Terminal,
    title: "SDKs",
    description: "Official SDKs for JavaScript, Python, Go, and more. Integrate payments in minutes, not days."
  },
  {
    icon: Box,
    title: "Widgets",
    description: "Embed payment buttons and forms directly in your website. Customizable to match your brand."
  },
  {
    icon: Lock,
    title: "Webhooks",
    description: "Real-time event notifications for payments, claims, and refunds. Stay in sync with your systems."
  }
];

const apiEndpoints = [
  { method: "POST", path: "/v1/payments", desc: "Create a new payment" },
  { method: "GET", path: "/v1/payments/:id", desc: "Get payment details" },
  { method: "POST", path: "/v1/payments/:id/claim", desc: "Claim a payment" },
  { method: "GET", path: "/v1/transactions", desc: "List transactions" },
  { method: "POST", path: "/v1/webhooks", desc: "Register webhook" },
  { method: "GET", path: "/v1/accounts", desc: "Get account info" },
];

const codeExample = `// Create a payment in 3 lines
import { Peys } from '@peys/sdk';

const peys = new Peys({ apiKey: 'sk_live_...' });

const payment = await peys.payments.create({
  amount: 100,
  token: 'USDC',
  recipient: 'alice@example.com'
});

console.log(payment.link); 
// https://peys.app/pay/abc123`;

export default function DevelopersPage() {
  return (
    <div className="min-h-screen bg-background">
      <AppHeader />
      
      <main>
        <section className="relative overflow-hidden pt-24 pb-20 sm:pt-32 sm:pb-24">
          <div className="absolute inset-0 bg-gradient-to-b from-primary/5 to-transparent" />
          <div className="container relative mx-auto max-w-6xl px-4">
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              className="mx-auto max-w-4xl text-center"
            >
              <div className="mb-4 inline-flex items-center gap-2 rounded-full border border-border bg-secondary/50 px-4 py-1.5 text-sm">
                <Code className="h-4 w-4 text-primary" />
                <span className="text-muted-foreground">Coming Soon</span>
              </div>
              <h1 className="font-display text-4xl text-foreground sm:text-5xl md:text-6xl">
                Build with Peys.<br />Integrate payments everywhere.
              </h1>
              <p className="mt-6 text-lg text-muted-foreground sm:text-xl">
                Powerful APIs and SDKs to integrate USDC payments into your apps, platforms, and workflows.
              </p>
              <div className="mt-8 lg:mt-10 flex flex-wrap justify-center gap-4 lg:gap-6">
                <a href="#features" className="inline-flex items-center gap-2 rounded-lg bg-foreground px-6 py-3 font-semibold text-background transition-opacity hover:opacity-90">
                  Explore Features <ArrowRight className="h-4 w-4" />
                </a>
                <a href="mailto:peys.xyz@gmail.com" className="inline-flex items-center gap-2 rounded-lg border border-border px-6 py-3 font-semibold text-foreground transition-colors hover:bg-secondary">
                  Request Access
                </a>
              </div>
            </motion.div>
          </div>
        </section>

        <section id="features" className="border-y border-border py-20 lg:py-24">
          <div className="container mx-auto max-w-6xl px-4 lg:px-8">
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              className="mx-auto max-w-2xl text-center"
            >
              <h2 className="font-display text-3xl text-foreground sm:text-4xl">
                Developer Tools
              </h2>
              <p className="mt-4 text-muted-foreground">
                Everything you need to build payment flows into your products
              </p>
            </motion.div>

            <div className="mt-12 lg:mt-16 mx-auto grid max-w-5xl gap-6 lg:gap-8 sm:grid-cols-2">
              {features.map((feature, i) => {
                const Icon = feature.icon;
                return (
                  <motion.div
                    key={feature.title}
                    initial={{ opacity: 0, y: 20 }}
                    whileInView={{ opacity: 1, y: 0 }}
                    viewport={{ once: true }}
                    transition={{ delay: i * 0.1 }}
                    className="rounded-xl border border-border bg-card p-6 lg:p-8"
                  >
                    <div className="mb-4 flex h-12 w-12 items-center justify-center rounded-lg border border-border bg-secondary text-primary">
                      <Icon className="h-6 w-6" />
                    </div>
                    <h3 className="font-display text-xl text-foreground">{feature.title}</h3>
                    <p className="mt-2 text-muted-foreground">{feature.description}</p>
                  </motion.div>
                );
              })}
            </div>
          </div>
        </section>

        <section id="api" className="border-t border-border py-20 lg:py-24">
          <div className="container mx-auto max-w-6xl px-4 lg:px-8">
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              className="mx-auto max-w-2xl text-center"
            >
              <h2 className="font-display text-3xl text-foreground sm:text-4xl">
                Simple API, Powerful Features
              </h2>
              <p className="mt-4 text-muted-foreground">
                Our REST API is designed to be intuitive and developer-friendly
              </p>
            </motion.div>

            <div className="mt-12 lg:mt-16 grid gap-6 lg:gap-8 lg:grid-cols-2">
              <motion.div
                initial={{ opacity: 0, x: -20 }}
                whileInView={{ opacity: 1, x: 0 }}
                viewport={{ once: true }}
                className="rounded-xl border border-border bg-card overflow-hidden"
              >
                <div className="border-b border-border bg-secondary/30 px-4 py-3">
                  <span className="text-xs font-semibold text-muted-foreground">API Endpoints</span>
                </div>
                <div className="divide-y divide-border">
                  {apiEndpoints.map((endpoint) => (
                    <div key={endpoint.path} className="flex items-center gap-4 px-4 py-3">
                      <span className={`shrink-0 rounded px-2 py-0.5 text-xs font-bold ${
                        endpoint.method === 'POST' ? 'bg-primary/10 text-primary' :
                        endpoint.method === 'GET' ? 'bg-green-500/10 text-green-500' :
                        'bg-yellow-500/10 text-yellow-500'
                      }`}>
                        {endpoint.method}
                      </span>
                      <span className="font-mono text-sm text-foreground">{endpoint.path}</span>
                      <span className="text-sm text-muted-foreground ml-auto">{endpoint.desc}</span>
                    </div>
                  ))}
                </div>
              </motion.div>

              <motion.div
                initial={{ opacity: 0, x: 20 }}
                whileInView={{ opacity: 1, x: 0 }}
                viewport={{ once: true }}
                className="rounded-xl border border-border bg-card overflow-hidden"
              >
                <div className="border-b border-border bg-secondary/30 px-4 py-3 flex items-center justify-between">
                  <span className="text-xs font-semibold text-muted-foreground">JavaScript SDK</span>
                  <div className="flex items-center gap-2">
                    <Code className="h-3 w-3 text-muted-foreground" />
                    <span className="text-xs text-muted-foreground">Node.js</span>
                  </div>
                </div>
                <div className="bg-secondary/50 p-4 overflow-x-auto">
                  <pre className="text-sm font-mono text-foreground whitespace-pre-wrap">
                    <code>{codeExample}</code>
                  </pre>
                </div>
              </motion.div>
            </div>
          </div>
        </section>

        <section id="pricing" className="border-t border-border py-20 lg:py-24">
          <div className="container mx-auto max-w-6xl px-4 lg:px-8">
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              className="mx-auto max-w-2xl text-center"
            >
              <h2 className="font-display text-3xl text-foreground sm:text-4xl">
                Simple, Transparent Pricing
              </h2>
              <p className="mt-4 text-muted-foreground">
                Pay only for what you use. No hidden fees.
              </p>
            </motion.div>

            <div className="mt-12 lg:mt-16 grid gap-6 lg:grid-cols-3 max-w-5xl mx-auto">
              {pricingTiers.map((tier, i) => (
                <motion.div
                  key={tier.name}
                  initial={{ opacity: 0, y: 20 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true }}
                  transition={{ delay: i * 0.1 }}
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
                        <CheckCircle className="h-4 w-4 text-green-500 shrink-0" />
                        <span className="text-foreground">{feature}</span>
                      </li>
                    ))}
                  </ul>
                  
                  <RouterLink
                    to="/docs/sdks/pricing"
                    className={`block w-full text-center py-2 rounded-lg font-medium transition-colors ${
                      tier.popular
                        ? "bg-primary text-primary-foreground hover:opacity-90"
                        : "bg-secondary text-foreground hover:bg-secondary/80"
                    }`}
                  >
                    {tier.cta}
                  </RouterLink>
                </motion.div>
              ))}
            </div>

            <div className="mt-12 text-center">
              <RouterLink
                to="/docs/sdks/pricing"
                className="inline-flex items-center gap-2 text-primary hover:underline"
              >
                View full SDK pricing details <ArrowRight className="h-4 w-4" />
              </RouterLink>
            </div>
          </div>
        </section>

        <section className="border-t border-border py-16 sm:py-20">
          <div className="container mx-auto max-w-6xl px-4">
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              className="mx-auto max-w-3xl text-center"
            >
              <h2 className="font-display text-3xl text-foreground sm:text-4xl">
                Why Developers Choose Peys
              </h2>
            </motion.div>

            <div className="mt-12 lg:mt-16 mx-auto grid max-w-4xl gap-6 lg:gap-8 sm:grid-cols-3">
              {[
                { icon: Zap, title: "Fast Integration", desc: "Get started in minutes, not days" },
                { icon: Shield, title: "Secure by Default", desc: "Enterprise-grade security" },
                { icon: Clock, title: "99.99% Uptime", desc: "Reliable infrastructure" },
              ].map((item, i) => {
                const Icon = item.icon;
                return (
                  <motion.div
                    key={item.title}
                    initial={{ opacity: 0, y: 20 }}
                    whileInView={{ opacity: 1, y: 0 }}
                    viewport={{ once: true }}
                    transition={{ delay: i * 0.1 }}
                    className="text-center"
                  >
                    <div className="mx-auto mb-4 flex h-12 w-12 items-center justify-center rounded-full bg-primary/10 text-primary">
                      <Icon className="h-6 w-6" />
                    </div>
                    <h3 className="font-display text-lg text-foreground">{item.title}</h3>
                    <p className="mt-1 text-sm text-muted-foreground">{item.desc}</p>
                  </motion.div>
                );
              })}
            </div>
          </div>
        </section>

        <section className="border-t border-border bg-secondary/30 py-16 lg:py-20">
          <div className="container mx-auto max-w-5xl px-4 lg:px-8 text-center">
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              className="mx-auto max-w-2xl"
            >
              <h2 className="font-display text-3xl text-foreground sm:text-4xl">
                Get Early Access
              </h2>
              <p className="mt-4 text-muted-foreground">
                Join the developer preview program to get early access to our APIs and SDKs.
              </p>
              <div className="mt-8">
                <a
                  href="mailto:peys.xyz@gmail.com"
                  className="inline-flex items-center gap-2 rounded-lg bg-primary px-6 py-3 font-semibold text-primary-foreground shadow-glow transition-opacity hover:opacity-90"
                >
                  Request Access <ArrowRight className="h-4 w-4" />
                </a>
              </div>
            </motion.div>
          </div>
        </section>
      </main>

      <Footer />
    </div>
  );
}
