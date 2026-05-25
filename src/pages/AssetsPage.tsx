import { useState } from "react";
import { motion } from "framer-motion";
import { ArrowLeft, Wallet, RefreshCw, ExternalLink, Layers, CircleDollarSign, Coins, TrendingUp, ChevronRight, AlertCircle, CheckCircle2 } from "lucide-react";
import AppHeader from "@/components/AppHeader";
import Footer from "@/components/Footer";
import { useApp } from "@/contexts/AppContext";
import { Link } from "react-router-dom";
import { chainConfigs } from "@/lib/chains";

interface AssetCardProps {
  title: string;
  amount: number;
  symbol: string;
  color: string;
  icon: React.ReactNode;
  isTotal?: boolean;
}

function AssetCard({ title, amount, symbol, color, icon, isTotal }: AssetCardProps) {
  return (
    <motion.div
      whileHover={{ scale: 1.02 }}
      className={`relative overflow-hidden rounded-xl border p-4 ${
        isTotal
          ? "border-primary/50 bg-gradient-to-br from-primary/5 to-primary/10"
          : "border-border bg-card"
      }`}
    >
      <div className="flex items-start justify-between">
        <div>
          <p className="text-xs text-muted-foreground">{title}</p>
          <p className="mt-1 text-2xl font-bold text-foreground">
            ${amount.toLocaleString("en", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
          </p>
          <p className="text-xs text-muted-foreground">{symbol}</p>
        </div>
        <div
          className="flex h-10 w-10 items-center justify-center rounded-full"
          style={{ backgroundColor: color + "20", color }}
        >
          {icon}
        </div>
      </div>
    </motion.div>
  );
}

interface NetworkCardProps {
  network: {
    chainId: number;
    networkName: string;
    usdc: number;
    usdt: number;
    nativeToken: number;
    nativeSymbol: string;
  };
  totalUSD: number;
}

function NetworkCard({ network, totalUSD }: NetworkCardProps) {
  const config = chainConfigs[network.chainId];
  const networkTotal = network.usdc + network.usdt;
  const percentage = totalUSD > 0 ? (networkTotal / totalUSD) * 100 : 0;

  // Determine network color and icon based on name
  const getNetworkInfo = (name: string) => {
    if (name.includes("Base")) {
      return {
        color: "#0052FF",
        gradient: "from-blue-500/10 to-blue-600/10",
        icon: "🔵",
        shortName: "Base",
      };
    }
    return { color: "#666", gradient: "from-gray-500/10 to-gray-600/10", icon: "⚪", shortName: name };
  };

  const networkInfo = getNetworkInfo(network.networkName);

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      whileHover={{ scale: 1.01 }}
      className={`rounded-xl border border-border bg-gradient-to-br ${networkInfo.gradient} p-4 transition-all hover:border-border/80 hover:shadow-lg`}
    >
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div
            className="flex h-12 w-12 items-center justify-center rounded-full text-xl"
            style={{ backgroundColor: networkInfo.color + "20" }}
          >
            {networkInfo.icon}
          </div>
          <div>
            <h3 className="font-semibold text-foreground">{networkInfo.shortName}</h3>
            <p className="text-xs text-muted-foreground">{network.networkName.includes("Testnet") ? "Testnet" : "Mainnet"}</p>
          </div>
        </div>
        <div className="text-right">
          <p className="font-bold text-foreground">
            ${networkTotal.toLocaleString("en", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
          </p>
          <p className="text-xs text-muted-foreground">{percentage.toFixed(1)}% of total</p>
        </div>
      </div>

      {/* Progress bar */}
      <div className="mt-4 h-2 w-full overflow-hidden rounded-full bg-secondary">
        <motion.div
          initial={{ width: 0 }}
          animate={{ width: `${percentage}%` }}
          transition={{ duration: 0.5, delay: 0.2 }}
          className="h-full rounded-full"
          style={{ backgroundColor: networkInfo.color }}
        />
      </div>

      {/* Token breakdown */}
      <div className="mt-4 grid grid-cols-3 gap-2">
        <div className="rounded-lg bg-card/50 p-2 text-center">
          <p className="text-xs text-muted-foreground">USDC</p>
          <p className="text-sm font-semibold text-foreground">{network.usdc.toFixed(2)}</p>
        </div>
        <div className="rounded-lg bg-card/50 p-2 text-center">
          <p className="text-xs text-muted-foreground">USDT</p>
          <p className="text-sm font-semibold text-foreground">{network.usdt.toFixed(2)}</p>
        </div>
        <div className="rounded-lg bg-card/50 p-2 text-center">
          <p className="text-xs text-muted-foreground">{network.nativeSymbol}</p>
          <p className="text-sm font-semibold text-foreground">{network.nativeToken.toFixed(4)}</p>
        </div>
      </div>

      {/* Action buttons */}
      <div className="mt-4 flex gap-2">
        <Link
          to="/send"
          className="flex flex-1 items-center justify-center gap-1.5 rounded-lg border border-border py-2 text-xs font-medium text-foreground transition-colors hover:bg-secondary"
        >
          Send <ChevronRight className="h-3 w-3" />
        </Link>
        <a
          href={config?.blockExplorer}
          target="_blank"
          rel="noopener noreferrer"
          className="flex flex-1 items-center justify-center gap-1.5 rounded-lg border border-border py-2 text-xs font-medium text-foreground transition-colors hover:bg-secondary"
        >
          Explorer <ExternalLink className="h-3 w-3" />
        </a>
      </div>
    </motion.div>
  );
}

export default function AssetsPage() {
  const { isLoggedIn, login, wallet, refreshBalances, selectedNetwork } = useApp();
  const [isRefreshing, setIsRefreshing] = useState(false);

  const handleRefresh = async () => {
    setIsRefreshing(true);
    await refreshBalances();
    setTimeout(() => setIsRefreshing(false), 500);
  };

  if (!isLoggedIn) {
    return (
      <div className="min-h-screen bg-background">
        <AppHeader />
        <div className="flex min-h-[80vh] flex-col items-center justify-center px-4">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="text-center"
          >
            <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-primary/10">
              <Wallet className="h-8 w-8 text-primary" />
            </div>
            <h2 className="mb-3 font-display text-2xl text-foreground sm:text-3xl">Sign in to view your assets</h2>
            <p className="mb-6 text-sm text-muted-foreground">
              View your balances across all supported networks.
            </p>
            <button
              onClick={login}
              className="inline-flex items-center gap-2 rounded-lg bg-primary px-6 py-3 font-semibold text-primary-foreground shadow-glow transition-opacity hover:opacity-90"
            >
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
      <div className="container mx-auto max-w-5xl px-4 pt-20 pb-12 sm:pt-24 sm:pb-16">
        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          className="mb-6 flex items-center justify-between"
        >
          <div className="flex items-center gap-3">
            <Link
              to="/"
              className="flex h-8 w-8 items-center justify-center rounded-full border border-border text-muted-foreground transition-colors hover:bg-secondary hover:text-foreground"
            >
              <ArrowLeft className="h-4 w-4" />
            </Link>
            <h1 className="font-display text-2xl text-foreground sm:text-3xl">Your Assets</h1>
          </div>
          <button
            onClick={handleRefresh}
            className={`flex h-9 w-9 items-center justify-center rounded-full border border-border text-muted-foreground transition-colors hover:bg-secondary hover:text-foreground ${
              isRefreshing ? "animate-spin" : ""
            }`}
          >
            <RefreshCw className="h-4 w-4" />
          </button>
        </motion.div>

        {/* Overall Balance Card */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className="mb-6 overflow-hidden rounded-2xl border border-primary/50 bg-gradient-to-br from-primary/5 via-primary/10 to-background p-6"
        >
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-muted-foreground">Total Balance</p>
              <h2 className="mt-1 font-display text-4xl font-bold text-foreground sm:text-5xl">
                ${wallet.totalBalanceUSD.toLocaleString("en", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
              </h2>
              <p className="mt-2 text-xs text-muted-foreground">
                Across {wallet.networkBalances.length} networks
              </p>
            </div>
            <div className="flex h-16 w-16 items-center justify-center rounded-full bg-primary/10 text-4xl">
              💰
            </div>
          </div>

          {/* Quick stats */}
          <div className="mt-6 grid grid-cols-3 gap-4">
            <div className="rounded-xl bg-card/50 p-3 text-center backdrop-blur-sm">
              <p className="text-xs text-muted-foreground">USDC</p>
              <p className="font-semibold text-foreground">{wallet.balanceUSDC.toFixed(2)}</p>
            </div>
            <div className="rounded-xl bg-card/50 p-3 text-center backdrop-blur-sm">
              <p className="text-xs text-muted-foreground">USDT</p>
              <p className="font-semibold text-foreground">{wallet.balanceUSDT.toFixed(2)}</p>
            </div>
            <div className="rounded-xl bg-card/50 p-3 text-center backdrop-blur-sm">
              <p className="text-xs text-muted-foreground">Networks</p>
              <p className="font-semibold text-foreground">{wallet.networkBalances.length}</p>
            </div>
          </div>
        </motion.div>

        {/* Asset Summary */}
        <motion.h2
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.2 }}
          className="mb-4 font-display text-lg text-foreground"
        >
          By Network
        </motion.h2>

        {/* Network Cards */}
        <div className="space-y-3">
          {wallet.networkBalances.length === 0 ? (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              className="rounded-xl border border-border bg-card p-8 text-center"
            >
              <AlertCircle className="mx-auto mb-4 h-12 w-12 text-muted-foreground" />
              <p className="text-sm text-muted-foreground">No balances found yet.</p>
              <p className="mt-2 text-xs text-muted-foreground">
                Connect to supported networks to see your assets.
              </p>
            </motion.div>
          ) : (
            wallet.networkBalances.map((network, index) => (
              <NetworkCard
                key={network.chainId}
                network={network}
                totalUSD={wallet.totalBalanceUSD}
              />
            ))
          )}
        </div>

        {/* Asset Education */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.4 }}
          className="mt-8 rounded-xl border border-border bg-card p-4"
        >
          <div className="flex items-start gap-3">
            <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-primary/10">
              <CheckCircle2 className="h-4 w-4 text-primary" />
            </div>
            <div>
              <h3 className="font-medium text-foreground">How multi-network works</h3>
              <p className="mt-1 text-sm text-muted-foreground">
                Your assets are spread across different blockchain networks. Each network has its own
                USDC and USDT tokens. You can send and receive on any supported network.
              </p>
              <div className="mt-3 flex flex-wrap gap-2">
                <span className="inline-flex items-center gap-1 rounded-full bg-blue-100 px-2 py-1 text-xs text-blue-700 dark:bg-blue-900/30 dark:text-blue-300">
                  🔵 Base (Ethereum L2)
                </span>

              </div>
            </div>
          </div>
        </motion.div>
      </div>
      <Footer />
    </div>
  );
}
