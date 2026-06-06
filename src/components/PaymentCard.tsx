/**
 * PaymentCard - Visual card displaying payment details (amount, token,
 * memo, sender) with a branded claim CTA. Used in the success step
 * of SendPaymentForm and on the claim page.
 */
import { motion } from "framer-motion";
import { useTheme } from "@/contexts/ThemeContext";

interface PaymentCardProps {
  payment?: {
    id: string;
    amount: number;
    token: "USDC" | "USDT" | "PASS";
    recipient?: string;
    memo?: string;
    status?: string;
    created_at?: string;
    expires_at?: string;
  };
  sender?: string;
  amount?: number;
  token?: "USDC" | "USDT" | "PASS" | "G$";
  memo?: string;
  claimId?: string;
  link?: string;
  onClose?: () => void;
}

/**
 * PaymentCard - Renders a shareable payment card with Peys branding,
 * amount, optional memo, and a claim call-to-action.
 * @param props.payment - Full payment object (id, amount, token, etc.).
 * @param props.sender - Display name or address of the sender.
 * @param props.amount - Numeric amount (overrides payment.amount).
 * @param props.token - Token symbol (overrides payment.token).
 * @param props.memo - Optional note (overrides payment.memo).
 * @param props.claimId - Claim identifier for the link.
 * @param props.link - Full claim URL.
 * @param props.onClose - Callback to dismiss the card.
 */
export default function PaymentCard({ payment, sender, amount, token, memo, claimId, link, onClose }: PaymentCardProps) {
  const { theme } = useTheme();
  const pAmount = payment?.amount ?? amount ?? 0;
  const pToken = payment?.token ?? token ?? "USDC";
  const pMemo = payment?.memo ?? memo ?? "";
  const pClaimId = payment?.id ?? claimId ?? "";
  
  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.95 }}
      animate={{ opacity: 1, scale: 1 }}
      className="relative w-full max-w-sm overflow-hidden rounded-2xl border border-border bg-card shadow-elevated"
    >
      {/* Top gradient bar */}
      <div className="h-1.5 w-full bg-primary" />

      <div className="p-6 sm:p-8">
        {/* Logo */}
        <div className="flex items-center gap-2 mb-6">
          <img src={theme === "dark" ? "/peys_black_background.png" : "/peys_logo_alone.png"} alt="Peys" className="h-10 w-10 rounded-lg" />
          <span className="text-sm font-semibold text-foreground">Peys</span>
          <span className="ml-auto rounded-full bg-primary/10 px-2 py-0.5 text-xs font-medium text-primary">
            Payment Link
          </span>
        </div>

        {/* Amount */}
        <div className="text-center mb-6">
          <p className="text-sm text-muted-foreground">{sender || "Someone"} sent</p>
          <h2 className="mt-1 font-display text-4xl text-foreground sm:text-5xl">
            ${pAmount.toFixed(2)}
          </h2>
          <p className="mt-1 text-sm font-medium text-primary">{pToken}</p>
        </div>

        {/* Memo */}
        {pMemo && (
          <div className="mb-6 rounded-xl border border-border bg-secondary/50 p-3 text-center">
            <p className="text-sm text-foreground">"{pMemo}"</p>
          </div>
        )}

        {/* Claim CTA */}
        <div className="rounded-xl bg-primary p-4 text-center">
          <p className="text-sm font-semibold text-primary-foreground">Tap to claim your funds</p>
          <p className="mt-1 text-xs text-primary-foreground/70">peys.app/claim/{pClaimId}</p>
        </div>

        {/* Footer */}
        <div className="mt-4 flex items-center justify-between text-xs text-muted-foreground">
          <span>Secured by escrow</span>
            <span>Built on Base</span>
        </div>
      </div>
    </motion.div>
  );
}
