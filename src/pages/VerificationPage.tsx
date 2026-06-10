/** VerificationPage - KYC identity verification flow with document upload, selfie capture, and tier-based limits */
import { useState, useRef } from "react";
import { motion } from "framer-motion";
import { Shield, Camera, Upload, Check, X, AlertTriangle, ChevronRight, Loader2, FileText, User, Building, CreditCard, Clock, Star, ExternalLink } from "lucide-react";
import { useApp } from "@/contexts/AppContext";
import AppHeader from "@/components/AppHeader";
import Footer from "@/components/Footer";
import { toast } from "sonner";

interface VerificationTier {
  id: string;
  name: string;
  requirements: string[];
  limits: {
    daily: string;
    monthly: string;
  };
  features: string[];
}

/** VerificationPage component - Handles KYC verification from intro through document upload, selfie, review, and completion */
export default function VerificationPage() {
  const { isLoggedIn, login } = useApp();
  const [step, setStep] = useState<"intro" | "upload" | "selfie" | "review" | "complete">("intro");
  const [documentType, setDocumentType] = useState<"id" | "passport" | "driver">("id");
  const [uploading, setUploading] = useState(false);
  const [documentUploaded, setDocumentUploaded] = useState(false);
  const [selfieUploaded, setSelfieUploaded] = useState(false);
  const [verificationStatus, setVerificationStatus] = useState<"none" | "pending" | "verified" | "failed">("none");
  const fileInputRef = useRef<HTMLInputElement>(null);
  const selfieInputRef = useRef<HTMLInputElement>(null);

  const tiers: VerificationTier[] = [
    {
      id: "basic",
      name: "Basic",
      requirements: ["Email verification"],
      limits: { daily: "$100", monthly: "$500" },
      features: ["Send & receive payments", "Basic support"],
    },
    {
      id: "standard",
      name: "Standard",
      requirements: ["Government ID", "Selfie verification"],
      limits: { daily: "$1,000", monthly: "$10,000" },
      features: ["Higher limits", "Priority support", "QR payments"],
    },
    {
      id: "premium",
      name: "Premium",
      requirements: ["Address verification", "Income source", "Enhanced KYC"],
      limits: { daily: "$10,000", monthly: "$100,000" },
      features: ["Business payments", "API access", "Dedicated support", "Custom branding"],
    },
  ];

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>, type: "document" | "selfie") => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (file.size > 10 * 1024 * 1024) {
      toast.error("File size must be less than 10MB");
      return;
    }

    setUploading(true);
    
    if (type === "document") {
      setDocumentUploaded(true);
      toast.success("Document uploaded successfully!");
    } else {
      setSelfieUploaded(true);
      toast.success("Selfie captured successfully!");
    }
    setUploading(false);
  };

  const handleSubmit = async () => {
    if (!documentUploaded || !selfieUploaded) {
      toast.error("Please complete all verification steps");
      return;
    }
    setVerificationStatus("pending");
    setStep("complete");
    toast.success("Verification submitted! We'll review within 24-48 hours.");
  };

  if (!isLoggedIn) {
    return (
      <div className="min-h-screen bg-background">
        <AppHeader />
        <div className="flex min-h-[80vh] flex-col items-center justify-center px-4 text-center">
          <div className="mb-6 flex h-20 w-20 items-center justify-center rounded-full bg-primary/10">
            <Shield className="h-10 w-10 text-primary" />
          </div>
          <h2 className="mb-3 font-display text-2xl text-foreground sm:text-3xl">Identity Verification</h2>
          <p className="mb-6 max-w-md text-sm text-muted-foreground">
            Complete KYC verification to unlock higher transaction limits and additional features.
          </p>
          <button onClick={login} className="rounded-lg bg-primary px-6 py-3 font-semibold text-primary-foreground shadow-glow hover:opacity-90">
            Sign In to Verify
          </button>
        </div>
        <Footer />
      </div>
    );
  }

  if (step === "complete") {
    return (
      <div className="min-h-screen bg-background">
        <AppHeader />
        <div className="container mx-auto max-w-2xl px-4 pt-20 pb-12 sm:pt-24 sm:pb-16">
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            className="rounded-xl border border-border bg-card p-8 text-center"
          >
            {verificationStatus === "pending" ? (
              <>
                <div className="mx-auto mb-6 flex h-20 w-20 items-center justify-center rounded-full bg-yellow-500/10">
                  <Clock className="h-10 w-10 text-yellow-500" />
                </div>
                <h2 className="mb-3 font-display text-2xl text-foreground">Verification Pending</h2>
                <p className="mb-6 text-sm text-muted-foreground">
                  Your documents are being reviewed. This usually takes 24-48 hours. We'll notify you once complete.
                </p>
                <div className="rounded-lg border border-border bg-secondary/50 p-4 text-left">
                  <p className="mb-2 text-sm font-medium text-foreground">What happens next?</p>
                  <ul className="space-y-2 text-sm text-muted-foreground">
                    <li className="flex items-center gap-2">
                      <Check className="h-4 w-4 text-yellow-500" />
                      Our team reviews your documents
                    </li>
                    <li className="flex items-center gap-2">
                      <Check className="h-4 w-4 text-yellow-500" />
                      You'll receive an email confirmation
                    </li>
                    <li className="flex items-center gap-2">
                      <Clock className="h-4 w-4 text-yellow-500" />
                      Processing time: 24-48 hours
                    </li>
                  </ul>
                </div>
              </>
            ) : (
              <>
                <div className="mx-auto mb-6 flex h-20 w-20 items-center justify-center rounded-full bg-green-500/10">
                  <Check className="h-10 w-10 text-green-500" />
                </div>
                <h2 className="mb-3 font-display text-2xl text-foreground">Verification Complete!</h2>
                <p className="mb-6 text-sm text-muted-foreground">
                  You've been verified! Enjoy higher transaction limits and all premium features.
                </p>
                <button
                  onClick={() => setStep("intro")}
                  className="rounded-lg bg-primary px-6 py-3 font-semibold text-primary-foreground hover:opacity-90"
                >
                  Go to Dashboard
                </button>
              </>
            )}
          </motion.div>
        </div>
        <Footer />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      <AppHeader />
      <div className="container mx-auto max-w-4xl px-4 pt-20 pb-12 sm:pt-24 sm:pb-16">
        <div className="mb-8">
          <h1 className="font-display text-2xl text-foreground sm:text-3xl">Identity Verification</h1>
          <p className="mt-1 text-sm text-muted-foreground">Complete KYC to unlock higher limits</p>
        </div>

        <div className="mb-8 flex items-center justify-center gap-4">
          {[
            { id: "intro", label: "Start", icon: User },
            { id: "upload", label: "Documents", icon: FileText },
            { id: "selfie", label: "Selfie", icon: Camera },
            { id: "review", label: "Review", icon: AlertTriangle },
          ].map((s, i) => (
            <div key={s.id} className="flex items-center">
              <div className={`flex items-center gap-2 rounded-full px-4 py-2 ${
                step === s.id ? "bg-primary text-primary-foreground" :
                ["upload", "selfie", "review"].indexOf(step) > ["upload", "selfie", "review"].indexOf(s.id as string) ? "bg-green-500/10 text-green-600" :
                "bg-secondary text-muted-foreground"
              }`}>
                <s.icon className="h-4 w-4" />
                <span className="text-sm font-medium">{s.label}</span>
              </div>
              {i < 3 && <ChevronRight className="mx-2 h-4 w-4 text-muted-foreground" />}
            </div>
          ))}
        </div>

        {step === "intro" && (
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            className="space-y-6"
          >
            <div className="rounded-xl border border-border bg-card p-6">
              <h2 className="mb-4 flex items-center gap-2 text-lg font-semibold text-foreground">
                <Shield className="h-5 w-5 text-primary" />
                Verification Tiers
              </h2>
              <div className="grid gap-4 md:grid-cols-3">
                {tiers.map((tier, i) => (
                  <div
                    key={tier.id}
                    className={`rounded-xl border p-5 ${
                      tier.id === "standard" ? "border-primary bg-primary/5" : "border-border"
                    }`}
                  >
                    {tier.id === "standard" && (
                      <span className="mb-2 inline-block rounded-full bg-primary px-2 py-0.5 text-xs font-medium text-primary-foreground">
                        Recommended
                      </span>
                    )}
                    <div className="flex items-center gap-2">
                      <Star className="h-5 w-5 text-primary" />
                      <h3 className="font-semibold text-foreground">{tier.name}</h3>
                    </div>
                    <div className="mt-3 space-y-2 text-sm text-muted-foreground">
                      <p>Daily: {tier.limits.daily}</p>
                      <p>Monthly: {tier.limits.monthly}</p>
                    </div>
                    <ul className="mt-4 space-y-1">
                      {tier.features.map((f) => (
                        <li key={f} className="flex items-center gap-2 text-sm">
                          <Check className="h-3 w-3 text-green-500" />
                          {f}
                        </li>
                      ))}
                    </ul>
                  </div>
                ))}
              </div>
            </div>

            <div className="rounded-xl border border-yellow-500/20 bg-yellow-500/5 p-6">
              <div className="flex items-start gap-3">
                <AlertTriangle className="mt-1 h-5 w-5 text-yellow-500" />
                <div>
                  <h3 className="font-medium text-foreground">Before you begin</h3>
                  <ul className="mt-2 space-y-1 text-sm text-muted-foreground">
                    <li>• Have your ID document ready (passport, national ID, or driver's license)</li>
                    <li>• Ensure good lighting for your selfie</li>
                    <li>• The process takes about 5 minutes</li>
                    <li>• Your data is encrypted and processed securely</li>
                  </ul>
                </div>
              </div>
            </div>

            <button
              onClick={() => setStep("upload")}
              className="w-full rounded-lg bg-primary px-4 py-3 font-semibold text-primary-foreground shadow-glow hover:opacity-90"
            >
              Start Verification
            </button>
          </motion.div>
        )}

        {step === "upload" && (
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            className="space-y-6"
          >
            <div className="rounded-xl border border-border bg-card p-6">
              <h2 className="mb-4 flex items-center gap-2 text-lg font-semibold text-foreground">
                <CreditCard className="h-5 w-5 text-primary" />
                Document Upload
              </h2>
              <div className="mb-4">
                <label className="mb-2 block text-sm font-medium text-muted-foreground">Document Type</label>
                <div className="flex gap-3">
                  {[
                    { id: "id", label: "National ID" },
                    { id: "passport", label: "Passport" },
                    { id: "driver", label: "Driver's License" },
                  ].map((type) => (
                    <button
                      key={type.id}
                      onClick={() => setDocumentType(type.id as typeof documentType)}
                      className={`flex-1 rounded-lg border px-4 py-3 text-sm font-medium transition-colors ${
                        documentType === type.id
                          ? "border-primary bg-primary/10 text-primary"
                          : "border-border hover:bg-secondary"
                      }`}
                    >
                      {type.label}
                    </button>
                  ))}
                </div>
              </div>

              <input
                ref={fileInputRef}
                type="file"
                accept="image/*,.pdf"
                onChange={(e) => handleFileUpload(e, "document")}
                className="hidden"
              />

              <div
                onClick={() => fileInputRef.current?.click()}
                className={`flex flex-col items-center justify-center rounded-xl border-2 border-dashed p-8 transition-colors ${
                  documentUploaded ? "border-green-500 bg-green-500/5" : "border-border hover:border-primary"
                }`}
              >
                {uploading ? (
                  <Loader2 className="h-12 w-12 animate-spin text-muted-foreground" />
                ) : documentUploaded ? (
                  <Check className="h-12 w-12 text-green-500" />
                ) : (
                  <Upload className="h-12 w-12 text-muted-foreground" />
                )}
                <p className="mt-4 font-medium text-foreground">
                  {documentUploaded ? "Document uploaded!" : "Click to upload or drag and drop"}
                </p>
                <p className="mt-1 text-sm text-muted-foreground">
                  JPG, PNG or PDF (max 10MB)
                </p>
              </div>

              {documentUploaded && (
                <div className="mt-4 flex items-center justify-between rounded-lg border border-green-500/20 bg-green-500/5 p-4">
                  <div className="flex items-center gap-3">
                    <FileText className="h-5 w-5 text-green-500" />
                    <div>
                      <p className="font-medium text-foreground">document_front.jpg</p>
                      <p className="text-xs text-muted-foreground">Uploaded successfully</p>
                    </div>
                  </div>
                  <button onClick={() => setDocumentUploaded(false)}>
                    <X className="h-5 w-5 text-muted-foreground hover:text-red-500" />
                  </button>
                </div>
              )}
            </div>

            <div className="flex gap-3">
              <button
                onClick={() => setStep("intro")}
                className="flex-1 rounded-lg border border-border px-4 py-3 font-medium hover:bg-secondary"
              >
                Back
              </button>
              <button
                onClick={() => setStep("selfie")}
                disabled={!documentUploaded}
                className="flex-1 rounded-lg bg-primary px-4 py-3 font-semibold text-primary-foreground hover:opacity-90 disabled:opacity-50"
              >
                Continue
              </button>
            </div>
          </motion.div>
        )}

        {step === "selfie" && (
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            className="space-y-6"
          >
            <div className="rounded-xl border border-border bg-card p-6">
              <h2 className="mb-4 flex items-center gap-2 text-lg font-semibold text-foreground">
                <Camera className="h-5 w-5 text-primary" />
                Selfie Verification
              </h2>
              <p className="mb-4 text-sm text-muted-foreground">
                Take a clear selfie to verify your identity. Make sure your face is well-lit and visible.
              </p>

              <input
                ref={selfieInputRef}
                type="file"
                accept="image/*"
                capture="user"
                onChange={(e) => handleFileUpload(e, "selfie")}
                className="hidden"
              />

              <div
                onClick={() => selfieInputRef.current?.click()}
                className={`flex flex-col items-center justify-center rounded-xl border-2 border-dashed p-8 transition-colors ${
                  selfieUploaded ? "border-green-500 bg-green-500/5" : "border-border hover:border-primary"
                }`}
              >
                {uploading ? (
                  <Loader2 className="h-12 w-12 animate-spin text-muted-foreground" />
                ) : selfieUploaded ? (
                  <Check className="h-12 w-12 text-green-500" />
                ) : (
                  <Camera className="h-12 w-12 text-muted-foreground" />
                )}
                <p className="mt-4 font-medium text-foreground">
                  {selfieUploaded ? "Selfie captured!" : "Click to take selfie"}
                </p>
                <p className="mt-1 text-sm text-muted-foreground">
                  Use your device camera
                </p>
              </div>

              <div className="mt-4 rounded-lg bg-secondary/50 p-4">
                <p className="mb-2 text-sm font-medium text-foreground">Tips for a good selfie:</p>
                <ul className="space-y-1 text-sm text-muted-foreground">
                  <li>• Face the camera directly</li>
                  <li>• Ensure good lighting on your face</li>
                  <li>• Remove sunglasses or hats</li>
                  <li>• Keep a neutral expression</li>
                </ul>
              </div>
            </div>

            <div className="flex gap-3">
              <button
                onClick={() => setStep("upload")}
                className="flex-1 rounded-lg border border-border px-4 py-3 font-medium hover:bg-secondary"
              >
                Back
              </button>
              <button
                onClick={() => setStep("review")}
                disabled={!selfieUploaded}
                className="flex-1 rounded-lg bg-primary px-4 py-3 font-semibold text-primary-foreground hover:opacity-90 disabled:opacity-50"
              >
                Continue
              </button>
            </div>
          </motion.div>
        )}

        {step === "review" && (
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            className="space-y-6"
          >
            <div className="rounded-xl border border-border bg-card p-6">
              <h2 className="mb-4 flex items-center gap-2 text-lg font-semibold text-foreground">
                <AlertTriangle className="h-5 w-5 text-primary" />
                Review Your Information
              </h2>

              <div className="space-y-4">
                <div className="flex items-center justify-between rounded-lg border border-border p-4">
                  <div className="flex items-center gap-3">
                    <CreditCard className="h-5 w-5 text-muted-foreground" />
                    <div>
                      <p className="font-medium text-foreground">Document</p>
                      <p className="text-sm text-muted-foreground">National ID</p>
                    </div>
                  </div>
                  <Check className="h-5 w-5 text-green-500" />
                </div>

                <div className="flex items-center justify-between rounded-lg border border-border p-4">
                  <div className="flex items-center gap-3">
                    <Camera className="h-5 w-5 text-muted-foreground" />
                    <div>
                      <p className="font-medium text-foreground">Selfie</p>
                      <p className="text-sm text-muted-foreground">Uploaded</p>
                    </div>
                  </div>
                  <Check className="h-5 w-5 text-green-500" />
                </div>
              </div>

              <div className="mt-6 rounded-lg bg-secondary/50 p-4">
                <p className="text-sm text-muted-foreground">
                  By submitting, you agree to our <a href="#" className="text-primary hover:underline">Terms of Service</a> and <a href="#" className="text-primary hover:underline">Privacy Policy</a>. Your data will be processed securely in accordance with applicable regulations.
                </p>
              </div>
            </div>

            <div className="flex gap-3">
              <button
                onClick={() => setStep("selfie")}
                className="flex-1 rounded-lg border border-border px-4 py-3 font-medium hover:bg-secondary"
              >
                Back
              </button>
              <button
                onClick={handleSubmit}
                className="flex-1 rounded-lg bg-primary px-4 py-3 font-semibold text-primary-foreground hover:opacity-90"
              >
                Submit Verification
              </button>
            </div>
          </motion.div>
        )}
      </div>
      <Footer />
    </div>
  );
}
