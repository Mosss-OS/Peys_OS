import { useState, useEffect, useCallback } from "react";
import { useParams, Link } from "react-router-dom";
import { motion } from "framer-motion";
import { Check, Clock, AlertCircle, Loader2, ArrowRight, Gift, LogOut, Mail } from "lucide-react";
import AppHeader from "@/components/AppHeader";
import Footer from "@/components/Footer";
import { useApp } from "@/contexts/AppContext";
import { usePrivyAuth } from "@/contexts/PrivyContext";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { fireBurst } from "@/utils/confetti";
import { useEscrow, getChainConfig } from "@/hooks/useEscrow";
import { useGaslessClaim } from "@/hooks/useGaslessClaim";
import { useAccount } from "wagmi";
import { sanitizeString } from "@/utils/sanitize";

interface PaymentData {
  id: string;
  payment_id: string;
  sender_email: string;
  recipient_email: string;
  amount: number;
  token: string;
  memo: string | null;
  status: string;
  expires_at: string;
  created_at: string;
  blockchain_payment_id?: string;
  claim_secret?: string;
  chain_id?: number;
}

export default function ClaimPage() {
  const { id } = useParams<{ id: string }>();
  const { isLoggedIn, login, logout } = useApp();
  const { user: privyUser, loginWithEmailOnly } = usePrivyAuth();
  const [payment, setPayment] = useState<PaymentData | null>(null);
  const [loading, setLoading] = useState(true);
  const [claiming, setClaiming] = useState(false);
  const [claimed, setClaimed] = useState(false);
  const [error, setError] = useState("");
  const [userEmail, setUserEmail] = useState<string | null>(null);
  const [existingUser, setExistingUser] = useState<boolean | null>(null);
  const [loginError, setLoginError] = useState<string | null>(null);
  const [verifiedEmail, setVerifiedEmail] = useState<string | null>(null);

  const { claimGaslessly } = useGaslessClaim();

  const fetchPayment = useCallback(async () => {
    if (!id) {
      setError("Invalid claim link");
      setLoading(false);
      return;
    }

    const { data, error: fetchErr } = await supabase
      .from("payments")
      .select("*")
      .eq("claim_link", id)
      .single();

    if (fetchErr || !data) {
      setError("Payment not found. The link may be invalid or expired.");
      setLoading(false);
      return;
    }

    setPayment(data as PaymentData);
    
    // Check if recipient email already exists in profiles
    const { data: profile } = await supabase
      .from("profiles")
      .select("id, email")
      .eq("email", (data as PaymentData).recipient_email)
      .single();
    
    setExistingUser(!!profile);
    setUserEmail((data as PaymentData).recipient_email);
    setLoading(false);
  }, [id]);

  useEffect(() => {
    fetchPayment();
  }, [fetchPayment]);
  
  const { claimPayment, getPayment, switchNetwork } = useEscrow();

  // Check if logged in user's email matches payment email
  const isEmailMatching = privyUser?.email?.toLowerCase() === payment?.recipient_email?.toLowerCase();
  const isReadyToClaim = isLoggedIn && isEmailMatching && !claimed && !claiming;

  // Handle claim when user becomes ready
  useEffect(() => {
    if (isReadyToClaim) {
      handleClaim();
    }
  }, [isReadyToClaim]);

  const handleLoginAndClaim = async () => {
    setLoginError(null);
    
    if (isLoggedIn) {
      // Already logged in - verify email
      if (privyUser?.email?.toLowerCase() !== payment?.recipient_email?.toLowerCase()) {
        setLoginError(`This payment was sent to ${payment?.recipient_email}. Please sign out and sign in with that email.`);
        return;
      }
      // Email matches - proceed to claim
      await handleClaim();
      return;
    }
    
    // Not logged in - prompt to login via Privy (email only, pre-filled)
    loginWithEmailOnly(payment?.recipient_email);
  };

  const handleSignOutAndClaim = async () => {
    await logout();
    setLoginError(null);
    loginWithEmailOnly(payment?.recipient_email); // Prompt to sign in with correct email
  };
  
  const handleClaim = async () => {
    if (!payment) return;

    // Check if user is logged in via Privy - use Privy user directly
    if (!privyUser) {
      toast.error("Please sign in to claim");
      return;
    }

    // Verify the logged-in user's email matches the payment recipient
    const userEmail = privyUser.email?.toLowerCase();
    const paymentEmail = payment.recipient_email.toLowerCase();
    
    if (userEmail !== paymentEmail) {
      toast.error(`Please sign in with ${payment.recipient_email} to claim this payment`);
      setLoginError(`This payment was sent to ${payment.recipient_email}. Please sign in with that email.`);
      return;
    }

    setClaiming(true);
    try {
      console.log("Claiming payment...");

      if (!payment.blockchain_payment_id) {
        throw new Error("Payment not found on blockchain - no blockchain_payment_id");
      }

      // Switch to the chain the payment was created on
      if (payment.chain_id) {
        try {
          await switchNetwork(payment.chain_id);
        } catch (switchErr) {
          throw new Error(`Please switch your wallet to the correct network (chain ID: ${payment.chain_id}) to claim this payment.`);
        }
      }

      const onChainPayment = await getPayment(payment.blockchain_payment_id as `0x${string}`);

      if (!onChainPayment) {
        throw new Error("Payment not found on blockchain. It may have been created on a different network.");
      }

      if (onChainPayment.status === 1) {
        throw new Error("This payment has already been claimed.");
      }

      if (onChainPayment.sender === '0x0000000000000000000000000000000000000000') {
        throw new Error("Payment not found on blockchain.");
      }

      const onChainId = parseInt(payment.blockchain_payment_id, 10);
      let txHash: string | undefined;

      try {
        const result = await claimGaslessly(onChainId, payment.claim_secret || "", payment.chain_id);
        txHash = result.transactionHash;
        console.log("Gasless claim successful, tx:", txHash);
      } catch (gaslessErr) {
        console.warn("Gasless claim failed, falling back to client-side claim:", gaslessErr);
        txHash = await claimPayment(payment.blockchain_payment_id as `0x${string}`, payment.claim_secret || "");
      }

      if (!txHash) throw new Error("Failed to claim transaction");

      console.log("Claim successful, tx:", txHash);

      // 2. Find user by email in profiles table
      const { data: profile } = await supabase
        .from("profiles")
        .select("id")
        .eq("email", payment.recipient_email)
        .single();
      
      const userId = profile?.id;

      // 3. Update database status
      const { error: updateErr } = await supabase
        .from("payments")
        .update({
          status: "claimed",
          claimed_by_user_id: userId,
          claimed_at: new Date().toISOString(),
        })
        .eq("id", payment.id)
        .eq("status", "pending");

      if (updateErr) throw updateErr;

      // Notify sender
      const { data: senderProfile } = await supabase
        .from("profiles")
        .select("user_id")
        .eq("email", payment.sender_email)
        .single();

      if (senderProfile) {
        await supabase.from("notifications").insert({
          user_id: senderProfile.user_id,
          type: "payment_claimed",
          title: `✅ Payment of ${payment.amount} ${payment.token} claimed!`,
          message: `${privyUser?.email || payment.recipient_email} claimed your payment of ${payment.amount} ${payment.token}.`,
          payment_id: payment.id,
        });
      }

      setClaimed(true);
      setVerifiedEmail(privyUser?.email || payment.recipient_email);
      fireBurst();
      toast.success("Payment claimed successfully! 🎉");
    } catch (err: unknown) {
      console.error("Claim failed:", err);
      const errorMessage = err instanceof Error ? err.message : "Failed to claim payment";
      
      // Provide more helpful error messages for blockchain issues
      if (errorMessage.includes("0x144354df") || errorMessage.includes("InvalidClaimHash")) {
        toast.error("Invalid claim. The claim link may be incorrect or the payment may be invalid.");
      } else if (errorMessage.includes("0xe4cb8f8c") || errorMessage.includes("PaymentNotFound")) {
        toast.error("Payment not found. The claim link may be incorrect or the payment may have expired.");
      } else if (errorMessage.includes("0x") || errorMessage.includes("reverted")) {
        toast.error("Transaction reverted. The payment may be invalid, already claimed, or expired.");
      } else if (errorMessage.includes("403") || errorMessage.includes("403 (Forbidden)")) {
        toast.error("Network error. Please check your connection and try again.");
      } else if (errorMessage.includes("429") || errorMessage.includes("Too Many Requests")) {
        toast.error("Rate limited. Please wait a moment and try again.");
      } else if (errorMessage.includes("timeout") || errorMessage.includes("TIMEOUT")) {
        toast.error("Connection timed out. Please check your internet and try again.");
      } else {
        toast.error(errorMessage);
      }
    } finally {
      setClaiming(false);
    }
  };

  const isExpired = payment ? new Date(payment.expires_at) < new Date() : false;
  const isAlreadyClaimed = payment?.status === "claimed";

  return (
    <div className="min-h-screen bg-background">
      <AppHeader />
      <div className="mx-auto max-w-md px-4 pt-20 pb-12 sm:pt-24 sm:pb-16">
        {loading ? (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="flex flex-col items-center gap-4 py-16">
            <Loader2 className="h-8 w-8 animate-spin text-primary" />
            <p className="text-sm text-muted-foreground">Loading payment...</p>
          </motion.div>
        ) : error ? (
          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}
            className="rounded-xl border border-border bg-card p-8 text-center shadow-card"
          >
            <AlertCircle className="mx-auto mb-4 h-12 w-12 text-destructive" />
            <h2 className="mb-2 font-display text-xl text-foreground">Payment Not Found</h2>
            <p className="mb-6 text-sm text-muted-foreground">{error}</p>
            <Link to="/" className="inline-flex rounded-lg bg-primary px-6 py-2.5 text-sm font-semibold text-primary-foreground transition-opacity hover:opacity-90">
              Go Home
            </Link>
          </motion.div>
        ) : claimed ? (
          <motion.div initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }}
            className="rounded-xl border border-border bg-card p-8 text-center shadow-card"
          >
            <div className="mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-full bg-primary/10">
              <Check className="h-7 w-7 text-primary" />
            </div>
            <h2 className="mb-2 font-display text-xl text-foreground">Payment Claimed! 🎉</h2>
            <p className="mb-1 text-sm text-muted-foreground">
              <span className="font-semibold text-foreground">{payment?.amount} {payment?.token}</span> has been added to your wallet.
            </p>
            <p className="mb-6 text-xs text-muted-foreground">From {verifiedEmail || payment?.sender_email}</p>
            <Link to="/dashboard" className="inline-flex items-center gap-2 rounded-lg bg-primary px-6 py-2.5 text-sm font-semibold text-primary-foreground transition-opacity hover:opacity-90">
              View Dashboard <ArrowRight className="h-4 w-4" />
            </Link>
          </motion.div>
        ) : (
          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}
            className="overflow-hidden rounded-xl border border-border bg-card shadow-card"
          >
            <div className="bg-gradient-to-br from-primary/5 to-primary/10 p-6 text-center sm:p-8">
              <div className="mx-auto mb-3 flex h-14 w-14 items-center justify-center rounded-full bg-primary/10">
                <Gift className="h-7 w-7 text-primary" />
              </div>
              <h2 className="font-display text-2xl text-foreground sm:text-3xl">
                You received money!
              </h2>
              <p className="mt-2 text-sm text-muted-foreground">
                {sanitizeString(payment?.sender_email || "", 100)} sent you a payment
              </p>
            </div>

            <div className="p-6 sm:p-8">
              <div className="mb-6 text-center">
                <p className="font-display text-4xl text-foreground">
                  ${payment?.amount.toLocaleString("en", { minimumFractionDigits: 2 })}
                </p>
                <p className="mt-1 text-sm text-muted-foreground">{payment?.token}</p>
              </div>

              {payment?.memo && (
                <div className="mb-6 rounded-lg border border-border bg-secondary/50 p-3 text-center">
                  <p className="text-sm text-muted-foreground">"{sanitizeString(payment.memo, 255)}"</p>
                </div>
              )}

              <div className="mb-6 space-y-2 text-sm">
                <div className="flex justify-between">
                  <span className="text-muted-foreground">From</span>
                  <span className="text-foreground">{sanitizeString(payment?.sender_email || "", 100)}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">To</span>
                  <span className="text-foreground">{sanitizeString(payment?.recipient_email || "", 100)}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Status</span>
                  <span className={`font-medium ${isExpired ? "text-destructive" : isAlreadyClaimed ? "text-primary" : "text-warning"}`}>
                    {isExpired ? "Expired" : isAlreadyClaimed ? "Claimed" : "Pending"}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Expires</span>
                  <span className="text-foreground">{new Date(payment?.expires_at || "").toLocaleDateString()}</span>
                </div>
              </div>

              {isExpired ? (
                <div className="rounded-lg bg-destructive/10 p-4 text-center">
                  <Clock className="mx-auto mb-2 h-6 w-6 text-destructive" />
                  <p className="text-sm font-medium text-destructive">This payment has expired</p>
                  <p className="mt-1 text-xs text-muted-foreground">The sender can reclaim these funds.</p>
                </div>
              ) : isAlreadyClaimed ? (
                <div className="rounded-lg bg-primary/10 p-4 text-center">
                  <Check className="mx-auto mb-2 h-6 w-6 text-primary" />
                  <p className="text-sm font-medium text-primary">Already claimed</p>
                </div>
              ) : (
                <div className="space-y-4">
                  {/* Email Verification Status */}
                  {isLoggedIn && (
                    <div className={`rounded-lg p-3 text-center ${isEmailMatching ? "bg-primary/10" : "bg-destructive/10"}`}>
                      <div className="flex items-center justify-center gap-2">
                        {isEmailMatching ? (
                          <>
                            <Check className="h-4 w-4 text-primary" />
                            <p className="text-sm text-primary">Signed in as {privyUser?.email}</p>
                          </>
                        ) : (
                          <>
                            <AlertCircle className="h-4 w-4 text-destructive" />
                            <p className="text-sm text-destructive">
                              Signed in as {privyUser?.email} (wrong email)
                            </p>
                          </>
                        )}
                      </div>
                    </div>
                  )}

                  {loginError && (
                    <div className="rounded-lg bg-destructive/10 p-3 text-center">
                      <p className="text-sm text-destructive">{loginError}</p>
                    </div>
                  )}

                  {existingUser === false && !isLoggedIn && (
                    <div className="rounded-lg bg-primary/10 p-3 text-center">
                      <p className="text-sm text-primary">New to Peys? Create an account to claim your {payment?.amount} {payment?.token}</p>
                    </div>
                  )}

                  {/* Claim Button */}
                  {isLoggedIn && !isEmailMatching ? (
                    <div className="space-y-2">
                      <button
                        onClick={handleSignOutAndClaim}
                        disabled={claiming}
                        className="flex w-full items-center justify-center gap-2 rounded-xl bg-destructive py-3.5 text-sm font-semibold text-white transition-opacity hover:opacity-90 disabled:opacity-50"
                      >
                        <LogOut className="h-4 w-4" />
                        Sign Out & Sign In with Correct Email
                      </button>
                      <p className="text-center text-xs text-muted-foreground">
                        Payment sent to: {payment?.recipient_email}
                      </p>
                    </div>
                  ) : (
                    <button
                      onClick={handleLoginAndClaim}
                      disabled={claiming || (isLoggedIn && !isEmailMatching)}
                      className="flex w-full items-center justify-center gap-2 rounded-xl bg-primary py-3.5 text-sm font-semibold text-primary-foreground shadow-glow transition-opacity hover:opacity-90 disabled:opacity-50"
                    >
                      {claiming ? (
                        <Loader2 className="h-4 w-4 animate-spin" />
                      ) : isLoggedIn && isEmailMatching ? (
                        <>
                          <ArrowRight className="h-4 w-4" />
                          Claim Now
                        </>
                      ) : (
                        <>
                          <Mail className="h-4 w-4" />
                          {existingUser ? "Sign In & Claim" : "Sign Up & Claim"}
                        </>
                      )}
                    </button>
                  )}

                  {/* Help text */}
                  {!isLoggedIn && (
                    <p className="text-center text-xs text-muted-foreground">
                      We'll verify your email before claiming. Payment will be sent to: <span className="font-medium">{payment?.recipient_email}</span>
                    </p>
                  )}
                </div>
              )}
            </div>
          </motion.div>
        )}
      </div>
      <Footer />
    </div>
  );
}
