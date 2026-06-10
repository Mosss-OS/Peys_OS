/** CTASection - Final call-to-action section directing users to Personal or Business account signup */
import { Link } from "react-router-dom";
import { ArrowRight, User, Building2 } from "lucide-react";
import { motion } from "framer-motion";

export default function CTASection() {
  return (
    <section className="border-t border-border py-20 sm:py-28">
      <div className="container mx-auto px-4 text-center">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
        >
          <h2 className="font-display text-3xl text-foreground sm:text-5xl md:text-6xl">
            Ready to move money?
          </h2>
          <p className="mx-auto mt-4 max-w-md text-sm text-muted-foreground sm:text-base">
            Whether you're an individual or running a business — get started in seconds.
          </p>
          <div className="mt-8 flex flex-col items-center gap-3 sm:flex-row sm:justify-center">
            <Link
              to="/send"
              className="group inline-flex w-full items-center justify-center gap-2 rounded-full bg-foreground px-8 py-3.5 text-sm font-semibold text-background transition-all hover:opacity-90 sm:w-auto"
            >
              <User className="h-4 w-4" />
              Personal Account
              <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-0.5" />
            </Link>
            <Link
              to="/batch"
              className="group inline-flex w-full items-center justify-center gap-2 rounded-full border border-border px-8 py-3.5 text-sm font-medium text-foreground transition-colors hover:bg-secondary sm:w-auto"
            >
              <Building2 className="h-4 w-4" />
              Business Account
            </Link>
          </div>
        </motion.div>
      </div>
    </section>
  );
}
