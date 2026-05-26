import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import { Calendar, Clock, DollarSign, RefreshCw, Pause, Play, Trash2, ArrowLeft, Mail, User } from "lucide-react";
import { Link } from "react-router-dom";
import { useApp } from "@/contexts/AppContext";
import AppHeader from "@/components/AppHeader";
import Footer from "@/components/Footer";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";

const FREQUENCY_LABELS: Record<string, string> = {
  weekly: "Weekly",
  biweekly: "Bi-weekly",
  monthly: "Monthly",
  quarterly: "Quarterly",
};

interface Subscription {
  id: string;
  payment_link_id: string;
  payer_email: string;
  amount: number;
  token: string;
  frequency: string;
  status: "active" | "paused" | "cancelled" | "completed";
  next_payment_date: string;
  last_payment_date: string | null;
  occurrences_completed: number;
  max_occurrences: number | null;
  memo: string | null;
  link_title?: string;
  created_at: string;
}

export default function RecurringPaymentsPage() {
  const { isLoggedIn, login } = useApp();
  const [subscriptions, setSubscriptions] = useState<Subscription[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!isLoggedIn) return;
    loadSubscriptions();
  }, [isLoggedIn]);

  const loadSubscriptions = async () => {
    setLoading(true);
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) { setLoading(false); return; }

    const { data: links } = await supabase
      .from("payment_links")
      .select("id")
      .eq("user_id", user.id);

    const linkIds = links?.map(l => l.id) || [];
    if (linkIds.length === 0) {
      setSubscriptions([]);
      setLoading(false);
      return;
    }

    const { data } = await supabase
      .from("user_subscriptions")
      .select("*, payment_links!inner(title)")
      .in("payment_link_id", linkIds)
      .order("created_at", { ascending: false });

    if (data) {
      setSubscriptions(data.map((s: any) => ({
        id: s.id,
        payment_link_id: s.payment_link_id,
        payer_email: s.payer_email,
        amount: s.amount,
        token: s.token,
        frequency: s.frequency,
        status: s.status,
        next_payment_date: s.next_payment_date,
        last_payment_date: s.last_payment_date,
        occurrences_completed: s.occurrences_completed,
        max_occurrences: s.max_occurrences,
        memo: s.memo,
        link_title: s.payment_links?.title,
        created_at: s.created_at,
      })));
    }
    setLoading(false);
  };

  const updateStatus = async (id: string, newStatus: string) => {
    const { error } = await supabase
      .from("user_subscriptions")
      .update({ status: newStatus })
      .eq("id", id);
    if (error) { toast.error("Failed to update"); return; }
    toast.success(`Subscription ${newStatus}`);
    loadSubscriptions();
  };

  const deleteSubscription = async (id: string) => {
    const { error } = await supabase
      .from("user_subscriptions")
      .update({ status: "cancelled" })
      .eq("id", id);
    if (error) { toast.error("Failed to cancel"); return; }
    toast.success("Subscription cancelled");
    loadSubscriptions();
  };

  const formatDate = (dateStr: string) => {
    return new Date(dateStr).toLocaleDateString("en-US", {
      month: "short", day: "numeric", year: "numeric",
    });
  };

  if (!isLoggedIn) {
    return (
      <div className="min-h-screen bg-background">
        <AppHeader />
        <div className="flex min-h-[80vh] flex-col items-center justify-center px-4 text-center">
          <div className="mb-6 flex h-20 w-20 items-center justify-center rounded-full bg-primary/10">
            <RefreshCw className="h-10 w-10 text-primary" />
          </div>
          <h2 className="mb-3 font-display text-2xl text-foreground sm:text-3xl">Subscriptions</h2>
          <p className="mb-6 max-w-md text-sm text-muted-foreground">
            Manage subscriptions to your payment links. See who's subscribed and when payments are due.
          </p>
          <button onClick={login} className="rounded-lg bg-primary px-6 py-3 font-semibold text-primary-foreground shadow-glow hover:opacity-90">
            Sign In to Get Started
          </button>
        </div>
        <Footer />
      </div>
    );
  }

  const activeSubs = subscriptions.filter(s => s.status === "active" || s.status === "paused");
  const totalMonthly = subscriptions
    .filter(s => s.status === "active")
    .reduce((sum, s) => {
      if (s.frequency === "weekly") return sum + s.amount * 4.33;
      if (s.frequency === "biweekly") return sum + s.amount * 2.17;
      if (s.frequency === "monthly") return sum + s.amount;
      if (s.frequency === "quarterly") return sum + s.amount / 3;
      return sum;
    }, 0);

  return (
    <div className="min-h-screen bg-background">
      <AppHeader />
      <div className="container mx-auto max-w-5xl px-4 pt-20 pb-12 sm:pt-24 sm:pb-16">
        <Link to="/dashboard" className="mb-4 inline-flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground transition-colors">
          <ArrowLeft className="h-4 w-4" /> Back to Dashboard
        </Link>

        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="mb-8">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="flex h-12 w-12 items-center justify-center rounded-full bg-primary/10">
                <RefreshCw className="h-6 w-6 text-primary" />
              </div>
              <div>
                <h1 className="font-display text-3xl text-foreground sm:text-4xl">Subscriptions</h1>
                <p className="text-muted-foreground">Recurring payments from your payment links</p>
              </div>
            </div>
          </div>
        </motion.div>

        {/* Stats cards */}
        <div className="mb-8 grid grid-cols-1 gap-4 sm:grid-cols-3">
          <div className="rounded-xl border border-border bg-card p-4">
            <p className="text-xs text-muted-foreground">Active Subscriptions</p>
            <p className="mt-1 text-2xl font-bold text-foreground">{activeSubs.length}</p>
          </div>
          <div className="rounded-xl border border-border bg-card p-4">
            <p className="text-xs text-muted-foreground">Est. Monthly Revenue</p>
            <p className="mt-1 text-2xl font-bold text-foreground">${totalMonthly.toFixed(2)}</p>
          </div>
          <div className="rounded-xl border border-border bg-card p-4">
            <p className="text-xs text-muted-foreground">Total Subscribers</p>
            <p className="mt-1 text-2xl font-bold text-foreground">{subscriptions.length}</p>
          </div>
        </div>

        {loading ? (
          <div className="flex justify-center py-12">
            <RefreshCw className="h-6 w-6 animate-spin text-muted-foreground" />
          </div>
        ) : subscriptions.length === 0 ? (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }}
            className="rounded-xl border border-border bg-card p-12 text-center"
          >
            <RefreshCw className="mx-auto mb-4 h-12 w-12 text-muted-foreground/50" />
            <h3 className="mb-2 font-display text-lg text-foreground">No subscriptions yet</h3>
            <p className="mb-6 text-sm text-muted-foreground">
              Create a recurring payment link from your profile to start getting subscribers.
            </p>
            <Link
              to="/profile"
              className="inline-block rounded-lg bg-primary px-6 py-2.5 text-sm font-semibold text-primary-foreground shadow-glow transition-opacity hover:opacity-90"
            >
              Go to Profile
            </Link>
          </motion.div>
        ) : (
          <div className="space-y-4">
            {subscriptions.map((sub, index) => (
              <motion.div
                key={sub.id}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: index * 0.05 }}
                className="rounded-xl border border-border bg-card p-5"
              >
                <div className="flex items-start justify-between">
                  <div className="flex items-start gap-4">
                    <div className={`flex h-10 w-10 items-center justify-center rounded-full ${
                      sub.status === "active" ? "bg-primary/10 text-primary" :
                      sub.status === "paused" ? "bg-yellow-500/10 text-yellow-500" :
                      "bg-muted text-muted-foreground"
                    }`}>
                      <User className="h-5 w-5" />
                    </div>
                    <div className="min-w-0">
                      <div className="flex items-center gap-2">
                        <p className="truncate font-medium text-foreground">
                          {sub.link_title || "Payment Link"}
                        </p>
                        <span className={`shrink-0 rounded-full px-2 py-0.5 text-xs font-medium ${
                          sub.status === "active" ? "bg-primary/10 text-primary" :
                          sub.status === "paused" ? "bg-yellow-500/10 text-yellow-500" :
                          "bg-muted text-muted-foreground"
                        }`}>
                          {sub.status}
                        </span>
                      </div>
                      <p className="mt-0.5 flex items-center gap-1 text-xs text-muted-foreground">
                        <Mail className="h-3 w-3" /> {sub.payer_email}
                      </p>
                      <p className="mt-1 text-2xl font-bold text-foreground">
                        ${sub.amount.toFixed(2)} <span className="text-sm font-normal text-muted-foreground">{sub.token}</span>
                      </p>
                      <div className="mt-2 flex flex-wrap items-center gap-3 text-xs text-muted-foreground">
                        <span className="flex items-center gap-1">
                          <Clock className="h-3 w-3" />
                          {FREQUENCY_LABELS[sub.frequency] || sub.frequency}
                        </span>
                        <span className="flex items-center gap-1">
                          <Calendar className="h-3 w-3" />
                          Next: {formatDate(sub.next_payment_date)}
                        </span>
                        {sub.occurrences_completed > 0 && (
                          <span>{sub.occurrences_completed} completed</span>
                        )}
                      </div>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    {(sub.status === "active" || sub.status === "paused") && (
                      <button
                        onClick={() => updateStatus(sub.id, sub.status === "active" ? "paused" : "active")}
                        className={`rounded-lg p-2 transition-colors ${
                          sub.status === "paused"
                            ? "text-green-500 hover:bg-green-500/10"
                            : "text-yellow-500 hover:bg-yellow-500/10"
                        }`}
                        title={sub.status === "active" ? "Pause" : "Resume"}
                      >
                        {sub.status === "active" ? <Pause className="h-4 w-4" /> : <Play className="h-4 w-4" />}
                      </button>
                    )}
                    {sub.status !== "cancelled" && (
                      <button
                        onClick={() => deleteSubscription(sub.id)}
                        className="rounded-lg p-2 text-muted-foreground transition-colors hover:bg-destructive/10 hover:text-destructive"
                        title="Cancel"
                      >
                        <Trash2 className="h-4 w-4" />
                      </button>
                    )}
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
