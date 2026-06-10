/** SubscriptionsPage - Recurring payment subscriptions with Supabase persistence, create, pause, resume, and cancel */
import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  RefreshCw,
  Plus,
  CreditCard,
  Calendar,
  Loader2,
  Check,
  X,
  Trash2,
  Clock,
  AlertCircle,
  ExternalLink,
} from "lucide-react";
import { useApp } from "@/contexts/AppContext";
import AppHeader from "@/components/AppHeader";
import Footer from "@/components/Footer";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { CURRENCY_SYMBOLS, formatCurrency } from "@/services/flutterwaveService";

interface Subscription {
  id: string;
  name: string;
  description: string;
  amount: number;
  currency: string;
  frequency: "daily" | "weekly" | "monthly" | "yearly";
  next_payment: string;
  status: "active" | "paused" | "cancelled";
  merchant_name?: string;
  created_at: string;
}

interface CreateSubscriptionForm {
  name: string;
  description: string;
  amount: string;
  currency: string;
  frequency: "daily" | "weekly" | "monthly" | "yearly";
  startDate: string;
}

/** SubscriptionsPage component - Manages DB-backed subscriptions with create modal, status toggles, and aggregate totals */
export default function SubscriptionsPage() {
  const { isLoggedIn, login, walletAddress } = useApp();
  const [subscriptions, setSubscriptions] = useState<Subscription[]>([]);
  const [loading, setLoading] = useState(true);
  const [showCreate, setShowCreate] = useState(false);
  const [creating, setCreating] = useState(false);
  const [form, setForm] = useState<CreateSubscriptionForm>({
    name: "",
    description: "",
    amount: "",
    currency: "USDC",
    frequency: "monthly",
    startDate: new Date().toISOString().split("T")[0],
  });

  useEffect(() => {
    if (isLoggedIn && walletAddress) {
      fetchSubscriptions();
    }
  }, [isLoggedIn, walletAddress]);

  const fetchSubscriptions = async () => {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return;

    try {
      const { data } = await supabase
        .from("subscriptions")
        .select("*")
        .eq("user_id", user.id)
        .order("created_at", { ascending: false });

      setSubscriptions(
        (data || []).map((s: any) => ({
          ...s,
          next_payment: s.next_payment || addDays(new Date(), 30).toISOString(),
        }))
      );
    } catch (error) {
      console.error("Failed to fetch subscriptions:", error);
    } finally {
      setLoading(false);
    }
  };

  const addDays = (date: Date, days: number): Date => {
    const result = new Date(date);
    result.setDate(result.getDate() + days);
    return result;
  };

  const handleCreate = async () => {
    if (!form.name || !form.amount || parseFloat(form.amount) <= 0) {
      toast.error("Please fill all required fields");
      return;
    }

    setCreating(true);
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      let nextPayment = new Date(form.startDate);
      if (form.frequency === "daily") nextPayment = addDays(new Date(), 1);
      else if (form.frequency === "weekly") nextPayment = addDays(new Date(), 7);
      else if (form.frequency === "monthly") nextPayment = addDays(new Date(), 30);
      else if (form.frequency === "yearly") nextPayment = addDays(new Date(), 365);

      const { error } = await supabase.from("subscriptions").insert({
        user_id: user.id,
        name: form.name,
        description: form.description,
        amount: parseFloat(form.amount),
        currency: form.currency,
        frequency: form.frequency,
        next_payment: nextPayment.toISOString(),
        status: "active",
      });

      if (error) throw error;

      toast.success("Subscription created!");
      setShowCreate(false);
      setForm({
        name: "",
        description: "",
        amount: "",
        currency: "USDC",
        frequency: "monthly",
        startDate: new Date().toISOString().split("T")[0],
      });
      fetchSubscriptions();
    } catch (error) {
      toast.error("Failed to create subscription");
    } finally {
      setCreating(false);
    }
  };

  const handleCancel = async (id: string) => {
    if (!confirm("Are you sure you want to cancel this subscription?")) return;

    try {
      await supabase.from("subscriptions").update({ status: "cancelled" }).eq("id", id);
      toast.success("Subscription cancelled");
      fetchSubscriptions();
    } catch (error) {
      toast.error("Failed to cancel subscription");
    }
  };

  const handlePause = async (id: string) => {
    try {
      await supabase.from("subscriptions").update({ status: "paused" }).eq("id", id);
      toast.success("Subscription paused");
      fetchSubscriptions();
    } catch (error) {
      toast.error("Failed to pause subscription");
    }
  };

  const handleResume = async (id: string) => {
    try {
      await supabase.from("subscriptions").update({ status: "active" }).eq("id", id);
      toast.success("Subscription resumed");
      fetchSubscriptions();
    } catch (error) {
      toast.error("Failed to resume subscription");
    }
  };

  const getFrequencyLabel = (freq: string) => {
    const labels: Record<string, string> = {
      daily: "Daily",
      weekly: "Weekly",
      monthly: "Monthly",
      yearly: "Yearly",
    };
    return labels[freq] || freq;
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case "active":
        return "bg-green-500/10 text-green-500";
      case "paused":
        return "bg-yellow-500/10 text-yellow-500";
      case "cancelled":
        return "bg-red-500/10 text-red-500";
      default:
        return "bg-gray-500/10 text-gray-500";
    }
  };

  const activeSubscriptions = subscriptions.filter((s) => s.status === "active");
  const totalMonthly = activeSubscriptions
    .filter((s) => s.frequency === "monthly")
    .reduce((sum, s) => sum + s.amount, 0);
  const totalYearly = activeSubscriptions
    .filter((s) => s.frequency === "yearly")
    .reduce((sum, s) => sum + s.amount, 0);

  if (!isLoggedIn) {
    return (
      <div className="min-h-screen bg-background">
        <AppHeader />
        <div className="flex min-h-[80vh] flex-col items-center justify-center px-4 text-center">
          <div className="mb-6 flex h-20 w-20 items-center justify-center rounded-full bg-primary/10">
            <RefreshCw className="h-10 w-10 text-primary" />
          </div>
          <h2 className="mb-3 font-display text-2xl text-foreground sm:text-3xl">
            Subscriptions
          </h2>
          <p className="mb-6 max-w-md text-sm text-muted-foreground">
            Manage your recurring payments and subscriptions
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
        <div className="mb-8 flex items-center justify-between">
          <div>
            <h1 className="font-display text-2xl text-foreground sm:text-3xl">Subscriptions</h1>
            <p className="mt-1 text-sm text-muted-foreground">
              Manage your recurring USDC payments
            </p>
          </div>
          <button
            onClick={() => setShowCreate(true)}
            className="flex items-center gap-2 rounded-lg bg-primary px-4 py-2 text-sm font-medium text-primary-foreground"
          >
            <Plus className="h-4 w-4" />
            New Subscription
          </button>
        </div>

        <div className="mb-6 grid gap-4 sm:grid-cols-3">
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            className="rounded-xl border border-border bg-card p-5"
          >
            <div className="mb-2 flex h-10 w-10 items-center justify-center rounded-lg bg-green-500/10">
              <Check className="h-5 w-5 text-green-500" />
            </div>
            <p className="text-2xl font-bold text-foreground">{activeSubscriptions.length}</p>
            <p className="text-sm text-muted-foreground">Active Subscriptions</p>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
            className="rounded-xl border border-border bg-card p-5"
          >
            <div className="mb-2 flex h-10 w-10 items-center justify-center rounded-lg bg-primary/10">
              <RefreshCw className="h-5 w-5 text-primary" />
            </div>
            <p className="text-2xl font-bold text-foreground">{totalMonthly} USDC</p>
            <p className="text-sm text-muted-foreground">Monthly Total</p>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
            className="rounded-xl border border-border bg-card p-5"
          >
            <div className="mb-2 flex h-10 w-10 items-center justify-center rounded-lg bg-yellow-500/10">
              <Calendar className="h-5 w-5 text-yellow-500" />
            </div>
            <p className="text-2xl font-bold text-foreground">{totalYearly} USDC</p>
            <p className="text-sm text-muted-foreground">Yearly Total</p>
          </motion.div>
        </div>

        {loading ? (
          <div className="flex items-center justify-center py-12">
            <Loader2 className="h-8 w-8 animate-spin text-primary" />
          </div>
        ) : subscriptions.length === 0 ? (
          <div className="rounded-xl border border-border bg-card p-12 text-center">
            <RefreshCw className="mx-auto mb-4 h-12 w-12 text-muted-foreground" />
            <h3 className="mb-2 text-lg font-medium text-foreground">No subscriptions yet</h3>
            <p className="mb-6 text-sm text-muted-foreground">
              Create your first subscription to automate recurring payments
            </p>
            <button
              onClick={() => setShowCreate(true)}
              className="rounded-lg bg-primary px-6 py-2 text-sm font-medium text-primary-foreground"
            >
              Create Subscription
            </button>
          </div>
        ) : (
          <div className="space-y-4">
            {subscriptions.map((sub) => (
              <motion.div
                key={sub.id}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                className="rounded-xl border border-border bg-card p-5"
              >
                <div className="flex items-start justify-between">
                  <div className="flex items-start gap-4">
                    <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-primary/10">
                      <RefreshCw className="h-6 w-6 text-primary" />
                    </div>
                    <div>
                      <div className="flex items-center gap-2">
                        <h3 className="font-semibold text-foreground">{sub.name}</h3>
                        <span
                          className={`rounded-full px-2 py-0.5 text-xs font-medium capitalize ${getStatusColor(
                            sub.status
                          )}`}
                        >
                          {sub.status}
                        </span>
                      </div>
                      {sub.description && (
                        <p className="mt-1 text-sm text-muted-foreground">{sub.description}</p>
                      )}
                      <div className="mt-2 flex items-center gap-4 text-sm text-muted-foreground">
                        <span className="flex items-center gap-1">
                          <RefreshCw className="h-3 w-3" />
                          {getFrequencyLabel(sub.frequency)}
                        </span>
                        {sub.status === "active" && (
                          <span className="flex items-center gap-1">
                            <Clock className="h-3 w-3" />
                            Next: {new Date(sub.next_payment).toLocaleDateString()}
                          </span>
                        )}
                      </div>
                    </div>
                  </div>
                  <div className="text-right">
                    <p className="text-xl font-bold text-foreground">
                      {sub.amount} {sub.currency}
                    </p>
                    <span className="text-sm text-muted-foreground">
                      {getFrequencyLabel(sub.frequency).toLowerCase()}
                    </span>
                  </div>
                </div>

                {sub.status !== "cancelled" && (
                  <div className="mt-4 flex items-center gap-2 border-t border-border pt-4">
                    {sub.status === "active" ? (
                      <button
                        onClick={() => handlePause(sub.id)}
                        className="flex items-center gap-1 rounded-lg bg-yellow-500/10 px-3 py-1.5 text-sm font-medium text-yellow-500 hover:bg-yellow-500/20"
                      >
                        <AlertCircle className="h-4 w-4" />
                        Pause
                      </button>
                    ) : (
                      <button
                        onClick={() => handleResume(sub.id)}
                        className="flex items-center gap-1 rounded-lg bg-green-500/10 px-3 py-1.5 text-sm font-medium text-green-500 hover:bg-green-500/20"
                      >
                        <Check className="h-4 w-4" />
                        Resume
                      </button>
                    )}
                    <button
                      onClick={() => handleCancel(sub.id)}
                      className="flex items-center gap-1 rounded-lg bg-red-500/10 px-3 py-1.5 text-sm font-medium text-red-500 hover:bg-red-500/20"
                    >
                      <X className="h-4 w-4" />
                      Cancel
                    </button>
                  </div>
                )}
              </motion.div>
            ))}
          </div>
        )}
      </div>

      <AnimatePresence>
        {showCreate && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4"
          >
            <motion.div
              initial={{ scale: 0.95, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.95, opacity: 0 }}
              className="w-full max-w-md rounded-xl border border-border bg-card p-6"
            >
              <div className="mb-4 flex items-center justify-between">
                <h3 className="text-lg font-semibold">New Subscription</h3>
                <button onClick={() => setShowCreate(false)} className="rounded-lg p-1 hover:bg-muted">
                  <X className="h-5 w-5" />
                </button>
              </div>

              <div className="space-y-4">
                <div>
                  <label className="mb-2 block text-sm font-medium">Subscription Name *</label>
                  <input
                    type="text"
                    value={form.name}
                    onChange={(e) => setForm({ ...form, name: e.target.value })}
                    placeholder="e.g., Netflix, Spotify, Gym"
                    className="w-full rounded-lg border border-border bg-background px-4 py-3"
                  />
                </div>

                <div>
                  <label className="mb-2 block text-sm font-medium">Description</label>
                  <input
                    type="text"
                    value={form.description}
                    onChange={(e) => setForm({ ...form, description: e.target.value })}
                    placeholder="Optional description"
                    className="w-full rounded-lg border border-border bg-background px-4 py-3"
                  />
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="mb-2 block text-sm font-medium">Amount (USDC) *</label>
                    <input
                      type="number"
                      value={form.amount}
                      onChange={(e) => setForm({ ...form, amount: e.target.value })}
                      placeholder="10.00"
                      className="w-full rounded-lg border border-border bg-background px-4 py-3"
                    />
                  </div>
                  <div>
                    <label className="mb-2 block text-sm font-medium">Frequency</label>
                    <select
                      value={form.frequency}
                      onChange={(e) =>
                        setForm({ ...form, frequency: e.target.value as any })
                      }
                      className="w-full rounded-lg border border-border bg-background px-4 py-3"
                    >
                      <option value="daily">Daily</option>
                      <option value="weekly">Weekly</option>
                      <option value="monthly">Monthly</option>
                      <option value="yearly">Yearly</option>
                    </select>
                  </div>
                </div>

                <div>
                  <label className="mb-2 block text-sm font-medium">Start Date</label>
                  <input
                    type="date"
                    value={form.startDate}
                    onChange={(e) => setForm({ ...form, startDate: e.target.value })}
                    className="w-full rounded-lg border border-border bg-background px-4 py-3"
                  />
                </div>

                <button
                  onClick={handleCreate}
                  disabled={creating}
                  className="flex w-full items-center justify-center gap-2 rounded-lg bg-primary py-3 font-semibold text-primary-foreground disabled:opacity-50"
                >
                  {creating ? <Loader2 className="h-5 w-5 animate-spin" /> : "Create Subscription"}
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      <Footer />
    </div>
  );
}
