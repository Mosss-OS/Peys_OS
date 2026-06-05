import { useState } from "react";
import { motion } from "framer-motion";
import { Search, ExternalLink, ArrowLeft, Activity } from "lucide-react";
import { Link } from "react-router-dom";
import { useApp } from "@/contexts/AppContext";
import AppHeader from "@/components/AppHeader";
import Footer from "@/components/Footer";
import { getChainConfig } from "@/lib/chains";
import { toast } from "sonner";

export default function BlockExplorerPage() {
  const { isLoggedIn, login } = useApp();
  const [searchQuery, setSearchQuery] = useState("");

  const handleSearch = () => {
    if (!searchQuery.trim()) {
      toast.error("Please enter a transaction hash or address");
      return;
    }

    const q = searchQuery.trim();
    if (!q.startsWith("0x")) {
      toast.error("Invalid format. Please enter a valid hash or address (0x...)");
      return;
    }

    const type = q.length > 42 ? "tx" : "address";
    window.open(`https://sepolia.basescan.org/${type}/${q}`, "_blank");
    toast.success(`Opening on Base Sepolia Explorer...`);
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
              className="flex items-center gap-2 rounded-xl bg-primary px-6 py-3 text-sm font-semibold text-primary-foreground shadow-glow transition-opacity hover:opacity-90"
            >
              Search
            </button>
          </div>
          <p className="mt-2 text-xs text-muted-foreground">
            Supports transaction hashes and wallet addresses across all supported networks
          </p>
        </motion.div>

        {/* Empty state */}
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}
          className="rounded-xl border border-dashed border-border p-12 text-center"
        >
          <Search className="mx-auto mb-3 h-10 w-10 text-muted-foreground/50" />
          <p className="text-sm text-muted-foreground">
            Enter a transaction hash or address above to view it on the block explorer.
          </p>
        </motion.div>

        {/* Quick Links */}
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.2 }}
          className="mt-8"
        >
          <h2 className="mb-4 font-display text-lg text-foreground">Quick Links</h2>
          <div className="grid gap-3 sm:grid-cols-2">
        {[
          { name: "Base Sepolia Explorer", url: "https://sepolia.basescan.org", chain: "Base" },
          { name: "Celo Alfajores Explorer", url: "https://alfajores.celoscan.io", chain: "Celo" },
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
