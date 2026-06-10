import { useState, useEffect, useMemo } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  Building2,
  Plus,
  Trash2,
  ArrowRight,
  Loader2,
  Search,
  Check,
  AlertCircle,
  Banknote,
  Users,
  Clock,
  X,
  RefreshCw,
  Zap,
  ShieldCheck,
} from "lucide-react";
import { useApp } from "@/contexts/AppContext";
import AppHeader from "@/components/AppHeader";
import Footer from "@/components/Footer";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import {
  flutterwaveService,
  SUPPORTED_COUNTRIES,
  CURRENCY_SYMBOLS,
  getUserBankAccounts,
  saveBankAccount,
  deleteBankAccount,
  createWithdrawal,
  getUserWithdrawals,
  getP2POrders,
  createP2POrder,
  matchP2POrder,
} from "@/services/flutterwaveService";

interface BankAccount {
  id: string;
  bank_name: string;
  bank_code: string;
  account_number: string;
  account_name: string;
  country: string;
  is_primary: boolean;
}

interface Withdrawal {
  id: string;
  amount_fiat: number;
  amount_usdc: number;
  currency: string;
  status: string;
  created_at: string;
  bank_accounts?: BankAccount;
}

type Tab = "withdraw" | "accounts" | "history" | "p2p";

export default function FiatWithdrawalPage() {
  const { isLoggedIn, login, walletAddress } = useApp();
  const [activeTab, setActiveTab] = useState<Tab>("withdraw");
  
  const [country, setCountry] = useState("NG");
  const [currency, setCurrency] = useState("NGN");
  const [fiatAmount, setFiatAmount] = useState("");
  const [usdcAmount, setUsdcAmount] = useState("");
  const [exchangeRate, setExchangeRate] = useState(1520);
  const [fee, setFee] = useState(0);
  
  const [banks, setBanks] = useState<any[]>([]);
  const [bankSearch, setBankSearch] = useState("");
  const [showBankDropdown, setShowBankDropdown] = useState(false);
  const [selectedBank, setSelectedBank] = useState<any>(null);
  const [accountNumber, setAccountNumber] = useState("");
  const [accountName, setAccountName] = useState("");
  const [accountVerified, setAccountVerified] = useState(false);
  const [verifying, setVerifying] = useState(false);
  const [verificationError, setVerificationError] = useState("");
  
  const [savedAccounts, setSavedAccounts] = useState<BankAccount[]>([]);
  const [selectedAccount, setSelectedAccount] = useState<BankAccount | null>(null);
  const [showAddAccount, setShowAddAccount] = useState(false);
  
  const [withdrawals, setWithdrawals] = useState<Withdrawal[]>([]);
  const [processing, setProcessing] = useState(false);
  
  const [p2pOrders, setP2POrders] = useState<any[]>([]);
  const [p2pType, setP2pType] = useState<"buy" | "sell">("buy");
  const [p2pPrice, setP2pPrice] = useState("");
  const [p2pAmount, setP2pAmount] = useState("");
  const [creatingOrder, setCreatingOrder] = useState(false);

  const filteredBanks = useMemo(() => {
    if (!bankSearch) return banks;
    const search = bankSearch.toLowerCase();
    return banks.filter(bank => 
      bank.name.toLowerCase().includes(search) || 
      bank.code.toLowerCase().includes(search)
    );
  }, [banks, bankSearch]);

  useEffect(() => {
    if (isLoggedIn && walletAddress) {
      fetchSavedAccounts();
      fetchWithdrawals();
      fetchP2POrders();
    }
  }, [isLoggedIn, walletAddress]);

  useEffect(() => {
    const countryObj = SUPPORTED_COUNTRIES.find((c) => c.code === country);
    if (countryObj) {
      setCurrency(countryObj.currency);
    }
    setSelectedBank(null);
    setBankSearch("");
  }, [country]);

  useEffect(() => {
    if (fiatAmount && parseFloat(fiatAmount) > 0) {
      fetchExchangeRate();
    } else {
      setUsdcAmount("");
    }
  }, [fiatAmount, currency]);

  useEffect(() => {
    fetchBanks();
  }, [country]);

  useEffect(() => {
    if (accountNumber.length >= 10 && selectedBank && !accountVerified) {
      verifyAccount();
    }
  }, [accountNumber]);

  const fetchExchangeRate = async () => {
    if (!fiatAmount) return;
    try {
      const rate = 1520;
      setExchangeRate(rate);
      const calculatedUsdc = parseFloat(fiatAmount) / rate;
      setUsdcAmount(calculatedUsdc.toFixed(2));
      setFee(Math.max(parseFloat(fiatAmount) * 0.01, 50));
    } catch (error) {
      console.error("Failed to fetch rate:", error);
    }
  };

  const fetchBanks = async () => {
    const banksList = await flutterwaveService.getBanks(country);
    setBanks(banksList);
  };

  const fetchSavedAccounts = async () => {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return;
    const accounts = await getUserBankAccounts(user.id);
    setSavedAccounts(accounts);
  };

  const fetchWithdrawals = async () => {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return;
    const history = await getUserWithdrawals(user.id);
    setWithdrawals(history);
  };

  const fetchP2POrders = async () => {
    const orders = await getP2POrders(p2pType, currency, 20);
    setP2POrders(orders);
  };

  const verifyAccount = async () => {
    if (!selectedBank || accountNumber.length < 10) return;
    setVerifying(true);
    setVerificationError("");
    try {
      const result = await flutterwaveService.resolveAccount(
        selectedBank.code,
        accountNumber,
        country
      );
      if (result.is_valid) {
        setAccountName(result.account_name);
        setAccountVerified(true);
      } else {
        setAccountVerified(false);
        setAccountName("");
        setVerificationError("Could not verify account. Please check details.");
      }
    } catch (error) {
      setVerificationError("Verification failed. Please try again.");
    } finally {
      setVerifying(false);
    }
  };

  const handleSelectBank = (bank: any) => {
    setSelectedBank(bank);
    setShowBankDropdown(false);
    setBankSearch("");
    setAccountNumber("");
    setAccountName("");
    setAccountVerified(false);
    setVerificationError("");
  };

  const handleSelectSavedAccount = (acc: BankAccount) => {
    setSelectedAccount(acc);
    const countryObj = SUPPORTED_COUNTRIES.find((c) => c.code === acc.country);
    if (countryObj) {
      setCountry(acc.country);
      setCurrency(countryObj.currency);
    }
    setSelectedBank({ code: acc.bank_code, name: acc.bank_name });
    setAccountNumber(acc.account_number);
    setAccountName(acc.account_name);
    setAccountVerified(true);
  };

  const handleAddAccount = async () => {
    if (!selectedBank || !accountNumber || !accountName) {
      toast.error("Please verify your account first");
      return;
    }
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return;
    
    const result = await saveBankAccount(
      user.id,
      selectedBank.code,
      selectedBank.name,
      accountNumber,
      accountName,
      country
    );
    
    if (result) {
      toast.success("Bank account saved!");
      setShowAddAccount(false);
      fetchSavedAccounts();
      handleSelectSavedAccount(result);
    }
  };

  const handleWithdraw = async () => {
    if (!fiatAmount || !usdcAmount) {
      toast.error("Please enter an amount");
      return;
    }
    if (!accountVerified) {
      toast.error("Please verify your bank account first");
      return;
    }

    setProcessing(true);
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      let bankAccountId = selectedAccount?.id;
      if (!bankAccountId) {
        const result = await saveBankAccount(
          user.id,
          selectedBank.code,
          selectedBank.name,
          accountNumber,
          accountName,
          country
        );
        if (result) {
          bankAccountId = result.id;
        }
      }

      const result = await createWithdrawal(
        user.id,
        parseFloat(fiatAmount),
        parseFloat(usdcAmount),
        currency,
        bankAccountId!,
        "direct",
        exchangeRate,
        fee
      );

      if (result.error) {
        toast.error(result.error);
        return;
      }

      toast.success("Withdrawal successful! Money sent to your bank.");
      setFiatAmount("");
      setUsdcAmount("");
      fetchWithdrawals();
      fetchSavedAccounts();
      setActiveTab("history");
    } catch (error) {
      toast.error("Withdrawal failed");
    } finally {
      setProcessing(false);
    }
  };

  const handleCreateP2POrder = async () => {
    if (!p2pPrice || !p2pAmount) {
      toast.error("Please fill all fields");
      return;
    }
    setCreatingOrder(true);
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      const result = await createP2POrder(
        user.id,
        p2pType,
        parseFloat(p2pAmount),
        parseFloat(p2pPrice),
        currency
      );

      if (result.error) {
        toast.error(result.error);
        return;
      }

      toast.success("P2P order created!");
      setP2pPrice("");
      setP2pAmount("");
      fetchP2POrders();
    } catch (error) {
      toast.error("Failed to create order");
    } finally {
      setCreatingOrder(false);
    }
  };

  const handleMatchP2P = async (orderId: string) => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      const result = await matchP2POrder(orderId, user.id);
      if (result.success) {
        toast.success("Order matched!");
        fetchP2POrders();
      } else {
        toast.error(result.error || "Failed to match");
      }
    } catch (error) {
      toast.error("Failed to match order");
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case "completed":
        return "text-green-500 bg-green-500/10";
      case "pending":
      case "processing":
        return "text-yellow-500 bg-yellow-500/10";
      case "failed":
      case "cancelled":
        return "text-red-500 bg-red-500/10";
      default:
        return "text-gray-500 bg-gray-500/10";
    }
  };

  if (!isLoggedIn) {
    return (
      <div className="min-h-screen bg-background">
        <AppHeader />
        <div className="flex min-h-[80vh] flex-col items-center justify-center px-4 text-center">
          <div className="mb-6 flex h-20 w-20 items-center justify-center rounded-full bg-primary/10">
            <Banknote className="h-10 w-10 text-primary" />
          </div>
          <h2 className="mb-3 font-display text-2xl text-foreground sm:text-3xl">
            Instant Fiat Withdrawal
          </h2>
          <p className="mb-6 max-w-md text-sm text-muted-foreground">
            Convert your USDC to fiat and withdraw instantly to your bank account
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
            Instant Fiat Withdrawal
          </h1>
          <p className="mt-1 text-sm text-muted-foreground">
            Convert USDC to fiat and receive instantly in your bank account
          </p>
        </div>

        <div className="mb-6 flex gap-2 overflow-x-auto pb-2">
          {[
            { id: "withdraw", label: "Withdraw", icon: Banknote },
            { id: "p2p", label: "P2P Market", icon: Users },
            { id: "accounts", label: "Accounts", icon: Building2 },
            { id: "history", label: "History", icon: Clock },
          ].map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id as Tab)}
              className={`flex items-center gap-2 whitespace-nowrap rounded-lg px-4 py-2 text-sm font-medium transition-colors ${
                activeTab === tab.id
                  ? "bg-primary text-primary-foreground"
                  : "bg-card text-muted-foreground hover:bg-accent"
              }`}
            >
              <tab.icon className="h-4 w-4" />
              {tab.label}
            </button>
          ))}
        </div>

        {activeTab === "withdraw" && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="space-y-6"
          >
            <div className="rounded-xl border border-border bg-card p-6">
              <div className="mb-6 rounded-lg bg-gradient-to-r from-green-500/10 to-emerald-500/10 border border-green-500/20 p-4">
                <div className="flex items-center gap-2 text-green-500 mb-2">
                  <Zap className="h-5 w-5" />
                  <span className="font-semibold">Instant Settlement</span>
                </div>
                <p className="text-sm text-muted-foreground">
                  Your money arrives in your bank account within seconds, not days!
                </p>
              </div>

              <div className="mb-4">
                <label className="mb-2 block text-sm font-medium">Country</label>
                <select
                  value={country}
                  onChange={(e) => setCountry(e.target.value)}
                  className="w-full rounded-lg border border-border bg-background px-4 py-3"
                >
                  {SUPPORTED_COUNTRIES.map((c) => (
                    <option key={c.code} value={c.code}>
                      {c.flag} {c.name}
                    </option>
                  ))}
                </select>
              </div>

              <div className="mb-4 relative">
                <label className="mb-2 block text-sm font-medium">Select Bank</label>
                <div
                  onClick={() => setShowBankDropdown(!showBankDropdown)}
                  className="w-full rounded-lg border border-border bg-background px-4 py-3 cursor-pointer flex items-center justify-between"
                >
                  <span className={selectedBank ? "text-foreground" : "text-muted-foreground"}>
                    {selectedBank ? selectedBank.name : "Search for your bank..."}
                  </span>
                  <ChevronDownIcon className={`h-5 w-5 text-muted-foreground transition-transform ${showBankDropdown ? 'rotate-180' : ''}`} />
                </div>
                
                {showBankDropdown && (
                  <div className="absolute z-10 w-full mt-1 bg-card border border-border rounded-lg shadow-lg max-h-60 overflow-hidden">
                    <div className="p-2 border-b border-border">
                      <input
                        type="text"
                        value={bankSearch}
                        onChange={(e) => setBankSearch(e.target.value)}
                        placeholder="Search banks..."
                        className="w-full px-3 py-2 bg-background rounded border border-border text-sm"
                        autoFocus
                      />
                    </div>
                    <div className="max-h-48 overflow-y-auto">
                      {filteredBanks.length === 0 ? (
                        <p className="px-4 py-3 text-sm text-muted-foreground">No banks found</p>
                      ) : (
                        filteredBanks.map((bank) => (
                          <div
                            key={bank.code}
                            onClick={() => handleSelectBank(bank)}
                            className="px-4 py-3 hover:bg-accent cursor-pointer"
                          >
                            <p className="font-medium text-sm">{bank.name}</p>
                            <p className="text-xs text-muted-foreground">Code: {bank.code}</p>
                          </div>
                        ))
                      )}
                    </div>
                  </div>
                )}
              </div>

              <div className="mb-4">
                <label className="mb-2 block text-sm font-medium">
                  Account Number
                </label>
                <div className="relative">
                  <input
                    type="text"
                    value={accountNumber}
                    onChange={(e) => {
                      setAccountNumber(e.target.value.replace(/\D/g, ''));
                      setAccountVerified(false);
                      setVerificationError("");
                    }}
                    placeholder="Enter 10-digit account number"
                    maxLength={10}
                    className="w-full rounded-lg border border-border bg-background px-4 py-3 pr-10"
                  />
                  {verifying && (
                    <Loader2 className="absolute right-3 top-1/2 -translate-y-1/2 h-5 w-5 animate-spin text-muted-foreground" />
                  )}
                  {accountVerified && (
                    <Check className="absolute right-3 top-1/2 -translate-y-1/2 h-5 w-5 text-green-500" />
                  )}
                </div>
                <p className="mt-1 text-xs text-muted-foreground">
                  {selectedBank ? `Enter ${country === 'NG' ? '10' : 'account number for'} ${selectedBank.name}` : 'Select a bank first'}
                </p>
              </div>

              {verificationError && (
                <div className="mb-4 rounded-lg bg-red-500/10 border border-red-500/20 p-3">
                  <div className="flex items-center gap-2 text-red-500 text-sm">
                    <AlertCircle className="h-4 w-4" />
                    {verificationError}
                  </div>
                </div>
              )}

              {accountVerified && (
                <div className="mb-6 rounded-lg bg-green-500/10 border border-green-500/20 p-4">
                  <div className="flex items-center gap-2 text-green-500 mb-2">
                    <ShieldCheck className="h-5 w-5" />
                    <span className="font-semibold">Account Verified</span>
                  </div>
                  <p className="text-foreground font-medium">{accountName}</p>
                </div>
              )}

              <div className="mb-4">
                <label className="mb-2 block text-sm font-medium">
                  Amount to Receive ({currency})
                </label>
                <input
                  type="number"
                  value={fiatAmount}
                  onChange={(e) => setFiatAmount(e.target.value)}
                  placeholder="0.00"
                  className="w-full rounded-lg border border-border bg-background px-4 py-3 text-2xl font-semibold"
                />
              </div>

              {fiatAmount && parseFloat(fiatAmount) > 0 && (
                <div className="mb-6 rounded-lg bg-muted p-4 space-y-3">
                  <div className="flex items-center justify-between text-sm">
                    <span className="text-muted-foreground">Exchange Rate</span>
                    <span className="font-medium">
                      1 USDC = {CURRENCY_SYMBOLS[currency]}{exchangeRate.toLocaleString()}
                    </span>
                  </div>
                  <div className="flex items-center justify-between text-sm">
                    <span className="text-muted-foreground">Fee (1%)</span>
                    <span className="font-medium">
                      {CURRENCY_SYMBOLS[currency]}{fee.toFixed(2)}
                    </span>
                  </div>
                  <div className="flex items-center justify-between border-t border-border pt-3">
                    <span className="text-muted-foreground">USDC to Convert</span>
                    <span className="text-lg font-bold text-primary">{usdcAmount} USDC</span>
                  </div>
                </div>
              )}

              <button
                onClick={handleWithdraw}
                disabled={!fiatAmount || !accountVerified || processing || !selectedBank}
                className="flex w-full items-center justify-center gap-2 rounded-lg bg-green-500 py-3.5 font-semibold text-white hover:bg-green-600 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
              >
                {processing ? (
                  <>
                    <Loader2 className="h-5 w-5 animate-spin" />
                    Processing...
                  </>
                ) : (
                  <>
                    <Zap className="h-5 w-5" />
                    Withdraw Instantly
                    {fiatAmount && (
                      <span>
                        {CURRENCY_SYMBOLS[currency]}{(parseFloat(fiatAmount) - fee).toFixed(2)}
                      </span>
                    )}
                    <ArrowRight className="h-5 w-5" />
                  </>
                )}
              </button>
              
              <p className="mt-3 text-center text-xs text-muted-foreground">
                Instant delivery to your bank account • Powered by Flutterwave
              </p>
            </div>

            {savedAccounts.length > 0 && (
              <div className="rounded-xl border border-border bg-card p-6">
                <h3 className="font-semibold mb-4">Saved Bank Accounts</h3>
                <div className="space-y-2">
                  {savedAccounts.map((acc) => (
                    <button
                      key={acc.id}
                      onClick={() => handleSelectSavedAccount(acc)}
                      className={`flex w-full items-center justify-between rounded-lg border p-3 text-left transition-colors ${
                        selectedAccount?.id === acc.id
                          ? "border-primary bg-primary/5"
                          : "border-border hover:bg-muted"
                      }`}
                    >
                      <div>
                        <p className="font-medium text-sm">{acc.bank_name}</p>
                        <p className="text-xs text-muted-foreground">
                          {acc.account_number} • {acc.account_name}
                        </p>
                      </div>
                      {selectedAccount?.id === acc.id && (
                        <Check className="h-5 w-5 text-primary" />
                      )}
                    </button>
                  ))}
                </div>
              </div>
            )}
          </motion.div>
        )}

        {activeTab === "p2p" && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="space-y-6"
          >
            <div className="rounded-xl border border-border bg-card p-6">
              <h3 className="mb-4 font-semibold">Create P2P Order</h3>
              <div className="mb-4">
                <label className="mb-2 block text-sm font-medium">Type</label>
                <div className="flex gap-2">
                  <button
                    onClick={() => setP2pType("sell")}
                    className={`flex-1 rounded-lg p-3 text-sm font-medium ${
                      p2pType === "sell"
                        ? "bg-green-500 text-white"
                        : "bg-muted"
                    }`}
                  >
                    I want to SELL USDC
                  </button>
                  <button
                    onClick={() => setP2pType("buy")}
                    className={`flex-1 rounded-lg p-3 text-sm font-medium ${
                      p2pType === "buy"
                        ? "bg-blue-500 text-white"
                        : "bg-muted"
                    }`}
                  >
                    I want to BUY USDC
                  </button>
                </div>
              </div>
              <div className="mb-4 grid gap-4 sm:grid-cols-2">
                <div>
                  <label className="mb-2 block text-sm font-medium">
                    {p2pType === "sell" ? "Amount to Sell (USDC)" : "Amount to Buy (USDC)"}
                  </label>
                  <input
                    type="number"
                    value={p2pAmount}
                    onChange={(e) => setP2pAmount(e.target.value)}
                    placeholder="0.00"
                    className="w-full rounded-lg border border-border bg-background px-4 py-3"
                  />
                </div>
                <div>
                  <label className="mb-2 block text-sm font-medium">
                    Price per USDC ({currency})
                  </label>
                  <input
                    type="number"
                    value={p2pPrice}
                    onChange={(e) => setP2pPrice(e.target.value)}
                    placeholder={exchangeRate.toString()}
                    className="w-full rounded-lg border border-border bg-background px-4 py-3"
                  />
                </div>
              </div>
              {p2pAmount && p2pPrice && (
                <div className="mb-4 rounded-lg bg-muted p-4">
                  <div className="flex items-center justify-between">
                    <span className="text-muted-foreground">
                      Total {p2pType === "sell" ? "you'll receive" : "you'll pay"}
                    </span>
                    <span className="text-xl font-bold">
                      {CURRENCY_SYMBOLS[currency]}
                      {(parseFloat(p2pAmount) * parseFloat(p2pPrice)).toFixed(2)}
                    </span>
                  </div>
                </div>
              )}
              <button
                onClick={handleCreateP2POrder}
                disabled={creatingOrder || !p2pAmount || !p2pPrice}
                className="flex w-full items-center justify-center gap-2 rounded-lg bg-primary py-3 font-semibold text-primary-foreground disabled:opacity-50"
              >
                {creatingOrder ? (
                  <Loader2 className="h-5 w-5 animate-spin" />
                ) : (
                  `Create ${p2pType === "sell" ? "Sell" : "Buy"} Order`
                )}
              </button>
            </div>

            <div className="rounded-xl border border-border bg-card p-6">
              <div className="mb-4 flex items-center justify-between">
                <h3 className="font-semibold">Active Orders</h3>
                <button
                  onClick={fetchP2POrders}
                  className="flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground"
                >
                  <RefreshCw className="h-4 w-4" />
                  Refresh
                </button>
              </div>
              <div className="mb-4 flex gap-2">
                <button
                  onClick={() => { setP2pType("buy"); fetchP2POrders(); }}
                  className={`rounded-lg px-4 py-2 text-sm font-medium ${
                    p2pType === "buy" ? "bg-blue-500 text-white" : "bg-muted"
                  }`}
                >
                  Buy Orders
                </button>
                <button
                  onClick={() => { setP2pType("sell"); fetchP2POrders(); }}
                  className={`rounded-lg px-4 py-2 text-sm font-medium ${
                    p2pType === "sell" ? "bg-green-500 text-white" : "bg-muted"
                  }`}
                >
                  Sell Orders
                </button>
              </div>
              {p2pOrders.length === 0 ? (
                <p className="py-8 text-center text-muted-foreground">
                  No active orders. Be the first to create one!
                </p>
              ) : (
                <div className="space-y-3">
                  {p2pOrders.map((order) => (
                    <div
                      key={order.id}
                      className="flex items-center justify-between rounded-lg border border-border p-4"
                    >
                      <div>
                        <div className="flex items-center gap-2">
                          <span className="font-medium">{order.amount_usdc} USDC</span>
                          <span className="text-sm text-muted-foreground">
                            @ {CURRENCY_SYMBOLS[currency]}{order.price_per_usdc}
                          </span>
                        </div>
                        <p className="text-sm text-muted-foreground">
                          Total: {CURRENCY_SYMBOLS[currency]}{order.total_fiat}
                        </p>
                      </div>
                      <button
                        onClick={() => handleMatchP2P(order.id)}
                        className={`rounded-lg px-4 py-2 text-sm font-medium ${
                          p2pType === "buy" ? "bg-green-500" : "bg-blue-500"
                        } text-white`}
                      >
                        {p2pType === "buy" ? "Sell to" : "Buy from"} Them
                      </button>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </motion.div>
        )}

        {activeTab === "accounts" && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
          >
            <div className="rounded-xl border border-border bg-card p-6">
              <div className="mb-4 flex items-center justify-between">
                <h3 className="font-semibold">Saved Bank Accounts</h3>
                <button
                  onClick={() => setShowAddAccount(true)}
                  className="flex items-center gap-2 rounded-lg bg-primary px-4 py-2 text-sm font-medium text-primary-foreground"
                >
                  <Plus className="h-4 w-4" />
                  Add Account
                </button>
              </div>
              {savedAccounts.length === 0 ? (
                <p className="py-8 text-center text-muted-foreground">
                  No saved bank accounts yet
                </p>
              ) : (
                <div className="space-y-3">
                  {savedAccounts.map((acc) => (
                    <div
                      key={acc.id}
                      className="flex items-center justify-between rounded-lg border border-border p-4"
                    >
                      <div>
                        <p className="font-medium">{acc.bank_name}</p>
                        <p className="text-sm text-muted-foreground">
                          {acc.account_number} - {acc.account_name}
                        </p>
                      </div>
                      <button
                        onClick={async () => {
                          if (confirm("Delete this account?")) {
                            await deleteBankAccount(acc.id);
                            fetchSavedAccounts();
                          }
                        }}
                        className="rounded-lg p-2 text-red-500 hover:bg-red-500/10"
                      >
                        <Trash2 className="h-5 w-5" />
                      </button>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </motion.div>
        )}

        {activeTab === "history" && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
          >
            <div className="rounded-xl border border-border bg-card p-6">
              <h3 className="mb-4 font-semibold">Withdrawal History</h3>
              {withdrawals.length === 0 ? (
                <p className="py-8 text-center text-muted-foreground">
                  No withdrawals yet
                </p>
              ) : (
                <div className="space-y-3">
                  {withdrawals.map((w) => (
                    <div
                      key={w.id}
                      className="flex items-center justify-between rounded-lg border border-border p-4"
                    >
                      <div>
                        <p className="font-medium">
                          -{CURRENCY_SYMBOLS[w.currency]}{w.amount_fiat.toFixed(2)}
                        </p>
                        <p className="text-sm text-muted-foreground">
                          {w.amount_usdc.toFixed(2)} USDC •{" "}
                          {new Date(w.created_at).toLocaleDateString()}
                        </p>
                      </div>
                      <span
                        className={`rounded-full px-3 py-1 text-xs font-medium capitalize ${getStatusColor(
                          w.status
                        )}`}
                      >
                        {w.status}
                      </span>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </motion.div>
        )}
      </div>

      <Footer />
    </div>
  );
}

function ChevronDownIcon({ className }: { className?: string }) {
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      className={className}
    >
      <path d="m6 9 6 6 6-6" />
    </svg>
  );
}
