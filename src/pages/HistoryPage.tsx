import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { History, ArrowUpRight, ArrowDownLeft, Clock, Filter, Search, RefreshCw, ExternalLink, DollarSign, Loader2 } from "lucide-react";
import { useApp } from "@/contexts/AppContext";
import AppHeader from "@/components/AppHeader";
import Footer from "@/components/Footer";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";

interface Transaction {
  id: string;
  type: "send" | "receive";
  amount: number;
  token: string;
  status: "pending" | "completed" | "failed" | "refunded";
  recipient_email?: string;
  sender_email?: string;
  recipient_wallet?: string;
  sender_wallet?: string;
  tx_hash?: string;
  memo?: string;
  created_at: string;
  chain_id?: number;
}

type FilterType = "all" | "send" | "receive";
type StatusFilter = "all" | "pending" | "completed" | "failed" | "refunded";

export default function HistoryPage() {
  const { isLoggedIn, login, walletAddress } = useApp();
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [filterType, setFilterType] = useState<FilterType>("all");
  const [statusFilter, setStatusFilter] = useState<StatusFilter>("all");
  const [searchQuery, setSearchQuery] = useState("");

  const fetchTransactions = async () => {
    if (!walletAddress) return;
    
    try {
      setLoading(true);
      
      const { data, error } = await supabase
        .from("payments")
        .select("*")
        .or(`sender_wallet.ilike.${walletAddress.toLowerCase()},recipient_email.ilike.%${walletAddress.toLowerCase()}%`)
        .order("created_at", { ascending: false })
        .limit(100);

      if (error) throw error;

      const formattedTx: Transaction[] = (data || []).map((p: any) => ({
        id: p.id,
        type: p.sender_wallet?.toLowerCase() === walletAddress?.toLowerCase() ? "send" : "receive",
        amount: p.amount,
        token: p.token || "USDC",
        status: p.status === "completed" ? "completed" : 
                p.status === "pending" ? "pending" :
                p.status === "failed" ? "failed" : "refunded",
        recipient_email: p.recipient_email,
        sender_email: p.sender_email,
        tx_hash: p.tx_hash,
        memo: p.memo,
        created_at: p.created_at,
        chain_id: p.chain_id
      }));

      setTransactions(formattedTx);
    } catch (err) {
      console.error("Failed to fetch transactions:", err);
      toast.error("Failed to load transaction history");
    } finally {
      setLoading(false);
    }
  };

  const handleRefresh = async () => {
    setRefreshing(true);
    await fetchTransactions();
    setRefreshing(false);
    toast.success("History refreshed");
  };

  useEffect(() => {
    if (isLoggedIn) {
      fetchTransactions();
    }
  }, [isLoggedIn, walletAddress]);

  const filteredTransactions = transactions.filter((tx) => {
    if (filterType !== "all" && tx.type !== filterType) return false;
    if (statusFilter !== "all" && tx.status !== statusFilter) return false;
    if (searchQuery) {
      const q = searchQuery.toLowerCase();
      return (
        tx.recipient_email?.toLowerCase().includes(q) ||
        tx.sender_email?.toLowerCase().includes(q) ||
        tx.memo?.toLowerCase().includes(q) ||
        tx.tx_hash?.toLowerCase().includes(q)
      );
    }
    return true;
  });

  const totalSent = transactions
    .filter(t => t.type === "send" && t.status === "completed")
    .reduce((sum, t) => sum + t.amount, 0);
  
  const totalReceived = transactions
    .filter(t => t.type === "receive" && t.status === "completed")
    .reduce((sum, t) => sum + t.amount, 0);

  const formatAmount = (amount: number, token: string) => {
    return new Intl.NumberFormat("en-US", {
      style: "currency",
      currency: "USD",
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    }).format(amount / 1000000);
  };

  const formatDate = (dateStr: string) => {
    const date = new Date(dateStr);
    return date.toLocaleDateString("en-US", {
      month: "short",
      day: "numeric",
      year: "numeric",
    });
  };

  const statusColors: Record<string, string> = {
    pending: "text-yellow-500 bg-yellow-500/10",
    completed: "text-green-500 bg-green-500/10",
    failed: "text-red-500 bg-red-500/10",
    refunded: "text-gray-500 bg-gray-500/10",
  };

  if (!isLoggedIn) {
    return (
      <div className="min-h-screen bg-background">
        <AppHeader />
        <div className="flex min-h-[80vh] flex-col items-center justify-center px-4 text-center">
          <div className="mb-6 flex h-20 w-20 items-center justify-center rounded-full bg-primary/10">
            <History className="h-10 w-10 text-primary" />
          </div>
          <h2 className="mb-3 font-display text-2xl text-foreground sm:text-3xl">Transaction History</h2>
          <p className="mb-6 max-w-md text-sm text-muted-foreground">
            View all your past transactions including sends and receives.
          </p>
          <button 
            onClick={login} 
            className="rounded-lg bg-primary px-6 py-3 font-semibold text-primary-foreground shadow-glow hover:opacity-90"
          >
            Sign In to View History
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
        <div className="mb-8 flex items-center justify-between">
          <div>
            <h1 className="font-display text-2xl text-foreground sm:text-3xl">Transaction History</h1>
            <p className="mt-1 text-sm text-muted-foreground">View all your transaction history</p>
          </div>
          <button
            onClick={handleRefresh}
            disabled={refreshing}
            className="flex items-center gap-2 rounded-lg border border-border bg-card px-4 py-2 text-sm font-medium text-foreground hover:bg-accent disabled:opacity-50"
          >
            <RefreshCw className={`h-4 w-4 ${refreshing ? "animate-spin" : ""}`} />
            Refresh
          </button>
        </div>

        <div className="mb-6 grid gap-4 sm:grid-cols-3">
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            className="rounded-xl border border-border bg-card p-5"
          >
            <div className="mb-2 flex h-10 w-10 items-center justify-center rounded-lg bg-green-500/10">
              <ArrowDownLeft className="h-5 w-5 text-green-500" />
            </div>
            <p className="text-2xl font-bold text-foreground">
              {formatAmount(totalReceived, "USDC")}
            </p>
            <p className="text-sm text-muted-foreground">Total Received</p>
          </motion.div>
          
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
            className="rounded-xl border border-border bg-card p-5"
          >
            <div className="mb-2 flex h-10 w-10 items-center justify-center rounded-lg bg-red-500/10">
              <ArrowUpRight className="h-5 w-5 text-red-500" />
            </div>
            <p className="text-2xl font-bold text-foreground">
              {formatAmount(totalSent, "USDC")}
            </p>
            <p className="text-sm text-muted-foreground">Total Sent</p>
          </motion.div>
          
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
            className="rounded-xl border border-border bg-card p-5"
          >
            <div className="mb-2 flex h-10 w-10 items-center justify-center rounded-lg bg-primary/10">
              <DollarSign className="h-5 w-5 text-primary" />
            </div>
            <p className="text-2xl font-bold text-foreground">
              {formatAmount(totalReceived - totalSent, "USDC")}
            </p>
            <p className="text-sm text-muted-foreground">Net Change</p>
          </motion.div>
        </div>

        <div className="mb-6 flex flex-col gap-4 sm:flex-row">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
            <input
              type="text"
              placeholder="Search by email, memo, or tx hash..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full rounded-lg border border-border bg-card py-2 pl-10 pr-4 text-sm text-foreground placeholder:text-muted-foreground focus:border-primary focus:outline-none"
            />
          </div>
          
          <select
            value={filterType}
            onChange={(e) => setFilterType(e.target.value as FilterType)}
            className="rounded-lg border border-border bg-card px-4 py-2 text-sm text-foreground focus:border-primary focus:outline-none"
          >
            <option value="all">All Types</option>
            <option value="send">Sent</option>
            <option value="receive">Received</option>
          </select>
          
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value as StatusFilter)}
            className="rounded-lg border border-border bg-card px-4 py-2 text-sm text-foreground focus:border-primary focus:outline-none"
          >
            <option value="all">All Status</option>
            <option value="completed">Completed</option>
            <option value="pending">Pending</option>
            <option value="failed">Failed</option>
            <option value="refunded">Refunded</option>
          </select>
        </div>

        {loading ? (
          <div className="flex items-center justify-center py-12">
            <Loader2 className="h-8 w-8 animate-spin text-primary" />
          </div>
        ) : filteredTransactions.length === 0 ? (
          <div className="rounded-xl border border-border bg-card p-12 text-center">
            <History className="mx-auto mb-4 h-12 w-12 text-muted-foreground" />
            <h3 className="mb-2 text-lg font-medium text-foreground">No transactions found</h3>
            <p className="text-sm text-muted-foreground">
              {searchQuery || filterType !== "all" || statusFilter !== "all"
                ? "Try adjusting your filters"
                : "Send or receive your first payment to see it here"}
            </p>
          </div>
        ) : (
          <div className="space-y-3">
            <AnimatePresence>
              {filteredTransactions.map((tx, index) => (
                <motion.div
                  key={tx.id}
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -10 }}
                  transition={{ delay: index * 0.05 }}
                  className="group rounded-xl border border-border bg-card p-4 hover:border-primary/50"
                >
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <div className={`flex h-10 w-10 items-center justify-center rounded-full ${
                        tx.type === "send" ? "bg-red-500/10" : "bg-green-500/10"
                      }`}>
                        {tx.type === "send" ? (
                          <ArrowUpRight className="h-5 w-5 text-red-500" />
                        ) : (
                          <ArrowDownLeft className="h-5 w-5 text-green-500" />
                        )}
                      </div>
                      <div>
                        <p className="font-medium text-foreground">
                          {tx.type === "send" 
                            ? (tx.recipient_email || "Unknown recipient")
                            : (tx.sender_email || "Unknown sender")
                          }
                        </p>
                        <p className="text-sm text-muted-foreground">
                          {formatDate(tx.created_at)}
                          {tx.memo && ` • ${tx.memo}`}
                        </p>
                      </div>
                    </div>
                    
                    <div className="text-right">
                      <p className={`font-semibold ${
                        tx.type === "send" ? "text-red-500" : "text-green-500"
                      }`}>
                        {tx.type === "send" ? "-" : "+"}{formatAmount(tx.amount, tx.token)}
                      </p>
                      <span className={`inline-block rounded-full px-2 py-0.5 text-xs font-medium capitalize ${statusColors[tx.status]}`}>
                        {tx.status}
                      </span>
                    </div>
                  </div>
                  
                  {tx.tx_hash && (
                    <div className="mt-3 flex items-center gap-2 border-t border-border pt-3">
                      <span className="text-xs text-muted-foreground">Tx:</span>
                      <span className="flex-1 truncate font-mono text-xs text-muted-foreground">
                        {tx.tx_hash.slice(0, 10)}...{tx.tx_hash.slice(-8)}
                      </span>
                      <a
                        href={`https://sepolia.basescan.org/tx/${tx.tx_hash}`}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="flex items-center gap-1 text-xs text-primary hover:underline"
                      >
                        <ExternalLink className="h-3 w-3" />
                        View
                      </a>
                    </div>
                  )}
                </motion.div>
              ))}
            </AnimatePresence>
          </div>
        )}
      </div>
      <Footer />
    </div>
  );
}
