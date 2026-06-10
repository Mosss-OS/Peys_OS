import { useState, useEffect, useMemo } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { 
  UserPlus, Check, X, Shield, Clock, Users, AlertCircle, 
  Edit2, Trash2, Plus, Settings, ArrowRight, Loader2, ChevronDown 
} from "lucide-react";
import { Link } from "react-router-dom";
import { useApp } from "@/contexts/AppContext";
import AppHeader from "@/components/AppHeader";
import Footer from "@/components/Footer";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";

interface Approver {
  id: string;
  name: string;
  email: string;
  walletAddress?: string;
  role: "admin" | "member";
  addedAt: string;
}

interface ApprovalRequest {
  id: string;
  title: string;
  description: string;
  amount: number;
  token: string;
  recipient: string;
  status: "pending" | "approved" | "rejected" | "cancelled";
  createdBy: string;
  createdAt: string;
  approvers: { id: string; name: string; status: "approved" | "rejected" | "pending" }[];
  threshold: number;
}

interface ApprovalRule {
  id: string;
  name: string;
  condition: "amount" | "recipient" | "token";
  operator: "greater_than" | "less_than" | "equals";
  value: string;
  action: "require_approval" | "auto_approve" | "block";
}

export default function ApprovalWorkflowPage() {
  const { isLoggedIn, login, walletAddress } = useApp();
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<"requests" | "approvers" | "rules">("requests");

  // Approvers state
  const [approvers, setApprovers] = useState<Approver[]>([]);
  const [showAddApprover, setShowAddApprover] = useState(false);
  const [newApprover, setNewApprover] = useState({ name: "", email: "", role: "member" as const });

  // Threshold state
  const [threshold, setThreshold] = useState(2);
  const [showThresholdEdit, setShowThresholdEdit] = useState(false);

  // Approval requests state
  const [approvalRequests, setApprovalRequests] = useState<ApprovalRequest[]>([
    {
      id: "1",
      title: "Equipment Purchase",
      description: "Laptop for new developer",
      amount: 1500,
      token: "USDC",
      recipient: "0x1234...5678",
      status: "pending",
      createdBy: "John Doe",
      createdAt: "2026-03-18T10:30:00",
      approvers: [
        { id: "1", name: "Alice", status: "approved" },
        { id: "2", name: "Bob", status: "pending" },
        { id: "3", name: "Charlie", status: "pending" },
      ],
      threshold: 2,
    },
    {
      id: "2",
      title: "Marketing Campaign",
      description: "Q2 social media ads",
      amount: 2500,
      token: "USDC",
      recipient: "0xabcd...efgh",
      status: "approved",
      createdBy: "Jane Smith",
      createdAt: "2026-03-17T14:20:00",
      approvers: [
        { id: "1", name: "Alice", status: "approved" },
        { id: "2", name: "Bob", status: "approved" },
        { id: "3", name: "Charlie", status: "approved" },
      ],
      threshold: 2,
    },
  ]);

  // Rules state
  const [rules, setRules] = useState<ApprovalRule[]>([
    { id: "1", name: "High Amount", condition: "amount", operator: "greater_than", value: "1000", action: "require_approval" },
    { id: "2", name: "New Recipient", condition: "recipient", operator: "equals", value: "new", action: "require_approval" },
  ]);
  const [showAddRule, setShowAddRule] = useState(false);
  const [newRule, setNewRule] = useState({
    name: "",
    condition: "amount" as const,
    operator: "greater_than" as const,
    value: "",
    action: "require_approval" as const,
  });

  useEffect(() => {
    if (!isLoggedIn) return;
    fetchApprovers();
    setLoading(false);
  }, [isLoggedIn]);

  const fetchApprovers = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      const stored = localStorage.getItem(`peys_approvers_${user.id}`);
      if (stored) {
        setApprovers(JSON.parse(stored));
      } else {
        // Add current user as default approver
        const defaultApprover: Approver = {
          id: user.id,
          name: user.user_metadata?.name || "You",
          email: user.email || "",
          walletAddress: walletAddress || "",
          role: "admin",
          addedAt: new Date().toISOString(),
        };
        setApprovers([defaultApprover]);
        saveApprovers([defaultApprover]);
      }
    } catch (err) {
      console.error("Error fetching approvers:", err);
    }
  };

  const saveApprovers = async (newApprovers: Approver[]) => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;
      localStorage.setItem(`peys_approvers_${user.id}`, JSON.stringify(newApprovers));
    } catch (err) {
      console.error("Error saving approvers:", err);
    }
  };

  const addApprover = async () => {
    if (!newApprover.name || !newApprover.email) {
      toast.error("Please fill in all fields");
      return;
    }

    const approver: Approver = {
      id: crypto.randomUUID(),
      name: newApprover.name,
      email: newApprover.email,
      role: newApprover.role,
      addedAt: new Date().toISOString(),
    };

    const updated = [...approvers, approver];
    setApprovers(updated);
    await saveApprovers(updated);
    setNewApprover({ name: "", email: "", role: "member" });
    setShowAddApprover(false);
    toast.success("Approver added");
  };

  const removeApprover = async (id: string) => {
    if (approvers.length <= 1) {
      toast.error("You must have at least one approver");
      return;
    }
    const updated = approvers.filter(a => a.id !== id);
    setApprovers(updated);
    await saveApprovers(updated);
    toast.success("Approver removed");
  };

  const handleApprove = (requestId: string) => {
    setApprovalRequests(prev => prev.map(req => {
      if (req.id === requestId) {
        const updatedApprovers = req.approvers.map(a =>
          a.id === "3" ? { ...a, status: "approved" as const } : a
        );
        const approvedCount = updatedApprovers.filter(a => a.status === "approved").length;
        return {
          ...req,
          approvers: updatedApprovers,
          status: approvedCount >= req.threshold ? "approved" : "pending",
        };
      }
      return req;
    }));
    toast.success("Request approved");
  };

  const handleReject = (requestId: string) => {
    setApprovalRequests(prev => prev.map(req =>
      req.id === requestId ? { ...req, status: "rejected" } : req
    ));
    toast.info("Request rejected");
  };

  const pendingCount = useMemo(() =>
    approvalRequests.filter(r => r.status === "pending").length,
    [approvalRequests]
  );

  if (!isLoggedIn) {
    return (
      <div className="min-h-screen bg-background">
        <AppHeader />
        <div className="flex min-h-[80vh] flex-col items-center justify-center px-4 text-center">
          <div className="mb-6 flex h-20 w-20 items-center justify-center rounded-full bg-primary/10">
            <Shield className="h-10 w-10 text-primary" />
          </div>
          <h2 className="mb-3 font-display text-2xl text-foreground sm:text-3xl">Approval Workflow</h2>
          <p className="mb-6 max-w-md text-sm text-muted-foreground">
            Set up multi-signature approval workflows for secure transactions
          </p>
          <button onClick={login} className="rounded-lg bg-primary px-6 py-3 font-semibold text-primary-foreground shadow-glow hover:opacity-90">
            Sign In to Manage Approvals
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
            <h1 className="font-display text-2xl text-foreground sm:text-3xl">Approval Workflow</h1>
            <p className="mt-1 text-sm text-muted-foreground">Multi-signature approval for secure transactions</p>
          </div>
        </div>

        {/* Tabs */}
        <div className="mb-6 flex gap-1 rounded-xl border border-border bg-card p-1">
          {[
            { id: "requests", label: "Requests", count: pendingCount },
            { id: "approvers", label: "Approvers", count: approvers.length },
            { id: "rules", label: "Rules", count: rules.length },
          ].map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id as "requests" | "approvers" | "rules")}
              className={`flex-1 flex items-center justify-center gap-2 rounded-lg py-2.5 text-sm font-medium transition-colors ${
                activeTab === tab.id
                  ? "bg-primary text-primary-foreground"
                  : "text-muted-foreground hover:text-foreground"
              }`}
            >
              {tab.label}
              {tab.count > 0 && (
                <span className={`px-2 py-0.5 rounded-full text-xs ${
                  activeTab === tab.id ? "bg-primary-foreground/20" : "bg-secondary"
                }`}>
                  {tab.count}
                </span>
              )}
            </button>
          ))}
        </div>

        {loading ? (
          <div className="flex justify-center py-12">
            <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
          </div>
        ) : (
          <>
            {/* Requests Tab */}
            {activeTab === "requests" && (
              <div className="space-y-3">
                {approvalRequests.length === 0 ? (
                  <div className="rounded-xl border border-border bg-card p-8 text-center">
                    <Shield className="mx-auto mb-3 h-8 w-8 text-muted-foreground" />
                    <p className="text-sm text-muted-foreground">No approval requests yet</p>
                  </div>
                ) : (
                  approvalRequests.map((request) => (
                    <motion.div
                      key={request.id}
                      initial={{ opacity: 0, y: 10 }}
                      animate={{ opacity: 1, y: 0 }}
                      className={`rounded-xl border p-4 ${
                        request.status === "approved"
                          ? "border-green-500/30 bg-green-500/5"
                          : request.status === "rejected"
                          ? "border-red-500/30 bg-red-500/5"
                          : "border-border bg-card"
                      }`}
                    >
                      <div className="flex items-start justify-between mb-3">
                        <div className="flex-1">
                          <div className="flex items-center gap-2">
                            <h3 className="font-medium text-foreground">{request.title}</h3>
                            <span
                              className={`rounded-full px-2 py-0.5 text-xs font-medium ${
                                request.status === "pending"
                                  ? "bg-yellow-500/20 text-yellow-600"
                                  : request.status === "approved"
                                  ? "bg-green-500/20 text-green-600"
                                  : "bg-red-500/20 text-red-600"
                              }`}
                            >
                              {request.status === "pending" ? "Pending" : request.status === "approved" ? "Approved" : "Rejected"}
                            </span>
                          </div>
                          <p className="text-xs text-muted-foreground">{request.description}</p>
                        </div>
                        <div className="text-right">
                          <p className="font-bold text-foreground">
                            {request.amount} {request.token}
                          </p>
                          <p className="text-xs text-muted-foreground">{request.recipient}</p>
                        </div>
                      </div>

                      {/* Approvers */}
                      <div className="mb-3">
                        <p className="mb-2 text-xs text-muted-foreground">Approvals ({request.approvers.filter(a => a.status === "approved").length}/{request.threshold})</p>
                        <div className="flex items-center gap-2">
                          {request.approvers.map((approver) => (
                            <div
                              key={approver.id}
                              className={`flex items-center gap-1.5 rounded-full px-2 py-1 text-xs ${
                                approver.status === "approved"
                                  ? "bg-green-500/20 text-green-600"
                                  : approver.status === "rejected"
                                  ? "bg-red-500/20 text-red-600"
                                  : "bg-secondary text-muted-foreground"
                              }`}
                            >
                              {approver.name.slice(0, 1)}
                              {approver.status === "approved" && <Check className="h-3 w-3" />}
                            </div>
                          ))}
                          <div className="flex-1" />
                          <div className="w-16 h-1.5 bg-secondary rounded-full overflow-hidden">
                            <div
                              className="h-full bg-green-500 transition-all"
                              style={{ width: `${(request.approvers.filter(a => a.status === "approved").length / request.threshold) * 100}%` }}
                            />
                          </div>
                        </div>
                      </div>

                      {/* Actions */}
                      {request.status === "pending" && (
                        <div className="flex gap-2">
                          <button
                            onClick={() => handleApprove(request.id)}
                            className="flex-1 flex items-center justify-center gap-1 rounded-lg bg-green-500/10 py-2 text-sm text-green-600 hover:bg-green-500/20 transition-colors"
                          >
                            <Check className="h-4 w-4" />
                            Approve
                          </button>
                          <button
                            onClick={() => handleReject(request.id)}
                            className="flex-1 flex items-center justify-center gap-1 rounded-lg bg-red-500/10 py-2 text-sm text-red-600 hover:bg-red-500/20 transition-colors"
                          >
                            <X className="h-4 w-4" />
                            Reject
                          </button>
                        </div>
                      )}

                      <p className="mt-2 text-xs text-muted-foreground">
                        Created by {request.createdBy} • {new Date(request.createdAt).toLocaleDateString()}
                      </p>
                    </motion.div>
                  ))
                )}
              </div>
            )}

            {/* Approvers Tab */}
            {activeTab === "approvers" && (
              <div className="space-y-4">
                {/* Threshold Setting */}
                <div className="rounded-xl border border-border bg-card p-4">
                  <div className="flex items-center justify-between">
                    <div>
                      <h3 className="font-medium text-foreground">Approval Threshold</h3>
                      <p className="text-xs text-muted-foreground">
                        Number of approvals required for a transaction
                      </p>
                    </div>
                    {showThresholdEdit ? (
                      <div className="flex items-center gap-2">
                        <input
                          type="number"
                          value={threshold}
                          onChange={(e) => setThreshold(Number(e.target.value))}
                          className="w-16 rounded-lg border border-border bg-background px-2 py-1 text-sm text-center"
                          min="1"
                          max={approvers.length}
                        />
                        <button
                          onClick={() => setShowThresholdEdit(false)}
                          className="rounded-lg p-1.5 text-primary hover:bg-primary/10"
                        >
                          <Check className="h-4 w-4" />
                        </button>
                      </div>
                    ) : (
                      <button
                        onClick={() => setShowThresholdEdit(true)}
                        className="flex items-center gap-1 text-sm text-primary hover:underline"
                      >
                        {threshold} of {approvers.length} <Edit2 className="h-3 w-3" />
                      </button>
                    )}
                  </div>
                </div>

                {/* Approvers List */}
                <div className="rounded-xl border border-border bg-card p-4">
                  <div className="mb-3 flex items-center justify-between">
                    <h3 className="text-sm font-medium text-foreground">Approvers ({approvers.length})</h3>
                    <button
                      onClick={() => setShowAddApprover(true)}
                      className="flex items-center gap-1 text-xs text-primary hover:underline"
                    >
                      <Plus className="h-3 w-3" />
                      Add Approver
                    </button>
                  </div>

                  <div className="space-y-2">
                    {approvers.map((approver) => (
                      <div
                        key={approver.id}
                        className="flex items-center justify-between rounded-lg border border-border bg-background p-3"
                      >
                        <div className="flex items-center gap-3">
                          <div className="flex h-8 w-8 items-center justify-center rounded-full bg-primary/10 text-xs font-bold text-primary">
                            {approver.name.slice(0, 1)}
                          </div>
                          <div>
                            <p className="text-sm font-medium text-foreground">{approver.name}</p>
                            <p className="text-xs text-muted-foreground">{approver.email}</p>
                          </div>
                        </div>
                        <div className="flex items-center gap-2">
                          <span
                            className={`rounded-full px-2 py-0.5 text-xs ${
                              approver.role === "admin"
                                ? "bg-purple-500/20 text-purple-600"
                                : "bg-secondary text-muted-foreground"
                            }`}
                          >
                            {approver.role}
                          </span>
                          {approver.role !== "admin" && (
                            <button
                              onClick={() => removeApprover(approver.id)}
                              className="rounded-lg p-1.5 text-muted-foreground hover:bg-red-500/10 hover:text-red-500 transition-colors"
                            >
                              <Trash2 className="h-4 w-4" />
                            </button>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            )}

            {/* Rules Tab */}
            {activeTab === "rules" && (
              <div className="space-y-3">
                <div className="mb-3 flex items-center justify-between">
                  <h3 className="text-sm font-medium text-foreground">Auto-Approval Rules</h3>
                  <button
                    onClick={() => setShowAddRule(true)}
                    className="flex items-center gap-1 text-xs text-primary hover:underline"
                  >
                    <Plus className="h-3 w-3" />
                    Add Rule
                  </button>
                </div>

                {rules.map((rule) => (
                  <motion.div
                    key={rule.id}
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="rounded-xl border border-border bg-card p-4"
                  >
                    <div className="flex items-center justify-between">
                      <div>
                        <h4 className="font-medium text-foreground">{rule.name}</h4>
                        <p className="text-xs text-muted-foreground">
                          If {rule.condition} {rule.operator.replace("_", " ")} {rule.value}, then{" "}
                          <span
                            className={`font-medium ${
                              rule.action === "require_approval"
                                ? "text-yellow-600"
                                : rule.action === "auto_approve"
                                ? "text-green-600"
                                : "text-red-600"
                            }`}
                          >
                            {rule.action.replace("_", " ")}
                          </span>
                        </p>
                      </div>
                      <button
                        onClick={() => {
                          setRules(rules.filter(r => r.id !== rule.id));
                          toast.success("Rule removed");
                        }}
                        className="rounded-lg p-1.5 text-muted-foreground hover:bg-red-500/10 hover:text-red-500 transition-colors"
                      >
                        <Trash2 className="h-4 w-4" />
                      </button>
                    </div>
                  </motion.div>
                ))}

                {rules.length === 0 && (
                  <div className="rounded-xl border border-border bg-card p-8 text-center">
                    <Settings className="mx-auto mb-3 h-8 w-8 text-muted-foreground" />
                    <p className="text-sm text-muted-foreground">No rules configured yet</p>
                  </div>
                )}
              </div>
            )}
          </>
        )}
      </div>
      <Footer />

      {/* Add Approver Modal */}
      <AnimatePresence>
        {showAddApprover && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4"
            onClick={() => setShowAddApprover(false)}
          >
            <motion.div
              initial={{ scale: 0.9 }}
              animate={{ scale: 1 }}
              exit={{ scale: 0.9 }}
              className="w-full max-w-sm rounded-2xl bg-card p-6"
              onClick={(e) => e.stopPropagation()}
            >
              <h3 className="mb-4 font-display text-lg text-foreground">Add Approver</h3>
              <div className="space-y-3">
                <div>
                  <label className="mb-1.5 block text-xs font-medium text-muted-foreground">Name</label>
                  <input
                    type="text"
                    value={newApprover.name}
                    onChange={(e) => setNewApprover({ ...newApprover, name: e.target.value })}
                    placeholder="John Doe"
                    className="w-full rounded-lg border border-border bg-background px-3 py-2 text-sm text-foreground placeholder:text-muted-foreground/50 focus:outline-none focus:ring-2 focus:ring-ring"
                  />
                </div>
                <div>
                  <label className="mb-1.5 block text-xs font-medium text-muted-foreground">Email</label>
                  <input
                    type="email"
                    value={newApprover.email}
                    onChange={(e) => setNewApprover({ ...newApprover, email: e.target.value })}
                    placeholder="john@example.com"
                    className="w-full rounded-lg border border-border bg-background px-3 py-2 text-sm text-foreground placeholder:text-muted-foreground/50 focus:outline-none focus:ring-2 focus:ring-ring"
                  />
                </div>
                <div>
                  <label className="mb-1.5 block text-xs font-medium text-muted-foreground">Role</label>
                  <select
                    value={newApprover.role}
                    onChange={(e) => setNewApprover({ ...newApprover, role: e.target.value as "admin" | "member" })}
                    className="w-full rounded-lg border border-border bg-background px-3 py-2 text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-ring"
                  >
                    <option value="member">Member</option>
                    <option value="admin">Admin</option>
                  </select>
                </div>
                <button
                  onClick={addApprover}
                  className="flex w-full items-center justify-center gap-2 rounded-lg bg-primary py-2.5 text-sm font-semibold text-primary-foreground shadow-glow hover:opacity-90"
                >
                  <UserPlus className="h-4 w-4" />
                  Add Approver
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Add Rule Modal */}
      <AnimatePresence>
        {showAddRule && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4"
            onClick={() => setShowAddRule(false)}
          >
            <motion.div
              initial={{ scale: 0.9 }}
              animate={{ scale: 1 }}
              exit={{ scale: 0.9 }}
              className="w-full max-w-sm rounded-2xl bg-card p-6"
              onClick={(e) => e.stopPropagation()}
            >
              <h3 className="mb-4 font-display text-lg text-foreground">Add Approval Rule</h3>
              <div className="space-y-3">
                <div>
                  <label className="mb-1.5 block text-xs font-medium text-muted-foreground">Rule Name</label>
                  <input
                    type="text"
                    value={newRule.name}
                    onChange={(e) => setNewRule({ ...newRule, name: e.target.value })}
                    placeholder="e.g., High Amount"
                    className="w-full rounded-lg border border-border bg-background px-3 py-2 text-sm text-foreground placeholder:text-muted-foreground/50 focus:outline-none focus:ring-2 focus:ring-ring"
                  />
                </div>
                <div className="grid grid-cols-2 gap-2">
                  <div>
                    <label className="mb-1.5 block text-xs font-medium text-muted-foreground">Condition</label>
                    <select
                      value={newRule.condition}
                      onChange={(e) => setNewRule({ ...newRule, condition: e.target.value as "amount" | "recipient" | "token" })}
                      className="w-full rounded-lg border border-border bg-background px-3 py-2 text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-ring"
                    >
                      <option value="amount">Amount</option>
                      <option value="recipient">Recipient</option>
                      <option value="token">Token</option>
                    </select>
                  </div>
                  <div>
                    <label className="mb-1.5 block text-xs font-medium text-muted-foreground">Operator</label>
                    <select
                      value={newRule.operator}
                      onChange={(e) => setNewRule({ ...newRule, operator: e.target.value as "greater_than" | "less_than" | "equals" })}
                      className="w-full rounded-lg border border-border bg-background px-3 py-2 text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-ring"
                    >
                      <option value="greater_than">Greater than</option>
                      <option value="less_than">Less than</option>
                      <option value="equals">Equals</option>
                    </select>
                  </div>
                </div>
                <div>
                  <label className="mb-1.5 block text-xs font-medium text-muted-foreground">Value</label>
                  <input
                    type="text"
                    value={newRule.value}
                    onChange={(e) => setNewRule({ ...newRule, value: e.target.value })}
                    placeholder="e.g., 1000"
                    className="w-full rounded-lg border border-border bg-background px-3 py-2 text-sm text-foreground placeholder:text-muted-foreground/50 focus:outline-none focus:ring-2 focus:ring-ring"
                  />
                </div>
                <div>
                  <label className="mb-1.5 block text-xs font-medium text-muted-foreground">Action</label>
                  <select
                    value={newRule.action}
                    onChange={(e) => setNewRule({ ...newRule, action: e.target.value as "require_approval" | "auto_approve" | "block" })}
                    className="w-full rounded-lg border border-border bg-background px-3 py-2 text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-ring"
                  >
                    <option value="require_approval">Require Approval</option>
                    <option value="auto_approve">Auto Approve</option>
                    <option value="block">Block</option>
                  </select>
                </div>
                <button
                  onClick={() => {
                    if (!newRule.name || !newRule.value) {
                      toast.error("Please fill in all fields");
                      return;
                    }
                    const rule: ApprovalRule = {
                      id: crypto.randomUUID(),
                      ...newRule,
                    };
                    setRules([...rules, rule]);
                    setNewRule({ name: "", condition: "amount", operator: "greater_than", value: "", action: "require_approval" });
                    setShowAddRule(false);
                    toast.success("Rule added");
                  }}
                  className="flex w-full items-center justify-center gap-2 rounded-lg bg-primary py-2.5 text-sm font-semibold text-primary-foreground shadow-glow hover:opacity-90"
                >
                  <Settings className="h-4 w-4" />
                  Add Rule
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
