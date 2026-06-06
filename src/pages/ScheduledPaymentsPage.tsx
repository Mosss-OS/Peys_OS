/** ScheduledPaymentsPage - Automated recurring payment scheduling with pause/resume and execution history */
import { useState } from "react";
import { motion } from "framer-motion";
import { Clock, Calendar, Repeat, DollarSign, Play, Pause, Edit, Trash2, AlertCircle, Check, Loader2, Bell, ChevronRight } from "lucide-react";
import { useApp } from "@/contexts/AppContext";
import AppHeader from "@/components/AppHeader";
import Footer from "@/components/Footer";
import { toast } from "sonner";

interface ScheduledPayment {
  id: string;
  recipient: string;
  amount: number;
  token: string;
  frequency: "daily" | "weekly" | "monthly";
  nextExecution: string;
  status: "active" | "paused" | "completed";
  lastExecuted?: string;
  description?: string;
}

/** ScheduledPaymentsPage component - Manages scheduled/recurring payments with create, toggle status, cancel, and history tracking */
export default function ScheduledPaymentsPage() {
  const { isLoggedIn, login } = useApp();
  const [showCreate, setShowCreate] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [formData, setFormData] = useState({
    recipient: "",
    amount: "",
    frequency: "monthly" as ScheduledPayment["frequency"],
    description: "",
  });

  const scheduledPayments: ScheduledPayment[] = [
    { id: "1", recipient: "0x1234...5678", amount: 100, token: "USDC", frequency: "monthly", nextExecution: "2026-04-01", status: "active", lastExecuted: "2026-03-01", description: "Rent payment" },
    { id: "2", recipient: "0xabcd...efgh", amount: 25, token: "USDC", frequency: "weekly", nextExecution: "2026-03-25", status: "active", lastExecuted: "2026-03-18", description: "Groceries allowance" },
    { id: "3", recipient: "0x9876...ijkl", amount: 50, token: "USDC", frequency: "monthly", nextExecution: "2026-04-15", status: "paused", lastExecuted: "2026-02-15" },
    { id: "4", recipient: "0xmoses...mnop", amount: 500, token: "USDC", frequency: "monthly", nextExecution: "2026-03-20", status: "completed", lastExecuted: "2026-03-01", description: "Investment" },
  ];

  const history = [
    { id: "1", recipient: "0x1234...5678", amount: 100, date: "2026-03-01", status: "completed" },
    { id: "2", recipient: "0xabcd...efgh", amount: 25, date: "2026-03-18", status: "completed" },
    { id: "3", recipient: "0xabcd...efgh", amount: 25, date: "2026-03-11", status: "completed" },
    { id: "4", recipient: "0x1234...5678", amount: 100, date: "2026-02-01", status: "completed" },
  ];

  const validateForm = () => {
    if (!formData.recipient || formData.recipient.trim().length === 0) {
      toast.error("Recipient address is required");
      return false;
    }
    const walletRegex = /^0x[a-fA-F0-9]{40}$/;
    if (!walletRegex.test(formData.recipient)) {
      toast.error("Please enter a valid Ethereum wallet address");
      return false;
    }
    if (!formData.amount || isNaN(parseFloat(formData.amount)) || parseFloat(formData.amount) <= 0) {
      toast.error("Please enter a valid amount greater than 0");
      return false;
    }
    const amount = parseFloat(formData.amount);
    if (amount > 1000000) {
      toast.error("Amount exceeds maximum limit of 1,000,000");
      return false;
    }
    return true;
  };

  const handleCreate = async () => {
    if (!validateForm()) {
      return;
    }
    setSubmitting(true);
    setSubmitting(false);
    setShowCreate(false);
    setFormData({ recipient: "", amount: "", frequency: "monthly", description: "" });
    toast.success("Scheduled payment created!");
  };

  const handleToggleStatus = (id: string, currentStatus: string) => {
    const newStatus = currentStatus === "active" ? "paused" : "active";
    toast.success(`Payment ${newStatus === "active" ? "resumed" : "paused"}`);
  };

  const handleCancel = (id: string) => {
    toast.success("Scheduled payment cancelled");
  };

  if (!isLoggedIn) {
    return (
      <div className="min-h-screen bg-background">
        <AppHeader />
        <div className="flex min-h-[80vh] flex-col items-center justify-center px-4 text-center">
          <div className="mb-6 flex h-20 w-20 items-center justify-center rounded-full bg-primary/10">
            <Clock className="h-10 w-10 text-primary" />
          </div>
          <h2 className="mb-3 font-display text-2xl text-foreground sm:text-3xl">Scheduled Payments</h2>
          <p className="mb-6 max-w-md text-sm text-muted-foreground">
            Set up recurring payments to automate your regular transfers.
          </p>
          <button onClick={login} className="rounded-lg bg-primary px-6 py-3 font-semibold text-primary-foreground shadow-glow hover:opacity-90">
            Sign In to Manage Schedules
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
            <h1 className="font-display text-2xl text-foreground sm:text-3xl">Scheduled Payments</h1>
            <p className="mt-1 text-sm text-muted-foreground">Automate your recurring payments</p>
          </div>
          <button
            onClick={() => setShowCreate(true)}
            className="flex items-center gap-2 rounded-lg bg-primary px-4 py-2 text-sm font-semibold text-primary-foreground shadow-glow hover:opacity-90"
          >
            <Repeat className="h-4 w-4" />
            New Schedule
          </button>
        </div>

        {showCreate && (
          <motion.div
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            className="mb-6 rounded-xl border border-border bg-card p-6"
          >
            <h3 className="mb-4 font-semibold text-foreground">Create Scheduled Payment</h3>
            <div className="grid gap-4 sm:grid-cols-2">
              <div>
                <label className="mb-2 block text-sm font-medium text-muted-foreground">Recipient Address *</label>
                <input
                  type="text"
                  value={formData.recipient}
                  onChange={(e) => setFormData({ ...formData, recipient: e.target.value })}
                  placeholder="0x..."
                  className="w-full rounded-lg border border-border bg-background px-4 py-2.5 font-mono text-sm text-foreground placeholder:text-muted-foreground focus:border-primary focus:outline-none"
                />
              </div>
              <div>
                <label className="mb-2 block text-sm font-medium text-muted-foreground">Amount *</label>
                <input
                  type="number"
                  value={formData.amount}
                  onChange={(e) => setFormData({ ...formData, amount: e.target.value })}
                  placeholder="100"
                  className="w-full rounded-lg border border-border bg-background px-4 py-2.5 text-sm text-foreground placeholder:text-muted-foreground focus:border-primary focus:outline-none"
                />
              </div>
              <div>
                <label className="mb-2 block text-sm font-medium text-muted-foreground">Frequency</label>
                <select
                  value={formData.frequency}
                  onChange={(e) => setFormData({ ...formData, frequency: e.target.value as ScheduledPayment["frequency"] })}
                  className="w-full rounded-lg border border-border bg-background px-4 py-2.5 text-sm text-foreground focus:border-primary focus:outline-none"
                >
                  <option value="daily">Daily</option>
                  <option value="weekly">Weekly</option>
                  <option value="monthly">Monthly</option>
                </select>
              </div>
              <div>
                <label className="mb-2 block text-sm font-medium text-muted-foreground">Description (optional)</label>
                <input
                  type="text"
                  value={formData.description}
                  onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                  placeholder="e.g., Rent payment"
                  className="w-full rounded-lg border border-border bg-background px-4 py-2.5 text-sm text-foreground placeholder:text-muted-foreground focus:border-primary focus:outline-none"
                />
              </div>
            </div>
            <div className="mt-4 flex gap-3">
              <button
                onClick={() => setShowCreate(false)}
                className="flex-1 rounded-lg border border-border px-4 py-2 font-medium hover:bg-secondary"
              >
                Cancel
              </button>
              <button
                onClick={handleCreate}
                disabled={submitting}
                className="flex-1 rounded-lg bg-primary px-4 py-2 font-semibold text-primary-foreground hover:opacity-90 disabled:opacity-50"
              >
                {submitting ? <Loader2 className="mx-auto h-5 w-5 animate-spin" /> : "Create Schedule"}
              </button>
            </div>
          </motion.div>
        )}

        <div className="mb-6 grid gap-4 sm:grid-cols-3">
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            className="rounded-xl border border-border bg-card p-5"
          >
            <div className="mb-2 flex h-10 w-10 items-center justify-center rounded-lg bg-green-500/10">
              <Play className="h-5 w-5 text-green-500" />
            </div>
            <p className="text-2xl font-bold text-foreground">
              {scheduledPayments.filter(p => p.status === "active").length}
            </p>
            <p className="text-sm text-muted-foreground">Active Schedules</p>
          </motion.div>
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
            className="rounded-xl border border-border bg-card p-5"
          >
            <div className="mb-2 flex h-10 w-10 items-center justify-center rounded-lg bg-yellow-500/10">
              <Pause className="h-5 w-5 text-yellow-500" />
            </div>
            <p className="text-2xl font-bold text-foreground">
              {scheduledPayments.filter(p => p.status === "paused").length}
            </p>
            <p className="text-sm text-muted-foreground">Paused</p>
          </motion.div>
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.15 }}
            className="rounded-xl border border-border bg-card p-5"
          >
            <div className="mb-2 flex h-10 w-10 items-center justify-center rounded-lg bg-primary/10">
              <DollarSign className="h-5 w-5 text-primary" />
            </div>
            <p className="text-2xl font-bold text-foreground">
              ${scheduledPayments.reduce((sum, p) => sum + (p.status === "active" ? p.amount : 0), 0).toFixed(2)}
            </p>
            <p className="text-sm text-muted-foreground">Total Monthly</p>
          </motion.div>
        </div>

        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
          className="mb-6 space-y-3"
        >
          <h2 className="flex items-center gap-2 text-lg font-semibold text-foreground">
            <Calendar className="h-5 w-5 text-primary" />
            Active Schedules
          </h2>
          {scheduledPayments.map((payment) => (
            <div key={payment.id} className="rounded-xl border border-border bg-card p-5">
              <div className="flex items-start justify-between">
                <div className="flex items-start gap-4">
                  <div className={`flex h-12 w-12 items-center justify-center rounded-lg ${
                    payment.status === "active" ? "bg-green-500/10" :
                    payment.status === "paused" ? "bg-yellow-500/10" :
                    "bg-secondary"
                  }`}>
                    <Repeat className={`h-6 w-6 ${
                      payment.status === "active" ? "text-green-500" :
                      payment.status === "paused" ? "text-yellow-500" :
                      "text-muted-foreground"
                    }`} />
                  </div>
                  <div>
                    <p className="font-medium text-foreground">
                      ${payment.amount.toFixed(2)} {payment.token}
                    </p>
                    <p className="font-mono text-sm text-muted-foreground">{payment.recipient}</p>
                    {payment.description && (
                      <p className="mt-1 text-sm text-muted-foreground">{payment.description}</p>
                    )}
                    <div className="mt-2 flex items-center gap-4 text-xs text-muted-foreground">
                      <span className="flex items-center gap-1">
                        <Repeat className="h-3 w-3" />
                        {payment.frequency}
                      </span>
                      <span className="flex items-center gap-1">
                        <Clock className="h-3 w-3" />
                        Next: {new Date(payment.nextExecution).toLocaleDateString()}
                      </span>
                      {payment.lastExecuted && (
                        <span className="flex items-center gap-1">
                          <Check className="h-3 w-3" />
                          Last: {new Date(payment.lastExecuted).toLocaleDateString()}
                        </span>
                      )}
                    </div>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <span className={`rounded-full px-2 py-1 text-xs font-medium ${
                    payment.status === "active" ? "bg-green-500/10 text-green-600" :
                    payment.status === "paused" ? "bg-yellow-500/10 text-yellow-600" :
                    "bg-secondary text-muted-foreground"
                  }`}>
                    {payment.status}
                  </span>
                  {payment.status !== "completed" && (
                    <>
                      <button
                        onClick={() => handleToggleStatus(payment.id, payment.status)}
                        className="rounded-lg p-2 hover:bg-secondary"
                      >
                        {payment.status === "active" ? (
                          <Pause className="h-4 w-4 text-yellow-500" />
                        ) : (
                          <Play className="h-4 w-4 text-green-500" />
                        )}
                      </button>
                      <button
                        onClick={() => handleCancel(payment.id)}
                        className="rounded-lg p-2 hover:bg-secondary"
                      >
                        <Trash2 className="h-4 w-4 text-red-500" />
                      </button>
                    </>
                  )}
                </div>
              </div>
            </div>
          ))}
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3 }}
          className="rounded-xl border border-border bg-card p-6"
        >
          <h2 className="mb-4 flex items-center gap-2 text-lg font-semibold text-foreground">
            <Bell className="h-5 w-5 text-primary" />
            Execution History
          </h2>
          <div className="space-y-3">
            {history.map((tx) => (
              <div key={tx.id} className="flex items-center justify-between rounded-lg border border-border p-4">
                <div>
                  <p className="font-medium text-foreground">
                    ${tx.amount.toFixed(2)} - {tx.recipient}
                  </p>
                  <p className="text-xs text-muted-foreground">{new Date(tx.date).toLocaleDateString()}</p>
                </div>
                <span className="rounded-full bg-green-500/10 px-2 py-1 text-xs font-medium text-green-600">
                  {tx.status}
                </span>
              </div>
            ))}
          </div>
        </motion.div>
      </div>
      <Footer />
    </div>
  );
}
