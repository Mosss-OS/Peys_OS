/** DisputePage - File and track transaction disputes with evidence upload and support chat. */
import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { 
  AlertTriangle, FileText, Image, Paperclip, Check, X, 
  Clock, MessageCircle, Send, Loader2, ChevronDown, Upload,
  Flag, HelpCircle, Wallet, Clock3, Hourglass, Calendar 
} from "lucide-react";
import { Link } from "react-router-dom";
import { useApp } from "@/contexts/AppContext";
import AppHeader from "@/components/AppHeader";
import Footer from "@/components/Footer";
import { toast } from "sonner";

interface Dispute {
  id: string;
  transactionId: string;
  title: string;
  reason: string;
  description: string;
  status: "open" | "reviewing" | "resolved" | "closed";
  createdAt: string;
  updatedAt: string;
  evidence: string[];
  resolution?: string;
  timeline: DisputeTimelineItem[];
}

interface DisputeTimelineItem {
  date: string;
  action: string;
  status: "completed" | "pending" | "in-progress";
}

const DISPUTE_REASONS = [
  { id: "not_received", label: "Did not receive payment", icon: "❌" },
  { id: "wrong_amount", label: "Wrong amount sent", icon: "💰" },
  { id: "fraud", label: "Suspected fraud", icon: "🚩" },
  { id: "technical", label: "Technical issue", icon: "🔧" },
  { id: "other", label: "Other", icon: "📄" },
];

const DISPUTE_STATUSES = {
  open: { label: "Open", color: "bg-yellow-500", text: "text-yellow-600" },
  reviewing: { label: "Under Review", color: "bg-blue-500", text: "text-blue-600" },
  resolved: { label: "Resolved", color: "bg-green-500", text: "text-green-600" },
  closed: { label: "Closed", color: "bg-gray-500", text: "text-gray-600" },
};

/** Dispute resolution page with filing form, evidence upload, history tracking, and support chat. */
export default function DisputePage() {
  const { isLoggedIn, login } = useApp();
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<"new" | "history">("new");

  const [disputes, setDisputes] = useState<Dispute[]>([]);

  const [selectedReason, setSelectedReason] = useState("");
  const [disputeTitle, setDisputeTitle] = useState("");
  const [disputeDescription, setDisputeDescription] = useState("");
  const [transactionId, setTransactionId] = useState("");
  const [uploadedFiles, setUploadedFiles] = useState<string[]>([]);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [showSupport, setShowSupport] = useState(false);

  useEffect(() => {
    if (!isLoggedIn) return;
    setLoading(false);
  }, [isLoggedIn]);

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files || []);
    const newFiles = files.map(f => URL.createObjectURL(f));
    setUploadedFiles(prev => [...prev, ...newFiles]);
  };

  const submitDispute = async () => {
    if (!selectedReason || !disputeTitle || !disputeDescription) {
      toast.error("Please fill in all required fields");
      return;
    }

    setIsSubmitting(true);
    try {
      const newDispute: Dispute = {
        id: crypto.randomUUID(),
        transactionId,
        title: disputeTitle,
        reason: DISPUTE_REASONS.find(r => r.id === selectedReason)?.label || selectedReason,
        description: disputeDescription,
        status: "open",
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
        evidence: uploadedFiles,
        timeline: [
          { date: new Date().toISOString().split('T')[0], action: "Dispute opened", status: "completed" },
          { date: new Date().toISOString().split('T')[0], action: "Awaiting support assignment", status: "pending" },
        ],
      };

      setDisputes(prev => [newDispute, ...prev]);
      setDisputeTitle("");
      setDisputeDescription("");
      setTransactionId("");
      setSelectedReason("");
      setUploadedFiles([]);
      setActiveTab("history");
      toast.success("Dispute submitted successfully");
    } finally {
      setIsSubmitting(false);
    }
  };

  if (!isLoggedIn) {
    return (
      <div className="min-h-screen bg-background">
        <AppHeader />
        <div className="flex min-h-[80vh] flex-col items-center justify-center px-4 text-center">
          <div className="mb-6 flex h-20 w-20 items-center justify-center rounded-full bg-primary/10">
            <AlertTriangle className="h-10 w-10 text-primary" />
          </div>
          <h2 className="mb-3 font-display text-2xl text-foreground sm:text-3xl">Dispute Resolution</h2>
          <p className="mb-6 max-w-md text-sm text-muted-foreground">
            Open a dispute for transaction issues and get help from our support team
          </p>
          <button onClick={login} className="rounded-lg bg-primary px-6 py-3 font-semibold text-primary-foreground shadow-glow hover:opacity-90">
            Sign In to File a Dispute
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
            <h1 className="font-display text-2xl text-foreground sm:text-3xl">Dispute Resolution</h1>
            <p className="mt-1 text-sm text-muted-foreground">File disputes and track resolutions</p>
          </div>
          <button
            onClick={() => setShowSupport(true)}
            className="flex items-center gap-2 rounded-lg bg-secondary px-3 py-2 text-sm text-foreground hover:bg-secondary/80"
          >
            <MessageCircle className="h-4 w-4" />
            Support
          </button>
        </div>

        {/* Tabs */}
        <div className="mb-6 flex gap-1 rounded-xl border border-border bg-card p-1">
          <button
            onClick={() => setActiveTab("new")}
            className={`flex-1 flex items-center justify-center gap-2 rounded-lg py-2.5 text-sm font-medium transition-colors ${
              activeTab === "new"
                ? "bg-primary text-primary-foreground"
                : "text-muted-foreground hover:text-foreground"
            }`}
          >
            <Flag className="h-4 w-4" />
            New Dispute
          </button>
          <button
            onClick={() => setActiveTab("history")}
            className={`flex-1 flex items-center justify-center gap-2 rounded-lg py-2.5 text-sm font-medium transition-colors ${
              activeTab === "history"
                ? "bg-primary text-primary-foreground"
                : "text-muted-foreground hover:text-foreground"
            }`}
          >
            <Clock className="h-4 w-4" />
            My Disputes
            {disputes.length > 0 && (
              <span className="px-2 py-0.5 rounded-full text-xs bg-primary-foreground/20">
                {disputes.length}
              </span>
            )}
          </button>
        </div>

        {loading ? (
          <div className="flex justify-center py-12">
            <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
          </div>
        ) : (
          <>
            {/* New Dispute Form */}
            {activeTab === "new" && (
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                className="space-y-4"
              >
                {/* Transaction ID */}
                <div>
                  <label className="mb-1.5 block text-sm font-medium text-foreground">Transaction ID (optional)</label>
                  <input
                    type="text"
                    value={transactionId}
                    onChange={(e) => setTransactionId(e.target.value)}
                    placeholder="tx_..."
                    className="w-full rounded-lg border border-border bg-background px-4 py-3 font-mono text-sm text-foreground placeholder:text-muted-foreground/50 focus:outline-none focus:ring-2 focus:ring-ring"
                  />
                </div>

                {/* Dispute Title */}
                <div>
                  <label className="mb-1.5 block text-sm font-medium text-foreground">Title *</label>
                  <input
                    type="text"
                    value={disputeTitle}
                    onChange={(e) => setDisputeTitle(e.target.value)}
                    placeholder="Brief description of the issue"
                    className="w-full rounded-lg border border-border bg-background px-4 py-3 text-sm text-foreground placeholder:text-muted-foreground/50 focus:outline-none focus:ring-2 focus:ring-ring"
                  />
                </div>

                {/* Reason Selection */}
                <div>
                  <label className="mb-1.5 block text-sm font-medium text-foreground">Reason *</label>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                    {DISPUTE_REASONS.map((reason) => (
                      <button
                        key={reason.id}
                        onClick={() => setSelectedReason(reason.id)}
                        className={`flex items-center gap-3 rounded-lg border px-4 py-3 text-left transition-colors ${
                          selectedReason === reason.id
                            ? "border-primary bg-primary/10"
                            : "border-border bg-background hover:border-primary/50"
                        }`}
                      >
                        <span className="text-lg">{reason.icon}</span>
                        <span className="text-sm text-foreground">{reason.label}</span>
                      </button>
                    ))}
                  </div>
                </div>

                {/* Description */}
                <div>
                  <label className="mb-1.5 block text-sm font-medium text-foreground">Description *</label>
                  <textarea
                    value={disputeDescription}
                    onChange={(e) => setDisputeDescription(e.target.value)}
                    placeholder="Please provide details about your issue..."
                    rows={4}
                    className="w-full rounded-lg border border-border bg-background px-4 py-3 text-sm text-foreground placeholder:text-muted-foreground/50 focus:outline-none focus:ring-2 focus:ring-ring resize-none"
                  />
                </div>

                {/* Evidence Upload */}
                <div>
                  <label className="mb-1.5 block text-sm font-medium text-foreground">Evidence (optional)</label>
                  <div className="rounded-lg border border-dashed border-border p-4 text-center">
                    <input
                      type="file"
                      multiple
                      accept="image/*,.pdf,.doc,.docx"
                      onChange={handleFileUpload}
                      className="hidden"
                      id="file-upload"
                    />
                    <label
                      htmlFor="file-upload"
                      className="flex cursor-pointer flex-col items-center gap-2 text-muted-foreground hover:text-foreground transition-colors"
                    >
                      <Upload className="h-6 w-6" />
                      <span className="text-sm">Upload screenshots or documents</span>
                    </label>
                    {uploadedFiles.length > 0 && (
                      <div className="mt-3 flex flex-wrap justify-center gap-2">
                        {uploadedFiles.map((file, i) => (
                          <span
                            key={i}
                            className="inline-flex items-center gap-1 rounded-full bg-secondary px-3 py-1 text-xs"
                          >
                            <Paperclip className="h-3 w-3" />
                            {file.split('/').pop()?.slice(0, 15)}...
                            <button
                              onClick={() => setUploadedFiles(prev => prev.filter((_, idx) => idx !== i))}
                            >
                              <X className="h-3 w-3" />
                            </button>
                          </span>
                        ))}
                      </div>
                    )}
                  </div>
                </div>

                {/* Submit Button */}
                <button
                  onClick={submitDispute}
                  disabled={isSubmitting || !selectedReason || !disputeTitle || !disputeDescription}
                  className="flex w-full items-center justify-center gap-2 rounded-xl bg-primary py-3 text-sm font-semibold text-primary-foreground shadow-glow transition-opacity hover:opacity-90 disabled:opacity-50"
                >
                  {isSubmitting ? (
                    <>
                      <Loader2 className="h-4 w-4 animate-spin" />
                      Submitting...
                    </>
                  ) : (
                    <>
                      <Flag className="h-4 w-4" />
                      Submit Dispute
                    </>
                  )}
                </button>

                {/* Help Section */}
                <div className="mt-4 rounded-xl bg-secondary/50 p-4">
                  <div className="flex items-start gap-3">
                    <HelpCircle className="h-5 w-5 text-primary shrink-0 mt-0.5" />
                    <div>
                      <p className="text-sm font-medium text-foreground">Need help filing a dispute?</p>
                      <p className="text-xs text-muted-foreground">
                        Our support team is available 24/7. Response time is typically within 24 hours.
                      </p>
                    </div>
                  </div>
                </div>
              </motion.div>
            )}

            {/* Disputes History */}
            {activeTab === "history" && (
              <div className="space-y-3">
                {disputes.length === 0 ? (
                  <div className="rounded-xl border border-border bg-card p-8 text-center">
                    <Flag className="mx-auto mb-3 h-8 w-8 text-muted-foreground" />
                    <p className="text-sm text-muted-foreground">No disputes filed yet</p>
                    <button
                      onClick={() => setActiveTab("new")}
                      className="mt-3 text-sm text-primary hover:underline"
                    >
                      File your first dispute
                    </button>
                  </div>
                ) : (
                  disputes.map((dispute) => (
                    <motion.div
                      key={dispute.id}
                      initial={{ opacity: 0, y: 10 }}
                      animate={{ opacity: 1, y: 0 }}
                      className="rounded-xl border border-border bg-card p-4"
                    >
                      <div className="flex items-start justify-between mb-3">
                        <div className="flex-1">
                          <div className="flex items-center gap-2">
                            <h3 className="font-medium text-foreground">{dispute.title}</h3>
                            <span
                              className={`rounded-full px-2 py-0.5 text-xs font-medium ${
                                DISPUTE_STATUSES[dispute.status].text
                              }`}
                            >
                              {DISPUTE_STATUSES[dispute.status].label}
                            </span>
                          </div>
                          <p className="text-xs text-muted-foreground">
                            {dispute.reason} • {dispute.transactionId || "No transaction ID"}
                          </p>
                        </div>
                        <div className="text-right">
                          <p className="text-xs text-muted-foreground">
                            {new Date(dispute.createdAt).toLocaleDateString()}
                          </p>
                        </div>
                      </div>

                      {/* Timeline */}
                      <div className="mb-3">
                        <p className="mb-2 text-xs text-muted-foreground">Progress</p>
                        <div className="flex items-center gap-1">
                          {dispute.timeline.map((item, i) => (
                            <div key={i} className="flex items-center">
                              <div
                                className={`h-2 w-8 rounded-full ${
                                  item.status === "completed"
                                    ? "bg-green-500"
                                    : item.status === "in-progress"
                                    ? "bg-blue-500 animate-pulse"
                                    : "bg-muted-foreground/30"
                                }`}
                              />
                              {i < dispute.timeline.length - 1 && (
                                <div className="w-2 h-0.5 bg-muted-foreground/20" />
                              )}
                            </div>
                          ))}
                        </div>
                      </div>

                      <div className="flex items-center justify-between text-xs text-muted-foreground">
                        <span>Updated {new Date(dispute.updatedAt).toLocaleDateString()}</span>
                        <button className="text-primary hover:underline">View Details</button>
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

      {/* Support Chat Modal */}
      <AnimatePresence>
        {showSupport && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 flex items-end justify-center bg-black/60 p-4"
            onClick={() => setShowSupport(false)}
          >
            <motion.div
              initial={{ y: 100, opacity: 0 }}
              animate={{ y: 0, opacity: 1 }}
              exit={{ y: 100, opacity: 0 }}
              className="w-full max-w-md rounded-t-2xl bg-card p-4"
              onClick={(e) => e.stopPropagation()}
            >
              <div className="mb-4 flex items-center justify-between">
                <h3 className="font-display text-lg text-foreground">Support Chat</h3>
                <button
                  onClick={() => setShowSupport(false)}
                  className="rounded-lg p-1 text-muted-foreground hover:bg-secondary"
                >
                  <X className="h-5 w-5" />
                </button>
              </div>
              
              <div className="h-48 rounded-lg bg-secondary/30 p-3 mb-3">
                <div className="text-center text-sm text-muted-foreground py-8">
                  <MessageCircle className="mx-auto mb-2 h-6 w-6" />
                  Chat with support team
                </div>
              </div>

              <div className="flex gap-2">
                <input
                  type="text"
                  placeholder="Type your message..."
                  className="flex-1 rounded-lg border border-border bg-background px-4 py-2 text-sm text-foreground placeholder:text-muted-foreground/50 focus:outline-none focus:ring-2 focus:ring-ring"
                />
                <button className="rounded-lg bg-primary px-4 py-2 text-primary-foreground">
                  <Send className="h-4 w-4" />
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
