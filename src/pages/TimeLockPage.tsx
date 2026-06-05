import { useState, useEffect, useMemo } from "react";
import { motion } from "framer-motion";
import { 
  Vault, Lock, Unlock, Clock, Calendar, 
  DollarSign, AlertTriangle, PiggyBank, 
  Loader2, Plus, X, ChevronDown, Eye, EyeOff 
} from "lucide-react";
import { Link } from "react-router-dom";
import { useApp } from "@/contexts/AppContext";
import AppHeader from "@/components/AppHeader";
import Footer from "@/components/Footer";
import { toast } from "sonner";

interface Vault {
  id: string;
  name: string;
  amount: number;
  token: string;
  lockedUntil: string;
  createdAt: string;
  status: "locked" | "unlocked" | "early_withdrawn";
  penaltyPaid: number;
}

interface LockPeriod {
  id: string;
  label: string;
  days: number;
  penalty: number;
}

const LOCK_PERIODS: LockPeriod[] = [
  { id: "7d", label: "7 Days", days: 7, penalty: 1 },
  { id: "30d", label: "30 Days", days: 30, penalty: 2 },
  { id: "90d", label: "90 Days", days: 90, penalty: 5 },
  { id: "180d", label: "6 Months", days: 180, penalty: 8 },
  { id: "365d", label: "1 Year", days: 365, penalty: 12 },
];

export default function TimeLockPage() {
  const { isLoggedIn, login } = useApp();
  const [loading, setLoading] = useState(true);
  const [vaults, setVaults] = useState<Vault[]>([]);
  const [showCreate, setShowCreate] = useState(false);
  const [newVault, setNewVault] = useState({
    name: "",
    amount: "",
    periodId: "30d",
  });
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    if (!isLoggedIn) return;
    setLoading(false);
  }, [isLoggedIn]);

  const totalLocked = useMemo(() =>
    vaults.filter(v => v.status === "locked").reduce((sum, v) => sum + v.amount, 0),
    [vaults]
  );

  const calculateUnlockTime = (createdAt: string, period: LockPeriod) => {
    const date = new Date(createdAt);
    date.setDate(date.getDate() + period.days);
    return date;
  };

  const getRemainingTime = (lockedUntil: string) => {
    const now = new Date().getTime();
    const unlockTime = new Date(lockedUntil).getTime();
    const diff = unlockTime - now;

    if (diff <= 0) return { days: 0, hours: 0, minutes: 0, seconds: 0, unlocked: true };

    const days = Math.floor(diff / (1000 * 60 * 60 * 24));
    const hours = Math.floor((diff % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
    const minutes = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));
    const seconds = Math.floor((diff % (1000 * 60)) / 1000);

    return { days, hours, minutes, seconds, unlocked: false };
  };

  const createVault = async () => {
    if (!newVault.name || !newVault.amount) {
      toast.error("Please fill in all fields");
      return;
    }

    setIsSubmitting(true);
    try {
      const period = LOCK_PERIODS.find(p => p.id === newVault.periodId) || LOCK_PERIODS[1];
      const unlockDate = new Date();
      unlockDate.setDate(unlockDate.getDate() + period.days);

      const vault: Vault = {
        id: crypto.randomUUID(),
        name: newVault.name,
        amount: parseFloat(newVault.amount),
        token: "USDC",
        lockedUntil: unlockDate.toISOString(),
        createdAt: new Date().toISOString(),
        status: "locked",
        penaltyPaid: 0,
      };

      setVaults(prev => [vault, ...prev]);
      setNewVault({ name: "", amount: "", periodId: "30d" });
      setShowCreate(false);
      toast.success(`Vault created! ${vault.amount} USDC locked for ${period.label}`);
    } finally {
      setIsSubmitting(false);
    }
  };

  const withdrawEarly = async (vaultId: string) => {
    const vault = vaults.find(v => v.id === vaultId);
    if (!vault) return;

    const period = LOCK_PERIODS.find(p => p.days === Math.ceil(
      (new Date(vault.lockedUntil).getTime() - new Date(vault.createdAt).getTime()) / (1000 * 60 * 60 * 24)
    )) || LOCK_PERIODS[1];

    const penaltyAmount = (vault.amount * period.penalty) / 100;
    const withdrawAmount = vault.amount - penaltyAmount;

    if (confirm(`Early withdrawal penalty: ${penaltyAmount} ${vault.token} (${period.penalty}%)\nYou will receive: ${withdrawAmount} ${vault.token}`)) {
      setVaults(prev => prev.map(v =>
        v.id === vaultId
          ? { ...v, status: "early_withdrawn" as const, penaltyPaid: penaltyAmount }
          : v
      ));
      toast.success(`Withdrew ${withdrawAmount} ${vault.token} (paid ${penaltyAmount} penalty)`);
    }
  };

  const withdrawUnlocked = async (vaultId: string) => {
    setVaults(prev => prev.map(v =>
      v.id === vaultId ? { ...v, status: "unlocked" as const } : v
    ));
    toast.success("Vault withdrawn successfully!");
  };

  if (!isLoggedIn) {
    return (
      <div className="min-h-screen bg-background">
        <AppHeader />
        <div className="flex min-h-[80vh] flex-col items-center justify-center px-4 text-center">
          <div className="mb-6 flex h-20 w-20 items-center justify-center rounded-full bg-primary/10">
            <Vault className="h-10 w-10 text-primary" />
          </div>
          <h2 className="mb-3 font-display text-2xl text-foreground sm:text-3xl">Time-Lock Vault</h2>
          <p className="mb-6 max-w-md text-sm text-muted-foreground">
            Lock your funds for a set period to earn better returns and save strategically
          </p>
          <button onClick={login} className="rounded-lg bg-primary px-6 py-3 font-semibold text-primary-foreground shadow-glow hover:opacity-90">
            Sign In to Access Vault
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
            <h1 className="font-display text-2xl text-foreground sm:text-3xl">Time-Lock Vault</h1>
            <p className="mt-1 text-sm text-muted-foreground">
              ${totalLocked.toFixed(2)} total locked across {vaults.length} vaults
            </p>
          </div>
          <button
            onClick={() => setShowCreate(true)}
            className="flex items-center gap-2 rounded-lg bg-primary px-4 py-2 text-sm font-semibold text-primary-foreground shadow-glow hover:opacity-90"
          >
            <Plus className="h-4 w-4" />
            Create Vault
          </button>
        </div>

        {loading ? (
          <div className="flex justify-center py-12">
            <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
          </div>
        ) : (
          <div className="space-y-4">
            {/* Vault Stats */}
            <div className="grid grid-cols-2 gap-3">
              <div className="rounded-xl border border-border bg-card p-4">
                <div className="flex items-center gap-2 text-primary mb-1">
                  <Lock className="h-4 w-4" />
                  <span className="text-xs text-muted-foreground">Total Locked</span>
                </div>
                <p className="text-lg font-bold text-foreground">{totalLocked} USDC</p>
              </div>
              <div className="rounded-xl border border-border bg-card p-4">
                <div className="flex items-center gap-2 text-primary mb-1">
                  <PiggyBank className="h-4 w-4" />
                  <span className="text-xs text-muted-foreground">Active Vaults</span>
                </div>
                <p className="text-lg font-bold text-foreground">{vaults.filter(v => v.status === "locked").length}</p>
              </div>
            </div>

            {/* Vault List */}
            {vaults.length === 0 ? (
              <div className="rounded-xl border border-border bg-card p-8 text-center">
                <Vault className="mx-auto mb-3 h-8 w-8 text-muted-foreground" />
                <p className="text-sm text-muted-foreground">No vaults yet</p>
                <button
                  onClick={() => setShowCreate(true)}
                  className="mt-3 text-sm text-primary hover:underline"
                >
                  Create your first vault
                </button>
              </div>
            ) : (
              vaults.map((vault) => {
                const remaining = getRemainingTime(vault.lockedUntil);
                const period = LOCK_PERIODS.find(p =>
                  Math.ceil((new Date(vault.lockedUntil).getTime() - new Date(vault.createdAt).getTime()) / (1000 * 60 * 60 * 24)) === p.days
                ) || LOCK_PERIODS[1];

                return (
                  <motion.div
                    key={vault.id}
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    className={`rounded-xl border border-border bg-card p-4 ${
                      vault.status !== "locked" ? "opacity-60" : ""
                    }`}
                  >
                    <div className="flex items-start justify-between">
                      <div className="flex-1">
                        <div className="flex items-center gap-2 mb-1">
                          <h3 className="font-medium text-foreground">{vault.name}</h3>
                          <span
                            className={`rounded-full px-2 py-0.5 text-xs ${
                              vault.status === "locked"
                                ? "bg-yellow-500/20 text-yellow-600"
                                : vault.status === "unlocked"
                                ? "bg-green-500/20 text-green-600"
                                : "bg-red-500/20 text-red-600"
                            }`}
                          >
                            {vault.status === "locked" ? "Locked" : vault.status === "unlocked" ? "Unlocked" : "Withdrawn"}
                          </span>
                        </div>
                        <p className="text-2xl font-bold text-foreground">
                          {vault.amount} {vault.token}
                        </p>
                        <p className="text-xs text-muted-foreground">
                          Created {new Date(vault.createdAt).toLocaleDateString()}
                        </p>
                      </div>

                      <div className="text-right">
                        {vault.status === "locked" ? (
                          remaining.unlocked ? (
                            <button
                              onClick={() => withdrawUnlocked(vault.id)}
                              className="flex items-center gap-1 rounded-lg bg-green-500 px-3 py-1.5 text-xs font-medium text-white"
                            >
                              <Unlock className="h-3 w-3" />
                              Withdraw
                            </button>
                          ) : (
                            <div className="text-right">
                              <div className="flex items-center gap-1 text-yellow-600 mb-1">
                                <Clock className="h-3 w-3" />
                                <span className="text-xs font-medium">
                                  {remaining.days}d {remaining.hours}h
                                </span>
                              </div>
                              <button
                                onClick={() => withdrawEarly(vault.id)}
                                className="flex items-center gap-1 text-xs text-red-500 hover:text-red-600"
                              >
                                <AlertTriangle className="h-3 w-3" />
                                Early Withdraw ({period.penalty}% fee)
                              </button>
                            </div>
                          )
                        ) : vault.status === "unlocked" ? (
                          <p className="text-xs text-green-600">Withdrawn</p>
                        ) : (
                          <p className="text-xs text-red-600">
                            Early withdrawn (-{vault.penaltyPaid} penalty)
                          </p>
                        )}
                      </div>
                    </div>
                  </motion.div>
                );
              })
            )}
          </div>
        )}
      </div>
      <Footer />

      {/* Create Vault Modal */}
      {showCreate && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4">
          <div className="w-full max-w-sm rounded-2xl bg-card p-6">
            <div className="mb-4 flex items-center justify-between">
              <h3 className="font-display text-lg text-foreground">Create Vault</h3>
              <button onClick={() => setShowCreate(false)} className="text-muted-foreground">
                <X className="h-5 w-5" />
              </button>
            </div>

            <div className="space-y-4">
              <div>
                <label className="mb-1.5 block text-sm font-medium text-foreground">Vault Name</label>
                <input
                  type="text"
                  value={newVault.name}
                  onChange={(e) => setNewVault({ ...newVault, name: e.target.value })}
                  placeholder="e.g., Emergency Fund"
                  className="w-full rounded-lg border border-border bg-background px-3 py-2 text-sm text-foreground placeholder:text-muted-foreground/50 focus:outline-none focus:ring-2 focus:ring-ring"
                />
              </div>

              <div>
                <label className="mb-1.5 block text-sm font-medium text-foreground">Amount</label>
                <div className="relative">
                  <DollarSign className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                  <input
                    type="number"
                    value={newVault.amount}
                    onChange={(e) => setNewVault({ ...newVault, amount: e.target.value })}
                    placeholder="0.00"
                    className="w-full rounded-lg border border-border bg-background pl-10 pr-3 py-2 text-sm text-foreground placeholder:text-muted-foreground/50 focus:outline-none focus:ring-2 focus:ring-ring"
                  />
                </div>
              </div>

              <div>
                <label className="mb-1.5 block text-sm font-medium text-foreground">Lock Period</label>
                <div className="grid grid-cols-2 gap-2">
                  {LOCK_PERIODS.map((period) => (
                    <button
                      key={period.id}
                      onClick={() => setNewVault({ ...newVault, periodId: period.id })}
                      className={`rounded-lg border px-3 py-2 text-sm transition-colors ${
                        newVault.periodId === period.id
                          ? "border-primary bg-primary/10 text-primary"
                          : "border-border hover:bg-secondary"
                      }`}
                    >
                      <div className="font-medium">{period.label}</div>
                      <div className="text-xs text-muted-foreground">{period.penalty}% penalty</div>
                    </button>
                  ))}
                </div>
              </div>

              <div className="rounded-lg bg-yellow-500/10 p-3">
                <div className="flex items-start gap-2">
                  <AlertTriangle className="h-4 w-4 text-yellow-600 shrink-0 mt-0.5" />
                  <div>
                    <p className="text-xs text-yellow-600 font-medium">Early Withdrawal Penalty</p>
                    <p className="text-xs text-muted-foreground">
                      Withdrawing before the lock period ends incurs a penalty (1-12% depending on duration).
                    </p>
                  </div>
                </div>
              </div>

              <button
                onClick={createVault}
                disabled={isSubmitting}
                className="flex w-full items-center justify-center gap-2 rounded-lg bg-primary py-3 text-sm font-semibold text-primary-foreground shadow-glow hover:opacity-90 disabled:opacity-50"
              >
                {isSubmitting ? (
                  <>
                    <Loader2 className="h-4 w-4 animate-spin" />
                    Creating...
                  </>
                ) : (
                  <>
                    <Lock className="h-4 w-4" />
                    Create Vault
                  </>
                )}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
