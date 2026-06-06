/** FeaturesSection - Segmented feature grid toggling between individual, organization, and developer feature sets with animated transitions */
import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Link2, Shield, Globe, Zap, Users, BarChart3, Wallet, Receipt, CreditCard, FileText, ArrowRight, MessageCircle, Code, Terminal, Box } from "lucide-react";
import { Link } from "react-router-dom";

import featureMagicLinks from "@/assets/feature-magic-links.png";
import featureEscrow from "@/assets/feature-escrow.png";
import featureGlobal from "@/assets/feature-global.png";
import featureStreaming from "@/assets/feature-streaming.png";
import featureBatch from "@/assets/feature-batch.png";
import featureAnalytics from "@/assets/feature-analytics.png";

type Segment = "individual" | "organization" | "developers";

interface Feature {
  icon: React.ComponentType;
  title: string;
  desc: string;
  image: string;
  link?: string;
  coming?: boolean;
}

const individualFeatures: Feature[] = [
  {
    icon: Link2,
    title: "Magic Claim Links",
    desc: "Send money via a simple link. No wallet needed — recipients sign in with email and funds appear instantly.",
    image: featureMagicLinks,
    link: "/send",
  },
  {
    icon: Shield,
    title: "Escrow Protection",
    desc: "Funds are locked in audited smart contracts until claimed. If unclaimed after 7 days, they're automatically refunded.",
    image: featureEscrow,
    link: "/send",
  },
  {
    icon: Globe,
    title: "Global Transfers",
        desc: "Send USDC to anyone in the world on Base with near-zero fees. USDT support coming soon.",
    image: featureGlobal,
    link: "/send",
  },
  {
    icon: Wallet,
    title: "Instant Wallet",
    desc: "Recipients get an auto-created wallet on first claim. No seed phrases, no setup — just sign in with email.",
    image: featureMagicLinks,
    link: "/claim/demo",
  },
];

const orgFeatures: Feature[] = [
  {
    icon: Users,
    title: "Batch Payroll",
    desc: "Upload a CSV and pay hundreds of employees or contractors in one click. Perfect for global payroll.",
    image: featureBatch,
    link: "/batch",
  },
  {
    icon: Zap,
    title: "Payment Streaming",
    desc: "Stream payments per second for salaries, subscriptions, and real-time compensation. Complete control over flow.",
    image: featureStreaming,
    link: "/streaming",
  },
  {
    icon: BarChart3,
    title: "Analytics & Reports",
    desc: "Track payment volume, claim rates, geographic reach, and top recipients — all updated live in your dashboard.",
    image: featureAnalytics,
    link: "/analytics",
  },
  {
    icon: Receipt,
    title: "Invoice & Request",
    desc: "Generate payment requests and invoices with unique links. Recipients pay with one click — you get notified instantly.",
    image: featureEscrow,
    link: "/request",
  },
];

const devFeatures: Feature[] = [
  {
    icon: Code,
    title: "REST API",
    desc: "Full programmatic access to all payment features. Send, receive, and manage payments via simple HTTP requests.",
    image: featureMagicLinks,
    link: "/developers",
    coming: true,
  },
  {
    icon: Terminal,
    title: "SDKs",
    desc: "Official SDKs for JavaScript, Python, Go, and more. Integrate payments in minutes, not days.",
    image: featureEscrow,
    link: "/developers",
    coming: true,
  },
  {
    icon: Box,
    title: "Widgets",
    desc: "Embed payment buttons and forms directly in your website. Customizable to match your brand.",
    image: featureGlobal,
    link: "/developers",
    coming: true,
  },
  {
    icon: Zap,
    title: "Webhooks",
    desc: "Real-time event notifications for payments, claims, and refunds. Stay in sync with your systems.",
    image: featureStreaming,
    link: "/developers",
    coming: true,
  },
];

export default function FeaturesSection() {
  const [segment, setSegment] = useState<Segment>("individual");
  const features = segment === "individual" ? individualFeatures : segment === "organization" ? orgFeatures : devFeatures;

  return (
    <section className="border-y border-border py-20 sm:py-28">
      <div className="container mx-auto px-4">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          className="mx-auto max-w-2xl text-center"
        >
          <p className="text-xs font-semibold uppercase tracking-widest text-muted-foreground">Features</p>
          <h2 className="mt-3 font-display text-2xl text-foreground sm:text-4xl md:text-5xl">
            Everything you need to move money
          </h2>
          <p className="mt-4 text-sm text-muted-foreground sm:text-base">
            A complete payment toolkit — from one-click sends to streaming salaries.
          </p>

          {/* Segment Toggle */}
          <div className="mx-auto mt-8 inline-flex items-center gap-1 rounded-full border border-border bg-secondary/50 p-1">
            <button
              onClick={() => setSegment("individual")}
              className={`rounded-full px-5 py-2 text-sm font-medium transition-all ${
                segment === "individual"
                  ? "bg-primary text-primary-foreground shadow-sm"
                  : "text-muted-foreground hover:text-foreground"
              }`}
            >
              👤 Individual
            </button>
            <button
              onClick={() => setSegment("organization")}
              className={`rounded-full px-5 py-2 text-sm font-medium transition-all ${
                segment === "organization"
                  ? "bg-primary text-primary-foreground shadow-sm"
                  : "text-muted-foreground hover:text-foreground"
              }`}
            >
              🏢 Organization
            </button>
            <button
              onClick={() => setSegment("developers")}
              className={`rounded-full px-5 py-2 text-sm font-medium transition-all ${
                segment === "developers"
                  ? "bg-primary text-primary-foreground shadow-sm"
                  : "text-muted-foreground hover:text-foreground"
              }`}
            >
              💻 Developers
            </button>
          </div>
        </motion.div>

        <AnimatePresence mode="wait">
          <motion.div
            key={segment}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            transition={{ duration: 0.35 }}
            className="mx-auto mt-14 max-w-5xl sm:mt-20"
          >
            <div className="grid gap-6 sm:grid-cols-2">
              {features.map((f: Feature, i) => {
                const Icon = f.icon;
                return (
                  <motion.div
                    key={f.title}
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: i * 0.08 }}
                  >
                    <div
                      className={`group flex h-full flex-col overflow-hidden rounded-2xl border border-border bg-card transition-all ${
                        f.coming ? "opacity-70" : "hover:border-primary/30 hover:shadow-card"
                      }`}
                    >
                      {/* Image */}
                      <div className="relative flex h-44 items-center justify-center overflow-hidden bg-secondary/30 p-4 sm:h-52">
                        <motion.img
                          src={f.image}
                          alt={f.title}
                          className="h-full w-auto max-w-full object-contain"
                          loading="lazy"
                          whileHover={f.coming ? {} : { scale: 1.05 }}
                          transition={{ duration: 0.4 }}
                        />
                        {f.coming && (
                          <div className="absolute inset-0 bg-background/60 flex items-center justify-center">
                            <span className="rounded-full bg-primary px-4 py-2 text-sm font-semibold text-primary-foreground">
                              Coming Soon
                            </span>
                          </div>
                        )}
                      </div>

                      {/* Content */}
                      <div className="flex flex-1 flex-col p-5 sm:p-6">
                        <div className="mb-3 flex items-center gap-3">
                          <div className="flex h-9 w-9 items-center justify-center rounded-lg border border-border bg-secondary text-primary">
                            <Icon className="h-4 w-4" strokeWidth={1.5} />
                          </div>
                          <h3 className="font-display text-lg text-foreground flex items-center gap-2">
                            {f.title}
                            {f.coming && (
                              <span className="rounded-full bg-secondary px-2 py-0.5 text-[10px] font-medium text-muted-foreground">
                                Soon
                              </span>
                            )}
                          </h3>
                        </div>
                        <p className="text-sm leading-relaxed text-muted-foreground">{f.desc}</p>
                        <div className="mt-4 flex items-center gap-1.5 text-xs font-semibold text-primary transition-colors group-hover:text-foreground">
                          Learn more <ArrowRight className="h-3 w-3 transition-transform group-hover:translate-x-0.5" />
                        </div>
                      </div>
                    </div>
                  </motion.div>
                );
              })}
            </div>
          </motion.div>
        </AnimatePresence>
      </div>
    </section>
  );
}
