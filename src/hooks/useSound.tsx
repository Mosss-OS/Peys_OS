/**
 * @file Provides audio feedback via the Web Audio API with a context-based provider.
 */

import { useCallback, useContext, useEffect, useRef, useState, createContext, ReactNode } from "react";

/** The set of sound types available for different UI events. */
export type SoundType = "send" | "success" | "error" | "notification" | "click";

interface SoundContextType {
  soundsEnabled: boolean;
  setSoundsEnabled: (enabled: boolean) => void;
  playSound: (type: SoundType) => void;
}

const SoundContext = createContext<SoundContextType | null>(null);

const SOUND_CONFIGS: Record<SoundType, { freq: number; duration: number; type: OscillatorType }> = {
  send: { freq: 440, duration: 0.1, type: "sine" },
  success: { freq: 880, duration: 0.15, type: "sine" },
  error: { freq: 220, duration: 0.3, type: "sawtooth" },
  notification: { freq: 660, duration: 0.1, type: "sine" },
  click: { freq: 520, duration: 0.05, type: "square" },
};

/**
 * Provider that wraps the app and exposes sound playback controls via context.
 * Uses the Web Audio API to generate sounds programmatically (no audio files required).
 */
export function SoundProvider({ children }: { children: ReactNode }) {
  const [soundsEnabled, setSoundsEnabled] = useState(() => localStorage.getItem("peys_sounds_enabled") !== "false");
  const audioContextRef = useRef<AudioContext | null>(null);

  useEffect(() => {
    localStorage.setItem("peys_sounds_enabled", String(soundsEnabled));
  }, [soundsEnabled]);

  const playSound = useCallback((type: SoundType) => {
    if (!soundsEnabled) return;
    
    try {
      if (!audioContextRef.current) {
        audioContextRef.current = new AudioContext();
      }
      
      const ctx = audioContextRef.current;
      const { freq, duration, type: oscType } = SOUND_CONFIGS[type];
      
      const oscillator = ctx.createOscillator();
      const gainNode = ctx.createGain();
      
      oscillator.connect(gainNode);
      gainNode.connect(ctx.destination);
      
      oscillator.frequency.value = freq;
      oscillator.type = oscType;
      
      gainNode.gain.setValueAtTime(0.3, ctx.currentTime);
      gainNode.gain.exponentialRampToValueAtTime(0.01, ctx.currentTime + duration);
      
      oscillator.start(ctx.currentTime);
      oscillator.stop(ctx.currentTime + duration);
    } catch (err) {
      console.warn("Sound playback failed:", err);
    }
  }, [soundsEnabled]);

  return (
    <SoundContext.Provider value={{ soundsEnabled, setSoundsEnabled, playSound }}>
      {children}
    </SoundContext.Provider>
  );
}

/**
 * Hook to access sound context (whether sounds are enabled and the playSound function).
 */
export function useSounds() {
  const ctx = useContext(SoundContext);
  if (!ctx) throw new Error("useSounds must be inside SoundProvider");
  return ctx;
}

/**
 * Alias for useSounds — kept for backwards compatibility.
 */
export function useSound() {
  return useSounds();
}
