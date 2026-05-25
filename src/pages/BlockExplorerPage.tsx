import { useState } from "react";
import { motion } from "framer-motion";
import { Search, ExternalLink, Copy, Check, ArrowLeft, Activity, Fuel, Box, Hash, Clock } from "lucide-react";
import { Link } from "react-router-dom";
import { useApp } from "@/contexts/AppContext";
import AppHeader from "@/components/AppHeader";
import Footer from "@/components/Footer";
import { getChainConfig } from "@/lib/chains";
import { toast } from "sonner";

interface TransactionDetails {
  hash: string;
  blockNumber: number;
  blockHash: string;
  timestamp: number;
  from: string;
  to: string;
  value: string;
  gasUsed: string;
  gasPrice: string;
  status: "confirmed" | "pending" | "failed";
  network: string;
  explorerUrl: string;
}

const MOCK_TX: TransactionDetails = {
  hash: "0x1234567890abcdef1234567890abcdef1234567890abcdef1234567890abcdef",
  blockNumber: 12345678,
  blockHash: "0xabcdef1234567890abcdef1234567890abcdef1234567890abcdef12345678",
  timestamp: Date.now() - 3600000,
  from: "0x742d35Cc6634C0532925a3b844Bc9e7595f0d123",
  to: "0x8626f6940E2eb28930eFb4CeF49B2d1F2C9C1199",
  value: "1.5",
  gasUsed: "21000",
  gasPrice: "0.00001",
  status: "confirmed",
  network: "Base Sepolia Testnet",
  explorerUrl: "https://sepolia.basescan.org",
};

export default function BlockExplorerPage() {
  const { isLoggedIn, login, walletAddress } = useApp();
  const [searchQuery, setSearchQuery] = useState("");
  const [txDetails, setTxDetails] = useState<TransactionDetails | null>(null);
  const [loading, setLoading] = useState(false);
  const [copied, setCopied] = useState<string | null>(null);

  const handleSearch = async () => {
    if (!searchQuery.trim()) {
      toast.error("Please enter a transaction hash or address");
      return;
    }

    setLoading(true);
    await new Promise((resolve) => setTimeout(resolve, 1500));

    // Mock response - in production this would call an API
    if (searchQuery.startsWith("0x") && searchQuery.length > 40) {
      setTxDetails({ ...MOCK_TX, hash: searchQuery });
      toast.success("Transaction found!");
    } else if (searchQuery.startsWith("0x")) {
      setTxDetails({ ...MOCK_TX, from: searchQuery });
      toast.success("Address details loaded");
    } else {
      toast.error("Invalid format. Please enter a valid hash (0x...) or address");
      setTxDetails(null);
    }

    setLoading(false);
  };

  const copyToClipboard = (text: string, type: string) => {
    navigator.clipboard.writeText(text);
    setCopied(type);
    toast.success("Copied to clipboard");
    setTimeout(() => setCopied(null), 2000);
  };

  const getExplorerUrl = (type: "tx" | "address", hash: string, _network: string) => {
    return `https://sepolia.basescan.org/${type}/${hash}`;
  };

  const openInExplorer = (type: "tx" | "address", hash: string) => {
    if (txDetails) {
      window.open(getExplorerUrl(type, hash, txDetails.network), "_blank");
    }
  };

  if (!isLoggedIn) {
    return (
      <div className="min-h-screen bg-background">
        <AppHeader />
        <div className="flex min-h-[80vh] flex-col items-center justify-center px-4 text-center">
          <div className="mb-6 flex h-20 w-20 items-center justify-center rounded-full bg-primary/10">
            <Activity className="h-10 w-10 text-primary" />
          </div>
          <h2 className="mb-3 font-display text-2xl text-foreground sm:text-3xl">Block Explorer</h2>
          <p className="mb-6 max-w-md text-sm text-muted-foreground">
            View transaction details and verify on-chain status across multiple networks.
          </p>
          <button onClick={login} className="rounded-lg bg-primary px-6 py-3 font-semibold text-primary-foreground shadow-glow hover:opacity-90">
            Sign In to Search
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
        <Link to="/dashboard" className="mb-4 inline-flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground transition-colors">
          <ArrowLeft className="h-4 w-4" /> Back to Dashboard
        </Link>

        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="mb-8">
          <div className="flex items-center gap-3">
            <div className="flex h-12 w-12 items-center justify-center rounded-full bg-primary/10">
              <Activity className="h-6 w-6 text-primary" />
            </div>
            <div>
              <h1 className="font-display text-3xl text-foreground sm:text-4xl">Block Explorer</h1>
              <p className="text-muted-foreground">View transaction details and verify on-chain status</p>
            </div>
          </div>
        </motion.div>

        {/* Search */}
        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.1 }}
          className="mb-8"
        >
          <div className="flex gap-3">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 h-5 w-5 -translate-y-1/2 text-muted-foreground" />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                onKeyDown={(e) => e.key === "Enter" && handleSearch()}
                placeholder="Enter transaction hash or address (0x...)"
                className="w-full rounded-xl border border-border bg-card py-3 pl-11 pr-4 text-sm text-foreground placeholder:text-muted-foreground/50 focus:outline-none focus:ring-2 focus:ring-ring"
              />
            </div>
            <button
              onClick={handleSearch}
              disabled={loading}
              className="flex items-center gap-2 rounded-xl bg-primary px-6 py-3 text-sm font-semibold text-primary-foreground shadow-glow transition-opacity hover:opacity-90 disabled:opacity-50"
            >
              {loading ? "Searching..." : "Search"}
            </button>
          </div>
          <p className="mt-2 text-xs text-muted-foreground">
            Supports transaction hashes and wallet addresses across all supported networks
          </p>
        </motion.div>

        {/* Transaction Details */}
        {txDetails && (
          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}
            className="rounded-xl border border-border bg-card overflow-hidden"
          >
            {/* Header */}
            <div className="flex items-center justify-between border-b border-border bg-secondary/50 p-4">
              <div className="flex items-center gap-2">
                <span className={`rounded-full px-2.5 py-1 text-xs font-medium ${
                  txDetails.status === "confirmed"
                    ? "bg-green-500/10 text-green-500"
                    : txDetails.status === "pending"
                    ? "bg-yellow-500/10 text-yellow-500"
                    : "bg-red-500/10 text-red-500"
                }`}>
                  {txDetails.status}
                </span>
                <span className="text-sm text-muted-foreground">{txDetails.network}</span>
              </div>
              <button
                onClick={() => openInExplorer("tx", txDetails.hash)}
                className="flex items-center gap-1 text-sm text-primary hover:underline"
              >
                View on Explorer
                <ExternalLink className="h-4 w-4" />
              </button>
            </div>

            {/* Details Grid */}
            <div className="p-4 space-y-4">
              {/* TX Hash */}
              <div className="flex items-start justify-between gap-4">
                <div className="flex items-center gap-2 text-sm text-muted-foreground">
                  <Hash className="h-4 w-4" />
                  Transaction Hash
                </div>
                <div className="flex items-center gap-2">
                  <span className="text-sm font-mono text-foreground break-all">
                    {txDetails.hash.slice(0, 10)}...{txDetails.hash.slice(-8)}
                  </span>
                  <button
                    onClick={() => copyToClipboard(txDetails.hash, "hash")}
                    className="text-muted-foreground hover:text-foreground"
                  >
                    {copied === "hash" ? <Check className="h-4 w-4 text-green-500" /> : <Copy className="h-4 w-4" />}
                  </button>
                </div>
              </div>

              {/* Block */}
              <div className="flex items-start justify-between gap-4">
                <div className="flex items-center gap-2 text-sm text-muted-foreground">
                  <Box className="h-4 w-4" />
                  Block Number
                </div>
                <div className="flex items-center gap-2">
                  <span className="text-sm font-mono text-foreground">{txDetails.blockNumber.toLocaleString()}</span>
                  <button
                    onClick={() => openInExplorer("block", txDetails.blockNumber.toString())}
                    className="text-muted-foreground hover:text-foreground"
                  >
                    <ExternalLink className="h-4 w-4" />
                  </button>
                </div>
              </div>

              {/* Timestamp */}
              <div className="flex items-start justify-between gap-4">
                <div className="flex items-center gap-2 text-sm text-muted-foreground">
                  <Clock className="h-4 w-4" />
                  Timestamp
                </div>
                <span className="text-sm text-foreground">
                  {new Date(txDetails.timestamp).toLocaleString()}
                </span>
              </div>

              {/* From */}
              <div className="flex items-start justify-between gap-4">
                <div className="text-sm text-muted-foreground">From</div>
                <div className="flex items-center gap-2">
                  <span className="text-sm font-mono text-foreground">
                    {txDetails.from.slice(0, 8)}...{txDetails.from.slice(-6)}
                  </span>
                  <button
                    onClick={() => copyToClipboard(txDetails.from, "from")}
                    className="text-muted-foreground hover:text-foreground"
                  >
                    {copied === "from" ? <Check className="h-4 w-4 text-green-500" /> : <Copy className="h-4 w-4" />}
                  </button>
                  <button
                    onClick={() => openInExplorer("address", txDetails.from)}
                    className="text-muted-foreground hover:text-foreground"
                  >
                    <ExternalLink className="h-4 w-4" />
                  </button>
                </div>
              </div>

              {/* To */}
              <div className="flex items-start justify-between gap-4">
                <div className="text-sm text-muted-foreground">To</div>
                <div className="flex items-center gap-2">
                  <span className="text-sm font-mono text-foreground">
                    {txDetails.to.slice(0, 8)}...{txDetails.to.slice(-6)}
                  </span>
                  <button
                    onClick={() => copyToClipboard(txDetails.to, "to")}
                    className="text-muted-foreground hover:text-foreground"
                  >
                    {copied === "to" ? <Check className="h-4 w-4 text-green-500" /> : <Copy className="h-4 w-4" />}
                  </button>
                  <button
                    onClick={() => openInExplorer("address", txDetails.to)}
                    className="text-muted-foreground hover:text-foreground"
                  >
                    <ExternalLink className="h-4 w-4" />
                  </button>
                </div>
              </div>

              {/* Value */}
              <div className="flex items-start justify-between gap-4">
                <div className="text-sm text-muted-foreground">Value</div>
                <span className="text-sm font-semibold text-foreground">{txDetails.value} USDC</span>
              </div>

              {/* Gas */}
              <div className="flex items-start justify-between gap-4">
                <div className="flex items-center gap-2 text-sm text-muted-foreground">
                  <Fuel className="h-4 w-4" />
                  Gas Used
                </div>
                <span className="text-sm text-foreground">{parseInt(txDetails.gasUsed).toLocaleString()}</span>
              </div>

              {/* Gas Price */}
              <div className="flex items-start justify-between gap-4">
                <div className="text-sm text-muted-foreground">Gas Price</div>
                <span className="text-sm text-foreground">{txDetails.gasPrice} ETH</span>
              </div>
            </div>
          </motion.div>
        )}

        {/* Quick Links */}
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.2 }}
          className="mt-8"
        >
          <h2 className="mb-4 font-display text-lg text-foreground">Quick Links</h2>
          <div className="grid gap-3 sm:grid-cols-2">
        {[
          { name: "Base Sepolia Explorer", url: "https://sepolia.basescan.org", chain: "Base" },
        ].map((explorer) => (
              <a
                key={explorer.url}
                href={explorer.url}
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center justify-between rounded-xl border border-border bg-card p-4 transition-colors hover:bg-secondary/30"
              >
                <div>
                  <p className="text-sm font-medium text-foreground">{explorer.name}</p>
                  <p className="text-xs text-muted-foreground">{explorer.chain}</p>
                </div>
                <ExternalLink className="h-4 w-4 text-muted-foreground" />
              </a>
            ))}
          </div>
        </motion.div>
      </div>
      <Footer />
    </div>
  );
}
