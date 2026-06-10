/** TemplatesPage - Reusable payment templates with create, edit, share, and quick-send functionality */
import { useState } from "react";
import { motion } from "framer-motion";
import { LayoutTemplate, Plus, Send, Edit, Trash2, Share2, Copy, MoreVertical, DollarSign, User, Clock, Check, ExternalLink, Loader2 } from "lucide-react";
import { useApp } from "@/contexts/AppContext";
import AppHeader from "@/components/AppHeader";
import Footer from "@/components/Footer";
import { toast } from "sonner";

interface Template {
  id: string;
  name: string;
  recipient: string;
  amount: number;
  token: string;
  description: string;
  useCount: number;
  lastUsed: string;
  createdAt: string;
}

/** TemplatesPage component - Manages payment templates including CRUD operations, sharing, and one-click sending */
export default function TemplatesPage() {
  const { isLoggedIn, login } = useApp();
  const [templates, setTemplates] = useState<Template[]>([
    { id: "1", name: "Weekly Allowance", recipient: "0x1234...5678", amount: 100, token: "USDC", description: "Weekly payment for services", useCount: 12, lastUsed: "2026-03-15", createdAt: "2026-01-01" },
    { id: "2", name: "Rent Payment", recipient: "0xabcd...efgh", amount: 1500, token: "USDC", description: "Monthly rent", useCount: 3, lastUsed: "2026-03-01", createdAt: "2026-02-01" },
    { id: "3", name: "Tip Jar", recipient: "0x9876...ijkl", amount: 5, token: "USDC", description: "Coffee tip", useCount: 28, lastUsed: "2026-03-18", createdAt: "2025-12-15" },
    { id: "4", name: "Gig Payment", recipient: "0xmoses...mnop", amount: 50, token: "USDC", description: "Freelance work", useCount: 5, lastUsed: "2026-03-10", createdAt: "2026-02-15" },
  ]);
  const [showCreate, setShowCreate] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [sending, setSending] = useState<string | null>(null);
  const [formData, setFormData] = useState({
    name: "",
    recipient: "",
    amount: "",
    token: "USDC",
    description: "",
  });

  const validateForm = () => {
    if (!formData.name || formData.name.trim().length === 0) {
      toast.error("Template name is required");
      return false;
    }
    if (formData.name.length > 100) {
      toast.error("Template name must be less than 100 characters");
      return false;
    }
    if (!formData.recipient || formData.recipient.trim().length === 0) {
      toast.error("Recipient email is required");
      return false;
    }
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(formData.recipient)) {
      toast.error("Please enter a valid email address");
      return false;
    }
    if (!formData.amount || isNaN(parseFloat(formData.amount)) || parseFloat(formData.amount) <= 0) {
      toast.error("Please enter a valid amount greater than 0");
      return false;
    }
    const amount = parseFloat(formData.amount);
    if (amount > 1000000) {
      toast.error("Amount exceeds maximum limit of 1,000,000");
      return false;
    }
    if (formData.description && formData.description.length > 500) {
      toast.error("Description must be less than 500 characters");
      return false;
    }
    return true;
  };

  const handleCreate = () => {
    if (!validateForm()) {
      return;
    }
    const newTemplate: Template = {
      id: Date.now().toString(),
      name: formData.name,
      recipient: formData.recipient,
      amount: parseFloat(formData.amount),
      token: formData.token,
      description: formData.description,
      useCount: 0,
      lastUsed: "",
      createdAt: new Date().toISOString().split("T")[0],
    };
    setTemplates([newTemplate, ...templates]);
    resetForm();
    toast.success("Template created successfully!");
  };

  const handleUpdate = () => {
    if (!editingId) {
      toast.error("No template selected for update");
      return;
    }
    if (!validateForm()) {
      return;
    }
    setTemplates(templates.map(t => 
      t.id === editingId ? { ...t, name: formData.name, recipient: formData.recipient, amount: parseFloat(formData.amount), token: formData.token, description: formData.description } : t
    ));
    setEditingId(null);
    resetForm();
    toast.success("Template updated successfully!");
  };

  const handleDelete = (id: string) => {
    setTemplates(templates.filter(t => t.id !== id));
    toast.success("Template deleted");
  };

  const handleSend = async (template: Template) => {
    setSending(template.id);
    setTemplates(templates.map(t => t.id === template.id ? { ...t, useCount: t.useCount + 1, lastUsed: new Date().toISOString().split("T")[0] } : t));
    setSending(null);
    toast.success(`Payment of $${template.amount} ${template.token} sent!`);
  };

  const handleShare = async (template: Template) => {
    const shareUrl = `https://peys.io/template/${template.id}`;
    await navigator.clipboard.writeText(shareUrl);
    toast.success("Template link copied!");
  };

  const startEdit = (template: Template) => {
    setFormData({
      name: template.name,
      recipient: template.recipient,
      amount: template.amount.toString(),
      token: template.token,
      description: template.description,
    });
    setEditingId(template.id);
    setShowCreate(true);
  };

  const resetForm = () => {
    setFormData({ name: "", recipient: "", amount: "", token: "USDC", description: "" });
    setShowCreate(false);
    setEditingId(null);
  };

  if (!isLoggedIn) {
    return (
      <div className="min-h-screen bg-background">
        <AppHeader />
        <div className="flex min-h-[80vh] flex-col items-center justify-center px-4 text-center">
          <div className="mb-6 flex h-20 w-20 items-center justify-center rounded-full bg-primary/10">
            <LayoutTemplate className="h-10 w-10 text-primary" />
          </div>
          <h2 className="mb-3 font-display text-2xl text-foreground sm:text-3xl">Payment Templates</h2>
          <p className="mb-6 max-w-md text-sm text-muted-foreground">
            Create reusable payment templates for quick and easy transactions.
          </p>
          <button onClick={login} className="rounded-lg bg-primary px-6 py-3 font-semibold text-primary-foreground shadow-glow hover:opacity-90">
            Sign In to Manage Templates
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
        <div className="mb-8 flex items-center justify-between">
          <div>
            <h1 className="font-display text-2xl text-foreground sm:text-3xl">Payment Templates</h1>
            <p className="mt-1 text-sm text-muted-foreground">Create and manage reusable payment templates</p>
          </div>
          <button
            onClick={() => setShowCreate(true)}
            className="flex items-center gap-2 rounded-lg bg-primary px-4 py-2 text-sm font-semibold text-primary-foreground shadow-glow hover:opacity-90"
          >
            <Plus className="h-4 w-4" />
            New Template
          </button>
        </div>

        {showCreate && (
          <motion.div
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            className="mb-6 rounded-xl border border-border bg-card p-6"
          >
            <h3 className="mb-4 font-semibold text-foreground">
              {editingId ? "Edit Template" : "Create New Template"}
            </h3>
            <div className="grid gap-4 sm:grid-cols-2">
              <div>
                <label className="mb-2 block text-sm font-medium text-muted-foreground">Template Name *</label>
                <input
                  type="text"
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  placeholder="e.g., Weekly Allowance"
                  className="w-full rounded-lg border border-border bg-background px-4 py-2.5 text-sm text-foreground placeholder:text-muted-foreground focus:border-primary focus:outline-none"
                />
              </div>
              <div>
                <label className="mb-2 block text-sm font-medium text-muted-foreground">Recipient Address *</label>
                <input
                  type="text"
                  value={formData.recipient}
                  onChange={(e) => setFormData({ ...formData, recipient: e.target.value })}
                  placeholder="0x..."
                  className="w-full rounded-lg border border-border bg-background px-4 py-2.5 text-sm text-foreground placeholder:text-muted-foreground focus:border-primary focus:outline-none"
                />
              </div>
              <div>
                <label className="mb-2 block text-sm font-medium text-muted-foreground">Amount *</label>
                <input
                  type="number"
                  value={formData.amount}
                  onChange={(e) => setFormData({ ...formData, amount: e.target.value })}
                  placeholder="100"
                  className="w-full rounded-lg border border-border bg-background px-4 py-2.5 text-sm text-foreground placeholder:text-muted-foreground focus:border-primary focus:outline-none"
                />
              </div>
              <div>
                <label className="mb-2 block text-sm font-medium text-muted-foreground">Token</label>
                <select
                  value={formData.token}
                  onChange={(e) => setFormData({ ...formData, token: e.target.value })}
                  className="w-full rounded-lg border border-border bg-background px-4 py-2.5 text-sm text-foreground focus:border-primary focus:outline-none"
                >
                  <option value="USDC">USDC</option>
                  <option value="USDT" disabled>USDT (Coming Soon)</option>
                </select>
              </div>
              <div className="sm:col-span-2">
                <label className="mb-2 block text-sm font-medium text-muted-foreground">Description</label>
                <input
                  type="text"
                  value={formData.description}
                  onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                  placeholder="Optional description"
                  className="w-full rounded-lg border border-border bg-background px-4 py-2.5 text-sm text-foreground placeholder:text-muted-foreground focus:border-primary focus:outline-none"
                />
              </div>
            </div>
            <div className="mt-4 flex gap-3">
              <button
                onClick={resetForm}
                className="flex-1 rounded-lg border border-border px-4 py-2 font-medium hover:bg-secondary"
              >
                Cancel
              </button>
              <button
                onClick={editingId ? handleUpdate : handleCreate}
                className="flex-1 rounded-lg bg-primary px-4 py-2 font-semibold text-primary-foreground hover:opacity-90"
              >
                {editingId ? "Update Template" : "Create Template"}
              </button>
            </div>
          </motion.div>
        )}

        {templates.length === 0 ? (
          <div className="rounded-xl border border-border bg-card p-12 text-center">
            <LayoutTemplate className="mx-auto h-12 w-12 text-muted-foreground/50" />
            <h3 className="mt-4 text-lg font-medium text-foreground">No templates yet</h3>
            <p className="mt-2 text-sm text-muted-foreground">
              Create your first payment template for quick sends
            </p>
            <button
              onClick={() => setShowCreate(true)}
              className="mt-6 rounded-lg bg-primary px-4 py-2 text-sm font-semibold text-primary-foreground hover:opacity-90"
            >
              Create Template
            </button>
          </div>
        ) : (
          <div className="space-y-4">
            {templates.map((template) => (
              <motion.div
                key={template.id}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                className="rounded-xl border border-border bg-card p-5"
              >
                <div className="flex items-start justify-between">
                  <div className="flex items-start gap-4">
                    <div className="flex h-12 w-12 items-center justify-center rounded-lg bg-primary/10">
                      <DollarSign className="h-6 w-6 text-primary" />
                    </div>
                    <div>
                      <h3 className="font-semibold text-foreground">{template.name}</h3>
                      <p className="mt-1 flex items-center gap-1 text-sm text-muted-foreground">
                        <User className="h-3 w-3" />
                        {template.recipient}
                      </p>
                      {template.description && (
                        <p className="mt-1 text-xs text-muted-foreground">{template.description}</p>
                      )}
                    </div>
                  </div>
                  <div className="text-right">
                    <p className="text-xl font-bold text-foreground">
                      ${template.amount.toFixed(2)} <span className="text-sm font-normal text-muted-foreground">{template.token}</span>
                    </p>
                    <p className="mt-1 text-xs text-muted-foreground">Used {template.useCount} times</p>
                  </div>
                </div>
                <div className="mt-4 flex items-center justify-between border-t border-border pt-4">
                  <div className="flex items-center gap-4 text-xs text-muted-foreground">
                    <span className="flex items-center gap-1">
                      <Clock className="h-3 w-3" />
                      {template.lastUsed ? `Last: ${new Date(template.lastUsed).toLocaleDateString()}` : "Never used"}
                    </span>
                    <span className="flex items-center gap-1">
                      Created {new Date(template.createdAt).toLocaleDateString()}
                    </span>
                  </div>
                  <div className="flex items-center gap-2">
                    <button
                      onClick={() => handleSend(template)}
                      disabled={sending === template.id}
                      className="flex items-center gap-1 rounded-lg bg-primary px-3 py-1.5 text-xs font-semibold text-primary-foreground hover:opacity-90 disabled:opacity-50"
                    >
                      {sending === template.id ? (
                        <Loader2 className="h-3 w-3 animate-spin" />
                      ) : (
                        <Send className="h-3 w-3" />
                      )}
                      Send
                    </button>
                    <button
                      onClick={() => handleShare(template)}
                      className="rounded-lg p-2 hover:bg-secondary"
                    >
                      <Share2 className="h-4 w-4 text-muted-foreground" />
                    </button>
                    <button
                      onClick={() => startEdit(template)}
                      className="rounded-lg p-2 hover:bg-secondary"
                    >
                      <Edit className="h-4 w-4 text-muted-foreground" />
                    </button>
                    <button
                      onClick={() => handleDelete(template.id)}
                      className="rounded-lg p-2 hover:bg-secondary"
                    >
                      <Trash2 className="h-4 w-4 text-red-500" />
                    </button>
                  </div>
                </div>
              </motion.div>
            ))}
          </div>
        )}
      </div>
      <Footer />
    </div>
  );
}
