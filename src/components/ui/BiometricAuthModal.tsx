/** BiometricAuthModal - Authentication modal supporting biometric (WebAuthn) and PIN-based verification with lockout protection */
import { useState, useEffect, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Fingerprint, Shield, Lock, AlertTriangle, CheckCircle, X, Eye, EyeOff } from "lucide-react";
import { toast } from "sonner";
import { setSecurePinHash, verifySecurePin, clearPinHash, hasPinHash } from "@/utils/pinSecurity";

const MAX_ATTEMPTS = 3;
const LOCKOUT_DURATION = 5 * 60 * 1000; // 5 minutes

type AuthStep = "prompt" | "setup" | "setup-confirm" | "verify" | "locked";

interface BiometricAuthModalProps {
  open: boolean;
  onClose: () => void;
  onSuccess: () => void;
  onSetupComplete?: () => void;
  reason?: string;
}

/**
 * BiometricAuthModal - Modal dialog for biometric or PIN-based authentication with setup wizard and lockout protection.
 * @param open - Whether the modal is visible
 * @param onClose - Callback when the modal is closed
 * @param onSuccess - Callback on successful authentication
 * @param onSetupComplete - Optional callback when PIN/biometric setup completes
 * @param reason - Display reason for authentication prompt (default "Authenticate to continue")
 */
export default function BiometricAuthModal({
  open,
  onClose,
  onSuccess,
  onSetupComplete,
  reason = "Authenticate to continue",
}: BiometricAuthModalProps) {
  const [step, setStep] = useState<AuthStep>("prompt");
  const [pin, setPin] = useState("");
  const [confirmPin, setConfirmPin] = useState("");
  const [attempts, setAttempts] = useState(0);
  const [lockoutUntil, setLockoutUntil] = useState<number | null>(null);
  const [showPin, setShowPin] = useState(false);
  const [biometricEnabled, setBiometricEnabled] = useState(false);
  const [biometricAvailable, setBiometricAvailable] = useState(false);

  useEffect(() => {
    const stored = sessionStorage.getItem("peys_biometric_enabled");
    setBiometricEnabled(stored === "true" && hasPinHash());
    
    const storedAttempts = sessionStorage.getItem("peys_auth_attempts");
    if (storedAttempts) setAttempts(parseInt(storedAttempts, 10));
    
    const storedLockout = sessionStorage.getItem("peys_auth_lockout");
    if (storedLockout) {
      const lockTime = parseInt(storedLockout, 10);
      if (lockTime > Date.now()) {
        setLockoutUntil(lockTime);
        setStep("locked");
      } else {
        sessionStorage.removeItem("peys_auth_lockout");
      }
    }

    if (window.PublicKeyCredential) {
      setBiometricAvailable(true);
    }
  }, [open]);

  const checkBiometric = useCallback(async (): Promise<boolean> => {
    if (!window.PublicKeyCredential || !biometricEnabled) return false;
    
    try {
      const credential = await navigator.credentials.get({
        publicKey: {
          challenge: new Uint8Array(32),
          timeout: 60000,
          userVerification: "required",
        },
      });
      return !!credential;
    } catch {
      return false;
    }
  }, [biometricEnabled]);

  const registerBiometric = async (): Promise<boolean> => {
    if (!window.PublicKeyCredential) return false;
    
    try {
      await navigator.credentials.create({
        publicKey: {
          challenge: new Uint8Array(32),
          timeout: 60000,
          rp: { name: "Peys", id: window.location.hostname },
          user: { id: new Uint8Array(16), name: "user@peys.io", displayName: "Peys User" },
          pubKeyCredParams: [{ alg: -7, type: "public-key" }, { alg: -257, type: "public-key" }],
          authenticatorSelection: { authenticatorAttachment: "platform", userVerification: "required" },
        },
      });
      return true;
    } catch {
      return false;
    }
  };

  const handleBiometricPrompt = async () => {
    const success = await checkBiometric();
    if (success) {
      toast.success("Authentication successful");
      onSuccess();
      onClose();
    } else {
      toast.error("Biometric authentication failed");
    }
  };

  const handleSetup = async () => {
    if (pin.length !== 4) {
      toast.error("PIN must be 4 digits");
      return;
    }
    setStep("setup-confirm");
  };

  const handleSetupConfirm = async () => {
    if (confirmPin !== pin) {
      toast.error("PINs do not match");
      setConfirmPin("");
      return;
    }
    
    await setSecurePinHash(pin);
    sessionStorage.setItem("peys_biometric_enabled", "true");
    
    if (biometricAvailable) {
      const registered = await registerBiometric();
      if (!registered) {
        toast.warning("Biometric registration failed. PIN-only mode enabled.");
      }
    }
    
    setBiometricEnabled(true);
    toast.success("Authentication setup complete");
    onSetupComplete?.();
    onSuccess();
    onClose();
  };

  const handlePinVerify = async () => {
    const isValid = await verifySecurePin(pin);
    if (isValid) {
      setAttempts(0);
      sessionStorage.removeItem("peys_auth_attempts");
      toast.success("Authentication successful");
      onSuccess();
      onClose();
    } else {
      const newAttempts = attempts + 1;
      setAttempts(newAttempts);
      sessionStorage.setItem("peys_auth_attempts", newAttempts.toString());
      setPin("");
      
      if (newAttempts >= MAX_ATTEMPTS) {
        const lockout = Date.now() + LOCKOUT_DURATION;
        setLockoutUntil(lockout);
        setStep("locked");
        sessionStorage.setItem("peys_auth_lockout", lockout.toString());
        toast.error("Too many failed attempts. Please wait 5 minutes.");
      } else {
        toast.error(`Incorrect PIN. ${MAX_ATTEMPTS - newAttempts} attempts remaining.`);
      }
    }
  };

  const handleDisableBiometric = () => {
    sessionStorage.removeItem("peys_biometric_enabled");
    clearPinHash();
    setBiometricEnabled(false);
    toast.info("Biometric authentication disabled");
    onClose();
  };

  useEffect(() => {
    if (!open) return;
    
    if (!biometricEnabled) {
      setStep("setup");
    } else {
      setStep("prompt");
    }
  }, [open, biometricEnabled]);

  if (!open) return null;

  const remainingTime = lockoutUntil ? Math.max(0, Math.ceil((lockoutUntil - Date.now()) / 1000)) : 0;

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4"
        onClick={(e) => e.target === e.currentTarget && onClose()}
      >
        <motion.div
          initial={{ scale: 0.95, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          exit={{ scale: 0.95, opacity: 0 }}
          className="w-full max-w-sm rounded-2xl border border-border bg-card p-6 shadow-xl"
        >
          {/* Close button */}
          <button
            onClick={onClose}
            className="absolute right-4 top-4 rounded-lg p-1 text-muted-foreground transition-colors hover:bg-secondary hover:text-foreground"
          >
            <X className="h-5 w-5" />
          </button>

          {/* Locked State */}
          {step === "locked" && (
            <div className="text-center">
              <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-destructive/10">
                <Lock className="h-8 w-8 text-destructive" />
              </div>
              <h3 className="mb-2 font-display text-xl text-foreground">Account Locked</h3>
              <p className="mb-4 text-sm text-muted-foreground">
                Too many failed attempts. Please wait before trying again.
              </p>
              <div className="rounded-lg border border-destructive/20 bg-destructive/5 p-4">
                <p className="font-mono text-2xl text-destructive">
                  {Math.floor(remainingTime / 60)}:{(remainingTime % 60).toString().padStart(2, "0")}
                </p>
              </div>
            </div>
          )}

          {/* Setup Wizard */}
          {(step === "setup" || step === "setup-confirm") && (
            <div>
              <div className="mb-6 text-center">
                <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-primary/10">
                  <Shield className="h-8 w-8 text-primary" />
                </div>
                <h3 className="mb-2 font-display text-xl text-foreground">Secure Your Account</h3>
                <p className="text-sm text-muted-foreground">
                  {step === "setup" 
                    ? "Set up a PIN to protect your transactions."
                    : "Confirm your PIN to complete setup."}
                </p>
              </div>

              {step === "setup" ? (
                <>
                  <div className="mb-6">
                    <label className="mb-2 block text-sm font-medium text-foreground">Enter 4-digit PIN</label>
                    <div className="flex justify-center gap-2">
                      {[0, 1, 2, 3].map((idx) => (
                        <input
                          key={idx}
                          type={showPin ? "text" : "password"}
                          inputMode="numeric"
                          maxLength={1}
                          value={pin[idx] || ""}
                          onChange={(e) => {
                            const val = e.target.value.replace(/\D/g, "");
                            if (val.length <= 1) {
                              const newPin = pin.split("");
                              newPin[idx] = val;
                              setPin(newPin.join(""));
                              if (val && idx < 3) {
                                const nextInput = document.querySelectorAll<HTMLInputElement>("input[data-pin-idx]")[idx + 1];
                                nextInput?.focus();
                              }
                            }
                          }}
                          data-pin-idx={idx}
                          className="w-14 h-14 text-center text-xl font-semibold border border-border rounded-lg bg-background focus:outline-none focus:ring-2 focus:ring-primary"
                        />
                      ))}
                    </div>
                    <button
                      type="button"
                      onClick={() => setShowPin(!showPin)}
                      className="mt-2 mx-auto flex items-center gap-1 text-xs text-muted-foreground hover:text-foreground"
                    >
                      {showPin ? <EyeOff className="h-3 w-3" /> : <Eye className="h-3 w-3" />}
                      {showPin ? "Hide" : "Show"} PIN
                    </button>
                  </div>

                  <button
                    onClick={handleSetup}
                    disabled={pin.length !== 4}
                    className="w-full rounded-xl bg-primary py-3 text-sm font-semibold text-primary-foreground shadow-glow transition-opacity hover:opacity-90 disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    Continue
                  </button>
                </>
              ) : (
                <>
                  <div className="mb-6">
                    <label className="mb-2 block text-sm font-medium text-foreground">Confirm your PIN</label>
                    <div className="flex justify-center gap-2">
                      {[0, 1, 2, 3].map((idx) => (
                        <input
                          key={idx}
                          type={showPin ? "text" : "password"}
                          inputMode="numeric"
                          maxLength={1}
                          value={confirmPin[idx] || ""}
                          onChange={(e) => {
                            const val = e.target.value.replace(/\D/g, "");
                            if (val.length <= 1) {
                              const newPin = confirmPin.split("");
                              newPin[idx] = val;
                              setConfirmPin(newPin.join(""));
                              if (val && idx < 3) {
                                const nextInput = document.querySelectorAll<HTMLInputElement>("input[data-confirm-pin-idx]")[idx + 1];
                                nextInput?.focus();
                              }
                            }
                          }}
                          data-confirm-pin-idx={idx}
                          className="w-14 h-14 text-center text-xl font-semibold border border-border rounded-lg bg-background focus:outline-none focus:ring-2 focus:ring-primary"
                        />
                      ))}
                    </div>
                  </div>

                  <div className="space-y-2">
                    <button
                      onClick={handleSetupConfirm}
                      disabled={confirmPin.length !== 4}
                      className="w-full rounded-xl bg-primary py-3 text-sm font-semibold text-primary-foreground shadow-glow transition-opacity hover:opacity-90 disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                      Complete Setup
                    </button>
                    <button
                      onClick={() => { setStep("setup"); setConfirmPin(""); }}
                      className="w-full rounded-xl border border-border py-3 text-sm font-medium text-foreground transition-colors hover:bg-secondary"
                    >
                      Back
                    </button>
                  </div>
                </>
              )}
            </div>
          )}

          {/* Prompt Dialog */}
          {step === "prompt" && (
            <div>
              <div className="mb-6 text-center">
                <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-primary/10">
                  <Shield className="h-8 w-8 text-primary" />
                </div>
                <h3 className="mb-2 font-display text-xl text-foreground">Authentication Required</h3>
                <p className="text-sm text-muted-foreground">{reason}</p>
              </div>

              {biometricAvailable && biometricEnabled && (
                <button
                  onClick={handleBiometricPrompt}
                  className="mb-4 flex w-full items-center justify-center gap-3 rounded-xl border border-border py-3 text-sm font-medium text-foreground transition-colors hover:bg-secondary"
                >
                  <Fingerprint className="h-5 w-5 text-primary" />
                  Use Biometric
                </button>
              )}

              <button
                onClick={() => setStep("verify")}
                className="mb-3 flex w-full items-center justify-center gap-2 rounded-xl bg-primary py-3 text-sm font-semibold text-primary-foreground shadow-glow transition-opacity hover:opacity-90"
              >
                <Lock className="h-4 w-4" />
                Use PIN
              </button>

              <button
                onClick={onClose}
                className="w-full rounded-xl border border-border py-3 text-sm font-medium text-muted-foreground transition-colors hover:bg-secondary hover:text-foreground"
              >
                Cancel
              </button>
            </div>
          )}

          {/* PIN Verification */}
          {step === "verify" && (
            <div>
              <button
                onClick={() => { setStep("prompt"); setPin(""); }}
                className="mb-4 text-sm text-muted-foreground hover:text-foreground"
              >
                ← Back
              </button>

              <div className="mb-6 text-center">
                <h3 className="mb-2 font-display text-xl text-foreground">Enter PIN</h3>
                <p className="text-sm text-muted-foreground">
                  {attempts > 0 && `${MAX_ATTEMPTS - attempts} attempts remaining`}
                </p>
              </div>

              <div className="mb-6">
                <div className="flex justify-center gap-2">
                  {[0, 1, 2, 3].map((idx) => (
                    <div
                      key={idx}
                      className={`w-14 h-14 flex items-center justify-center text-xl font-semibold border rounded-lg ${
                        pin[idx] ? "bg-primary/10 border-primary" : "bg-background border-border"
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
                  className="mt-2 mx-auto flex items-center gap-1 text-xs text-muted-foreground hover:text-foreground"
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
                      if (key === "DEL") {
                        setPin((p) => p.slice(0, -1));
                      } else if (key && pin.length < 4) {
                        setPin((p) => p + key);
                      }
                    }}
                    disabled={!key}
                    className={`rounded-lg py-3 text-lg font-medium transition-colors ${
                      key
                        ? "border border-border bg-background hover:bg-secondary"
                        : "border-transparent"
                    } ${key === "DEL" ? "text-muted-foreground text-sm" : "text-foreground"}`}
                  >
                    {key}
                  </button>
                ))}
              </div>

              <button
                onClick={handlePinVerify}
                disabled={pin.length !== 4}
                className="w-full rounded-xl bg-primary py-3 text-sm font-semibold text-primary-foreground shadow-glow transition-opacity hover:opacity-90 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                Verify
              </button>

              <button
                onClick={handleDisableBiometric}
                className="mt-3 w-full text-center text-xs text-muted-foreground hover:text-foreground"
              >
                Disable authentication
              </button>
            </div>
          )}
        </motion.div>
      </motion.div>
    </AnimatePresence>
  );
}

export function useBiometricAuth() {
  const [showAuth, setShowAuth] = useState(false);
  const [authReason, setAuthReason] = useState("");
  const [authCallback, setAuthCallback] = useState<(() => void) | null>(null);

  const requireAuth = useCallback((reason: string, onSuccess: () => void) => {
    const enabled = sessionStorage.getItem("peys_biometric_enabled") === "true";
    if (!enabled) {
      onSuccess();
      return;
    }
    setAuthReason(reason);
    setAuthCallback(() => onSuccess);
    setShowAuth(true);
  }, []);

  const handleSuccess = useCallback(() => {
    authCallback?.();
    setShowAuth(false);
    setAuthCallback(null);
  }, [authCallback]);

  return {
    requireAuth,
    BiometricAuthModal: () => (
      <BiometricAuthModal
        open={showAuth}
        onClose={() => setShowAuth(false)}
        onSuccess={handleSuccess}
        reason={authReason}
      />
    ),
  };
}
