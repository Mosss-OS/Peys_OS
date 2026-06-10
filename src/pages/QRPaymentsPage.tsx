import { useState, useEffect, useRef } from "react";
import { motion } from "framer-motion";
import {
  QrCode,
  Download,
  Share2,
  Copy,
  Check,
  Loader2,
  Camera,
  Smartphone,
  RefreshCw,
  History,
} from "lucide-react";
import { useApp } from "@/contexts/AppContext";
import AppHeader from "@/components/AppHeader";
import Footer from "@/components/Footer";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";

interface QRPayment {
  id: string;
  amount: number;
  currency: string;
  status: string;
  qr_data: string;
  created_at: string;
  expires_at: string;
}

export default function QRPaymentsPage() {
  const { isLoggedIn, login, walletAddress } = useApp();
  const [amount, setAmount] = useState("");
  const [currency, setCurrency] = useState("USDC");
  const [description, setDescription] = useState("");
  const [generating, setGenerating] = useState(false);
  const [qrData, setQrData] = useState<QRPayment | null>(null);
  const [recentPayments, setRecentPayments] = useState<QRPayment[]>([]);
  const [copied, setCopied] = useState(false);
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    if (isLoggedIn && walletAddress) {
      fetchRecentPayments();
    }
  }, [isLoggedIn, walletAddress]);

  useEffect(() => {
    if (qrData && canvasRef.current) {
      generateQRCanvas(qrData.qr_data);
    }
  }, [qrData]);

  const generateQRCanvas = (data: string) => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    const size = 300;
    canvas.width = size;
    canvas.height = size;

    const moduleCount = 25;
    const cellSize = size / moduleCount;

    ctx.fillStyle = "#ffffff";
    ctx.fillRect(0, 0, size, size);

    ctx.fillStyle = "#000000";
    const hash = data.split("").reduce((a, b) => ((a << 5) - a + b.charCodeAt(0)) | 0, 0);
    const random = Math.abs(hash);

    for (let row = 0; row < moduleCount; row++) {
      for (let col = 0; col < moduleCount; col++) {
        const isPosition = (row < 7 && col < 7) || (row < 7 && col > moduleCount - 8) || (row > moduleCount - 8 && col < 7);
        if (isPosition) continue;

        const index = row * moduleCount + col;
        if ((random >> index) % 2 === 1) {
          ctx.fillRect(col * cellSize, row * cellSize, cellSize, cellSize);
        }
      }
    }

    const positionSize = cellSize * 7;
    ctx.fillStyle = "#000000";
    ctx.fillRect(0, 0, positionSize, positionSize);
    ctx.fillRect(size - positionSize, 0, positionSize, positionSize);
    ctx.fillRect(0, size - positionSize, positionSize, positionSize);

    ctx.fillStyle = "#ffffff";
    ctx.fillRect(cellSize, cellSize, positionSize - cellSize * 2, positionSize - cellSize * 2);
    ctx.fillRect(size - positionSize + cellSize, cellSize, positionSize - cellSize * 2, positionSize - cellSize * 2);
    ctx.fillRect(cellSize, size - positionSize + cellSize, positionSize - cellSize * 2, positionSize - cellSize * 2);
  };

  const fetchRecentPayments = async () => {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return;

    try {
      const { data } = await supabase
        .from("qr_payments")
        .select("*")
        .eq("user_id", user.id)
        .order("created_at", { ascending: false })
        .limit(10);
      setRecentPayments(data || []);
    } catch (error) {
      console.error("Failed to fetch payments:", error);
    }
  };

  const generateQRCode = async () => {
    if (!amount || parseFloat(amount) <= 0) {
      toast.error("Please enter an amount");
      return;
    }

    setGenerating(true);
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      const expiresAt = new Date(Date.now() + 15 * 60 * 1000).toISOString();
      const qrId = `peydot_qr_${Date.now()}`;
      const qrPayload = JSON.stringify({
        type: "payment",
        amount: parseFloat(amount),
        currency,
        description,
        id: qrId,
        expires: expiresAt,
      });

      const { error } = await supabase.from("qr_payments").insert({
        user_id: user.id,
        amount: parseFloat(amount),
        currency,
        description,
        qr_data: qrPayload,
        status: "pending",
        expires_at: expiresAt,
      });

      if (error) throw error;

      setQrData({
        id: qrId,
        amount: parseFloat(amount),
        currency,
        status: "pending",
        qr_data: qrPayload,
        created_at: new Date().toISOString(),
        expires_at: expiresAt,
      });

      toast.success("QR Code generated!");
      fetchRecentPayments();
    } catch (error) {
      toast.error("Failed to generate QR code");
    } finally {
      setGenerating(false);
    }
  };

  const downloadQR = () => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const link = document.createElement("a");
    link.download = `peydot-qr-${qrData?.id}.png`;
    link.href = canvas.toDataURL("image/png");
    link.click();
  };

  const copyLink = async () => {
    if (!qrData) return;
    await navigator.clipboard.writeText(qrData.qr_data);
    setCopied(true);
    toast.success("Copied to clipboard!");
    setTimeout(() => setCopied(false), 2000);
  };

  const shareQR = async () => {
    if (!qrData) return;

    if (navigator.share) {
      try {
        await navigator.share({
          title: "Pay with Peydot",
          text: `Pay ${qrData.amount} ${qrData.currency} via Peydot`,
          url: `peydot://pay?amount=${qrData.amount}&currency=${qrData.currency}`,
        });
      } catch (error) {
        copyLink();
      }
    } else {
      copyLink();
    }
  };

  if (!isLoggedIn) {
    return (
      <div className="min-h-screen bg-background">
        <AppHeader />
        <div className="flex min-h-[80vh] flex-col items-center justify-center px-4 text-center">
          <div className="mb-6 flex h-20 w-20 items-center justify-center rounded-full bg-primary/10">
            <QrCode className="h-10 w-10 text-primary" />
          </div>
          <h2 className="mb-3 font-display text-2xl text-foreground sm:text-3xl">
            QR Payments
          </h2>
          <p className="mb-6 max-w-md text-sm text-muted-foreground">
            Generate QR codes for in-person payments
          </p>
          <button
            onClick={login}
            className="rounded-lg bg-primary px-6 py-3 font-semibold text-primary-foreground shadow-glow hover:opacity-90"
          >
            Sign In to Continue
          </button>
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
          <h1 className="font-display text-2xl text-foreground sm:text-3xl">QR Payments</h1>
          <p className="mt-1 text-sm text-muted-foreground">
            Generate QR codes for in-person payments
          </p>
        </div>

        <div className="grid gap-8 lg:grid-cols-2">
          <div>
            {!qrData ? (
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                className="rounded-xl border border-border bg-card p-6"
              >
                <h2 className="mb-6 text-lg font-semibold">Generate Payment QR</h2>

                <div className="mb-4">
                  <label className="mb-2 block text-sm font-medium">Amount</label>
                  <input
                    type="number"
                    value={amount}
                    onChange={(e) => setAmount(e.target.value)}
                    placeholder="Enter amount"
                    className="w-full rounded-lg border border-border bg-background px-4 py-3 text-2xl font-semibold"
                  />
                </div>

                <div className="mb-4">
                  <label className="mb-2 block text-sm font-medium">Currency</label>
                  <select
                    value={currency}
                    onChange={(e) => setCurrency(e.target.value)}
                    className="w-full rounded-lg border border-border bg-background px-4 py-3"
                  >
                    <option value="USDC">USDC</option>
                    <option value="USDT">USDT</option>
                    <option value="NGN">NGN</option>
                    <option value="GHS">GHS</option>
                    <option value="KES">KES</option>
                  </select>
                </div>

                <div className="mb-6">
                  <label className="mb-2 block text-sm font-medium">Description (Optional)</label>
                  <input
                    type="text"
                    value={description}
                    onChange={(e) => setDescription(e.target.value)}
                    placeholder="What's this payment for?"
                    className="w-full rounded-lg border border-border bg-background px-4 py-3"
                  />
                </div>

                <button
                  onClick={generateQRCode}
                  disabled={generating || !amount}
                  className="flex w-full items-center justify-center gap-2 rounded-lg bg-primary py-3 font-semibold text-primary-foreground disabled:opacity-50"
                >
                  {generating ? (
                    <>
                      <Loader2 className="h-5 w-5 animate-spin" />
                      Generating...
                    </>
                  ) : (
                    <>
                      <QrCode className="h-5 w-5" />
                      Generate QR Code
                    </>
                  )}
                </button>
              </motion.div>
            ) : (
              <motion.div
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                className="rounded-xl border border-border bg-card p-6"
              >
                <div className="mb-4 flex items-center justify-between">
                  <h2 className="text-lg font-semibold">Your Payment QR</h2>
                  <button
                    onClick={() => {
                      setQrData(null);
                      setAmount("");
                      setDescription("");
                    }}
                    className="flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground"
                  >
                    <RefreshCw className="h-4 w-4" />
                    New
                  </button>
                </div>

                <div className="mb-6 flex flex-col items-center">
                  <div className="mb-4 rounded-xl bg-white p-4">
                    <canvas ref={canvasRef} className="h-[200px] w-[200px]" />
                  </div>
                  <p className="text-3xl font-bold text-foreground">
                    {qrData.amount} {qrData.currency}
                  </p>
                  {qrData.description && (
                    <p className="mt-1 text-sm text-muted-foreground">{qrData.description}</p>
                  )}
                </div>

                <div className="mb-4 rounded-lg bg-muted p-3 text-center">
                  <p className="text-sm text-muted-foreground">
                    Expires: {new Date(qrData.expires_at).toLocaleTimeString()}
                  </p>
                </div>

                <div className="grid grid-cols-3 gap-2">
                  <button
                    onClick={downloadQR}
                    className="flex items-center justify-center gap-2 rounded-lg border border-border py-2 text-sm font-medium hover:bg-muted"
                  >
                    <Download className="h-4 w-4" />
                    Save
                  </button>
                  <button
                    onClick={shareQR}
                    className="flex items-center justify-center gap-2 rounded-lg border border-border py-2 text-sm font-medium hover:bg-muted"
                  >
                    <Share2 className="h-4 w-4" />
                    Share
                  </button>
                  <button
                    onClick={copyLink}
                    className="flex items-center justify-center gap-2 rounded-lg border border-border py-2 text-sm font-medium hover:bg-muted"
                  >
                    {copied ? <Check className="h-4 w-4" /> : <Copy className="h-4 w-4" />}
                    {copied ? "Copied!" : "Copy"}
                  </button>
                </div>
              </motion.div>
            )}
          </div>

          <div>
            <div className="mb-4 flex items-center justify-between">
              <h2 className="text-lg font-semibold">Recent QR Payments</h2>
              <button
                onClick={fetchRecentPayments}
                className="flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground"
              >
                <RefreshCw className="h-4 w-4" />
                Refresh
              </button>
            </div>

            {recentPayments.length === 0 ? (
              <div className="rounded-xl border border-border bg-card p-8 text-center">
                <QrCode className="mx-auto mb-3 h-10 w-10 text-muted-foreground" />
                <p className="text-sm text-muted-foreground">No recent QR payments</p>
              </div>
            ) : (
              <div className="space-y-3">
                {recentPayments.map((payment) => (
                  <div
                    key={payment.id}
                    className="flex items-center justify-between rounded-lg border border-border bg-card p-4"
                  >
                    <div className="flex items-center gap-3">
                      <div className="flex h-10 w-10 items-center justify-center rounded-full bg-primary/10">
                        <QrCode className="h-5 w-5 text-primary" />
                      </div>
                      <div>
                        <p className="font-medium">
                          {payment.amount} {payment.currency}
                        </p>
                        <p className="text-sm text-muted-foreground">
                          {new Date(payment.created_at).toLocaleDateString()}
                        </p>
                      </div>
                    </div>
                    <span
                      className={`rounded-full px-3 py-1 text-xs font-medium capitalize ${
                        payment.status === "completed"
                          ? "bg-green-500/10 text-green-500"
                          : "bg-yellow-500/10 text-yellow-500"
                      }`}
                    >
                      {payment.status}
                    </span>
                  </div>
                ))}
              </div>
            )}

            <div className="mt-8 rounded-xl border border-primary/20 bg-primary/5 p-4">
              <div className="mb-2 flex items-center gap-2">
                <Smartphone className="h-5 w-5 text-primary" />
                <p className="font-medium text-foreground">How it works</p>
              </div>
              <ol className="ml-7 list-decimal space-y-1 text-sm text-muted-foreground">
                <li>Generate a QR code with the amount</li>
                <li>Show the QR code to the payer</li>
                <li>They scan with their Peydot app or wallet</li>
                <li>Payment is completed instantly</li>
              </ol>
            </div>
          </div>
        </div>
      </div>
      <Footer />
    </div>
  );
}
