import { useState } from "react";
import { motion } from "framer-motion";
import { Store, QrCode, BarChart3, DollarSign, Link2, Copy, Download, Settings, ShoppingCart, CreditCard, TrendingUp, TrendingDown, ExternalLink, Check, Loader2, FileText, Calculator } from "lucide-react";
import { useApp } from "@/contexts/AppContext";
import AppHeader from "@/components/AppHeader";
import Footer from "@/components/Footer";
import { toast } from "sonner";

interface Sale {
  id: string;
  amount: number;
  token: string;
  customer: string;
  date: string;
  status: "completed" | "pending" | "refunded";
}

export default function MerchantToolsPage() {
  const { isLoggedIn, login } = useApp();
  const [activeTab, setActiveTab] = useState<"dashboard" | "button" | "qr" | "payouts">("dashboard");
  const [buttonStyle, setButtonStyle] = useState<"filled" | "outline">("filled");
  const [buttonColor, setButtonColor] = useState("#6366f1");
  const [buttonText, setButtonText] = useState("Pay with Peys");
  const [paymentAmount, setPaymentAmount] = useState("");
  const [generating, setGenerating] = useState(false);

  const merchantLink = "https://pay.peys.io/moses-store";
  
  const stats = {
    totalSales: 0,
    monthlySales: 0,
    pendingPayout: 0,
    totalCustomers: 0,
  };

  const sales: Sale[] = [];

  const handleCopyLink = async () => {
    await navigator.clipboard.writeText(merchantLink);
    toast.success("Store link copied!");
  };

  const handleGenerateButton = () => {
    setGenerating(true);
    setGenerating(false);
    toast.success("Button code generated!");
  };

  const buttonCode = `<a href="${merchantLink}${paymentAmount ? `?amount=${paymentAmount}` : ''}" class="peys-pay-button" data-style="${buttonStyle}" data-color="${buttonColor}">${buttonText}</a>
<script src="https://sdk.peys.io/button.js"></script>`;

  if (!isLoggedIn) {
    return (
      <div className="min-h-screen bg-background">
        <AppHeader />
        <div className="flex min-h-[80vh] flex-col items-center justify-center px-4 text-center">
          <div className="mb-6 flex h-20 w-20 items-center justify-center rounded-full bg-primary/10">
            <Store className="h-10 w-10 text-primary" />
          </div>
          <h2 className="mb-3 font-display text-2xl text-foreground sm:text-3xl">Merchant Tools</h2>
          <p className="mb-6 max-w-md text-sm text-muted-foreground">
            Accept payments seamlessly with our merchant tools. Create payment buttons and QR codes for your store.
          </p>
          <button onClick={login} className="rounded-lg bg-primary px-6 py-3 font-semibold text-primary-foreground shadow-glow hover:opacity-90">
            Sign In to Access Merchant Tools
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
          <h1 className="font-display text-2xl text-foreground sm:text-3xl">Merchant Tools</h1>
          <p className="mt-1 text-sm text-muted-foreground">Accept payments and manage your store</p>
        </div>

        <div className="mb-6 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            className="rounded-xl border border-border bg-card p-5"
          >
            <div className="mb-2 flex h-10 w-10 items-center justify-center rounded-lg bg-green-500/10">
              <TrendingUp className="h-5 w-5 text-green-500" />
            </div>
            <p className="text-2xl font-bold text-foreground">${stats.totalSales.toLocaleString()}</p>
            <p className="text-sm text-muted-foreground">Total Sales</p>
          </motion.div>
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
            className="rounded-xl border border-border bg-card p-5"
          >
            <div className="mb-2 flex h-10 w-10 items-center justify-center rounded-lg bg-primary/10">
              <BarChart3 className="h-5 w-5 text-primary" />
            </div>
            <p className="text-2xl font-bold text-foreground">${stats.monthlySales.toLocaleString()}</p>
            <p className="text-sm text-muted-foreground">This Month</p>
          </motion.div>
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.15 }}
            className="rounded-xl border border-border bg-card p-5"
          >
            <div className="mb-2 flex h-10 w-10 items-center justify-center rounded-lg bg-yellow-500/10">
              <DollarSign className="h-5 w-5 text-yellow-500" />
            </div>
            <p className="text-2xl font-bold text-yellow-500">${stats.pendingPayout}</p>
            <p className="text-sm text-muted-foreground">Pending Payout</p>
          </motion.div>
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
            className="rounded-xl border border-border bg-card p-5"
          >
            <div className="mb-2 flex h-10 w-10 items-center justify-center rounded-lg bg-blue-500/10">
              <ShoppingCart className="h-5 w-5 text-blue-500" />
            </div>
            <p className="text-2xl font-bold text-foreground">{stats.totalCustomers}</p>
            <p className="text-sm text-muted-foreground">Customers</p>
          </motion.div>
        </div>

        <div className="mb-6 flex gap-2 overflow-x-auto border-b border-border pb-2">
          {[
            { id: "dashboard", label: "Dashboard", icon: BarChart3 },
            { id: "button", label: "Payment Button", icon: CreditCard },
            { id: "qr", label: "QR Code", icon: QrCode },
            { id: "payouts", label: "Payouts", icon: DollarSign },
          ].map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id as typeof activeTab)}
              className={`flex items-center gap-2 whitespace-nowrap rounded-lg px-4 py-2 text-sm font-medium transition-colors ${
                activeTab === tab.id
                  ? "bg-primary text-primary-foreground"
                  : "text-muted-foreground hover:bg-secondary"
              }`}
            >
              <tab.icon className="h-4 w-4" />
              {tab.label}
            </button>
          ))}
        </div>

        {activeTab === "dashboard" && (
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            className="space-y-6"
          >
            <div className="rounded-xl border border-border bg-card p-6">
              <h2 className="mb-4 flex items-center gap-2 text-lg font-semibold text-foreground">
                <Link2 className="h-5 w-5 text-primary" />
                Your Store Link
              </h2>
              <div className="flex gap-3">
                <input
                  type="text"
                  value={merchantLink}
                  readOnly
                  className="flex-1 rounded-lg border border-border bg-secondary/50 px-4 py-2.5 font-mono text-sm text-muted-foreground"
                />
                <button
                  onClick={handleCopyLink}
                  className="flex items-center gap-2 rounded-lg bg-primary px-4 py-2.5 font-medium text-primary-foreground hover:opacity-90"
                >
                  <Copy className="h-4 w-4" />
                  Copy
                </button>
              </div>
            </div>

            <div className="rounded-xl border border-border bg-card p-6">
              <h2 className="mb-4 flex items-center gap-2 text-lg font-semibold text-foreground">
                <BarChart3 className="h-5 w-5 text-primary" />
                Recent Sales
              </h2>
              <div className="space-y-3">
                {sales.length === 0 ? (
                  <div className="text-center py-8 text-muted-foreground text-sm">No sales yet</div>
                ) : (
                  sales.map((sale) => (
                    <div key={sale.id} className="flex items-center justify-between rounded-lg border border-border p-4">
                      <div className="flex items-center gap-3">
                        <div className={`flex h-10 w-10 items-center justify-center rounded-lg ${
                          sale.status === "completed" ? "bg-green-500/10" :
                          sale.status === "pending" ? "bg-yellow-500/10" :
                          "bg-red-500/10"
                        }`}>
                          {sale.status === "completed" ? (
                            <TrendingUp className="h-5 w-5 text-green-500" />
                          ) : sale.status === "pending" ? (
                            <Clock className="h-5 w-5 text-yellow-500" />
                          ) : (
                            <TrendingDown className="h-5 w-5 text-red-500" />
                          )}
                        </div>
                        <div>
                          <p className="font-medium text-foreground">${sale.amount.toFixed(2)} {sale.token}</p>
                          <p className="text-xs text-muted-foreground">{sale.customer}</p>
                        </div>
                      </div>
                      <div className="text-right">
                        <span className={`rounded-full px-2 py-1 text-xs font-medium ${
                          sale.status === "completed" ? "bg-green-500/10 text-green-600" :
                          sale.status === "pending" ? "bg-yellow-500/10 text-yellow-600" :
                          "bg-red-500/10 text-red-600"
                        }`}>
                          {sale.status}
                        </span>
                        <p className="mt-1 text-xs text-muted-foreground">{new Date(sale.date).toLocaleDateString()}</p>
                      </div>
                    </div>
                  ))
                )}
              </div>
            </div>
          </motion.div>
        )}

        {activeTab === "button" && (
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            className="space-y-6"
          >
            <div className="rounded-xl border border-border bg-card p-6">
              <h2 className="mb-4 flex items-center gap-2 text-lg font-semibold text-foreground">
                <CreditCard className="h-5 w-5 text-primary" />
                Payment Button Generator
              </h2>
              <div className="grid gap-4 sm:grid-cols-2">
                <div>
                  <label className="mb-2 block text-sm font-medium text-muted-foreground">Button Text</label>
                  <input
                    type="text"
                    value={buttonText}
                    onChange={(e) => setButtonText(e.target.value)}
                    className="w-full rounded-lg border border-border bg-background px-4 py-2.5 text-sm text-foreground focus:border-primary focus:outline-none"
                  />
                </div>
                <div>
                  <label className="mb-2 block text-sm font-medium text-muted-foreground">Default Amount (optional)</label>
                  <input
                    type="number"
                    value={paymentAmount}
                    onChange={(e) => setPaymentAmount(e.target.value)}
                    placeholder="Leave empty for custom amount"
                    className="w-full rounded-lg border border-border bg-background px-4 py-2.5 text-sm text-foreground placeholder:text-muted-foreground focus:border-primary focus:outline-none"
                  />
                </div>
                <div>
                  <label className="mb-2 block text-sm font-medium text-muted-foreground">Style</label>
                  <select
                    value={buttonStyle}
                    onChange={(e) => setButtonStyle(e.target.value as "filled" | "outline")}
                    className="w-full rounded-lg border border-border bg-background px-4 py-2.5 text-sm text-foreground focus:border-primary focus:outline-none"
                  >
                    <option value="filled">Filled</option>
                    <option value="outline">Outline</option>
                  </select>
                </div>
                <div>
                  <label className="mb-2 block text-sm font-medium text-muted-foreground">Color</label>
                  <div className="flex gap-2">
                    <input
                      type="color"
                      value={buttonColor}
                      onChange={(e) => setButtonColor(e.target.value)}
                      className="h-11 w-14 rounded-lg border border-border"
                    />
                    <input
                      type="text"
                      value={buttonColor}
                      onChange={(e) => setButtonColor(e.target.value)}
                      className="flex-1 rounded-lg border border-border bg-background px-4 py-2.5 font-mono text-sm text-foreground uppercase focus:border-primary focus:outline-none"
                    />
                  </div>
                </div>
              </div>
              <button
                onClick={handleGenerateButton}
                disabled={generating}
                className="mt-4 flex items-center gap-2 rounded-lg bg-primary px-4 py-2.5 font-semibold text-primary-foreground hover:opacity-90 disabled:opacity-50"
              >
                {generating ? <Loader2 className="h-4 w-4 animate-spin" /> : <FileText className="h-4 w-4" />}
                Generate Button Code
              </button>
            </div>

            <div className="rounded-xl border border-border bg-card p-6">
              <h2 className="mb-4 flex items-center gap-2 text-lg font-semibold text-foreground">
                <Code className="h-5 w-5 text-primary" />
                Embed Code
              </h2>
              <pre className="overflow-x-auto rounded-lg bg-secondary p-4 text-sm">
                <code className="text-muted-foreground">{buttonCode}</code>
              </pre>
              <button
                onClick={() => {
                  navigator.clipboard.writeText(buttonCode);
                  toast.success("Code copied!");
                }}
                className="mt-4 flex items-center gap-2 rounded-lg border border-border px-4 py-2.5 font-medium hover:bg-secondary"
              >
                <Copy className="h-4 w-4" />
                Copy Code
              </button>
            </div>

            <div className="rounded-xl border border-border bg-card p-6">
              <h2 className="mb-4 text-lg font-semibold text-foreground">Preview</h2>
              <div className="flex items-center justify-center rounded-lg bg-secondary/50 p-8">
                <button
                  style={{
                    backgroundColor: buttonStyle === "filled" ? buttonColor : "transparent",
                    borderColor: buttonColor,
                    borderWidth: "2px",
                    borderStyle: "solid",
                    color: buttonStyle === "filled" ? "white" : buttonColor,
                  }}
                  className={`rounded-lg px-6 py-3 font-semibold ${buttonStyle === "filled" ? "text-white" : ""}`}
                >
                  {buttonText}
                </button>
              </div>
            </div>
          </motion.div>
        )}

        {activeTab === "qr" && (
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            className="space-y-6"
          >
            <div className="rounded-xl border border-border bg-card p-6">
              <h2 className="mb-4 flex items-center gap-2 text-lg font-semibold text-foreground">
                <QrCode className="h-5 w-5 text-primary" />
                Payment QR Code
              </h2>
              <div className="grid gap-6 lg:grid-cols-2">
                <div className="flex flex-col items-center">
                  <div className="mb-4 flex h-48 w-48 items-center justify-center rounded-xl bg-white p-4">
                    <div className="flex h-full w-full items-center justify-center bg-black text-white">
                      <QrCode className="h-32 w-32" />
                    </div>
                  </div>
                  <div className="flex gap-2">
                    <button className="flex items-center gap-2 rounded-lg bg-primary px-4 py-2 text-sm font-medium text-primary-foreground hover:opacity-90">
                      <Download className="h-4 w-4" />
                      PNG
                    </button>
                    <button className="flex items-center gap-2 rounded-lg border border-border px-4 py-2 text-sm font-medium hover:bg-secondary">
                      <Download className="h-4 w-4" />
                      SVG
                    </button>
                  </div>
                </div>
                <div className="space-y-4">
                  <div>
                    <label className="mb-2 block text-sm font-medium text-muted-foreground">Amount (optional)</label>
                    <input
                      type="number"
                      placeholder="Enter amount"
                      className="w-full rounded-lg border border-border bg-background px-4 py-2.5 text-sm text-foreground placeholder:text-muted-foreground focus:border-primary focus:outline-none"
                    />
                  </div>
                  <div>
                    <label className="mb-2 block text-sm font-medium text-muted-foreground">Description</label>
                    <input
                      type="text"
                      placeholder="Payment for..."
                      className="w-full rounded-lg border border-border bg-background px-4 py-2.5 text-sm text-foreground placeholder:text-muted-foreground focus:border-primary focus:outline-none"
                    />
                  </div>
                  <div className="rounded-lg bg-secondary/50 p-4">
                    <p className="text-sm text-muted-foreground">Wallet Address</p>
                    <p className="mt-1 font-mono text-sm text-foreground">0x1234...5678</p>
                  </div>
                </div>
              </div>
            </div>
          </motion.div>
        )}

        {activeTab === "payouts" && (
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            className="space-y-6"
          >
            <div className="rounded-xl border border-border bg-card p-6">
              <h2 className="mb-4 flex items-center gap-2 text-lg font-semibold text-foreground">
                <Calculator className="h-5 w-5 text-primary" />
                Fee Calculator
              </h2>
              <div className="grid gap-4 sm:grid-cols-2">
                <div>
                  <label className="mb-2 block text-sm font-medium text-muted-foreground">Transaction Amount</label>
                  <input
                    type="number"
                    placeholder="100"
                    className="w-full rounded-lg border border-border bg-background px-4 py-2.5 text-sm text-foreground placeholder:text-muted-foreground focus:border-primary focus:outline-none"
                  />
                </div>
                <div>
                  <label className="mb-2 block text-sm font-medium text-muted-foreground">Network Fee</label>
                  <input
                    type="text"
                    value="$0.01"
                    readOnly
                    className="w-full rounded-lg border border-border bg-secondary/50 px-4 py-2.5 text-sm text-muted-foreground"
                  />
                </div>
              </div>
              <div className="mt-4 rounded-lg border border-border bg-secondary/50 p-4">
                <div className="flex items-center justify-between">
                  <span className="text-muted-foreground">Platform Fee (2.5%)</span>
                  <span className="font-medium">$2.50</span>
                </div>
                <div className="mt-2 flex items-center justify-between border-t border-border pt-2">
                  <span className="font-medium text-foreground">You Receive</span>
                  <span className="text-lg font-bold text-green-500">$97.49</span>
                </div>
              </div>
            </div>

            <div className="rounded-xl border border-border bg-card p-6">
              <h2 className="mb-4 flex items-center gap-2 text-lg font-semibold text-foreground">
                <DollarSign className="h-5 w-5 text-primary" />
                Payout History
              </h2>
              <div className="space-y-3">
                <div className="text-center py-8 text-muted-foreground text-sm">No payout history</div>
              </div>
            </div>
          </motion.div>
        )}
      </div>
      <Footer />
    </div>
  );
}
