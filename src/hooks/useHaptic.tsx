/**
 * @file Provides haptic (vibration) feedback via the Vibration API with a context-based provider.
 */

import { useCallback, useContext, useEffect, useRef, useState, createContext, ReactNode } from "react";

/** The set of haptic feedback types mapping to different vibration patterns. */
export type HapticType = "success" | "error" | "warning" | "navigation" | "toggle" | "impact";

interface HapticContextType {
  hapticsEnabled: boolean;
  setHapticsEnabled: (enabled: boolean) => void;
  triggerHaptic: (type: HapticType) => void;
}

const HapticContext = createContext<HapticContextType | null>(null);

const VIBRATION_PATTERNS: Record<HapticType, number | number[]> = {
  success: [50, 30, 50],
  error: [100, 50, 100],
  warning: [75],
  navigation: [10],
  toggle: [20, 10, 20],
  impact: [30],
};

const HAPTIC_INTENSITY: Record<string, number> = {
  light: 10,
  medium: 50,
  heavy: 100,
};

/**
 * Provider that wraps the app and exposes haptic feedback controls via context.
 * Uses the Navigator Vibration API.
 */
export function HapticProvider({ children }: { children: ReactNode }) {
  const [hapticsEnabled, setHapticsEnabled] = useState(() => localStorage.getItem("peys_haptics_enabled") !== "false");

  useEffect(() => {
    localStorage.setItem("peys_haptics_enabled", String(hapticsEnabled));
  }, [hapticsEnabled]);

  const triggerHaptic = useCallback((type: HapticType) => {
    if (!hapticsEnabled) return;
    
    if (!navigator.vibrate) return;
    
    try {
      const pattern = VIBRATION_PATTERNS[type];
      navigator.vibrate(pattern);
    } catch (err) {
      console.warn("Haptic feedback failed:", err);
    }
  }, [hapticsEnabled]);

  return (
    <HapticContext.Provider value={{ hapticsEnabled, setHapticsEnabled, triggerHaptic }}>
      {children}
    </HapticContext.Provider>
  );
}

/**
 * Hook to access the haptic context (whether haptics are enabled and the triggerHaptic function).
 */
export function useHaptics() {
  const ctx = useContext(HapticContext);
  if (!ctx) throw new Error("useHaptics must be inside HapticProvider");
  return ctx;
}

/**
 * Alias for useHaptics — kept for backwards compatibility.
 */
export function useHaptic() {
  return useHaptics();
}
