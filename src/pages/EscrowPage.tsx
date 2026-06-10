import { useState, useEffect, useCallback } from "react";
import { motion } from "framer-motion";
import { Clock, RotateCcw, ExternalLink, Search, Filter } from "lucide-react";
import { useApp } from "@/contexts/AppContext";
import AppHeader from "@/components/AppHeader";
import Footer from "@/components/Footer";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { useEscrow } from "@/hooks/useEscrow";

interface Payment {
  id: string;
  payment_id: string;
  recipient_email: string;
  amount: number;
  token: string;
  status: string;
  tx_hash: string;
  claim_link: string;
  expires_at: string;
  created_at: string;
}

export default function EscrowPage() {
  const { isLoggedIn, login, walletAddress } = useApp();
  const [payments, setPayments] = useState<Payment[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const { refundPayment } = useEscrow();

  const fetchPayments = useCallback(async () => {
    if (!walletAddress) return;
    setLoading(true);
    try {
      const { data, error } = await supabase
        .from("payments")
        .select("*")
        .eq("sender_wallet", walletAddress.toLowerCase())
        .order("created_at", { ascending: false });

      if (error) throw error;
      setPayments(data || []);
    } catch (err) {
      console.error("Failed to fetch payments:", err);
      toast.error("Failed to load payments");
    } finally {
      setLoading(false);
    }
  }, [walletAddress]);

  useEffect(() => {
    if (isLoggedIn) {
      fetchPayments();
    }
  }, [isLoggedIn, fetchPayments]);

  const handleRefund = async (payment: Payment) => {
    try {
      // In a real app, you'd call the smart contract refund function
      // For now, we'll just update the status in the database
      const { error } = await supabase
        .from("payments")
        .update({ status: "refunded" })
        .eq("id", payment.id);

      if (error) throw error;
      toast.success("Payment refunded successfully");
      fetchPayments(); // Refresh the list
    } catch (err) {
      console.error("Refund failed:", err);
      toast.error("Failed to refund payment");
    }
  };

  if (!isLoggedIn) {
    return (
      <div className="min-h-screen bg-background">
        <AppHeader />
        <div className="flex min-h-[80vh] flex-col items-center justify-center px-4">
          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="text-center">
            <h2 className="mb-3 font-display text-2xl text-foreground sm:text-3xl">Sign in to view your escrow</h2>
            <p className="mb-6 text-sm text-muted-foreground sm:text-base">Manage your pending payments and refunds.</p>
            <button onClick={login} className="inline-flex items-center gap-2 rounded-lg bg-primary px-6 py-3 font-semibold text-primary-foreground shadow-glow transition-opacity hover:opacity-90">
              Sign In
            </button>
          </motion.div>
        </div>
        <Footer />
      </div>
    );
  }

  const filteredPayments = payments.filter((p) => {
    if (statusFilter !== "all" && p.status !== statusFilter) return false;
    if (searchQuery) {
      const q = searchQuery.toLowerCase();
      return (
        p.recipient_email.toLowerCase().includes(q) ||
        p.payment_id.toLowerCase().includes(q)
      );
    }
    return true;
  });

  return (
    <div className="min-h-screen bg-background">
      <AppHeader />
      <div className="container mx-auto max-w-4xl px-4 pt-20 pb-12">
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="mb-8">
          <h1 className="font-display text-2xl text-foreground sm:text-3xl">Escrow Management</h1>
          <p className="mt-1 text-sm text-muted-foreground">View and manage your pending payments</p>
        </motion.div>

        {/* Filters */}
        <div className="mb-6 flex flex-col sm:flex-row gap-4">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
            <input
              type="text"
              placeholder="Search by email or ID..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full rounded-lg border border-border bg-background pl-10 pr-4 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary"
            />
          </div>
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="rounded-lg border border-border bg-background px-4 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary"
          >
            <option value="all">All Status</option>
            <option value="pending">Pending</option>
            <option value="claimed">Claimed</option>
            <option value="refunded">Refunded</option>
            <option value="expired">Expired</option>
          </select>
        </div>

        {/* Payments List */}
        {loading ? (
          <div className="flex justify-center py-12">
            <div className="h-8 w-8 animate-spin rounded-full border-2 border-primary border-t-transparent" />
          </div>
        ) : filteredPayments.length === 0 ? (
          <div className="text-center py-12">
            <Clock className="mx-auto h-12 w-12 text-muted-foreground/50" />
            <h3 className="mt-4 font-medium text-foreground">No payments found</h3>
            <p className="mt-1 text-sm text-muted-foreground">
              {searchQuery || statusFilter !== "all" ? "Try adjusting your filters" : "You haven't created any payments yet"}
            </p>
          </div>
        ) : (
          <div className="space-y-3">
            {filteredPayments.map((payment) => (
              <motion.div
                key={payment.id}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                className="rounded-xl border border-border bg-card p-4"
              >
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2">
                      <p className="truncate text-sm font-medium text-foreground">
                        {payment.recipient_email}
                      </p>
                      <span className={`text-xs px-2 py-0.5 rounded-full ${
                        payment.status === "pending" ? "bg-yellow-100 text-yellow-800" :
                        payment.status === "claimed" ? "bg-green-100 text-green-800" :
                        payment.status === "refunded" ? "bg-blue-100 text-blue-800" :
                        "bg-gray-100 text-gray-800"
                      }`}>
                        {payment.status}
                      </span>
                    </div>
                    <p className="text-xs text-muted-foreground mt-1">
                      ID: {payment.payment_id.slice(0, 8)}... • {new Date(payment.created_at).toLocaleDateString()}
                    </p>
                  </div>
                  
                  <div className="flex items-center gap-3">
                    <div className="text-right">
                      <p className="text-sm font-semibold text-foreground">
                        ${payment.amount} {payment.token}
                      </p>
                      <p className="text-xs text-muted-foreground">
                        Expires: {new Date(payment.expires_at).toLocaleDateString()}
                      </p>
                    </div>
                    
                    {payment.status === "pending" && (
                      <button
                        onClick={() => handleRefund(payment)}
                        className="flex items-center gap-1 rounded-lg border border-border px-3 py-1.5 text-xs font-medium text-foreground transition-colors hover:bg-secondary"
                      >
                        <RotateCcw className="h-3 w-3" />
                        Refund
                      </button>
                    )}
                    
                    <a
                      href={payment.claim_link}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="flex items-center gap-1 rounded-lg bg-primary px-3 py-1.5 text-xs font-medium text-primary-foreground transition-opacity hover:opacity-90"
                    >
                      <ExternalLink className="h-3 w-3" />
                      Link
                    </a>
                  </div>
                </div>
              </motion.div>
            ))}
          </div>
        )}
      </div>
      <Footer />
    </div>
  );
}
