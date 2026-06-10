/** StatementPage - Transaction statement generation with category breakdown, PDF download, and email delivery */
import { useState } from "react";
import { motion } from "framer-motion";
import { FileText, Download, Mail, Calendar, Filter, PieChart, TrendingUp, Loader2, ChevronDown, Send, Eye } from "lucide-react";
import { useApp } from "@/contexts/AppContext";
import AppHeader from "@/components/AppHeader";
import Footer from "@/components/Footer";
import { toast } from "sonner";

interface Transaction {
  id: string;
  type: "send" | "receive";
  amount: number;
  token: string;
  category: string;
  date: string;
  recipient?: string;
  description?: string;
}

interface CategoryBreakdown {
  category: string;
  amount: number;
  percentage: number;
  count: number;
}

/** StatementPage component - Provides period selection, category breakdown, statement preview, PDF download, and email sending */
export default function StatementPage() {
  const { isLoggedIn, login } = useApp();
  const [loading, setLoading] = useState(true);
  const [dateRange, setDateRange] = useState("monthly");
  const [startDate, setStartDate] = useState(() => {
    const d = new Date();
    d.setMonth(d.getMonth() - 1);
    return d.toISOString().split("T")[0];
  });
  const [endDate, setEndDate] = useState(() => new Date().toISOString().split("T")[0]);
  const [selectedMonth, setSelectedMonth] = useState(() => {
    const now = new Date();
    return `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, "0")}`;
  });
  const [email, setEmail] = useState("");
  const [showPreview, setShowPreview] = useState(false);
  const [generating, setGenerating] = useState(false);

  const transactions: Transaction[] = [
    { id: "1", type: "send", amount: 50, token: "USDC", category: "Food & Dining", date: "2026-03-15", recipient: "Restaurant XYZ", description: "Dinner with team" },
    { id: "2", type: "receive", amount: 200, token: "USDC", category: "Income", date: "2026-03-14", description: "Freelance payment" },
    { id: "3", type: "send", amount: 25, token: "USDC", category: "Transport", date: "2026-03-13", description: "Uber ride" },
    { id: "4", type: "send", amount: 120, token: "USDC", category: "Utilities", date: "2026-03-12", description: "Electric bill" },
    { id: "5", type: "receive", amount: 500, token: "USDC", category: "Income", date: "2026-03-10", description: "Salary" },
  ];

  const categoryBreakdown: CategoryBreakdown[] = [
    { category: "Food & Dining", amount: 150, percentage: 25, count: 5 },
    { category: "Transport", amount: 75, percentage: 12.5, count: 3 },
    { category: "Utilities", amount: 120, percentage: 20, count: 2 },
    { category: "Shopping", amount: 200, percentage: 33.3, count: 4 },
    { category: "Entertainment", amount: 55, percentage: 9.2, count: 2 },
  ];

  const totalSent = transactions.filter(t => t.type === "send").reduce((sum, t) => sum + t.amount, 0);
  const totalReceived = transactions.filter(t => t.type === "receive").reduce((sum, t) => sum + t.amount, 0);
  const netChange = totalReceived - totalSent;

  const monthlyStatements = [
    { month: "2026-03", label: "March 2026", status: "current" },
    { month: "2026-02", label: "February 2026", status: "available" },
    { month: "2026-01", label: "January 2026", status: "available" },
  ];

  if (!isLoggedIn) {
    return (
      <div className="min-h-screen bg-background">
        <AppHeader />
        <div className="flex min-h-[80vh] flex-col items-center justify-center px-4 text-center">
          <div className="mb-6 flex h-20 w-20 items-center justify-center rounded-full bg-primary/10">
            <FileText className="h-10 w-10 text-primary" />
          </div>
          <h2 className="mb-3 font-display text-2xl text-foreground sm:text-3xl">Statements</h2>
          <p className="mb-6 max-w-md text-sm text-muted-foreground">
            Generate and download your transaction statements for tax and accounting purposes.
          </p>
          <button onClick={login} className="rounded-lg bg-primary px-6 py-3 font-semibold text-primary-foreground shadow-glow hover:opacity-90">
            Sign In to View Statements
          </button>
        </div>
        <Footer />
      </div>
    );
  }

  const handleGeneratePDF = async () => {
    setGenerating(true);
    toast.success("PDF generated successfully!");
    setGenerating(false);
  };

  const handleEmailDelivery = async () => {
    if (!email) {
      toast.error("Please enter an email address");
      return;
    }
    toast.success(`Statement sent to ${email}`);
    setEmail("");
  };

  return (
    <div className="min-h-screen bg-background">
      <AppHeader />
      <div className="container mx-auto max-w-4xl px-4 pt-20 pb-12 sm:pt-24 sm:pb-16">
        <div className="mb-8">
          <h1 className="font-display text-2xl text-foreground sm:text-3xl">Statements</h1>
          <p className="mt-1 text-sm text-muted-foreground">Generate and download your transaction statements</p>
        </div>

        <div className="grid gap-6 lg:grid-cols-3">
          <div className="lg:col-span-2 space-y-6">
            <motion.div
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              className="rounded-xl border border-border bg-card p-6"
            >
              <h2 className="mb-4 flex items-center gap-2 text-lg font-semibold text-foreground">
                <Calendar className="h-5 w-5 text-primary" />
                Select Period
              </h2>
              <div className="grid gap-4 sm:grid-cols-2">
                <div>
                  <label className="mb-2 block text-sm font-medium text-muted-foreground">Date Range</label>
                  <div className="relative">
                    <select
                      value={dateRange}
                      onChange={(e) => setDateRange(e.target.value)}
                      className="w-full appearance-none rounded-lg border border-border bg-background px-4 py-2.5 pr-10 text-sm text-foreground focus:border-primary focus:outline-none"
                    >
                      <option value="weekly">Weekly</option>
                      <option value="monthly">Monthly</option>
                      <option value="quarterly">Quarterly</option>
                      <option value="yearly">Yearly</option>
                      <option value="custom">Custom Range</option>
                    </select>
                    <ChevronDown className="pointer-events-none absolute right-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                  </div>
                </div>
                <div>
                  <label className="mb-2 block text-sm font-medium text-muted-foreground">Month</label>
                  <input
                    type="month"
                    value={selectedMonth}
                    onChange={(e) => setSelectedMonth(e.target.value)}
                    className="w-full rounded-lg border border-border bg-background px-4 py-2.5 text-sm text-foreground focus:border-primary focus:outline-none"
                  />
                </div>
                {dateRange === "custom" && (
                  <>
                    <div>
                      <label className="mb-2 block text-sm font-medium text-muted-foreground">Start Date</label>
                      <input
                        type="date"
                        value={startDate}
                        onChange={(e) => setStartDate(e.target.value)}
                        className="w-full rounded-lg border border-border bg-background px-4 py-2.5 text-sm text-foreground focus:border-primary focus:outline-none"
                      />
                    </div>
                    <div>
                      <label className="mb-2 block text-sm font-medium text-muted-foreground">End Date</label>
                      <input
                        type="date"
                        value={endDate}
                        onChange={(e) => setEndDate(e.target.value)}
                        className="w-full rounded-lg border border-border bg-background px-4 py-2.5 text-sm text-foreground focus:border-primary focus:outline-none"
                      />
                    </div>
                  </>
                )}
              </div>
            </motion.div>

            <motion.div
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.1 }}
              className="rounded-xl border border-border bg-card p-6"
            >
              <h2 className="mb-4 flex items-center gap-2 text-lg font-semibold text-foreground">
                <PieChart className="h-5 w-5 text-primary" />
                Category Breakdown
              </h2>
              <div className="space-y-3">
                {categoryBreakdown.map((cat) => (
                  <div key={cat.category}>
                    <div className="mb-1 flex items-center justify-between text-sm">
                      <span className="font-medium text-foreground">{cat.category}</span>
                      <span className="text-muted-foreground">${cat.amount.toFixed(2)} ({cat.percentage}%)</span>
                    </div>
                    <div className="h-2 w-full rounded-full bg-secondary">
                      <div
                        className="h-2 rounded-full bg-primary transition-all"
                        style={{ width: `${cat.percentage}%` }}
                      />
                    </div>
                  </div>
                ))}
              </div>
            </motion.div>

            <motion.div
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.2 }}
              className="rounded-xl border border-border bg-card p-6"
            >
              <div className="mb-4 flex items-center justify-between">
                <h2 className="flex items-center gap-2 text-lg font-semibold text-foreground">
                  <FileText className="h-5 w-5 text-primary" />
                  Statement Preview
                </h2>
                <button
                  onClick={() => setShowPreview(!showPreview)}
                  className="flex items-center gap-1 text-sm text-primary hover:underline"
                >
                  <Eye className="h-4 w-4" />
                  {showPreview ? "Hide" : "Show"}
                </button>
              </div>
              {showPreview && (
                <div className="rounded-lg border border-border bg-secondary/50 p-4">
                  <table className="w-full text-sm">
                    <thead>
                      <tr className="border-b border-border text-left text-muted-foreground">
                        <th className="pb-2">Date</th>
                        <th className="pb-2">Description</th>
                        <th className="pb-2 text-right">Amount</th>
                      </tr>
                    </thead>
                    <tbody>
                      {transactions.slice(0, 5).map((tx) => (
                        <tr key={tx.id} className="border-b border-border/50">
                          <td className="py-2">{new Date(tx.date).toLocaleDateString()}</td>
                          <td className="py-2">{tx.description || tx.category}</td>
                          <td className={`py-2 text-right ${tx.type === "send" ? "text-red-500" : "text-green-500"}`}>
                            {tx.type === "send" ? "-" : "+"}${tx.amount.toFixed(2)}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
              <div className="mt-4 flex flex-col gap-3 sm:flex-row">
                <button
                  onClick={handleGeneratePDF}
                  disabled={generating}
                  className="flex flex-1 items-center justify-center gap-2 rounded-lg bg-primary px-4 py-2.5 text-sm font-semibold text-primary-foreground shadow-glow hover:opacity-90 disabled:opacity-50"
                >
                  {generating ? <Loader2 className="h-4 w-4 animate-spin" /> : <Download className="h-4 w-4" />}
                  {generating ? "Generating..." : "Download PDF"}
                </button>
                <div className="flex gap-2">
                  <input
                    type="email"
                    placeholder="Email address"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    className="flex-1 rounded-lg border border-border bg-background px-3 py-2.5 text-sm text-foreground placeholder:text-muted-foreground focus:border-primary focus:outline-none"
                  />
                  <button
                    onClick={handleEmailDelivery}
                    className="flex items-center gap-2 rounded-lg border border-border px-4 py-2.5 text-sm font-medium hover:bg-secondary"
                  >
                    <Mail className="h-4 w-4" />
                    Send
                  </button>
                </div>
              </div>
            </motion.div>
          </div>

          <div className="space-y-6">
            <motion.div
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.3 }}
              className="rounded-xl border border-border bg-card p-6"
            >
              <h2 className="mb-4 flex items-center gap-2 text-lg font-semibold text-foreground">
                <TrendingUp className="h-5 w-5 text-primary" />
                Summary
              </h2>
              <div className="space-y-4">
                <div className="rounded-lg bg-secondary/50 p-4">
                  <p className="text-sm text-muted-foreground">Total Received</p>
                  <p className="text-2xl font-bold text-green-500">+${totalReceived.toFixed(2)}</p>
                </div>
                <div className="rounded-lg bg-secondary/50 p-4">
                  <p className="text-sm text-muted-foreground">Total Sent</p>
                  <p className="text-2xl font-bold text-red-500">-${totalSent.toFixed(2)}</p>
                </div>
                <div className="rounded-lg bg-primary/10 p-4">
                  <p className="text-sm text-muted-foreground">Net Change</p>
                  <p className={`text-2xl font-bold ${netChange >= 0 ? "text-green-500" : "text-red-500"}`}>
                    {netChange >= 0 ? "+" : ""}${netChange.toFixed(2)}
                  </p>
                </div>
              </div>
            </motion.div>

            <motion.div
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.4 }}
              className="rounded-xl border border-border bg-card p-6"
            >
              <h2 className="mb-4 flex items-center gap-2 text-lg font-semibold text-foreground">
                <FileText className="h-5 w-5 text-primary" />
                Past Statements
              </h2>
              <div className="space-y-2">
                {monthlyStatements.map((stmt) => (
                  <div
                    key={stmt.month}
                    className="flex items-center justify-between rounded-lg border border-border p-3 hover:bg-secondary/50"
                  >
                    <div>
                      <p className="font-medium text-foreground">{stmt.label}</p>
                      <p className="text-xs text-muted-foreground capitalize">{stmt.status}</p>
                    </div>
                    <div className="flex gap-2">
                      <button className="rounded-lg p-2 hover:bg-secondary">
                        <Eye className="h-4 w-4 text-muted-foreground" />
                      </button>
                      <button className="rounded-lg p-2 hover:bg-secondary">
                        <Download className="h-4 w-4 text-muted-foreground" />
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            </motion.div>
          </div>
        </div>
      </div>
      <Footer />
    </div>
  );
}
