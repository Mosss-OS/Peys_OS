import { useState, useRef } from "react";
import { motion } from "framer-motion";
import { Users, Upload, Plus, Trash2, DollarSign, Check, Loader2, AlertCircle, FileText, Send, X } from "lucide-react";
import { useApp } from "@/contexts/AppContext";
import AppHeader from "@/components/AppHeader";
import Footer from "@/components/Footer";
import { toast } from "sonner";

interface Recipient {
  id: string;
  address: string;
  amount: number;
  label?: string;
}

export default function BulkSendPage() {
  const { isLoggedIn, login } = useApp();
  const [recipients, setRecipients] = useState<Recipient[]>([
    { id: "1", address: "0x1234567890abcdef1234567890abcdef12345678", amount: 50, label: "Team Member 1" },
    { id: "2", address: "0xabcdef1234567890abcdef1234567890abcdef12", amount: 75, label: "Team Member 2" },
    { id: "3", address: "0x9876543210fedcba9876543210fedcba98765432", amount: 100, label: "Contractor" },
  ]);
  const [showAddForm, setShowAddForm] = useState(false);
  const [sending, setSending] = useState(false);
  const [splitEvenly, setSplitEvenly] = useState(false);
  const [splitAmount, setSplitAmount] = useState(0);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const newRecipient = { address: "", amount: "", label: "" };

  const totalAmount = recipients.reduce((sum, r) => sum + r.amount, 0);
  const uniqueRecipients = recipients.length;

  const handleAddRecipient = () => {
    if (!newRecipient.address || !newRecipient.amount) {
      toast.error("Please fill in address and amount");
      return;
    }
    setRecipients([
      ...recipients,
      { id: Date.now().toString(), ...newRecipient, amount: parseFloat(newRecipient.amount) },
    ]);
    setShowAddForm(false);
    toast.success("Recipient added");
  };

  const handleRemoveRecipient = (id: string) => {
    setRecipients(recipients.filter(r => r.id !== id));
    toast.success("Recipient removed");
  };

  const handleCSVUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (event) => {
      const content = event.target?.result as string;
      const lines = content.split("\n").filter(line => line.trim());
      const parsed: Recipient[] = lines.slice(1).map((line, i) => {
        const [address, amount, label] = line.split(",");
        return {
          id: Date.now().toString() + i,
          address: address?.trim() || "",
          amount: parseFloat(amount?.trim() || "0"),
          label: label?.trim() || undefined,
        };
      }).filter(r => r.address && r.amount > 0);

      if (parsed.length > 0) {
        setRecipients([...recipients, ...parsed]);
        toast.success(`Imported ${parsed.length} recipients`);
      } else {
        toast.error("Invalid CSV format");
      }
    };
    reader.readAsText(file);
  };

  const handleSplitEvenly = () => {
    if (splitAmount <= 0) {
      toast.error("Please enter a valid amount");
      return;
    }
    const perPerson = splitAmount / recipients.length;
    setRecipients(recipients.map(r => ({ ...r, amount: perPerson })));
    toast.success(`Split $${splitAmount} evenly among ${recipients.length} recipients`);
  };

  const handleSendAll = async () => {
    if (recipients.length === 0) {
      toast.error("Please add at least one recipient");
      return;
    }
    setSending(true);
    setSending(false);
    toast.success(`Sent $${totalAmount.toFixed(2)} to ${uniqueRecipients} recipients!`);
    setRecipients([]);
  };

  if (!isLoggedIn) {
    return (
      <div className="min-h-screen bg-background">
        <AppHeader />
        <div className="flex min-h-[80vh] flex-col items-center justify-center px-4 text-center">
          <div className="mb-6 flex h-20 w-20 items-center justify-center rounded-full bg-primary/10">
            <Users className="h-10 w-10 text-primary" />
          </div>
          <h2 className="mb-3 font-display text-2xl text-foreground sm:text-3xl">Bulk Send</h2>
          <p className="mb-6 max-w-md text-sm text-muted-foreground">
            Send USDC to multiple recipients at once. Upload a CSV or add manually.
          </p>
          <button onClick={login} className="rounded-lg bg-primary px-6 py-3 font-semibold text-primary-foreground shadow-glow hover:opacity-90">
            Sign In to Use Bulk Send
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
          <h1 className="font-display text-2xl text-foreground sm:text-3xl">Bulk Send</h1>
          <p className="mt-1 text-sm text-muted-foreground">Send payments to multiple recipients at once</p>
        </div>

        <div className="mb-6 grid gap-4 sm:grid-cols-3">
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            className="rounded-xl border border-border bg-card p-5"
          >
            <div className="mb-2 flex h-10 w-10 items-center justify-center rounded-lg bg-primary/10">
              <Users className="h-5 w-5 text-primary" />
            </div>
            <p className="text-2xl font-bold text-foreground">{uniqueRecipients}</p>
            <p className="text-sm text-muted-foreground">Recipients</p>
          </motion.div>
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
            className="rounded-xl border border-border bg-card p-5"
          >
            <div className="mb-2 flex h-10 w-10 items-center justify-center rounded-lg bg-green-500/10">
              <DollarSign className="h-5 w-5 text-green-500" />
            </div>
            <p className="text-2xl font-bold text-green-500">${totalAmount.toFixed(2)}</p>
            <p className="text-sm text-muted-foreground">Total Amount</p>
          </motion.div>
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.15 }}
            className="rounded-xl border border-border bg-card p-5"
          >
            <div className="mb-2 flex h-10 w-10 items-center justify-center rounded-lg bg-yellow-500/10">
              <FileText className="h-5 w-5 text-yellow-500" />
            </div>
            <p className="text-2xl font-bold text-foreground">USDC</p>
            <p className="text-sm text-muted-foreground">Token</p>
          </motion.div>
        </div>

        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
          className="mb-6 rounded-xl border border-border bg-card p-6"
        >
          <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
            <h2 className="flex items-center gap-2 text-lg font-semibold text-foreground">
              <Users className="h-5 w-5 text-primary" />
              Recipients
            </h2>
            <div className="flex gap-2">
              <button
                onClick={() => fileInputRef.current?.click()}
                className="flex items-center gap-2 rounded-lg border border-border px-3 py-2 text-sm font-medium hover:bg-secondary"
              >
                <Upload className="h-4 w-4" />
                Import CSV
              </button>
              <input
                ref={fileInputRef}
                type="file"
                accept=".csv"
                onChange={handleCSVUpload}
                className="hidden"
              />
              <button
                onClick={() => setShowAddForm(true)}
                className="flex items-center gap-2 rounded-lg bg-primary px-3 py-2 text-sm font-medium text-primary-foreground hover:opacity-90"
              >
                <Plus className="h-4 w-4" />
                Add
              </button>
            </div>
          </div>

          {showAddForm && (
            <div className="mb-4 rounded-lg border border-border bg-secondary/50 p-4">
              <div className="grid gap-3 sm:grid-cols-3">
                <input
                  type="text"
                  placeholder="Address (0x...)"
                  value={newRecipient.address}
                  onChange={(e) => setRecipients([...recipients, { id: "", address: e.target.value }])}
                  className="rounded-lg border border-border bg-background px-3 py-2 font-mono text-sm focus:border-primary focus:outline-none"
                />
                <input
                  type="number"
                  placeholder="Amount"
                  value={newRecipient.amount}
                  onChange={(e) => Object.assign(newRecipient, { amount: e.target.value })}
                  className="rounded-lg border border-border bg-background px-3 py-2 text-sm focus:border-primary focus:outline-none"
                />
                <input
                  type="text"
                  placeholder="Label (optional)"
                  value={newRecipient.label}
                  onChange={(e) => Object.assign(newRecipient, { label: e.target.value })}
                  className="rounded-lg border border-border bg-background px-3 py-2 text-sm focus:border-primary focus:outline-none"
                />
              </div>
              <div className="mt-3 flex gap-2">
                <button
                  onClick={() => setShowAddForm(false)}
                  className="flex-1 rounded-lg border border-border px-3 py-2 text-sm font-medium hover:bg-secondary"
                >
                  Cancel
                </button>
                <button
                  onClick={handleAddRecipient}
                  className="flex-1 rounded-lg bg-primary px-3 py-2 text-sm font-medium text-primary-foreground hover:opacity-90"
                >
                  Add Recipient
                </button>
              </div>
            </div>
          )}

          <div className="mb-4 rounded-lg border border-border">
            <table className="w-full text-sm">
              <thead className="border-b border-border bg-secondary/50">
                <tr className="text-left text-muted-foreground">
                  <th className="px-4 py-3">Label</th>
                  <th className="px-4 py-3">Address</th>
                  <th className="px-4 py-3 text-right">Amount</th>
                  <th className="w-12 px-4 py-3"></th>
                </tr>
              </thead>
              <tbody>
                {recipients.map((recipient) => (
                  <tr key={recipient.id} className="border-b border-border last:border-b-0">
                    <td className="px-4 py-3 font-medium text-foreground">
                      {recipient.label || "-"}
                    </td>
                    <td className="px-4 py-3 font-mono text-muted-foreground">
                      {recipient.address.slice(0, 8)}...{recipient.address.slice(-6)}
                    </td>
                    <td className="px-4 py-3 text-right font-medium text-foreground">
                      ${recipient.amount.toFixed(2)}
                    </td>
                    <td className="px-4 py-3">
                      <button
                        onClick={() => handleRemoveRecipient(recipient.id)}
                        className="rounded-lg p-1 hover:bg-secondary"
                      >
                        <Trash2 className="h-4 w-4 text-red-500" />
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          <div className="mb-4 rounded-lg border border-yellow-500/20 bg-yellow-500/5 p-4">
            <div className="flex items-center gap-2">
              <AlertCircle className="h-5 w-5 text-yellow-500" />
              <p className="text-sm text-foreground">
                Review all recipients carefully before sending. Transactions cannot be reversed.
              </p>
            </div>
          </div>

          <button
            onClick={handleSendAll}
            disabled={sending || recipients.length === 0}
            className="flex w-full items-center justify-center gap-2 rounded-lg bg-primary px-4 py-3 font-semibold text-primary-foreground shadow-glow hover:opacity-90 disabled:opacity-50"
          >
            {sending ? (
              <>
                <Loader2 className="h-5 w-5 animate-spin" />
                Sending...
              </>
            ) : (
              <>
                <Send className="h-5 w-5" />
                Send ${totalAmount.toFixed(2)} to {uniqueRecipients} Recipients
              </>
            )}
          </button>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3 }}
          className="rounded-xl border border-border bg-card p-6"
        >
          <h3 className="mb-4 font-semibold text-foreground">Quick Actions</h3>
          <div className="flex flex-wrap gap-3">
            <button
              onClick={() => setRecipients([])}
              className="flex items-center gap-2 rounded-lg border border-border px-4 py-2 text-sm font-medium hover:bg-secondary"
            >
              Clear All
            </button>
            <button
              onClick={() => {
                setSplitEvenly(true);
              }}
              className="flex items-center gap-2 rounded-lg border border-border px-4 py-2 text-sm font-medium hover:bg-secondary"
            >
              Split Evenly
            </button>
          </div>
          {splitEvenly && (
            <div className="mt-4 flex gap-3">
              <input
                type="number"
                placeholder="Total amount"
                value={splitAmount || ""}
                onChange={(e) => setSplitAmount(parseFloat(e.target.value) || 0)}
                className="flex-1 rounded-lg border border-border bg-background px-4 py-2 text-sm focus:border-primary focus:outline-none"
              />
              <button
                onClick={handleSplitEvenly}
                className="rounded-lg bg-primary px-4 py-2 text-sm font-medium text-primary-foreground hover:opacity-90"
              >
                Split
              </button>
            </div>
          )}
        </motion.div>
      </div>
      <Footer />
    </div>
  );
}
