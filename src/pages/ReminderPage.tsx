import { useState } from "react";
import { motion } from "framer-motion";
import { PiggyBank, Plus, AlertTriangle, TrendingUp, TrendingDown, Calendar, Trash2, Edit, Bell, ChevronDown, Check, History, Target, Loader2 } from "lucide-react";
import { useApp } from "@/contexts/AppContext";
import AppHeader from "@/components/AppHeader";
import Footer from "@/components/Footer";
import { toast } from "sonner";

interface Budget {
  id: string;
  category: string;
  limit: number;
  spent: number;
  period: "weekly" | "monthly" | "custom";
  alerts: boolean;
  resetDay: number;
}

interface SpendingAlert {
  id: string;
  message: string;
  amount: number;
  category: string;
  date: string;
}

export default function ReminderPage() {
  const { isLoggedIn, login } = useApp();
  const [budgets, setBudgets] = useState<Budget[]>([
    { id: "1", category: "Food & Dining", limit: 500, spent: 320, period: "monthly", alerts: true, resetDay: 1 },
    { id: "2", category: "Transport", limit: 200, spent: 150, period: "monthly", alerts: true, resetDay: 1 },
    { id: "3", category: "Entertainment", limit: 100, spent: 45, period: "monthly", alerts: false, resetDay: 1 },
    { id: "4", category: "Shopping", limit: 300, spent: 280, period: "monthly", alerts: true, resetDay: 1 },
    { id: "5", category: "Utilities", limit: 150, spent: 120, period: "monthly", alerts: false, resetDay: 1 },
  ]);
  const [showCreate, setShowCreate] = useState(false);
  const [newCategory, setNewCategory] = useState("");
  const [newLimit, setNewLimit] = useState("");
  const [showHistory, setShowHistory] = useState(false);

  const alerts: SpendingAlert[] = [
    { id: "1", message: "You've reached 80% of your Food budget", amount: 400, category: "Food & Dining", date: "2026-03-18" },
    { id: "2", message: "Transport spending up 20% this month", amount: 150, category: "Transport", date: "2026-03-17" },
    { id: "3", message: "Shopping budget nearly exceeded", amount: 280, category: "Shopping", date: "2026-03-15" },
  ];

  const history = [
    { month: "February 2026", totalBudget: 1250, totalSpent: 980, status: "under" },
    { month: "January 2026", totalBudget: 1250, totalSpent: 1340, status: "over" },
    { month: "December 2025", totalBudget: 1200, totalSpent: 890, status: "under" },
    { month: "November 2025", totalBudget: 1200, totalSpent: 1150, status: "under" },
  ];

  const totalBudget = budgets.reduce((sum, b) => sum + b.limit, 0);
  const totalSpent = budgets.reduce((sum, b) => sum + b.spent, 0);
  const overallProgress = (totalSpent / totalBudget) * 100;

  const handleCreateBudget = () => {
    if (!newCategory || !newLimit) {
      toast.error("Please fill in all fields");
      return;
    }
    const newBudget: Budget = {
      id: Date.now().toString(),
      category: newCategory,
      limit: parseFloat(newLimit),
      spent: 0,
      period: "monthly",
      alerts: true,
      resetDay: 1,
    };
    setBudgets([...budgets, newBudget]);
    setNewCategory("");
    setNewLimit("");
    setShowCreate(false);
    toast.success("Budget created successfully!");
  };

  const handleDeleteBudget = (id: string) => {
    setBudgets(budgets.filter(b => b.id !== id));
    toast.success("Budget deleted");
  };

  const toggleAlert = (id: string) => {
    setBudgets(budgets.map(b => b.id === id ? { ...b, alerts: !b.alerts } : b));
    toast.success("Alert settings updated");
  };

  if (!isLoggedIn) {
    return (
      <div className="min-h-screen bg-background">
        <AppHeader />
        <div className="flex min-h-[80vh] flex-col items-center justify-center px-4 text-center">
          <div className="mb-6 flex h-20 w-20 items-center justify-center rounded-full bg-primary/10">
            <PiggyBank className="h-10 w-10 text-primary" />
          </div>
          <h2 className="mb-3 font-display text-2xl text-foreground sm:text-3xl">Budget & Reminders</h2>
          <p className="mb-6 max-w-md text-sm text-muted-foreground">
            Set spending limits and get notified when you're approaching your budget.
          </p>
          <button onClick={login} className="rounded-lg bg-primary px-6 py-3 font-semibold text-primary-foreground shadow-glow hover:opacity-90">
            Sign In to Set Budget
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
            <h1 className="font-display text-2xl text-foreground sm:text-3xl">Budget & Reminders</h1>
            <p className="mt-1 text-sm text-muted-foreground">Track spending and stay within limits</p>
          </div>
          <button
            onClick={() => setShowCreate(true)}
            className="flex items-center gap-2 rounded-lg bg-primary px-4 py-2 text-sm font-semibold text-primary-foreground shadow-glow hover:opacity-90"
          >
            <Plus className="h-4 w-4" />
            Add Budget
          </button>
        </div>

        {showCreate && (
          <motion.div
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            className="mb-6 rounded-xl border border-border bg-card p-6"
          >
            <h3 className="mb-4 font-semibold text-foreground">Create New Budget</h3>
            <div className="grid gap-4 sm:grid-cols-2">
              <div>
                <label className="mb-2 block text-sm font-medium text-muted-foreground">Category</label>
                <input
                  type="text"
                  value={newCategory}
                  onChange={(e) => setNewCategory(e.target.value)}
                  placeholder="e.g., Groceries"
                  className="w-full rounded-lg border border-border bg-background px-4 py-2.5 text-sm text-foreground placeholder:text-muted-foreground focus:border-primary focus:outline-none"
                />
              </div>
              <div>
                <label className="mb-2 block text-sm font-medium text-muted-foreground">Monthly Limit ($)</label>
                <input
                  type="number"
                  value={newLimit}
                  onChange={(e) => setNewLimit(e.target.value)}
                  placeholder="500"
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
                onClick={handleCreateBudget}
                className="flex-1 rounded-lg bg-primary px-4 py-2 font-semibold text-primary-foreground hover:opacity-90"
              >
                Create Budget
              </button>
            </div>
          </motion.div>
        )}

        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          className="mb-6 rounded-xl border border-border bg-card p-6"
        >
          <div className="mb-4 flex items-center justify-between">
            <h2 className="flex items-center gap-2 font-semibold text-foreground">
              <Target className="h-5 w-5 text-primary" />
              Overall Budget
            </h2>
            <span className={`rounded-full px-3 py-1 text-xs font-medium ${
              overallProgress >= 90 ? "bg-red-500/10 text-red-500" :
              overallProgress >= 75 ? "bg-yellow-500/10 text-yellow-500" :
              "bg-green-500/10 text-green-500"
            }`}>
              {overallProgress.toFixed(0)}% used
            </span>
          </div>
          <div className="mb-2 flex items-center justify-between text-sm">
            <span className="text-muted-foreground">${totalSpent.toFixed(2)} of ${totalBudget.toFixed(2)}</span>
            <span className={`font-medium ${totalSpent > totalBudget ? "text-red-500" : "text-green-500"}`}>
              {totalSpent > totalBudget ? "Over budget!" : "On track"}
            </span>
          </div>
          <div className="h-3 w-full rounded-full bg-secondary">
            <div
              className={`h-3 rounded-full transition-all ${
                overallProgress >= 90 ? "bg-red-500" :
                overallProgress >= 75 ? "bg-yellow-500" :
                "bg-primary"
              }`}
              style={{ width: `${Math.min(overallProgress, 100)}%` }}
            />
          </div>
        </motion.div>

        {alerts.length > 0 && (
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
            className="mb-6 rounded-xl border border-yellow-500/20 bg-yellow-500/5 p-6"
          >
            <h2 className="mb-4 flex items-center gap-2 font-semibold text-foreground">
              <Bell className="h-5 w-5 text-yellow-500" />
              Spending Alerts
            </h2>
            <div className="space-y-3">
              {alerts.map((alert) => (
                <div key={alert.id} className="flex items-start gap-3 rounded-lg border border-yellow-500/20 bg-yellow-500/5 p-3">
                  <AlertTriangle className="mt-0.5 h-5 w-5 text-yellow-500" />
                  <div className="flex-1">
                    <p className="text-sm font-medium text-foreground">{alert.message}</p>
                    <p className="mt-1 text-xs text-muted-foreground">{alert.category} • {new Date(alert.date).toLocaleDateString()}</p>
                  </div>
                </div>
              ))}
            </div>
          </motion.div>
        )}

        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
          className="mb-6 space-y-3"
        >
          <h2 className="flex items-center gap-2 font-semibold text-foreground">
            <PiggyBank className="h-5 w-5 text-primary" />
            Category Budgets
          </h2>
          {budgets.map((budget) => {
            const progress = (budget.spent / budget.limit) * 100;
            const isOver = budget.spent > budget.limit;
            return (
              <div key={budget.id} className="rounded-xl border border-border bg-card p-4">
                <div className="mb-3 flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className={`flex h-10 w-10 items-center justify-center rounded-lg ${
                      isOver ? "bg-red-500/10" : progress >= 75 ? "bg-yellow-500/10" : "bg-primary/10"
                    }`}>
                      {isOver ? (
                        <TrendingUp className="h-5 w-5 text-red-500" />
                      ) : (
                        <TrendingDown className="h-5 w-5 text-primary" />
                      )}
                    </div>
                    <div>
                      <p className="font-medium text-foreground">{budget.category}</p>
                      <p className="text-xs text-muted-foreground">Monthly limit: ${budget.limit.toFixed(2)}</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <button
                      onClick={() => toggleAlert(budget.id)}
                      className={`rounded-lg p-2 ${budget.alerts ? "bg-primary/10" : "bg-secondary"}`}
                    >
                      <Bell className={`h-4 w-4 ${budget.alerts ? "text-primary" : "text-muted-foreground"}`} />
                    </button>
                    <button
                      onClick={() => handleDeleteBudget(budget.id)}
                      className="rounded-lg p-2 hover:bg-secondary"
                    >
                      <Trash2 className="h-4 w-4 text-red-500" />
                    </button>
                  </div>
                </div>
                <div className="mb-1 flex items-center justify-between text-sm">
                  <span className={isOver ? "text-red-500" : "text-muted-foreground"}>
                    ${budget.spent.toFixed(2)} spent
                  </span>
                  <span className={isOver ? "text-red-500 font-medium" : "text-muted-foreground"}>
                    {progress.toFixed(0)}%
                  </span>
                </div>
                <div className="h-2 w-full rounded-full bg-secondary">
                  <div
                    className={`h-2 rounded-full transition-all ${
                      isOver ? "bg-red-500" : progress >= 75 ? "bg-yellow-500" : "bg-primary"
                    }`}
                    style={{ width: `${Math.min(progress, 100)}%` }}
                  />
                </div>
              </div>
            );
          })}
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3 }}
          className="rounded-xl border border-border bg-card p-6"
        >
          <button
            onClick={() => setShowHistory(!showHistory)}
            className="flex w-full items-center justify-between"
          >
            <h2 className="flex items-center gap-2 font-semibold text-foreground">
              <History className="h-5 w-5 text-primary" />
              Budget History
            </h2>
            <ChevronDown className={`h-5 w-5 text-muted-foreground transition-transform ${showHistory ? "rotate-180" : ""}`} />
          </button>
          {showHistory && (
            <div className="mt-4 space-y-2">
              {history.map((item) => (
                <div key={item.month} className="flex items-center justify-between rounded-lg border border-border p-3">
                  <div>
                    <p className="font-medium text-foreground">{item.month}</p>
                    <p className="text-xs text-muted-foreground">
                      Spent ${item.totalSpent} of ${item.totalBudget}
                    </p>
                  </div>
                  <span className={`rounded-full px-2 py-1 text-xs font-medium ${
                    item.status === "under" ? "bg-green-500/10 text-green-500" : "bg-red-500/10 text-red-500"
                  }`}>
                    {item.status === "under" ? "Under" : "Over"}
                  </span>
                </div>
              ))}
            </div>
          )}
        </motion.div>
      </div>
      <Footer />
    </div>
  );
}
