/** LoyaltyPage - Points balance, reward redemption, transaction history, and tier progression. */
import { useState } from "react";
import { motion } from "framer-motion";
import { Gift, Star, History, Award, Clock, TrendingUp, ChevronRight, Copy, Check, Loader2, Zap, Crown, Shield, Sparkles, AlertTriangle } from "lucide-react";
import { useApp } from "@/contexts/AppContext";
import AppHeader from "@/components/AppHeader";
import Footer from "@/components/Footer";
import { toast } from "sonner";

interface Reward {
  id: string;
  name: string;
  description: string;
  pointsCost: number;
  category: "discount" | "cashback" | "gift" | "feature";
  available: boolean;
}

interface PointsTransaction {
  id: string;
  type: "earned" | "redeemed";
  points: number;
  description: string;
  date: string;
}

interface Tier {
  id: string;
  name: string;
  pointsRequired: number;
  benefits: string[];
  icon: typeof Crown;
  color: string;
}

/** Loyalty rewards page with points balance, reward redemption, history, and tier progression. */
export default function LoyaltyPage() {
  const { isLoggedIn, login } = useApp();
  const [activeTab, setActiveTab] = useState<"rewards" | "history" | "tiers">("rewards");
  const [redeeming, setRedeeming] = useState<string | null>(null);
  const [rewards, setRewards] = useState<Reward[]>([]);
  const [history, setHistory] = useState<PointsTransaction[]>([]);
  const [tiers, setTiers] = useState<Tier[]>([]);

  const pointsBalance = 0;
  const pointsToNextTier = 0;
  const currentTier = "";

  const handleRedeem = async (reward: Reward) => {
    if (reward.pointsCost > pointsBalance) {
      toast.error("Not enough points");
      return;
    }
    setRedeeming(reward.id);
    setRedeeming(null);
    toast.success(`Successfully redeemed: ${reward.name}!`);
  };

  if (!isLoggedIn) {
    return (
      <div className="min-h-screen bg-background">
        <AppHeader />
        <div className="flex min-h-[80vh] flex-col items-center justify-center px-4 text-center">
          <div className="mb-6 flex h-20 w-20 items-center justify-center rounded-full bg-primary/10">
            <Gift className="h-10 w-10 text-primary" />
          </div>
          <h2 className="mb-3 font-display text-2xl text-foreground sm:text-3xl">Loyalty & Rewards</h2>
          <p className="mb-6 max-w-md text-sm text-muted-foreground">
            Earn points on every transaction and redeem them for exclusive rewards and cashback.
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
      <div className="container mx-auto max-w-4xl px-4 pt-20 pb-12 sm:pt-24 sm:pb-16">
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          className="mb-8 rounded-xl border border-border bg-gradient-to-r from-primary/10 to-primary/5 p-6"
        >
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-muted-foreground">Your Points Balance</p>
              <p className="mt-1 font-display text-4xl font-bold text-primary">{pointsBalance.toLocaleString()}</p>
              <p className="mt-1 text-sm text-muted-foreground">
                <span className="text-foreground font-medium">{pointsToNextTier}</span> points to {currentTier === "Silver" ? "Gold" : "next tier"}
              </p>
            </div>
            <div className="flex h-16 w-16 items-center justify-center rounded-full bg-primary/20">
              <Star className="h-8 w-8 text-primary" />
            </div>
          </div>
          <div className="mt-4">
            <div className="mb-1 flex justify-between text-xs">
              <span className="text-muted-foreground">Progress to next tier</span>
              <span className="text-foreground">{((pointsBalance % 5000) / 5000 * 100).toFixed(0)}%</span>
            </div>
            <div className="h-2 w-full rounded-full bg-secondary">
              <div
                className="h-2 rounded-full bg-primary transition-all"
                style={{ width: `${(pointsBalance % 5000) / 5000 * 100}%` }}
              />
            </div>
          </div>
        </motion.div>

        <div className="mb-6 flex gap-2 overflow-x-auto border-b border-border pb-2">
          {[
            { id: "rewards", label: "Rewards", icon: Gift },
            { id: "history", label: "History", icon: History },
            { id: "tiers", label: "Tiers", icon: Award },
          ].map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id as typeof activeTab)}
              className={`flex items-center gap-2 whitespace-nowrap rounded-lg px-4 py-2 text-sm font-medium transition-colors ${
                activeTab === tab.id
                  ? "bg-primary text-primary-foreground"
                  : "text-muted-foreground hover:bg-secondary"
              }`}
            >
              <tab.icon className="h-4 w-4" />
              {tab.label}
            </button>
          ))}
        </div>

        {activeTab === "rewards" && (
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            className="space-y-3"
          >
            {rewards.map((reward) => (
              <div
                key={reward.id}
                className={`rounded-xl border border-border bg-card p-5 ${
                  !reward.available ? "opacity-50" : ""
                }`}
              >
                <div className="flex items-start justify-between">
                  <div className="flex items-start gap-4">
                    <div className={`flex h-12 w-12 items-center justify-center rounded-lg ${
                      reward.category === "cashback" ? "bg-green-500/10" :
                      reward.category === "discount" ? "bg-blue-500/10" :
                      reward.category === "gift" ? "bg-purple-500/10" :
                      "bg-yellow-500/10"
                    }`}>
                      {reward.category === "cashback" ? (
                        <TrendingUp className="h-6 w-6 text-green-500" />
                      ) : reward.category === "discount" ? (
                        <Zap className="h-6 w-6 text-blue-500" />
                      ) : reward.category === "gift" ? (
                        <Gift className="h-6 w-6 text-purple-500" />
                      ) : (
                        <Star className="h-6 w-6 text-yellow-500" />
                      )}
                    </div>
                    <div>
                      <h3 className="font-semibold text-foreground">{reward.name}</h3>
                      <p className="mt-1 text-sm text-muted-foreground">{reward.description}</p>
                      <div className="mt-2 flex items-center gap-2">
                        <Star className="h-4 w-4 text-yellow-500" />
                        <span className="font-medium text-yellow-500">{reward.pointsCost.toLocaleString()} points</span>
                      </div>
                    </div>
                  </div>
                  <button
                    onClick={() => handleRedeem(reward)}
                    disabled={!reward.available || redeeming === reward.id || reward.pointsCost > pointsBalance}
                    className={`rounded-lg px-4 py-2 text-sm font-medium transition-colors ${
                      reward.available && reward.pointsCost <= pointsBalance
                        ? "bg-primary text-primary-foreground hover:opacity-90"
                        : "bg-secondary text-muted-foreground cursor-not-allowed"
                    }`}
                  >
                    {redeeming === reward.id ? (
                      <Loader2 className="h-4 w-4 animate-spin" />
                    ) : (
                      "Redeem"
                    )}
                  </button>
                </div>
                {!reward.available && (
                  <div className="mt-3 flex items-center gap-2 text-xs text-muted-foreground">
                    <AlertTriangle className="h-3 w-3" />
                    This reward is currently unavailable
                  </div>
                )}
              </div>
            ))}
          </motion.div>
        )}

        {activeTab === "history" && (
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            className="space-y-3"
          >
            {history.map((tx) => (
              <div
                key={tx.id}
                className="flex items-center justify-between rounded-xl border border-border bg-card p-4"
              >
                <div className="flex items-center gap-4">
                  <div className={`flex h-10 w-10 items-center justify-center rounded-lg ${
                    tx.type === "earned" ? "bg-green-500/10" : "bg-red-500/10"
                  }`}>
                    {tx.type === "earned" ? (
                      <TrendingUp className="h-5 w-5 text-green-500" />
                    ) : (
                      <TrendingUp className="h-5 w-5 text-red-500" />
                    )}
                  </div>
                  <div>
                    <p className="font-medium text-foreground">{tx.description}</p>
                    <p className="mt-0.5 flex items-center gap-1 text-xs text-muted-foreground">
                      <Clock className="h-3 w-3" />
                      {new Date(tx.date).toLocaleDateString()}
                    </p>
                  </div>
                </div>
                <span className={`font-semibold ${
                  tx.type === "earned" ? "text-green-500" : "text-red-500"
                }`}>
                  {tx.type === "earned" ? "+" : ""}{tx.points.toLocaleString()}
                </span>
              </div>
            ))}
          </motion.div>
        )}

        {activeTab === "tiers" && (
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            className="space-y-4"
          >
            {tiers.map((tier, i) => {
              const Icon = tier.icon;
              const isCurrentTier = tier.name === currentTier;
              const isUnlocked = pointsBalance >= tier.pointsRequired;
              
              return (
                <div
                  key={tier.id}
                  className={`rounded-xl border p-5 ${
                    isCurrentTier ? "border-primary bg-primary/5" :
                    isUnlocked ? "border-green-500/30 bg-green-500/5" :
                    "border-border"
                  }`}
                >
                  <div className="flex items-start justify-between">
                    <div className="flex items-center gap-3">
                      <div className={`flex h-12 w-12 items-center justify-center rounded-full bg-${tier.color}/20`}>
                        <Icon className={`h-6 w-6 text-${tier.color}`} />
                      </div>
                      <div>
                        <div className="flex items-center gap-2">
                          <h3 className="font-semibold text-foreground">{tier.name}</h3>
                          {isCurrentTier && (
                            <span className="rounded-full bg-primary px-2 py-0.5 text-xs font-medium text-primary-foreground">
                              Current
                            </span>
                          )}
                          {isUnlocked && !isCurrentTier && (
                            <span className="rounded-full bg-green-500/10 px-2 py-0.5 text-xs font-medium text-green-600">
                              Unlocked
                            </span>
                          )}
                        </div>
                        <p className="mt-0.5 text-sm text-muted-foreground">
                          {tier.pointsRequired.toLocaleString()} points required
                        </p>
                      </div>
                    </div>
                    {!isUnlocked && (
                      <div className="text-right">
                        <p className="text-sm text-muted-foreground">
                          {Math.max(0, tier.pointsRequired - pointsBalance).toLocaleString()} more needed
                        </p>
                      </div>
                    )}
                  </div>
                  <div className="mt-4 border-t border-border pt-4">
                    <p className="mb-2 text-sm font-medium text-muted-foreground">Benefits:</p>
                    <ul className="grid gap-1 sm:grid-cols-2">
                      {tier.benefits.map((benefit) => (
                        <li key={benefit} className="flex items-center gap-2 text-sm">
                          <Check className="h-4 w-4 text-green-500" />
                          {benefit}
                        </li>
                      ))}
                    </ul>
                  </div>
                </div>
              );
            })}
          </motion.div>
        )}
      </div>
      <Footer />
    </div>
  );
}
