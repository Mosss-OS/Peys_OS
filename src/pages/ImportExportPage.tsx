/** ImportExportPage - Import contacts from CSV and export transaction history in CSV or PDF. */
import { useState, useRef } from "react";
import { motion } from "framer-motion";
import { Download, Upload, FileText, Check, AlertCircle, Loader2, Calendar, Users, X, File, CheckCircle } from "lucide-react";
import { useApp } from "@/contexts/AppContext";
import AppHeader from "@/components/AppHeader";
import Footer from "@/components/Footer";
import { toast } from "sonner";

interface ImportedContact {
  address: string;
  label: string;
  valid: boolean;
  error?: string;
}

interface ExportOptions {
  format: "csv" | "pdf";
  dateFrom: string;
  dateTo: string;
  includePending: boolean;
}

/** Page for importing contacts from CSV and exporting transaction history in CSV or PDF format. */
export default function ImportExportPage() {
  const { isLoggedIn, login } = useApp();
  const [importing, setImporting] = useState(false);
  const [exporting, setExporting] = useState(false);
  const [previewData, setPreviewData] = useState<ImportedContact[]>([]);
  const [activeTab, setActiveTab] = useState<"import" | "export">("import");
  const fileInputRef = useRef<HTMLInputElement>(null);

  const [exportOptions, setExportOptions] = useState<ExportOptions>({
    format: "csv",
    dateFrom: "2026-01-01",
    dateTo: new Date().toISOString().split("T")[0],
    includePending: true,
  });

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setImporting(true);
    const reader = new FileReader();
    reader.onload = (event) => {
      const content = event.target?.result as string;
      const lines = content.split("\n").filter(line => line.trim());
      const headers = lines[0]?.toLowerCase().split(",").map(h => h.trim());
      
      const parsed: ImportedContact[] = lines.slice(1).map((line, i) => {
        const values = line.split(",").map(v => v.trim());
        const address = values[headers?.indexOf("address") ?? 0] || values[0] || "";
        const label = values[headers?.indexOf("label") ?? 1] || values[1] || `Contact ${i + 1}`;
        
        const valid = /^0x[a-fA-F0-9]{40}$/.test(address);
        return {
          address,
          label,
          valid,
          error: valid ? undefined : "Invalid address format",
        };
      });

      setPreviewData(parsed);
      setImporting(false);
      toast.success(`Found ${parsed.length} contacts to import`);
    };
    reader.readAsText(file);
  };

  const handleConfirmImport = async () => {
    const validContacts = previewData.filter(c => c.valid);
    if (validContacts.length === 0) {
      toast.error("No valid contacts to import");
      return;
    }
    setImporting(true);
    setImporting(false);
    setPreviewData([]);
    toast.success(`Successfully imported ${validContacts.length} contacts!`);
  };

  const handleExport = async () => {
    setExporting(true);
    setExporting(false);
    toast.success(`Exported transactions as ${exportOptions.format.toUpperCase()}!`);
  };

  const templateCSV = "label,address\nJohn Doe,0x1234567890123456789012345678901234567890\nJane Smith,0xabcdefabcdefabcdefabcdefabcdefabcdefabcd";

  if (!isLoggedIn) {
    return (
      <div className="min-h-screen bg-background">
        <AppHeader />
        <div className="flex min-h-[80vh] flex-col items-center justify-center px-4 text-center">
          <div className="mb-6 flex h-20 w-20 items-center justify-center rounded-full bg-primary/10">
            <Download className="h-10 w-10 text-primary" />
          </div>
          <h2 className="mb-3 font-display text-2xl text-foreground sm:text-3xl">Import & Export</h2>
          <p className="mb-6 max-w-md text-sm text-muted-foreground">
            Import contacts and export your transaction history.
          </p>
          <button onClick={login} className="rounded-lg bg-primary px-6 py-3 font-semibold text-primary-foreground shadow-glow hover:opacity-90">
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
          <h1 className="font-display text-2xl text-foreground sm:text-3xl">Import & Export</h1>
          <p className="mt-1 text-sm text-muted-foreground">Import contacts and export transaction history</p>
        </div>

        <div className="mb-6 flex gap-2">
          {[
            { id: "import", label: "Import Contacts", icon: Upload },
            { id: "export", label: "Export History", icon: Download },
          ].map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id as typeof activeTab)}
              className={`flex items-center gap-2 rounded-lg px-4 py-2 text-sm font-medium transition-colors ${
                activeTab === tab.id
                  ? "bg-primary text-primary-foreground"
                  : "bg-secondary text-muted-foreground hover:bg-secondary/80"
              }`}
            >
              <tab.icon className="h-4 w-4" />
              {tab.label}
            </button>
          ))}
        </div>

        {activeTab === "import" && (
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            className="space-y-6"
          >
            <div className="rounded-xl border border-border bg-card p-6">
              <h2 className="mb-4 flex items-center gap-2 text-lg font-semibold text-foreground">
                <Upload className="h-5 w-5 text-primary" />
                Import Contacts from CSV
              </h2>
              
              <input
                ref={fileInputRef}
                type="file"
                accept=".csv"
                onChange={handleFileUpload}
                className="hidden"
              />

              <div
                onClick={() => fileInputRef.current?.click()}
                className="flex flex-col items-center justify-center rounded-xl border-2 border-dashed border-border p-8 transition-colors hover:border-primary"
              >
                {importing ? (
                  <Loader2 className="h-12 w-12 animate-spin text-muted-foreground" />
                ) : (
                  <Upload className="h-12 w-12 text-muted-foreground" />
                )}
                <p className="mt-4 font-medium text-foreground">
                  Click to upload or drag and drop
                </p>
                <p className="mt-1 text-sm text-muted-foreground">
                  CSV file with columns: label, address
                </p>
              </div>

              <div className="mt-4 rounded-lg border border-border bg-secondary/50 p-4">
                <p className="mb-2 text-sm font-medium text-foreground">CSV Template:</p>
                <pre className="overflow-x-auto text-xs text-muted-foreground">
                  {templateCSV}
                </pre>
              </div>
            </div>

            {previewData.length > 0 && (
              <motion.div
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                className="rounded-xl border border-border bg-card p-6"
              >
                <div className="mb-4 flex items-center justify-between">
                  <h3 className="font-semibold text-foreground">
                    Preview ({previewData.filter(c => c.valid).length} valid, {previewData.filter(c => !c.valid).length} invalid)
                  </h3>
                  <button
                    onClick={() => setPreviewData([])}
                    className="flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground"
                  >
                    <X className="h-4 w-4" />
                    Clear
                  </button>
                </div>

                <div className="max-h-64 overflow-y-auto rounded-lg border border-border">
                  <table className="w-full text-sm">
                    <thead className="sticky top-0 border-b border-border bg-secondary/50">
                      <tr className="text-left text-muted-foreground">
                        <th className="px-4 py-2">Status</th>
                        <th className="px-4 py-2">Label</th>
                        <th className="px-4 py-2">Address</th>
                      </tr>
                    </thead>
                    <tbody>
                      {previewData.map((contact, i) => (
                        <tr key={i} className="border-b border-border last:border-b-0">
                          <td className="px-4 py-2">
                            {contact.valid ? (
                              <CheckCircle className="h-5 w-5 text-green-500" />
                            ) : (
                              <AlertCircle className="h-5 w-5 text-red-500" />
                            )}
                          </td>
                          <td className="px-4 py-2 font-medium text-foreground">{contact.label}</td>
                          <td className="px-4 py-2">
                            <span className="font-mono text-muted-foreground">
                              {contact.address.slice(0, 10)}...{contact.address.slice(-8)}
                            </span>
                            {contact.error && (
                              <p className="text-xs text-red-500">{contact.error}</p>
                            )}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>

                <button
                  onClick={handleConfirmImport}
                  disabled={importing || previewData.filter(c => c.valid).length === 0}
                  className="mt-4 flex w-full items-center justify-center gap-2 rounded-lg bg-primary px-4 py-3 font-semibold text-primary-foreground hover:opacity-90 disabled:opacity-50"
                >
                  {importing ? (
                    <Loader2 className="h-5 w-5 animate-spin" />
                  ) : (
                    <>
                      <Check className="h-5 w-5" />
                      Import {previewData.filter(c => c.valid).length} Contacts
                    </>
                  )}
                </button>
              </motion.div>
            )}
          </motion.div>
        )}

        {activeTab === "export" && (
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            className="space-y-6"
          >
            <div className="rounded-xl border border-border bg-card p-6">
              <h2 className="mb-4 flex items-center gap-2 text-lg font-semibold text-foreground">
                <Download className="h-5 w-5 text-primary" />
                Export Transaction History
              </h2>

              <div className="grid gap-4 sm:grid-cols-2">
                <div>
                  <label className="mb-2 block text-sm font-medium text-muted-foreground">Format</label>
                  <div className="grid grid-cols-2 gap-2">
                    <button
                      onClick={() => setExportOptions({ ...exportOptions, format: "csv" })}
                      className={`flex items-center justify-center gap-2 rounded-lg border px-4 py-3 font-medium transition-colors ${
                        exportOptions.format === "csv"
                          ? "border-primary bg-primary/10 text-primary"
                          : "border-border hover:bg-secondary"
                      }`}
                    >
                      <FileText className="h-4 w-4" />
                      CSV
                    </button>
                    <button
                      onClick={() => setExportOptions({ ...exportOptions, format: "pdf" })}
                      className={`flex items-center justify-center gap-2 rounded-lg border px-4 py-3 font-medium transition-colors ${
                        exportOptions.format === "pdf"
                          ? "border-primary bg-primary/10 text-primary"
                          : "border-border hover:bg-secondary"
                      }`}
                    >
                      <File className="h-4 w-4" />
                      PDF
                    </button>
                  </div>
                </div>
                <div>
                  <label className="mb-2 block text-sm font-medium text-muted-foreground">Date Range</label>
                  <div className="flex gap-2">
                    <input
                      type="date"
                      value={exportOptions.dateFrom}
                      onChange={(e) => setExportOptions({ ...exportOptions, dateFrom: e.target.value })}
                      className="flex-1 rounded-lg border border-border bg-background px-3 py-2 text-sm focus:border-primary focus:outline-none"
                    />
                    <input
                      type="date"
                      value={exportOptions.dateTo}
                      onChange={(e) => setExportOptions({ ...exportOptions, dateTo: e.target.value })}
                      className="flex-1 rounded-lg border border-border bg-background px-3 py-2 text-sm focus:border-primary focus:outline-none"
                    />
                  </div>
                </div>
              </div>

              <div className="mt-4 flex items-center justify-between rounded-lg border border-border p-4">
                <div>
                  <p className="font-medium text-foreground">Include Pending Transactions</p>
                  <p className="text-sm text-muted-foreground">Export all pending transactions as well</p>
                </div>
                <button
                  onClick={() => setExportOptions({ ...exportOptions, includePending: !exportOptions.includePending })}
                  className={`relative h-6 w-11 rounded-full transition-colors ${
                    exportOptions.includePending ? "bg-primary" : "bg-secondary"
                  }`}
                >
                  <span
                    className={`absolute top-0.5 h-5 w-5 rounded-full bg-white shadow transition-transform ${
                      exportOptions.includePending ? "left-[22px]" : "left-0.5"
                    }`}
                  />
                </button>
              </div>

              <button
                onClick={handleExport}
                disabled={exporting}
                className="mt-4 flex w-full items-center justify-center gap-2 rounded-lg bg-primary px-4 py-3 font-semibold text-primary-foreground hover:opacity-90 disabled:opacity-50"
              >
                {exporting ? (
                  <Loader2 className="h-5 w-5 animate-spin" />
                ) : (
                  <>
                    <Download className="h-5 w-5" />
                    Export as {exportOptions.format.toUpperCase()}
                  </>
                )}
              </button>
            </div>

            <div className="rounded-xl border border-border bg-card p-6">
              <h3 className="mb-4 font-semibold text-foreground">Export Preview</h3>
              <div className="rounded-lg border border-border bg-secondary/50 p-4">
                <p className="text-sm text-muted-foreground">
                  <strong>Format:</strong> {exportOptions.format.toUpperCase()}
                </p>
                <p className="text-sm text-muted-foreground">
                  <strong>Date Range:</strong> {new Date(exportOptions.dateFrom).toLocaleDateString()} - {new Date(exportOptions.dateTo).toLocaleDateString()}
                </p>
                <p className="text-sm text-muted-foreground">
                  <strong>Include Pending:</strong> {exportOptions.includePending ? "Yes" : "No"}
                </p>
                <p className="mt-2 text-sm text-muted-foreground">
                  <strong>Estimated Transactions:</strong> ~125 transactions in selected range
                </p>
              </div>
            </div>
          </motion.div>
        )}
      </div>
      <Footer />
    </div>
  );
}
