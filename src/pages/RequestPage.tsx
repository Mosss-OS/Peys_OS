import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { FileText, Plus, Copy, Check, Clock, DollarSign, ExternalLink, Share2, Loader2, LucideIcon } from "lucide-react";
import { useApp } from "@/contexts/AppContext";
import AppHeader from "@/components/AppHeader";
import Footer from "@/components/Footer";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";

interface PaymentRequest {
  id: string;
  user_id: string | null;
  wallet_address: string | null;
  requester_email: string | null;
  payer_email: string | null;
  amount: number;
  token: string;
  memo: string | null;
  status: string;
  request_link: string;
  paid_at: string | null;
  expires_at: string;
  created_at: string;
  updated_at: string;
}

const statusStyles: Record<string, string> = {
  open: "bg-primary/10 text-primary",
  paid: "bg-primary/10 text-primary",
  expired: "bg-muted text-muted-foreground",
};

const statusIcons: Record<string, LucideIcon> = {
  open: Clock,
  paid: Check,
  expired: Clock,
};

export default function RequestPage() {
  const { isLoggedIn, login } = useApp();
  const [requests, setRequests] = useState<PaymentRequest[]>([]);
  const [loading, setLoading] = useState(true);
  const [showCreate, setShowCreate] = useState(false);
  const [created, setCreated] = useState<PaymentRequest | null>(null);
  const [copiedId, setCopiedId] = useState<string | null>(null);
  const [form, setForm] = useState({
    from: "",
    amount: "",
    token: "USDC" as "USDC" | "USDT",
    memo: "",
  });

  useEffect(() => {
    if (isLoggedIn) {
      fetchRequests();
    }
  }, [isLoggedIn]);

  const fetchRequests = async () => {
    try {
      setLoading(true);
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      const { data, error } = await supabase
        .from("payment_requests")
        .select("*")
        .eq("user_id", user.id)
        .order("created_at", { ascending: false });

      if (error) {
        console.error("Error fetching requests:", error);
        setRequests([]);
      } else {
        setRequests(data || []);
      }
    } catch (err) {
      console.error("Error:", err);
      setRequests([]);
    } finally {
      setLoading(false);
    }
  };

  if (!isLoggedIn) {
    return (
      <div className="min-h-screen bg-background">
        <AppHeader />
        <div className="flex min-h-[80vh] flex-col items-center justify-center px-4">
          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="text-center">
            <FileText className="mx-auto mb-4 h-12 w-12 text-primary" />
            <h2 className="mb-3 font-display text-2xl text-foreground sm:text-3xl">Payment Requests</h2>
            <p className="mb-6 max-w-md text-sm text-muted-foreground">Create invoices and request payments with shareable links.</p>
            <button onClick={login} className="rounded-lg bg-primary px-6 py-3 font-semibold text-primary-foreground shadow-glow transition-opacity hover:opacity-90">
              Sign In
            </button>
          </motion.div>
        </div>
        <Footer />
      </div>
    );
  }

  const createRequest = async () => {
    if (!form.amount) { toast.error("Enter an amount"); return; }
    
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      const id = `req_${Date.now()}`;
      const link = `peys.app/request/${id}`;

      const { data, error } = await supabase
        .from("payment_requests")
        .insert({
          user_id: user.id,
          requester_email: form.from || "Anyone",
          amount: Number(form.amount),
          token: form.token,
          memo: form.memo || null,
          status: "open",
          link,
          expires_at: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString(),
        })
        .select()
        .single();

      if (error) {
        console.error("Error creating request:", error);
        toast.error("Failed to create request");
        return;
      }

      setRequests((prev) => [data, ...prev]);
      setCreated(data);
      setShowCreate(false);
      setForm({ from: "", amount: "", token: "USDC", memo: "" });
      toast.success("Payment request created! 📨");
    } catch (err) {
      console.error("Error:", err);
      toast.error("Failed to create request");
    }
  };

  const copyLink = (link: string, id: string) => {
    navigator.clipboard.writeText(`https://${link}`);
    setCopiedId(id);
    setTimeout(() => setCopiedId(null), 2000);
    toast.success("Link copied!");
  };

  const shareRequest = async (req: PaymentRequest) => {
    const shareData = {
      title: `Payment request for $${req.amount} ${req.token}`,
      text: `${req.memo || "Payment requested"} — $${req.amount} ${req.token} on Peys`,
      url: `https://${req.request_link}`,
    };
    if (navigator.share) {
      try { await navigator.share(shareData); } catch (e) {
        // Fallback to clipboard copy if share fails
        console.log("Share not supported, using clipboard");
      }
    } else {
      copyLink(req.request_link, req.id);
    }
  };

  const totalOpen = requests.filter((r) => r.status === "open").reduce((s, r) => s + r.amount, 0);

  return (
    <div className="min-h-screen bg-background">
      <AppHeader />
      <div className="container mx-auto max-w-5xl lg:max-w-6xl px-4 pt-20 pb-12 sm:pt-24 sm:pb-16 lg:pt-24 lg:pb-20">
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}>
          <div className="mb-6 flex items-center justify-between">
            <div>
              <h1 className="font-display text-2xl text-foreground sm:text-3xl">Requests</h1>
              <p className="mt-1 text-sm text-muted-foreground">
                {loading ? "Loading..." : totalOpen > 0 ? `$${totalOpen.toLocaleString()} outstanding` : "No pending requests"}
              </p>
            </div>
            <button
              onClick={() => { setShowCreate(!showCreate); setCreated(null); }}
              className="flex items-center gap-2 rounded-lg bg-primary px-4 py-2 text-sm font-semibold text-primary-foreground shadow-glow transition-opacity hover:opacity-90"
            >
              <Plus className="h-4 w-4" /> New Request
            </button>
          </div>
        </motion.div>

        {/* Created success */}
        <AnimatePresence>
          {created && (
            <motion.div
              initial={{ opacity: 0, y: -10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0 }}
              className="mb-4 rounded-xl border border-primary/20 bg-primary/5 p-4"
            >
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-semibold text-foreground">Request created!</p>
                  <p className="text-xs text-muted-foreground">${created.amount} {created.token} from {created.requester_email}</p>
                </div>
                <button onClick={() => setCreated(null)} className="text-muted-foreground hover:text-foreground text-xs">Dismiss</button>
              </div>
              <div className="mt-2 flex items-center gap-2 rounded-lg border border-border bg-card p-2">
                <span className="flex-1 truncate text-xs text-foreground">{created.request_link}</span>
                <button onClick={() => copyLink(created.request_link, created.id)} className="rounded-md border border-border p-1.5 transition-colors hover:bg-secondary">
                  {copiedId === created.id ? <Check className="h-3.5 w-3.5 text-primary" /> : <Copy className="h-3.5 w-3.5 text-muted-foreground" />}
                </button>
                <button onClick={() => shareRequest(created)} className="rounded-md border border-border p-1.5 transition-colors hover:bg-secondary">
                  <Share2 className="h-3.5 w-3.5 text-muted-foreground" />
                </button>
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Create Form */}
        <AnimatePresence>
          {showCreate && (
            <motion.div
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: "auto" }}
              exit={{ opacity: 0, height: 0 }}
              className="mb-6 overflow-hidden"
            >
              <div className="rounded-xl border border-border bg-card p-4 shadow-card sm:p-6 lg:p-8">
                <h3 className="mb-4 font-display text-lg text-foreground">New Request</h3>
                <div className="space-y-3">
                  <div className="relative">
                    <DollarSign className="absolute left-3 top-1/2 h-5 w-5 -translate-y-1/2 text-muted-foreground" />
                    <input
                      type="number"
                      value={form.amount}
                      onChange={(e) => setForm({ ...form, amount: e.target.value })}
                      placeholder="0.00"
                      className="w-full rounded-lg border border-border bg-background py-3 pl-10 pr-4 text-xl font-bold text-foreground placeholder:text-muted-foreground/30 focus:outline-none focus:ring-2 focus:ring-ring"
                    />
                  </div>
                  <div className="flex gap-2">
                    {(["USDC"] as const).map((t) => (
                      <button
                        key={t}
                        onClick={() => setForm({ ...form, token: t })}
                        className={`flex-1 rounded-lg py-2.5 text-sm font-semibold transition-all ${
                          form.token === t ? "bg-primary text-primary-foreground" : "border border-border text-muted-foreground hover:bg-secondary"
                        }`}
                      >
                        {t}
                      </button>
                    ))}
                  </div>
                  <input
                    value={form.from}
                    onChange={(e) => setForm({ ...form, from: e.target.value })}
                    placeholder="From (email, optional)"
                    className="w-full rounded-lg border border-border bg-background px-4 py-2.5 text-sm text-foreground placeholder:text-muted-foreground/50 focus:outline-none focus:ring-2 focus:ring-ring"
                  />
                  <input
                    value={form.memo}
                    onChange={(e) => setForm({ ...form, memo: e.target.value })}
                    placeholder="Description / invoice note"
                    className="w-full rounded-lg border border-border bg-background px-4 py-2.5 text-sm text-foreground placeholder:text-muted-foreground/50 focus:outline-none focus:ring-2 focus:ring-ring"
                  />
                  <div className="flex gap-2">
                    <button onClick={() => setShowCreate(false)} className="flex-1 rounded-lg border border-border py-2.5 text-sm font-medium text-foreground hover:bg-secondary">
                      Cancel
                    </button>
                    <button onClick={createRequest} className="flex-1 rounded-lg bg-primary py-2.5 text-sm font-semibold text-primary-foreground shadow-glow transition-opacity hover:opacity-90">
                      Create Request
                    </button>
                  </div>
                </div>
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Requests List */}
        {loading ? (
          <div className="flex items-center justify-center py-12">
            <Loader2 className="h-8 w-8 animate-spin text-primary" />
          </div>
        ) : (
          <div className="space-y-3 lg:space-y-4">
            {requests.map((req, i) => {
              const StatusIcon = statusIcons[req.status] || Clock;
              return (
                <motion.div
                  key={req.id}
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: i * 0.05 }}
                  className="flex items-center gap-3 rounded-xl border border-border bg-card p-4 lg:p-5 transition-colors hover:bg-secondary/20"
                >
                  <div className={`flex h-9 w-9 shrink-0 items-center justify-center rounded-full ${statusStyles[req.status] || statusStyles.open}`}>
                    <StatusIcon className="h-4 w-4" />
                  </div>
                  <div className="min-w-0 flex-1">
                    <div className="flex items-center gap-2">
                      <p className="truncate text-sm font-medium text-foreground">{req.requester_email}</p>
                      <span className={`rounded-full px-2 py-0.5 text-xs font-medium capitalize ${statusStyles[req.status] || statusStyles.open}`}>
                        {req.status}
                      </span>
                    </div>
                    {req.memo && <p className="truncate text-xs text-muted-foreground">{req.memo}</p>}
                  </div>
                  <div className="text-right">
                    <p className="text-sm font-semibold text-foreground">${req.amount} {req.token}</p>
                  </div>
                  {req.status === "open" && (
                    <button
                      onClick={() => copyLink(req.request_link, req.id)}
                      className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg border border-border text-muted-foreground transition-colors hover:bg-secondary hover:text-foreground"
                    >
                      {copiedId === req.id ? <Check className="h-3.5 w-3.5 text-primary" /> : <Copy className="h-3.5 w-3.5" />}
                    </button>
                  )}
                </motion.div>
              );
            })}
            {requests.length === 0 && (
              <div className="rounded-xl border border-border bg-card p-8 text-center">
                <p className="text-sm text-muted-foreground">No payment requests yet.</p>
              </div>
            )}
          </div>
        )}
      </div>
      <Footer />
    </div>
  );
}
