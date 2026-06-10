import { motion } from "framer-motion";
import { TrendingUp, ArrowUpRight, ArrowDownLeft, Clock, Loader2 } from "lucide-react";
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, PieChart, Pie, Cell, AreaChart, Area } from "recharts";
import AppHeader from "@/components/AppHeader";
import Footer from "@/components/Footer";
import { useApp } from "@/contexts/AppContext";
import { Link } from "react-router-dom";
import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";

export default function AnalyticsPage() {
  const { isLoggedIn, login, walletAddress } = useApp();
  const [loading, setLoading] = useState(true);
  const [hasData, setHasData] = useState(false);
  const [stats, setStats] = useState({
    totalVolume: 0,
    totalPayments: 0,
    claimRate: 0,
    avgClaimTime: 0,
  });
  const [volumeChartData, setVolumeChartData] = useState<{name: string, volume: number}[]>([]);
  const [claimRateData, setClaimRateData] = useState<{name: string, rate: number}[]>([]);
  const [tokenDistribution, setTokenDistribution] = useState<{name: string, value: number, color: string}[]>([]);
  const [topRecipients, setTopRecipients] = useState<{name: string, amount: number, count: number}[]>([]);

  useEffect(() => {
    if (isLoggedIn && walletAddress) {
      fetchAnalytics();
    } else if (!isLoggedIn) {
      setLoading(false);
    }
  }, [isLoggedIn, walletAddress]);

  const fetchAnalytics = async () => {
    try {
      setLoading(true);
      const { data: { user } } = await supabase.auth.getUser();
      if (!user && !walletAddress) {
        setLoading(false);
        return;
      }

      const userEmail = user?.email || "";

      const { data: payments, error } = await supabase
        .from("payments")
        .select("*")
        .or(`sender_wallet.eq.${walletAddress},recipient_email.eq.${userEmail}`)
        .order("created_at", { ascending: false });

      if (error) {
        console.error("Error fetching analytics:", error);
        setLoading(false);
        return;
      }

      if (!payments || payments.length === 0) {
        setHasData(false);
        setLoading(false);
        return;
      }

      setHasData(true);

      const totalVolume = payments.reduce((sum, p) => sum + Number(p.amount || 0), 0) / 1000000;
      const totalPayments = payments.length;
      const claimedPayments = payments.filter(p => p.status === "claimed").length;
      const claimRate = totalPayments > 0 ? Math.round((claimedPayments / totalPayments) * 100) : 0;

      const claimedWithTime = payments.filter(p => p.status === "claimed" && p.claimed_at);
      const avgClaimTime = claimedWithTime.length > 0
        ? claimedWithTime.reduce((sum, p) => {
            const created = new Date(p.created_at).getTime();
            const claimed = new Date(p.claimed_at).getTime();
            return sum + (claimed - created);
          }, 0) / claimedWithTime.length / 3600000
        : 0;

      const now = new Date();
      const last7Days: Record<string, number> = {};
      for (let i = 6; i >= 0; i--) {
        const date = new Date(now);
        date.setDate(date.getDate() - i);
        const dayName = date.toLocaleDateString("en", { weekday: "short" });
        last7Days[dayName] = 0;
      }

      payments.forEach(p => {
        const created = new Date(p.created_at);
        const dayName = created.toLocaleDateString("en", { weekday: "short" });
        if (last7Days[dayName] !== undefined) {
          last7Days[dayName] += Number(p.amount || 0) / 1000000;
        }
      });

      const volumeDataFormatted = Object.entries(last7Days).map(([name, volume]) => ({
        name,
        volume: Math.round(volume * 100) / 100,
      }));

      const recipientAmounts: Record<string, number> = {};
      const recipientCounts: Record<string, number> = {};
      
      payments.forEach(p => {
        if (p.sender_wallet?.toLowerCase() !== walletAddress?.toLowerCase()) {
          const recipient = p.recipient_email || "Unknown";
          recipientAmounts[recipient] = (recipientAmounts[recipient] || 0) + Number(p.amount || 0) / 1000000;
          recipientCounts[recipient] = (recipientCounts[recipient] || 0) + 1;
        }
      });

      const topRecipientsFormatted = Object.entries(recipientAmounts)
        .map(([name, amount]) => ({ name, amount, count: recipientCounts[name] }))
        .sort((a, b) => b.amount - a.amount)
        .slice(0, 5);

      const claimRateTrend: {name: string, rate: number}[] = [];
      for (let i = 5; i >= 0; i--) {
        const weekStart = new Date(now);
        weekStart.setDate(weekStart.getDate() - (i * 7) - 7);
        const weekEnd = new Date(now);
        weekEnd.setDate(weekEnd.getDate() - (i * 7));
        
        const weekPayments = payments.filter(p => {
          const created = new Date(p.created_at);
          return created >= weekStart && created < weekEnd;
        });
        
        const claimed = weekPayments.filter(p => p.status === "claimed").length;
        const rate = weekPayments.length > 0 ? Math.round((claimed / weekPayments.length) * 100) : 0;
        
        claimRateTrend.push({ name: `Week ${6 - i}`, rate });
      }

      const tokenCounts: Record<string, number> = {};
      payments.forEach(p => {
        const token = p.token || "USDC";
        tokenCounts[token] = (tokenCounts[token] || 0) + 1;
      });
      const totalTokens = Object.values(tokenCounts).reduce((a, b) => a + b, 0);
      const tokenDist = Object.entries(tokenCounts).map(([name, count], i) => ({
        name,
        value: Math.round((count / totalTokens) * 100),
        color: i === 0 ? "hsl(250, 65%, 52%)" : "hsl(155, 70%, 42%)",
      }));

      setStats({
        totalVolume,
        totalPayments,
        claimRate,
        avgClaimTime: Math.round(avgClaimTime * 10) / 10,
      });
      setVolumeChartData(volumeDataFormatted);
      setClaimRateData(claimRateTrend);
      setTokenDistribution(tokenDist);
      setTopRecipients(topRecipientsFormatted);

    } catch (error) {
      console.error("Error in fetchAnalytics:", error);
    } finally {
      setLoading(false);
    }
  };

  const formatAmount = (amount: number) => {
    if (amount >= 1000000) return `$${(amount / 1000000).toFixed(1)}M`;
    if (amount >= 1000) return `$${(amount / 1000).toFixed(1)}K`;
    return `$${amount.toFixed(2)}`;
  };

  const displayStats = [
    { label: "Total Volume", value: hasData ? formatAmount(stats.totalVolume) : "—", icon: TrendingUp },
    { label: "Payments Sent", value: hasData ? stats.totalPayments.toString() : "—", icon: ArrowUpRight },
    { label: "Claim Rate", value: hasData ? `${stats.claimRate}%` : "—", icon: ArrowDownLeft },
    { label: "Avg. Claim Time", value: hasData ? `${stats.avgClaimTime}h` : "—", icon: Clock },
  ];

  if (!isLoggedIn) {
    return (
      <div className="min-h-screen bg-background">
        <AppHeader />
        <div className="flex min-h-[80vh] flex-col items-center justify-center px-4">
          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="text-center">
            <h2 className="mb-3 font-display text-2xl text-foreground sm:text-3xl">Sign in to view analytics</h2>
            <p className="mb-6 text-sm text-muted-foreground">See your payment volume, claim rates, and more.</p>
            <button onClick={login} className="rounded-lg bg-primary px-6 py-3 font-semibold text-primary-foreground shadow-glow transition-opacity hover:opacity-90">
              Sign In
            </button>
          </motion.div>
        </div>
        <Footer />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      <AppHeader />
      <div className="relative container mx-auto max-w-5xl px-4 pt-20 pb-12 sm:pt-24 sm:pb-16">
        {/* Subtle grid background */}
        <div className="pointer-events-none absolute inset-0 opacity-[0.03]" style={{
          backgroundImage: "linear-gradient(hsl(var(--foreground)) 1px, transparent 1px), linear-gradient(90deg, hsl(var(--foreground)) 1px, transparent 1px)",
          backgroundSize: "60px 60px",
        }} />
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}>
          <div className="flex items-center justify-between mb-6">
            <div>
              <h1 className="font-display text-2xl text-foreground sm:text-3xl">Analytics</h1>
              <p className="mt-1 text-sm text-muted-foreground">Track your payment performance</p>
            </div>
            <Link to="/dashboard" className="text-sm text-primary hover:underline">← Dashboard</Link>
          </div>
        </motion.div>

        {/* Stats Grid */}
        {loading ? (
          <div className="flex items-center justify-center py-12">
            <Loader2 className="h-8 w-8 animate-spin text-primary" />
          </div>
        ) : (
        <div className="mb-6 grid grid-cols-2 gap-3 sm:gap-4 lg:grid-cols-4">
          {displayStats.map((s, i) => (
            <motion.div
              key={s.label}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: i * 0.05 }}
              className="rounded-xl border border-border bg-card p-4 shadow-soft"
            >
              <div className="flex items-center justify-between">
                <p className="text-xs text-muted-foreground">{s.label}</p>
                <s.icon className="h-4 w-4 text-muted-foreground" />
              </div>
              <p className="mt-2 font-display text-xl text-foreground sm:text-2xl">{s.value}</p>
            </motion.div>
          ))}
        </div>
        )}

        {!hasData && !loading ? (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }}
            className="flex flex-col items-center justify-center rounded-xl border border-border bg-card p-12 text-center"
          >
            <TrendingUp className="mb-4 h-12 w-12 text-muted-foreground/50" />
            <h3 className="mb-2 text-lg font-semibold text-foreground">No analytics data yet</h3>
            <p className="max-w-md text-sm text-muted-foreground">
              Send your first payment to see volume trends, claim rates, and recipient stats here.
            </p>
          </motion.div>
        ) : (
        <>
        {/* Charts Row */}
        {hasData && <div className="mb-6 grid gap-4 sm:gap-6 lg:grid-cols-2">
          {/* Volume Chart */}
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.2 }}
            className="rounded-xl border border-border bg-card p-4 shadow-soft sm:p-6"
          >
            <h3 className="mb-4 text-sm font-semibold text-foreground">Payment Volume (7d)</h3>
            <ResponsiveContainer width="100%" height={200}>
              <BarChart data={volumeChartData}>
                <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                <XAxis dataKey="name" tick={{ fontSize: 12 }} stroke="hsl(var(--muted-foreground))" />
                <YAxis tick={{ fontSize: 12 }} stroke="hsl(var(--muted-foreground))" />
                <Tooltip
                  contentStyle={{ background: "hsl(var(--card))", border: "1px solid hsl(var(--border))", borderRadius: "8px", fontSize: "12px" }}
                  formatter={(value: number) => [`$${value}`, "Volume"]}
                />
                <Bar dataKey="volume" fill="hsl(var(--primary))" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </motion.div>

          {/* Claim Rate */}
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.3 }}
            className="rounded-xl border border-border bg-card p-4 shadow-soft sm:p-6"
          >
            <h3 className="mb-4 text-sm font-semibold text-foreground">Claim Rate Trend</h3>
            <ResponsiveContainer width="100%" height={200}>
              <AreaChart data={claimRateData}>
                <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                <XAxis dataKey="name" tick={{ fontSize: 12 }} stroke="hsl(var(--muted-foreground))" />
                <YAxis tick={{ fontSize: 12 }} stroke="hsl(var(--muted-foreground))" />
                <Tooltip
                  contentStyle={{ background: "hsl(var(--card))", border: "1px solid hsl(var(--border))", borderRadius: "8px", fontSize: "12px" }}
                  formatter={(value: number) => [`${value}%`, "Claim Rate"]}
                />
                <Area type="monotone" dataKey="rate" stroke="hsl(var(--primary))" fill="hsl(var(--primary) / 0.1)" strokeWidth={2} />
              </AreaChart>
            </ResponsiveContainer>
          </motion.div>
        </div>}

        {/* Bottom Row */}
        {hasData && <div className="grid gap-4 sm:gap-6 lg:grid-cols-2">
          {/* Token Distribution */}
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.4 }}
            className="rounded-xl border border-border bg-card p-4 shadow-soft sm:p-6"
          >
            <h3 className="mb-4 text-sm font-semibold text-foreground">Token Split</h3>
            <ResponsiveContainer width="100%" height={160}>
              <PieChart>
                <Pie data={tokenDistribution} cx="50%" cy="50%" innerRadius={45} outerRadius={65} dataKey="value" stroke="none">
                  {tokenDistribution.map((entry, i) => (
                    <Cell key={i} fill={entry.color} />
                  ))}
                </Pie>
                <Tooltip
                  contentStyle={{ background: "hsl(var(--card))", border: "1px solid hsl(var(--border))", borderRadius: "8px", fontSize: "12px" }}
                  formatter={(value: number) => [`${value}%`]}
                />
              </PieChart>
            </ResponsiveContainer>
            <div className="flex justify-center gap-4">
              {tokenDistribution.map((t) => (
                <div key={t.name} className="flex items-center gap-1.5">
                  <div className="h-2.5 w-2.5 rounded-full" style={{ background: t.color }} />
                  <span className="text-xs text-muted-foreground">{t.name} {t.value}%</span>
                </div>
              ))}
            </div>
          </motion.div>

          {/* Top Recipients */}
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.5 }}
            className="rounded-xl border border-border bg-card p-4 shadow-soft sm:p-6"
          >
            <h3 className="mb-4 text-sm font-semibold text-foreground">Top Recipients</h3>
            <div className="space-y-3">
              {topRecipients.map((r, i) => (
                <div key={r.name} className="flex items-center gap-3">
                  <span className="flex h-6 w-6 items-center justify-center rounded-full bg-primary/10 text-xs font-bold text-primary">
                    {i + 1}
                  </span>
                  <div className="min-w-0 flex-1">
                    <p className="truncate text-sm text-foreground">{r.name}</p>
                    <p className="text-xs text-muted-foreground">{r.count} payments</p>
                  </div>
                  <p className="text-sm font-semibold text-foreground">${r.amount}</p>
                </div>
              ))}
            </div>
          </motion.div>
        </div>}
        </>
        )}
      </div>
      <Footer />
    </div>
  );
}
