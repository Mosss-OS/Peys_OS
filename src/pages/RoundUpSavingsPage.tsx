import { useState } from "react";
import { motion } from "framer-motion";
import { PiggyBank, Plus, TrendingUp, TrendingDown, DollarSign, Target, ArrowUpRight, ArrowDownRight, Loader2, Check, History, RotateCcw, Settings } from "lucide-react";
import { useApp } from "@/contexts/AppContext";
import AppHeader from "@/components/AppHeader";
import Footer from "@/components/Footer";
import { toast } from "sonner";

interface SavingsGoal {
  id: string;
  name: string;
  target: number;
  current: number;
  roundUpMultiplier: number;
  color: string;
}

interface SavingsTransaction {
  id: string;
  amount: number;
  date: string;
  source: string;
  status: "pending" | "completed";
}

export default function RoundUpSavingsPage() {
  const { isLoggedIn, login } = useApp();
  const [enabled, setEnabled] = useState(true);
  const [multiplier, setMultiplier] = useState(1);
  const [showGoalForm, setShowGoalForm] = useState(false);
  const [newGoalName, setNewGoalName] = useState("");
  const [newGoalTarget, setNewGoalTarget] = useState("");
  const [withdrawing, setWithdrawing] = useState<string | null>(null);

  const savingsBalance = 456.78;
  const totalSaved = 1250.50;
  const thisMonth = 87.50;

  const goals: SavingsGoal[] = [
    { id: "1", name: "Vacation Fund", target: 2000, current: 1250.50, roundUpMultiplier: 1, color: "#6366f1" },
    { id: "2", name: "New Phone", target: 800, current: 320, roundUpMultiplier: 2, color: "#10b981" },
    { id: "3", name: "Emergency Fund", target: 5000, current: 0, roundUpMultiplier: 1, color: "#f59e0b" },
  ];

  const transactions: SavingsTransaction[] = [
    { id: "1", amount: 0.23, date: "2026-03-18", source: "Coffee - $4.77", status: "completed" },
    { id: "2", amount: 0.50, date: "2026-03-17", source: "Groceries - $24.50", status: "completed" },
    { id: "3", amount: 0.75, date: "2026-03-17", source: "Gas - $34.25", status: "completed" },
    { id: "4", amount: 0.33, date: "2026-03-16", source: "Lunch - $9.67", status: "completed" },
    { id: "5", amount: 1.00, date: "2026-03-15", source: "Subscription - $9.00", status: "pending" },
  ];

  const handleCreateGoal = () => {
    if (!newGoalName || !newGoalTarget) {
      toast.error("Please fill in all fields");
      return;
    }
    setShowGoalForm(false);
    setNewGoalName("");
    setNewGoalTarget("");
    toast.success("Savings goal created!");
  };

  const handleWithdraw = async (goalId: string) => {
    setWithdrawing(goalId);
    setWithdrawing(null);
    toast.success("Withdrawal initiated!");
  };

  if (!isLoggedIn) {
    return (
      <div className="min-h-screen bg-background">
        <AppHeader />
        <div className="flex min-h-[80vh] flex-col items-center justify-center px-4 text-center">
          <div className="mb-6 flex h-20 w-20 items-center justify-center rounded-full bg-primary/10">
            <PiggyBank className="h-10 w-10 text-primary" />
          </div>
          <h2 className="mb-3 font-display text-2xl text-foreground sm:text-3xl">Round-Up Savings</h2>
          <p className="mb-6 max-w-md text-sm text-muted-foreground">
            Save effortlessly by rounding up your purchases. Every transaction brings you closer to your goals.
          </p>
          <button onClick={login} className="rounded-lg bg-primary px-6 py-3 font-semibold text-primary-foreground shadow-glow hover:opacity-90">
            Sign In to Start Saving
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
          <h1 className="font-display text-2xl text-foreground sm:text-3xl">Round-Up Savings</h1>
          <p className="mt-1 text-sm text-muted-foreground">Save effortlessly with every transaction</p>
        </div>

        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          className="mb-6 rounded-xl border border-border bg-gradient-to-r from-primary/10 to-primary/5 p-6"
        >
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-muted-foreground">Total Saved</p>
              <p className="mt-1 font-display text-4xl font-bold text-primary">${totalSaved.toFixed(2)}</p>
              <p className="mt-1 text-sm text-muted-foreground">
                <span className="font-medium text-green-500">+${thisMonth.toFixed(2)}</span> this month
              </p>
            </div>
            <div className="flex h-16 w-16 items-center justify-center rounded-full bg-primary/20">
              <PiggyBank className="h-8 w-8 text-primary" />
            </div>
          </div>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className="mb-6 rounded-xl border border-border bg-card p-6"
        >
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <RotateCcw className="h-5 w-5 text-primary" />
              <div>
                <h2 className="font-semibold text-foreground">Auto Round-Up</h2>
                <p className="text-sm text-muted-foreground">
                  Round up transactions to save automatically
                </p>
              </div>
            </div>
            <button
              onClick={() => {
                setEnabled(!enabled);
                toast.success(enabled ? "Round-up disabled" : "Round-up enabled");
              }}
              className={`relative h-6 w-11 rounded-full transition-colors ${
                enabled ? "bg-primary" : "bg-secondary"
              }`}
            >
              <span
                className={`absolute top-0.5 h-5 w-5 rounded-full bg-white shadow transition-transform ${
                  enabled ? "left-[22px]" : "left-0.5"
                }`}
              />
            </button>
          </div>

          {enabled && (
            <div className="mt-4 border-t border-border pt-4">
              <label className="mb-2 block text-sm font-medium text-muted-foreground">Round-Up Multiplier</label>
              <div className="grid grid-cols-3 gap-2">
                {[1, 2, 3].map((mult) => (
                  <button
                    key={mult}
                    onClick={() => {
                      setMultiplier(mult);
                      toast.success(`Multiplier set to ${mult}x`);
                    }}
                    className={`rounded-lg border px-4 py-3 text-center font-medium transition-colors ${
                      multiplier === mult
                        ? "border-primary bg-primary/10 text-primary"
                        : "border-border hover:bg-secondary"
                    }`}
                  >
                    {mult}x
                    <p className="mt-0.5 text-xs text-muted-foreground">
                      ${(0.50 * mult).toFixed(2)} avg/day
                    </p>
                  </button>
                ))}
              </div>
            </div>
          )}
        </motion.div>

        <div className="mb-6 flex items-center justify-between">
          <h2 className="flex items-center gap-2 text-lg font-semibold text-foreground">
            <Target className="h-5 w-5 text-primary" />
            Savings Goals
          </h2>
          <button
            onClick={() => setShowGoalForm(true)}
            className="flex items-center gap-2 rounded-lg bg-primary px-4 py-2 text-sm font-semibold text-primary-foreground hover:opacity-90"
          >
            <Plus className="h-4 w-4" />
            New Goal
          </button>
        </div>

        {showGoalForm && (
          <motion.div
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            className="mb-6 rounded-xl border border-border bg-card p-6"
          >
            <h3 className="mb-4 font-semibold text-foreground">Create Savings Goal</h3>
            <div className="grid gap-4 sm:grid-cols-2">
              <div>
                <label className="mb-2 block text-sm font-medium text-muted-foreground">Goal Name</label>
                <input
                  type="text"
                  value={newGoalName}
                  onChange={(e) => setNewGoalName(e.target.value)}
                  placeholder="e.g., Vacation"
                  className="w-full rounded-lg border border-border bg-background px-4 py-2.5 text-sm text-foreground placeholder:text-muted-foreground focus:border-primary focus:outline-none"
                />
              </div>
              <div>
                <label className="mb-2 block text-sm font-medium text-muted-foreground">Target Amount ($)</label>
                <input
                  type="number"
                  value={newGoalTarget}
                  onChange={(e) => setNewGoalTarget(e.target.value)}
                  placeholder="1000"
                  className="w-full rounded-lg border border-border bg-background px-4 py-2.5 text-sm text-foreground placeholder:text-muted-foreground focus:border-primary focus:outline-none"
                />
              </div>
            </div>
            <div className="mt-4 flex gap-3">
              <button
                onClick={() => setShowGoalForm(false)}
                className="flex-1 rounded-lg border border-border px-4 py-2 font-medium hover:bg-secondary"
              >
                Cancel
              </button>
              <button
                onClick={handleCreateGoal}
                className="flex-1 rounded-lg bg-primary px-4 py-2 font-semibold text-primary-foreground hover:opacity-90"
              >
                Create Goal
              </button>
            </div>
          </motion.div>
        )}

        <div className="mb-6 grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          {goals.map((goal, i) => {
            const progress = (goal.current / goal.target) * 100;
            return (
              <motion.div
                key={goal.id}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: i * 0.05 }}
                className="rounded-xl border border-border bg-card p-5"
              >
                <div className="mb-3 flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <div className="h-3 w-3 rounded-full" style={{ backgroundColor: goal.color }} />
                    <h3 className="font-semibold text-foreground">{goal.name}</h3>
                  </div>
                  <button
                    onClick={() => handleWithdraw(goal.id)}
                    disabled={withdrawing === goal.id || goal.current === 0}
                    className="text-xs text-primary hover:underline disabled:text-muted-foreground disabled:cursor-not-allowed"
                  >
                    {withdrawing === goal.id ? "Processing..." : "Withdraw"}
                  </button>
                </div>
                <div className="mb-2 flex items-end justify-between">
                  <p className="font-display text-2xl font-bold" style={{ color: goal.color }}>
                    ${goal.current.toFixed(2)}
                  </p>
                  <p className="text-sm text-muted-foreground">
                    of ${goal.target.toLocaleString()}
                  </p>
                </div>
                <div className="mb-2 h-2 w-full rounded-full bg-secondary">
                  <div
                    className="h-2 rounded-full transition-all"
                    style={{ width: `${progress}%`, backgroundColor: goal.color }}
                  />
                </div>
                <div className="flex items-center justify-between text-xs text-muted-foreground">
                  <span>{progress.toFixed(0)}% complete</span>
                  <span>{goal.roundUpMultiplier}x round-up</span>
                </div>
              </motion.div>
            );
          })}
        </div>

        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3 }}
          className="rounded-xl border border-border bg-card p-6"
        >
          <h2 className="mb-4 flex items-center gap-2 text-lg font-semibold text-foreground">
            <History className="h-5 w-5 text-primary" />
            Recent Round-Ups
          </h2>
          <div className="space-y-3">
            {transactions.map((tx) => (
              <div
                key={tx.id}
                className="flex items-center justify-between rounded-lg border border-border p-4"
              >
                <div className="flex items-center gap-3">
                  <div className={`flex h-10 w-10 items-center justify-center rounded-full ${
                    tx.status === "completed" ? "bg-green-500/10" : "bg-yellow-500/10"
                  }`}>
                    {tx.status === "completed" ? (
                      <ArrowUpRight className="h-5 w-5 text-green-500" />
                    ) : (
                      <Loader2 className="h-5 w-5 animate-spin text-yellow-500" />
                    )}
                  </div>
                  <div>
                    <p className="font-medium text-foreground">+${tx.amount.toFixed(2)}</p>
                    <p className="text-xs text-muted-foreground">{tx.source}</p>
                  </div>
                </div>
                <div className="text-right">
                  <p className={`text-sm font-medium ${
                    tx.status === "completed" ? "text-green-500" : "text-yellow-500"
                  }`}>
                    {tx.status === "completed" ? "Completed" : "Pending"}
                  </p>
                  <p className="text-xs text-muted-foreground">
                    {new Date(tx.date).toLocaleDateString()}
                  </p>
                </div>
              </div>
            ))}
          </div>
        </motion.div>
      </div>
      <Footer />
    </div>
  );
}
