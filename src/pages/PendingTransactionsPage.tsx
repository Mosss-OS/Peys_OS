import { useState } from "react";
import { motion } from "framer-motion";
import { Clock, X, RotateCcw, Check, AlertCircle, Loader2, DollarSign, ArrowRight, ExternalLink } from "lucide-react";
import { useApp } from "@/contexts/AppContext";
import AppHeader from "@/components/AppHeader";
import Footer from "@/components/Footer";
import { toast } from "sonner";

interface PendingTransaction {
  id: string;
  recipient: string;
  amount: number;
  token: string;
  status: "pending" | "expired" | "cancelled";
  expiresIn: number;
  createdAt: string;
  type: "send" | "claim";
}

export default function PendingTransactionsPage() {
  const { isLoggedIn, login } = useApp();
  const [cancelling, setCancelling] = useState<string | null>(null);
  const [retrying, setRetrying] = useState<string | null>(null);

  const [pendingTxs, setPendingTxs] = useState<PendingTransaction[]>([
    { id: "1", recipient: "0x1234...5678", amount: 50, token: "USDC", status: "pending", expiresIn: 300, createdAt: "2026-03-18 14:30", type: "send" },
    { id: "2", recipient: "0xabcd...efgh", amount: 100, token: "USDC", status: "pending", expiresIn: 1800, createdAt: "2026-03-18 10:00", type: "claim" },
    { id: "3", recipient: "0x9876...ijkl", amount: 25, token: "USDC", status: "expired", expiresIn: 0, createdAt: "2026-03-17 18:00", type: "send" },
  ]);

  const handleCancel = async (id: string) => {
    setCancelling(id);
    await new Promise(r => setTimeout(r, 1500));
    setPendingTxs(pendingTxs.filter(tx => tx.id !== id));
    setCancelling(null);
    toast.success("Transaction cancelled");
  };

  const handleRetry = async (id: string) => {
    setRetrying(id);
    await new Promise(r => setTimeout(r, 2000));
    setPendingTxs(pendingTxs.map(tx =>
      tx.id === id ? { ...tx, status: "pending", expiresIn: 3600 } : tx
    ));
    setRetrying(null);
    toast.success("Transaction retried successfully!");
  };

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, "0")}`;
  };

  if (!isLoggedIn) {
    return (
      <div className="min-h-screen bg-background">
        <AppHeader />
        <div className="flex min-h-[80vh] flex-col items-center justify-center px-4 text-center">
          <div className="mb-6 flex h-20 w-20 items-center justify-center rounded-full bg-primary/10">
            <Clock className="h-10 w-10 text-primary" />
          </div>
          <h2 className="mb-3 font-display text-2xl text-foreground sm:text-3xl">Pending Transactions</h2>
          <p className="mb-6 max-w-md text-sm text-muted-foreground">
            View and manage your pending transactions.
          </p>
          <button onClick={login} className="rounded-lg bg-primary px-6 py-3 font-semibold text-primary-foreground shadow-glow hover:opacity-90">
            Sign In to View Pending
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
          <h1 className="font-display text-2xl text-foreground sm:text-3xl">Pending Transactions</h1>
          <p className="mt-1 text-sm text-muted-foreground">Manage your pending and expired transactions</p>
        </div>

        <div className="mb-6 grid gap-4 sm:grid-cols-3">
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            className="rounded-xl border border-border bg-card p-5"
          >
            <div className="mb-2 flex h-10 w-10 items-center justify-center rounded-lg bg-yellow-500/10">
              <Clock className="h-5 w-5 text-yellow-500" />
            </div>
            <p className="text-2xl font-bold text-foreground">
              {pendingTxs.filter(tx => tx.status === "pending").length}
            </p>
            <p className="text-sm text-muted-foreground">Pending</p>
          </motion.div>
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
            className="rounded-xl border border-border bg-card p-5"
          >
            <div className="mb-2 flex h-10 w-10 items-center justify-center rounded-lg bg-red-500/10">
              <AlertCircle className="h-5 w-5 text-red-500" />
            </div>
            <p className="text-2xl font-bold text-foreground">
              {pendingTxs.filter(tx => tx.status === "expired").length}
            </p>
            <p className="text-sm text-muted-foreground">Expired</p>
          </motion.div>
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.15 }}
            className="rounded-xl border border-border bg-card p-5"
          >
            <div className="mb-2 flex h-10 w-10 items-center justify-center rounded-lg bg-green-500/10">
              <DollarSign className="h-5 w-5 text-green-500" />
            </div>
            <p className="text-2xl font-bold text-foreground">
              ${pendingTxs.filter(tx => tx.status === "pending").reduce((sum, tx) => sum + tx.amount, 0).toFixed(2)}
            </p>
            <p className="text-sm text-muted-foreground">Total Pending</p>
          </motion.div>
        </div>

        {pendingTxs.length === 0 ? (
          <div className="rounded-xl border border-border bg-card p-12 text-center">
            <Check className="mx-auto h-12 w-12 text-green-500" />
            <h3 className="mt-4 text-lg font-medium text-foreground">All Clear!</h3>
            <p className="mt-2 text-sm text-muted-foreground">
              No pending transactions to manage
            </p>
          </div>
        ) : (
          <div className="space-y-4">
            {pendingTxs.map((tx, i) => (
              <motion.div
                key={tx.id}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: i * 0.05 }}
                className={`rounded-xl border bg-card p-5 ${
                  tx.status === "expired" ? "border-red-500/30" :
                  tx.status === "pending" ? "border-yellow-500/30" :
                  "border-border"
                }`}
              >
                <div className="flex items-start justify-between">
                  <div className="flex items-start gap-4">
                    <div className={`flex h-12 w-12 items-center justify-center rounded-full ${
                      tx.status === "pending" ? "bg-yellow-500/10" :
                      tx.status === "expired" ? "bg-red-500/10" :
                      "bg-secondary"
                    }`}>
                      {tx.status === "pending" ? (
                        <Clock className="h-6 w-6 text-yellow-500" />
                      ) : tx.status === "expired" ? (
                        <AlertCircle className="h-6 w-6 text-red-500" />
                      ) : (
                        <X className="h-6 w-6 text-muted-foreground" />
                      )}
                    </div>
                    <div>
                      <div className="flex items-center gap-2">
                        <h3 className="font-semibold text-foreground">
                          {tx.type === "send" ? "Send" : "Claim"} ${tx.amount.toFixed(2)} {tx.token}
                        </h3>
                        <span className={`rounded-full px-2 py-0.5 text-xs font-medium ${
                          tx.status === "pending" ? "bg-yellow-500/10 text-yellow-600" :
                          tx.status === "expired" ? "bg-red-500/10 text-red-600" :
                          "bg-secondary text-muted-foreground"
                        }`}>
                          {tx.status}
                        </span>
                      </div>
                      <p className="mt-1 font-mono text-sm text-muted-foreground">{tx.recipient}</p>
                      <div className="mt-2 flex items-center gap-4 text-xs text-muted-foreground">
                        <span>Created {new Date(tx.createdAt).toLocaleString()}</span>
                        {tx.status === "pending" && (
                          <span className="flex items-center gap-1">
                            <Clock className="h-3 w-3" />
                            Expires in {formatTime(tx.expiresIn)}
                          </span>
                        )}
                      </div>
                    </div>
                  </div>
                  <div className="flex gap-2">
                    {tx.status === "pending" && (
                      <button
                        onClick={() => handleCancel(tx.id)}
                        disabled={cancelling === tx.id}
                        className="flex items-center gap-1 rounded-lg border border-border px-3 py-2 text-sm font-medium text-red-500 hover:bg-red-500/10 disabled:opacity-50"
                      >
                        {cancelling === tx.id ? (
                          <Loader2 className="h-4 w-4 animate-spin" />
                        ) : (
                          <>
                            <X className="h-4 w-4" />
                            Cancel
                          </>
                        )}
                      </button>
                    )}
                    {tx.status === "expired" && (
                      <button
                        onClick={() => handleRetry(tx.id)}
                        disabled={retrying === tx.id}
                        className="flex items-center gap-1 rounded-lg bg-primary px-3 py-2 text-sm font-medium text-primary-foreground hover:opacity-90 disabled:opacity-50"
                      >
                        {retrying === tx.id ? (
                          <Loader2 className="h-4 w-4 animate-spin" />
                        ) : (
                          <>
                            <RotateCcw className="h-4 w-4" />
                            Retry
                          </>
                        )}
                      </button>
                    )}
                  </div>
                </div>

                {tx.status === "pending" && (
                  <div className="mt-4">
                    <div className="mb-1 flex justify-between text-xs">
                      <span className="text-muted-foreground">Time remaining</span>
                      <span className="font-medium text-yellow-500">{formatTime(tx.expiresIn)}</span>
                    </div>
                    <div className="h-1.5 w-full rounded-full bg-secondary">
                      <div
                        className={`h-1.5 rounded-full transition-all ${
                          tx.expiresIn < 60 ? "bg-red-500" :
                          tx.expiresIn < 300 ? "bg-yellow-500" :
                          "bg-primary"
                        }`}
                        style={{ width: `${Math.min((tx.expiresIn / 3600) * 100, 100)}%` }}
                      />
                    </div>
                  </div>
                )}
              </motion.div>
            ))}
          </div>
        )}
      </div>
      <Footer />
    </div>
  );
}
