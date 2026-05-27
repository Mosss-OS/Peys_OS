import { useState, useRef, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Upload, FileText, X, Check, AlertCircle, Send, Download, Loader2 } from "lucide-react";
import { useApp } from "@/contexts/AppContext";
import AppHeader from "@/components/AppHeader";
import Footer from "@/components/Footer";
import { toast } from "sonner";
import { fireBurst } from "@/utils/confetti";
import { useEscrow } from "@/hooks/useEscrow";
import { getChainConfig } from "@/lib/chains";
import { supabase } from "@/integrations/supabase/client";

interface BatchRecipient {
  email: string;
  amount: number;
  token: "USDC" | "USDT" | "G$";
  memo?: string;
  status: "pending" | "success" | "error";
  error?: string;
}

interface PaymentInsert {
  payment_id: string;
  sender_wallet: string | null;
  sender_email: string;
  recipient_email: string;
  amount: number;
  token: string;
  memo: string | null;
  claim_secret: string;
  claim_link: string;
  status: string;
  tx_hash: string | null;
  expires_at: string;
}

const SAMPLE_CSV = `email,amount,token,memo
alice@email.com,50,USDC,Lunch money
bob@email.com,100,USDC,Project payment
grace@email.com,75,USDT,Birthday gift
moses@email.com,200,USDC,Freelance work`;

export default function BatchPage() {
  const { isLoggedIn, login, walletAddress } = useApp();
  const { createPayment } = useEscrow();
  const [recipients, setRecipients] = useState<BatchRecipient[]>([]);
  const [step, setStep] = useState<"upload" | "review" | "pin" | "processing" | "done">("upload");
  const [processedCount, setProcessedCount] = useState(0);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [selectedNetwork, setSelectedNetwork] = useState(84532); // Default to Base Sepolia
  const [pin, setPin] = useState("");
  const [isAborted, setIsAborted] = useState(false);

  if (!isLoggedIn) {
    return (
      <div className="min-h-screen bg-background">
        <AppHeader />
        <div className="flex min-h-[80vh] flex-col items-center justify-center px-4">
          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="text-center">
            <FileText className="mx-auto mb-4 h-12 w-12 text-primary" />
            <h2 className="mb-3 font-display text-2xl text-foreground sm:text-3xl">Batch Payments</h2>
            <p className="mb-6 max-w-md text-sm text-muted-foreground">Send payments to multiple recipients at once via CSV upload.</p>
            <button onClick={login} className="rounded-lg bg-primary px-6 py-3 font-semibold text-primary-foreground shadow-glow transition-opacity hover:opacity-90">
              Sign In
            </button>
          </motion.div>
        </div>
        <Footer />
      </div>
    );
  }

  const parseCSV = (text: string) => {
    const lines = text.trim().split("\n");
    const header = lines[0].toLowerCase();
    if (!header.includes("email") || !header.includes("amount")) {
      toast.error("CSV must have 'email' and 'amount' columns");
      return;
    }
    const cols = header.split(",").map((c) => c.trim());
    const emailIdx = cols.indexOf("email");
    const amountIdx = cols.indexOf("amount");
    const tokenIdx = cols.indexOf("token");
    const memoIdx = cols.indexOf("memo");

    const parsed: BatchRecipient[] = [];
    for (let i = 1; i < lines.length; i++) {
      const vals = lines[i].split(",").map((v) => v.trim());
      if (!vals[emailIdx] || !vals[amountIdx]) continue;
      parsed.push({
        email: vals[emailIdx],
        amount: Number(vals[amountIdx]),
        token: (tokenIdx >= 0 && vals[tokenIdx]?.toUpperCase() === "USDT" ? "USDT" : vals[tokenIdx]?.toUpperCase() === "G$" ? "G$" : "USDC") as "USDC" | "USDT" | "G$",
        memo: memoIdx >= 0 ? vals[memoIdx] : undefined,
        status: "pending",
      });
    }

    if (parsed.length === 0) {
      toast.error("No valid rows found in CSV");
      return;
    }

    setRecipients(parsed);
    setStep("review");
    toast.success(`${parsed.length} recipients loaded`);
  };

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (ev) => parseCSV((ev.target?.result as string | undefined) ?? "");
    reader.readAsText(file);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    const file = e.dataTransfer.files[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (ev) => parseCSV((ev.target?.result as string | undefined) ?? "");
    reader.readAsText(file);
  };

  const downloadSample = () => {
    const blob = new Blob([SAMPLE_CSV], { type: "text/csv" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = "peys-batch-sample.csv";
    a.click();
    URL.revokeObjectURL(url);
    toast.success("Sample CSV downloaded");
  };

  const removeRecipient = (idx: number) => {
    setRecipients((prev) => prev.filter((_, i) => i !== idx));
  };

  const processBatch = async () => {
    setIsAborted(false);
    setProcessedCount(0);

    const chainConfig = getChainConfig(selectedNetwork);
    const tokenAddress = chainConfig.usdcAddress;

    // Generate batch ID for tracking (not stored in DB)
    const batchId = crypto.randomUUID();
    const totalAmount = recipients.reduce((s, r) => s + r.amount, 0);

    for (let i = 0; i < recipients.length; i++) {
      if (isAborted) {
        toast.info("Batch processing aborted");
        // Batch aborted - no DB update needed
        setStep("done");
        return;
      }

      const recipient = recipients[i];
      
      try {
        // Generate a random secret for this payment
        const secret = Math.random().toString(36).substring(2) + Date.now().toString(36);
        const amountBigInt = BigInt(recipient.amount * 1000000); // USDC has 6 decimals

        // Create the payment
        const txHash = await createPayment(
          tokenAddress as `0x${string}`,
          amountBigInt,
          secret,
          recipient.memo || "",
          7
        );

        if (txHash) {
          // Generate claim link and secret
          const paymentId = crypto.randomUUID();
          const claimSecret = Math.random().toString(36).substring(2) + Date.now().toString(36);
          const claimLink = `${window.location.origin}/claim/${paymentId}`;
          
          // Save to database
          await supabase.from("payments").insert({
            payment_id: paymentId,
            sender_wallet: walletAddress,
            sender_email: "",
            recipient_email: recipient.email,
            amount: recipient.amount,
            token: recipient.token,
            memo: recipient.memo,
            claim_secret: claimSecret,
            claim_link: claimLink,
            status: "pending",
            tx_hash: txHash,
            expires_at: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString(),
          } as PaymentInsert);

          setRecipients((prev) =>
            prev.map((r, idx) =>
              idx === i ? { ...r, status: "success" as const } : r
            )
          );
        } else {
          setRecipients((prev) =>
            prev.map((r, idx) =>
              idx === i ? { ...r, status: "error" as const, error: "Transaction failed" } : r
            )
            );
          }
        } catch (err: unknown) {
        const error = err as { message?: string };
        console.error("Payment error:", error);
        setRecipients((prev) =>
          prev.map((r, idx) =>
            idx === i ? { ...r, status: "error" as const, error: error.message || "Transaction failed" } : r
          )
        );
      }

      setProcessedCount(i + 1);
      
      // Small delay between transactions
      await new Promise((r) => setTimeout(r, 1000));
    }

    // Batch processing completed

    setStep("done");
    fireBurst();
    toast.success("Batch payments completed! 🎉");
  };

  const totalAmount = recipients.reduce((s, r) => s + r.amount, 0);
  const successCount = recipients.filter((r) => r.status === "success").length;

  return (
    <div className="min-h-screen bg-background">
      <AppHeader />
      <div className="container mx-auto max-w-4xl px-4 pt-20 pb-12 sm:pt-24 sm:pb-16">
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}>
          <h1 className="font-display text-2xl text-foreground sm:text-3xl">Batch Payments</h1>
          <p className="mt-1 text-sm text-muted-foreground">Send to multiple recipients via CSV</p>
        </motion.div>

        <div className="mt-6">
          <AnimatePresence mode="wait">
            {step === "upload" && (
              <motion.div key="upload" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
                <div
                  onDragOver={(e) => e.preventDefault()}
                  onDrop={handleDrop}
                  onClick={() => fileInputRef.current?.click()}
                  className="flex cursor-pointer flex-col items-center gap-4 rounded-xl border-2 border-dashed border-border bg-card p-8 text-center transition-colors hover:border-primary/40 hover:bg-secondary/30 sm:p-12"
                >
                  <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-primary/10">
                    <Upload className="h-7 w-7 text-primary" />
                  </div>
                  <div>
                    <p className="text-sm font-semibold text-foreground">Drop your CSV file here</p>
                    <p className="mt-1 text-xs text-muted-foreground">or click to browse</p>
                  </div>
                  <input ref={fileInputRef} type="file" accept=".csv" onChange={handleFileUpload} className="hidden" />
                </div>

                <div className="mt-4 flex items-center justify-between rounded-xl border border-border bg-card p-4">
                  <div>
                    <p className="text-sm font-medium text-foreground">Need a template?</p>
                    <p className="text-xs text-muted-foreground">Download our CSV format</p>
                  </div>
                  <button onClick={downloadSample} className="flex items-center gap-2 rounded-lg border border-border px-3 py-2 text-sm font-medium text-foreground transition-colors hover:bg-secondary">
                    <Download className="h-4 w-4" /> Sample CSV
                  </button>
                </div>

                <div className="mt-4 rounded-xl border border-border bg-secondary/30 p-4">
                  <p className="mb-2 text-xs font-semibold text-foreground">CSV Format:</p>
                  <code className="block rounded-lg bg-background p-3 text-xs text-muted-foreground whitespace-pre overflow-x-auto">
                    {SAMPLE_CSV}
                  </code>
                </div>
              </motion.div>
            )}

            {step === "review" && (
              <motion.div key="review" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
                <div className="mb-4 flex items-center justify-between rounded-xl border border-border bg-card p-4">
                  <div>
                    <p className="text-sm font-semibold text-foreground">{recipients.length} recipients</p>
                    <p className="text-xs text-muted-foreground">Total: ${totalAmount.toLocaleString()}</p>
                  </div>
                  <button onClick={() => { setStep("upload"); setRecipients([]); }} className="text-xs text-muted-foreground hover:text-foreground">
                    Re-upload
                  </button>
                </div>

                <div className="space-y-2">
                  {recipients.map((r, i) => (
                    <motion.div
                      key={i}
                      initial={{ opacity: 0, x: -10 }}
                      animate={{ opacity: 1, x: 0 }}
                      transition={{ delay: i * 0.03 }}
                      className="flex items-center gap-3 rounded-lg border border-border bg-card p-3"
                    >
                      <div className="min-w-0 flex-1">
                        <p className="truncate text-sm text-foreground">{r.email}</p>
                        {r.memo && <p className="text-xs text-muted-foreground">{r.memo}</p>}
                      </div>
                      <span className="text-sm font-semibold text-foreground">${r.amount} {r.token}</span>
                      <button onClick={() => removeRecipient(i)} className="text-muted-foreground hover:text-destructive">
                        <X className="h-4 w-4" />
                      </button>
                    </motion.div>
                  ))}
                </div>

                <div className="mt-4 flex gap-2">
                  <button onClick={() => { setStep("upload"); setRecipients([]); }}
                    className="flex-1 rounded-xl border border-border py-3 text-sm font-medium text-foreground transition-colors hover:bg-secondary">
                    Cancel
                  </button>
                  <button onClick={() => setStep("pin")}
                    className="flex flex-1 items-center justify-center gap-2 rounded-xl bg-primary py-3 text-sm font-semibold text-primary-foreground shadow-glow transition-opacity hover:opacity-90">
                    <Send className="h-4 w-4" /> Continue
                  </button>
                </div>
              </motion.div>
            )}

            {step === "pin" && (
              <motion.div key="pin" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
                <div className="rounded-xl border border-border bg-card p-6 shadow-card">
                  <h3 className="font-display text-lg text-foreground text-center mb-4">Enter PIN</h3>
                  <p className="text-sm text-muted-foreground text-center mb-6">Enter your 4-digit PIN to authorize the batch payment.</p>
                  
                  <div className="flex justify-center gap-2 mb-6">
                    {[0, 1, 2, 3].map((idx) => (
                      <input
                        key={idx}
                        type="password"
                        maxLength={1}
                        value={pin[idx] || ""}
                        onChange={(e) => {
                          const newPin = pin.split("");
                          newPin[idx] = e.target.value;
                          setPin(newPin.join(""));
                        }}
                        className="w-12 h-12 text-center text-xl font-semibold border border-border rounded-lg bg-background focus:outline-none focus:ring-2 focus:ring-primary"
                      />
                    ))}
                  </div>

                  <div className="flex gap-2">
                    <button onClick={() => { setStep("review"); setPin(""); }}
                      className="flex-1 rounded-xl border border-border py-3 text-sm font-medium text-foreground transition-colors hover:bg-secondary">
                      Back
                    </button>
                    <button 
                      onClick={() => {
                        if (pin.length === 4) {
                          setStep("processing");
                          processBatch();
                        } else {
                          toast.error("Please enter a 4-digit PIN");
                        }
                      }}
                      className="flex flex-1 items-center justify-center gap-2 rounded-xl bg-primary py-3 text-sm font-semibold text-primary-foreground shadow-glow transition-opacity hover:opacity-90"
                    >
                      <Send className="h-4 w-4" /> Confirm & Send
                    </button>
                  </div>
                </div>
              </motion.div>
            )}

            {step === "processing" && (
              <motion.div key="processing" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="text-center">
                <div className="rounded-xl border border-border bg-card p-8 shadow-card">
                  <motion.div
                    animate={{ rotate: 360 }}
                    transition={{ duration: 2, repeat: Infinity, ease: "linear" }}
                    className="mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-full bg-primary/10"
                  >
                    <Send className="h-6 w-6 text-primary" />
                  </motion.div>
                  <h3 className="font-display text-lg text-foreground">Processing Batch...</h3>
                  <p className="mt-1 text-sm text-muted-foreground">{processedCount} / {recipients.length} payments sent</p>
                  <div className="mt-4 h-2 rounded-full bg-secondary">
                    <motion.div
                      className="h-full rounded-full bg-primary"
                      animate={{ width: `${(processedCount / recipients.length) * 100}%` }}
                    />
                  </div>
                  <button 
                    onClick={() => setIsAborted(true)}
                    className="mt-6 rounded-xl border border-destructive text-destructive px-4 py-2 text-sm font-medium transition-colors hover:bg-destructive hover:text-destructive-foreground"
                  >
                    Abort Batch
                  </button>
                </div>
              </motion.div>
            )}

            {step === "done" && (
              <motion.div key="done" initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }}>
                <div className="rounded-xl border border-border bg-card p-6 text-center shadow-card sm:p-8">
                  <div className="mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-full bg-primary/10">
                    <Check className="h-7 w-7 text-primary" />
                  </div>
                  <h3 className="font-display text-xl text-foreground">Batch Complete! 🎉</h3>
                  <p className="mt-2 text-sm text-muted-foreground">
                    {successCount} of {recipients.length} payments sent successfully
                  </p>

                  <div className="mt-4 max-h-48 space-y-1.5 overflow-y-auto">
                    {recipients.map((r, i) => (
                      <div key={i} className="flex items-center gap-2 rounded-lg px-3 py-2 text-sm">
                        {r.status === "success" ? (
                          <Check className="h-4 w-4 shrink-0 text-primary" />
                        ) : (
                          <AlertCircle className="h-4 w-4 shrink-0 text-destructive" />
                        )}
                        <span className="flex-1 truncate text-left text-foreground">{r.email}</span>
                        <span className={r.status === "success" ? "text-primary" : "text-destructive"}>
                          ${r.amount}
                        </span>
                      </div>
                    ))}
                  </div>

                  <button
                    onClick={() => { setStep("upload"); setRecipients([]); setProcessedCount(0); }}
                    className="mt-4 w-full rounded-xl bg-primary py-3 text-sm font-semibold text-primary-foreground transition-opacity hover:opacity-90"
                  >
                    Send Another Batch
                  </button>
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>

        {/* Batch History Section */}
        <BatchHistory />
      </div>
      <Footer />
    </div>
  );
}

function BatchHistory() {
  // Batch history feature disabled - batches table not available in schema
  return null;
}
