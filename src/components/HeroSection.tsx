/** HeroSection - Landing page hero with animated intro, badge, headline, CTA links, and rotating abstract shapes */
import { motion } from "framer-motion";
import { ArrowRight, Play } from "lucide-react";
import { Link } from "react-router-dom";

export default function HeroSection() {
  return (
    <section className="relative overflow-hidden pt-28 pb-16 sm:pt-36 sm:pb-24">
      {/* Subtle grid background */}
      <div className="absolute inset-0 opacity-[0.03]" style={{
        backgroundImage: "linear-gradient(hsl(var(--foreground)) 1px, transparent 1px), linear-gradient(90deg, hsl(var(--foreground)) 1px, transparent 1px)",
        backgroundSize: "60px 60px",
      }} />

      <div className="container relative mx-auto px-4">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6 }}
          className="text-center"
        >
          {/* Badge */}
          <motion.div
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ delay: 0.1 }}
            className="mx-auto mb-6 inline-flex items-center gap-2 rounded-full border border-border bg-secondary px-5 py-2 shadow-sm"
          >
            <span className="h-1.5 w-1.5 rounded-full bg-primary animate-pulse" />
            <span className="text-xs text-muted-foreground">G$ · USDC · Open</span>
          </motion.div>

          <h1 className="mx-auto max-w-4xl font-display text-4xl leading-[1.1] text-foreground sm:text-6xl md:text-7xl lg:text-8xl">
            The <span className="text-gd">G$</span> stablecoin{" "}
            <span className="text-muted-foreground/40">payment OS</span>
          </h1>

          <p className="mx-auto mt-5 max-w-xl text-sm leading-relaxed text-muted-foreground sm:mt-7 sm:text-base">
            Products built on open infrastructure to deliver better stablecoin and G$ payments to every individual, business, and developer. Powered by GoodDollar.
          </p>

          <div className="mt-8 flex flex-col items-center gap-3 sm:mt-10 sm:flex-row sm:justify-center">
            <Link
              to="/send"
              className="group inline-flex w-full items-center justify-center gap-2 rounded-full bg-foreground px-7 py-3.5 text-sm font-semibold text-background transition-all hover:opacity-90 sm:w-auto"
            >
              For Individuals
              <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-0.5" />
            </Link>
            <Link
              to="/batch"
              className="inline-flex w-full items-center justify-center gap-2 rounded-full border border-border px-7 py-3.5 text-sm font-medium text-foreground transition-colors hover:bg-secondary sm:w-auto"
            >
              For Organizations
            </Link>
            <Link
              to="/developers"
              className="inline-flex w-full items-center justify-center gap-2 rounded-full border border-border px-7 py-3.5 text-sm font-medium text-muted-foreground transition-colors hover:bg-secondary hover:text-foreground sm:w-auto"
            >
              For Developers
            </Link>
          </div>
        </motion.div>

        {/* Abstract shapes */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.5, duration: 1 }}
          className="mx-auto mt-16 max-w-3xl sm:mt-20"
        >
          <div className="relative flex items-center justify-center py-8">
            <motion.div
              animate={{ rotate: 360 }}
              transition={{ duration: 18, repeat: Infinity, ease: "linear" }}
              className="absolute h-64 w-64 rounded-full border border-border/50 sm:h-80 sm:w-80"
            />
            <motion.div
              animate={{ rotate: -360 }}
              transition={{ duration: 12, repeat: Infinity, ease: "linear" }}
              className="absolute h-48 w-48 rounded-full border border-border/30 sm:h-60 sm:w-60"
            />
            <motion.div
              animate={{ rotate: 360 }}
              transition={{ duration: 8, repeat: Infinity, ease: "linear" }}
              className="absolute h-32 w-32 rounded-full border border-border/20 sm:h-40 sm:w-40"
            />

            <motion.div
              animate={{ rotate: 360 }}
              transition={{ duration: 4, repeat: Infinity, ease: "linear" }}
              className="absolute h-64 w-64 sm:h-80 sm:w-80"
            >
              <div className="absolute -top-1 left-1/2 h-2.5 w-2.5 -translate-x-1/2 rounded-full bg-foreground/20" />
            </motion.div>
            <motion.div
              animate={{ rotate: -360 }}
              transition={{ duration: 6, repeat: Infinity, ease: "linear" }}
              className="absolute h-48 w-48 sm:h-60 sm:w-60"
            >
              <div className="absolute -top-1 left-1/2 h-2 w-2 -translate-x-1/2 rounded-full bg-primary/40" />
            </motion.div>

            <div className="relative z-10 flex flex-col items-center gap-3">
              <div className="flex h-20 w-20 items-center justify-center rounded-2xl border border-border bg-card sm:h-24 sm:w-24">
                <span className="font-display text-3xl text-foreground sm:text-4xl">P</span>
              </div>
              <div className="flex items-center gap-4 text-xs text-muted-foreground">
                <span className="flex items-center gap-1.5"><span className="h-1.5 w-1.5 rounded-full bg-primary" /> Individual</span>
                <span className="flex items-center gap-1.5"><span className="h-1.5 w-1.5 rounded-full bg-accent" /> Business</span>
                <span className="flex items-center gap-1.5"><span className="h-1.5 w-1.5 rounded-full bg-border" /> Developer</span>
              </div>
            </div>
          </div>
        </motion.div>
      </div>
    </section>
  );
}
