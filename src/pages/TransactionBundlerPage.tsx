import { useState, useMemo } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Package, Check, X, Lock, ArrowLeft, Trash2, Send, Eye, EyeOff } from "lucide-react";
import { Link } from "react-router-dom";
import { useApp } from "@/contexts/AppContext";
import AppHeader from "@/components/AppHeader";
import Footer from "@/components/Footer";
import { toast } from "sonner";
import type { Transaction } from "@/types/transaction";
import { useSound } from "@/hooks/useSound";

interface Bundle {
  id: string;
  transactions: Transaction[];
  status: "pending" | "processing" | "completed" | "failed";
  totalAmount: number;
  createdAt: Date;
}

function formatTime(date: Date) {
  const diff = Date.now() - date.getTime();
  const hours = Math.floor(diff / 3600000);
  if (hours < 1) return "Just now";
  if (hours < 24) return `${hours}h ago`;
  return `${Math.floor(hours / 24)}d ago`;
}

export default function TransactionBundlerPage() {
  const { isLoggedIn, login, transactions } = useApp();
  const { playSound } = useSound();
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
  const [bundles, setBundles] = useState<Bundle[]>([]);
  const [showPinModal, setShowPinModal] = useState(false);
  const [pin, setPin] = useState("");
  const [showPin, setShowPin] = useState(false);
  const [verifying, setVerifying] = useState(false);
  const [bundlePreview, setBundlePreview] = useState(false);

  const selectedTransactions = useMemo(() => {
    return transactions.filter((tx) => selectedIds.has(tx.id));
  }, [transactions, selectedIds]);

  const totalAmount = useMemo(() => {
    return selectedTransactions.reduce((sum, tx) => {
      if (tx.type === "sent") return sum + tx.amount;
      return sum;
    }, 0);
  }, [selectedTransactions]);

  const toggleSelect = (id: string) => {
    setSelectedIds((prev) => {
      const next = new Set(prev);
      if (next.has(id)) {
        next.delete(id);
      } else {
        next.add(id);
      }
      return next;
    });
  };

  const selectAll = () => {
    const sendable = transactions.filter((tx) => tx.type === "sent");
    setSelectedIds(new Set(sendable.map((tx) => tx.id)));
  };

  const clearSelection = () => {
    setSelectedIds(new Set());
  };

  const handleCreateBundle = () => {
    if (selectedIds.size < 2) {
      toast.error("Select at least 2 transactions to bundle");
      return;
    }
    setShowPinModal(true);
  };

  const verifyPinAndBundle = async () => {
    const storedPin = sessionStorage.getItem("peys_pin_hash");
    
    if (!storedPin) {
      toast.error("PIN not set up. Please set up PIN in Profile settings.");
      setShowPinModal(false);
      return;
    }

    if (btoa(pin) !== storedPin) {
      toast.error("Incorrect PIN");
      setPin("");
      return;
    }

    setVerifying(true);

    const newBundle: Bundle = {
      id: `bundle_${Date.now()}`,
      transactions: selectedTransactions,
      status: "processing",
      totalAmount,
      createdAt: new Date(),
    };

    setBundles((prev) => [newBundle, ...prev]);
    setSelectedIds(new Set());
    setShowPinModal(false);
    setPin("");
    setVerifying(false);
    setBundlePreview(false);
    playSound("success");
    toast.success(`Bundle created with ${selectedTransactions.length} transactions!`);
  };

  const unbundle = (bundleId: string) => {
    setBundles((prev) => prev.filter((b) => b.id !== bundleId));
    toast.success("Bundle unbundled");
  };

  if (!isLoggedIn) {
    return (
      <div className="min-h-screen bg-background">
        <AppHeader />
        <div className="flex min-h-[80vh] flex-col items-center justify-center px-4 text-center">
          <div className="mb-6 flex h-20 w-20 items-center justify-center rounded-full bg-primary/10">
            <Package className="h-10 w-10 text-primary" />
          </div>
          <h2 className="mb-3 font-display text-2xl text-foreground sm:text-3xl">Transaction Bundling</h2>
          <p className="mb-6 max-w-md text-sm text-muted-foreground">
            Bundle multiple transactions together for easier management and verification.
          </p>
          <button onClick={login} className="rounded-lg bg-primary px-6 py-3 font-semibold text-primary-foreground shadow-glow hover:opacity-90">
            Sign In to Bundle
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
        <Link to="/dashboard" className="mb-4 inline-flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground transition-colors">
          <ArrowLeft className="h-4 w-4" /> Back to Dashboard
        </Link>

        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="mb-6">
          <div className="flex items-center gap-3">
            <div className="flex h-12 w-12 items-center justify-center rounded-full bg-primary/10">
              <Package className="h-6 w-6 text-primary" />
            </div>
            <div>
              <h1 className="font-display text-3xl text-foreground sm:text-4xl">Transaction Bundling</h1>
              <p className="text-muted-foreground">Bundle multiple transactions for easier management</p>
            </div>
          </div>
        </motion.div>

        {/* Bundle Preview Banner */}
        <AnimatePresence>
          {selectedIds.size > 0 && (
            <motion.div
              initial={{ opacity: 0, y: -10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              className="mb-6 overflow-hidden rounded-xl border border-primary/30 bg-primary/5"
            >
              <div className="flex items-center justify-between p-4">
                <div>
                  <p className="text-sm font-medium text-foreground">
                    {selectedIds.size} transaction{selectedIds.size > 1 ? "s" : ""} selected
                  </p>
                  <p className="text-xs text-muted-foreground">
                    Total: {totalAmount.toFixed(2)} USDC equivalent
                  </p>
                </div>
                <div className="flex gap-2">
                  <button
                    onClick={clearSelection}
                    className="rounded-lg border border-border px-3 py-1.5 text-xs font-medium text-muted-foreground hover:bg-secondary transition-colors"
                  >
                    Clear
                  </button>
                  <button
                    onClick={handleCreateBundle}
                    disabled={selectedIds.size < 2}
                    className="flex items-center gap-1.5 rounded-lg bg-primary px-3 py-1.5 text-xs font-semibold text-primary-foreground shadow-glow transition-opacity hover:opacity-90 disabled:opacity-50"
                  >
                    <Package className="h-3.5 w-3.5" />
                    Bundle
                  </button>
                </div>
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Select Actions */}
        <div className="mb-4 flex items-center justify-between">
          <p className="text-sm text-muted-foreground">
            Select transactions to bundle (at least 2)
          </p>
          <button
            onClick={selectAll}
            className="text-xs text-primary hover:underline"
          >
            Select all sent
          </button>
        </div>

        {/* Transaction List */}
        <div className="mb-8 space-y-2">
          {transactions.filter((tx) => tx.type === "sent").length === 0 ? (
            <div className="rounded-xl border border-border bg-card p-8 text-center">
              <Package className="mx-auto mb-3 h-10 w-10 text-muted-foreground/50" />
              <p className="text-sm text-muted-foreground">No sent transactions to bundle</p>
            </div>
          ) : (
            transactions
              .filter((tx) => tx.type === "sent")
              .map((tx, i) => {
                const isSelected = selectedIds.has(tx.id);
                return (
                  <motion.div
                    key={tx.id}
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: i * 0.03 }}
                    onClick={() => toggleSelect(tx.id)}
                    className={`flex cursor-pointer items-center gap-3 rounded-xl border p-4 transition-colors ${
                      isSelected
                        ? "border-primary bg-primary/5"
                        : "border-border bg-card hover:bg-secondary/30"
                    }`}
                  >
                    <div className={`flex h-6 w-6 items-center justify-center rounded-full border-2 transition-colors ${
                      isSelected
                        ? "border-primary bg-primary text-primary-foreground"
                        : "border-muted"
                    }`}>
                      {isSelected && <Check className="h-3.5 w-3.5" />}
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2">
                        <p className="truncate text-sm font-medium text-foreground">{tx.counterparty}</p>
                      </div>
                      <p className="text-xs text-muted-foreground">{formatTime(tx.timestamp)}</p>
                    </div>
                    <p className="text-sm font-semibold text-foreground">
                      -{tx.amount} {tx.token}
                    </p>
                  </motion.div>
                );
              })
          )}
        </div>

        {/* Active Bundles */}
        {bundles.length > 0 && (
          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}>
            <h2 className="mb-4 font-display text-lg text-foreground">Active Bundles</h2>
            <div className="space-y-3">
              {bundles.map((bundle) => (
                <div
                  key={bundle.id}
                  className="rounded-xl border border-border bg-card p-4"
                >
                  <div className="flex items-center justify-between mb-3">
                    <div className="flex items-center gap-2">
                      <Package className="h-5 w-5 text-primary" />
                      <span className="text-sm font-medium text-foreground">
                        {bundle.transactions.length} transactions
                      </span>
                      <span className={`rounded-full px-2 py-0.5 text-xs font-medium ${
                        bundle.status === "completed"
                          ? "bg-green-500/10 text-green-500"
                          : bundle.status === "processing"
                          ? "bg-yellow-500/10 text-yellow-500"
                          : "bg-muted text-muted-foreground"
                      }`}>
                        {bundle.status}
                      </span>
                    </div>
                    <div className="flex items-center gap-2">
                      {bundle.status === "completed" && (
                        <button
                          onClick={() => unbundle(bundle.id)}
                          className="flex items-center gap-1 rounded-lg px-2 py-1 text-xs text-muted-foreground hover:bg-secondary transition-colors"
                        >
                          <Trash2 className="h-3.5 w-3.5" />
                          Unbundle
                        </button>
                      )}
                    </div>
                  </div>
                  <div className="flex items-center justify-between text-sm">
                    <span className="text-muted-foreground">
                      Total: {bundle.totalAmount.toFixed(2)} USDC
                    </span>
                    <span className="text-muted-foreground">
                      Created {formatTime(bundle.createdAt)}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          </motion.div>
        )}

        {/* PIN Modal */}
        {showPinModal && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
            <motion.div
              initial={{ scale: 0.95, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              className="w-full max-w-sm rounded-2xl border border-border bg-card p-6 shadow-xl"
            >
              <div className="mb-6 text-center">
                <div className="mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-full bg-primary/10">
                  <Lock className="h-7 w-7 text-primary" />
                </div>
                <h3 className="font-display text-xl text-foreground">Verify PIN</h3>
                <p className="mt-1 text-sm text-muted-foreground">
                  Enter your PIN to confirm bundle of {selectedIds.size} transactions
                </p>
              </div>

              <div className="mb-4">
                <div className="mb-2 flex justify-center gap-2">
                  {[0, 1, 2, 3].map((idx) => (
                    <div
                      key={idx}
                      className={`h-12 w-12 rounded-lg border text-center leading-[48px] text-xl font-semibold ${
                        pin[idx] ? "border-primary bg-primary/10" : "border-border bg-background"
                      }`}
                    >
                      {pin[idx] ? (showPin ? pin[idx] : "•") : ""}
                    </div>
                  ))}
                </div>
                <input
                  type={showPin ? "text" : "password"}
                  inputMode="numeric"
                  maxLength={4}
                  value={pin}
                  onChange={(e) => setPin(e.target.value.replace(/\D/g, "").slice(0, 4))}
                  className="sr-only"
                  autoFocus
                />
                <button
                  type="button"
                  onClick={() => setShowPin(!showPin)}
                  className="mx-auto flex items-center gap-1 text-xs text-muted-foreground hover:text-foreground"
                >
                  {showPin ? <EyeOff className="h-3 w-3" /> : <Eye className="h-3 w-3" />}
                  {showPin ? "Hide" : "Show"} PIN
                </button>
              </div>

              <div className="mb-4 grid grid-cols-3 gap-2">
                {["1", "2", "3", "4", "5", "6", "7", "8", "9", "", "0", "DEL"].map((key) => (
                  <button
                    key={key}
                    onClick={() => {
                      if (key === "DEL") setPin((p) => p.slice(0, -1));
                      else if (key && pin.length < 4) setPin((p) => p + key);
                    }}
                    disabled={!key}
                    className={`rounded-lg py-3 text-lg font-medium transition-colors ${
                      key ? "border border-border bg-background hover:bg-secondary" : "border-transparent"
                    }`}
                  >
                    {key}
                  </button>
                ))}
              </div>

              <div className="flex gap-3">
                <button
                  onClick={() => { setShowPinModal(false); setPin(""); }}
                  className="flex-1 rounded-xl border border-border py-2.5 text-sm font-medium text-foreground transition-colors hover:bg-secondary"
                >
                  Cancel
                </button>
                <button
                  onClick={verifyPinAndBundle}
                  disabled={pin.length !== 4 || verifying}
                  className="flex flex-1 items-center justify-center gap-2 rounded-xl bg-primary py-2.5 text-sm font-semibold text-primary-foreground shadow-glow transition-opacity hover:opacity-90 disabled:opacity-50"
                >
                  {verifying ? "Verifying..." : "Confirm"}
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </div>
      <Footer />
    </div>
  );
}
