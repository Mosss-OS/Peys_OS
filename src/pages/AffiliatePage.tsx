import { useState, useEffect, useMemo } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { 
  Users, Link, Copy, Check, DollarSign, Trophy, TrendingUp, 
  Gift, Clipboard, ArrowUpRight, Share2, BarChart3, 
  ChevronDown, Loader2, Download, ExternalLink 
} from "lucide-react";
import { Link as RouterLink } from "react-router-dom";
import { useApp } from "@/contexts/AppContext";
import AppHeader from "@/components/AppHeader";
import Footer from "@/components/Footer";
import { toast } from "sonner";

interface Referral {
  id: string;
  referredUser: string;
  joinedDate: string;
  status: "active" | "pending" | "inactive";
  commissions: number;
}

interface Commission {
  id: string;
  amount: number;
  date: string;
  type: "signup" | "transaction" | "bonus";
  referredUser: string;
}

interface Payout {
  id: string;
  amount: number;
  date: string;
  status: "completed" | "pending" | "processing";
  method: string;
}

const TIERS = [
  { name: "Starter", minReferrals: 0, commission: 10, color: "#6B7280" },
  { name: "Rising Star", minReferrals: 10, commission: 15, color: "#F59E0B" },
  { name: "Ambassador", minReferrals: 50, commission: 20, color: "#10B981" },
  { name: "Champion", minReferrals: 100, commission: 25, color: "#3B82F6" },
  { name: "Legend", minReferrals: 500, commission: 30, color: "#8B5CF6" },
];

const BANNERS = [
  { id: "1", title: "Share and Earn", description: "Get 10% of your friends' transactions", color: "from-primary to-primary/80" },
  { id: "2", title: "Team Bonus", description: "Earn extra when your team hits goals", color: "from-green-500 to-green-600" },
];

export default function AffiliatePage() {
  const { isLoggedIn, login, walletAddress } = useApp();
  const [loading, setLoading] = useState(true);
  const [copied, setCopied] = useState(false);

  const [referralCode] = useState("PEYS-ABC123");
  const [referralLink] = useState(`https://peys.app/invite/${referralCode}`);
  const [totalReferrals] = useState(127);
  const [activeReferrals] = useState(89);
  const [totalCommission] = useState(2457.50);
  const [pendingCommission] = useState(123.40);

  const [referrals] = useState<Referral[]>([
    { id: "1", referredUser: "john@example.com", joinedDate: "2026-03-15", status: "active", commissions: 45.50 },
    { id: "2", referredUser: "sarah@example.com", joinedDate: "2026-03-14", status: "active", commissions: 23.00 },
    { id: "3", referredUser: "mike@example.com", joinedDate: "2026-03-12", status: "pending", commissions: 0 },
    { id: "4", referredUser: "emma@example.com", joinedDate: "2026-03-10", status: "active", commissions: 12.75 },
    { id: "5", referredUser: "david@example.com", joinedDate: "2026-03-08", status: "inactive", commissions: 8.50 },
  ]);

  const [commissions] = useState<Commission[]>([
    { id: "1", amount: 45.50, date: "2026-03-17", type: "transaction", referredUser: "john@example.com" },
    { id: "2", amount: 23.00, date: "2026-03-16", type: "transaction", referredUser: "sarah@example.com" },
    { id: "3", amount: 10.00, date: "2026-03-15", type: "signup", referredUser: "mike@example.com" },
    { id: "4", amount: 12.75, date: "2026-03-14", type: "transaction", referredUser: "emma@example.com" },
    { id: "5", amount: 5.00, date: "2026-03-13", type: "bonus", referredUser: "system" },
  ]);

  const [payouts] = useState<Payout[]>([
    { id: "1", amount: 500.00, date: "2026-03-01", status: "completed", method: "USDC" },
    { id: "2", amount: 350.00, date: "2026-02-01", status: "completed", method: "USDC" },
    { id: "3", amount: 275.00, date: "2026-01-01", status: "completed", method: "USDC" },
  ]);

  useEffect(() => {
    if (!isLoggedIn) return;
    setLoading(false);
  }, [isLoggedIn]);

  const currentTier = useMemo(() => {
    return [...TIERS].reverse().find(t => totalReferrals >= t.minReferrals) || TIERS[0];
  }, [totalReferrals]);

  const nextTier = useMemo(() => {
    const currentIndex = TIERS.findIndex(t => t.name === currentTier.name);
    return TIERS[currentIndex + 1] || null;
  }, [currentTier]);

  const progressToNext = useMemo(() => {
    if (!nextTier) return 100;
    const range = nextTier.minReferrals - currentTier.minReferrals;
    const progress = totalReferrals - currentTier.minReferrals;
    return Math.min(100, Math.max(0, (progress / range) * 100));
  }, [totalReferrals, currentTier, nextTier]);

  const copyLink = async () => {
    await navigator.clipboard.writeText(referralLink);
    setCopied(true);
    toast.success("Link copied!");
    setTimeout(() => setCopied(false), 2000);
  };

  if (!isLoggedIn) {
    return (
      <div className="min-h-screen bg-background">
        <AppHeader />
        <div className="flex min-h-[80vh] flex-col items-center justify-center px-4 text-center">
          <div className="mb-6 flex h-20 w-20 items-center justify-center rounded-full bg-primary/10">
            <Users className="h-10 w-10 text-primary" />
          </div>
          <h2 className="mb-3 font-display text-2xl text-foreground sm:text-3xl">Affiliate Program</h2>
          <p className="mb-6 max-w-md text-sm text-muted-foreground">
            Refer friends and earn commissions on their transactions
          </p>
          <button onClick={login} className="rounded-lg bg-primary px-6 py-3 font-semibold text-primary-foreground shadow-glow hover:opacity-90">
            Sign In to Join Program
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
            <h1 className="font-display text-2xl text-foreground sm:text-3xl">Affiliate Program</h1>
            <p className="mt-1 text-sm text-muted-foreground">Earn commissions by referring friends</p>
          </div>
        </div>

        {loading ? (
          <div className="flex justify-center py-12">
            <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
          </div>
        ) : (
          <>
            {/* Banner Ads */}
            <div className="mb-6 space-y-2">
              {BANNERS.map((banner) => (
                <motion.div
                  key={banner.id}
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  className={`rounded-xl bg-gradient-to-r ${banner.color} p-4 text-white`}
                >
                  <p className="font-medium">{banner.title}</p>
                  <p className="text-sm text-white/80">{banner.description}</p>
                </motion.div>
              ))}
            </div>

            {/* Referral Link Card */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              className="mb-6 rounded-2xl bg-primary/10 p-6"
            >
              <div className="mb-4 flex items-center justify-between">
                <h2 className="font-medium text-foreground">Your Referral Link</h2>
                <div className="flex items-center gap-1 text-xs text-primary">
                  <Link className="h-3 w-3" />
                  {referralCode}
                </div>
              </div>
              
              <div className="flex items-center gap-2">
                <div className="flex-1 rounded-lg bg-background p-3">
                  <p className="text-sm font-mono text-foreground truncate">{referralLink}</p>
                </div>
                <button
                  onClick={copyLink}
                  className={`flex items-center gap-2 rounded-lg px-4 py-3 text-sm font-medium transition-colors ${
                    copied
                      ? "bg-green-500 text-white"
                      : "bg-primary text-primary-foreground hover:opacity-90"
                  }`}
                >
                  {copied ? (
                    <>
                      <Check className="h-4 w-4" />
                      Copied!
                    </>
                  ) : (
                    <>
                      <Copy className="h-4 w-4" />
                      Copy
                    </>
                  )}
                </button>
              </div>
            </motion.div>

            {/* Stats Grid */}
            <div className="mb-6 grid grid-cols-2 gap-3">
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                className="rounded-xl border border-border bg-card p-4"
              >
                <div className="flex items-center gap-2 text-primary">
                  <Users className="h-4 w-4" />
                  <span className="text-xs text-muted-foreground">Total Referrals</span>
                </div>
                <p className="mt-1 font-display text-2xl text-foreground">{totalReferrals}</p>
                <p className="text-xs text-muted-foreground">{activeReferrals} active</p>
              </motion.div>
              
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.1 }}
                className="rounded-xl border border-border bg-card p-4"
              >
                <div className="flex items-center gap-2 text-primary">
                  <DollarSign className="h-4 w-4" />
                  <span className="text-xs text-muted-foreground">Total Commission</span>
                </div>
                <p className="mt-1 font-display text-2xl text-foreground">${totalCommission.toFixed(2)}</p>
                <p className="text-xs text-muted-foreground">${pendingCommission.toFixed(2)} pending</p>
              </motion.div>
            </div>

            {/* Tier Progress */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              className="mb-6 rounded-xl border border-border bg-card p-4"
            >
              <div className="mb-3 flex items-center justify-between">
                <h3 className="text-sm font-medium text-foreground">Tier Progress</h3>
                <div className="flex items-center gap-2">
                  <Trophy className="h-4 w-4" style={{ color: currentTier.color }} />
                  <span className="text-sm font-medium" style={{ color: currentTier.color }}>
                    {currentTier.name}
                  </span>
                </div>
              </div>
              
              <div className="h-2 rounded-full bg-secondary overflow-hidden">
                <div
                  className="h-full transition-all duration-500"
                  style={{ width: `${progressToNext}%`, backgroundColor: currentTier.color }}
                />
              </div>
              
              <div className="mt-2 flex items-center justify-between text-xs text-muted-foreground">
                <span>{totalReferrals} referrals</span>
                {nextTier ? (
                  <span>{nextTier.minReferrals - totalReferrals} to {nextTier.name}</span>
                ) : (
                  <span style={{ color: currentTier.color }}>Max tier reached!</span>
                )}
              </div>
              
              <div className="mt-4 flex items-center gap-4">
                {TIERS.map((tier) => (
                  <div key={tier.name} className="flex-1">
                    <div
                      className="h-1 rounded-full mb-1"
                      style={{
                        backgroundColor:
                          totalReferrals >= tier.minReferrals ? tier.color : "#e5e7eb",
                      }}
                    />
                    <p
                      className="text-xs text-center truncate"
                      style={{
                        color:
                          totalReferrals >= tier.minReferrals ? tier.color : "#9ca3af",
                      }}
                    >
                      {tier.name} ({tier.commission}%)
                    </p>
                  </div>
                ))}
              </div>
            </motion.div>

            {/* Tabs */}
            <div className="mb-4 flex gap-1 rounded-xl border border-border bg-card p-1">
              {["referrals", "commissions", "payouts"].map((tab) => (
                <button
                  key={tab}
                  className={`flex-1 py-2 text-sm font-medium capitalize transition-colors rounded-lg ${
                    "referrals" === tab
                      ? "bg-primary text-primary-foreground"
                      : "text-muted-foreground hover:text-foreground"
                  }`}
                >
                  {tab}
                </button>
              ))}
            </div>

            {/* Referrals List */}
            <div className="space-y-2">
              <h3 className="text-sm font-medium text-foreground mb-2">Recent Referrals</h3>
              {referrals.map((ref) => (
                <motion.div
                  key={ref.id}
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="flex items-center justify-between rounded-lg border border-border bg-background p-3"
                >
                  <div className="flex items-center gap-3">
                    <div className="flex h-8 w-8 items-center justify-center rounded-full bg-primary/10 text-xs font-bold text-primary">
                      {ref.referredUser.slice(0, 1).toUpperCase()}
                    </div>
                    <div>
                      <p className="text-sm text-foreground">{ref.referredUser}</p>
                      <p className="text-xs text-muted-foreground">
                        Joined {new Date(ref.joinedDate).toLocaleDateString()}
                      </p>
                    </div>
                  </div>
                  <div className="text-right">
                    <p className="text-sm font-medium text-green-600">
                      ${ref.commissions.toFixed(2)}
                    </p>
                    <span
                      className={`text-xs ${
                        ref.status === "active"
                          ? "text-green-600"
                          : ref.status === "pending"
                          ? "text-yellow-600"
                          : "text-muted-foreground"
                      }`}
                    >
                      {ref.status}
                    </span>
                  </div>
                </motion.div>
              ))}
            </div>

            {/* Commission History */}
            <div className="mt-6 space-y-2">
              <h3 className="text-sm font-medium text-foreground mb-2">Commission History</h3>
              {commissions.map((comm) => (
                <motion.div
                  key={comm.id}
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="flex items-center justify-between rounded-lg border border-border bg-background p-3"
                >
                  <div className="flex items-center gap-3">
                    <div
                      className={`flex h-8 w-8 items-center justify-center rounded-full ${
                        comm.type === "signup"
                          ? "bg-blue-500/10"
                          : comm.type === "transaction"
                          ? "bg-green-500/10"
                          : "bg-purple-500/10"
                      }`}
                    >
                      {comm.type === "signup" ? (
                        <Users className="h-4 w-4 text-blue-500" />
                      ) : comm.type === "transaction" ? (
                        <TrendingUp className="h-4 w-4 text-green-500" />
                      ) : (
                        <Gift className="h-4 w-4 text-purple-500" />
                      )}
                    </div>
                    <div>
                      <p className="text-sm text-foreground">
                        {comm.type === "signup" ? "Referral signup" :
                         comm.type === "transaction" ? `${comm.referredUser}` : "Bonus"}
                      </p>
                      <p className="text-xs text-muted-foreground">
                        {new Date(comm.date).toLocaleDateString()}
                      </p>
                    </div>
                  </div>
                  <p className="text-sm font-medium text-green-600">
                    +${comm.amount.toFixed(2)}
                  </p>
                </motion.div>
              ))}
            </div>

            {/* Payout History */}
            <div className="mt-6 space-y-2">
              <h3 className="text-sm font-medium text-foreground mb-2">Payout History</h3>
              {payouts.map((payout) => (
                <motion.div
                  key={payout.id}
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="flex items-center justify-between rounded-lg border border-border bg-background p-3"
                >
                  <div className="flex items-center gap-3">
                    <div className="flex h-8 w-8 items-center justify-center rounded-full bg-primary/10">
                      <DollarSign className="h-4 w-4 text-primary" />
                    </div>
                    <div>
                      <p className="text-sm text-foreground">
                        Payout to {payout.method} wallet
                      </p>
                      <p className="text-xs text-muted-foreground">
                        {new Date(payout.date).toLocaleDateString()}
                      </p>
                    </div>
                  </div>
                  <div className="text-right">
                    <p className="text-sm font-medium text-foreground">
                      ${payout.amount.toFixed(2)}
                    </p>
                    <span
                      className={`text-xs ${
                        payout.status === "completed"
                          ? "text-green-600"
                          : payout.status === "pending"
                          ? "text-yellow-600"
                          : "text-blue-600"
                      }`}
                    >
                      {payout.status}
                    </span>
                  </div>
                </motion.div>
              ))}
            </div>
          </>
        )}
      </div>
      <Footer />
    </div>
  );
}
