import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { sanitizePhone, sanitizeString } from "@/utils/sanitize";
import {
  Smartphone,
  Tv,
  Zap,
  CreditCard,
  Loader2,
  Search,
  Check,
  X,
  RefreshCw,
  Clock,
  ChevronRight,
  ArrowLeft,
  Wifi,
  Gamepad2,
  Film,
  Music,
  ShoppingBag,
  Zap as Lightning,
  Radio,
} from "lucide-react";
import { useApp } from "@/contexts/AppContext";
import AppHeader from "@/components/AppHeader";
import Footer from "@/components/Footer";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import {
  flutterwaveService,
  getUserBillPayments,
  saveBillPaymentRecord,
  formatCurrency,
} from "@/services/flutterwaveService";

interface BillCategory {
  id: string;
  name: string;
  description: string;
  icon: React.ReactNode;
  color: string;
  type: "airtime" | "data" | "tv" | "electricity" | "other";
}

interface DataPlan {
  id: string;
  name: string;
  amount: number;
  validity: string;
}

interface TvPlan {
  id: string;
  name: string;
  amount: number;
  desc: string;
}

interface BillPaymentRecord {
  id: string;
  bill_type: string;
  item_code: string;
  amount: number;
  customer_id: string;
  reference: string;
  status: string;
  created_at: string;
}

export default function BillsPage() {
  const { isLoggedIn, login, walletAddress } = useApp();
  const [step, setStep] = useState<"category" | "provider" | "details" | "confirm" | "success">("category");
  const [selectedCategory, setSelectedCategory] = useState<BillCategory | null>(null);
  const [selectedProvider, setSelectedProvider] = useState<string | null>(null);
  const [selectedPlan, setSelectedPlan] = useState<any | null>(null);
  const [customAmount, setCustomAmount] = useState("");
  const [phoneNumber, setPhoneNumber] = useState("");
  const [smartCardNumber, setSmartCardNumber] = useState("");
  const [meterNumber, setMeterNumber] = useState("");
  const [loading, setLoading] = useState(false);
  const [providers, setProviders] = useState<any[]>([]);
  const [dataPlans, setDataPlans] = useState<DataPlan[]>([]);
  const [tvPlans, setTvPlans] = useState<TvPlan[]>([]);
  const [paymentHistory, setPaymentHistory] = useState<BillPaymentRecord[]>([]);

  const categories: BillCategory[] = [
    {
      id: "airtime",
      name: "Airtime",
      description: "Buy airtime for all networks",
      icon: <Smartphone className="h-8 w-8" />,
      color: "bg-green-500",
      type: "airtime",
    },
    {
      id: "data",
      name: "Data Bundles",
      description: "Buy internet data plans",
      icon: <Wifi className="h-8 w-8" />,
      color: "bg-blue-500",
      type: "data",
    },
    {
      id: "tv",
      name: "TV Subscription",
      description: "DStv, GOtv, Startimes",
      icon: <Tv className="h-8 w-8" />,
      color: "bg-purple-500",
      type: "tv",
    },
    {
      id: "electricity",
      name: "Electricity",
      description: "Pay electricity bills",
      icon: <Zap className="h-8 w-8" />,
      color: "bg-yellow-500",
      type: "electricity",
    },
    {
      id: "other",
      name: "Other Services",
      description: "Betting, streaming, more",
      icon: <CreditCard className="h-8 w-8" />,
      color: "bg-orange-500",
      type: "other",
    },
  ];

  const networkProviders = [
    { id: "mtn", name: "MTN", color: "#FFCC00" },
    { id: "airtel", name: "Airtel", color: "#E60000" },
    { id: "glo", name: "Glo", color: "#00A651" },
    { id: "9mobile", name: "9Mobile", color: "#00854D" },
  ];

  const tvProviders = [
    { id: "dstv", name: "DStv", color: "#1B7340" },
    { id: "gotv", name: "GOtv", color: "#E31E24" },
    { id: "startimes", name: "Startimes", color: "#FF6600" },
  ];

  const electricityProviders = [
    { id: "eko-electric", name: "Eko Electric", shortCode: "eka" },
    { id: "ikeja-electric", name: "Ikeja Electric", shortCode: "ikedc" },
    { id: "port-harcourt-electric", name: "Port Harcourt Electric", shortCode: "phed" },
    { id: "jos-electric", name: "Jos Electric", shortCode: "jedc" },
    { id: "kano-electric", name: "Kano Electric", shortCode: "kedc" },
    { id: "ibadan-electric", name: "Ibadan Electric", shortCode: "ibedc" },
    { id: "enugu-electric", name: "Enugu Electric", shortCode: "eedc" },
    { id: "abuja-electric", name: "Abuja Electric", shortCode: "aedc" },
    { id: "lagos-electric", name: "Lagos Electric", shortCode: "lekki" },
  ];

  const otherServices = [
    { id: "bet9ja", name: "Bet9ja", icon: <Gamepad2 className="h-6 w-6" />, color: "#FF6B00" },
    { id: "showmax", name: "Showmax", icon: <Film className="h-6 w-6" />, color: "#E50914" },
    { id: "netflix", name: "Netflix", icon: <Film className="h-6 w-6" />, color: "#E50914" },
    { id: "spotify", name: "Spotify", icon: <Music className="h-6 w-6" />, color: "#1DB954" },
    { id: "smile", name: "Smile", icon: <Smartphone className="h-6 w-6" />, color: "#FF6B00" },
    { id: "spectranet", name: "Spectranet", icon: <Wifi className="h-6 w-6" />, color: "#007AFF" },
  ];

  useEffect(() => {
    if (isLoggedIn && walletAddress) {
      fetchPaymentHistory();
    }
  }, [isLoggedIn, walletAddress]);

  const fetchPaymentHistory = async () => {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return;
    const history = await getUserBillPayments(user.id, 20);
    setPaymentHistory(history);
  };

  const handleSelectCategory = async (category: BillCategory) => {
    setSelectedCategory(category);
    setStep("provider");
    setProviders([]);
    setDataPlans([]);
    setTvPlans([]);
  };

  const handleSelectProvider = async (providerId: string) => {
    setSelectedProvider(providerId);

    if (selectedCategory?.type === "data") {
      const plans = await flutterwaveService.getDataPlans(`${providerId}-data`);
      setDataPlans(plans);
    } else if (selectedCategory?.type === "tv") {
      const plans = await flutterwaveService.getTvPlans(providerId);
      setTvPlans(plans);
    }

    setStep("details");
  };

  const handleSelectPlan = (plan: any) => {
    setSelectedPlan(plan);
    setStep("confirm");
  };

  const handleCustomAmount = () => {
    setSelectedPlan(null);
    setStep("confirm");
  };

  const handlePayment = async () => {
    if (!selectedCategory || !selectedProvider) return;

    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return;

    let amount = selectedPlan?.amount || parseFloat(customAmount);
    let customerId = "";

    if (selectedCategory.type === "airtime" || selectedCategory.type === "data") {
      const sanitizedPhone = sanitizePhone(phoneNumber);
      if (!sanitizedPhone) {
        toast.error("Please enter a valid phone number");
        return;
      }
      customerId = sanitizedPhone;
    } else if (selectedCategory.type === "tv") {
      const sanitizedSmartCard = sanitizeString(smartCardNumber, 20).replace(/\D/g, "");
      if (!sanitizedSmartCard || sanitizedSmartCard.length < 8) {
        toast.error("Please enter a valid smart card number");
        return;
      }
      customerId = sanitizedSmartCard;
    } else if (selectedCategory.type === "electricity") {
      const sanitizedMeter = sanitizeString(meterNumber, 20).replace(/\D/g, "");
      if (!sanitizedMeter || sanitizedMeter.length < 8) {
        toast.error("Please enter a valid meter number");
        return;
      }
      customerId = sanitizedMeter;
    }

    if (!customerId) {
      toast.error("Please enter required information");
      return;
    }

    if (!amount || amount <= 0) {
      toast.error("Please enter an amount");
      return;
    }

    setLoading(true);
    try {
      const result = await flutterwaveService.payBill(
        user.id,
        selectedProvider,
        selectedPlan?.id || "custom",
        amount,
        customerId,
        phoneNumber
      );

      if (result.success) {
        toast.success("Payment successful!");
        await saveBillPaymentRecord(
          user.id,
          selectedProvider,
          selectedPlan?.id || "custom",
          amount,
          result.reference || "",
          customerId,
          phoneNumber
        );
        setStep("success");
        fetchPaymentHistory();
      } else {
        toast.error(result.message || "Payment failed");
      }
    } catch (error) {
      toast.error("Payment failed. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  const resetFlow = () => {
    setStep("category");
    setSelectedCategory(null);
    setSelectedProvider(null);
    setSelectedPlan(null);
    setCustomAmount("");
    setPhoneNumber("");
    setSmartCardNumber("");
    setMeterNumber("");
  };

  const getBillTypeLabel = (type: string) => {
    const labels: Record<string, string> = {
      mtn: "MTN",
      airtel: "Airtel",
      glo: "Glo",
      "9mobile": "9Mobile",
      "mtn-data": "MTN Data",
      "airtel-data": "Airtel Data",
      "glo-data": "Glo Data",
      "9mobile-data": "9Mobile Data",
      dstv: "DStv",
      gotv: "GOtv",
      startimes: "Startimes",
      "eko-electric": "Eko Electric",
      "ikeja-electric": "Ikeja Electric",
      bet9ja: "Bet9ja",
      showmax: "Showmax",
      netflix: "Netflix",
    };
    return labels[type] || type;
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
            Pay Bills
          </h2>
          <p className="mb-6 max-w-md text-sm text-muted-foreground">
            Pay your bills with USDC - airtime, data, TV, electricity, and more.
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
          <h1 className="font-display text-2xl text-foreground sm:text-3xl">Pay Bills</h1>
          <p className="mt-1 text-sm text-muted-foreground">
            Pay bills with USDC - fast and secure
          </p>
        </div>

        {step === "category" && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3"
          >
            {categories.map((category) => (
              <button
                key={category.id}
                onClick={() => handleSelectCategory(category)}
                className="group rounded-xl border border-border bg-card p-6 text-left transition-all hover:border-primary hover:shadow-lg"
              >
                <div className={`mb-4 inline-flex rounded-xl p-3 ${category.color} text-white`}>
                  {category.icon}
                </div>
                <h3 className="mb-1 text-lg font-semibold">{category.name}</h3>
                <p className="text-sm text-muted-foreground">{category.description}</p>
              </button>
            ))}
          </motion.div>
        )}

        {step === "provider" && (
          <motion.div
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
          >
            <button
              onClick={() => setStep("category")}
              className="mb-4 flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground"
            >
              <ArrowLeft className="h-4 w-4" />
              Back to categories
            </button>

            <h2 className="mb-6 text-xl font-semibold">
              Select {selectedCategory?.name} Provider
            </h2>

            <div className="grid gap-4 sm:grid-cols-2">
              {(selectedCategory?.type === "airtime" || selectedCategory?.type === "data") &&
                networkProviders.map((provider) => (
                  <button
                    key={provider.id}
                    onClick={() => handleSelectProvider(provider.id)}
                    className="flex items-center gap-4 rounded-xl border border-border bg-card p-4 transition-all hover:border-primary"
                  >
                    <div
                      className="flex h-12 w-12 items-center justify-center rounded-full text-lg font-bold text-white"
                      style={{ backgroundColor: provider.color }}
                    >
                      {provider.name.charAt(0)}
                    </div>
                    <span className="font-medium">{provider.name}</span>
                    <ChevronRight className="ml-auto h-5 w-5 text-muted-foreground" />
                  </button>
                ))}

              {selectedCategory?.type === "tv" &&
                tvProviders.map((provider) => (
                  <button
                    key={provider.id}
                    onClick={() => handleSelectProvider(provider.id)}
                    className="flex items-center gap-4 rounded-xl border border-border bg-card p-4 transition-all hover:border-primary"
                  >
                    <div
                      className="flex h-12 w-12 items-center justify-center rounded-full text-lg font-bold text-white"
                      style={{ backgroundColor: provider.color }}
                    >
                      {provider.name.charAt(0)}
                    </div>
                    <span className="font-medium">{provider.name}</span>
                    <ChevronRight className="ml-auto h-5 w-5 text-muted-foreground" />
                  </button>
                ))}

              {selectedCategory?.type === "electricity" &&
                electricityProviders.map((provider) => (
                  <button
                    key={provider.id}
                    onClick={() => handleSelectProvider(provider.id)}
                    className="flex items-center gap-4 rounded-xl border border-border bg-card p-4 transition-all hover:border-primary"
                  >
                    <div className="flex h-12 w-12 items-center justify-center rounded-full bg-yellow-500 text-white">
                      <Zap className="h-6 w-6" />
                    </div>
                    <div className="text-left">
                      <span className="font-medium">{provider.name}</span>
                      <p className="text-xs text-muted-foreground">{provider.shortCode}</p>
                    </div>
                    <ChevronRight className="ml-auto h-5 w-5 text-muted-foreground" />
                  </button>
                ))}

              {selectedCategory?.type === "other" &&
                otherServices.map((service) => (
                  <button
                    key={service.id}
                    onClick={() => handleSelectProvider(service.id)}
                    className="flex items-center gap-4 rounded-xl border border-border bg-card p-4 transition-all hover:border-primary"
                  >
                    <div className="flex h-12 w-12 items-center justify-center rounded-full bg-orange-500 text-white">
                      {service.icon}
                    </div>
                    <span className="font-medium">{service.name}</span>
                    <ChevronRight className="ml-auto h-5 w-5 text-muted-foreground" />
                  </button>
                ))}
            </div>
          </motion.div>
        )}

        {step === "details" && (
          <motion.div
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            className="space-y-6"
          >
            <button
              onClick={() => setStep("provider")}
              className="flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground"
            >
              <ArrowLeft className="h-4 w-4" />
              Back to providers
            </button>

            <div className="rounded-xl border border-border bg-card p-6">
              <h2 className="mb-6 text-xl font-semibold">
                {getBillTypeLabel(selectedProvider || "")} - Enter Details
              </h2>

              {(selectedCategory?.type === "airtime" || selectedCategory?.type === "data") && (
                <div className="space-y-4">
                  <div>
                    <label className="mb-2 block text-sm font-medium">Phone Number</label>
                    <input
                      type="tel"
                      value={phoneNumber}
                      onChange={(e) => setPhoneNumber(e.target.value)}
                      placeholder="080XXXXXXXX"
                      className="w-full rounded-lg border border-border bg-background px-4 py-3"
                    />
                  </div>

                  {dataPlans.length > 0 && (
                    <>
                      <h3 className="mt-6 font-medium">Select Data Plan</h3>
                      <div className="mt-2 space-y-2">
                        {dataPlans.map((plan) => (
                          <button
                            key={plan.id}
                            onClick={() => handleSelectPlan(plan)}
                            className="flex w-full items-center justify-between rounded-lg border border-border bg-card p-4 text-left hover:border-primary"
                          >
                            <div>
                              <p className="font-medium">{plan.name}</p>
                              <p className="text-sm text-muted-foreground">{plan.validity}</p>
                            </div>
                            <span className="font-semibold text-primary">
                              ₦{plan.amount.toLocaleString()}
                            </span>
                          </button>
                        ))}
                      </div>
                    </>
                  )}

                  {dataPlans.length > 0 && (
                    <div className="relative py-4">
                      <div className="absolute inset-0 flex items-center">
                        <div className="w-full border-t border-border"></div>
                      </div>
                      <div className="relative flex justify-center">
                        <span className="bg-background px-2 text-sm text-muted-foreground">or</span>
                      </div>
                    </div>
                  )}

                  <div>
                    <label className="mb-2 block text-sm font-medium">Custom Amount (₦)</label>
                    <input
                      type="number"
                      value={customAmount}
                      onChange={(e) => setCustomAmount(e.target.value)}
                      placeholder="Enter amount"
                      className="w-full rounded-lg border border-border bg-background px-4 py-3"
                    />
                  </div>

                  {(!dataPlans.length || customAmount) && (
                    <button
                      onClick={handleCustomAmount}
                      disabled={!customAmount || parseFloat(customAmount) <= 0}
                      className="w-full rounded-lg bg-primary py-3 font-semibold text-primary-foreground disabled:opacity-50"
                    >
                      Continue
                    </button>
                  )}
                </div>
              )}

              {selectedCategory?.type === "tv" && (
                <div className="space-y-4">
                  <div>
                    <label className="mb-2 block text-sm font-medium">Smart Card Number / IUC Number</label>
                    <input
                      type="text"
                      value={smartCardNumber}
                      onChange={(e) => setSmartCardNumber(e.target.value)}
                      placeholder="Enter smart card number"
                      className="w-full rounded-lg border border-border bg-background px-4 py-3"
                    />
                  </div>

                  {tvPlans.length > 0 && (
                    <>
                      <h3 className="mt-6 font-medium">Select Package</h3>
                      <div className="mt-2 space-y-2">
                        {tvPlans.map((plan) => (
                          <button
                            key={plan.id}
                            onClick={() => handleSelectPlan(plan)}
                            className="flex w-full items-center justify-between rounded-lg border border-border bg-card p-4 text-left hover:border-primary"
                          >
                            <div>
                              <p className="font-medium">{plan.name}</p>
                              <p className="text-sm text-muted-foreground">{plan.desc}</p>
                            </div>
                            <span className="font-semibold text-primary">
                              ₦{plan.amount.toLocaleString()}
                            </span>
                          </button>
                        ))}
                      </div>
                    </>
                  )}
                </div>
              )}

              {selectedCategory?.type === "electricity" && (
                <div className="space-y-4">
                  <div>
                    <label className="mb-2 block text-sm font-medium">Meter Number</label>
                    <input
                      type="text"
                      value={meterNumber}
                      onChange={(e) => setMeterNumber(e.target.value)}
                      placeholder="Enter meter number"
                      className="w-full rounded-lg border border-border bg-background px-4 py-3"
                    />
                  </div>

                  <div>
                    <label className="mb-2 block text-sm font-medium">Amount (₦)</label>
                    <input
                      type="number"
                      value={customAmount}
                      onChange={(e) => setCustomAmount(e.target.value)}
                      placeholder="Enter amount"
                      className="w-full rounded-lg border border-border bg-background px-4 py-3"
                    />
                  </div>

                  <div className="grid grid-cols-4 gap-2">
                    {[500, 1000, 2000, 5000].map((amt) => (
                      <button
                        key={amt}
                        onClick={() => setCustomAmount(amt.toString())}
                        className="rounded-lg border border-border bg-card py-2 text-sm font-medium hover:bg-muted"
                      >
                        ₦{amt.toLocaleString()}
                      </button>
                    ))}
                  </div>

                  <button
                    onClick={handleCustomAmount}
                    disabled={!meterNumber || !customAmount || parseFloat(customAmount) <= 0}
                    className="w-full rounded-lg bg-primary py-3 font-semibold text-primary-foreground disabled:opacity-50"
                  >
                    Continue
                  </button>
                </div>
              )}
            </div>
          </motion.div>
        )}

        {step === "confirm" && (
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            className="space-y-6"
          >
            <button
              onClick={() => setStep("details")}
              className="flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground"
            >
              <ArrowLeft className="h-4 w-4" />
              Back
            </button>

            <div className="rounded-xl border border-border bg-card p-6">
              <h2 className="mb-6 text-xl font-semibold">Confirm Payment</h2>

              <div className="mb-6 space-y-4">
                <div className="flex justify-between border-b border-border pb-3">
                  <span className="text-muted-foreground">Service</span>
                  <span className="font-medium">
                    {getBillTypeLabel(selectedProvider || "")}
                  </span>
                </div>

                {(selectedCategory?.type === "airtime" || selectedCategory?.type === "data") && (
                  <div className="flex justify-between border-b border-border pb-3">
                    <span className="text-muted-foreground">Phone Number</span>
                    <span className="font-medium">{phoneNumber}</span>
                  </div>
                )}

                {selectedCategory?.type === "tv" && (
                  <div className="flex justify-between border-b border-border pb-3">
                    <span className="text-muted-foreground">Smart Card</span>
                    <span className="font-medium">{smartCardNumber}</span>
                  </div>
                )}

                {selectedCategory?.type === "electricity" && (
                  <div className="flex justify-between border-b border-border pb-3">
                    <span className="text-muted-foreground">Meter Number</span>
                    <span className="font-medium">{meterNumber}</span>
                  </div>
                )}

                {selectedPlan && (
                  <div className="flex justify-between border-b border-border pb-3">
                    <span className="text-muted-foreground">Package</span>
                    <span className="font-medium">{selectedPlan.name}</span>
                  </div>
                )}

                <div className="flex justify-between border-b border-border pb-3">
                  <span className="text-muted-foreground">Amount</span>
                  <span className="text-2xl font-bold text-primary">
                    ₦{(selectedPlan?.amount || parseFloat(customAmount)).toLocaleString()}
                  </span>
                </div>
              </div>

              <button
                onClick={handlePayment}
                disabled={loading}
                className="flex w-full items-center justify-center gap-2 rounded-lg bg-primary py-3 font-semibold text-primary-foreground disabled:opacity-50"
              >
                {loading ? (
                  <>
                    <Loader2 className="h-5 w-5 animate-spin" />
                    Processing...
                  </>
                ) : (
                  <>
                    Pay ₦{(selectedPlan?.amount || parseFloat(customAmount)).toLocaleString()}
                    <CreditCard className="h-5 w-5" />
                  </>
                )}
              </button>
            </div>
          </motion.div>
        )}

        {step === "success" && (
          <motion.div
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            className="text-center"
          >
            <div className="mb-6 inline-flex h-20 w-20 items-center justify-center rounded-full bg-green-500/10">
              <Check className="h-10 w-10 text-green-500" />
            </div>
            <h2 className="mb-2 text-2xl font-bold">Payment Successful!</h2>
            <p className="mb-8 text-muted-foreground">
              Your payment has been processed successfully.
            </p>
            <div className="flex flex-col gap-3 sm:flex-row">
              <button
                onClick={resetFlow}
                className="flex-1 rounded-lg bg-primary py-3 font-semibold text-primary-foreground"
              >
                Pay Another Bill
              </button>
              <button
                onClick={fetchPaymentHistory}
                className="flex-1 rounded-lg border border-border py-3 font-semibold"
              >
                View History
              </button>
            </div>
          </motion.div>
        )}

        {paymentHistory.length > 0 && step !== "success" && (
          <div className="mt-12">
            <h3 className="mb-4 font-semibold">Recent Payments</h3>
            <div className="space-y-3">
              {paymentHistory.slice(0, 5).map((payment) => (
                <div
                  key={payment.id}
                  className="flex items-center justify-between rounded-lg border border-border bg-card p-4"
                >
                  <div className="flex items-center gap-3">
                    <div className="flex h-10 w-10 items-center justify-center rounded-full bg-primary/10">
                      <CreditCard className="h-5 w-5 text-primary" />
                    </div>
                    <div>
                      <p className="font-medium">{getBillTypeLabel(payment.bill_type)}</p>
                      <p className="text-sm text-muted-foreground">
                        {new Date(payment.created_at).toLocaleDateString()}
                      </p>
                    </div>
                  </div>
                  <div className="text-right">
                    <p className="font-semibold">₦{payment.amount.toLocaleString()}</p>
                    <span
                      className={`text-xs ${
                        payment.status === "completed" ? "text-green-500" : "text-yellow-500"
                      }`}
                    >
                      {payment.status}
                    </span>
                  </div>
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
