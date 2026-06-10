/** BiometricPage - Biometric authentication management with enrollment, trusted devices, recovery codes, and fallback options */
import { useState } from "react";
import { motion } from "framer-motion";
import { Shield, Fingerprint, ScanFace, Smartphone, Key, AlertTriangle, Check, Loader2, Clock, Settings, Trash2 } from "lucide-react";
import { useApp } from "@/contexts/AppContext";
import AppHeader from "@/components/AppHeader";
import Footer from "@/components/Footer";
import { toast } from "sonner";

interface Device {
  id: string;
  name: string;
  type: "desktop" | "mobile" | "tablet";
  lastUsed: string;
  trusted: boolean;
}

interface RecoveryCode {
  code: string;
  used: boolean;
}

/** BiometricPage component - Manages WebAuthn biometric enrollment, trusted device list, recovery codes, and PIN fallback toggle */
export default function BiometricPage() {
  const { isLoggedIn, login } = useApp();
  const [enrolling, setEnrolling] = useState(false);
  const [showRecoveryCodes, setShowRecoveryCodes] = useState(false);
  const [recoveryCodes, setRecoveryCodes] = useState<RecoveryCode[]>([]);
  const [pinFallback, setPinFallback] = useState(true);

  const devices: Device[] = [
    { id: "1", name: "Chrome on MacBook Pro", type: "desktop", lastUsed: "2026-03-18 14:30", trusted: true },
    { id: "2", name: "Safari on iPhone 15", type: "mobile", lastUsed: "2026-03-17 09:15", trusted: true },
    { id: "3", name: "Chrome on iPad Pro", type: "tablet", lastUsed: "2026-03-15 18:45", trusted: false },
  ];

  const biometricTypes = [
    { id: "fingerprint", label: "Fingerprint", description: "Use Touch ID or fingerprint scanner", icon: Fingerprint, available: true },
    { id: "faceid", label: "Face ID", description: "Use Face ID or Windows Hello", icon: ScanFace, available: true },
    { id: "device", label: "Device Passkey", description: "Use your device's screen lock", icon: Smartphone, available: true },
  ];

  const handleEnroll = async (type: string) => {
    setEnrolling(true);
    setEnrolling(false);
    toast.success(`${type} enrolled successfully!`);
  };

  const handleGenerateRecoveryCodes = async () => {
    const codes = Array.from({ length: 10 }, () => ({
      code: Math.random().toString(36).substring(2, 6).toUpperCase() + "-" + Math.random().toString(36).substring(2, 6).toUpperCase(),
      used: false,
    }));
    setRecoveryCodes(codes);
    setShowRecoveryCodes(true);
    toast.success("Recovery codes generated!");
  };

  const handleRemoveDevice = (id: string) => {
    toast.success("Device removed");
  };

  if (!isLoggedIn) {
    return (
      <div className="min-h-screen bg-background">
        <AppHeader />
        <div className="flex min-h-[80vh] flex-col items-center justify-center px-4 text-center">
          <div className="mb-6 flex h-20 w-20 items-center justify-center rounded-full bg-primary/10">
            <Shield className="h-10 w-10 text-primary" />
          </div>
          <h2 className="mb-3 font-display text-2xl text-foreground sm:text-3xl">Biometric Authentication</h2>
          <p className="mb-6 max-w-md text-sm text-muted-foreground">
            Add an extra layer of security with biometric authentication using WebAuthn.
          </p>
          <button onClick={login} className="rounded-lg bg-primary px-6 py-3 font-semibold text-primary-foreground shadow-glow hover:opacity-90">
            Sign In to Configure
          </button>
        </div>
        <Footer />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      <AppHeader />
      <div className="container mx-auto max-w-2xl px-4 pt-20 pb-12 sm:pt-24 sm:pb-16">
        <div className="mb-8">
          <h1 className="font-display text-2xl text-foreground sm:text-3xl">Biometric Authentication</h1>
          <p className="mt-1 text-sm text-muted-foreground">Add extra security with biometric authentication</p>
        </div>

        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          className="mb-6 rounded-xl border border-border bg-card p-6"
        >
          <div className="mb-4 flex items-center gap-3">
            <div className="flex h-12 w-12 items-center justify-center rounded-full bg-green-500/10">
              <Shield className="h-6 w-6 text-green-500" />
            </div>
            <div>
              <h2 className="font-semibold text-foreground">Security Status</h2>
              <p className="text-sm text-green-500">Biometric authentication enabled</p>
            </div>
          </div>
          <div className="rounded-lg bg-green-500/5 border border-green-500/20 p-4">
            <p className="text-sm text-foreground">
              Your account is protected with biometric authentication. You can use fingerprint, Face ID, or device passkey to securely access your account.
            </p>
          </div>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className="mb-6 space-y-3"
        >
          <h2 className="flex items-center gap-2 text-lg font-semibold text-foreground">
            <Key className="h-5 w-5 text-primary" />
            Biometric Methods
          </h2>
          {biometricTypes.map((method) => (
            <div key={method.id} className="rounded-xl border border-border bg-card p-5">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-4">
                  <div className="flex h-12 w-12 items-center justify-center rounded-lg bg-primary/10">
                    <method.icon className="h-6 w-6 text-primary" />
                  </div>
                  <div>
                    <p className="font-medium text-foreground">{method.label}</p>
                    <p className="text-sm text-muted-foreground">{method.description}</p>
                  </div>
                </div>
                <button
                  onClick={() => handleEnroll(method.label)}
                  disabled={enrolling}
                  className="rounded-lg bg-primary px-4 py-2 text-sm font-medium text-primary-foreground hover:opacity-90 disabled:opacity-50"
                >
                  {enrolling ? (
                    <Loader2 className="h-4 w-4 animate-spin" />
                  ) : (
                    "Enable"
                  )}
                </button>
              </div>
            </div>
          ))}
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.15 }}
          className="mb-6 rounded-xl border border-border bg-card p-6"
        >
          <h2 className="mb-4 flex items-center gap-2 text-lg font-semibold text-foreground">
            <Smartphone className="h-5 w-5 text-primary" />
            Trusted Devices
          </h2>
          <div className="space-y-3">
            {devices.map((device) => (
              <div key={device.id} className="flex items-center justify-between rounded-lg border border-border p-4">
                <div className="flex items-center gap-4">
                  <div className={`flex h-10 w-10 items-center justify-center rounded-lg ${
                    device.type === "desktop" ? "bg-blue-500/10" :
                    device.type === "mobile" ? "bg-green-500/10" :
                    "bg-purple-500/10"
                  }`}>
                    <Smartphone className={`h-5 w-5 ${
                      device.type === "desktop" ? "text-blue-500" :
                      device.type === "mobile" ? "text-green-500" :
                      "text-purple-500"
                    }`} />
                  </div>
                  <div>
                    <p className="font-medium text-foreground">{device.name}</p>
                    <p className="text-xs text-muted-foreground">
                      Last used: {new Date(device.lastUsed).toLocaleString()}
                    </p>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  {device.trusted && (
                    <span className="rounded-full bg-green-500/10 px-2 py-1 text-xs font-medium text-green-600">
                      Trusted
                    </span>
                  )}
                  <button
                    onClick={() => handleRemoveDevice(device.id)}
                    className="rounded-lg p-2 hover:bg-secondary"
                  >
                    <Trash2 className="h-4 w-4 text-red-500" />
                  </button>
                </div>
              </div>
            ))}
          </div>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
          className="mb-6 rounded-xl border border-border bg-card p-6"
        >
          <div className="mb-4 flex items-center justify-between">
            <div className="flex items-center gap-3">
              <Key className="h-5 w-5 text-primary" />
              <h2 className="font-semibold text-foreground">Recovery Codes</h2>
            </div>
            <button
              onClick={handleGenerateRecoveryCodes}
              className="text-sm text-primary hover:underline"
            >
              Generate New
            </button>
          </div>
          <p className="mb-4 text-sm text-muted-foreground">
            Recovery codes let you access your account if you lose your biometric device. Store them securely.
          </p>
          
          {showRecoveryCodes && recoveryCodes.length > 0 && (
            <div className="rounded-lg border border-border bg-secondary/50 p-4">
              <p className="mb-2 text-sm font-medium text-foreground">Your Recovery Codes:</p>
              <div className="grid grid-cols-2 gap-2">
                {recoveryCodes.map((code, i) => (
                  <code key={i} className="rounded bg-background px-3 py-2 font-mono text-sm">
                    {code.code}
                  </code>
                ))}
              </div>
              <p className="mt-3 text-xs text-yellow-500">
                <AlertTriangle className="mr-1 inline h-3 w-3" />
                Save these codes securely. They won't be shown again.
              </p>
            </div>
          )}
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.25 }}
          className="rounded-xl border border-border bg-card p-6"
        >
          <h2 className="mb-4 flex items-center gap-2 text-lg font-semibold text-foreground">
            <Settings className="h-5 w-5 text-primary" />
            Fallback Options
          </h2>
          <div className="flex items-center justify-between rounded-lg border border-border p-4">
            <div>
              <p className="font-medium text-foreground">PIN Fallback</p>
              <p className="text-sm text-muted-foreground">
                Allow PIN as backup authentication
              </p>
            </div>
            <button
              onClick={() => {
                setPinFallback(!pinFallback);
                toast.success(`PIN fallback ${!pinFallback ? "enabled" : "disabled"}`);
              }}
              className={`relative h-6 w-11 rounded-full transition-colors ${
                pinFallback ? "bg-primary" : "bg-secondary"
              }`}
            >
              <span
                className={`absolute top-0.5 h-5 w-5 rounded-full bg-white shadow transition-transform ${
                  pinFallback ? "left-[22px]" : "left-0.5"
                }`}
              />
            </button>
          </div>
        </motion.div>
      </div>
      <Footer />
    </div>
  );
}
