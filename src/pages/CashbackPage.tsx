import { useState, useEffect, useMemo } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Gift, TrendingUp, History, PiggyBank, Trophy, Star, ArrowUpRight, Loader2, ChevronRight, RefreshCw } from "lucide-react";
import { Link } from "react-router-dom";
import { useApp } from "@/contexts/AppContext";
import AppHeader from "@/components/AppHeader";
import Footer from "@/components/Footer";
import { toast } from "sonner";

interface CashbackRecord {
  id: string;
  amount: number;
  description: string;
  source: string;
  type: "earned" | "redeemed";
  date: string;
}

interface CashbackTier {
  name: string;
  rate: number;
  minBalance: number;
  color: string;
  benefits: string[];
}

const TIERS: CashbackTier[] = [
  { name: "Bronze", rate: 0.5, minBalance: 0, color: "#CD7F32", benefits: ["Basic rewards"] },
  { name: "Silver", rate: 1.0, minBalance: 100, color: "#C0C0C0", benefits: ["1% cashback", "Priority support"] },
  { name: "Gold", rate: 1.5, minBalance: 500, color: "#FFD700", benefits: ["1.5% cashback", "Priority support", "Early access"] },
  { name: "Platinum", rate: 2.0, minBalance: 2000, color: "#E5E4E2", benefits: ["2% cashback", "VIP support", "Premium features"] },
  { name: "Diamond", rate: 3.0, minBalance: 10000, color: "#B9F2FF", benefits: ["3% cashback", "Dedicated manager", "All features"] },
];

const PROMOS = [
  { id: "1", title: "10% Bonus Week", description: "Earn double cashback this week!", expires: "2026-03-25" },
  { id: "2", title: "Referral Bonus", description: "Get $10 for each friend you refer", expires: "Ongoing" },
];

export default function CashbackPage() {
  const { isLoggedIn, login, wallet, walletAddress } = useApp();
  const [loading, setLoading] = useState(true);
  const [redeeming, setRedeeming] = useState(false);

  const [cashbackBalance, setCashbackBalance] = useState(247.50);
  const [pendingCashback, setPendingCashback] = useState(12.35);
  const [history, setHistory] = useState<CashbackRecord[]>([
    { id: "1", amount: 5.25, description: "Payment to John", source: "Payment", type: "earned", date: "2026-03-17" },
    { id: "2", amount: 12.50, description: "Batch payment", source: "Batch", type: "earned", date: "2026-03-16" },
    { id: "3", amount: 2.00, description: "Tip received", source: "Tip", type: "earned", date: "2026-03-15" },
    { id: "4", amount: 100.00, description: "Cashback redemption", source: "Redemption", type: "redeemed", date: "2026-03-14" },
    { id: "5", amount: 8.75, description: "Payment to Sarah", source: "Payment", type: "earned", date: "2026-03-13" },
  ]);

  useEffect(() => {
    if (!isLoggedIn) return;
    setLoading(false);
  }, [isLoggedIn]);

  const currentTier = useMemo(() => {
    return [...TIERS].reverse().find(t => cashbackBalance >= t.minBalance) || TIERS[0];
  }, [cashbackBalance]);

  const nextTier = useMemo(() => {
    const currentIndex = TIERS.findIndex(t => t.name === currentTier.name);
    return TIERS[currentIndex + 1] || null;
  }, [currentTier]);

  const progressToNext = useMemo(() => {
    if (!nextTier) return 100;
    const range = nextTier.minBalance - currentTier.minBalance;
    const progress = cashbackBalance - currentTier.minBalance;
    return Math.min(100, Math.max(0, (progress / range) * 100));
  }, [cashbackBalance, currentTier, nextTier]);

  const handleRedeem = async () => {
    if (cashbackBalance < 1) {
      toast.error("Minimum redemption is $1.00");
      return;
    }

    setRedeeming(true);
    try {
      toast.success(`${cashbackBalance.toFixed(2)} USDC redeemed to your wallet!`);
      setCashbackBalance(0);
    } finally {
      setRedeeming(false);
    }
  };

  if (!isLoggedIn) {
    return (
      <div className="min-h-screen bg-background">
        <AppHeader />
        <div className="flex min-h-[80vh] flex-col items-center justify-center px-4 text-center">
          <div className="mb-6 flex h-20 w-20 items-center justify-center rounded-full bg-primary/10">
            <Gift className="h-10 w-10 text-primary" />
          </div>
          <h2 className="mb-3 font-display text-2xl text-foreground sm:text-3xl">Cashback Rewards</h2>
          <p className="mb-6 max-w-md text-sm text-muted-foreground">
            Earn cashback on every transaction and redeem for USDC. Higher tiers earn more!
          </p>
          <button onClick={login} className="rounded-lg bg-primary px-6 py-3 font-semibold text-primary-foreground shadow-glow hover:opacity-90">
            Sign In to View Rewards
          </button>
        </div>
        <Footer />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      <AppHeader />
      <div className="container mx-auto max-w-3xl px-4 pt-20 pb-12 sm:pt-24 sm:pb-16">
        <div className="mb-6 flex items-center justify-between">
          <div>
            <h1 className="font-display text-2xl text-foreground sm:text-3xl">Cashback Rewards</h1>
            <p className="mt-1 text-sm text-muted-foreground">Earn cashback on every transaction</p>
          </div>
        </div>

        {loading ? (
          <div className="flex justify-center py-12">
            <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
          </div>
        ) : (
          <>
            {/* Promo Banner */}
            <div className="mb-6 space-y-2">
              {PROMOS.map((promo) => (
                <motion.div
                  key={promo.id}
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="rounded-xl border border-yellow-500/30 bg-gradient-to-r from-yellow-500/10 to-orange-500/10 p-4"
                >
                  <div className="flex items-center gap-3">
                    <div className="flex h-10 w-10 items-center justify-center rounded-full bg-yellow-500/20">
                      <Star className="h-5 w-5 text-yellow-500" />
                    </div>
                    <div className="flex-1">
                      <p className="text-sm font-medium text-yellow-600">{promo.title}</p>
                      <p className="text-xs text-muted-foreground">{promo.description}</p>
                    </div>
                    <div className="text-right">
                      <p className="text-xs text-yellow-600 font-medium">{promo.expires}</p>
                    </div>
                  </div>
                </motion.div>
              ))}
            </div>

            {/* Balance Card */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              className="mb-6 rounded-2xl bg-gradient-to-br from-primary to-primary/80 p-6 text-white shadow-lg"
            >
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-primary-foreground/80">Cashback Balance</p>
                  <p className="font-display text-3xl">${cashbackBalance.toFixed(2)}</p>
                  {pendingCashback > 0 && (
                    <p className="mt-1 text-xs text-primary-foreground/70">
                      ${pendingCashback.toFixed(2)} pending
                    </p>
                  )}
                </div>
                <div className="flex flex-col items-end gap-1">
                  <button
                    onClick={handleRedeem}
                    disabled={redeeming || cashbackBalance < 1}
                    className="flex items-center gap-2 rounded-full bg-white/20 px-4 py-2 text-sm font-medium hover:bg-white/30 disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    {redeeming ? (
                      <Loader2 className="h-4 w-4 animate-spin" />
                    ) : (
                      <PiggyBank className="h-4 w-4" />
                    )}
                    Redeem
                  </button>
                </div>
              </div>
              
              {/* Tier Progress */}
              <div className="mt-4">
                <div className="flex items-center justify-between mb-2">
                  <span className="text-xs text-primary-foreground/80">Tier Progress</span>
                  <span className="text-xs font-medium">{currentTier.name} → {nextTier?.name || "Max"}</span>
                </div>
                <div className="h-2 rounded-full bg-white/20 overflow-hidden">
                  <div
                    className="h-full bg-white transition-all duration-500"
                    style={{ width: `${progressToNext}%` }}
                  />
                </div>
                {nextTier && (
                  <p className="mt-1 text-xs text-primary-foreground/70">
                    ${Math.max(0, nextTier.minBalance - cashbackBalance).toFixed(2)} to {nextTier.name}
                  </p>
                )}
              </div>
            </motion.div>

            {/* Tier Benefits */}
            <div className="mb-6 rounded-xl border border-border bg-card p-4">
              <h3 className="mb-3 text-sm font-medium text-foreground">Your Tier Benefits</h3>
              <div className="flex items-center gap-3">
                <div
                  className="flex h-12 w-12 items-center justify-center rounded-full text-white font-bold"
                  style={{ backgroundColor: currentTier.color }}
                >
                  {currentTier.name.slice(0, 1)}
                </div>
                <div className="flex-1">
                  <p className="font-medium text-foreground">{currentTier.name}</p>
                  <p className="text-xs text-muted-foreground">
                    {currentTier.rate}% cashback on all transactions
                  </p>
                </div>
                <div className="flex gap-1">
                  {currentTier.benefits.map((benefit, i) => (
                    <span
                      key={i}
                      className="rounded-full bg-secondary px-2 py-0.5 text-xs text-muted-foreground"
                    >
                      {benefit}
                    </span>
                  ))}
                </div>
              </div>
            </div>

            {/* History */}
            <div className="rounded-xl border border-border bg-card p-4">
              <div className="mb-3 flex items-center justify-between">
                <h3 className="text-sm font-medium text-foreground">Recent Activity</h3>
                <button className="flex items-center gap-1 text-xs text-primary hover:underline">
                  View All <ChevronRight className="h-3 w-3" />
                </button>
              </div>
              <div className="space-y-2">
                {history.slice(0, 5).map((record) => (
                  <div
                    key={record.id}
                    className="flex items-center justify-between rounded-lg p-3 hover:bg-secondary/50"
                  >
                    <div className="flex items-center gap-3">
                      <div
                        className={`flex h-8 w-8 items-center justify-center rounded-full ${
                          record.type === "earned" ? "bg-green-500/10" : "bg-red-500/10"
                        }`}
                      >
                        <History className={`h-4 w-4 ${record.type === "earned" ? "text-green-500" : "text-red-500"}`} />
                      </div>
                      <div>
                        <p className="text-sm font-medium text-foreground">{record.description}</p>
                        <p className="text-xs text-muted-foreground">{record.source}</p>
                      </div>
                    </div>
                    <div className="text-right">
                      <p
                        className={`text-sm font-medium ${
                          record.type === "earned" ? "text-green-500" : "text-red-500"
                        }`}
                      >
                        {record.type === "earned" ? "+" : "-"}${record.amount.toFixed(2)}
                      </p>
                      <p className="text-xs text-muted-foreground">
                        {new Date(record.date).toLocaleDateString()}
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </>
        )}
      </div>
      <Footer />
    </div>
  );
}
