import { useState } from "react";
import { motion } from "framer-motion";
import { QrCode, Download, Printer, Palette, Loader2, Check, Copy, Link2, DollarSign, FileText, Settings, Eye } from "lucide-react";
import { useApp } from "@/contexts/AppContext";
import AppHeader from "@/components/AppHeader";
import Footer from "@/components/Footer";
import { toast } from "sonner";

interface QRConfig {
  address: string;
  amount: string;
  description: string;
  foregroundColor: string;
  backgroundColor: string;
  errorCorrectionLevel: "L" | "M" | "Q" | "H";
  includeLogo: boolean;
  logoSize: number;
}

export default function QRServicePage() {
  const { isLoggedIn, login } = useApp();
  const [generating, setGenerating] = useState(false);
  const [showPreview, setShowPreview] = useState(false);
  const [config, setConfig] = useState<QRConfig>({
    address: "0x1234567890abcdef1234567890abcdef12345678",
    amount: "",
    description: "",
    foregroundColor: "#000000",
    backgroundColor: "#FFFFFF",
    errorCorrectionLevel: "M",
    includeLogo: false,
    logoSize: 50,
  });

  const handleGenerate = async () => {
    setGenerating(true);
    await new Promise(r => setTimeout(r, 1500));
    setShowPreview(true);
    setGenerating(false);
    toast.success("QR code generated!");
  };

  const handleDownload = (format: "png" | "svg") => {
    toast.success(`Downloading as ${format.toUpperCase()}...`);
  };

  const handlePrint = () => {
    window.print();
    toast.success("Opening print dialog...");
  };

  if (!isLoggedIn) {
    return (
      <div className="min-h-screen bg-background">
        <AppHeader />
        <div className="flex min-h-[80vh] flex-col items-center justify-center px-4 text-center">
          <div className="mb-6 flex h-20 w-20 items-center justify-center rounded-full bg-primary/10">
            <QrCode className="h-10 w-10 text-primary" />
          </div>
          <h2 className="mb-3 font-display text-2xl text-foreground sm:text-3xl">QR Code Generator</h2>
          <p className="mb-6 max-w-md text-sm text-muted-foreground">
            Generate QR codes for wallet addresses and payments with custom styling options.
          </p>
          <button onClick={login} className="rounded-lg bg-primary px-6 py-3 font-semibold text-primary-foreground shadow-glow hover:opacity-90">
            Sign In to Generate QR
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
          <h1 className="font-display text-2xl text-foreground sm:text-3xl">QR Code Generator</h1>
          <p className="mt-1 text-sm text-muted-foreground">Generate QR codes for payments and wallet addresses</p>
        </div>

        <div className="grid gap-6 lg:grid-cols-2">
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            className="space-y-6"
          >
            <div className="rounded-xl border border-border bg-card p-6">
              <h2 className="mb-4 flex items-center gap-2 text-lg font-semibold text-foreground">
                <Link2 className="h-5 w-5 text-primary" />
                Payment Details
              </h2>
              <div className="space-y-4">
                <div>
                  <label className="mb-2 block text-sm font-medium text-muted-foreground">Wallet Address</label>
                  <input
                    type="text"
                    value={config.address}
                    onChange={(e) => setConfig({ ...config, address: e.target.value })}
                    className="w-full rounded-lg border border-border bg-background px-4 py-2.5 font-mono text-sm text-foreground focus:border-primary focus:outline-none"
                  />
                </div>
                <div>
                  <label className="mb-2 block text-sm font-medium text-muted-foreground">Amount (optional)</label>
                  <div className="relative">
                    <DollarSign className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                    <input
                      type="number"
                      value={config.amount}
                      onChange={(e) => setConfig({ ...config, amount: e.target.value })}
                      placeholder="0.00"
                      className="w-full rounded-lg border border-border bg-background py-2.5 pl-9 pr-4 text-sm text-foreground placeholder:text-muted-foreground focus:border-primary focus:outline-none"
                    />
                  </div>
                </div>
                <div>
                  <label className="mb-2 block text-sm font-medium text-muted-foreground">Description (optional)</label>
                  <input
                    type="text"
                    value={config.description}
                    onChange={(e) => setConfig({ ...config, description: e.target.value })}
                    placeholder="Payment for..."
                    className="w-full rounded-lg border border-border bg-background px-4 py-2.5 text-sm text-foreground placeholder:text-muted-foreground focus:border-primary focus:outline-none"
                  />
                </div>
              </div>
            </div>

            <div className="rounded-xl border border-border bg-card p-6">
              <h2 className="mb-4 flex items-center gap-2 text-lg font-semibold text-foreground">
                <Palette className="h-5 w-5 text-primary" />
                Styling Options
              </h2>
              <div className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="mb-2 block text-sm font-medium text-muted-foreground">Foreground</label>
                    <div className="flex gap-2">
                      <input
                        type="color"
                        value={config.foregroundColor}
                        onChange={(e) => setConfig({ ...config, foregroundColor: e.target.value })}
                        className="h-11 w-14 rounded-lg border border-border"
                      />
                      <input
                        type="text"
                        value={config.foregroundColor}
                        onChange={(e) => setConfig({ ...config, foregroundColor: e.target.value })}
                        className="flex-1 rounded-lg border border-border bg-background px-3 py-2.5 font-mono text-sm uppercase"
                      />
                    </div>
                  </div>
                  <div>
                    <label className="mb-2 block text-sm font-medium text-muted-foreground">Background</label>
                    <div className="flex gap-2">
                      <input
                        type="color"
                        value={config.backgroundColor}
                        onChange={(e) => setConfig({ ...config, backgroundColor: e.target.value })}
                        className="h-11 w-14 rounded-lg border border-border"
                      />
                      <input
                        type="text"
                        value={config.backgroundColor}
                        onChange={(e) => setConfig({ ...config, backgroundColor: e.target.value })}
                        className="flex-1 rounded-lg border border-border bg-background px-3 py-2.5 font-mono text-sm uppercase"
                      />
                    </div>
                  </div>
                </div>
                <div>
                  <label className="mb-2 block text-sm font-medium text-muted-foreground">Error Correction Level</label>
                  <div className="grid grid-cols-4 gap-2">
                    {(["L", "M", "Q", "H"] as const).map((level) => (
                      <button
                        key={level}
                        onClick={() => setConfig({ ...config, errorCorrectionLevel: level })}
                        className={`rounded-lg border px-3 py-2 text-sm font-medium transition-colors ${
                          config.errorCorrectionLevel === level
                            ? "border-primary bg-primary/10 text-primary"
                            : "border-border hover:bg-secondary"
                        }`}
                      >
                        {level}
                      </button>
                    ))}
                  </div>
                  <p className="mt-1 text-xs text-muted-foreground">
                    Higher levels allow more damage but increase QR size
                  </p>
                </div>
                <div className="flex items-center justify-between rounded-lg border border-border p-3">
                  <div className="flex items-center gap-3">
                    <FileText className="h-5 w-5 text-muted-foreground" />
                    <div>
                      <p className="font-medium text-foreground">Include Logo</p>
                      <p className="text-xs text-muted-foreground">Add branding to center</p>
                    </div>
                  </div>
                  <button
                    onClick={() => setConfig({ ...config, includeLogo: !config.includeLogo })}
                    className={`relative h-6 w-11 rounded-full transition-colors ${
                      config.includeLogo ? "bg-primary" : "bg-secondary"
                    }`}
                  >
                    <span
                      className={`absolute top-0.5 h-5 w-5 rounded-full bg-white shadow transition-transform ${
                        config.includeLogo ? "left-[22px]" : "left-0.5"
                      }`}
                    />
                  </button>
                </div>
              </div>
            </div>

            <button
              onClick={handleGenerate}
              disabled={generating}
              className="flex w-full items-center justify-center gap-2 rounded-lg bg-primary px-4 py-3 font-semibold text-primary-foreground shadow-glow hover:opacity-90 disabled:opacity-50"
            >
              {generating ? <Loader2 className="h-5 w-5 animate-spin" /> : <QrCode className="h-5 w-5" />}
              {generating ? "Generating..." : "Generate QR Code"}
            </button>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
            className="space-y-6"
          >
            <div className="rounded-xl border border-border bg-card p-6">
              <div className="mb-4 flex items-center justify-between">
                <h2 className="flex items-center gap-2 text-lg font-semibold text-foreground">
                  <Eye className="h-5 w-5 text-primary" />
                  Preview
                </h2>
              </div>
              <div className="flex flex-col items-center">
                <div
                  className="flex h-64 w-64 items-center justify-center rounded-xl p-4"
                  style={{ backgroundColor: config.backgroundColor }}
                >
                  {showPreview ? (
                    <div className="flex h-48 w-48 items-center justify-center">
                      <QrCode className="h-full w-full" style={{ color: config.foregroundColor }} />
                    </div>
                  ) : (
                    <div className="flex h-48 w-48 items-center justify-center border-2 border-dashed border-muted-foreground/30">
                      <QrCode className="h-16 w-16 text-muted-foreground/30" />
                    </div>
                  )}
                </div>
                {showPreview && (
                  <p className="mt-4 text-sm text-muted-foreground">
                    {config.amount ? `$${config.amount} - ` : ""}
                    {config.description || "Scan to pay"}
                  </p>
                )}
              </div>
            </div>

            {showPreview && (
              <>
                <div className="rounded-xl border border-border bg-card p-6">
                  <h3 className="mb-4 font-semibold text-foreground">Download Options</h3>
                  <div className="grid grid-cols-2 gap-3">
                    <button
                      onClick={() => handleDownload("png")}
                      className="flex items-center justify-center gap-2 rounded-lg border border-border px-4 py-3 font-medium hover:bg-secondary"
                    >
                      <Download className="h-5 w-5" />
                      PNG
                    </button>
                    <button
                      onClick={() => handleDownload("svg")}
                      className="flex items-center justify-center gap-2 rounded-lg border border-border px-4 py-3 font-medium hover:bg-secondary"
                    >
                      <Download className="h-5 w-5" />
                      SVG
                    </button>
                  </div>
                  <button
                    onClick={handlePrint}
                    className="mt-3 flex w-full items-center justify-center gap-2 rounded-lg border border-border px-4 py-3 font-medium hover:bg-secondary"
                  >
                    <Printer className="h-5 w-5" />
                    Print
                  </button>
                </div>

                <div className="rounded-xl border border-border bg-card p-6">
                  <h3 className="mb-4 font-semibold text-foreground">Quick Copy</h3>
                  <div className="space-y-3">
                    <div className="flex items-center justify-between rounded-lg border border-border p-3">
                      <span className="text-sm text-muted-foreground">Address</span>
                      <button
                        onClick={async () => {
                          await navigator.clipboard.writeText(config.address);
                          toast.success("Address copied!");
                        }}
                        className="flex items-center gap-1 text-sm text-primary hover:underline"
                      >
                        <Copy className="h-4 w-4" />
                        Copy
                      </button>
                    </div>
                    {config.amount && (
                      <div className="flex items-center justify-between rounded-lg border border-border p-3">
                        <span className="text-sm text-muted-foreground">Amount</span>
                        <button
                          onClick={async () => {
                            await navigator.clipboard.writeText(config.amount);
                            toast.success("Amount copied!");
                          }}
                          className="flex items-center gap-1 text-sm text-primary hover:underline"
                        >
                          <Copy className="h-4 w-4" />
                          Copy
                        </button>
                      </div>
                    )}
                    <div className="flex items-center justify-between rounded-lg border border-border p-3">
                      <span className="text-sm text-muted-foreground">Payment Link</span>
                      <button
                        onClick={async () => {
                          const link = `peys://pay/${config.address}${config.amount ? `?amount=${config.amount}` : ""}`;
                          await navigator.clipboard.writeText(link);
                          toast.success("Link copied!");
                        }}
                        className="flex items-center gap-1 text-sm text-primary hover:underline"
                      >
                        <Copy className="h-4 w-4" />
                        Copy
                      </button>
                    </div>
                  </div>
                </div>
              </>
            )}
          </motion.div>
        </div>
      </div>
      <Footer />
    </div>
  );
}
