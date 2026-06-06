/**
 * @file Manages starred/favorite transactions and recipients persisted to localStorage.
 */

import { useState, useEffect, useCallback, useMemo } from "react";

/** A starred transaction or recipient saved as a favorite. */
export interface StarredItem {
  id: string;
  type: "transaction" | "recipient";
  transactionId?: string;
  recipientAddress?: string;
  recipientName?: string;
  addedAt: number;
  note?: string;
}

const STORAGE_KEY = "peys_favorites";

/**
 * Hook for managing starred/favorite transactions and recipients with localStorage persistence.
 */
export function useFavorites() {
  const [starredItems, setStarredItems] = useState<StarredItem[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    try {
      const stored = localStorage.getItem(STORAGE_KEY);
      if (stored) {
        setStarredItems(JSON.parse(stored));
      }
    } catch (e) {
      console.error("Failed to load favorites:", e);
    }
    setLoading(false);
  }, []);

  // Persist favorites to localStorage whenever they change (skip on initial load)
  useEffect(() => {
    if (!loading) {
      try {
        localStorage.setItem(STORAGE_KEY, JSON.stringify(starredItems));
      } catch (e) {
        console.error("Failed to save favorites:", e);
      }
    }
  }, [starredItems, loading]);

  const starTransaction = useCallback((transactionId: string) => {
    setStarredItems((prev) => {
      if (prev.some((item) => item.transactionId === transactionId)) {
        return prev;
      }
      return [
        ...prev,
        {
          id: `tx_${Date.now()}`,
          type: "transaction",
          transactionId,
          addedAt: Date.now(),
        },
      ];
    });
  }, []);

  const unstarTransaction = useCallback((transactionId: string) => {
    setStarredItems((prev) => prev.filter((item) => item.transactionId !== transactionId));
  }, []);

  const starRecipient = useCallback((address: string, name?: string) => {
    setStarredItems((prev) => {
      if (prev.some((item) => item.recipientAddress?.toLowerCase() === address.toLowerCase())) {
        return prev;
      }
      return [
        ...prev,
        {
          id: `rec_${Date.now()}`,
          type: "recipient",
          recipientAddress: address,
          recipientName: name,
          addedAt: Date.now(),
        },
      ];
    });
  }, []);

  const unstarRecipient = useCallback((address: string) => {
    setStarredItems((prev) =>
      prev.filter((item) => item.recipientAddress?.toLowerCase() !== address.toLowerCase())
    );
  }, []);

  const isTransactionStarred = useCallback(
    (transactionId: string) => starredItems.some((item) => item.transactionId === transactionId),
    [starredItems]
  );

  const isRecipientStarred = useCallback(
    (address: string) =>
      starredItems.some((item) => item.recipientAddress?.toLowerCase() === address.toLowerCase()),
    [starredItems]
  );

  const toggleStarTransaction = useCallback(
    (transactionId: string) => {
      if (isTransactionStarred(transactionId)) {
        unstarTransaction(transactionId);
      } else {
        starTransaction(transactionId);
      }
    },
    [isTransactionStarred, starTransaction, unstarTransaction]
  );

  const toggleStarRecipient = useCallback(
    (address: string, name?: string) => {
      if (isRecipientStarred(address)) {
        unstarRecipient(address);
      } else {
        starRecipient(address, name);
      }
    },
    [isRecipientStarred, starRecipient, unstarRecipient]
  );

  const starredTransactions = useMemo(
    () => starredItems.filter((item) => item.type === "transaction"),
    [starredItems]
  );

  const starredRecipients = useMemo(
    () => starredItems.filter((item) => item.type === "recipient"),
    [starredItems]
  );

  const exportFavorites = useCallback(() => {
    const data = {
      exportedAt: new Date().toISOString(),
      transactions: starredItems.filter((item) => item.type === "transaction"),
      recipients: starredItems.filter((item) => item.type === "recipient"),
    };
    const blob = new Blob([JSON.stringify(data, null, 2)], { type: "application/json" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `peys-favorites-${new Date().toISOString().split("T")[0]}.json`;
    a.click();
    URL.revokeObjectURL(url);
  }, [starredItems]);

  const clearAllFavorites = useCallback(() => {
    setStarredItems([]);
  }, []);

  return {
    starredItems,
    starredTransactions,
    starredRecipients,
    loading,
    starTransaction,
    unstarTransaction,
    starRecipient,
    unstarRecipient,
    isTransactionStarred,
    isRecipientStarred,
    toggleStarTransaction,
    toggleStarRecipient,
    exportFavorites,
    clearAllFavorites,
  };
}
