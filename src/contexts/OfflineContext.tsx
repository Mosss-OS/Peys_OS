/**
 * @file Offline-first support: queues transactions and caches balances when the network is unavailable.
 */

import { createContext, useContext, useState, useEffect, useCallback, ReactNode } from "react";

/** A transaction queued for submission once the device comes back online. */
export interface QueuedTransaction {
  id: string;
  type: "payment" | "approval" | "claim";
  data: {
    recipient?: string;
    amount?: string;
    token?: string;
    memo?: string;
    paymentId?: string;
    secret?: string;
  };
  timestamp: number;
  status: "pending" | "processing" | "failed";
  retryCount: number;
}

interface OfflineContextType {
  isOnline: boolean;
  queuedTransactions: QueuedTransaction[];
  cachedBalances: {
    usdc: number;
    usdt: number;
    pass: number;
    lastUpdated: number | null;
  };
  queueTransaction: (tx: Omit<QueuedTransaction, "id" | "timestamp" | "status" | "retryCount">) => string;
  removeFromQueue: (id: string) => void;
  clearQueue: () => void;
  syncNow: () => Promise<void>;
  updateCachedBalances: (balances: { usdc: number; usdt: number; pass: number }) => void;
}

const OfflineContext = createContext<OfflineContextType | null>(null);

const STORAGE_KEY_QUEUE = "peys_offline_queue";
const STORAGE_KEY_BALANCES = "peys_cached_balances";
/** Maximum number of sync retry attempts before a queued transaction is abandoned. */
const MAX_RETRIES = 3;

/**
 * Provider that tracks online/offline status, queues failed transactions,
 * caches balances, and auto-syncs when connectivity is restored.
 */
export function OfflineProvider({ children }: { children: ReactNode }) {
  const [isOnline, setIsOnline] = useState(navigator.onLine);
  const [queuedTransactions, setQueuedTransactions] = useState<QueuedTransaction[]>([]);
  const [cachedBalances, setCachedBalances] = useState({
    usdc: 0,
    usdt: 0,
    pass: 0,
    lastUpdated: null as number | null,
  });
  const [isSyncing, setIsSyncing] = useState(false);

  // Load from localStorage on mount
  useEffect(() => {
    try {
      const storedQueue = localStorage.getItem(STORAGE_KEY_QUEUE);
      if (storedQueue) {
        setQueuedTransactions(JSON.parse(storedQueue));
      }

      const storedBalances = localStorage.getItem(STORAGE_KEY_BALANCES);
      if (storedBalances) {
        setCachedBalances(JSON.parse(storedBalances));
      }
    } catch (e) {
      console.error("Failed to load offline data:", e);
    }
  }, []);

  // Save queue to localStorage when it changes
  useEffect(() => {
    try {
      localStorage.setItem(STORAGE_KEY_QUEUE, JSON.stringify(queuedTransactions));
    } catch (e) {
      console.error("Failed to save queue:", e);
    }
  }, [queuedTransactions]);

  // Online/offline detection
  useEffect(() => {
    const handleOnline = () => {
      setIsOnline(true);
      // Auto-sync when coming back online
      syncNow();
    };
    const handleOffline = () => setIsOnline(false);

    window.addEventListener("online", handleOnline);
    window.addEventListener("offline", handleOffline);

    return () => {
      window.removeEventListener("online", handleOnline);
      window.removeEventListener("offline", handleOffline);
    };
  }, []);

  /** Add a transaction to the offline queue. Returns the generated ID. */
  const queueTransaction = useCallback((
    tx: Omit<QueuedTransaction, "id" | "timestamp" | "status" | "retryCount">
  ): string => {
    const id = `tx_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    const newTx: QueuedTransaction = {
      ...tx,
      id,
      timestamp: Date.now(),
      status: "pending",
      retryCount: 0,
    };
    setQueuedTransactions((prev) => [...prev, newTx]);
    return id;
  }, []);

  /** Remove a specific transaction from the offline queue. */
  const removeFromQueue = useCallback((id: string) => {
    setQueuedTransactions((prev) => prev.filter((tx) => tx.id !== id));
  }, []);

  /** Remove all queued transactions. */
  const clearQueue = useCallback(() => {
    setQueuedTransactions([]);
    localStorage.removeItem(STORAGE_KEY_QUEUE);
  }, []);

  /** Persist balance data locally for offline display. */
  const updateCachedBalances = useCallback((balances: { usdc: number; usdt: number; pass: number }) => {
    setCachedBalances({
      ...balances,
      lastUpdated: Date.now(),
    });
    try {
      localStorage.setItem(STORAGE_KEY_BALANCES, JSON.stringify({
        ...balances,
        lastUpdated: Date.now(),
      }));
    } catch (e) {
      console.error("Failed to cache balances:", e);
    }
  }, []);

  /** Attempt to process all pending/failed queued transactions in order. */
  const syncNow = useCallback(async () => {
    if (isSyncing || queuedTransactions.length === 0) return;
    
    setIsSyncing(true);
    const pendingTxs = queuedTransactions.filter((tx) => tx.status === "pending" || tx.status === "failed");
    
    for (const tx of pendingTxs) {
      if (tx.retryCount >= MAX_RETRIES) {
        continue;
      }

      try {
        setQueuedTransactions((prev) =>
          prev.map((t) => (t.id === tx.id ? { ...t, status: "processing" as const } : t))
        );

        // Attempt to sync - this would integrate with actual payment logic
        // For now, we just mark it as processed
        await new Promise((resolve) => setTimeout(resolve, 500));
        
        // Remove from queue on successful sync
        removeFromQueue(tx.id);
      } catch (error) {
        console.error("Failed to sync transaction:", tx.id, error);
        setQueuedTransactions((prev) =>
          prev.map((t) =>
            t.id === tx.id
              ? { ...t, status: "failed" as const, retryCount: t.retryCount + 1 }
              : t
          )
        );
      }
    }
    
    setIsSyncing(false);
  }, [isSyncing, queuedTransactions, removeFromQueue]);

  return (
    <OfflineContext.Provider
      value={{
        isOnline,
        queuedTransactions,
        cachedBalances,
        queueTransaction,
        removeFromQueue,
        clearQueue,
        syncNow,
        updateCachedBalances,
      }}
    >
      {children}
    </OfflineContext.Provider>
  );
}

/**
 * Hook to access offline context: queue management, cached balances, and sync controls.
 */
export function useOffline() {
  const context = useContext(OfflineContext);
  if (!context) {
    throw new Error("useOffline must be used within an OfflineProvider");
  }
  return context;
}
