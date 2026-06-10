/** SocialProofSection - Stats bar and testimonial cards displaying social proof metrics and user quotes */
import { motion } from "framer-motion";

const stats = [
  { value: "$2.4M+", label: "Test volume" },
  { value: "12K+", label: "Links generated" },
  { value: "<$0.01", label: "Avg. fee" },
  { value: "45+", label: "Countries" },
];

const testimonials = [
  {
    quote: "Peys made it effortless to send stablecoins to my family. They just clicked a link — no crypto headaches.",
    name: "Adaeze O.",
    role: "Freelancer, Lagos",
  },
  {
    quote: "We pay our remote contractors globally with Peys. The magic link flow means zero wallet onboarding.",
    name: "Kenji M.",
    role: "Founder, Tokyo",
  },
  {
    quote: "The escrow system gives me confidence. If they don't claim, I get my money back automatically.",
    name: "Sarah L.",
    role: "Nomad, Berlin",
  },
];

export default function SocialProofSection() {
  return (
    <section className="py-20 sm:py-28">
      <div className="container mx-auto px-4">
        {/* Stats - minimal horizontal */}
        <motion.div
          initial={{ opacity: 0 }}
          whileInView={{ opacity: 1 }}
          viewport={{ once: true }}
          className="mb-20 flex flex-wrap justify-center gap-8 sm:gap-16"
        >
          {stats.map((s, i) => (
            <motion.div
              key={s.label}
              initial={{ opacity: 0, y: 10 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: i * 0.1 }}
              className="text-center"
            >
              <p className="font-display text-3xl text-foreground sm:text-4xl">{s.value}</p>
              <p className="mt-1 text-xs text-muted-foreground">{s.label}</p>
            </motion.div>
          ))}
        </motion.div>

        {/* Testimonials - clean cards */}
        <div className="mx-auto max-w-4xl">
          <motion.p
            initial={{ opacity: 0 }}
            whileInView={{ opacity: 1 }}
            viewport={{ once: true }}
            className="mb-10 text-center text-xs font-semibold uppercase tracking-widest text-muted-foreground"
          >
            What people say
          </motion.p>

          <div className="grid gap-4 sm:gap-6 md:grid-cols-3">
            {testimonials.map((t, i) => (
              <motion.div
                key={t.name}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: i * 0.1 }}
                className="rounded-2xl border border-border bg-card p-6"
              >
                <p className="text-sm leading-relaxed text-muted-foreground">"{t.quote}"</p>
                <div className="mt-5 flex items-center gap-3">
                  <div className="flex h-8 w-8 items-center justify-center rounded-full bg-muted text-xs font-bold text-muted-foreground">
                    {t.name[0]}
                  </div>
                  <div>
                    <p className="text-sm font-medium text-foreground">{t.name}</p>
                    <p className="text-xs text-muted-foreground">{t.role}</p>
                  </div>
                </div>
              </motion.div>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}
