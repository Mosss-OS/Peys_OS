/** LimitsPage - Transaction limits management with tier-based limits, usage tracking, and increase requests */
import { useState } from "react";
import { motion } from "framer-motion";
import { Shield, AlertTriangle, TrendingUp, DollarSign, Calendar, Clock, ChevronRight, Loader2, Check, ArrowUp, ArrowDown, Lock, Unlock, CreditCard } from "lucide-react";
import { useApp } from "@/contexts/AppContext";
import AppHeader from "@/components/AppHeader";
import Footer from "@/components/Footer";
import { toast } from "sonner";

interface LimitTier {
  id: string;
  name: string;
  daily: number;
  weekly: number;
  monthly: number;
  features: string[];
  color: string;
}

/** LimitsPage component - Displays current usage, available tiers, and handles limit increase requests */
export default function LimitsPage() {
  const { isLoggedIn, login } = useApp();
  const [period, setPeriod] = useState<"daily" | "weekly" | "monthly">("monthly");
  const [showIncreaseForm, setShowIncreaseForm] = useState(false);
  const [increaseReason, setIncreaseReason] = useState("");
  const [submitting, setSubmitting] = useState(false);

  const tiers: LimitTier[] = [
    {
      id: "basic",
      name: "Basic",
      daily: 100,
      weekly: 500,
      monthly: 1000,
      features: ["Email verified"],
      color: "gray",
    },
    {
      id: "standard",
      name: "Standard",
      daily: 1000,
      weekly: 5000,
      monthly: 25000,
      features: ["ID verified", "Phone verified"],
      color: "blue",
    },
    {
      id: "premium",
      name: "Premium",
      daily: 10000,
      weekly: 50000,
      monthly: 250000,
      features: ["Full KYC", "Address verified", "Income verified"],
      color: "purple",
    },
    {
      id: "unlimited",
      name: "Unlimited",
      daily: 1000000,
      weekly: 5000000,
      monthly: 999999999,
      features: ["Enterprise", "Custom limits", "API access"],
      color: "gold",
    },
  ];

  const currentUsage = {
    daily: { used: 450, limit: 1000 },
    weekly: { used: 2100, limit: 5000 },
    monthly: { used: 8500, limit: 25000 },
  };

  const usageHistory = [
    { period: "March 2026", daily: 8500, weekly: 2100, monthly: 8500, limit: 25000 },
    { period: "February 2026", daily: 7200, weekly: 1800, monthly: 7200, limit: 25000 },
    { period: "January 2026", daily: 9800, weekly: 2400, monthly: 9800, limit: 10000 },
    { period: "December 2025", daily: 5500, weekly: 1500, monthly: 5500, limit: 10000 },
  ];

  const currentTier = tiers[1];
  const usage = currentUsage[period];
  const usagePercent = (usage.used / usage.limit) * 100;

  const handleIncreaseRequest = async () => {
    if (!increaseReason) {
      toast.error("Please provide a reason for your limit increase request");
      return;
    }
    setSubmitting(true);
    setSubmitting(false);
    setShowIncreaseForm(false);
    setIncreaseReason("");
    toast.success("Limit increase request submitted! We'll review within 24-48 hours.");
  };

  if (!isLoggedIn) {
    return (
      <div className="min-h-screen bg-background">
        <AppHeader />
        <div className="flex min-h-[80vh] flex-col items-center justify-center px-4 text-center">
          <div className="mb-6 flex h-20 w-20 items-center justify-center rounded-full bg-primary/10">
            <Shield className="h-10 w-10 text-primary" />
          </div>
          <h2 className="mb-3 font-display text-2xl text-foreground sm:text-3xl">Transaction Limits</h2>
          <p className="mb-6 max-w-md text-sm text-muted-foreground">
            View and manage your transaction limits. Upgrade your verification tier to increase limits.
          </p>
          <button onClick={login} className="rounded-lg bg-primary px-6 py-3 font-semibold text-primary-foreground shadow-glow hover:opacity-90">
            Sign In to View Limits
          </button>
        </div>
        <Footer />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      <AppHeader />
      <div className="container mx-auto max-w-4xl px-4 pt-20 pb-12 sm:pt-24 sm:pb-16">
        <div className="mb-8">
          <h1 className="font-display text-2xl text-foreground sm:text-3xl">Transaction Limits</h1>
          <p className="mt-1 text-sm text-muted-foreground">View and manage your daily, weekly, and monthly limits</p>
        </div>

        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          className="mb-6 rounded-xl border border-border bg-card p-6"
        >
          <div className="mb-4 flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className={`flex h-10 w-10 items-center justify-center rounded-lg bg-${currentTier.color}-500/10`}>
                <CreditCard className={`h-5 w-5 text-${currentTier.color}-500`} />
              </div>
              <div>
                <h2 className="font-semibold text-foreground">Current Tier: {currentTier.name}</h2>
                <p className="text-sm text-muted-foreground">ID Verified</p>
              </div>
            </div>
            <span className={`rounded-full bg-${currentTier.color}-500/10 px-3 py-1 text-sm font-medium text-${currentTier.color}-500`}>
              Active
            </span>
          </div>

          <div className="mb-4 flex gap-2">
            {(["daily", "weekly", "monthly"] as const).map((p) => (
              <button
                key={p}
                onClick={() => setPeriod(p)}
                className={`flex-1 rounded-lg px-3 py-2 text-sm font-medium transition-colors ${
                  period === p
                    ? "bg-primary text-primary-foreground"
                    : "bg-secondary text-muted-foreground hover:bg-secondary/80"
                }`}
              >
                {p.charAt(0).toUpperCase() + p.slice(1)}
              </button>
            ))}
          </div>

          <div className="mb-4 flex items-center justify-between">
            <span className="text-muted-foreground">
              {usage.used.toLocaleString()} / {usage.limit.toLocaleString()} USDC
            </span>
            <span className={`font-medium ${
              usagePercent >= 90 ? "text-red-500" :
              usagePercent >= 75 ? "text-yellow-500" :
              "text-green-500"
            }`}>
              {usagePercent.toFixed(0)}% used
            </span>
          </div>

          <div className="h-3 w-full rounded-full bg-secondary">
            <div
              className={`h-3 rounded-full transition-all ${
                usagePercent >= 90 ? "bg-red-500" :
                usagePercent >= 75 ? "bg-yellow-500" :
                "bg-primary"
              }`}
              style={{ width: `${Math.min(usagePercent, 100)}%` }}
            />
          </div>

          {usagePercent >= 80 && (
            <div className="mt-4 flex items-center gap-2 rounded-lg border border-yellow-500/20 bg-yellow-500/5 p-3">
              <AlertTriangle className="h-5 w-5 text-yellow-500" />
              <p className="text-sm text-muted-foreground">
                You're approaching your {period} limit. Consider upgrading your tier.
              </p>
            </div>
          )}
        </motion.div>

        <div className="mb-6 grid gap-4 md:grid-cols-3">
          {tiers.map((tier, i) => {
            const isCurrentTier = tier.id === currentTier.id;
            const isNextTier = tiers[i - 1]?.id === currentTier.id;
            const isUnlocked = i <= tiers.findIndex(t => t.id === currentTier.id);
            
            return (
              <motion.div
                key={tier.id}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: i * 0.05 }}
                className={`rounded-xl border p-5 ${
                  isCurrentTier ? "border-primary bg-primary/5" :
                  isUnlocked ? "border-green-500/30" :
                  "border-border"
                }`}
              >
                <div className="mb-4 flex items-center justify-between">
                  <h3 className="font-semibold text-foreground">{tier.name}</h3>
                  {isCurrentTier && (
                    <span className="rounded-full bg-primary px-2 py-0.5 text-xs font-medium text-primary-foreground">
                      Current
                    </span>
                  )}
                </div>
                
                <div className="space-y-2 text-sm">
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Daily</span>
                    <span className="font-medium">
                      {tier.daily >= 1000000 ? "Unlimited" : `$${tier.daily.toLocaleString()}`}
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Weekly</span>
                    <span className="font-medium">
                      {tier.weekly >= 1000000 ? "Unlimited" : `$${tier.weekly.toLocaleString()}`}
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Monthly</span>
                    <span className="font-medium">
                      {tier.monthly >= 999999 ? "Unlimited" : `$${tier.monthly.toLocaleString()}`}
                    </span>
                  </div>
                </div>

                <ul className="mt-4 space-y-1 border-t border-border pt-4">
                  {tier.features.map((feature) => (
                    <li key={feature} className="flex items-center gap-2 text-xs text-muted-foreground">
                      <Check className="h-3 w-3 text-green-500" />
                      {feature}
                    </li>
                  ))}
                </ul>

                {!isCurrentTier && isUnlocked && (
                  <button className="mt-4 w-full rounded-lg border border-border px-3 py-2 text-sm font-medium hover:bg-secondary">
                    Switch to {tier.name}
                  </button>
                )}
                {!isCurrentTier && !isUnlocked && isNextTier && (
                  <button
                    onClick={() => setShowIncreaseForm(true)}
                    className="mt-4 w-full rounded-lg bg-primary px-3 py-2 text-sm font-semibold text-primary-foreground hover:opacity-90"
                  >
                    Upgrade
                  </button>
                )}
                {!isCurrentTier && !isUnlocked && !isNextTier && (
                  <div className="mt-4 flex items-center justify-center gap-1 text-xs text-muted-foreground">
                    <Lock className="h-3 w-3" />
                    Upgrade to unlock
                  </div>
                )}
              </motion.div>
            );
          })}
        </div>

        {showIncreaseForm && (
          <motion.div
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            className="mb-6 rounded-xl border border-border bg-card p-6"
          >
            <h3 className="mb-4 font-semibold text-foreground">Request Limit Increase</h3>
            <div className="mb-4">
              <label className="mb-2 block text-sm font-medium text-muted-foreground">Reason for increase</label>
              <textarea
                value={increaseReason}
                onChange={(e) => setIncreaseReason(e.target.value)}
                placeholder="Please explain why you need higher limits..."
                rows={4}
                className="w-full rounded-lg border border-border bg-background px-4 py-3 text-sm text-foreground placeholder:text-muted-foreground focus:border-primary focus:outline-none"
              />
            </div>
            <div className="flex gap-3">
              <button
                onClick={() => setShowIncreaseForm(false)}
                className="flex-1 rounded-lg border border-border px-4 py-2.5 font-medium hover:bg-secondary"
              >
                Cancel
              </button>
              <button
                onClick={handleIncreaseRequest}
                disabled={submitting}
                className="flex-1 rounded-lg bg-primary px-4 py-2.5 font-semibold text-primary-foreground hover:opacity-90 disabled:opacity-50"
              >
                {submitting ? <Loader2 className="mx-auto h-5 w-5 animate-spin" /> : "Submit Request"}
              </button>
            </div>
          </motion.div>
        )}

        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3 }}
          className="rounded-xl border border-border bg-card p-6"
        >
          <h2 className="mb-4 flex items-center gap-2 text-lg font-semibold text-foreground">
            <Clock className="h-5 w-5 text-primary" />
            Usage History
          </h2>
          <div className="space-y-3">
            {usageHistory.map((item) => {
              const percent = (item.monthly / item.limit) * 100;
              return (
                <div key={item.period} className="flex items-center justify-between rounded-lg border border-border p-4">
                  <div className="flex-1">
                    <p className="font-medium text-foreground">{item.period}</p>
                    <div className="mt-1 h-2 w-full rounded-full bg-secondary sm:w-48">
                      <div
                        className={`h-2 rounded-full ${
                          percent >= 90 ? "bg-red-500" :
                          percent >= 75 ? "bg-yellow-500" :
                          "bg-primary"
                        }`}
                        style={{ width: `${Math.min(percent, 100)}%` }}
                      />
                    </div>
                  </div>
                  <div className="ml-4 text-right">
                    <p className="font-medium text-foreground">
                      ${item.monthly.toLocaleString()}
                    </p>
                    <p className="text-xs text-muted-foreground">
                      of ${item.limit.toLocaleString()}
                    </p>
                  </div>
                </div>
              );
            })}
          </div>
        </motion.div>
      </div>
      <Footer />
    </div>
  );
}
