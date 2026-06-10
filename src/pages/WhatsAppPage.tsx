import { motion } from "framer-motion";
import { MessageCircle, Send, Wallet, Shield, Globe, ArrowRight, CheckCircle2 } from "lucide-react";
import { Link } from "react-router-dom";
import AppHeader from "@/components/AppHeader";
import Footer from "@/components/Footer";

const features = [
  {
    icon: Send,
    title: "Chat to Pay",
    description: "Simply message @Peys to send USDC to any phone number. No app switches or QR codes needed."
  },
  {
    icon: Wallet,
    title: "Instant Wallet",
    description: "Recipients get an auto-created wallet the first time they receive funds. Just verify with email."
  },
  {
    icon: Shield,
    title: "Secure & Encrypted",
    description: "All transactions are secured by audited smart contracts. Your funds are protected with PIN verification."
  },
  {
    icon: Globe,
    title: "Global Coverage",
    description: "Send money to anyone with WhatsApp anywhere in the world. Perfect for remittances and tips."
  }
];

const steps = [
  { num: "01", text: "Open WhatsApp and start a chat with @Peys" },
  { num: "02", text: "Enter the recipient's phone number and amount" },
  { num: "03", text: "Confirm with your PIN — funds arrive instantly" }
];

const commands = [
  { cmd: "send <amount> <phone>", desc: "Send USDC to a phone number" },
  { cmd: "balance", desc: "Check your wallet balance" },
  { cmd: "history", desc: "View recent transactions" },
  { cmd: "receive", desc: "Get your payment link" },
  { cmd: "help", desc: "Show all commands" },
];

export default function WhatsAppPage() {
  return (
    <div className="min-h-screen bg-background">
      <AppHeader />
      
      <main>
        <section className="relative overflow-hidden pt-24 pb-20 sm:pt-32 sm:pb-24">
          <div className="absolute inset-0 bg-gradient-to-b from-primary/5 to-transparent" />
          <div className="container relative mx-auto max-w-6xl px-4 lg:px-8">
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              className="mx-auto max-w-4xl text-center"
            >
              <div className="mb-4 inline-flex items-center gap-2 rounded-full border border-border bg-secondary/50 px-4 py-1.5 text-sm">
                <MessageCircle className="h-4 w-4 text-primary" />
                <span className="text-muted-foreground">New Feature</span>
              </div>
              <h1 className="font-display text-4xl text-foreground sm:text-5xl md:text-6xl">
                Pay anyone.<br />Right from WhatsApp.
              </h1>
              <p className="mt-6 text-lg text-muted-foreground sm:text-xl">
                Send USDC instantly to any phone number. No apps, no exchanges, no hassle — just chat and money moves.
              </p>
              <div className="mt-8 flex flex-col items-center justify-center gap-4 sm:flex-row">
                <Link
                  to="/send"
                  className="inline-flex items-center gap-2 rounded-lg bg-primary px-6 py-3 font-semibold text-primary-foreground shadow-glow transition-opacity hover:opacity-90"
                >
                  Get Started <ArrowRight className="h-4 w-4" />
                </Link>
                <a
                  href="https://wa.me/1234567890"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-2 rounded-lg border border-border bg-card px-6 py-3 font-semibold text-foreground transition-colors hover:bg-secondary"
                >
                  <MessageCircle className="h-4 w-4" />
                  Open in WhatsApp
                </a>
              </div>
            </motion.div>

            <motion.div
              initial={{ opacity: 0, y: 40 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.2 }}
              className="mt-16 lg:mt-24 mx-auto max-w-3xl rounded-2xl border border-border bg-card p-6 sm:p-8"
            >
              <div className="rounded-xl bg-secondary/30 p-4 font-mono text-sm text-muted-foreground">
                <span className="text-primary">@Peys</span>: Hi! How can I help you send money today?<br /><br />
                <span className="text-foreground">You</span>: Send 25 USDC to +1 555-123-4567<br /><br />
                <span className="text-primary">@Peys</span>: Sending 25 USDC to +1 555-123-4567.<br />
                Enter your PIN to confirm.<br /><br />
                <span className="text-foreground">You</span>: ****<br /><br />
                <span className="text-primary">@Peys</span>: ✅ Sent! 25 USDC to +1 555-123-4567.<br />
                Transaction: 0x3f2a...8b1c
              </div>
            </motion.div>

            <motion.div
              initial={{ opacity: 0, y: 40 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.3 }}
              className="mt-8 mx-auto max-w-2xl"
            >
              <h3 className="text-lg font-semibold text-foreground mb-4 text-center">Available Commands</h3>
              <div className="grid gap-2">
                {commands.map((cmd) => (
                  <div key={cmd.cmd} className="flex items-center justify-between rounded-lg bg-secondary/30 px-4 py-2">
                    <code className="text-sm font-mono text-primary">{cmd.cmd}</code>
                    <span className="text-xs text-muted-foreground">{cmd.desc}</span>
                  </div>
                ))}
              </div>
            </motion.div>
          </div>
        </section>

        <section className="border-y border-border py-20 lg:py-24">
          <div className="container mx-auto max-w-5xl px-4 lg:px-8">
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              className="mx-auto max-w-2xl text-center"
            >
              <h2 className="font-display text-3xl text-foreground sm:text-4xl">
                How it works
              </h2>
              <p className="mt-4 text-muted-foreground">
                Three simple steps to send money via WhatsApp
              </p>
            </motion.div>

            <div className="mt-12 lg:mt-16 mx-auto grid max-w-4xl gap-6 lg:gap-8">
              {steps.map((step, i) => (
                <motion.div
                  key={step.num}
                  initial={{ opacity: 0, x: -20 }}
                  whileInView={{ opacity: 1, x: 0 }}
                  viewport={{ once: true }}
                  transition={{ delay: i * 0.1 }}
                  className="flex items-center gap-6 lg:gap-8 rounded-xl border border-border bg-card p-6 lg:p-8"
                >
                  <span className="font-mono text-2xl font-bold text-primary">{step.num}</span>
                  <p className="text-foreground">{step.text}</p>
                </motion.div>
              ))}
            </div>
          </div>
        </section>

        <section className="py-20 lg:py-24">
          <div className="container mx-auto max-w-5xl px-4 lg:px-8">
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              className="mx-auto max-w-2xl text-center"
            >
              <h2 className="font-display text-3xl text-foreground sm:text-4xl">
                Why use WhatsApp Payments?
              </h2>
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

        <section className="border-t border-border bg-secondary/30 py-16 lg:py-20">
          <div className="container mx-auto max-w-5xl px-4 lg:px-8 text-center">
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              className="mx-auto max-w-2xl"
            >
              <h2 className="font-display text-3xl text-foreground sm:text-4xl">
                Ready to try it?
              </h2>
              <p className="mt-4 text-muted-foreground">
                Start sending money through WhatsApp in seconds. No sign-up required for recipients.
              </p>
              <div className="mt-8 lg:mt-10 flex flex-col items-center justify-center gap-4 sm:flex-row">
                <Link
                  to="/send"
                  className="inline-flex items-center gap-2 rounded-lg bg-primary px-6 py-3 font-semibold text-primary-foreground shadow-glow transition-opacity hover:opacity-90"
                >
                  Send Your First Payment <ArrowRight className="h-4 w-4" />
                </Link>
              </div>
            </motion.div>
          </div>
        </section>
      </main>

      <Footer />
    </div>
  );
}
