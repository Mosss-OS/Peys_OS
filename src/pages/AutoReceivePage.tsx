/** AutoReceivePage - Auto-receive settings with amount thresholds, trusted/blocked sender lists, and notification config */
import { useState } from "react";
import { motion } from "framer-motion";
import { Settings, ToggleLeft, ToggleRight, DollarSign, Bell, Users, Shield, Clock, Plus, X, Check, AlertTriangle, Loader2, Mail, User, UserX } from "lucide-react";
import { useApp } from "@/contexts/AppContext";
import AppHeader from "@/components/AppHeader";
import Footer from "@/components/Footer";
import { toast } from "sonner";

interface AutoReceiveConfig {
  enabled: boolean;
  minAmount: string;
  notifications: {
    onReceive: boolean;
    onLargeReceive: boolean;
    dailySummary: boolean;
  };
  largeAmountThreshold: string;
}

interface SenderEntry {
  id: string;
  address: string;
  label: string;
  type: "trusted" | "blocked";
}

/** AutoReceivePage component - Configures automatic fund claiming with thresholds, trusted/blocked senders, and notification preferences */
export default function AutoReceivePage() {
  const { isLoggedIn, login } = useApp();
  const [config, setConfig] = useState<AutoReceiveConfig>({
    enabled: true,
    minAmount: "0.01",
    notifications: {
      onReceive: true,
      onLargeReceive: true,
      dailySummary: false,
    },
    largeAmountThreshold: "100",
  });
  const [trustedSenders, setTrustedSenders] = useState<SenderEntry[]>([
    { id: "1", address: "0x1234...5678", label: "My Savings", type: "trusted" },
    { id: "2", address: "0xabcd...efgh", label: "Work Wallet", type: "trusted" },
  ]);
  const [blockedSenders, setBlockedSenders] = useState<SenderEntry[]>([
    { id: "3", address: "0x9876...ijkl", label: "Unknown Scammer", type: "blocked" },
  ]);
  const [showAddModal, setShowAddModal] = useState<"trusted" | "blocked" | null>(null);
  const [newAddress, setNewAddress] = useState("");
  const [newLabel, setNewLabel] = useState("");
  const [saving, setSaving] = useState(false);

  const history = [
    { id: "1", amount: 50, sender: "0x1234...5678", date: "2026-03-18 14:30", autoReceived: true },
    { id: "2", amount: 25, sender: "0xabcd...efgh", date: "2026-03-17 09:15", autoReceived: true },
    { id: "3", amount: 5, sender: "0x9876...ijkl", date: "2026-03-16 18:45", autoReceived: false, reason: "Below minimum" },
  ];

  const toggleConfig = (key: keyof AutoReceiveConfig) => {
    if (typeof config[key] === "boolean") {
      setConfig({ ...config, [key]: !config[key] });
      toast.success("Settings updated");
    }
  };

  const toggleNotification = (key: keyof typeof config.notifications) => {
    setConfig({
      ...config,
      notifications: { ...config.notifications, [key]: !config.notifications[key] },
    });
    toast.success("Notification setting updated");
  };

  const handleAddSender = async () => {
    if (!newAddress || !newLabel) {
      toast.error("Please fill in all fields");
      return;
    }
    setSaving(true);
    
    const newEntry: SenderEntry = {
      id: Date.now().toString(),
      address: newAddress.slice(0, 8) + "..." + newAddress.slice(-4),
      label: newLabel,
      type: showAddModal!,
    };

    if (showAddModal === "trusted") {
      setTrustedSenders([...trustedSenders, newEntry]);
    } else {
      setBlockedSenders([...blockedSenders, newEntry]);
    }

    setNewAddress("");
    setNewLabel("");
    setShowAddModal(null);
    setSaving(false);
    toast.success(`${showAddModal === "trusted" ? "Trusted" : "Blocked"} sender added`);
  };

  const handleRemoveSender = (id: string, type: "trusted" | "blocked") => {
    if (type === "trusted") {
      setTrustedSenders(trustedSenders.filter(s => s.id !== id));
    } else {
      setBlockedSenders(blockedSenders.filter(s => s.id !== id));
    }
    toast.success("Sender removed");
  };

  if (!isLoggedIn) {
    return (
      <div className="min-h-screen bg-background">
        <AppHeader />
        <div className="flex min-h-[80vh] flex-col items-center justify-center px-4 text-center">
          <div className="mb-6 flex h-20 w-20 items-center justify-center rounded-full bg-primary/10">
            <Settings className="h-10 w-10 text-primary" />
          </div>
          <h2 className="mb-3 font-display text-2xl text-foreground sm:text-3xl">Auto-Receive Settings</h2>
          <p className="mb-6 max-w-md text-sm text-muted-foreground">
            Automatically receive funds without manual claiming. Manage trusted and blocked senders.
          </p>
          <button onClick={login} className="rounded-lg bg-primary px-6 py-3 font-semibold text-primary-foreground shadow-glow hover:opacity-90">
            Sign In to Configure
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
          <h1 className="font-display text-2xl text-foreground sm:text-3xl">Auto-Receive Settings</h1>
          <p className="mt-1 text-sm text-muted-foreground">Automatically receive funds without manual claiming</p>
        </div>

        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          className="mb-6 rounded-xl border border-border bg-card p-6"
        >
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className={`flex h-12 w-12 items-center justify-center rounded-full ${
                config.enabled ? "bg-green-500/10" : "bg-secondary"
              }`}>
                <Settings className={`h-6 w-6 ${config.enabled ? "text-green-500" : "text-muted-foreground"}`} />
              </div>
              <div>
                <h2 className="font-semibold text-foreground">Auto-Receive</h2>
                <p className="text-sm text-muted-foreground">
                  {config.enabled ? "Funds are automatically claimed" : "Manual claiming required"}
                </p>
              </div>
            </div>
            <button
              onClick={() => toggleConfig("enabled")}
              className={`relative h-8 w-14 rounded-full transition-colors ${
                config.enabled ? "bg-green-500" : "bg-secondary"
              }`}
            >
              <span
                className={`absolute top-1 h-6 w-6 rounded-full bg-white shadow transition-transform ${
                  config.enabled ? "left-[26px]" : "left-1"
                }`}
              />
            </button>
          </div>
        </motion.div>

        {config.enabled && (
          <>
            <motion.div
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.1 }}
              className="mb-6 rounded-xl border border-border bg-card p-6"
            >
              <h2 className="mb-4 flex items-center gap-2 text-lg font-semibold text-foreground">
                <DollarSign className="h-5 w-5 text-primary" />
                Amount Thresholds
              </h2>
              <div className="grid gap-4 sm:grid-cols-2">
                <div>
                  <label className="mb-2 block text-sm font-medium text-muted-foreground">Minimum Amount</label>
                  <div className="relative">
                    <DollarSign className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                    <input
                      type="number"
                      value={config.minAmount}
                      onChange={(e) => setConfig({ ...config, minAmount: e.target.value })}
                      className="w-full rounded-lg border border-border bg-background py-2.5 pl-9 pr-4 text-sm text-foreground focus:border-primary focus:outline-none"
                    />
                  </div>
                  <p className="mt-1 text-xs text-muted-foreground">
                    Auto-receive amounts above this
                  </p>
                </div>
                <div>
                  <label className="mb-2 block text-sm font-medium text-muted-foreground">Large Amount Alert</label>
                  <div className="relative">
                    <DollarSign className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                    <input
                      type="number"
                      value={config.largeAmountThreshold}
                      onChange={(e) => setConfig({ ...config, largeAmountThreshold: e.target.value })}
                      className="w-full rounded-lg border border-border bg-background py-2.5 pl-9 pr-4 text-sm text-foreground focus:border-primary focus:outline-none"
                    />
                  </div>
                  <p className="mt-1 text-xs text-muted-foreground">
                    Alert for amounts above this
                  </p>
                </div>
              </div>
            </motion.div>

            <motion.div
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.15 }}
              className="mb-6 rounded-xl border border-border bg-card p-6"
            >
              <h2 className="mb-4 flex items-center gap-2 text-lg font-semibold text-foreground">
                <Bell className="h-5 w-5 text-primary" />
                Notifications
              </h2>
              <div className="space-y-3">
                {[
                  { key: "onReceive" as const, label: "On Receive", description: "Notify when funds are auto-received" },
                  { key: "onLargeReceive" as const, label: "Large Amount Alert", description: "Notify for large transactions" },
                  { key: "dailySummary" as const, label: "Daily Summary", description: "Receive daily auto-receive summary" },
                ].map((item) => (
                  <div key={item.key} className="flex items-center justify-between rounded-lg border border-border p-4">
                    <div>
                      <p className="font-medium text-foreground">{item.label}</p>
                      <p className="text-xs text-muted-foreground">{item.description}</p>
                    </div>
                    <button
                      onClick={() => toggleNotification(item.key)}
                      className={`relative h-6 w-11 rounded-full transition-colors ${
                        config.notifications[item.key] ? "bg-primary" : "bg-secondary"
                      }`}
                    >
                      <span
                        className={`absolute top-0.5 h-5 w-5 rounded-full bg-white shadow transition-transform ${
                          config.notifications[item.key] ? "left-[22px]" : "left-0.5"
                        }`}
                      />
                    </button>
                  </div>
                ))}
              </div>
            </motion.div>

            <motion.div
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.2 }}
              className="mb-6 rounded-xl border border-green-500/20 bg-green-500/5 p-6"
            >
              <div className="mb-4 flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <Users className="h-5 w-5 text-green-500" />
                  <h2 className="font-semibold text-foreground">Trusted Senders</h2>
                </div>
                <button
                  onClick={() => setShowAddModal("trusted")}
                  className="flex items-center gap-1 text-sm text-green-500 hover:underline"
                >
                  <Plus className="h-4 w-4" />
                  Add
                </button>
              </div>
              <p className="mb-4 text-sm text-muted-foreground">
                Funds from trusted senders are always auto-received
              </p>
              <div className="space-y-2">
                {trustedSenders.map((sender) => (
                  <div key={sender.id} className="flex items-center justify-between rounded-lg border border-green-500/20 bg-green-500/5 p-3">
                    <div className="flex items-center gap-3">
                      <User className="h-4 w-4 text-green-500" />
                      <div>
                        <p className="font-medium text-foreground">{sender.label}</p>
                        <p className="font-mono text-xs text-muted-foreground">{sender.address}</p>
                      </div>
                    </div>
                    <button onClick={() => handleRemoveSender(sender.id, "trusted")}>
                      <X className="h-4 w-4 text-muted-foreground hover:text-red-500" />
                    </button>
                  </div>
                ))}
                {trustedSenders.length === 0 && (
                  <p className="py-4 text-center text-sm text-muted-foreground">
                    No trusted senders added
                  </p>
                )}
              </div>
            </motion.div>

            <motion.div
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.25 }}
              className="mb-6 rounded-xl border border-red-500/20 bg-red-500/5 p-6"
            >
              <div className="mb-4 flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <Shield className="h-5 w-5 text-red-500" />
                  <h2 className="font-semibold text-foreground">Blocked Senders</h2>
                </div>
                <button
                  onClick={() => setShowAddModal("blocked")}
                  className="flex items-center gap-1 text-sm text-red-500 hover:underline"
                >
                  <Plus className="h-4 w-4" />
                  Add
                </button>
              </div>
              <p className="mb-4 text-sm text-muted-foreground">
                Funds from blocked senders will never be auto-received
              </p>
              <div className="space-y-2">
                {blockedSenders.map((sender) => (
                  <div key={sender.id} className="flex items-center justify-between rounded-lg border border-red-500/20 bg-red-500/5 p-3">
                    <div className="flex items-center gap-3">
                      <UserX className="h-4 w-4 text-red-500" />
                      <div>
                        <p className="font-medium text-foreground">{sender.label}</p>
                        <p className="font-mono text-xs text-muted-foreground">{sender.address}</p>
                      </div>
                    </div>
                    <button onClick={() => handleRemoveSender(sender.id, "blocked")}>
                      <X className="h-4 w-4 text-muted-foreground hover:text-red-500" />
                    </button>
                  </div>
                ))}
                {blockedSenders.length === 0 && (
                  <p className="py-4 text-center text-sm text-muted-foreground">
                    No blocked senders
                  </p>
                )}
              </div>
            </motion.div>

            <motion.div
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.3 }}
              className="rounded-xl border border-border bg-card p-6"
            >
              <h2 className="mb-4 flex items-center gap-2 text-lg font-semibold text-foreground">
                <Clock className="h-5 w-5 text-primary" />
                Auto-Receive History
              </h2>
              <div className="space-y-3">
                {history.map((tx) => (
                  <div key={tx.id} className="flex items-center justify-between rounded-lg border border-border p-4">
                    <div>
                      <p className="font-medium text-foreground">${tx.amount.toFixed(2)}</p>
                      <p className="text-xs text-muted-foreground">{tx.sender}</p>
                    </div>
                    <div className="text-right">
                      <span className={`rounded-full px-2 py-1 text-xs font-medium ${
                        tx.autoReceived
                          ? "bg-green-500/10 text-green-600"
                          : "bg-red-500/10 text-red-600"
                      }`}>
                        {tx.autoReceived ? "Auto-received" : tx.reason}
                      </span>
                      <p className="mt-1 text-xs text-muted-foreground">{tx.date}</p>
                    </div>
                  </div>
                ))}
              </div>
            </motion.div>
          </>
        )}

        {showAddModal && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              className="w-full max-w-md rounded-xl border border-border bg-card p-6"
            >
              <div className="mb-4 flex items-center justify-between">
                <h3 className="font-semibold text-foreground">
                  Add {showAddModal === "trusted" ? "Trusted" : "Blocked"} Sender
                </h3>
                <button onClick={() => setShowAddModal(null)}>
                  <X className="h-5 w-5 text-muted-foreground" />
                </button>
              </div>
              <div className="space-y-4">
                <div>
                  <label className="mb-2 block text-sm font-medium text-muted-foreground">Address</label>
                  <input
                    type="text"
                    value={newAddress}
                    onChange={(e) => setNewAddress(e.target.value)}
                    placeholder="0x..."
                    className="w-full rounded-lg border border-border bg-background px-4 py-2.5 font-mono text-sm text-foreground placeholder:text-muted-foreground focus:border-primary focus:outline-none"
                  />
                </div>
                <div>
                  <label className="mb-2 block text-sm font-medium text-muted-foreground">Label</label>
                  <input
                    type="text"
                    value={newLabel}
                    onChange={(e) => setNewLabel(e.target.value)}
                    placeholder="e.g., My Wallet"
                    className="w-full rounded-lg border border-border bg-background px-4 py-2.5 text-sm text-foreground placeholder:text-muted-foreground focus:border-primary focus:outline-none"
                  />
                </div>
              </div>
              <div className="mt-4 flex gap-3">
                <button
                  onClick={() => setShowAddModal(null)}
                  className="flex-1 rounded-lg border border-border px-4 py-2 font-medium hover:bg-secondary"
                >
                  Cancel
                </button>
                <button
                  onClick={handleAddSender}
                  disabled={saving}
                  className="flex-1 rounded-lg bg-primary px-4 py-2 font-semibold text-primary-foreground hover:opacity-90 disabled:opacity-50"
                >
                  {saving ? <Loader2 className="mx-auto h-5 w-5 animate-spin" /> : "Add Sender"}
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </div>
      <Footer />
    </div>
  );
}
