import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import {
  Wallet,
  Copy,
  Check,
  Plus,
  RefreshCw,
  Trash2,
  Building2,
  QrCode,
  Loader2,
  Globe,
  Shield,
  AlertCircle,
  ExternalLink,
  CreditCard,
} from "lucide-react";
import { useApp } from "@/contexts/AppContext";
import AppHeader from "@/components/AppHeader";
import Footer from "@/components/Footer";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { SUPPORTED_COUNTRIES, formatCurrency } from "@/services/flutterwaveService";

interface VirtualAccount {
  id: string;
  account_number: string;
  bank_name: string;
  flutterwave_ref: string;
  currency: string;
  status: string;
  is_primary: boolean;
}

interface Deposit {
  id: string;
  amount: number;
  currency: string;
  status: string;
  created_at: string;
  reference: string;
}

export default function ReceiveDepositsPage() {
  const { isLoggedIn, login, walletAddress } = useApp();
  const [virtualAccounts, setVirtualAccounts] = useState<VirtualAccount[]>([]);
  const [deposits, setDeposits] = useState<Deposit[]>([]);
  const [loading, setLoading] = useState(true);
  const [creating, setCreating] = useState(false);
  const [copiedAccount, setCopiedAccount] = useState<string | null>(null);
  const [showCreate, setShowCreate] = useState(false);
  const [selectedCurrency, setSelectedCurrency] = useState("NGN");
  const [userProfile, setUserProfile] = useState<any>(null);

  useEffect(() => {
    if (isLoggedIn && walletAddress) {
      fetchVirtualAccounts();
      fetchDeposits();
      fetchUserProfile();
    }
  }, [isLoggedIn, walletAddress]);

  const fetchUserProfile = async () => {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return;

    const { data: profile } = await supabase
      .from("profiles")
      .select("*")
      .eq("user_id", user.id)
      .single();

    if (profile) {
      setUserProfile(profile);
    } else {
      const { data: authUser } = await supabase.auth.getUser();
      if (authUser.user) {
        setUserProfile({
          email: authUser.user.email,
          full_name: authUser.user.user_metadata?.full_name || "",
        });
      }
    }
  };

  const fetchVirtualAccounts = async () => {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return;

    try {
      const { data, error } = await supabase
        .from("virtual_accounts")
        .select("*")
        .eq("user_id", user.id)
        .order("is_primary", { ascending: false })
        .order("created_at", { ascending: false });

      if (error) throw error;
      setVirtualAccounts(data || []);
    } catch (error) {
      console.error("Failed to fetch virtual accounts:", error);
    } finally {
      setLoading(false);
    }
  };

  const fetchDeposits = async () => {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return;

    try {
      const { data, error } = await supabase
        .from("fiat_deposits")
        .select("*")
        .eq("user_id", user.id)
        .order("created_at", { ascending: false })
        .limit(20);

      if (error) throw error;
      setDeposits(data || []);
    } catch (error) {
      console.error("Failed to fetch deposits:", error);
    }
  };

  const createVirtualAccount = async () => {
    if (!userProfile?.email) {
      toast.error("Please complete your profile first");
      return;
    }

    setCreating(true);
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      const names = (userProfile.full_name || user.email?.split("@")[0] || "User").split(" ");
      const firstName = names[0] || "User";
      const lastName = names.slice(1).join(" ") || "Peydot";

      const { data, error } = await supabase.functions.invoke("create-virtual-account", {
        body: {
          userId: user.id,
          email: userProfile.email || user.email,
          firstName,
          lastName,
          phone: userProfile.phone || "",
          currency: selectedCurrency,
        },
      });

      if (error || !data?.success) {
        toast.error("Failed to create virtual account. Please try again.");
        return;
      }

      toast.success("Virtual account created successfully!");
      fetchVirtualAccounts();
      setShowCreate(false);
    } catch (error) {
      console.error("Failed to create virtual account:", error);
      toast.error("Failed to create virtual account");
    } finally {
      setCreating(false);
    }
  };

  const copyToClipboard = async (text: string, accountId: string) => {
    await navigator.clipboard.writeText(text);
    setCopiedAccount(accountId);
    toast.success("Copied to clipboard!");
    setTimeout(() => setCopiedAccount(null), 2000);
  };

  const deleteVirtualAccount = async (accountId: string) => {
    if (!confirm("Are you sure you want to delete this virtual account?")) return;

    try {
      await supabase.from("virtual_accounts").delete().eq("id", accountId);
      toast.success("Account deleted");
      fetchVirtualAccounts();
    } catch (error) {
      toast.error("Failed to delete account");
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case "active":
      case "completed":
        return "text-green-500 bg-green-500/10";
      case "pending":
        return "text-yellow-500 bg-yellow-500/10";
      case "inactive":
      case "failed":
        return "text-red-500 bg-red-500/10";
      default:
        return "text-gray-500 bg-gray-500/10";
    }
  };

  const totalDeposits = deposits
    .filter((d) => d.status === "completed")
    .reduce((sum, d) => sum + d.amount, 0);

  if (!isLoggedIn) {
    return (
      <div className="min-h-screen bg-background">
        <AppHeader />
        <div className="flex min-h-[80vh] flex-col items-center justify-center px-4 text-center">
          <div className="mb-6 flex h-20 w-20 items-center justify-center rounded-full bg-primary/10">
            <Wallet className="h-10 w-10 text-primary" />
          </div>
          <h2 className="mb-3 font-display text-2xl text-foreground sm:text-3xl">
            Receive Fiat Deposits
          </h2>
          <p className="mb-6 max-w-md text-sm text-muted-foreground">
            Get a virtual bank account to receive deposits directly into your Peys wallet
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
        <div className="mb-8">
          <h1 className="font-display text-2xl text-foreground sm:text-3xl">
            Receive Fiat Deposits
          </h1>
          <p className="mt-1 text-sm text-muted-foreground">
            Get a virtual bank account to receive deposits from anywhere in Africa
          </p>
        </div>

        <div className="mb-6 grid gap-4 sm:grid-cols-3">
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            className="rounded-xl border border-border bg-card p-5"
          >
            <div className="mb-2 flex h-10 w-10 items-center justify-center rounded-lg bg-green-500/10">
              <Building2 className="h-5 w-5 text-green-500" />
            </div>
            <p className="text-2xl font-bold text-foreground">{virtualAccounts.length}</p>
            <p className="text-sm text-muted-foreground">Virtual Accounts</p>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
            className="rounded-xl border border-border bg-card p-5"
          >
            <div className="mb-2 flex h-10 w-10 items-center justify-center rounded-lg bg-primary/10">
              <Wallet className="h-5 w-5 text-primary" />
            </div>
            <p className="text-2xl font-bold text-foreground">
              {formatCurrency(totalDeposits, "NGN")}
            </p>
            <p className="text-sm text-muted-foreground">Total Deposits</p>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
            className="rounded-xl border border-border bg-card p-5"
          >
            <div className="mb-2 flex h-10 w-10 items-center justify-center rounded-lg bg-blue-500/10">
              <Globe className="h-5 w-5 text-blue-500" />
            </div>
            <p className="text-2xl font-bold text-foreground">15+</p>
            <p className="text-sm text-muted-foreground">Supported Countries</p>
          </motion.div>
        </div>

        <div className="mb-6 rounded-xl border border-primary/20 bg-primary/5 p-4">
          <div className="flex items-start gap-3">
            <Shield className="mt-1 h-5 w-5 flex-shrink-0 text-primary" />
            <div>
              <p className="font-medium text-foreground">How it works</p>
              <p className="mt-1 text-sm text-muted-foreground">
                Create a virtual account in your preferred currency. Share the account
                details with anyone to receive deposits. Funds are automatically
                converted to USDC in your Peys wallet.
              </p>
            </div>
          </div>
        </div>

        <div className="mb-6 flex items-center justify-between">
          <h2 className="text-lg font-semibold">Your Virtual Accounts</h2>
          <button
            onClick={() => setShowCreate(true)}
            className="flex items-center gap-2 rounded-lg bg-primary px-4 py-2 text-sm font-medium text-primary-foreground"
          >
            <Plus className="h-4 w-4" />
            Create New
          </button>
        </div>

        {loading ? (
          <div className="flex items-center justify-center py-12">
            <Loader2 className="h-8 w-8 animate-spin text-primary" />
          </div>
        ) : virtualAccounts.length === 0 ? (
          <div className="rounded-xl border border-border bg-card p-12 text-center">
            <Building2 className="mx-auto mb-4 h-12 w-12 text-muted-foreground" />
            <h3 className="mb-2 text-lg font-medium text-foreground">
              No virtual accounts yet
            </h3>
            <p className="mb-6 text-sm text-muted-foreground">
              Create your first virtual account to start receiving deposits
            </p>
            <button
              onClick={() => setShowCreate(true)}
              className="rounded-lg bg-primary px-6 py-2 text-sm font-medium text-primary-foreground"
            >
              Create Account
            </button>
          </div>
        ) : (
          <div className="space-y-4">
            {virtualAccounts.map((account) => (
              <motion.div
                key={account.id}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                className="rounded-xl border border-border bg-card p-6"
              >
                <div className="mb-4 flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className="flex h-10 w-10 items-center justify-center rounded-full bg-primary/10">
                      <Building2 className="h-5 w-5 text-primary" />
                    </div>
                    <div>
                      <p className="font-semibold text-foreground">{account.bank_name}</p>
                      <p className="text-sm text-muted-foreground">{account.currency}</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <span
                      className={`rounded-full px-3 py-1 text-xs font-medium capitalize ${getStatusColor(
                        account.status
                      )}`}
                    >
                      {account.status}
                    </span>
                    {account.is_primary && (
                      <span className="rounded-full bg-primary/10 px-3 py-1 text-xs font-medium text-primary">
                        Primary
                      </span>
                    )}
                  </div>
                </div>

                <div className="mb-4 rounded-lg bg-muted p-4">
                  <p className="mb-1 text-xs text-muted-foreground">Account Number</p>
                  <div className="flex items-center justify-between">
                    <p className="text-2xl font-bold tracking-wider text-foreground">
                      {account.account_number}
                    </p>
                    <button
                      onClick={() =>
                        copyToClipboard(account.account_number, account.id)
                      }
                      className="rounded-lg p-2 hover:bg-background"
                    >
                      {copiedAccount === account.id ? (
                        <Check className="h-5 w-5 text-green-500" />
                      ) : (
                        <Copy className="h-5 w-5" />
                      )}
                    </button>
                  </div>
                </div>

                <div className="flex items-center justify-between">
                  <p className="text-xs text-muted-foreground">
                    Created {new Date(account.created_at).toLocaleDateString()}
                  </p>
                  <button
                    onClick={() => deleteVirtualAccount(account.id)}
                    className="flex items-center gap-1 rounded-lg p-2 text-sm text-red-500 hover:bg-red-500/10"
                  >
                    <Trash2 className="h-4 w-4" />
                    Delete
                  </button>
                </div>
              </motion.div>
            ))}
          </div>
        )}

        {deposits.length > 0 && (
          <div className="mt-12">
            <h2 className="mb-4 text-lg font-semibold">Recent Deposits</h2>
            <div className="space-y-3">
              {deposits.slice(0, 5).map((deposit) => (
                <div
                  key={deposit.id}
                  className="flex items-center justify-between rounded-lg border border-border bg-card p-4"
                >
                  <div className="flex items-center gap-3">
                    <div className="flex h-10 w-10 items-center justify-center rounded-full bg-green-500/10">
                      <CreditCard className="h-5 w-5 text-green-500" />
                    </div>
                    <div>
                      <p className="font-medium text-foreground">
                        {formatCurrency(deposit.amount, deposit.currency)}
                      </p>
                      <p className="text-xs text-muted-foreground">
                        {new Date(deposit.created_at).toLocaleDateString()}
                      </p>
                    </div>
                  </div>
                  <span
                    className={`rounded-full px-3 py-1 text-xs font-medium capitalize ${getStatusColor(
                      deposit.status
                    )}`}
                  >
                    {deposit.status}
                  </span>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>

      {showCreate && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
          <motion.div
            initial={{ scale: 0.95, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            className="w-full max-w-md rounded-xl border border-border bg-card p-6"
          >
            <h3 className="mb-4 text-lg font-semibold">Create Virtual Account</h3>

            <div className="mb-4">
              <label className="mb-2 block text-sm font-medium">Currency</label>
              <select
                value={selectedCurrency}
                onChange={(e) => setSelectedCurrency(e.target.value)}
                className="w-full rounded-lg border border-border bg-background px-4 py-3"
              >
                {SUPPORTED_COUNTRIES.map((country) => (
                  <option key={country.code} value={country.currency}>
                    {country.flag} {country.name} ({country.currency})
                  </option>
                ))}
              </select>
            </div>

            <p className="mb-4 text-sm text-muted-foreground">
              A unique bank account number will be generated for you. Anyone can
              send money to this account and it will appear in your Peys wallet.
            </p>

            <div className="flex gap-3">
              <button
                onClick={() => setShowCreate(false)}
                className="flex-1 rounded-lg border border-border py-3 font-medium"
              >
                Cancel
              </button>
              <button
                onClick={createVirtualAccount}
                disabled={creating}
                className="flex flex-1 items-center justify-center gap-2 rounded-lg bg-primary py-3 font-semibold text-primary-foreground disabled:opacity-50"
              >
                {creating ? (
                  <Loader2 className="h-5 w-5 animate-spin" />
                ) : (
                  "Create Account"
                )}
              </button>
            </div>
          </motion.div>
        </div>
      )}

      <Footer />
    </div>
  );
}
