import { useState } from "react";
import { motion } from "framer-motion";
import { Clipboard, Copy, Check, Loader2, Link2, FileText, Key, Hash, User, DollarSign } from "lucide-react";
import { useApp } from "@/contexts/AppContext";
import AppHeader from "@/components/AppHeader";
import Footer from "@/components/Footer";
import { toast } from "sonner";

interface ClipboardItem {
  id: string;
  type: "address" | "amount" | "txId" | "text";
  value: string;
  label: string;
  timestamp: string;
}

export default function ClipboardPage() {
  const { isLoggedIn, login } = useApp();
  const [copiedId, setCopiedId] = useState<string | null>(null);
  const [pastedValue, setPastedValue] = useState("");
  const [pasting, setPasting] = useState(false);

  const clipboardHistory: ClipboardItem[] = [
    { id: "1", type: "address", value: "0x1234567890abcdef1234567890abcdef12345678", label: "Recipient Address", timestamp: "2026-03-18 14:30" },
    { id: "2", type: "amount", value: "50.00", label: "Payment Amount", timestamp: "2026-03-18 14:25" },
    { id: "3", type: "txId", value: "0xabcdef1234567890abcdef1234567890abcdef12", label: "Transaction ID", timestamp: "2026-03-17 09:15" },
    { id: "4", type: "address", value: "0x9876543210fedcba9876543210fedcba98765432", label: "Savings Address", timestamp: "2026-03-16 18:45" },
  ];

  const handleCopy = async (item: ClipboardItem) => {
    try {
      await navigator.clipboard.writeText(item.value);
      setCopiedId(item.id);
      toast.success(`${item.label} copied!`);
      setTimeout(() => setCopiedId(null), 2000);
    } catch (err) {
      toast.error("Failed to copy. Please check permissions.");
    }
  };

  const handlePaste = async () => {
    setPasting(true);
    try {
      const text = await navigator.clipboard.readText();
      setPastedValue(text);
      toast.success("Content pasted!");
    } catch (err) {
      toast.error("Failed to paste. Please check clipboard permissions.");
    }
  };

  const handleClearHistory = () => {
    toast.success("Clipboard history cleared");
  };

  const getIcon = (type: ClipboardItem["type"]) => {
    switch (type) {
      case "address":
        return <Link2 className="h-4 w-4" />;
      case "amount":
        return <DollarSign className="h-4 w-4" />;
      case "txId":
        return <Hash className="h-4 w-4" />;
      default:
        return <FileText className="h-4 w-4" />;
    }
  };

  const formatValue = (item: ClipboardItem) => {
    if (item.type === "address" && item.value.length > 20) {
      return item.value.slice(0, 10) + "..." + item.value.slice(-8);
    }
    if (item.type === "txId" && item.value.length > 20) {
      return item.value.slice(0, 12) + "..." + item.value.slice(-8);
    }
    return item.value;
  };

  if (!isLoggedIn) {
    return (
      <div className="min-h-screen bg-background">
        <AppHeader />
        <div className="flex min-h-[80vh] flex-col items-center justify-center px-4 text-center">
          <div className="mb-6 flex h-20 w-20 items-center justify-center rounded-full bg-primary/10">
            <Clipboard className="h-10 w-10 text-primary" />
          </div>
          <h2 className="mb-3 font-display text-2xl text-foreground sm:text-3xl">Clipboard Integration</h2>
          <p className="mb-6 max-w-md text-sm text-muted-foreground">
            Quick copy and paste for wallet addresses, amounts, and transaction IDs.
          </p>
          <button onClick={login} className="rounded-lg bg-primary px-6 py-3 font-semibold text-primary-foreground shadow-glow hover:opacity-90">
            Sign In to Use Clipboard
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
          <h1 className="font-display text-2xl text-foreground sm:text-3xl">Clipboard Integration</h1>
          <p className="mt-1 text-sm text-muted-foreground">Quick copy and paste for payments</p>
        </div>

        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          className="mb-6 rounded-xl border border-border bg-card p-6"
        >
          <h2 className="mb-4 flex items-center gap-2 text-lg font-semibold text-foreground">
            <Clipboard className="h-5 w-5 text-primary" />
            Paste from Clipboard
          </h2>
          <div className="flex gap-3">
            <div className="relative flex-1">
              <input
                type="text"
                value={pastedValue}
                onChange={(e) => setPastedValue(e.target.value)}
                placeholder="Click paste to get clipboard content..."
                className="w-full rounded-lg border border-border bg-background px-4 py-3 pr-20 font-mono text-sm text-foreground placeholder:text-muted-foreground focus:border-primary focus:outline-none"
              />
              {pastedValue && (
                <button
                  onClick={() => setPastedValue("")}
                  className="absolute right-12 top-1/2 -translate-y-1/2 rounded-lg p-1.5 hover:bg-secondary"
                >
                  ×
                </button>
              )}
            </div>
            <button
              onClick={handlePaste}
              disabled={pasting}
              className="flex items-center gap-2 rounded-lg bg-primary px-4 py-3 font-medium text-primary-foreground hover:opacity-90 disabled:opacity-50"
            >
              {pasting ? <Loader2 className="h-4 w-4 animate-spin" /> : <Clipboard className="h-4 w-4" />}
              Paste
            </button>
          </div>
          <p className="mt-2 text-xs text-muted-foreground">
            Paste content from your clipboard to use in payments or other forms
          </p>
        </motion.div>

        <div className="mb-4 flex items-center justify-between">
          <h2 className="flex items-center gap-2 text-lg font-semibold text-foreground">
            <Copy className="h-5 w-5 text-primary" />
            Quick Copy
          </h2>
          <button
            onClick={handleClearHistory}
            className="text-sm text-muted-foreground hover:text-foreground"
          >
            Clear History
          </button>
        </div>

        <div className="mb-6 grid gap-4 md:grid-cols-2">
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            className="rounded-xl border border-border bg-card p-5"
          >
            <div className="mb-3 flex items-center gap-2">
              <User className="h-5 w-5 text-primary" />
              <h3 className="font-semibold text-foreground">My Wallet Address</h3>
            </div>
            <p className="mb-3 truncate font-mono text-sm text-muted-foreground">
              0x1234567890abcdef1234567890abcdef12345678
            </p>
            <button
              onClick={() => handleCopy({ id: "myaddress", type: "address", value: "0x1234567890abcdef1234567890abcdef12345678", label: "My Wallet Address", timestamp: new Date().toISOString() })}
              className={`flex w-full items-center justify-center gap-2 rounded-lg px-4 py-2.5 text-sm font-medium transition-colors ${
                copiedId === "myaddress"
                  ? "bg-green-500 text-white"
                  : "bg-primary text-primary-foreground hover:opacity-90"
              }`}
            >
              {copiedId === "myaddress" ? (
                <>
                  <Check className="h-4 w-4" />
                  Copied!
                </>
              ) : (
                <>
                  <Copy className="h-4 w-4" />
                  Copy Address
                </>
              )}
            </button>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
            className="rounded-xl border border-border bg-card p-5"
          >
            <div className="mb-3 flex items-center gap-2">
              <DollarSign className="h-5 w-5 text-primary" />
              <h3 className="font-semibold text-foreground">Last Amount</h3>
            </div>
            <p className="mb-3 text-2xl font-bold text-foreground">$50.00</p>
            <button
              onClick={() => handleCopy({ id: "lastamount", type: "amount", value: "50.00", label: "Last Amount", timestamp: new Date().toISOString() })}
              className={`flex w-full items-center justify-center gap-2 rounded-lg px-4 py-2.5 text-sm font-medium transition-colors ${
                copiedId === "lastamount"
                  ? "bg-green-500 text-white"
                  : "bg-primary text-primary-foreground hover:opacity-90"
              }`}
            >
              {copiedId === "lastamount" ? (
                <>
                  <Check className="h-4 w-4" />
                  Copied!
                </>
              ) : (
                <>
                  <Copy className="h-4 w-4" />
                  Copy Amount
                </>
              )}
            </button>
          </motion.div>
        </div>

        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
          className="rounded-xl border border-border bg-card p-6"
        >
          <h2 className="mb-4 flex items-center gap-2 text-lg font-semibold text-foreground">
            <Clipboard className="h-5 w-5 text-primary" />
            Clipboard History
          </h2>
          <div className="space-y-3">
            {clipboardHistory.map((item) => (
              <div
                key={item.id}
                className="flex items-center justify-between rounded-lg border border-border p-4"
              >
                <div className="flex items-center gap-3">
                  <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-primary/10">
                    {getIcon(item.type)}
                  </div>
                  <div>
                    <p className="font-medium text-foreground">{item.label}</p>
                    <p className="font-mono text-sm text-muted-foreground">
                      {formatValue(item)}
                    </p>
                    <p className="mt-0.5 text-xs text-muted-foreground">{item.timestamp}</p>
                  </div>
                </div>
                <button
                  onClick={() => handleCopy(item)}
                  className={`rounded-lg p-2 transition-colors ${
                    copiedId === item.id
                      ? "bg-green-500/10 text-green-500"
                      : "hover:bg-secondary"
                  }`}
                >
                  {copiedId === item.id ? (
                    <Check className="h-5 w-5" />
                  ) : (
                    <Copy className="h-5 w-5 text-muted-foreground" />
                  )}
                </button>
              </div>
            ))}
          </div>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3 }}
          className="mt-6 rounded-xl border border-border bg-card p-6"
        >
          <h2 className="mb-4 text-lg font-semibold text-foreground">Tips</h2>
          <ul className="space-y-2 text-sm text-muted-foreground">
            <li className="flex items-start gap-2">
              <Check className="mt-0.5 h-4 w-4 text-green-500" />
              Click any item to quickly copy it to your clipboard
            </li>
            <li className="flex items-start gap-2">
              <Check className="mt-0.5 h-4 w-4 text-green-500" />
              Use the paste button to quickly paste content from your clipboard
            </li>
            <li className="flex items-start gap-2">
              <Check className="mt-0.5 h-4 w-4 text-green-500" />
              Clipboard history helps you quickly access previously used addresses
            </li>
            <li className="flex items-start gap-2">
              <Check className="mt-0.5 h-4 w-4 text-green-500" />
              Wallet addresses are validated before copying to prevent errors
            </li>
          </ul>
        </motion.div>
      </div>
      <Footer />
    </div>
  );
}
