import { useState } from "react";
import { motion } from "framer-motion";
import { Coffee, DollarSign, MessageSquare, Share2, History, TrendingUp, ArrowLeft, Copy, Check, Heart } from "lucide-react";
import { Link } from "react-router-dom";
import { useApp } from "@/contexts/AppContext";
import AppHeader from "@/components/AppHeader";
import Footer from "@/components/Footer";
import { toast } from "sonner";

const TIP_AMOUNTS = [1, 5, 10, 25, 50, 100];

interface Tip {
  id: string;
  amount: number;
  token: string;
  message?: string;
  from?: string;
  timestamp: Date;
}

const MOCK_TIPS: Tip[] = [
  { id: "1", amount: 5, token: "USDC", message: "Great work!", from: "alice.eth", timestamp: new Date(Date.now() - 3600000) },
  { id: "2", amount: 10, token: "USDC", message: "Keep it up!", from: "bob.eth", timestamp: new Date(Date.now() - 86400000) },
  { id: "3", amount: 25, token: "USDT", from: "crypto_fan", timestamp: new Date(Date.now() - 172800000) },
  { id: "4", amount: 2, token: "PASS", message: "Thanks for the help", timestamp: new Date(Date.now() - 259200000) },
];

export default function TipJarPage() {
  const { isLoggedIn, login, walletAddress } = useApp();
  const [selectedAmount, setSelectedAmount] = useState<number | null>(null);
  const [customAmount, setCustomAmount] = useState("");
  const [message, setMessage] = useState("");
  const [tips, setTips] = useState<Tip[]>(MOCK_TIPS);
  const [sending, setSending] = useState(false);
  const [sent, setSent] = useState(false);
  const [token, setToken] = useState<"USDC" | "USDT" | "PASS" | "G$">("USDC");

  const totalReceived = tips.reduce((sum, tip) => sum + tip.amount, 0);
  const tipJarUrl = `${window.location.origin}/tipjar/${walletAddress?.slice(0, 10) || "demo"}`;

  const handleSendTip = async () => {
    const amount = customAmount ? Number(customAmount) : selectedAmount;
    if (!amount || amount <= 0) {
      toast.error("Please select or enter an amount");
      return;
    }

    setSending(true);
    await new Promise((resolve) => setTimeout(resolve, 1500));

    const newTip: Tip = {
      id: `tip_${Date.now()}`,
      amount,
      token,
      message: message || undefined,
      timestamp: new Date(),
    };

    setTips((prev) => [newTip, ...prev]);
    setSending(false);
    setSent(true);
    setSelectedAmount(null);
    setCustomAmount("");
    setMessage("");
    toast.success(`Thank you for the ${amount} ${token} tip! ☕`);

    setTimeout(() => setSent(false), 3000);
  };

  const copyLink = () => {
    navigator.clipboard.writeText(tipJarUrl);
    toast.success("Tip jar link copied!");
  };

  const shareTipJar = async () => {
    if (navigator.share) {
      try {
        await navigator.share({
          title: "Send me a tip",
          text: "Support my work with a tip!",
          url: tipJarUrl,
        });
      } catch {
        // User cancelled
      }
    } else {
      copyLink();
    }
  };

  const formatTime = (date: Date) => {
    const diff = Date.now() - date.getTime();
    const hours = Math.floor(diff / 3600000);
    if (hours < 1) return "Just now";
    if (hours < 24) return `${hours}h ago`;
    return `${Math.floor(hours / 24)}d ago`;
  };

  if (!isLoggedIn) {
    return (
      <div className="min-h-screen bg-background">
        <AppHeader />
        <div className="flex min-h-[80vh] flex-col items-center justify-center px-4 text-center">
          <div className="mb-6 flex h-20 w-20 items-center justify-center rounded-full bg-primary/10">
            <Coffee className="h-10 w-10 text-primary" />
          </div>
          <h2 className="mb-3 font-display text-2xl text-foreground sm:text-3xl">Tip Jar</h2>
          <p className="mb-6 max-w-md text-sm text-muted-foreground">
            Receive tips and support from your community. Perfect for creators, developers, and content creators.
          </p>
          <button onClick={login} className="rounded-lg bg-primary px-6 py-3 font-semibold text-primary-foreground shadow-glow hover:opacity-90">
            Sign In to Create Tip Jar
          </button>
        </div>
        <Footer />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      <AppHeader />
      <div className="container mx-auto max-w-2xl px-4 pt-20 pb-12 sm:pt-24 sm:pb-16">
        <Link to="/dashboard" className="mb-4 inline-flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground transition-colors">
          <ArrowLeft className="h-4 w-4" /> Back to Dashboard
        </Link>

        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="mb-8 text-center">
          <div className="mx-auto mb-4 flex h-20 w-20 items-center justify-center rounded-full bg-primary/10">
            <Coffee className="h-10 w-10 text-primary" />
          </div>
          <h1 className="font-display text-3xl text-foreground sm:text-4xl">Tip Jar</h1>
          <p className="mt-2 text-muted-foreground">Support my work with a tip</p>
        </motion.div>

        {/* Share Section */}
        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.1 }}
          className="mb-6 rounded-xl border border-border bg-card p-4"
        >
          <div className="flex items-center justify-between gap-4">
            <div className="min-w-0 flex-1">
              <p className="truncate text-sm font-medium text-foreground">{tipJarUrl}</p>
            </div>
            <div className="flex gap-2">
              <button
                onClick={copyLink}
                className="flex items-center gap-1.5 rounded-lg border border-border px-3 py-1.5 text-xs font-medium text-muted-foreground hover:bg-secondary transition-colors"
              >
                <Copy className="h-3.5 w-3.5" />
                Copy
              </button>
              <button
                onClick={shareTipJar}
                className="flex items-center gap-1.5 rounded-lg bg-primary px-3 py-1.5 text-xs font-medium text-primary-foreground shadow-glow transition-opacity hover:opacity-90"
              >
                <Share2 className="h-3.5 w-3.5" />
                Share
              </button>
            </div>
          </div>
        </motion.div>

        {/* Send Tip Form */}
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.2 }}
          className="mb-6 overflow-hidden rounded-xl border border-border bg-card"
        >
          <div className="border-b border-border bg-secondary/50 p-4">
            <h2 className="font-display text-lg text-foreground">Send a Tip</h2>
          </div>
          <div className="p-4 space-y-4">
            {/* Token Selection */}
            <div>
              <label className="mb-2 block text-sm font-medium text-muted-foreground">Token</label>
              <div className="flex gap-2">
                {(["USDC", "USDT", "PASS", "G$"] as const).filter(t => t !== "USDT").map((t) => (
                  <button
                    key={t}
                    onClick={() => setToken(t)}
                    className={`flex-1 rounded-lg border py-2 text-sm font-medium transition-colors ${
                      token === t
                        ? "border-primary bg-primary/10 text-primary"
                        : "border-border text-muted-foreground hover:bg-secondary"
                    }`}
                  >
                    {t}
                  </button>
                ))}
              </div>
            </div>

            {/* Preset Amounts */}
            <div>
              <label className="mb-2 block text-sm font-medium text-muted-foreground">Amount</label>
              <div className="grid grid-cols-3 gap-2">
                {TIP_AMOUNTS.map((amount) => (
                  <button
                    key={amount}
                    onClick={() => { setSelectedAmount(amount); setCustomAmount(""); }}
                    className={`rounded-lg border py-3 text-sm font-semibold transition-colors ${
                      selectedAmount === amount && !customAmount
                        ? "border-primary bg-primary/10 text-primary"
                        : "border-border text-foreground hover:bg-secondary"
                    }`}
                  >
                    ${amount}
                  </button>
                ))}
              </div>
            </div>

            {/* Custom Amount */}
            <div>
              <label className="mb-2 block text-sm font-medium text-muted-foreground">Or custom amount</label>
              <div className="relative">
                <span className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground">$</span>
                <input
                  type="number"
                  value={customAmount}
                  onChange={(e) => { setCustomAmount(e.target.value); setSelectedAmount(null); }}
                  placeholder="0.00"
                  className="w-full rounded-lg border border-border bg-background py-3 pl-8 pr-4 text-foreground placeholder:text-muted-foreground/50 focus:outline-none focus:ring-2 focus:ring-ring"
                />
              </div>
            </div>

            {/* Message */}
            <div>
              <label className="mb-2 block text-sm font-medium text-muted-foreground">Add a message (optional)</label>
              <div className="relative">
                <MessageSquare className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                <textarea
                  value={message}
                  onChange={(e) => setMessage(e.target.value)}
                  placeholder="Thanks for the great work..."
                  rows={2}
                  className="w-full resize-none rounded-lg border border-border bg-background py-2.5 pl-10 pr-4 text-sm text-foreground placeholder:text-muted-foreground/50 focus:outline-none focus:ring-2 focus:ring-ring"
                />
              </div>
            </div>

            {/* Send Button */}
            <button
              onClick={handleSendTip}
              disabled={sending || sent}
              className={`flex w-full items-center justify-center gap-2 rounded-xl py-3 text-sm font-semibold transition-all ${
                sent
                  ? "bg-green-500 text-white"
                  : "bg-primary text-primary-foreground shadow-glow hover:opacity-90"
              } disabled:opacity-50`}
            >
              {sending ? (
                <>
                  <motion.div
                    animate={{ rotate: 360 }}
                    transition={{ duration: 1, repeat: Infinity, ease: "linear" }}
                  >
                    <Coffee className="h-4 w-4" />
                  </motion.div>
                  Sending...
                </>
              ) : sent ? (
                <>
                  <Check className="h-4 w-4" />
                  Tip Sent!
                </>
              ) : (
                <>
                  <Heart className="h-4 w-4" />
                  Send Tip
                </>
              )}
            </button>
          </div>
        </motion.div>

        {/* Stats */}
        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.3 }}
          className="mb-6 grid grid-cols-2 gap-4"
        >
          <div className="rounded-xl border border-border bg-card p-4 text-center">
            <div className="mb-1 flex h-10 w-10 items-center justify-center rounded-full bg-primary/10 mx-auto">
              <TrendingUp className="h-5 w-5 text-primary" />
            </div>
            <p className="text-2xl font-bold text-foreground">${totalReceived.toFixed(2)}</p>
            <p className="text-xs text-muted-foreground">Total Received</p>
          </div>
          <div className="rounded-xl border border-border bg-card p-4 text-center">
            <div className="mb-1 flex h-10 w-10 items-center justify-center rounded-full bg-primary/10 mx-auto">
              <History className="h-5 w-5 text-primary" />
            </div>
            <p className="text-2xl font-bold text-foreground">{tips.length}</p>
            <p className="text-xs text-muted-foreground">Total Tips</p>
          </div>
        </motion.div>

        {/* Recent Tips */}
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.4 }}
          className="rounded-xl border border-border bg-card"
        >
          <div className="flex items-center gap-2 border-b border-border bg-secondary/50 p-4">
            <History className="h-5 w-5 text-primary" />
            <h2 className="font-display text-lg text-foreground">Recent Tips</h2>
          </div>
          <div className="divide-y divide-border">
            {tips.length === 0 ? (
              <div className="p-8 text-center">
                <Coffee className="mx-auto mb-3 h-10 w-10 text-muted-foreground/50" />
                <p className="text-sm text-muted-foreground">No tips yet. Be the first!</p>
              </div>
            ) : (
              tips.map((tip) => (
                <div key={tip.id} className="flex items-center justify-between p-4">
                  <div className="flex items-center gap-3">
                    <div className="flex h-10 w-10 items-center justify-center rounded-full bg-primary/10">
                      <Heart className="h-4 w-4 text-primary" />
                    </div>
                    <div>
                      <p className="font-medium text-foreground">
                        {tip.amount} {tip.token}
                      </p>
                      {tip.message && (
                        <p className="text-xs text-muted-foreground truncate max-w-[200px]">"{tip.message}"</p>
                      )}
                    </div>
                  </div>
                  <div className="text-right">
                    <p className="text-xs text-muted-foreground">{formatTime(tip.timestamp)}</p>
                    {tip.from && (
                      <p className="text-xs text-muted-foreground">from @{tip.from}</p>
                    )}
                  </div>
                </div>
              ))
            )}
          </div>
        </motion.div>
      </div>
      <Footer />
    </div>
  );
}
