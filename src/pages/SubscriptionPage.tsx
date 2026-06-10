/** SubscriptionPage - Recurring subscription management with create, pause/resume, cancel, and payment history */
import { useState, useEffect, useMemo } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { 
  Clock, Play, Pause, X, Edit2, Plus, Calendar, 
  CreditCard, Check, Loader2, ChevronDown, Trash2,
  RotateCcw, DollarSign 
} from "lucide-react";
import { Link } from "react-router-dom";
import { useApp } from "@/contexts/AppContext";
import AppHeader from "@/components/AppHeader";
import Footer from "@/components/Footer";
import { toast } from "sonner";

interface Subscription {
  id: string;
  name: string;
  merchant: string;
  amount: number;
  token: string;
  frequency: "daily" | "weekly" | "monthly" | "yearly";
  nextPayment: string;
  status: "active" | "paused" | "cancelled" | "expired";
  createdAt: string;
}

interface PaymentHistory {
  id: string;
  subscriptionId: string;
  amount: number;
  token: string;
  date: string;
  status: "completed" | "failed" | "pending";
}

const FREQUENCIES = [
  { id: "daily", label: "Daily", interval: 1, unit: "days" },
  { id: "weekly", label: "Weekly", interval: 7, unit: "days" },
  { id: "monthly", label: "Monthly", interval: 30, unit: "days" },
  { id: "yearly", label: "Yearly", interval: 365, unit: "days" },
];

/** SubscriptionPage component - Manages subscription lifecycle including creation, pausing, editing, and cancelling recurring payments */
export default function SubscriptionPage() {
  const { isLoggedIn, login } = useApp();
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<"active" | "history">("active");

  const [subscriptions, setSubscriptions] = useState<Subscription[]>([
    {
      id: "1",
      name: "Netflix Premium",
      merchant: "Netflix",
      amount: 15.99,
      token: "USDC",
      frequency: "monthly",
      nextPayment: "2026-04-01",
      status: "active",
      createdAt: "2026-01-01",
    },
    {
      id: "2",
      name: "Spotify Family",
      merchant: "Spotify",
      amount: 16.99,
      token: "USDC",
      frequency: "monthly",
      nextPayment: "2026-03-28",
      status: "active",
      createdAt: "2026-01-15",
    },
    {
      id: "3",
      name: "Cloud Storage",
      merchant: "Google Drive",
      amount: 9.99,
      token: "USDC",
      frequency: "monthly",
      nextPayment: "2026-04-10",
      status: "paused",
      createdAt: "2025-06-20",
    },
  ]);

  const [paymentHistory, setPaymentHistory] = useState<PaymentHistory[]>([
    { id: "1", subscriptionId: "1", amount: 15.99, token: "USDC", date: "2026-03-01", status: "completed" },
    { id: "2", subscriptionId: "2", amount: 16.99, token: "USDC", date: "2026-03-01", status: "completed" },
    { id: "3", subscriptionId: "1", amount: 15.99, token: "USDC", date: "2026-02-01", status: "completed" },
    { id: "4", subscriptionId: "2", amount: 16.99, token: "USDC", date: "2026-02-01", status: "completed" },
    { id: "5", subscriptionId: "3", amount: 9.99, token: "USDC", date: "2026-02-15", status: "completed" },
  ]);

  const [showCreateModal, setShowCreateModal] = useState(false);
  const [editingSubscription, setEditingSubscription] = useState<Subscription | null>(null);
  const [newSub, setNewSub] = useState({
    name: "",
    merchant: "",
    amount: "",
    token: "USDC",
    frequency: "monthly" as const,
    startDate: new Date().toISOString().split('T')[0],
  });
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    if (!isLoggedIn) return;
    setLoading(false);
  }, [isLoggedIn]);

  const totalMonthly = useMemo(() =>
    subscriptions
      .filter(s => s.status === "active")
      .reduce((sum, s) => sum + s.amount, 0),
    [subscriptions]
  );

  const activeCount = useMemo(() =>
    subscriptions.filter(s => s.status === "active").length,
    [subscriptions]
  );

  const createSubscription = async () => {
    if (!newSub.name || !newSub.amount) {
      toast.error("Please fill in all required fields");
      return;
    }

    setIsSubmitting(true);
    try {
      const frequency = FREQUENCIES.find(f => f.id === newSub.frequency) || FREQUENCIES[2];
      const nextPaymentDate = new Date();
      nextPaymentDate.setDate(nextPaymentDate.getDate() + frequency.interval);

      const subscription: Subscription = {
        id: crypto.randomUUID(),
        name: newSub.name,
        merchant: newSub.merchant || newSub.name,
        amount: parseFloat(newSub.amount),
        token: newSub.token,
        frequency: newSub.frequency,
        nextPayment: nextPaymentDate.toISOString().split('T')[0],
        status: "active",
        createdAt: new Date().toISOString().split('T')[0],
      };

      setSubscriptions(prev => [subscription, ...prev]);
      setNewSub({ name: "", merchant: "", amount: "", token: "USDC", frequency: "monthly", startDate: new Date().toISOString().split('T')[0] });
      setShowCreateModal(false);
      toast.success("Subscription created!");
    } finally {
      setIsSubmitting(false);
    }
  };

  const togglePause = (id: string) => {
    setSubscriptions(prev => prev.map(s => {
      if (s.id === id) {
        const newStatus = s.status === "active" ? "paused" : "active";
        toast.success(newStatus === "paused" ? "Subscription paused" : "Subscription resumed");
        return { ...s, status: newStatus };
      }
      return s;
    }));
  };

  const cancelSubscription = (id: string) => {
    setSubscriptions(prev => prev.map(s =>
      s.id === id ? { ...s, status: "cancelled" } : s
    ));
    toast.success("Subscription cancelled");
  };

  const updateAmount = (id: string, newAmount: number) => {
    setSubscriptions(prev => prev.map(s =>
      s.id === id ? { ...s, amount: newAmount } : s
    ));
    toast.success("Amount updated");
  };

  if (!isLoggedIn) {
    return (
      <div className="min-h-screen bg-background">
        <AppHeader />
        <div className="flex min-h-[80vh] flex-col items-center justify-center px-4 text-center">
          <div className="mb-6 flex h-20 w-20 items-center justify-center rounded-full bg-primary/10">
            <Clock className="h-10 w-10 text-primary" />
          </div>
          <h2 className="mb-3 font-display text-2xl text-foreground sm:text-3xl">Subscriptions</h2>
          <p className="mb-6 max-w-md text-sm text-muted-foreground">
            Manage recurring payments and subscription services
          </p>
          <button onClick={login} className="rounded-lg bg-primary px-6 py-3 font-semibold text-primary-foreground shadow-glow hover:opacity-90">
            Sign In to Manage Subscriptions
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
        <div className="mb-6 flex items-center justify-between">
          <div>
            <h1 className="font-display text-2xl text-foreground sm:text-3xl">Subscriptions</h1>
            <p className="mt-1 text-sm text-muted-foreground">
              ${totalMonthly.toFixed(2)} / month across {activeCount} active subscriptions
            </p>
          </div>
          <button
            onClick={() => setShowCreateModal(true)}
            className="flex items-center gap-2 rounded-lg bg-primary px-4 py-2 text-sm font-semibold text-primary-foreground shadow-glow hover:opacity-90"
          >
            <Plus className="h-4 w-4" />
            New
          </button>
        </div>

        {/* Tabs */}
        <div className="mb-6 flex gap-1 rounded-xl border border-border bg-card p-1">
          <button
            onClick={() => setActiveTab("active")}
            className={`flex-1 flex items-center justify-center gap-2 rounded-lg py-2.5 text-sm font-medium transition-colors ${
              activeTab === "active"
                ? "bg-primary text-primary-foreground"
                : "text-muted-foreground hover:text-foreground"
            }`}
          >
            <Clock className="h-4 w-4" />
            Active
            <span className="px-2 py-0.5 rounded-full text-xs bg-primary-foreground/20">
              {activeCount}
            </span>
          </button>
          <button
            onClick={() => setActiveTab("history")}
            className={`flex-1 flex items-center justify-center gap-2 rounded-lg py-2.5 text-sm font-medium transition-colors ${
              activeTab === "history"
                ? "bg-primary text-primary-foreground"
                : "text-muted-foreground hover:text-foreground"
            }`}
          >
            <Calendar className="h-4 w-4" />
            History
          </button>
        </div>

        {loading ? (
          <div className="flex justify-center py-12">
            <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
          </div>
        ) : (
          <>
            {/* Active Subscriptions */}
            {activeTab === "active" && (
              <div className="space-y-3">
                {subscriptions.length === 0 ? (
                  <div className="rounded-xl border border-border bg-card p-8 text-center">
                    <Clock className="mx-auto mb-3 h-8 w-8 text-muted-foreground" />
                    <p className="text-sm text-muted-foreground">No subscriptions yet</p>
                    <button
                      onClick={() => setShowCreateModal(true)}
                      className="mt-3 text-sm text-primary hover:underline"
                    >
                      Create your first subscription
                    </button>
                  </div>
                ) : (
                  subscriptions.map((sub) => (
                    <motion.div
                      key={sub.id}
                      initial={{ opacity: 0, y: 10 }}
                      animate={{ opacity: 1, y: 0 }}
                      className={`rounded-xl border p-4 ${
                        sub.status === "cancelled"
                          ? "border-border opacity-60"
                          : sub.status === "paused"
                          ? "border-yellow-500/30 bg-yellow-500/5"
                          : "border-border bg-card"
                      }`}
                    >
                      <div className="flex items-start justify-between">
                        <div className="flex-1">
                          <div className="flex items-center gap-2">
                            <h3 className="font-medium text-foreground">{sub.name}</h3>
                            {sub.status === "paused" && (
                              <span className="rounded-full bg-yellow-500/20 px-2 py-0.5 text-xs text-yellow-600">
                                Paused
                              </span>
                            )}
                            {sub.status === "cancelled" && (
                              <span className="rounded-full bg-red-500/20 px-2 py-0.5 text-xs text-red-600">
                                Cancelled
                              </span>
                            )}
                          </div>
                          <p className="text-xs text-muted-foreground">{sub.merchant}</p>
                          <p className="mt-1 text-xs text-muted-foreground">
                            Next payment: {new Date(sub.nextPayment).toLocaleDateString()}
                            • {FREQUENCIES.find(f => f.id === sub.frequency)?.label}
                          </p>
                        </div>
                        <div className="text-right">
                          <p className="font-bold text-foreground">
                            {sub.amount} {sub.token}
                          </p>
                          {sub.status !== "cancelled" && (
                            <div className="mt-2 flex gap-1">
                              <button
                                onClick={() => togglePause(sub.id)}
                                className="rounded-lg p-1.5 hover:bg-secondary transition-colors"
                                title={sub.status === "active" ? "Pause" : "Resume"}
                              >
                                {sub.status === "active" ? (
                                  <Pause className="h-4 w-4 text-yellow-600" />
                                ) : (
                                  <Play className="h-4 w-4 text-green-600" />
                                )}
                              </button>
                              <button
                                onClick={() => {
                                  setEditingSubscription(sub);
                                  setShowCreateModal(true);
                                }}
                                className="rounded-lg p-1.5 hover:bg-secondary transition-colors"
                                title="Edit"
                              >
                                <Edit2 className="h-4 w-4 text-muted-foreground" />
                              </button>
                              <button
                                onClick={() => cancelSubscription(sub.id)}
                                className="rounded-lg p-1.5 hover:bg-red-500/10 transition-colors"
                                title="Cancel"
                              >
                                <X className="h-4 w-4 text-red-500" />
                              </button>
                            </div>
                          )}
                        </div>
                      </div>
                    </motion.div>
                  ))
                )}
              </div>
            )}

            {/* Payment History */}
            {activeTab === "history" && (
              <div className="space-y-2">
                {paymentHistory.length === 0 ? (
                  <div className="rounded-xl border border-border bg-card p-8 text-center">
                    <Calendar className="mx-auto mb-3 h-8 w-8 text-muted-foreground" />
                    <p className="text-sm text-muted-foreground">No payment history yet</p>
                  </div>
                ) : (
                  paymentHistory.map((payment) => {
                    const sub = subscriptions.find(s => s.id === payment.subscriptionId);
                    return (
                      <motion.div
                        key={payment.id}
                        initial={{ opacity: 0, y: 10 }}
                        animate={{ opacity: 1, y: 0 }}
                        className="flex items-center justify-between rounded-lg border border-border bg-background p-3"
                      >
                        <div className="flex items-center gap-3">
                          <div className="flex h-8 w-8 items-center justify-center rounded-full bg-primary/10">
                            <Clock className="h-4 w-4 text-primary" />
                          </div>
                          <div>
                            <p className="text-sm font-medium text-foreground">
                              {sub?.name || "Unknown"}
                            </p>
                            <p className="text-xs text-muted-foreground">
                              {new Date(payment.date).toLocaleDateString()}
                            </p>
                          </div>
                        </div>
                        <div className="text-right">
                          <p className="text-sm font-medium text-foreground">
                            {payment.amount} {payment.token}
                          </p>
                          <span
                            className={`text-xs ${
                              payment.status === "completed" ? "text-green-600" : "text-red-600"
                            }`}
                          >
                            {payment.status}
                          </span>
                        </div>
                      </motion.div>
                    );
                  })
                )}
              </div>
            )}
          </>
        )}
      </div>
      <Footer />

      {/* Create/Edit Subscription Modal */}
      <AnimatePresence>
        {showCreateModal && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4"
            onClick={() => {
              setShowCreateModal(false);
              setEditingSubscription(null);
            }}
          >
            <motion.div
              initial={{ scale: 0.9 }}
              animate={{ scale: 1 }}
              exit={{ scale: 0.9 }}
              className="w-full max-w-sm rounded-2xl bg-card p-6"
              onClick={(e) => e.stopPropagation()}
            >
              <h3 className="mb-4 font-display text-lg text-foreground">
                {editingSubscription ? "Edit Subscription" : "Create Subscription"}
              </h3>
              <div className="space-y-3">
                <div>
                  <label className="mb-1.5 block text-xs font-medium text-muted-foreground">Name *</label>
                  <input
                    type="text"
                    value={editingSubscription?.name || newSub.name}
                    onChange={(e) => setNewSub({ ...newSub, name: e.target.value })}
                    placeholder="e.g., Netflix"
                    className="w-full rounded-lg border border-border bg-background px-3 py-2 text-sm text-foreground placeholder:text-muted-foreground/50 focus:outline-none focus:ring-2 focus:ring-ring"
                  />
                </div>
                <div>
                  <label className="mb-1.5 block text-xs font-medium text-muted-foreground">Merchant</label>
                  <input
                    type="text"
                    value={editingSubscription?.merchant || newSub.merchant}
                    onChange={(e) => setNewSub({ ...newSub, merchant: e.target.value })}
                    placeholder="Optional"
                    className="w-full rounded-lg border border-border bg-background px-3 py-2 text-sm text-foreground placeholder:text-muted-foreground/50 focus:outline-none focus:ring-2 focus:ring-ring"
                  />
                </div>
                <div className="grid grid-cols-2 gap-2">
                  <div>
                    <label className="mb-1.5 block text-xs font-medium text-muted-foreground">Amount *</label>
                    <input
                      type="number"
                      step="0.01"
                      value={editingSubscription?.amount || newSub.amount}
                      onChange={(e) => setNewSub({ ...newSub, amount: e.target.value })}
                      placeholder="0.00"
                      className="w-full rounded-lg border border-border bg-background px-3 py-2 text-sm text-foreground placeholder:text-muted-foreground/50 focus:outline-none focus:ring-2 focus:ring-ring"
                    />
                  </div>
                  <div>
                    <label className="mb-1.5 block text-xs font-medium text-muted-foreground">Token</label>
                    <select
                      value={newSub.token}
                      onChange={(e) => setNewSub({ ...newSub, token: e.target.value })}
                      className="w-full rounded-lg border border-border bg-background px-3 py-2 text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-ring"
                    >
                      <option value="USDC">USDC</option>
                      <option value="PASS">PASS</option>
                    </select>
                  </div>
                </div>
                <div>
                  <label className="mb-1.5 block text-xs font-medium text-muted-foreground">Frequency</label>
                  <select
                    value={newSub.frequency}
                    onChange={(e) => setNewSub({ ...newSub, frequency: e.target.value as "daily" | "weekly" | "monthly" | "yearly" })}
                    className="w-full rounded-lg border border-border bg-background px-3 py-2 text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-ring"
                  >
                    {FREQUENCIES.map(f => (
                      <option key={f.id} value={f.id}>{f.label}</option>
                    ))}
                  </select>
                </div>
                <button
                  onClick={createSubscription}
                  disabled={isSubmitting}
                  className="flex w-full items-center justify-center gap-2 rounded-lg bg-primary py-2.5 text-sm font-semibold text-primary-foreground shadow-glow hover:opacity-90 disabled:opacity-50"
                >
                  {isSubmitting ? (
                    <>
                      <Loader2 className="h-4 w-4 animate-spin" />
                      Creating...
                    </>
                  ) : (
                    <>
                      <Plus className="h-4 w-4" />
                      {editingSubscription ? "Update" : "Create"} Subscription
                    </>
                  )}
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
