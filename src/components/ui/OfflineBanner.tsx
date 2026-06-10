/** OfflineBanner - Fixed top banner indicating offline status with queued transaction management and sync controls */
import { useState, useEffect } from "react";
import { WifiOff, Wifi, RefreshCw, ChevronDown, X, Trash2, Clock } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { useOffline } from "@/contexts/OfflineContext";

export default function OfflineBanner() {
  const { isOnline, queuedTransactions, syncNow, clearQueue } = useOffline();
  const [dismissed, setDismissed] = useState(false);
  const [showQueue, setShowQueue] = useState(false);

  const pendingCount = queuedTransactions.filter(
    (tx) => tx.status === "pending" || tx.status === "processing"
  ).length;
  const failedCount = queuedTransactions.filter((tx) => tx.status === "failed").length;

  useEffect(() => {
    if (isOnline && pendingCount > 0) {
      syncNow();
    }
  }, [isOnline, pendingCount, syncNow]);

  const handleSync = async () => {
    await syncNow();
  };

  return (
    <>
      <AnimatePresence>
        {(!isOnline || queuedTransactions.length > 0) && !dismissed && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: "auto", opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            className={`fixed top-0 left-0 right-0 z-[100] overflow-hidden ${
              !isOnline ? "bg-yellow-500 text-yellow-950" : "bg-primary/10 text-primary border-b border-primary/20"
            }`}
          >
            <div className="container mx-auto px-4 py-2">
              <div className="flex items-center justify-between gap-4">
                <div className="flex items-center gap-2 text-sm font-medium">
                  {!isOnline ? (
                    <>
                      <WifiOff className="h-4 w-4" />
                      <span>You're offline. Changes will sync when connected.</span>
                    </>
                  ) : (
                    <>
                      <RefreshCw className="h-4 w-4" />
                      <span>
                        {pendingCount > 0
                          ? `${pendingCount} transaction${pendingCount > 1 ? "s" : ""} pending sync`
                          : "Back online"}
                      </span>
                    </>
                  )}
                </div>

                <div className="flex items-center gap-2">
                  {isOnline && pendingCount > 0 && (
                    <button
                      onClick={handleSync}
                      className="flex items-center gap-1 rounded-md bg-primary px-2 py-1 text-xs font-medium text-primary-foreground hover:bg-primary/90 transition-colors"
                    >
                      <RefreshCw className="h-3 w-3" />
                      Sync Now
                    </button>
                  )}

                  {queuedTransactions.length > 0 && (
                    <button
                      onClick={() => setShowQueue(!showQueue)}
                      className="flex items-center gap-1 text-xs font-medium hover:underline"
                    >
                      View Queue
                      <ChevronDown className={`h-3 w-3 transition-transform ${showQueue ? "rotate-180" : ""}`} />
                    </button>
                  )}

                  <button
                    onClick={() => setDismissed(true)}
                    className="rounded-md p-1 hover:bg-black/10 transition-colors"
                  >
                    <X className="h-4 w-4" />
                  </button>
                </div>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Queue Panel */}
      <AnimatePresence>
        {showQueue && queuedTransactions.length > 0 && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: "auto", opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            className="fixed left-0 right-0 top-10 z-[90] overflow-hidden border-b border-border bg-card shadow-lg"
          >
            <div className="container mx-auto max-w-2xl px-4 py-4">
              <div className="mb-3 flex items-center justify-between">
                <h3 className="font-display text-sm font-semibold text-foreground">
                  Pending Transactions ({queuedTransactions.length})
                </h3>
                <button
                  onClick={clearQueue}
                  className="flex items-center gap-1 text-xs text-muted-foreground hover:text-destructive transition-colors"
                >
                  <Trash2 className="h-3 w-3" />
                  Clear All
                </button>
              </div>

              <div className="space-y-2 max-h-60 overflow-y-auto">
                {queuedTransactions.map((tx) => (
                  <div
                    key={tx.id}
                    className={`flex items-center justify-between rounded-lg border p-3 ${
                      tx.status === "failed"
                        ? "border-destructive/30 bg-destructive/5"
                        : tx.status === "processing"
                        ? "border-primary/30 bg-primary/5"
                        : "border-border bg-secondary/30"
                    }`}
                  >
                    <div className="flex items-center gap-3">
                      <div className={`h-2 w-2 rounded-full ${
                        tx.status === "failed"
                          ? "bg-destructive"
                          : tx.status === "processing"
                          ? "bg-primary animate-pulse"
                          : "bg-yellow-500"
                      }`} />
                      <div>
                        <p className="text-sm font-medium text-foreground capitalize">
                          {tx.type === "payment" && tx.data.amount && tx.data.token
                            ? `Send ${tx.data.amount} ${tx.data.token}`
                            : tx.type}
                        </p>
                        {tx.data.recipient && (
                          <p className="text-xs text-muted-foreground">
                            To: {tx.data.recipient.slice(0, 8)}...{tx.data.recipient.slice(-6)}
                          </p>
                        )}
                        <div className="flex items-center gap-1 text-xs text-muted-foreground mt-1">
                          <Clock className="h-3 w-3" />
                          {new Date(tx.timestamp).toLocaleTimeString()}
                          {tx.retryCount > 0 && (
                            <span className="text-destructive ml-2">
                              Failed {tx.retryCount}x
                            </span>
                          )}
                        </div>
                      </div>
                    </div>
                    <span className={`text-xs font-medium ${
                      tx.status === "failed"
                        ? "text-destructive"
                        : tx.status === "processing"
                        ? "text-primary"
                        : "text-yellow-600"
                    }`}>
                      {tx.status === "processing" ? "Syncing..." : tx.status}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
}
