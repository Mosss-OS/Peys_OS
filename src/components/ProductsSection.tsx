import { motion } from "framer-motion";
import { ArrowUpRight, User, Building2, Send, Link2, Globe, Zap, Users, BarChart3, Shield, FileText, CreditCard, Repeat, Wallet, Receipt, MessageCircle, Code } from "lucide-react";
import { Link } from "react-router-dom";

const products = [
  {
    id: "personal",
    label: "Personal",
    tagline: "Your everyday stablecoin wallet",
    description: "Send, receive, and manage stablecoins effortlessly. No crypto knowledge needed — just a link and an email.",
    icon: User,
    color: "primary",
    link: "/send",
    features: [
      { icon: Link2, text: "Send via magic link" },
      { icon: Globe, text: "Pay anyone globally" },
      { icon: Wallet, text: "Auto-created wallet" },
      { icon: Shield, text: "Escrow protection" },
    ],
  },
  {
    id: "business",
    label: "Business",
    tagline: "Scale payments for your organization",
          description: "Payroll, vendor payments, and treasury management — all powered by stablecoins on Base with enterprise-grade tools.",
    icon: Building2,
    color: "accent",
    link: "/batch",
    badge: "Coming Soon",
    features: [
      { icon: Users, text: "Batch payroll" },
      { icon: Zap, text: "Streaming salaries" },
      { icon: BarChart3, text: "Analytics & reports" },
      { icon: Receipt, text: "Invoice & request" },
    ],
  },
  {
    id: "developers",
    label: "Developers",
    tagline: "Build with Peys",
    description: "Integrate USDC payments into your apps with powerful APIs, SDKs, and webhooks. Perfect for platforms and marketplaces.",
    icon: Code,
    color: "accent",
    link: "/developers",
    badge: "Coming Soon",
    features: [
      { icon: Globe, text: "REST API" },
      { icon: Code, text: "SDKs" },
      { icon: Zap, text: "Webhooks" },
      { icon: Receipt, text: "Widgets" },
    ],
  },
];

export default function ProductsSection() {
  return (
    <section className="py-20 sm:py-28">
      <div className="container mx-auto px-4">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          className="mx-auto max-w-2xl text-center"
        >
          <p className="text-xs font-semibold uppercase tracking-widest text-muted-foreground">Products</p>
          <h2 className="mt-3 font-display text-2xl text-foreground sm:text-4xl md:text-5xl">
            Built for individuals.<br />Ready for teams.
          </h2>
          <p className="mt-4 text-sm text-muted-foreground sm:text-base">
            Whether you're sending money to a friend or running payroll for 500 employees — Peys has you covered.
          </p>
        </motion.div>

        <div className="mx-auto mt-14 grid max-w-4xl gap-6 sm:mt-20 md:grid-cols-2">
          {products.map((product, i) => {
            const Icon = product.icon;
            return (
              <motion.div
                key={product.id}
                initial={{ opacity: 0, y: 30 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: i * 0.15 }}
              >
                <Link
                  to={product.link}
                  className="group relative flex h-full flex-col overflow-hidden rounded-2xl border border-border bg-card p-6 transition-all hover:border-primary/30 hover:shadow-card sm:p-8"
                >
                  {/* Badge */}
                  {product.badge && (
                    <span className="absolute right-4 top-4 rounded-full border border-border bg-secondary px-3 py-1 text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">
                      {product.badge}
                    </span>
                  )}

                  {/* Header */}
                  <div className="mb-6 flex items-start gap-4">
                    <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl border border-border bg-secondary text-primary">
                      <Icon className="h-6 w-6" strokeWidth={1.5} />
                    </div>
                    <div>
                      <h3 className="font-display text-xl text-foreground sm:text-2xl">
                        {product.label}
                      </h3>
                      <p className="text-sm text-muted-foreground">{product.tagline}</p>
                    </div>
                  </div>

                  <p className="mb-6 text-sm leading-relaxed text-muted-foreground">
                    {product.description}
                  </p>

                  {/* Feature pills */}
                  <div className="mb-6 grid grid-cols-2 gap-2">
                    {product.features.map((f) => {
                      const FIcon = f.icon;
                      return (
                        <div
                          key={f.text}
                          className="flex items-center gap-2 rounded-lg border border-border/50 bg-secondary/50 px-3 py-2 text-xs text-muted-foreground"
                        >
                          <FIcon className="h-3.5 w-3.5 shrink-0 text-primary/70" />
                          <span>{f.text}</span>
                        </div>
                      );
                    })}
                  </div>

                  {/* CTA */}
                  <div className="mt-auto flex items-center gap-2 text-sm font-semibold text-primary transition-colors group-hover:text-foreground">
                    {product.badge ? "Learn More" : "Get Started"}
                    <ArrowUpRight className="h-4 w-4 transition-transform group-hover:translate-x-0.5 group-hover:-translate-y-0.5" />
                  </div>
                </Link>
              </motion.div>
            );
          })}
        </div>
      </div>
    </section>
  );
}
