import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Send, Check, ArrowLeft, Loader2, Wallet, Mail, Calendar, RefreshCw } from "lucide-react";
import { Link, useParams } from "react-router-dom";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { v4 as uuidv4 } from "uuid";

const FREQUENCY_LABELS: Record<string, string> = {
  one_time: "One-time",
  weekly: "Weekly",
  biweekly: "Bi-weekly",
  monthly: "Monthly",
  quarterly: "Quarterly",
};

function getNextDate(frequency: string): Date {
  const next = new Date();
  switch (frequency) {
    case "weekly": next.setDate(next.getDate() + 7); break;
    case "biweekly": next.setDate(next.getDate() + 14); break;
    case "monthly": next.setMonth(next.getMonth() + 1); break;
    case "quarterly": next.setMonth(next.getMonth() + 3); break;
    default: next.setDate(next.getDate() + 30);
  }
  return next;
}

interface PaymentLinkData {
  id: string;
  title: string;
  description: string | null;
  amount: number | null;
  amount_type: string;
  min_amount: number | null;
  max_amount: number | null;
  token: string;
  slug: string;
  status: string;
  frequency: string;
  organization_id: string | null;
  organization_name?: string;
}

export default function MerchantPayPage() {
  const { slug } = useParams<{ slug: string }>();
  const [loading, setLoading] = useState(true);
  const [notFound, setNotFound] = useState(false);
  const [paymentLink, setPaymentLink] = useState<PaymentLinkData | null>(null);

  const [payerEmail, setPayerEmail] = useState("");
  const [amount, setAmount] = useState("");
  const [memo, setMemo] = useState("");
  const [step, setStep] = useState<"form" | "sending" | "done">("form");

  useEffect(() => {
    if (!slug) return;
    (async () => {
      setLoading(true);
      const { data, error } = await supabase
        .from("payment_links")
        .select("*, organizations(name)")
        .eq("slug", slug)
        .maybeSingle();

      if (error || !data || data.status !== "active") {
        setNotFound(true);
        setLoading(false);
        return;
      }

      setPaymentLink({
        id: data.id,
        title: data.title,
        description: data.description,
        amount: data.amount,
        amount_type: data.amount_type,
        min_amount: data.min_amount,
        max_amount: data.max_amount,
        token: data.token,
        slug: data.slug,
        status: data.status,
        frequency: data.frequency || "one_time",
        organization_id: data.organization_id,
        organization_name: (data as any).organizations?.name || undefined,
      });

      if (data.amount_type === "fixed" && data.amount) {
        setAmount((data.amount / 1000000).toString());
      }

      setLoading(false);
    })();
  }, [slug]);

  const merchantName = paymentLink?.organization_name || paymentLink?.title || "Merchant";
  const merchantInitial = merchantName.charAt(0).toUpperCase();
  const isRecurring = paymentLink?.frequency && paymentLink.frequency !== "one_time";
  const isCustomAmount = paymentLink?.amount_type === "custom";
  const actionLabel = isRecurring ? "Subscribe" : "Pay";

  const handlePay = async () => {
    if (!payerEmail || !payerEmail.includes("@")) {
      toast.error("Please enter a valid email");
      return;
    }
    if (!amount || Number(amount) <= 0) {
      toast.error("Please enter a valid amount");
      return;
    }

    setStep("sending");

    try {
      const newClaimId = uuidv4();
      const claimSecret = uuidv4();
      const paymentId = `peys_${newClaimId.replace(/-/g, "").slice(0, 16)}`;
      const appUrl = import.meta.env.VITE_APP_URL || window.location.origin;
      const expiresAt = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString();

      const { error: paymentError } = await supabase.from("payments").insert({
        payment_id: paymentId,
        sender_email: payerEmail,
        recipient_email: payerEmail,
        amount: Number(amount),
        token: paymentLink?.token || "USDC",
        memo: memo || null,
        claim_secret: claimSecret,
        claim_link: newClaimId,
        status: "pending",
        expires_at: expiresAt,
      });

      if (paymentError) throw paymentError;

      if (paymentLink) {
        await supabase
          .from("payment_links")
          .update({ use_count: (paymentLink.use_count || 0) + 1 })
          .eq("id", paymentLink.id);
      }

      if (isRecurring && paymentLink) {
        const nextPayment = getNextDate(paymentLink.frequency);
        await supabase.from("user_subscriptions").insert({
          payment_link_id: paymentLink.id,
          payer_email: payerEmail,
          amount: Number(amount),
          token: paymentLink.token || "USDC",
          frequency: paymentLink.frequency,
          next_payment_date: nextPayment.toISOString(),
          memo: memo || null,
        });
      }

      setStep("done");
      toast.success(isRecurring ? "Subscription created!" : "Payment initiated!");
    } catch (err: unknown) {
      console.error("Payment failed:", err);
      toast.error(err instanceof Error ? err.message : "Payment failed");
      setStep("form");
    }
  };

  if (loading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-background">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  if (notFound || !paymentLink) {
    return (
      <div className="min-h-screen bg-background">
        <div className="container mx-auto px-4 py-12">
          <Link to="/" className="mb-8 inline-flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground transition-colors">
            <ArrowLeft className="h-4 w-4" /> Back to Peys
          </Link>
          <div className="mx-auto max-w-md text-center py-20">
            <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-muted">
              <Wallet className="h-8 w-8 text-muted-foreground" />
            </div>
            <h1 className="mb-2 font-display text-xl text-foreground">Payment link not found</h1>
            <p className="text-sm text-muted-foreground">This payment link may be expired or invalid.</p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-b from-background to-secondary/20">
      <div className="container mx-auto max-w-lg px-4 py-12">
        <Link to="/" className="mb-6 inline-flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground transition-colors">
          <ArrowLeft className="h-4 w-4" /> Back to Peys
        </Link>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="overflow-hidden rounded-2xl border border-border bg-card shadow-card"
        >
          {/* Merchant Header */}
          <div className="bg-gradient-to-r from-primary/10 via-primary/5 to-transparent p-6 sm:p-8">
            <div className="flex items-center gap-4">
              <div className="flex h-16 w-16 items-center justify-center rounded-full bg-primary text-2xl font-bold text-primary-foreground shadow-glow">
                {merchantInitial}
              </div>
              <div className="flex-1">
                <h1 className="font-display text-xl text-foreground sm:text-2xl">{merchantName}</h1>
                {paymentLink.description && (
                  <p className="mt-1 text-sm text-muted-foreground">{paymentLink.description}</p>
                )}
                {isRecurring && (
                  <span className="mt-2 inline-flex items-center gap-1.5 rounded-full bg-primary/10 px-3 py-1 text-xs font-medium text-primary">
                    <RefreshCw className="h-3 w-3" />
                    {FREQUENCY_LABELS[paymentLink.frequency]}
                  </span>
                )}
              </div>
            </div>
          </div>

          <div className="p-6 sm:p-8">
            <AnimatePresence mode="wait">
              {step === "form" && (
                <motion.div key="form" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="space-y-5">
                  {/* Amount */}
                  <div>
                    <label className="mb-2 block text-xs font-medium text-muted-foreground">Amount</label>
                    <div className="relative">
                      <span className="absolute left-4 top-1/2 -translate-y-1/2 text-lg font-semibold text-muted-foreground">$</span>
                      <input
                        type="number"
                        value={amount}
                        onChange={(e) => setAmount(e.target.value)}
                        placeholder={isCustomAmount ? "Enter amount" : "Fixed amount"}
                        disabled={!isCustomAmount}
                        className="w-full rounded-xl border border-border bg-background py-3.5 pl-8 pr-4 text-2xl font-bold text-foreground placeholder:text-muted-foreground/30 focus:outline-none focus:ring-2 focus:ring-ring disabled:opacity-60"
                      />
                    </div>
                    <p className="mt-1 text-xs text-muted-foreground">{paymentLink.token}</p>
                  </div>

                  {/* Your Email */}
                  <div>
                    <label className="mb-2 block text-xs font-medium text-muted-foreground">Your Email</label>
                    <div className="relative">
                      <Mail className="absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                      <input
                        type="email"
                        value={payerEmail}
                        onChange={(e) => setPayerEmail(e.target.value)}
                        placeholder="your@email.com"
                        className="w-full rounded-xl border border-border bg-background py-3.5 pl-10 pr-4 text-sm text-foreground placeholder:text-muted-foreground/50 focus:outline-none focus:ring-2 focus:ring-ring"
                      />
                    </div>
                  </div>

                  {/* Memo */}
                  <div>
                    <label className="mb-2 block text-xs font-medium text-muted-foreground">Note (optional)</label>
                    <input
                      value={memo}
                      onChange={(e) => setMemo(e.target.value)}
                      placeholder="What's this for?"
                      className="w-full rounded-xl border border-border bg-background px-4 py-3 text-sm text-foreground placeholder:text-muted-foreground/50 focus:outline-none focus:ring-2 focus:ring-ring"
                    />
                  </div>

                  {/* Action button */}
                  <button
                    onClick={handlePay}
                    disabled={!payerEmail || !amount || Number(amount) <= 0}
                    className="flex w-full items-center justify-center gap-2 rounded-xl bg-primary py-3.5 text-sm font-semibold text-primary-foreground shadow-glow hover:opacity-90 disabled:opacity-50 transition-opacity"
                  >
                    {isRecurring ? <RefreshCw className="h-4 w-4" /> : <Send className="h-4 w-4" />}
                    {actionLabel} {amount ? `$${Number(amount).toFixed(2)}` : ""}
                  </button>

                  <p className="text-center text-xs text-muted-foreground">
                    Secured by Peys {isRecurring ? "• You can cancel anytime" : "• No account needed"}
                  </p>
                </motion.div>
              )}

              {step === "sending" && (
                <motion.div key="sending" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="flex flex-col items-center gap-4 py-12">
                  <Loader2 className="h-8 w-8 animate-spin text-primary" />
                  <p className="text-sm text-muted-foreground">{isRecurring ? "Creating subscription..." : "Processing payment..."}</p>
                </motion.div>
              )}

              {step === "done" && (
                <motion.div key="done" initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} className="space-y-5 text-center py-4">
                  <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-full bg-green-500/10">
                    <Check className="h-7 w-7 text-green-500" />
                  </div>
                  <h2 className="font-display text-xl text-foreground">
                    {isRecurring ? "Subscribed! 🎉" : "Payment Submitted! 🎉"}
                  </h2>
                  <p className="text-sm text-muted-foreground">
                    {Number(amount).toFixed(2)} {paymentLink.token} {isRecurring ? "per " + FREQUENCY_LABELS[paymentLink.frequency].toLowerCase() : "to " + merchantName}
                  </p>
                  <div className="rounded-xl border border-border bg-secondary/50 p-4 text-left text-sm">
                    {isRecurring ? (
                      <p className="text-muted-foreground">
                        You're now subscribed to <strong className="text-foreground">{merchantName}</strong>. 
                        Your first payment of <strong className="text-foreground">${Number(amount).toFixed(2)} {paymentLink.token}</strong> will be processed soon.
                      </p>
                    ) : (
                      <p className="text-muted-foreground">
                        A claim link has been sent to <strong className="text-foreground">{payerEmail}</strong>. 
                        You'll need to use it to complete the payment.
                      </p>
                    )}
                  </div>
                  <Link
                    to="/"
                    className="inline-flex items-center gap-2 rounded-xl border border-border px-6 py-3 text-sm font-medium text-foreground hover:bg-secondary transition-colors"
                  >
                    Back to Peys
                  </Link>
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        </motion.div>
      </div>
    </div>
  );
}
