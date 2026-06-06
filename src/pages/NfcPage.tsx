/** NfcPage - NFC contactless payment with tag reading, writing, settings, and Web NFC API integration */
import { useState, useEffect, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { 
  Wifi, WifiOff, Smartphone, CheckCircle, 
  XCircle, Loader2, Activity, Tag, 
  ArrowLeftRight, Search, Edit3, Camera,
  AlertCircle, Info
} from "lucide-react";
import { useApp } from "@/contexts/AppContext";
import AppHeader from "@/components/AppHeader";
import Footer from "@/components/Footer";
import { toast } from "sonner";

interface NfcTag {
  id: string;
  type: "ndef" | "mifare" | "unknown";
  data: string;
  timestamp: string;
}

interface NfcSettings {
  enabled: boolean;
  autoRead: boolean;
  hapticFeedback: boolean;
  soundAlert: boolean;
}

interface NDEFReaderType {
  scan: () => Promise<void>;
  write: (message: { records: Array<{ recordType: string; data: string }> }) => Promise<void>;
  onreading: ((event: NDEFReadingEvent) => void) | null;
  onerror: (() => void) | null;
}

interface NDEFReadingEvent {
  serialNumber: string;
  records: unknown[];
}

export function useNfc() {
  const [isSupported, setIsSupported] = useState(false);
  const [isReading, setIsReading] = useState(false);
  const [lastTag, setLastTag] = useState<NfcTag | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    // Check if NFC is supported
    if ("NDEFReader" in window) {
      setIsSupported(true);
    } else if ("webkitNfc" in navigator) {
      setIsSupported(true);
    } else {
      // Check for Android/iOS specific detection
      const isAndroid = /Android/i.test(navigator.userAgent);
      const isIOS = /iPhone|iPad|iPod/i.test(navigator.userAgent);
      setIsSupported(isAndroid || isIOS);
    }
  }, []);

  const scanNfc = useCallback(async () => {
    if (!isSupported) {
      setError("NFC not supported on this device");
      return;
    }

    setIsReading(true);
    setError(null);

    try {
      // Check for Web NFC API
      if ("NDEFReader" in window) {
        const ndef = new (window as unknown as { NDEFReader: new () => NDEFReaderType }).NDEFReader();
        await ndef.scan();

        ndef.onreading = (event: NDEFReadingEvent) => {
          const tag: NfcTag = {
            id: event.serialNumber || crypto.randomUUID(),
            type: "ndef",
            data: JSON.stringify(event.records),
            timestamp: new Date().toISOString(),
          };
          setLastTag(tag);
          setIsReading(false);
          toast.success("NFC tag detected!");
        };

        ndef.onerror = () => {
          setError("NFC reading error");
          setIsReading(false);
        };
      } else {
        // Fallback for mobile browsers
        const isAndroid = /Android/i.test(navigator.userAgent);
        if (isAndroid) {
          // Android Intent for NFC
          window.location.href = "intent:#Intent;action=android.nfc.action.NDEF_DISCOVERED;end";
        } else {
          setError("Web NFC not supported. Please use a compatible browser.");
          setIsReading(false);
        }
      }
    } catch (err: unknown) {
      const error = err as Error;
      setError(error.message || "Failed to scan NFC");
      setIsReading(false);
    }
  }, [isSupported]);

  const writeNfc = useCallback(async (data: string) => {
    if (!isSupported) {
      setError("NFC not supported on this device");
      return false;
    }

    try {
      if ("NDEFReader" in window) {
        const ndef = new (window as unknown as { NDEFReader: new () => NDEFReaderType }).NDEFReader();
        await ndef.write({
          records: [{ recordType: "text", data }],
        });
        toast.success("NFC tag written successfully!");
        return true;
      } else {
        setError("Writing not supported on this device");
        return false;
      }
    } catch (err: unknown) {
      const error = err as Error;
      setError(error.message || "Failed to write to NFC");
      return false;
    }
  }, [isSupported]);

  return {
    isSupported,
    isReading,
    lastTag,
    error,
    scanNfc,
    writeNfc,
    setError,
  };
}

/** NfcPage component - NFC read/write interface with tabbed UI, tag detection history, device status, and settings */
export default function NfcPage() {
  const { isLoggedIn, login } = useApp();
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<"read" | "write">("read");
  const [writeData, setWriteData] = useState("");
  const [settings, setSettings] = useState<NfcSettings>({
    enabled: true,
    autoRead: true,
    hapticFeedback: true,
    soundAlert: true,
  });

  const {
    isSupported,
    isReading,
    lastTag,
    error,
    scanNfc,
    writeNfc,
    setError,
  } = useNfc();

  useEffect(() => {
    if (!isLoggedIn) return;
    setLoading(false);
    
    // Load settings from localStorage
    const savedSettings = localStorage.getItem("nfc_settings");
    if (savedSettings) {
      setSettings(JSON.parse(savedSettings));
    }
  }, [isLoggedIn]);

  useEffect(() => {
    localStorage.setItem("nfc_settings", JSON.stringify(settings));
  }, [settings]);

  const handleWrite = async () => {
    if (!writeData.trim()) {
      toast.error("Please enter data to write");
      return;
    }
    const success = await writeNfc(writeData);
    if (success) {
      setWriteData("");
    }
  };

  if (!isLoggedIn) {
    return (
      <div className="min-h-screen bg-background">
        <AppHeader />
        <div className="flex min-h-[80vh] flex-col items-center justify-center px-4 text-center">
          <div className="mb-6 flex h-20 w-20 items-center justify-center rounded-full bg-primary/10">
            <Smartphone className="h-10 w-10 text-primary" />
          </div>
          <h2 className="mb-3 font-display text-2xl text-foreground sm:text-3xl">NFC Payments</h2>
          <p className="mb-6 max-w-md text-sm text-muted-foreground">
            Make contactless payments using NFC technology
          </p>
          <button onClick={login} className="rounded-lg bg-primary px-6 py-3 font-semibold text-primary-foreground shadow-glow hover:opacity-90">
            Sign In to Use NFC
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
        <div className="mb-6 flex items-center justify-between">
          <div>
            <h1 className="font-display text-2xl text-foreground sm:text-3xl">NFC Payments</h1>
            <p className="mt-1 text-sm text-muted-foreground">
              {isSupported ? "Ready for contactless payments" : "NFC not supported on this device"}
            </p>
          </div>
          <div className={`flex items-center gap-2 rounded-full px-3 py-1.5 ${
            isSupported ? "bg-green-500/10 text-green-600" : "bg-red-500/10 text-red-600"
          }`}>
            {isSupported ? (
              <Wifi className="h-4 w-4" />
            ) : (
              <WifiOff className="h-4 w-4" />
            )}
            <span className="text-xs font-medium">
              {isSupported ? "NFC Enabled" : "No NFC"}
            </span>
          </div>
        </div>

        {loading ? (
          <div className="flex justify-center py-12">
            <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
          </div>
        ) : (
          <>
            {/* Tabs */}
            <div className="mb-6 flex gap-1 rounded-xl border border-border bg-card p-1">
              <button
                onClick={() => setActiveTab("read")}
                className={`flex-1 flex items-center justify-center gap-2 rounded-lg py-2.5 text-sm font-medium transition-colors ${
                  activeTab === "read"
                    ? "bg-primary text-primary-foreground"
                    : "text-muted-foreground hover:text-foreground"
                }`}
              >
                <Search className="h-4 w-4" />
                Read Tag
              </button>
              <button
                onClick={() => setActiveTab("write")}
                className={`flex-1 flex items-center justify-center gap-2 rounded-lg py-2.5 text-sm font-medium transition-colors ${
                  activeTab === "write"
                    ? "bg-primary text-primary-foreground"
                    : "text-muted-foreground hover:text-foreground"
                }`}
              >
                <Edit3 className="h-4 w-4" />
                Write Tag
              </button>
            </div>

            {/* Read Tab */}
            {activeTab === "read" && (
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                className="space-y-4"
              >
                {/* NFC Scanner Area */}
                <div className="rounded-xl border border-border bg-card p-6 text-center">
                  <div className={`mx-auto mb-4 flex h-24 w-24 items-center justify-center rounded-full ${
                    isReading ? "bg-primary/20 animate-pulse" : "bg-secondary"
                  }`}>
                    <Smartphone className={`h-12 w-12 ${isReading ? "text-primary" : "text-muted-foreground"}`} />
                  </div>
                  
                  <p className="mb-2 text-sm text-foreground">
                    {isReading ? "Hold tag near device..." : "Ready to scan"}
                  </p>
                  <p className="text-xs text-muted-foreground">
                    Bring an NFC tag close to your device to read payment information
                  </p>
                </div>

                {/* Action Button */}
                <button
                  onClick={scanNfc}
                  disabled={!isSupported || isReading}
                  className="flex w-full items-center justify-center gap-2 rounded-lg bg-primary py-3 text-sm font-semibold text-primary-foreground shadow-glow hover:opacity-90 disabled:opacity-50"
                >
                  {isReading ? (
                    <>
                      <Loader2 className="h-4 w-4 animate-spin" />
                      Scanning...
                    </>
                  ) : (
                    <>
                      <Activity className="h-4 w-4" />
                      Start Scan
                    </>
                  )}
                </button>

                {/* Last Tag Info */}
                {lastTag && (
                  <motion.div
                    initial={{ opacity: 0, height: 0 }}
                    animate={{ opacity: 1, height: "auto" }}
                    className="rounded-xl border border-border bg-card p-4"
                  >
                    <div className="flex items-center justify-between mb-2">
                      <h3 className="text-sm font-medium text-foreground">Last Tag Detected</h3>
                      <CheckCircle className="h-4 w-4 text-green-500" />
                    </div>
                    <div className="space-y-1 text-sm">
                      <p className="text-muted-foreground">
                        <span className="text-foreground">ID:</span> {lastTag.id.slice(0, 16)}...
                      </p>
                      <p className="text-muted-foreground">
                        <span className="text-foreground">Type:</span> {lastTag.type}
                      </p>
                      <p className="text-muted-foreground">
                        <span className="text-foreground">Time:</span> {new Date(lastTag.timestamp).toLocaleTimeString()}
                      </p>
                    </div>
                  </motion.div>
                )}

                {/* Error Display */}
                {error && (
                  <motion.div
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    className="flex items-center gap-2 rounded-lg bg-red-500/10 p-3 text-sm text-red-600"
                  >
                    <AlertCircle className="h-4 w-4 shrink-0" />
                    <span>{error}</span>
                    <button onClick={() => setError(null)} className="ml-auto">
                      <XCircle className="h-4 w-4" />
                    </button>
                  </motion.div>
                )}
              </motion.div>
            )}

            {/* Write Tab */}
            {activeTab === "write" && (
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                className="space-y-4"
              >
                <div className="rounded-xl border border-border bg-card p-4">
                  <h3 className="mb-3 text-sm font-medium text-foreground">Write Payment Data</h3>
                  <textarea
                    value={writeData}
                    onChange={(e) => setWriteData(e.target.value)}
                    placeholder="Enter payment data or NFC message..."
                    className="w-full h-32 rounded-lg border border-border bg-background p-3 text-sm text-foreground placeholder:text-muted-foreground/50 focus:outline-none focus:ring-2 focus:ring-ring resize-none"
                  />
                  <p className="mt-2 text-xs text-muted-foreground">
                    This data will be written to the NFC tag when held near your device
                  </p>
                </div>

                <button
                  onClick={handleWrite}
                  disabled={!isSupported || !writeData.trim()}
                  className="flex w-full items-center justify-center gap-2 rounded-lg bg-primary py-3 text-sm font-semibold text-primary-foreground shadow-glow hover:opacity-90 disabled:opacity-50"
                >
                  <Tag className="h-4 w-4" />
                  Write to NFC Tag
                </button>

                <div className="rounded-lg bg-yellow-500/10 p-3">
                  <div className="flex items-start gap-2">
                    <Info className="h-4 w-4 text-yellow-600 shrink-0 mt-0.5" />
                    <div>
                      <p className="text-xs text-yellow-600 font-medium">Important</p>
                      <p className="text-xs text-muted-foreground">
                        Make sure your device supports NFC writing. Some devices may require specific permissions or settings.
                      </p>
                    </div>
                  </div>
                </div>
              </motion.div>
            )}

            {/* Settings */}
            <div className="mt-6 rounded-xl border border-border bg-card p-4">
              <h3 className="mb-3 text-sm font-medium text-foreground">NFC Settings</h3>
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-foreground">Haptic Feedback</p>
                    <p className="text-xs text-muted-foreground">Vibrate on tag detection</p>
                  </div>
                  <button
                    onClick={() => setSettings({ ...settings, hapticFeedback: !settings.hapticFeedback })}
                    className={`relative h-6 w-11 rounded-full transition-colors ${
                      settings.hapticFeedback ? "bg-primary" : "bg-muted"
                    }`}
                  >
                    <span
                      className={`absolute top-0.5 h-5 w-5 rounded-full bg-white shadow transition-transform ${
                        settings.hapticFeedback ? "translate-x-5" : "translate-x-0.5"
                      }`}
                    />
                  </button>
                </div>
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-foreground">Sound Alert</p>
                    <p className="text-xs text-muted-foreground">Play sound on tag detection</p>
                  </div>
                  <button
                    onClick={() => setSettings({ ...settings, soundAlert: !settings.soundAlert })}
                    className={`relative h-6 w-11 rounded-full transition-colors ${
                      settings.soundAlert ? "bg-primary" : "bg-muted"
                    }`}
                  >
                    <span
                      className={`absolute top-0.5 h-5 w-5 rounded-full bg-white shadow transition-transform ${
                        settings.soundAlert ? "translate-x-5" : "translate-x-0.5"
                      }`}
                    />
                  </button>
                </div>
              </div>
            </div>
          </>
        )}
      </div>
      <Footer />
    </div>
  );
}
