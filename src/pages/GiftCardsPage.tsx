import { useState, useEffect, useMemo } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { 
  Gift, Ticket, Plus, X, Check, DollarSign, Copy, 
  User, Mail, Phone, Clock, Calendar, QrCode, Scan,
  ArrowUpRight, ArrowDownLeft, Loader2, Search,
  Tag, CreditCard, ChevronRight
} from "lucide-react";
import { Link } from "react-router-dom";
import { useApp } from "@/contexts/AppContext";
import AppHeader from "@/components/AppHeader";
import Footer from "@/components/Footer";
import { toast } from "sonner";
import QRCodeSVG from "qrcode.react";

interface GiftCard {
  id: string;
  code: string;
  amount: number;
  token: string;
  recipient: string;
  recipientContact: string;
  status: "sent" | "redeemed" | "pending" | "expired";
  sentDate: string;
  expiryDate: string;
}

interface Voucher {
  id: string;
  code: string;
  amount: number;
  token: string;
  description: string;
  status: "active" | "redeemed" | "expired";
  createdDate: string;
  expiryDate: string;
}

interface VoucherTemplate {
  id: string;
  name: string;
  amount: number;
  color: string;
}

const PRESET_AMOUNTS = [10, 25, 50, 100, 200, 500];

const VOUCHER_TEMPLATES: VoucherTemplate[] = [
  { id: "1", name: "Coffee Break", amount: 10, color: "#8B4513" },
  { id: "2", name: "Lunch Special", amount: 15, color: "#228B22" },
  { id: "3", name: "Dinner Date", amount: 30, color: "#DC143C" },
  { id: "4", name: "Shopping Spree", amount: 50, color: "#9370DB" },
  { id: "5", name: "VIP Experience", amount: 100, color: "#FFD700" },
  { id: "6", name: "Premium Gift", amount: 250, color: "#4B0082" },
];

export default function GiftCardsPage() {
  const { isLoggedIn, login, walletAddress } = useApp();
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<"gift" | "vouchers">("gift");
  const [showCreate, setShowCreate] = useState(false);
  const [showRedeem, setShowRedeem] = useState(false);

  // Gift Cards State
  const [selectedAmount, setSelectedAmount] = useState<number | null>(null);
  const [customAmount, setCustomAmount] = useState("");
  const [recipient, setRecipient] = useState("");
  const [recipientContact, setRecipientContact] = useState("");
  const [giftCards, setGiftCards] = useState<GiftCard[]>([
    {
      id: "1",
      code: "GIFT-ABC123-XYZ789",
      amount: 50,
      token: "USDC",
      recipient: "john@example.com",
      recipientContact: "email",
      status: "sent",
      sentDate: "2026-03-15",
      expiryDate: "2026-06-15",
    },
    {
      id: "2",
      code: "GIFT-DEF456-PQR012",
      amount: 100,
      token: "USDC",
      recipient: "+1234567890",
      recipientContact: "phone",
      status: "redeemed",
      sentDate: "2026-03-10",
      expiryDate: "2026-06-10",
    },
  ]);

  // Vouchers State
  const [vouchers, setVouchers] = useState<Voucher[]>([
    {
      id: "1",
      code: "VOUCHER-QRSTU-VWXYZ",
      amount: 25,
      token: "USDC",
      description: "Coffee Shop",
      status: "active",
      createdDate: "2026-03-16",
      expiryDate: "2026-04-16",
    },
  ]);
  const [newVoucher, setNewVoucher] = useState({
    amount: "",
    description: "",
    expiryDays: 30,
  });

  const [redeemCode, setRedeemCode] = useState("");

  useEffect(() => {
    if (!isLoggedIn) return;
    setLoading(false);
  }, [isLoggedIn]);

  const giftBalance = useMemo(() =>
    giftCards.filter(c => c.status === "sent" || c.status === "pending")
      .reduce((sum, c) => sum + c.amount, 0),
    [giftCards]
  );

  const voucherBalance = useMemo(() =>
    vouchers.filter(v => v.status === "active")
      .reduce((sum, v) => sum + v.amount, 0),
    [vouchers]
  );

  const generateGiftCode = () => {
    const chars = "ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789";
    let code = "GIFT-";
    for (let i = 0; i < 6; i++) code += chars[Math.floor(Math.random() * chars.length)];
    code += "-";
    for (let i = 0; i < 6; i++) code += chars[Math.floor(Math.random() * chars.length)];
    return code;
  };

  const generateVoucherCode = () => {
    const chars = "ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789";
    let code = "VOUCHER-";
    for (let i = 0; i < 6; i++) code += chars[Math.floor(Math.random() * chars.length)];
    return code;
  };

  const sendGiftCard = async () => {
    const amount = selectedAmount || parseFloat(customAmount);
    if (!amount || amount <= 0) {
      toast.error("Please select or enter an amount");
      return;
    }
    if (!recipient) {
      toast.error("Please enter a recipient");
      return;
    }

    const newCard: GiftCard = {
      id: crypto.randomUUID(),
      code: generateGiftCode(),
      amount,
      token: "USDC",
      recipient,
      recipientContact: recipientContact || "email",
      status: "pending",
      sentDate: new Date().toISOString().split('T')[0],
      expiryDate: new Date(Date.now() + 90 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
    };

    setGiftCards(prev => [newCard, ...prev]);
    setSelectedAmount(null);
    setCustomAmount("");
    setRecipient("");
    setRecipientContact("");
    setShowCreate(false);
    toast.success(`Gift card for ${amount} USDC sent to ${recipient}!`);
  };

  const createVoucher = async () => {
    const amount = parseFloat(newVoucher.amount);
    if (!amount || amount <= 0) {
      toast.error("Please enter a valid amount");
      return;
    }

    const voucher: Voucher = {
      id: crypto.randomUUID(),
      code: generateVoucherCode(),
      amount,
      token: "USDC",
      description: newVoucher.description || "Voucher",
      status: "active",
      createdDate: new Date().toISOString().split('T')[0],
      expiryDate: new Date(Date.now() + newVoucher.expiryDays * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
    };

    setVouchers(prev => [voucher, ...prev]);
    setNewVoucher({ amount: "", description: "", expiryDays: 30 });
    toast.success(`Voucher for ${amount} USDC created!`);
  };

  const redeemVoucher = async () => {
    if (!redeemCode.trim()) {
      toast.error("Please enter a voucher code");
      return;
    }

    const voucher = vouchers.find(v => v.code.toLowerCase() === redeemCode.toLowerCase() && v.status === "active");
    if (!voucher) {
      toast.error("Invalid or expired voucher code");
      return;
    }

    setVouchers(prev => prev.map(v =>
      v.id === voucher.id ? { ...v, status: "redeemed" as const } : v
    ));
    setRedeemCode("");
    setShowRedeem(false);
    toast.success(`Redeemed ${voucher.amount} USDC!`);
  };

  const copyCode = (code: string) => {
    navigator.clipboard.writeText(code);
    toast.success("Code copied!");
  };

  if (!isLoggedIn) {
    return (
      <div className="min-h-screen bg-background">
        <AppHeader />
        <div className="flex min-h-[80vh] flex-col items-center justify-center px-4 text-center">
          <div className="mb-6 flex h-20 w-20 items-center justify-center rounded-full bg-primary/10">
            <Gift className="h-10 w-10 text-primary" />
          </div>
          <h2 className="mb-3 font-display text-2xl text-foreground sm:text-3xl">Gift Cards & Vouchers</h2>
          <p className="mb-6 max-w-md text-sm text-muted-foreground">
            Send gift cards and create vouchers for friends and family
          </p>
          <button onClick={login} className="rounded-lg bg-primary px-6 py-3 font-semibold text-primary-foreground shadow-glow hover:opacity-90">
            Sign In to Get Started
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
            <h1 className="font-display text-2xl text-foreground sm:text-3xl">Gift Cards & Vouchers</h1>
            <p className="mt-1 text-sm text-muted-foreground">Send gifts and create vouchers</p>
          </div>
          <div className="flex gap-2">
            <button
              onClick={() => setShowRedeem(true)}
              className="flex items-center gap-1 rounded-lg bg-secondary px-3 py-2 text-sm text-foreground"
            >
              <Ticket className="h-4 w-4" />
              Redeem
            </button>
            <button
              onClick={() => setShowCreate(true)}
              className="flex items-center gap-2 rounded-lg bg-primary px-3 py-2 text-sm font-semibold text-primary-foreground shadow-glow hover:opacity-90"
            >
              <Plus className="h-4 w-4" />
              {activeTab === "gift" ? "Send Gift" : "Create"}
            </button>
          </div>
        </div>

        {/* Balance Cards */}
        <div className="mb-6 grid grid-cols-2 gap-3">
          <div className="rounded-xl border border-border bg-card p-4">
            <div className="flex items-center gap-2 text-primary mb-1">
              <Gift className="h-4 w-4" />
              <span className="text-xs text-muted-foreground">Gift Balance</span>
            </div>
            <p className="text-lg font-bold text-foreground">{giftBalance} USDC</p>
          </div>
          <div className="rounded-xl border border-border bg-card p-4">
            <div className="flex items-center gap-2 text-primary mb-1">
              <Ticket className="h-4 w-4" />
              <span className="text-xs text-muted-foreground">Voucher Balance</span>
            </div>
            <p className="text-lg font-bold text-foreground">{voucherBalance} USDC</p>
          </div>
        </div>

        {/* Tabs */}
        <div className="mb-6 flex gap-1 rounded-xl border border-border bg-card p-1">
          <button
            onClick={() => setActiveTab("gift")}
            className={`flex-1 flex items-center justify-center gap-2 rounded-lg py-2.5 text-sm font-medium transition-colors ${
              activeTab === "gift"
                ? "bg-primary text-primary-foreground"
                : "text-muted-foreground hover:text-foreground"
            }`}
          >
            <Gift className="h-4 w-4" />
            Gift Cards
          </button>
          <button
            onClick={() => setActiveTab("vouchers")}
            className={`flex-1 flex items-center justify-center gap-2 rounded-lg py-2.5 text-sm font-medium transition-colors ${
              activeTab === "vouchers"
                ? "bg-primary text-primary-foreground"
                : "text-muted-foreground hover:text-foreground"
            }`}
          >
            <Ticket className="h-4 w-4" />
            Vouchers
          </button>
        </div>

        {loading ? (
          <div className="flex justify-center py-12">
            <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
          </div>
        ) : (
          <>
            {/* Gift Cards Tab */}
            {activeTab === "gift" && (
              <div className="space-y-3">
                {giftCards.length === 0 ? (
                  <div className="rounded-xl border border-border bg-card p-8 text-center">
                    <Gift className="mx-auto mb-3 h-8 w-8 text-muted-foreground" />
                    <p className="text-sm text-muted-foreground">No gift cards yet</p>
                    <button
                      onClick={() => setShowCreate(true)}
                      className="mt-3 text-sm text-primary hover:underline"
                    >
                      Send your first gift card
                    </button>
                  </div>
                ) : (
                  giftCards.map((card) => (
                    <motion.div
                      key={card.id}
                      initial={{ opacity: 0, y: 10 }}
                      animate={{ opacity: 1, y: 0 }}
                      className={`rounded-xl border p-4 ${
                        card.status === "redeemed"
                          ? "border-green-500/30 bg-green-500/5 opacity-60"
                          : "border-border bg-card"
                      }`}
                    >
                      <div className="flex items-start justify-between">
                        <div className="flex-1">
                          <div className="flex items-center gap-2">
                            <Gift className="h-4 w-4 text-primary" />
                            <span className="font-medium text-foreground">{card.amount} {card.token}</span>
                            <span
                              className={`rounded-full px-2 py-0.5 text-xs ${
                                card.status === "sent"
                                  ? "bg-yellow-500/20 text-yellow-600"
                                  : card.status === "redeemed"
                                  ? "bg-green-500/20 text-green-600"
                                  : "bg-blue-500/20 text-blue-600"
                              }`}
                            >
                              {card.status}
                            </span>
                          </div>
                          <p className="text-xs text-muted-foreground mt-1">
                            To: {card.recipient}
                          </p>
                          <div className="mt-2 flex items-center gap-2">
                            <code className="text-xs text-muted-foreground bg-secondary px-2 py-1 rounded">
                              {card.code}
                            </code>
                            <button
                              onClick={() => copyCode(card.code)}
                              className="text-primary hover:underline text-xs"
                            >
                              Copy
                            </button>
                          </div>
                        </div>
                        <div className="text-right">
                          <QrCodeSVG value={card.code} size={60} />
                          <p className="text-xs text-muted-foreground mt-1">
                            Expires {new Date(card.expiryDate).toLocaleDateString()}
                          </p>
                        </div>
                      </div>
                    </motion.div>
                  ))
                )}
              </div>
            )}

            {/* Vouchers Tab */}
            {activeTab === "vouchers" && (
              <div className="space-y-3">
                {vouchers.length === 0 ? (
                  <div className="rounded-xl border border-border bg-card p-8 text-center">
                    <Ticket className="mx-auto mb-3 h-8 w-8 text-muted-foreground" />
                    <p className="text-sm text-muted-foreground">No vouchers yet</p>
                    <button
                      onClick={() => setShowCreate(true)}
                      className="mt-3 text-sm text-primary hover:underline"
                    >
                      Create your first voucher
                    </button>
                  </div>
                ) : (
                  vouchers.map((voucher) => (
                    <motion.div
                      key={voucher.id}
                      initial={{ opacity: 0, y: 10 }}
                      animate={{ opacity: 1, y: 0 }}
                      className={`rounded-xl border p-4 ${
                        voucher.status === "redeemed"
                          ? "border-green-500/30 bg-green-500/5 opacity-60"
                          : "border-border bg-card"
                      }`}
                    >
                      <div className="flex items-start justify-between">
                        <div className="flex-1">
                          <div className="flex items-center gap-2">
                            <Ticket className="h-4 w-4 text-primary" />
                            <span className="font-medium text-foreground">{voucher.amount} {voucher.token}</span>
                            <span
                              className={`rounded-full px-2 py-0.5 text-xs ${
                                voucher.status === "active"
                                  ? "bg-green-500/20 text-green-600"
                                  : "bg-red-500/20 text-red-600"
                              }`}
                            >
                              {voucher.status}
                            </span>
                          </div>
                          <p className="text-xs text-muted-foreground mt-1">
                            {voucher.description}
                          </p>
                          <div className="mt-2 flex items-center gap-2">
                            <code className="text-xs text-muted-foreground bg-secondary px-2 py-1 rounded">
                              {voucher.code}
                            </code>
                            <button
                              onClick={() => copyCode(voucher.code)}
                              className="text-primary hover:underline text-xs"
                            >
                              Copy
                            </button>
                          </div>
                        </div>
                        <div className="text-right">
                          <p className="text-xs text-muted-foreground">
                            Created {new Date(voucher.createdDate).toLocaleDateString()}
                          </p>
                          <p className="text-xs text-muted-foreground">
                            Expires {new Date(voucher.expiryDate).toLocaleDateString()}
                          </p>
                        </div>
                      </div>
                    </motion.div>
                  ))
                )}
              </div>
            )}
          </>
        )}
      </div>
      <Footer />

      {/* Create Modal */}
      <AnimatePresence>
        {showCreate && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4"
            onClick={() => setShowCreate(false)}
          >
            <motion.div
              initial={{ scale: 0.9 }}
              animate={{ scale: 1 }}
              exit={{ scale: 0.9 }}
              className="w-full max-w-sm rounded-2xl bg-card p-6"
              onClick={(e) => e.stopPropagation()}
            >
              <div className="mb-4 flex items-center justify-between">
                <h3 className="font-display text-lg text-foreground">
                  {activeTab === "gift" ? "Send Gift Card" : "Create Voucher"}
                </h3>
                <button onClick={() => setShowCreate(false)} className="text-muted-foreground">
                  <X className="h-5 w-5" />
                </button>
              </div>

              {activeTab === "gift" ? (
                <div className="space-y-4">
                  {/* Amount Selection */}
                  <div>
                    <label className="mb-2 block text-sm font-medium text-foreground">Amount</label>
                    <div className="flex flex-wrap gap-2">
                      {PRESET_AMOUNTS.map((amt) => (
                        <button
                          key={amt}
                          onClick={() => { setSelectedAmount(amt); setCustomAmount(""); }}
                          className={`px-3 py-2 rounded-lg text-sm font-medium transition-colors ${
                            selectedAmount === amt
                              ? "bg-primary text-primary-foreground"
                              : "bg-secondary text-foreground hover:bg-secondary/80"
                          }`}
                        >
                          ${amt}
                        </button>
                      ))}
                    </div>
                    <div className="mt-2">
                      <input
                        type="number"
                        value={customAmount}
                        onChange={(e) => { setCustomAmount(e.target.value); setSelectedAmount(null); }}
                        placeholder="Custom amount"
                        className="w-full rounded-lg border border-border bg-background px-3 py-2 text-sm text-foreground placeholder:text-muted-foreground/50 focus:outline-none focus:ring-2 focus:ring-ring"
                      />
                    </div>
                  </div>

                  {/* Recipient */}
                  <div>
                    <label className="mb-2 block text-sm font-medium text-foreground">Recipient</label>
                    <input
                      type="text"
                      value={recipient}
                      onChange={(e) => setRecipient(e.target.value)}
                      placeholder="Email or phone number"
                      className="w-full rounded-lg border border-border bg-background px-3 py-2 text-sm text-foreground placeholder:text-muted-foreground/50 focus:outline-none focus:ring-2 focus:ring-ring"
                    />
                  </div>

                  <button
                    onClick={sendGiftCard}
                    className="flex w-full items-center justify-center gap-2 rounded-lg bg-primary py-3 text-sm font-semibold text-primary-foreground shadow-glow hover:opacity-90"
                  >
                    <Gift className="h-4 w-4" />
                    Send Gift Card
                  </button>
                </div>
              ) : (
                <div className="space-y-4">
                  {/* Amount */}
                  <div>
                    <label className="mb-2 block text-sm font-medium text-foreground">Amount</label>
                    <div className="relative">
                      <DollarSign className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                      <input
                        type="number"
                        value={newVoucher.amount}
                        onChange={(e) => setNewVoucher({ ...newVoucher, amount: e.target.value })}
                        placeholder="0.00"
                        className="w-full rounded-lg border border-border bg-background pl-10 pr-3 py-2 text-sm text-foreground placeholder:text-muted-foreground/50 focus:outline-none focus:ring-2 focus:ring-ring"
                      />
                    </div>
                  </div>

                  {/* Description */}
                  <div>
                    <label className="mb-2 block text-sm font-medium text-foreground">Description (optional)</label>
                    <input
                      type="text"
                      value={newVoucher.description}
                      onChange={(e) => setNewVoucher({ ...newVoucher, description: e.target.value })}
                      placeholder="e.g., Coffee Shop"
                      className="w-full rounded-lg border border-border bg-background px-3 py-2 text-sm text-foreground placeholder:text-muted-foreground/50 focus:outline-none focus:ring-2 focus:ring-ring"
                    />
                  </div>

                  {/* Expiry */}
                  <div>
                    <label className="mb-2 block text-sm font-medium text-foreground">Expiry (days)</label>
                    <input
                      type="number"
                      value={newVoucher.expiryDays}
                      onChange={(e) => setNewVoucher({ ...newVoucher, expiryDays: parseInt(e.target.value) || 30 })}
                      className="w-full rounded-lg border border-border bg-background px-3 py-2 text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-ring"
                    />
                  </div>

                  <button
                    onClick={createVoucher}
                    className="flex w-full items-center justify-center gap-2 rounded-lg bg-primary py-3 text-sm font-semibold text-primary-foreground shadow-glow hover:opacity-90"
                  >
                    <Plus className="h-4 w-4" />
                    Create Voucher
                  </button>
                </div>
              )}
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Redeem Modal */}
      <AnimatePresence>
        {showRedeem && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4"
            onClick={() => setShowRedeem(false)}
          >
            <motion.div
              initial={{ scale: 0.9 }}
              animate={{ scale: 1 }}
              exit={{ scale: 0.9 }}
              className="w-full max-w-sm rounded-2xl bg-card p-6"
              onClick={(e) => e.stopPropagation()}
            >
              <div className="mb-4 flex items-center justify-between">
                <h3 className="font-display text-lg text-foreground">Redeem Code</h3>
                <button onClick={() => setShowRedeem(false)} className="text-muted-foreground">
                  <X className="h-5 w-5" />
                </button>
              </div>

              <div className="space-y-4">
                <div>
                  <label className="mb-2 block text-sm font-medium text-foreground">Code</label>
                  <input
                    type="text"
                    value={redeemCode}
                    onChange={(e) => setRedeemCode(e.target.value)}
                    placeholder="Enter gift card or voucher code"
                    className="w-full rounded-lg border border-border bg-background px-3 py-3 text-center font-mono text-sm text-foreground placeholder:text-muted-foreground/50 focus:outline-none focus:ring-2 focus:ring-ring"
                  />
                </div>

                <button
                  onClick={redeemVoucher}
                  className="flex w-full items-center justify-center gap-2 rounded-lg bg-primary py-3 text-sm font-semibold text-primary-foreground shadow-glow hover:opacity-90"
                >
                  <Check className="h-4 w-4" />
                  Redeem
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
