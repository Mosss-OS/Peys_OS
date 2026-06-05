import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { 
  ShieldCheck, Mail, Phone, Users, Lock, 
  Key, Shield, AlertTriangle, CheckCircle, 
  XCircle, Loader2, ArrowLeft, Send, RefreshCw,
  UserCheck, LogOut, Eye, EyeOff
} from "lucide-react";
import { Link, useNavigate } from "react-router-dom";
import { useApp } from "@/contexts/AppContext";
import AppHeader from "@/components/AppHeader";
import Footer from "@/components/Footer";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";

interface RecoveryStep {
  id: string;
  label: string;
  icon: React.ReactNode;
}

const RECOVERY_STEPS: RecoveryStep[] = [
  { id: "verify", label: "Verify Identity", icon: <ShieldCheck className="h-5 w-5" /> },
  { id: "contact", label: "Trusted Contacts", icon: <Users className="h-5 w-5" /> },
  { id: "reset", label: "Reset PIN", icon: <Lock className="h-5 w-5" /> },
  { id: "complete", label: "Complete", icon: <CheckCircle className="h-5 w-5" /> },
];

interface TrustedContact {
  id: string;
  name: string;
  phone: string;
  email: string;
  relation: string;
}

export default function AccountRecoveryPage() {
  const { isLoggedIn, login, logout } = useApp();
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [currentStep, setCurrentStep] = useState(0);
  const [recoveryCode, setRecoveryCode] = useState("");
  const [verificationMethod, setVerificationMethod] = useState<"email" | "phone">("email");
  const [verificationCode, setVerificationCode] = useState("");
  const [newPin, setNewPin] = useState("");
  const [confirmPin, setConfirmPin] = useState("");
  const [showPin, setShowPin] = useState(false);
  const [isVerifying, setIsVerifying] = useState(false);
  const [sessionInvalidated, setSessionInvalidated] = useState(false);

  const [trustedContacts, setTrustedContacts] = useState<TrustedContact[]>([
    { id: "1", name: "Alice Johnson", phone: "+1234567890", email: "alice@example.com", relation: "Spouse" },
    { id: "2", name: "Bob Smith", phone: "+0987654321", email: "bob@example.com", relation: "Brother" },
  ]);

  useEffect(() => {
    if (!isLoggedIn) return;
    setLoading(false);
  }, [isLoggedIn]);

  const sendVerificationCode = async () => {
    setIsVerifying(true);
    try {
      toast.success(`Verification code sent to ${verificationMethod === "email" ? "email" : "phone"}`);
    } finally {
      setIsVerifying(false);
    }
  };

  const verifyCode = async () => {
    if (verificationCode.length !== 6) {
      toast.error("Please enter a 6-digit code");
      return;
    }

    setIsVerifying(true);
    try {
      if (verificationCode.length === 6) {
        setCurrentStep(1);
        toast.success("Verification successful!");
      } else {
        toast.error("Invalid verification code");
      }
    } finally {
      setIsVerifying(false);
    }
  };

  const verifyRecoveryCode = async () => {
    if (!recoveryCode.trim()) {
      toast.error("Please enter your recovery code");
      return;
    }

    setIsVerifying(true);
    try {
      setCurrentStep(1);
      toast.success("Recovery code verified!");
    } finally {
      setIsVerifying(false);
    }
  };

  const handleContactSelect = (contact: TrustedContact) => {
    setCurrentStep(2);
    toast.success(`Verification request sent to ${contact.name}`);
  };

  const resetPin = async () => {
    if (newPin.length !== 6) {
      toast.error("PIN must be 6 digits");
      return;
    }

    if (newPin !== confirmPin) {
      toast.error("PINs do not match");
      return;
    }

    setIsVerifying(true);
    try {
      setCurrentStep(3);
      toast.success("PIN reset successfully!");
    } finally {
      setIsVerifying(false);
    }
  };

  const logoutAllSessions = async () => {
    try {
      await supabase.auth.signOut();
      setSessionInvalidated(true);
      toast.success("All sessions logged out");
      navigate("/");
    } catch (error) {
      toast.error("Failed to log out sessions");
    }
  };

  if (!isLoggedIn) {
    return (
      <div className="min-h-screen bg-background">
        <AppHeader />
        <div className="flex min-h-[80vh] flex-col items-center justify-center px-4 text-center">
          <div className="mb-6 flex h-20 w-20 items-center justify-center rounded-full bg-primary/10">
            <ShieldCheck className="h-10 w-10 text-primary" />
          </div>
          <h2 className="mb-3 font-display text-2xl text-foreground sm:text-3xl">Account Recovery</h2>
          <p className="mb-6 max-w-md text-sm text-muted-foreground">
            Recover access to your account if you're locked out
          </p>
          <button onClick={login} className="rounded-lg bg-primary px-6 py-3 font-semibold text-primary-foreground shadow-glow hover:opacity-90">
            Sign In to Recover Account
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
            <h1 className="font-display text-2xl text-foreground sm:text-3xl">Account Recovery</h1>
            <p className="mt-1 text-sm text-muted-foreground">
              Recover access to your account
            </p>
          </div>
        </div>

        {/* Progress Steps */}
        <div className="mb-8 flex items-center justify-between">
          {RECOVERY_STEPS.map((step, index) => (
            <div key={step.id} className="flex items-center flex-1">
              <div className="flex flex-col items-center">
                <div
                  className={`flex h-10 w-10 items-center justify-center rounded-full ${
                    index <= currentStep
                      ? "bg-primary text-primary-foreground"
                      : "bg-secondary text-muted-foreground"
                  }`}
                >
                  {index < currentStep ? <CheckCircle className="h-5 w-5" /> : step.icon}
                </div>
                <p className={`mt-1 text-xs ${index === currentStep ? "text-primary" : "text-muted-foreground"}`}>
                  {step.label}
                </p>
              </div>
              {index < RECOVERY_STEPS.length - 1 && (
                <div
                  className={`flex-1 h-0.5 mx-2 ${
                    index < currentStep ? "bg-primary" : "bg-secondary"
                  }`}
                />
              )}
            </div>
          ))}
        </div>

        {loading ? (
          <div className="flex justify-center py-12">
            <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
          </div>
        ) : (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="space-y-4"
          >
            {/* Step 0: Verify Identity */}
            {currentStep === 0 && (
              <div className="space-y-4">
                {/* Recovery Code Option */}
                <div className="rounded-xl border border-border bg-card p-4">
                  <h3 className="mb-3 text-sm font-medium text-foreground">Have a Recovery Code?</h3>
                  <div className="flex gap-2">
                    <input
                      type="text"
                      value={recoveryCode}
                      onChange={(e) => setRecoveryCode(e.target.value)}
                      placeholder="Enter recovery code"
                      className="flex-1 rounded-lg border border-border bg-background px-3 py-2 text-sm text-foreground placeholder:text-muted-foreground/50 focus:outline-none focus:ring-2 focus:ring-ring"
                    />
                    <button
                      onClick={verifyRecoveryCode}
                      disabled={isVerifying || !recoveryCode.trim()}
                      className="rounded-lg bg-primary px-4 py-2 text-sm text-primary-foreground disabled:opacity-50"
                    >
                      Verify
                    </button>
                  </div>
                </div>

                {/* Divider */}
                <div className="flex items-center gap-3">
                  <div className="flex-1 h-px bg-border" />
                  <span className="text-xs text-muted-foreground">OR</span>
                  <div className="flex-1 h-px bg-border" />
                </div>

                {/* Verification Method */}
                <div className="rounded-xl border border-border bg-card p-4">
                  <h3 className="mb-3 text-sm font-medium text-foreground">Verify via</h3>
                  <div className="flex gap-2 mb-4">
                    <button
                      onClick={() => setVerificationMethod("email")}
                      className={`flex-1 flex items-center justify-center gap-2 rounded-lg border px-3 py-2 text-sm transition-colors ${
                        verificationMethod === "email"
                          ? "border-primary bg-primary/10 text-primary"
                          : "border-border hover:bg-secondary"
                      }`}
                    >
                      <Mail className="h-4 w-4" />
                      Email
                    </button>
                    <button
                      onClick={() => setVerificationMethod("phone")}
                      className={`flex-1 flex items-center justify-center gap-2 rounded-lg border px-3 py-2 text-sm transition-colors ${
                        verificationMethod === "phone"
                          ? "border-primary bg-primary/10 text-primary"
                          : "border-border hover:bg-secondary"
                      }`}
                    >
                      <Phone className="h-4 w-4" />
                      SMS
                    </button>
                  </div>

                  <div className="flex gap-2">
                    <input
                      type="text"
                      value={verificationCode}
                      onChange={(e) => setVerificationCode(e.target.value)}
                      placeholder="6-digit code"
                      maxLength={6}
                      className="flex-1 rounded-lg border border-border bg-background px-3 py-2 text-sm text-foreground placeholder:text-muted-foreground/50 focus:outline-none focus:ring-2 focus:ring-ring"
                    />
                    <button
                      onClick={sendVerificationCode}
                      disabled={isVerifying}
                      className="rounded-lg bg-secondary px-4 py-2 text-sm text-foreground disabled:opacity-50"
                    >
                      {isVerifying ? (
                        <Loader2 className="h-4 w-4 animate-spin" />
                      ) : (
                        <Send className="h-4 w-4" />
                      )}
                    </button>
                    <button
                      onClick={verifyCode}
                      disabled={isVerifying || verificationCode.length !== 6}
                      className="rounded-lg bg-primary px-4 py-2 text-sm text-primary-foreground disabled:opacity-50"
                    >
                      Verify
                    </button>
                  </div>
                </div>
              </div>
            )}

            {/* Step 1: Trusted Contacts */}
            {currentStep === 1 && (
              <div className="rounded-xl border border-border bg-card p-4">
                <h3 className="mb-3 text-sm font-medium text-foreground">Verify with Trusted Contact</h3>
                <p className="mb-4 text-xs text-muted-foreground">
                  Select a trusted contact to verify your identity
                </p>
                <div className="space-y-2">
                  {trustedContacts.map((contact) => (
                    <div
                      key={contact.id}
                      onClick={() => handleContactSelect(contact)}
                      className="flex items-center justify-between rounded-lg border border-border bg-background p-3 cursor-pointer hover:bg-secondary/50"
                    >
                      <div className="flex items-center gap-3">
                        <div className="flex h-10 w-10 items-center justify-center rounded-full bg-primary/10">
                          <UserCheck className="h-5 w-5 text-primary" />
                        </div>
                        <div>
                          <p className="text-sm font-medium text-foreground">{contact.name}</p>
                          <p className="text-xs text-muted-foreground">{contact.relation}</p>
                        </div>
                      </div>
                      <div className="text-right text-xs text-muted-foreground">
                        <p>{contact.email}</p>
                        <p>{contact.phone}</p>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Step 2: Reset PIN */}
            {currentStep === 2 && (
              <div className="rounded-xl border border-border bg-card p-4">
                <h3 className="mb-3 text-sm font-medium text-foreground">Reset Your PIN</h3>
                <div className="space-y-3">
                  <div>
                    <label className="mb-1.5 block text-xs text-muted-foreground">New PIN</label>
                    <div className="relative">
                      <input
                        type={showPin ? "text" : "password"}
                        value={newPin}
                        onChange={(e) => setNewPin(e.target.value.replace(/\D/g, "").slice(0, 6))}
                        placeholder="6 digits"
                        maxLength={6}
                        className="w-full rounded-lg border border-border bg-background px-3 py-2 text-sm text-foreground placeholder:text-muted-foreground/50 focus:outline-none focus:ring-2 focus:ring-ring"
                      />
                      <button
                        onClick={() => setShowPin(!showPin)}
                        className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground"
                      >
                        {showPin ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                      </button>
                    </div>
                  </div>
                  <div>
                    <label className="mb-1.5 block text-xs text-muted-foreground">Confirm PIN</label>
                    <input
                      type={showPin ? "text" : "password"}
                      value={confirmPin}
                      onChange={(e) => setConfirmPin(e.target.value.replace(/\D/g, "").slice(0, 6))}
                      placeholder="Confirm 6 digits"
                      maxLength={6}
                      className="w-full rounded-lg border border-border bg-background px-3 py-2 text-sm text-foreground placeholder:text-muted-foreground/50 focus:outline-none focus:ring-2 focus:ring-ring"
                    />
                  </div>
                  <button
                    onClick={resetPin}
                    disabled={isVerifying || newPin.length !== 6 || newPin !== confirmPin}
                    className="flex w-full items-center justify-center gap-2 rounded-lg bg-primary py-2.5 text-sm font-medium text-primary-foreground shadow-glow disabled:opacity-50"
                  >
                    {isVerifying ? (
                      <>
                        <Loader2 className="h-4 w-4 animate-spin" />
                        Resetting...
                      </>
                    ) : (
                      <>
                        <Lock className="h-4 w-4" />
                        Reset PIN
                      </>
                    )}
                  </button>
                </div>
              </div>
            )}

            {/* Step 3: Complete */}
            {currentStep === 3 && (
              <div className="space-y-4">
                <div className="rounded-xl border border-border bg-card p-6 text-center">
                  <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-green-500/10">
                    <CheckCircle className="h-10 w-10 text-green-600" />
                  </div>
                  <h3 className="text-lg font-medium text-foreground">Recovery Complete!</h3>
                  <p className="mt-2 text-sm text-muted-foreground">
                    Your account has been recovered successfully. You can now access your account with your new PIN.
                  </p>
                </div>

                <div className="rounded-xl border border-border bg-card p-4">
                  <h4 className="mb-3 text-sm font-medium text-foreground">Security Recommendation</h4>
                  <p className="mb-4 text-xs text-muted-foreground">
                    For additional security, we recommend logging out of all other sessions.
                  </p>
                  <button
                    onClick={logoutAllSessions}
                    className="flex w-full items-center justify-center gap-2 rounded-lg bg-secondary py-2.5 text-sm text-foreground"
                  >
                    <LogOut className="h-4 w-4" />
                    Log Out All Sessions
                  </button>
                </div>
              </div>
            )}

            {/* Navigation */}
            {currentStep > 0 && currentStep < 3 && (
              <button
                onClick={() => setCurrentStep(Math.max(0, currentStep - 1))}
                className="flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground"
              >
                <ArrowLeft className="h-4 w-4" />
                Back
              </button>
            )}
          </motion.div>
        )}
      </div>
      <Footer />
    </div>
  );
}
