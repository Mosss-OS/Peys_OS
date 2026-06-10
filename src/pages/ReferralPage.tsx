import { useState } from "react";
import { motion } from "framer-motion";
import { Gift, Copy, Share2, Users, Trophy, DollarSign, TrendingUp, ChevronRight, Twitter, MessageCircle, Link2, Check, Loader2, Award } from "lucide-react";
import { useApp } from "@/contexts/AppContext";
import AppHeader from "@/components/AppHeader";
import Footer from "@/components/Footer";
import { toast } from "sonner";

interface ReferralStats {
  totalReferrals: number;
  activeReferrals: number;
  pendingRewards: number;
  totalEarned: number;
}

interface LeaderboardEntry {
  rank: number;
  address: string;
  referrals: number;
  reward: number;
}

export default function ReferralPage() {
  const { isLoggedIn, login } = useApp();
  const [copied, setCopied] = useState(false);
  const [sharing, setSharing] = useState(false);
  const referralCode = "PEYS-MOSES-2026";
  const referralLink = `https://peys.io/ref/${referralCode}`;

  const stats: ReferralStats = {
    totalReferrals: 12,
    activeReferrals: 8,
    pendingRewards: 25,
    totalEarned: 150,
  };

  const leaderboard: LeaderboardEntry[] = [
    { rank: 1, address: "0x1234...5678", referrals: 45, reward: 500 },
    { rank: 2, address: "0xabcd...efgh", referrals: 32, reward: 350 },
    { rank: 3, address: "0x9876...ijkl", referrals: 28, reward: 280 },
    { rank: 4, address: "0xmoses...mnop", referrals: 12, reward: 150 },
    { rank: 5, address: "0xqrst...uvwx", referrals: 10, reward: 120 },
  ];

  const handleCopy = async () => {
    await navigator.clipboard.writeText(referralLink);
    setCopied(true);
    toast.success("Referral link copied!");
    setTimeout(() => setCopied(false), 2000);
  };

  const handleShare = async (platform: "twitter" | "whatsapp" | "telegram") => {
    setSharing(true);
    const message = "Join me on Peys! Use my referral link to get started with fast, secure crypto payments. 🚀";
    
    const urls: Record<string, string> = {
      twitter: `https://twitter.com/intent/tweet?text=${encodeURIComponent(message)}&url=${encodeURIComponent(referralLink)}`,
      whatsapp: `https://wa.me/?text=${encodeURIComponent(message + " " + referralLink)}`,
      telegram: `https://t.me/share/url?url=${encodeURIComponent(referralLink)}&text=${encodeURIComponent(message)}`,
    };
    
    window.open(urls[platform], "_blank");
    setTimeout(() => setSharing(false), 500);
  };

  if (!isLoggedIn) {
    return (
      <div className="min-h-screen bg-background">
        <AppHeader />
        <div className="flex min-h-[80vh] flex-col items-center justify-center px-4 text-center">
          <div className="mb-6 flex h-20 w-20 items-center justify-center rounded-full bg-primary/10">
            <Gift className="h-10 w-10 text-primary" />
          </div>
          <h2 className="mb-3 font-display text-2xl text-foreground sm:text-3xl">Referral Program</h2>
          <p className="mb-6 max-w-md text-sm text-muted-foreground">
            Invite friends and earn rewards for every friend who joins and makes their first transaction.
          </p>
          <button onClick={login} className="rounded-lg bg-primary px-6 py-3 font-semibold text-primary-foreground shadow-glow hover:opacity-90">
            Sign In to Start Referring
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
        <div className="mb-8 text-center">
          <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-primary/10">
            <Gift className="h-8 w-8 text-primary" />
          </div>
          <h1 className="font-display text-2xl text-foreground sm:text-3xl">Referral Program</h1>
          <p className="mt-2 text-sm text-muted-foreground">
            Invite friends and earn $10 for each referral who makes their first payment
          </p>
        </div>

        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          className="mb-8 rounded-xl border border-border bg-gradient-to-r from-primary/10 to-primary/5 p-6"
        >
          <div className="mb-4 text-center">
            <p className="text-sm text-muted-foreground">Your Referral Code</p>
            <p className="mt-1 font-mono text-2xl font-bold text-primary">{referralCode}</p>
          </div>
          <div className="flex flex-col gap-3 sm:flex-row">
            <div className="relative flex-1">
              <input
                type="text"
                value={referralLink}
                readOnly
                className="w-full rounded-lg border border-border bg-background/50 px-4 py-2.5 pr-10 font-mono text-sm text-muted-foreground"
              />
              <button
                onClick={handleCopy}
                className="absolute right-2 top-1/2 -translate-y-1/2 rounded-lg p-2 hover:bg-secondary"
              >
                {copied ? (
                  <Check className="h-4 w-4 text-green-500" />
                ) : (
                  <Copy className="h-4 w-4 text-muted-foreground" />
                )}
              </button>
            </div>
            <button
              onClick={() => handleShare("twitter")}
              disabled={sharing}
              className="flex items-center justify-center gap-2 rounded-lg bg-[#1DA1F2] px-4 py-2.5 font-medium text-white hover:opacity-90 disabled:opacity-50"
            >
              <Twitter className="h-4 w-4" />
              Tweet
            </button>
            <button
              onClick={() => handleShare("whatsapp")}
              disabled={sharing}
              className="flex items-center justify-center gap-2 rounded-lg bg-[#25D366] px-4 py-2.5 font-medium text-white hover:opacity-90 disabled:opacity-50"
            >
              <MessageCircle className="h-4 w-4" />
              WhatsApp
            </button>
            <button
              onClick={() => handleShare("telegram")}
              disabled={sharing}
              className="flex items-center justify-center gap-2 rounded-lg bg-[#0088cc] px-4 py-2.5 font-medium text-white hover:opacity-90 disabled:opacity-50"
            >
              <Share2 className="h-4 w-4" />
              Share
            </button>
          </div>
        </motion.div>

        <div className="mb-8 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
            className="rounded-xl border border-border bg-card p-5"
          >
            <div className="mb-2 flex h-10 w-10 items-center justify-center rounded-lg bg-primary/10">
              <Users className="h-5 w-5 text-primary" />
            </div>
            <p className="text-2xl font-bold text-foreground">{stats.totalReferrals}</p>
            <p className="text-sm text-muted-foreground">Total Referrals</p>
          </motion.div>
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.15 }}
            className="rounded-xl border border-border bg-card p-5"
          >
            <div className="mb-2 flex h-10 w-10 items-center justify-center rounded-lg bg-green-500/10">
              <TrendingUp className="h-5 w-5 text-green-500" />
            </div>
            <p className="text-2xl font-bold text-foreground">{stats.activeReferrals}</p>
            <p className="text-sm text-muted-foreground">Active Users</p>
          </motion.div>
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
            className="rounded-xl border border-border bg-card p-5"
          >
            <div className="mb-2 flex h-10 w-10 items-center justify-center rounded-lg bg-yellow-500/10">
              <DollarSign className="h-5 w-5 text-yellow-500" />
            </div>
            <p className="text-2xl font-bold text-foreground">${stats.pendingRewards}</p>
            <p className="text-sm text-muted-foreground">Pending</p>
          </motion.div>
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.25 }}
            className="rounded-xl border border-border bg-card p-5"
          >
            <div className="mb-2 flex h-10 w-10 items-center justify-center rounded-lg bg-green-500/10">
              <Award className="h-5 w-5 text-green-500" />
            </div>
            <p className="text-2xl font-bold text-green-500">${stats.totalEarned}</p>
            <p className="text-sm text-muted-foreground">Total Earned</p>
          </motion.div>
        </div>

        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3 }}
          className="rounded-xl border border-border bg-card p-6"
        >
          <div className="mb-4 flex items-center gap-3">
            <Trophy className="h-6 w-6 text-yellow-500" />
            <h2 className="text-lg font-semibold text-foreground">Leaderboard</h2>
          </div>
          <div className="space-y-2">
            {leaderboard.map((entry) => (
              <div
                key={entry.rank}
                className={`flex items-center justify-between rounded-lg border p-3 ${
                  entry.rank <= 3 ? "border-yellow-500/30 bg-yellow-500/5" : "border-border"
                }`}
              >
                <div className="flex items-center gap-4">
                  <div className={`flex h-8 w-8 items-center justify-center rounded-full ${
                    entry.rank === 1 ? "bg-yellow-500 text-white" :
                    entry.rank === 2 ? "bg-gray-400 text-white" :
                    entry.rank === 3 ? "bg-amber-600 text-white" :
                    "bg-secondary text-muted-foreground"
                  }`}>
                    {entry.rank}
                  </div>
                  <div>
                    <p className="font-mono text-sm font-medium text-foreground">{entry.address}</p>
                    <p className="text-xs text-muted-foreground">{entry.referrals} referrals</p>
                  </div>
                </div>
                <div className="text-right">
                  <p className="font-semibold text-green-500">${entry.reward}</p>
                </div>
              </div>
            ))}
          </div>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.4 }}
          className="mt-6 rounded-xl border border-border bg-card p-6"
        >
          <h2 className="mb-4 text-lg font-semibold text-foreground">Terms & Conditions</h2>
          <div className="space-y-3 text-sm text-muted-foreground">
            <p>• You earn $10 for each friend who signs up using your referral link and completes their first transaction.</p>
            <p>• Pending rewards become available after the referred user completes KYC verification.</p>
            <p>• Minimum withdrawal amount is $50.</p>
            <p>• Rewards are paid in USDC on the Base network.</p>
            <p>• Peys reserves the right to modify the referral program terms at any time.</p>
            <p>• Fraudulent referrals will be disqualified and may result in account suspension.</p>
          </div>
        </motion.div>
      </div>
      <Footer />
    </div>
  );
}
