import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import {
  CreditCard,
  Smartphone,
  QrCode,
  RefreshCw,
  Loader2,
  Check,
  X,
  ArrowRight,
  Building2,
  Smartphone as MobileIcon,
  Zap,
  History,
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
  formatCurrency,
} from "@/services/flutterwaveService";

type PaymentMethod = "card" | "ussd" | "mobile_money" | "qr";

interface CardPayment {
  id: string;
  last4: string;
  brand: string;
  expiry: string;
  isDefault: boolean;
}

interface MobileMoneyAccount {
  id: string;
  phone: string;
  network: string;
  country: string;
  isDefault: boolean;
}

export default function BuyCryptoPage() {
  const { isLoggedIn, login, walletAddress } = useApp();
  const [paymentMethod, setPaymentMethod] = useState<PaymentMethod>("card");
  const [amount, setAmount] = useState("");
  const [usdcAmount, setUsdcAmount] = useState("");
  const [selectedCountry, setSelectedCountry] = useState("NG");
  const [currency, setCurrency] = useState("NGN");
  const [exchangeRate, setExchangeRate] = useState(1520);
  const [loading, setLoading] = useState(false);
  const [processing, setProcessing] = useState(false);
  const [savedCards, setSavedCards] = useState<CardPayment[]>([]);
  const [selectedCard, setSelectedCard] = useState<CardPayment | null>(null);
  const [phoneNumber, setPhoneNumber] = useState("");
  const [selectedNetwork, setSelectedNetwork] = useState("");
  const [networks, setNetworks] = useState<any[]>([]);
  const [transactions, setTransactions] = useState<any[]>([]);

  const countryData = SUPPORTED_COUNTRIES.find((c) => c.code === selectedCountry);

  useEffect(() => {
    if (countryData) {
      setCurrency(countryData.currency);
      setExchangeRate(countryData.currency === "NGN" ? 1520 : 13.5);
    }
  }, [selectedCountry, countryData]);

  useEffect(() => {
    if (amount) {
      const usdc = parseFloat(amount) / exchangeRate;
      setUsdcAmount(usdc.toFixed(6));
    } else {
      setUsdcAmount("");
    }
  }, [amount, exchangeRate]);

  useEffect(() => {
    if (isLoggedIn && walletAddress) {
      fetchPaymentMethods();
      fetchTransactions();
      fetchNetworks();
    }
  }, [isLoggedIn, walletAddress]);

  const fetchPaymentMethods = async () => {
    setSavedCards([
      { id: "1", last4: "4242", brand: "Visa", expiry: "12/25", isDefault: true },
    ]);
  };

  const fetchTransactions = async () => {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return;

    try {
      const { data } = await supabase
        .from("crypto_purchases")
        .select("*")
        .eq("user_id", user.id)
        .order("created_at", { ascending: false })
        .limit(10);
      setTransactions(data || []);
    } catch (error) {
      console.error("Failed to fetch transactions:", error);
    }
  };

  const fetchNetworks = async () => {
    const networksList = await flutterwaveService.getMobileNetworks(selectedCountry);
    setNetworks(networksList);
  };

  const handlePayment = async () => {
    if (!amount || parseFloat(amount) <= 0) {
      toast.error("Please enter an amount");
      return;
    }

    setProcessing(true);

    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      await supabase.from("crypto_purchases").insert({
        user_id: user.id,
        amount_fiat: parseFloat(amount),
        amount_crypto: parseFloat(usdcAmount),
        currency,
        payment_method: paymentMethod,
        status: "completed",
        reference: `peydot_buy_${Date.now()}`,
      });

      toast.success(`${usdcAmount} USDC purchased successfully!`);
      setAmount("");
      setUsdcAmount("");
      fetchTransactions();
    } catch (error) {
      toast.error("Payment failed. Please try again.");
    } finally {
      setProcessing(false);
    }
  };

  const getMethodIcon = (method: PaymentMethod) => {
    switch (method) {
      case "card":
        return <CreditCard className="h-5 w-5" />;
      case "ussd":
        return <MobileIcon className="h-5 w-5" />;
      case "mobile_money":
        return <Smartphone className="h-5 w-5" />;
      case "qr":
        return <QrCode className="h-5 w-5" />;
    }
  };

  const getMethodLabel = (method: PaymentMethod) => {
    switch (method) {
      case "card":
        return "Debit/Credit Card";
      case "ussd":
        return "USSD";
      case "mobile_money":
        return "Mobile Money";
      case "qr":
        return "QR Code";
    }
  };

  const getMethodDescription = (method: PaymentMethod) => {
    switch (method) {
      case "card":
        return "Pay with Visa, Mastercard, or Verve card";
      case "ussd":
        return "Pay using USSD code - works on all phones";
      case "mobile_money":
        return "Pay with M-Pesa, MTN Money, Airtel Money";
      case "qr":
        return "Scan QR code to pay with any app";
    }
  };

  if (!isLoggedIn) {
    return (
      <div className="min-h-screen bg-background">
        <AppHeader />
        <div className="flex min-h-[80vh] flex-col items-center justify-center px-4 text-center">
          <div className="mb-6 flex h-20 w-20 items-center justify-center rounded-full bg-primary/10">
            <CreditCard className="h-10 w-10 text-primary" />
          </div>
          <h2 className="mb-3 font-display text-2xl text-foreground sm:text-3xl">
            Buy Crypto
          </h2>
          <p className="mb-6 max-w-md text-sm text-muted-foreground">
            Buy USDC with fiat - card, USSD, mobile money, or QR
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
          <h1 className="font-display text-2xl text-foreground sm:text-3xl">Buy USDC</h1>
          <p className="mt-1 text-sm text-muted-foreground">
            Purchase USDC with fiat currency
          </p>
        </div>

        <div className="mb-6 grid gap-4 sm:grid-cols-2">
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            className="rounded-xl border border-border bg-card p-5"
          >
            <div className="mb-2 flex h-10 w-10 items-center justify-center rounded-lg bg-green-500/10">
              <CreditCard className="h-5 w-5 text-green-500" />
            </div>
            <p className="text-2xl font-bold text-foreground">{usdcAmount || "0"}</p>
            <p className="text-sm text-muted-foreground">USDC you will receive</p>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
            className="rounded-xl border border-border bg-card p-5"
          >
            <div className="mb-2 flex h-10 w-10 items-center justify-center rounded-lg bg-primary/10">
              <Zap className="h-5 w-5 text-primary" />
            </div>
            <p className="text-2xl font-bold text-foreground">
              1 USD = {CURRENCY_SYMBOLS[currency]}{exchangeRate.toLocaleString()}
            </p>
            <p className="text-sm text-muted-foreground">Exchange Rate</p>
          </motion.div>
        </div>

        <div className="mb-6">
          <label className="mb-2 block text-sm font-medium">Country</label>
          <select
            value={selectedCountry}
            onChange={(e) => setSelectedCountry(e.target.value)}
            className="w-full rounded-lg border border-border bg-card px-4 py-3"
          >
            {SUPPORTED_COUNTRIES.map((country) => (
              <option key={country.code} value={country.code}>
                {country.flag} {country.name} ({country.currency})
              </option>
            ))}
          </select>
        </div>

        <div className="mb-6">
          <label className="mb-2 block text-sm font-medium">Amount ({currency})</label>
          <input
            type="number"
            value={amount}
            onChange={(e) => setAmount(e.target.value)}
            placeholder="Enter amount"
            className="w-full rounded-lg border border-border bg-card px-4 py-3 text-2xl font-semibold"
          />
        </div>

        <div className="mb-6">
          <label className="mb-3 block text-sm font-medium">Payment Method</label>
          <div className="grid gap-3 sm:grid-cols-2">
            {(["card", "ussd", "mobile_money", "qr"] as PaymentMethod[]).map((method) => (
              <button
                key={method}
                onClick={() => setPaymentMethod(method)}
                className={`flex items-start gap-3 rounded-xl border p-4 text-left transition-all ${
                  paymentMethod === method
                    ? "border-primary bg-primary/5"
                    : "border-border hover:border-primary/50"
                }`}
              >
                <div
                  className={`mt-0.5 rounded-lg p-2 ${
                    paymentMethod === method ? "bg-primary text-primary-foreground" : "bg-muted"
                  }`}
                >
                  {getMethodIcon(method)}
                </div>
                <div>
                  <p className="font-medium">{getMethodLabel(method)}</p>
                  <p className="text-xs text-muted-foreground">{getMethodDescription(method)}</p>
                </div>
                {paymentMethod === method && (
                  <Check className="ml-auto h-5 w-5 flex-shrink-0 text-primary" />
                )}
              </button>
            ))}
          </div>
        </div>

        {paymentMethod === "card" && savedCards.length > 0 && (
          <div className="mb-6">
            <label className="mb-3 block text-sm font-medium">Saved Cards</label>
            <div className="space-y-2">
              {savedCards.map((card) => (
                <button
                  key={card.id}
                  onClick={() => setSelectedCard(card)}
                  className={`flex w-full items-center gap-3 rounded-lg border p-4 text-left ${
                    selectedCard?.id === card.id ? "border-primary bg-primary/5" : "border-border"
                  }`}
                >
                  <CreditCard className="h-5 w-5" />
                  <div className="flex-1">
                    <p className="font-medium">•••• {card.last4}</p>
                    <p className="text-sm text-muted-foreground">{card.brand} • {card.expiry}</p>
                  </div>
                  {card.isDefault && (
                    <span className="text-xs text-muted-foreground">Default</span>
                  )}
                  {selectedCard?.id === card.id && <Check className="h-5 w-5 text-primary" />}
                </button>
              ))}
            </div>
          </div>
        )}

        {paymentMethod === "mobile_money" && (
          <div className="mb-6 space-y-4">
            <div>
              <label className="mb-2 block text-sm font-medium">Network</label>
              <select
                value={selectedNetwork}
                onChange={(e) => setSelectedNetwork(e.target.value)}
                className="w-full rounded-lg border border-border bg-card px-4 py-3"
              >
                <option value="">Select network</option>
                {networks.map((network) => (
                  <option key={network.id} value={network.id}>
                    {network.name}
                  </option>
                ))}
              </select>
            </div>
            <div>
              <label className="mb-2 block text-sm font-medium">Phone Number</label>
              <input
                type="tel"
                value={phoneNumber}
                onChange={(e) => setPhoneNumber(e.target.value)}
                placeholder="Enter phone number"
                className="w-full rounded-lg border border-border bg-card px-4 py-3"
              />
            </div>
          </div>
        )}

        {paymentMethod === "ussd" && (
          <div className="mb-6 rounded-xl border border-primary/20 bg-primary/5 p-4">
            <p className="font-medium text-foreground">USSD Payment</p>
            <p className="mt-1 text-sm text-muted-foreground">
              After clicking "Pay", you will receive a USSD code to dial on your phone.
            </p>
          </div>
        )}

        {paymentMethod === "qr" && (
          <div className="mb-6 rounded-xl border border-border bg-card p-6 text-center">
            <div className="mx-auto mb-4 flex h-48 w-48 items-center justify-center rounded-xl bg-muted">
              <QrCode className="h-24 w-24 text-muted-foreground" />
            </div>
            <p className="text-sm text-muted-foreground">
              Scan this QR code with any payment app to pay
            </p>
          </div>
        )}

        <button
          onClick={handlePayment}
          disabled={processing || !amount || parseFloat(amount) <= 0}
          className="flex w-full items-center justify-center gap-2 rounded-lg bg-primary py-4 text-lg font-semibold text-primary-foreground disabled:opacity-50"
        >
          {processing ? (
            <>
              <Loader2 className="h-5 w-5 animate-spin" />
              Processing...
            </>
          ) : (
            <>
              Buy {usdcAmount || "0"} USDC
              <ArrowRight className="h-5 w-5" />
            </>
          )}
        </button>

        {transactions.length > 0 && (
          <div className="mt-12">
            <div className="mb-4 flex items-center justify-between">
              <h2 className="text-lg font-semibold">Recent Purchases</h2>
              <button
                onClick={fetchTransactions}
                className="flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground"
              >
                <RefreshCw className="h-4 w-4" />
                Refresh
              </button>
            </div>
            <div className="space-y-3">
              {transactions.slice(0, 5).map((tx) => (
                <div
                  key={tx.id}
                  className="flex items-center justify-between rounded-lg border border-border bg-card p-4"
                >
                  <div className="flex items-center gap-3">
                    <div className="flex h-10 w-10 items-center justify-center rounded-full bg-green-500/10">
                      <CreditCard className="h-5 w-5 text-green-500" />
                    </div>
                    <div>
                      <p className="font-medium">+{tx.amount_crypto} USDC</p>
                      <p className="text-sm text-muted-foreground">
                        {formatCurrency(tx.amount_fiat, tx.currency)}
                      </p>
                    </div>
                  </div>
                  <span
                    className={`rounded-full px-3 py-1 text-xs font-medium capitalize ${
                      tx.status === "completed"
                        ? "bg-green-500/10 text-green-500"
                        : "bg-yellow-500/10 text-yellow-500"
                    }`}
                  >
                    {tx.status}
                  </span>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
      <Footer />
    </div>
  );
}
