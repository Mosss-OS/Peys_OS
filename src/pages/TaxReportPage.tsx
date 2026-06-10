/** TaxReportPage - Tax report generation from transaction history with date filtering and CSV export */
import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import { FileText, Download, Calendar, Filter, Search, Loader2, CheckCircle } from "lucide-react";
import { useApp } from "@/contexts/AppContext";
import AppHeader from "@/components/AppHeader";
import Footer from "@/components/Footer";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";

interface TaxRecord {
  id: string;
  date: string;
  type: "income" | "expense" | "transfer";
  amount: string;
  token: string;
  txHash: string;
  description: string;
}

/** TaxReportPage component - Fetches payments, filters by date range, displays records in a table, and downloads CSV tax reports */
export default function TaxReportPage() {
  const { isLoggedIn, login, walletAddress } = useApp();
  const [loading, setLoading] = useState(true);
  const [generating, setGenerating] = useState(false);
  const [dateRange, setDateRange] = useState({ start: "", end: "" });
  const [records, setRecords] = useState<TaxRecord[]>([]);
  const [filteredRecords, setFilteredRecords] = useState<TaxRecord[]>([]);

  useEffect(() => {
    if (isLoggedIn && walletAddress) {
      fetchTaxRecords();
    } else {
      setLoading(false);
    }
  }, [isLoggedIn, walletAddress]);

  const fetchTaxRecords = async () => {
    try {
      setLoading(true);
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        setLoading(false);
        return;
      }

      const userEmail = user.email || "";

      const { data: payments } = await supabase
        .from("payments")
        .select("id, status, created_at, amount, token, tx_hash, memo, sender_wallet, recipient_email")
        .or(`sender_wallet.eq.${walletAddress},recipient_email.eq.${userEmail}`)
        .order("created_at", { ascending: false });

      if (payments && payments.length > 0) {
        const taxRecords: TaxRecord[] = payments.map((p) => {
          const isSender = p.sender_wallet?.toLowerCase() === walletAddress?.toLowerCase();
          return {
            id: p.id,
            date: new Date(p.created_at).toISOString().split("T")[0],
            type: isSender ? "expense" : "income",
            amount: (Number(p.amount) / 1000000).toString(),
            token: p.token || "USDC",
            txHash: p.tx_hash || "",
            description: p.memo || (isSender ? `Sent to ${p.recipient_email}` : "Received payment"),
          };
        });
        setRecords(taxRecords);
        setFilteredRecords(taxRecords);
      }
    } catch (err) {
      console.error("Error fetching tax records:", err);
    } finally {
      setLoading(false);
    }
  };

  const handleGenerate = async () => {
    if (!dateRange.start || !dateRange.end) {
      toast.error("Please select a date range");
      return;
    }

    setGenerating(true);
    try {
      // Filter records by date range
      const filtered = records.filter(record => {
        const recordDate = new Date(record.date);
        return recordDate >= new Date(dateRange.start) && recordDate <= new Date(dateRange.end);
      });
      setFilteredRecords(filtered);
      toast.success(`Generated report for ${filtered.length} transactions`);
    } finally {
      setGenerating(false);
    }
  };

  const handleDownload = () => {
    if (filteredRecords.length === 0) {
      toast.error("No records to download");
      return;
    }
    
    // Generate CSV
    const headers = ["Date", "Type", "Amount", "Token", "Description", "Transaction Hash"];
    const csvContent = [
      headers.join(","),
      ...filteredRecords.map(r => [
        r.date,
        r.type,
        r.amount,
        r.token,
        `"${r.description}"`,
        r.txHash
      ].join(","))
    ].join("\n");

    const blob = new Blob([csvContent], { type: "text/csv" });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `tax-report-${dateRange.start}-to-${dateRange.end}.csv`;
    a.click();
    window.URL.revokeObjectURL(url);
    
    toast.success("Tax report downloaded!");
  };

  if (!isLoggedIn) {
    return (
      <div className="min-h-screen bg-background">
        <AppHeader />
        <div className="flex min-h-[80vh] flex-col items-center justify-center px-4 text-center">
          <div className="mb-6 flex h-20 w-20 items-center justify-center rounded-full bg-primary/10">
            <FileText className="h-10 w-10 text-primary" />
          </div>
          <h2 className="mb-3 font-display text-2xl text-foreground sm:text-3xl">Tax Reports</h2>
          <p className="mb-6 max-w-md text-sm text-muted-foreground">
            Generate detailed tax reports for your crypto transactions.
          </p>
          <button onClick={login} className="rounded-lg bg-primary px-6 py-3 font-semibold text-primary-foreground shadow-glow hover:opacity-90">
            Sign In to Access Reports
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
          <h1 className="font-display text-2xl text-foreground sm:text-3xl">Tax Reports</h1>
          <p className="mt-1 text-sm text-muted-foreground">
            Generate and download tax reports for your crypto transactions.
          </p>
        </div>

        <div className="grid gap-8 lg:grid-cols-3">
          {/* Settings Panel */}
          <div className="lg:col-span-1 space-y-6">
            <div className="rounded-xl border border-border bg-card p-6">
              <h3 className="mb-4 flex items-center gap-2 text-lg font-medium text-foreground">
                <Calendar className="h-5 w-5" />
                Date Range
              </h3>
              
              <div className="space-y-4">
                <div>
                  <label className="mb-1.5 block text-sm text-muted-foreground">Start Date</label>
                  <input
                    type="date"
                    value={dateRange.start}
                    onChange={(e) => setDateRange({ ...dateRange, start: e.target.value })}
                    className="w-full rounded-lg border border-border bg-background px-3 py-2 text-sm text-foreground"
                  />
                </div>

                <div>
                  <label className="mb-1.5 block text-sm text-muted-foreground">End Date</label>
                  <input
                    type="date"
                    value={dateRange.end}
                    onChange={(e) => setDateRange({ ...dateRange, end: e.target.value })}
                    className="w-full rounded-lg border border-border bg-background px-3 py-2 text-sm text-foreground"
                  />
                </div>

                <button
                  onClick={handleGenerate}
                  disabled={generating || !dateRange.start || !dateRange.end}
                  className="flex w-full items-center justify-center gap-2 rounded-lg bg-primary py-2.5 text-sm font-medium text-primary-foreground shadow-glow hover:opacity-90 disabled:opacity-50"
                >
                  {generating ? (
                    <>
                      <Loader2 className="h-4 w-4 animate-spin" />
                      Generating...
                    </>
                  ) : (
                    <>
                      <Filter className="h-4 w-4" />
                      Generate Report
                    </>
                  )}
                </button>
              </div>
            </div>

            {filteredRecords.length > 0 && (
              <div className="rounded-xl border border-border bg-card p-6">
                <h3 className="mb-4 flex items-center gap-2 text-lg font-medium text-foreground">
                  <Download className="h-5 w-5" />
                  Export
                </h3>
                
                <button
                  onClick={handleDownload}
                  className="flex w-full items-center justify-center gap-2 rounded-lg bg-secondary py-2.5 text-sm font-medium text-foreground hover:bg-secondary/80"
                >
                  <FileText className="h-4 w-4" />
                  Download CSV
                </button>
              </div>
            )}
          </div>

          {/* Results Panel */}
          <div className="lg:col-span-2">
            <div className="rounded-xl border border-border bg-card p-6">
              <div className="mb-4 flex items-center justify-between">
                <h3 className="text-lg font-medium text-foreground">
                  Transactions
                </h3>
                <span className="text-sm text-muted-foreground">
                  {filteredRecords.length} records
                </span>
              </div>

              {loading ? (
                <div className="flex justify-center py-12">
                  <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
                </div>
              ) : filteredRecords.length === 0 ? (
                <div className="text-center py-12">
                  <FileText className="h-12 w-12 mx-auto text-muted-foreground/50 mb-4" />
                  <p className="text-muted-foreground">
                    {records.length === 0 
                      ? "No transactions found" 
                      : "Select a date range and generate a report"}
                  </p>
                </div>
              ) : (
                <div className="overflow-x-auto">
                  <table className="w-full text-sm">
                    <thead>
                      <tr className="border-b border-border">
                        <th className="text-left py-3 px-4 font-medium text-foreground">Date</th>
                        <th className="text-left py-3 px-4 font-medium text-foreground">Type</th>
                        <th className="text-right py-3 px-4 font-medium text-foreground">Amount</th>
                        <th className="text-left py-3 px-4 font-medium text-foreground">Description</th>
                      </tr>
                    </thead>
                    <tbody className="text-muted-foreground">
                      {filteredRecords.map((record) => (
                        <tr key={record.id} className="border-b border-border last:border-0">
                          <td className="py-3 px-4">{record.date}</td>
                          <td className="py-3 px-4">
                            <span className={`inline-flex items-center px-2 py-0.5 rounded text-xs font-medium ${
                              record.type === "income" 
                                ? "bg-green-500/10 text-green-600"
                                : record.type === "expense"
                                ? "bg-red-500/10 text-red-600"
                                : "bg-blue-500/10 text-blue-600"
                            }`}>
                              {record.type}
                            </span>
                          </td>
                          <td className="py-3 px-4 text-right font-medium">
                            {record.amount} {record.token}
                          </td>
                          <td className="py-3 px-4 max-w-xs truncate" title={record.description}>
                            {record.description}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
      <Footer />
    </div>
  );
}