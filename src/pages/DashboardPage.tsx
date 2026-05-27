import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { ArrowUpRight, ArrowDownLeft, Clock, Copy, ExternalLink, Send, Search, Filter, BarChart3, Zap, FileText, Users, RefreshCw, Loader2, QrCode, UserCircle, Wallet, Plus, Star } from "lucide-react";
import { useApp } from "@/contexts/AppContext";
import { useFavorites } from "@/hooks/useFavorites";
import type { Transaction } from "@/hooks/useMockData";
import AppHeader from "@/components/AppHeader";
import Footer from "@/components/Footer";
import { Link } from "react-router-dom";
import { toast } from "sonner";
import WithdrawModal from "@/components/WithdrawModal";
import ReceiveModal from "@/components/ReceiveModal";
import TransactionDetailModal from "@/components/TransactionDetailModal";
import ImportWalletModal from "@/components/ImportWalletModal";

function formatTime(date: Date) {
  const diff = Date.now() - date.getTime();
  const hours = Math.floor(diff / 3600000);
  if (hours < 1) return "Just now";
  if (hours < 24) return `${hours}h ago`;
  return `${Math.floor(hours / 24)}d ago`;
}

function TxIcon({ type }: { type: Transaction["type"] }) {
  if (type === "sent") return <ArrowUpRight className="h-4 w-4" />;
  if (type === "claimed") return <ArrowDownLeft className="h-4 w-4" />;
  return <Clock className="h-4 w-4" />;
}

type StatusFilter = "all" | "sent" | "claimed" | "pending" | "starred";
type TokenFilter = "all" | "USDC" | "USDT" | "G$";

export default function DashboardPage() {
  const { isLoggedIn, login, wallet, walletAddress, transactions, transactionsLoading, refreshTransactions } = useApp();
  const { isTransactionStarred, toggleStarTransaction } = useFavorites();
  const [statusFilter, setStatusFilter] = useState<StatusFilter>("all");
  const [tokenFilter, setTokenFilter] = useState<TokenFilter>("all");
  const [searchQuery, setSearchQuery] = useState("");
  const [withdrawOpen, setWithdrawOpen] = useState(false);
  const [selectedTx, setSelectedTx] = useState<Transaction | null>(null);
  const [showReceive, setShowReceive] = useState(false);
  const [importWalletOpen, setImportWalletOpen] = useState(false);
  const [importedWallets, setImportedWallets] = useState<string[]>([]);
  const [activeWallet, setActiveWallet] = useState<string | null>(null);

  const handleImportWallet = (address: string) => {
    setImportedWallets([...importedWallets, address]);
    setActiveWallet(address);
    toast.success(`Wallet ${address.slice(0, 6)}...${address.slice(-4)} imported`);
  };

  // Refresh transactions when dashboard becomes visible
  useEffect(() => {
    if (isLoggedIn) {
      refreshTransactions();
      
      // Also refresh when tab becomes visible again
      const handleVisibilityChange = () => {
        if (!document.hidden && isLoggedIn) {
          refreshTransactions();
        }
      };
      
      document.addEventListener('visibilitychange', handleVisibilityChange);
      return () => document.removeEventListener('visibilitychange', handleVisibilityChange);
    }
  }, [isLoggedIn, refreshTransactions]);

  if (!isLoggedIn) {
    return (
      <div className="min-h-screen bg-background">
        <AppHeader />
        <div className="flex min-h-[80vh] flex-col items-center justify-center px-4">
          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="text-center">
            <h2 className="mb-3 font-display text-2xl text-foreground sm:text-3xl">Sign in to view your dashboard</h2>
            <p className="mb-6 text-sm text-muted-foreground sm:text-base">Track payments, view balances, and manage your wallet.</p>
            <button onClick={login} className="inline-flex items-center gap-2 rounded-lg bg-primary px-6 py-3 font-semibold text-primary-foreground shadow-glow transition-opacity hover:opacity-90">
              Sign In
            </button>
          </motion.div>
        </div>
        <Footer />
      </div>
    );
  }

  const filtered = transactions.filter((tx) => {
    if (statusFilter === "starred") {
      return isTransactionStarred(tx.id);
    }
    if (statusFilter !== "all" && tx.type !== statusFilter) return false;
    if (tokenFilter !== "all" && tx.token !== tokenFilter) return false;
    if (searchQuery) {
      const q = searchQuery.toLowerCase();
      return (
        tx.counterparty.toLowerCase().includes(q) ||
        (tx.memo && tx.memo.toLowerCase().includes(q))
      );
    }
    return true;
  });

  const badgeStyles = {
    sent: "bg-destructive/10 text-destructive",
    claimed: "bg-primary/10 text-primary",
    pending: "bg-warning/10 text-warning",
  };

  const iconBg = {
    sent: "bg-destructive/10 text-destructive",
    claimed: "bg-primary/10 text-primary",
    pending: "bg-warning/10 text-warning",
  };

  const statusFilters: { label: string; value: StatusFilter }[] = [
    { label: "All", value: "all" },
    { label: "Starred", value: "starred" },
    { label: "Sent", value: "sent" },
    { label: "Claimed", value: "claimed" },
    { label: "Pending", value: "pending" },
  ];

  return (
    <div className="min-h-screen bg-background">
      <AppHeader />
      <div className="relative container mx-auto max-w-5xl px-4 pt-20 pb-12 sm:pt-24 sm:pb-16">
        {/* Subtle grid background */}
        <div className="pointer-events-none absolute inset-0 opacity-[0.03]" style={{
          backgroundImage: "linear-gradient(hsl(var(--foreground)) 1px, transparent 1px), linear-gradient(90deg, hsl(var(--foreground)) 1px, transparent 1px)",
          backgroundSize: "60px 60px",
        }} />
        {/* Wallet Card */}
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}
          className="mb-4 overflow-hidden rounded-xl border border-border bg-card p-4 shadow-card sm:mb-6 sm:rounded-2xl sm:p-6"
        >
          <div className="flex flex-col gap-1 sm:flex-row sm:items-center sm:justify-between">
            <p className="text-sm text-muted-foreground">Overall Balance</p>
            <button
              onClick={() => { navigator.clipboard.writeText("0x1a2B3c4D5e6F7a8B9c0D1e2F3a4B5c6D7e8F9a4E"); toast.success("Wallet address copied!"); }}
              className="flex items-center gap-1.5 text-xs text-muted-foreground hover:text-foreground transition-colors cursor-pointer"
            >
              {wallet.address}
              <Copy className="h-3 w-3" />
            </button>
          </div>
          <h2 className="mt-1 font-display text-3xl text-foreground sm:text-4xl">
            ${wallet.totalBalanceUSD.toLocaleString("en", { minimumFractionDigits: 2 })}
          </h2>
          <p className="mt-1 text-xs text-muted-foreground">
            Across {wallet.networkBalances.length} networks · <Link to="/assets" className="text-primary hover:underline">View breakdown</Link>
          </p>

          <div className="mt-4 grid grid-cols-2 gap-2 sm:mt-5 sm:grid-cols-4 sm:gap-3">
            <div className="rounded-lg border border-border bg-secondary/50 p-3 sm:rounded-xl sm:p-4">
              <p className="text-xs text-muted-foreground">USDC</p>
              <p className="mt-1 text-base font-semibold text-foreground sm:text-lg">${wallet.balanceUSDC.toFixed(2)}</p>
            </div>
            <div className="rounded-lg border border-border bg-secondary/50 p-3 sm:rounded-xl sm:p-4">
              <p className="text-xs text-muted-foreground">USDT</p>
              <p className="mt-1 text-base font-semibold text-foreground sm:text-lg">${wallet.balanceUSDT.toFixed(2)}</p>
            </div>
            <Link to="/assets" className="rounded-lg border border-border bg-secondary/50 p-3 text-center transition-colors hover:bg-secondary sm:rounded-xl sm:p-4">
              <p className="text-xs text-muted-foreground">Networks</p>
              <p className="mt-1 text-base font-semibold text-primary sm:text-lg">{wallet.networkBalances.length}</p>
            </Link>
          </div>

          <div className="mt-4 flex gap-2 sm:mt-5">
            <Link to="/send" className="flex flex-1 items-center justify-center gap-2 rounded-lg bg-primary py-2.5 text-sm font-semibold text-primary-foreground shadow-glow transition-opacity hover:opacity-90 sm:rounded-xl sm:py-3">
              <Send className="h-4 w-4" /> Send
            </Link>
            <button
              onClick={() => setShowReceive(true)}
              className="flex flex-1 items-center justify-center gap-2 rounded-lg border border-border py-2.5 text-sm font-medium text-foreground transition-colors hover:bg-secondary sm:rounded-xl sm:py-3"
            >
              <QrCode className="h-4 w-4" /> Receive
            </button>
            <button
              onClick={() => setWithdrawOpen(true)}
              className="flex flex-1 items-center justify-center gap-2 rounded-lg border border-border py-2.5 text-sm font-medium text-foreground transition-colors hover:bg-secondary sm:rounded-xl sm:py-3"
            >
              <ExternalLink className="h-4 w-4" /> Withdraw
            </button>
          </div>

          {/* Imported Wallets Section */}
          <div className="mt-4 flex items-center gap-2 overflow-x-auto pb-2">
            <button
              onClick={() => setImportWalletOpen(true)}
              className="flex items-center gap-1.5 rounded-lg border border-dashed border-border px-3 py-1.5 text-xs font-medium text-muted-foreground hover:border-primary hover:text-primary whitespace-nowrap"
            >
              <Plus className="h-3 w-3" /> Import Wallet
            </button>
            {importedWallets.map((addr) => (
              <button
                key={addr}
                onClick={() => setActiveWallet(addr)}
                className={`flex items-center gap-1.5 rounded-lg px-3 py-1.5 text-xs font-medium whitespace-nowrap transition-colors ${
                  activeWallet === addr 
                    ? "bg-primary text-primary-foreground" 
                    : "border border-border text-muted-foreground hover:text-foreground"
                }`}
              >
                <Wallet className="h-3 w-3" />
                {addr.slice(0, 6)}...{addr.slice(-4)}
              </button>
            ))}
          </div>
        </motion.div>

        {/* Receive Modal */}
        <ReceiveModal 
          open={showReceive} 
          onClose={() => setShowReceive(false)} 
          walletAddress={walletAddress || wallet.address}
        />

        {/* Quick links */}
        <div className="mb-4 grid grid-cols-2 gap-3 sm:mb-6 sm:grid-cols-4">
          <Link to="/analytics" className="flex items-center justify-center gap-2 rounded-lg border border-border bg-card py-3 text-sm font-medium text-foreground shadow-soft transition-colors hover:bg-secondary sm:rounded-xl">
            <BarChart3 className="h-4 w-4 text-primary" /> Analytics
          </Link>
          <Link to="/streaming" className="flex items-center justify-center gap-2 rounded-lg border border-border bg-card py-3 text-sm font-medium text-foreground shadow-soft transition-colors hover:bg-secondary sm:rounded-xl">
            <Zap className="h-4 w-4 text-primary" /> Streams
          </Link>
          <Link to="/batch" className="flex items-center justify-center gap-2 rounded-lg border border-border bg-card py-3 text-sm font-medium text-foreground shadow-soft transition-colors hover:bg-secondary sm:rounded-xl">
            <Users className="h-4 w-4 text-primary" /> Batch
          </Link>
          <Link to="/request" className="flex items-center justify-center gap-2 rounded-lg border border-border bg-card py-3 text-sm font-medium text-foreground shadow-soft transition-colors hover:bg-secondary sm:rounded-xl">
            <FileText className="h-4 w-4 text-primary" /> Requests
          </Link>
        </div>

        {/* Filters & Search */}
        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.3 }} className="mb-4 space-y-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <h3 className="font-display text-lg text-foreground sm:text-xl">Recent Activity</h3>
              <button
                onClick={() => refreshTransactions()}
                className="rounded-full p-1 text-muted-foreground transition-colors hover:bg-secondary hover:text-foreground"
                title="Refresh"
              >
                <RefreshCw className={`h-3.5 w-3.5 ${transactionsLoading ? "animate-spin" : ""}`} />
              </button>
            </div>
            <div className="flex items-center gap-1">
              <Filter className="h-3.5 w-3.5 text-muted-foreground" />
              <select
                value={tokenFilter}
                onChange={(e) => setTokenFilter(e.target.value as TokenFilter)}
                className="bg-transparent text-xs text-muted-foreground focus:outline-none cursor-pointer"
              >
                <option value="all">All Tokens</option>
                <option value="USDC">USDC</option>
                <option value="G$">G$</option>
              </select>
            </div>
          </div>

          {/* Search */}
          <div className="relative">
            <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
            <input
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search by name or memo..."
              className="w-full rounded-lg border border-border bg-background py-2 pl-9 pr-3 text-sm text-foreground placeholder:text-muted-foreground/50 focus:outline-none focus:ring-2 focus:ring-ring sm:rounded-xl sm:py-2.5"
            />
          </div>

          {/* Status pills */}
          <div className="flex gap-1.5 overflow-x-auto pb-1">
            {statusFilters.map((sf) => (
              <button
                key={sf.value}
                onClick={() => setStatusFilter(sf.value)}
                className={`shrink-0 rounded-full px-3 py-1 text-xs font-medium transition-colors ${
                  statusFilter === sf.value
                    ? "bg-primary text-primary-foreground"
                    : "border border-border text-muted-foreground hover:bg-secondary hover:text-foreground"
                }`}
              >
                {sf.label}
              </button>
            ))}
          </div>
        </motion.div>

        {/* Transactions */}
        <div className="space-y-2">
          {transactionsLoading && filtered.length === 0 ? (
            <div className="space-y-2">
              {[1, 2, 3].map((i) => (
                <div key={i} className="flex items-center gap-3 rounded-lg border border-border bg-card p-3 sm:rounded-xl sm:p-4 animate-pulse">
                  <div className="h-8 w-8 rounded-full bg-muted sm:h-9 sm:w-9" />
                  <div className="flex-1 space-y-2">
                    <div className="h-4 w-32 rounded bg-muted" />
                    <div className="h-3 w-20 rounded bg-muted" />
                  </div>
                  <div className="h-4 w-16 rounded bg-muted" />
                </div>
              ))}
            </div>
          ) : filtered.length === 0 ? (
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }}
              className="rounded-xl border border-border bg-card p-8 text-center"
            >
              <p className="text-sm text-muted-foreground">No transactions found.</p>
              {searchQuery && (
                <button onClick={() => setSearchQuery("")} className="mt-2 text-xs text-primary hover:underline">
                  Clear search
                </button>
              )}
            </motion.div>
          ) : (
            filtered.map((tx, i) => {
              const starred = isTransactionStarred(tx.id);
              return (
              <motion.div key={tx.id} initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 + i * 0.05 }}
                className="group flex items-center gap-3 rounded-lg border border-border bg-card p-3 transition-colors hover:bg-secondary/30 sm:rounded-xl sm:p-4"
              >
                <div className={`flex h-8 w-8 flex-shrink-0 items-center justify-center rounded-full sm:h-9 sm:w-9 ${iconBg[tx.type]}`}>
                  <TxIcon type={tx.type} />
                </div>
                <div 
                  className="min-w-0 flex-1 cursor-pointer"
                  onClick={() => setSelectedTx(tx)}
                >
                  <div className="flex items-center gap-2">
                    <p className="truncate text-sm font-medium text-foreground">{tx.counterparty}</p>
                    <span className={`hidden rounded-full px-2 py-0.5 text-xs font-medium capitalize sm:inline-block ${badgeStyles[tx.type]}`}>{tx.type}</span>
                    {starred && <Star className="h-3 w-3 fill-yellow-400 text-yellow-400" />}
                  </div>
                  <p className="text-xs text-muted-foreground">{tx.memo || formatTime(tx.timestamp)}</p>
                </div>
                <div className="flex items-center gap-2">
                  <div className="text-right">
                    <p className={`text-sm font-semibold ${tx.type === "claimed" ? "text-primary" : "text-foreground"}`}>
                      {tx.type === "claimed" ? "+" : "-"}{tx.amount} {tx.token}
                    </p>
                  </div>
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      toggleStarTransaction(tx.id);
                      toast.success(starred ? "Removed from favorites" : "Added to favorites");
                    }}
                    className="flex h-8 w-8 flex-shrink-0 items-center justify-center rounded-full text-muted-foreground transition-colors hover:bg-secondary hover:text-yellow-500"
                  >
                    <Star className={`h-4 w-4 ${starred ? "fill-yellow-400 text-yellow-400" : ""}`} />
                  </button>
                </div>
              </motion.div>
              );
            })
          )}
        </div>
      </div>
      <Footer />
      <WithdrawModal open={withdrawOpen} onClose={() => setWithdrawOpen(false)} balanceUSDC={wallet.balanceUSDC} balanceUSDT={wallet.balanceUSDT} />
      <TransactionDetailModal transaction={selectedTx} open={!!selectedTx} onClose={() => setSelectedTx(null)} />
      <ImportWalletModal open={importWalletOpen} onClose={() => setImportWalletOpen(false)} onImport={handleImportWallet} />
    </div>
  );
}
