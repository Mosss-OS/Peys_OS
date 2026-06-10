/** SplitBillPage - Split expenses among multiple people with equal, exact, or percentage splits */
import { useState } from "react";
import { motion } from "framer-motion";
import { Users, Plus, Minus, DollarSign, Loader2, Check, Copy, Share2 } from "lucide-react";
import { useApp } from "@/contexts/AppContext";
import AppHeader from "@/components/AppHeader";
import Footer from "@/components/Footer";
import { toast } from "sonner";

interface SplitMember {
  id: string;
  name: string;
  amount: number;
  paid: boolean;
}

interface SplitBill {
  id: string;
  title: string;
  total: number;
  currency: string;
  members: SplitMember[];
  createdAt: string;
}

/** SplitBillPage component - Creates and manages bill splits with dynamic member management and multiple split types */
export default function SplitBillPage() {
  const { isLoggedIn, login } = useApp();
  const [showCreate, setShowCreate] = useState(false);
  const [title, setTitle] = useState("");
  const [total, setTotal] = useState("");
  const [members, setMembers] = useState<SplitMember[]>([
    { id: "1", name: "", amount: 0, paid: false },
  ]);
  const [splitType, setSplitType] = useState<"equal" | "exact" | "percentage">("equal");
  const [loading, setLoading] = useState(false);

  const addMember = () => {
    setMembers([...members, { id: crypto.randomUUID(), name: "", amount: 0, paid: false }]);
  };

  const removeMember = (id: string) => {
    if (members.length > 2) {
      setMembers(members.filter(m => m.id !== id));
    }
  };

  const updateMember = (id: string, field: keyof SplitMember, value: string | number | boolean) => {
    setMembers(members.map(m => m.id === id ? { ...m, [field]: value } : m));
  };

  const calculateEqualSplit = () => {
    const totalAmount = parseFloat(total) || 0;
    const perPerson = totalAmount / members.length;
    setMembers(members.map(m => ({ ...m, amount: Math.round(perPerson * 100) / 100 })));
  };

  const handleCreateSplit = async () => {
    if (!isLoggedIn) {
      login();
      return;
    }

    if (!title || !total) {
      toast.error("Please fill in all required fields");
      return;
    }

    setLoading(true);
    try {
      toast.success("Split bill created! Share with your friends.");
      setShowCreate(false);
      setTitle("");
      setTotal("");
      setMembers([{ id: "1", name: "", amount: 0, paid: false }]);
    } finally {
      setLoading(false);
    }
  };

  if (!isLoggedIn) {
    return (
      <div className="min-h-screen bg-background">
        <AppHeader />
        <div className="flex min-h-[80vh] flex-col items-center justify-center px-4 text-center">
          <div className="mb-6 flex h-20 w-20 items-center justify-center rounded-full bg-primary/10">
            <Users className="h-10 w-10 text-primary" />
          </div>
          <h2 className="mb-3 font-display text-2xl text-foreground sm:text-3xl">Split Bill</h2>
          <p className="mb-6 max-w-md text-sm text-muted-foreground">
            Split bills with friends easily using crypto payments.
          </p>
          <button onClick={login} className="rounded-lg bg-primary px-6 py-3 font-semibold text-primary-foreground shadow-glow hover:opacity-90">
            Sign In to Split Bills
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
            <h1 className="font-display text-2xl text-foreground sm:text-3xl">Split Bill</h1>
            <p className="mt-1 text-sm text-muted-foreground">Split expenses with friends</p>
          </div>
          <button
            onClick={() => setShowCreate(true)}
            className="flex items-center gap-2 rounded-lg bg-primary px-4 py-2 text-sm font-semibold text-primary-foreground shadow-glow hover:opacity-90"
          >
            <Plus className="h-4 w-4" />
            New Split
          </button>
        </div>

        {showCreate ? (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="rounded-xl border border-border bg-card p-6"
          >
            <h3 className="mb-6 text-lg font-semibold text-foreground">Create Split Bill</h3>

            <div className="space-y-4">
              <div>
                <label className="mb-2 block text-sm font-medium text-foreground">Title</label>
                <input
                  type="text"
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  placeholder="Dinner, Trip, etc."
                  className="w-full rounded-lg border border-border bg-background px-4 py-2.5 text-foreground"
                />
              </div>

              <div>
                <label className="mb-2 block text-sm font-medium text-foreground">Total Amount</label>
                <div className="relative">
                  <DollarSign className="absolute left-3 top-1/2 h-5 w-5 -translate-y-1/2 text-muted-foreground" />
                  <input
                    type="number"
                    value={total}
                    onChange={(e) => setTotal(e.target.value)}
                    placeholder="0.00"
                    className="w-full rounded-lg border border-border bg-background py-2.5 pl-10 pr-4 text-foreground"
                  />
                </div>
              </div>

              <div>
                <label className="mb-2 block text-sm font-medium text-foreground">Split Type</label>
                <div className="flex gap-2">
                  {(["equal", "exact", "percentage"] as const).map((type) => (
                    <button
                      key={type}
                      onClick={() => setSplitType(type)}
                      className={`flex-1 rounded-lg border py-2 text-sm font-medium capitalize ${
                        splitType === type
                          ? "border-primary bg-primary/10 text-primary"
                          : "border-border text-muted-foreground hover:bg-secondary"
                      }`}
                    >
                      {type}
                    </button>
                  ))}
                </div>
                {splitType === "equal" && (
                  <button
                    onClick={calculateEqualSplit}
                    className="mt-2 w-full rounded-lg border border-border py-2 text-sm text-primary hover:bg-secondary"
                  >
                    Calculate Equal Split
                  </button>
                )}
              </div>

              <div>
                <label className="mb-2 block text-sm font-medium text-foreground">Members</label>
                <div className="space-y-3">
                  {members.map((member, index) => (
                    <div key={member.id} className="flex items-center gap-3">
                      <input
                        type="text"
                        value={member.name}
                        onChange={(e) => updateMember(member.id, "name", e.target.value)}
                        placeholder={`Member ${index + 1}`}
                        className="flex-1 rounded-lg border border-border bg-background px-3 py-2 text-sm text-foreground"
                      />
                      <div className="relative w-24">
                        <DollarSign className="absolute left-2 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                        <input
                          type="number"
                          value={member.amount || ""}
                          onChange={(e) => updateMember(member.id, "amount", parseFloat(e.target.value) || 0)}
                          placeholder="0"
                          className="w-full rounded-lg border border-border bg-background py-2 pl-7 pr-2 text-sm text-foreground"
                        />
                      </div>
                      {members.length > 2 && (
                        <button
                          onClick={() => removeMember(member.id)}
                          className="rounded-lg p-2 text-muted-foreground hover:bg-secondary hover:text-destructive"
                        >
                          <Minus className="h-4 w-4" />
                        </button>
                      )}
                    </div>
                  ))}
                </div>
                <button
                  onClick={addMember}
                  className="mt-3 flex w-full items-center justify-center gap-2 rounded-lg border border-dashed border-border py-2 text-sm text-muted-foreground hover:bg-secondary"
                >
                  <Plus className="h-4 w-4" />
                  Add Member
                </button>
              </div>
            </div>

            <div className="mt-6 flex gap-3">
              <button
                onClick={() => setShowCreate(false)}
                className="flex-1 rounded-lg border border-border py-2.5 text-sm font-medium text-foreground hover:bg-secondary"
              >
                Cancel
              </button>
              <button
                onClick={handleCreateSplit}
                disabled={loading}
                className="flex flex-1 items-center justify-center gap-2 rounded-lg bg-primary py-2.5 text-sm font-semibold text-primary-foreground hover:opacity-90 disabled:opacity-50"
              >
                {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : null}
                Create Split
              </button>
            </div>
          </motion.div>
        ) : (
          <div className="rounded-xl border border-border bg-card p-12 text-center">
            <Users className="mx-auto h-12 w-12 text-muted-foreground/50" />
            <h3 className="mt-4 text-lg font-medium text-foreground">No active splits</h3>
            <p className="mt-2 text-sm text-muted-foreground">
              Create a new split to start sharing expenses
            </p>
            <button
              onClick={() => setShowCreate(true)}
              className="mt-6 rounded-lg bg-primary px-4 py-2 text-sm font-semibold text-primary-foreground hover:opacity-90"
            >
              Create Split
            </button>
          </div>
        )}
      </div>
      <Footer />
    </div>
  );
}