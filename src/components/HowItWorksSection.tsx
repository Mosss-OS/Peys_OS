/** HowItWorksSection - Four-step walkthrough showing how to send and claim payments via magic links */
import { motion } from "framer-motion";
import { Send, Link2, Mail, Wallet } from "lucide-react";

const steps = [
  {
    icon: Send,
    num: "01",
    title: "Enter amount & token",
    desc: "Choose USDC, enter the amount, add an optional memo. USDT coming soon.",
  },
  {
    icon: Link2,
    num: "02",
    title: "Magic link is generated",
    desc: "Funds deposit into escrow. A unique claim link is created instantly.",
  },
  {
    icon: Mail,
    num: "03",
    title: "Share via any channel",
    desc: "Text, email, QR code, or social media — your recipient gets the link.",
  },
  {
    icon: Wallet,
    num: "04",
    title: "One-tap claim",
    desc: "Recipient signs in with email. Wallet auto-created. Funds claimed.",
  },
];

export default function HowItWorksSection() {
  return (
    <section className="border-y border-border py-20 sm:py-28">
      <div className="container mx-auto px-4">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          className="mx-auto max-w-2xl text-center"
        >
          <p className="text-xs font-semibold uppercase tracking-widest text-muted-foreground">How it works</p>
          <h2 className="mt-3 font-display text-2xl text-foreground sm:text-4xl md:text-5xl">
            Four steps. Under 60 seconds.
          </h2>
        </motion.div>

        <div className="mx-auto mt-14 max-w-4xl sm:mt-20">
          <div className="grid gap-0 sm:grid-cols-4">
            {steps.map((step, i) => {
              const Icon = step.icon;
              return (
                <motion.div
                  key={step.num}
                  initial={{ opacity: 0, y: 20 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true }}
                  transition={{ delay: i * 0.1 }}
                  className="relative flex flex-col items-center text-center px-4 py-6"
                >
                  {/* Connector line */}
                  {i < steps.length - 1 && (
                    <div className="absolute right-0 top-[3.5rem] hidden h-px w-full bg-border sm:block" style={{ left: "50%" }} />
                  )}

                  <div className="relative z-10 mb-4 flex h-14 w-14 items-center justify-center rounded-2xl border border-border bg-card">
                    <motion.div
                      animate={{ y: [0, -3, 0] }}
                      transition={{ duration: 2.5, repeat: Infinity, delay: i * 0.3 }}
                    >
                      <Icon className="h-6 w-6 text-muted-foreground" strokeWidth={1.5} />
                    </motion.div>
                  </div>
                  <span className="mb-2 text-[10px] font-semibold uppercase tracking-widest text-muted-foreground/50">{step.num}</span>
                  <h4 className="text-sm font-semibold text-foreground">{step.title}</h4>
                  <p className="mt-1.5 text-xs leading-relaxed text-muted-foreground">{step.desc}</p>
                </motion.div>
              );
            })}
          </div>
        </div>
      </div>
    </section>
  );
}
