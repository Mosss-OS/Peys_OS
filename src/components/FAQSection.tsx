import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Plus, Minus } from "lucide-react";

const faqs = [
  {
    q: "What is Peys?",
    a: "Peys is a peer-to-peer stablecoin payments app built on Base (Ethereum L2). Send USDC to anyone via a shareable link — no wallet or crypto knowledge required. USDT support coming soon.",
  },
  {
    q: "How do Magic Claim Links work?",
    a: "When you send a payment, funds deposit into a secure escrow smart contract and a unique link is generated. The recipient clicks the link, signs in with their email, and claims the funds to an auto-created wallet.",
  },
  {
    q: "Does the recipient need a wallet?",
    a: "No. When the recipient clicks the claim link and signs in via email or Google, an embedded wallet is automatically created for them.",
  },
  {
    q: "What if the recipient doesn't claim?",
    a: "Unclaimed payments are automatically refunded to the sender after 7 days. Your funds are never at risk.",
  },
  {
    q: "Which stablecoins are supported?",
    a: "Peys supports USDC on Base Sepolia. USDT support coming soon.",
  },
  {
    q: "What are the fees?",
    a: "Transaction fees on Base are minimal — typically less than $0.01. Peys charges no additional fees.",
  },
];

export default function FAQSection() {
  const [openIndex, setOpenIndex] = useState<number | null>(null);

  return (
    <section className="border-t border-border py-20 sm:py-28">
      <div className="container mx-auto max-w-2xl px-4">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          className="text-center"
        >
          <p className="text-xs font-semibold uppercase tracking-widest text-muted-foreground">FAQ</p>
          <h2 className="mt-3 font-display text-2xl text-foreground sm:text-4xl">
            Common questions
          </h2>
        </motion.div>

        <div className="mt-10 sm:mt-14">
          {faqs.map((faq, i) => {
            const isOpen = openIndex === i;
            return (
              <motion.div
                key={i}
                initial={{ opacity: 0 }}
                whileInView={{ opacity: 1 }}
                viewport={{ once: true }}
                transition={{ delay: i * 0.03 }}
                className="border-b border-border"
              >
                <button
                  onClick={() => setOpenIndex(isOpen ? null : i)}
                  className="flex w-full items-center justify-between py-5 text-left"
                >
                  <span className="pr-4 text-sm font-medium text-foreground">{faq.q}</span>
                  <div className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full border border-border text-muted-foreground">
                    {isOpen ? <Minus className="h-3 w-3" /> : <Plus className="h-3 w-3" />}
                  </div>
                </button>
                <AnimatePresence>
                  {isOpen && (
                    <motion.div
                      initial={{ height: 0, opacity: 0 }}
                      animate={{ height: "auto", opacity: 1 }}
                      exit={{ height: 0, opacity: 0 }}
                      transition={{ duration: 0.2 }}
                    >
                      <p className="pb-5 pr-12 text-sm leading-relaxed text-muted-foreground">
                        {faq.a}
                      </p>
                    </motion.div>
                  )}
                </AnimatePresence>
              </motion.div>
            );
          })}
        </div>
      </div>
    </section>
  );
}
