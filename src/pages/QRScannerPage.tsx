import { useState, useRef, useEffect } from "react";
import { motion } from "framer-motion";
import { Camera, Flashlight, History, Check, AlertCircle, X, Loader2, DollarSign, Link2 } from "lucide-react";
import { useApp } from "@/contexts/AppContext";
import AppHeader from "@/components/AppHeader";
import Footer from "@/components/Footer";
import { toast } from "sonner";

interface ScanHistory {
  id: string;
  address: string;
  amount?: number;
  timestamp: string;
  status: "valid" | "invalid";
}

export default function QRScannerPage() {
  const { isLoggedIn, login } = useApp();
  const [scanning, setScanning] = useState(false);
  const [flashOn, setFlashOn] = useState(false);
  const [lastScan, setLastScan] = useState<ScanHistory | null>(null);
  const [showAmount, setShowAmount] = useState(false);
  const [amount, setAmount] = useState("");
  const videoRef = useRef<HTMLVideoElement>(null);
  const streamRef = useRef<MediaStream | null>(null);

  const [scanHistory, setScanHistory] = useState<ScanHistory[]>([]);

  const startCamera = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        video: { facingMode: "environment" },
      });
      streamRef.current = stream;
      if (videoRef.current) {
        videoRef.current.srcObject = stream;
      }
      setScanning(true);
      toast.success("Camera started");
    } catch (err) {
      toast.error("Could not access camera. Please check permissions.");
    }
  };

  const stopCamera = () => {
    if (streamRef.current) {
      streamRef.current.getTracks().forEach(track => track.stop());
      streamRef.current = null;
    }
    setScanning(false);
  };

  const handleUseAddress = () => {
    if (lastScan?.status === "valid") {
      toast.success(`Address ready to use: ${lastScan.address.slice(0, 10)}...`);
      stopCamera();
    }
  };

  useEffect(() => {
    return () => {
      if (streamRef.current) {
        streamRef.current.getTracks().forEach(track => track.stop());
      }
    };
  }, []);

  if (!isLoggedIn) {
    return (
      <div className="min-h-screen bg-background">
        <AppHeader />
        <div className="flex min-h-[80vh] flex-col items-center justify-center px-4 text-center">
          <div className="mb-6 flex h-20 w-20 items-center justify-center rounded-full bg-primary/10">
            <Camera className="h-10 w-10 text-primary" />
          </div>
          <h2 className="mb-3 font-display text-2xl text-foreground sm:text-3xl">QR Scanner</h2>
          <p className="mb-6 max-w-md text-sm text-muted-foreground">
            Scan QR codes to receive payments or add addresses.
          </p>
          <button onClick={login} className="rounded-lg bg-primary px-6 py-3 font-semibold text-primary-foreground shadow-glow hover:opacity-90">
            Sign In to Scan
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
          <h1 className="font-display text-2xl text-foreground sm:text-3xl">QR Scanner</h1>
          <p className="mt-1 text-sm text-muted-foreground">Scan QR codes to receive payments</p>
        </div>

        <div className="mb-6 grid gap-4 sm:grid-cols-2">
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            className="rounded-xl border border-border bg-card p-6"
          >
            <div className="relative mb-4 aspect-square overflow-hidden rounded-xl bg-black">
              {scanning ? (
                <>
                  <video
                    ref={videoRef}
                    autoPlay
                    playsInline
                    className="h-full w-full object-cover"
                  />
                  <div className="absolute inset-0 flex items-center justify-center">
                    <div className="h-48 w-48 border-2 border-primary">
                      <div className="absolute -left-1 -top-1 h-4 w-4 border-l-2 border-t-2 border-primary" />
                      <div className="absolute -right-1 -top-1 h-4 w-4 border-r-2 border-t-2 border-primary" />
                      <div className="absolute -bottom-1 -left-1 h-4 w-4 border-b-2 border-l-2 border-primary" />
                      <div className="absolute -bottom-1 -right-1 h-4 w-4 border-b-2 border-r-2 border-primary" />
                    </div>
                  </div>
                </>
              ) : (
                <div className="flex h-full w-full flex-col items-center justify-center">
                  <Camera className="h-16 w-16 text-muted-foreground/50" />
                  <p className="mt-4 text-sm text-muted-foreground">Camera inactive</p>
                </div>
              )}
            </div>

            <div className="flex gap-3">
              {!scanning ? (
                <button
                  onClick={startCamera}
                  className="flex flex-1 items-center justify-center gap-2 rounded-lg bg-primary px-4 py-3 font-semibold text-primary-foreground hover:opacity-90"
                >
                  <Camera className="h-5 w-5" />
                  Start Camera
                </button>
              ) : (
                <>
                  <button
                    onClick={stopCamera}
                    className="flex flex-1 items-center justify-center gap-2 rounded-lg border border-border px-4 py-3 font-medium hover:bg-secondary"
                  >
                    <X className="h-5 w-5" />
                    Stop
                  </button>

                </>
              )}
            </div>

            {scanning && (
              <button
                onClick={() => setFlashOn(!flashOn)}
                className={`mt-3 flex w-full items-center justify-center gap-2 rounded-lg border px-4 py-2 text-sm font-medium transition-colors ${
                  flashOn ? "border-yellow-500 bg-yellow-500/10 text-yellow-500" : "border-border hover:bg-secondary"
                }`}
              >
                <Flashlight className="h-4 w-4" />
                {flashOn ? "Flash On" : "Flash Off"}
              </button>
            )}
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
            className="space-y-4"
          >
            {lastScan && (
              <div className={`rounded-xl border p-5 ${
                lastScan.status === "valid" ? "border-green-500/20 bg-green-500/5" : "border-red-500/20 bg-red-500/5"
              }`}>
                <div className="mb-2 flex items-center gap-2">
                  {lastScan.status === "valid" ? (
                    <Check className="h-5 w-5 text-green-500" />
                  ) : (
                    <AlertCircle className="h-5 w-5 text-red-500" />
                  )}
                  <span className={`font-medium ${
                    lastScan.status === "valid" ? "text-green-500" : "text-red-500"
                  }`}>
                    {lastScan.status === "valid" ? "Valid Address" : "Invalid Address"}
                  </span>
                </div>
                <p className="mb-2 font-mono text-sm text-foreground">
                  {lastScan.address.slice(0, 10)}...{lastScan.address.slice(-8)}
                </p>
                {lastScan.amount && (
                  <p className="mb-2 text-sm text-muted-foreground">
                    Amount: ${lastScan.amount.toFixed(2)}
                  </p>
                )}
                {lastScan.status === "valid" && (
                  <button
                    onClick={handleUseAddress}
                    className="mt-2 w-full rounded-lg bg-primary px-4 py-2 text-sm font-medium text-primary-foreground hover:opacity-90"
                  >
                    Use This Address
                  </button>
                )}
              </div>
            )}

            <div className="rounded-xl border border-border bg-card p-5">
              <div className="mb-3 flex items-center gap-2">
                <DollarSign className="h-5 w-5 text-primary" />
                <h3 className="font-semibold text-foreground">Add Amount (Optional)</h3>
              </div>
              <div className="flex gap-2">
                <input
                  type="number"
                  value={amount}
                  onChange={(e) => setAmount(e.target.value)}
                  placeholder="0.00"
                  className="flex-1 rounded-lg border border-border bg-background px-3 py-2 text-sm focus:border-primary focus:outline-none"
                />
                <button
                  onClick={() => setShowAmount(!showAmount)}
                  className={`rounded-lg px-3 py-2 text-sm font-medium ${
                    showAmount ? "bg-primary text-primary-foreground" : "bg-secondary"
                  }`}
                >
                  {showAmount ? "Hide" : "Add"}
                </button>
              </div>
            </div>
          </motion.div>
        </div>

        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
          className="rounded-xl border border-border bg-card p-6"
        >
          <h2 className="mb-4 flex items-center gap-2 text-lg font-semibold text-foreground">
            <History className="h-5 w-5 text-primary" />
            Scan History
          </h2>
          <div className="space-y-3">
            {scanHistory.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-8 text-center">
                <History className="mb-3 h-8 w-8 text-muted-foreground/50" />
                <p className="text-sm text-muted-foreground">No scan history yet</p>
                <p className="text-xs text-muted-foreground/70 mt-1">Scan a QR code to see it here</p>
              </div>
            ) : (
              scanHistory.map((scan) => (
                <div key={scan.id} className="flex items-center justify-between rounded-lg border border-border p-4">
                  <div className="flex items-center gap-3">
                    <div className={`flex h-10 w-10 items-center justify-center rounded-full ${
                      scan.status === "valid" ? "bg-green-500/10" : "bg-red-500/10"
                    }`}>
                      {scan.status === "valid" ? (
                        <Link2 className="h-5 w-5 text-green-500" />
                      ) : (
                        <AlertCircle className="h-5 w-5 text-red-500" />
                      )}
                    </div>
                    <div>
                      <p className="font-mono text-sm text-foreground">
                        {scan.address.slice(0, 10)}...{scan.address.slice(-8)}
                      </p>
                      <p className="text-xs text-muted-foreground">
                        {new Date(scan.timestamp).toLocaleString()}
                      </p>
                    </div>
                  </div>
                  {scan.amount && (
                    <span className="font-medium text-foreground">${scan.amount}</span>
                  )}
                </div>
              ))
            )}
          </div>
        </motion.div>
      </div>
      <Footer />
    </div>
  );
}
