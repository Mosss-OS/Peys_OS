/**
 * @file Manages the Screen Wake Lock API to prevent the device screen from dimming.
 */

import { useCallback, useContext, useEffect, useRef, useState, createContext, ReactNode } from "react";

interface WakeLockContextType {
  wakeLockEnabled: boolean;
  setWakeLockEnabled: (enabled: boolean) => void;
  isWakeLockActive: boolean;
  requestWakeLock: () => Promise<boolean>;
  releaseWakeLock: () => Promise<void>;
  isSupported: boolean;
}

const WakeLockContext = createContext<WakeLockContextType | null>(null);

/**
 * Provider that wraps the app and exposes wake-lock controls via context.
 * Automatically re-acquires the lock when the page becomes visible again.
 */
export function WakeLockProvider({ children }: { children: ReactNode }) {
  const [wakeLockEnabled, setWakeLockEnabled] = useState(() => localStorage.getItem("peys_wake_lock_enabled") !== "false");
  const [isWakeLockActive, setIsWakeLockActive] = useState(false);
  const wakeLockRef = useRef<WakeLockSentinel | null>(null);

  const isSupported = 'wakeLock' in navigator;

  useEffect(() => {
    localStorage.setItem("peys_wake_lock_enabled", String(wakeLockEnabled));
  }, [wakeLockEnabled]);

  const requestWakeLock = useCallback(async (): Promise<boolean> => {
    if (!isSupported || !wakeLockEnabled) return false;
    if (wakeLockRef.current) return true;

    try {
      wakeLockRef.current = await navigator.wakeLock.request('screen');
      setIsWakeLockActive(true);
      
      wakeLockRef.current.addEventListener('release', () => {
        setIsWakeLockActive(false);
        wakeLockRef.current = null;
      });

      return true;
    } catch (err) {
      console.warn("Wake lock request failed:", err);
      return false;
    }
  }, [isSupported, wakeLockEnabled]);

  const releaseWakeLock = useCallback(async () => {
    if (wakeLockRef.current) {
      try {
        await wakeLockRef.current.release();
        wakeLockRef.current = null;
        setIsWakeLockActive(false);
      } catch (err) {
        console.warn("Wake lock release failed:", err);
      }
    }
  }, []);

  // Release wake lock on unmount to prevent holding it unnecessarily
  useEffect(() => {
    return () => {
      if (wakeLockRef.current) {
        wakeLockRef.current.release();
      }
    };
  }, []);

  // Re-acquire the wake lock when the page becomes visible again (if enabled)
  useEffect(() => {
    const handleVisibilityChange = async () => {
      if (document.visibilityState === 'visible' && wakeLockEnabled && !wakeLockRef.current) {
        await requestWakeLock();
      }
    };

    document.addEventListener('visibilitychange', handleVisibilityChange);
    return () => {
      document.removeEventListener('visibilitychange', handleVisibilityChange);
    };
  }, [wakeLockEnabled, requestWakeLock]);

  return (
    <WakeLockContext.Provider 
      value={{ 
        wakeLockEnabled, 
        setWakeLockEnabled, 
        isWakeLockActive, 
        requestWakeLock, 
        releaseWakeLock,
        isSupported 
      }}
    >
      {children}
    </WakeLockContext.Provider>
  );
}

/**
 * Hook to access the wake-lock context (enable/disable, request/release, isSupported).
 */
export function useWakeLock() {
  const ctx = useContext(WakeLockContext);
  if (!ctx) throw new Error("useWakeLock must be inside WakeLockProvider");
  return ctx;
}
