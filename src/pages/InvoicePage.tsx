import { useState, useEffect, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { FileText, Send, Copy, Check, Loader2, DollarSign, Calendar, User, Mail, Plus, Trash2, ArrowLeft, X, ExternalLink, Percent, Receipt } from "lucide-react";
import { Link } from "react-router-dom";
import { useApp } from "@/contexts/AppContext";
import AppHeader from "@/components/AppHeader";
import Footer from "@/components/Footer";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { v4 as uuidv4 } from "uuid";

interface LineItem {
  id: string;
  description: string;
  quantity: number;
  rate: number;
}

interface InvoiceData {
  id: string;
  invoice_number: string;
  client_name: string;
  client_email: string;
  due_date: string;
  status: string;
  items: LineItem[];
  subtotal: number;
  tax_rate: number;
  tax_amount: number;
  discount_percent: number;
  discount_amount: number;
  total: number;
  token: string;
  memo: string | null;
  payment_id: string | null;
  sent_at: string | null;
  paid_at: string | null;
  created_at: string;
}

const STATUS_STYLES: Record<string, string> = {
  draft: "bg-muted text-muted-foreground",
  sent: "bg-blue-500/10 text-blue-600",
  paid: "bg-green-500/10 text-green-600",
  overdue: "bg-red-500/10 text-red-600",
  cancelled: "bg-orange-500/10 text-orange-600",
};

const emptyItem = (): LineItem => ({ id: uuidv4(), description: "", quantity: 1, rate: 0 });

export default function InvoicePage() {
  const { isLoggedIn, login } = useApp();
  const [invoices, setInvoices] = useState<InvoiceData[]>([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);
  const [sendingId, setSendingId] = useState<string | null>(null);
  const [copied, setCopied] = useState<string | null>(null);
  const [nextNumber, setNextNumber] = useState(1);

  // Form state
  const [clientName, setClientName] = useState("");
  const [clientEmail, setClientEmail] = useState("");
  const [dueDate, setDueDate] = useState(() => {
    const d = new Date();
    d.setDate(d.getDate() + 30);
    return d.toISOString().split("T")[0];
  });
  const [items, setItems] = useState<LineItem[]>([emptyItem()]);
  const [taxRate, setTaxRate] = useState(0);
  const [discountPercent, setDiscountPercent] = useState(0);
  const [memo, setMemo] = useState("");

  const appUrl = import.meta.env.VITE_APP_URL || window.location.origin;

  const calcSubtotal = useCallback(() =>
    items.reduce((sum, item) => sum + (item.quantity || 0) * (item.rate || 0), 0),
  [items]);

  const calcTax = useCallback(() => calcSubtotal() * (taxRate / 100), [calcSubtotal, taxRate]);
  const calcDiscount = useCallback(() => calcSubtotal() * (discountPercent / 100), [calcSubtotal, discountPercent]);
  const calcTotal = useCallback(() => calcSubtotal() + calcTax() - calcDiscount(), [calcSubtotal, calcTax, calcDiscount]);

  useEffect(() => { loadInvoices(); }, []);

  const loadInvoices = async () => {
    setLoading(true);
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) { setLoading(false); return; }

    const { data } = await supabase
      .from("invoices")
      .select("*")
      .eq("user_id", user.id)
      .order("created_at", { ascending: false });

    if (data) {
      setInvoices(data as InvoiceData[]);
      const maxNum = data.reduce((max, inv) => {
        const num = parseInt(inv.invoice_number.replace("INV-", ""), 10);
        return isNaN(num) ? max : Math.max(max, num);
      }, 0);
      setNextNumber(maxNum + 1);
    }
    setLoading(false);
  };

  const resetForm = () => {
    setClientName("");
    setClientEmail("");
    const d = new Date();
    d.setDate(d.getDate() + 30);
    setDueDate(d.toISOString().split("T")[0]);
    setItems([emptyItem()]);
    setTaxRate(0);
    setDiscountPercent(0);
    setMemo("");
    setEditingId(null);
  };

  const startEdit = (inv: InvoiceData) => {
    setClientName(inv.client_name);
    setClientEmail(inv.client_email);
    setDueDate(inv.due_date.split("T")[0]);
    setItems(inv.items.length > 0 ? inv.items : [emptyItem()]);
    setTaxRate(inv.tax_rate || 0);
    setDiscountPercent(inv.discount_percent || 0);
    setMemo(inv.memo || "");
    setEditingId(inv.id);
    setShowForm(true);
  };

  const handleSave = async (status: string) => {
    if (!clientName || !clientEmail) { toast.error("Please fill in client details"); return; }
    if (items.length === 0 || items.some(i => !i.description)) { toast.error("Please add at least one line item"); return; }

    setSaving(true);
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) { setSaving(false); return; }

    const subtotal = calcSubtotal();
    const taxAmount = calcTax();
    const discountAmount = calcDiscount();
    const total = calcTotal();

    const payload = {
      user_id: user.id,
      invoice_number: editingId ? undefined : `INV-${String(nextNumber).padStart(4, "0")}`,
      client_name: clientName,
      client_email: clientEmail,
      due_date: new Date(dueDate).toISOString(),
      status,
      items: items as any,
      subtotal,
      tax_rate: taxRate,
      tax_amount: taxAmount,
      discount_percent: discountPercent,
      discount_amount: discountAmount,
      total,
      token: "USDC",
      memo: memo || null,
    };

    let error;
    if (editingId) {
      ({ error } = await supabase.from("invoices").update(payload).eq("id", editingId));
    } else {
      ({ error } = await supabase.from("invoices").insert(payload));
    }

    setSaving(false);
    if (error) { toast.error("Failed to save invoice"); return; }
    toast.success(editingId ? "Invoice updated!" : "Invoice created!");
    setShowForm(false);
    resetForm();
    loadInvoices();
  };

  const handleSend = async (inv: InvoiceData) => {
    setSendingId(inv.id);
    try {
      const claimId = uuidv4();
      const claimSecret = uuidv4();
      const paymentId = `peys_${claimId.replace(/-/g, "").slice(0, 16)}`;
      const expiresAt = new Date(inv.due_date).toISOString();

      const { data: payment, error: payError } = await supabase
        .from("payments")
        .insert({
          payment_id: paymentId,
          sender_user_id: inv.user_id || "",
          sender_email: inv.client_email,
          sender_wallet: null,
          recipient_email: inv.client_email,
          amount: inv.total,
          token: inv.token || "USDC",
          memo: `Invoice ${inv.invoice_number}: ${inv.client_name}`,
          claim_secret: claimSecret,
          claim_link: claimId,
          status: "pending",
          expires_at: expiresAt,
        })
        .select()
        .single();

      if (payError) throw payError;

      await supabase
        .from("invoices")
        .update({ status: "sent", payment_id: payment?.id || null, sent_at: new Date().toISOString() })
        .eq("id", inv.id);

      const link = `${appUrl}/claim/${claimId}`;
      navigator.clipboard.writeText(link);
      toast.success(`Invoice sent! Payment link copied.`);

      loadInvoices();
    } catch (err) {
      toast.error("Failed to send invoice");
    }
    setSendingId(null);
  };

  const markPaid = async (id: string) => {
    await supabase.from("invoices").update({ status: "paid", paid_at: new Date().toISOString() }).eq("id", id);
    toast.success("Invoice marked as paid");
    loadInvoices();
  };

  const deleteInvoice = async (id: string) => {
    await supabase.from("invoices").delete().eq("id", id);
    toast.success("Invoice deleted");
    loadInvoices();
  };

  const copyLink = async (inv: InvoiceData) => {
    if (!inv.payment_id) { toast.error("No payment link available"); return; }
    const { data } = await supabase.from("payments").select("claim_link").eq("id", inv.payment_id).single();
    if (data?.claim_link) {
      const link = `${appUrl}/claim/${data.claim_link}`;
      navigator.clipboard.writeText(link);
      setCopied(inv.id);
      toast.success("Payment link copied!");
      setTimeout(() => setCopied(null), 2000);
    }
  };

  if (!isLoggedIn) {
    return (
      <div className="min-h-screen bg-background">
        <AppHeader />
        <div className="flex min-h-[80vh] flex-col items-center justify-center px-4 text-center">
          <div className="mb-6 flex h-20 w-20 items-center justify-center rounded-full bg-primary/10">
            <FileText className="h-10 w-10 text-primary" />
          </div>
          <h2 className="mb-3 font-display text-2xl text-foreground sm:text-3xl">Invoice</h2>
          <p className="mb-6 max-w-md text-sm text-muted-foreground">
            Create and manage professional invoices for your clients.
          </p>
          <button onClick={login} className="rounded-lg bg-primary px-6 py-3 font-semibold text-primary-foreground shadow-glow hover:opacity-90">
            Sign In to Create Invoices
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
        <Link to="/dashboard" className="mb-4 inline-flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground transition-colors">
          <ArrowLeft className="h-4 w-4" /> Back to Dashboard
        </Link>

        <div className="mb-8 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="flex h-12 w-12 items-center justify-center rounded-full bg-primary/10">
              <FileText className="h-6 w-6 text-primary" />
            </div>
            <div>
              <h1 className="font-display text-2xl text-foreground sm:text-3xl">Invoices</h1>
              <p className="text-sm text-muted-foreground">Create, send, and track payments</p>
            </div>
          </div>
          {!showForm && (
            <button
              onClick={() => { resetForm(); setShowForm(true); }}
              className="flex items-center gap-2 rounded-lg bg-primary px-4 py-2 text-sm font-semibold text-primary-foreground shadow-glow hover:opacity-90"
            >
              <Plus className="h-4 w-4" />
              New Invoice
            </button>
          )}
        </div>

        {showForm ? (
          <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }}
            className="rounded-xl border border-border bg-card p-6"
          >
            <div className="mb-6 flex items-center justify-between">
              <h2 className="font-display text-lg text-foreground">{editingId ? "Edit Invoice" : "New Invoice"}</h2>
              <button onClick={() => { setShowForm(false); resetForm(); }} className="text-muted-foreground hover:text-foreground">
                <X className="h-5 w-5" />
              </button>
            </div>

            <div className="space-y-4">
              <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                <div>
                  <label className="mb-1 block text-xs font-medium text-muted-foreground">Client Name</label>
                  <input value={clientName} onChange={e => setClientName(e.target.value)}
                    placeholder="Acme Corp"
                    className="w-full rounded-lg border border-border bg-background px-3 py-2.5 text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-ring" />
                </div>
                <div>
                  <label className="mb-1 block text-xs font-medium text-muted-foreground">Client Email</label>
                  <input type="email" value={clientEmail} onChange={e => setClientEmail(e.target.value)}
                    placeholder="billing@acme.com"
                    className="w-full rounded-lg border border-border bg-background px-3 py-2.5 text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-ring" />
                </div>
              </div>

              <div>
                <label className="mb-1 block text-xs font-medium text-muted-foreground">Due Date</label>
                <input type="date" value={dueDate} onChange={e => setDueDate(e.target.value)}
                  className="w-full rounded-lg border border-border bg-background px-3 py-2.5 text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-ring" />
              </div>

              {/* Line items */}
              <div>
                <div className="mb-2 flex items-center justify-between">
                  <label className="text-xs font-medium text-muted-foreground">Line Items</label>
                  <button onClick={() => setItems(prev => [...prev, emptyItem()])}
                    className="flex items-center gap-1 text-xs text-primary hover:underline">
                    <Plus className="h-3 w-3" /> Add Item
                  </button>
                </div>
                <div className="space-y-2">
                  {items.map((item, i) => (
                    <div key={item.id} className="flex items-start gap-2">
                      <input value={item.description} onChange={e => {
                        const next = [...items]; next[i] = { ...next[i], description: e.target.value }; setItems(next);
                      }} placeholder="Description" className="flex-1 rounded-lg border border-border bg-background px-3 py-2 text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-ring" />
                      <input type="number" value={item.quantity || ""} onChange={e => {
                        const next = [...items]; next[i] = { ...next[i], quantity: Number(e.target.value) || 0 }; setItems(next);
                      }} placeholder="Qty" className="w-16 rounded-lg border border-border bg-background px-2 py-2 text-sm text-center text-foreground focus:outline-none focus:ring-2 focus:ring-ring" />
                      <input type="number" value={item.rate || ""} onChange={e => {
                        const next = [...items]; next[i] = { ...next[i], rate: Number(e.target.value) || 0 }; setItems(next);
                      }} placeholder="Rate" className="w-24 rounded-lg border border-border bg-background px-2 py-2 text-sm text-right text-foreground focus:outline-none focus:ring-2 focus:ring-ring" />
                      <div className="flex h-9 w-16 items-center justify-end text-sm font-medium text-foreground">
                        ${(item.quantity * item.rate).toFixed(2)}
                      </div>
                      {items.length > 1 && (
                        <button onClick={() => setItems(prev => prev.filter((_, idx) => idx !== i))}
                          className="mt-1 text-muted-foreground hover:text-destructive">
                          <Trash2 className="h-4 w-4" />
                        </button>
                      )}
                    </div>
                  ))}
                </div>
              </div>

              {/* Tax & Discount */}
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="mb-1 block text-xs font-medium text-muted-foreground">Tax Rate (%)</label>
                  <div className="relative">
                    <Percent className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                    <input type="number" value={taxRate || ""} onChange={e => setTaxRate(Number(e.target.value) || 0)}
                      className="w-full rounded-lg border border-border bg-background px-8 py-2.5 text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-ring" />
                  </div>
                </div>
                <div>
                  <label className="mb-1 block text-xs font-medium text-muted-foreground">Discount (%)</label>
                  <div className="relative">
                    <Percent className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                    <input type="number" value={discountPercent || ""} onChange={e => setDiscountPercent(Number(e.target.value) || 0)}
                      className="w-full rounded-lg border border-border bg-background px-8 py-2.5 text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-ring" />
                  </div>
                </div>
              </div>

              {/* Totals */}
              <div className="rounded-lg border border-border bg-secondary/30 p-4 space-y-1 text-sm">
                <div className="flex justify-between text-muted-foreground"><span>Subtotal</span><span>${calcSubtotal().toFixed(2)}</span></div>
                {taxRate > 0 && <div className="flex justify-between text-muted-foreground"><span>Tax ({taxRate}%)</span><span>${calcTax().toFixed(2)}</span></div>}
                {discountPercent > 0 && <div className="flex justify-between text-muted-foreground"><span>Discount ({discountPercent}%)</span><span>-${calcDiscount().toFixed(2)}</span></div>}
                <div className="flex justify-between font-semibold text-foreground pt-1 border-t border-border"><span>Total</span><span>${calcTotal().toFixed(2)} USDC</span></div>
              </div>

              {/* Memo */}
              <div>
                <label className="mb-1 block text-xs font-medium text-muted-foreground">Memo (optional)</label>
                <textarea value={memo} onChange={e => setMemo(e.target.value)} rows={2}
                  placeholder="Payment terms, notes, etc."
                  className="w-full rounded-lg border border-border bg-background px-3 py-2 text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-ring resize-none" />
              </div>

              {/* Actions */}
              <div className="flex gap-3 pt-2">
                <button onClick={() => { setShowForm(false); resetForm(); }}
                  className="flex-1 rounded-xl border border-border py-2.5 text-sm font-medium text-foreground hover:bg-secondary">
                  Cancel
                </button>
                <button onClick={() => handleSave("draft")} disabled={saving}
                  className="flex-1 rounded-xl border border-border py-2.5 text-sm font-medium text-foreground hover:bg-secondary disabled:opacity-50">
                  {saving ? "Saving..." : "Save as Draft"}
                </button>
                <button onClick={() => handleSave("draft")} disabled={saving}
                  className="flex flex-1 items-center justify-center gap-2 rounded-xl bg-primary py-2.5 text-sm font-semibold text-primary-foreground shadow-glow hover:opacity-90 disabled:opacity-50">
                  {saving ? <Loader2 className="h-4 w-4 animate-spin" /> : <Send className="h-4 w-4" />}
                  {saving ? "Saving..." : "Save & Send"}
                </button>
              </div>
            </div>
          </motion.div>
        ) : loading ? (
          <div className="flex justify-center py-12">
            <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
          </div>
        ) : invoices.length === 0 ? (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }}
            className="rounded-xl border border-border bg-card p-12 text-center"
          >
            <Receipt className="mx-auto h-12 w-12 text-muted-foreground/50" />
            <h3 className="mt-4 font-display text-lg text-foreground">No invoices yet</h3>
            <p className="mt-2 text-sm text-muted-foreground">Create your first invoice to get paid</p>
            <button onClick={() => { resetForm(); setShowForm(true); }}
              className="mt-6 rounded-lg bg-primary px-6 py-2.5 text-sm font-semibold text-primary-foreground shadow-glow hover:opacity-90">
              Create Invoice
            </button>
          </motion.div>
        ) : (
          <div className="space-y-3">
            {invoices.map((inv) => (
              <motion.div key={inv.id} initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }}
                className="rounded-xl border border-border bg-card p-5"
              >
                <div className="flex items-start justify-between">
                  <div className="flex items-start gap-4">
                    <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-primary/10">
                      <FileText className="h-5 w-5 text-primary" />
                    </div>
                    <div>
                      <div className="flex items-center gap-2">
                        <h3 className="font-semibold text-foreground">{inv.invoice_number}</h3>
                        <span className={`rounded-full px-2 py-0.5 text-xs font-medium ${STATUS_STYLES[inv.status] || ""}`}>
                          {inv.status.charAt(0).toUpperCase() + inv.status.slice(1)}
                        </span>
                      </div>
                      <p className="mt-0.5 flex items-center gap-1 text-sm text-muted-foreground">
                        <User className="h-3 w-3" /> {inv.client_name}
                      </p>
                      <p className="flex items-center gap-1 text-sm text-muted-foreground">
                        <Mail className="h-3 w-3" /> {inv.client_email}
                      </p>
                    </div>
                  </div>
                  <div className="text-right">
                    <p className="text-xl font-bold text-foreground">${Number(inv.total).toFixed(2)}</p>
                    <p className="text-xs text-muted-foreground">{inv.token}</p>
                  </div>
                </div>
                <div className="mt-3 flex items-center justify-between border-t border-border pt-3">
                  <div className="flex items-center gap-3 text-xs text-muted-foreground">
                    <span className="flex items-center gap-1">
                      <Calendar className="h-3 w-3" />
                      Due: {new Date(inv.due_date).toLocaleDateString()}
                    </span>
                    {inv.sent_at && <span>Sent: {new Date(inv.sent_at).toLocaleDateString()}</span>}
                  </div>
                  <div className="flex items-center gap-1">
                    {inv.status === "draft" && (
                      <button onClick={() => handleSend(inv)} disabled={sendingId === inv.id}
                        className="flex items-center gap-1 rounded-lg px-3 py-1.5 text-xs font-medium bg-primary text-primary-foreground hover:opacity-90 disabled:opacity-50">
                        {sendingId === inv.id ? <Loader2 className="h-3 w-3 animate-spin" /> : <Send className="h-3 w-3" />}
                        Send
                      </button>
                    )}
                    {inv.payment_id && (
                      <button onClick={() => copyLink(inv)}
                        className="rounded-lg p-1.5 text-muted-foreground hover:bg-secondary" title="Copy payment link">
                        {copied === inv.id ? <Check className="h-4 w-4" /> : <Copy className="h-4 w-4" />}
                      </button>
                    )}
                    {inv.status === "sent" && (
                      <button onClick={() => markPaid(inv.id)}
                        className="rounded-lg px-3 py-1.5 text-xs font-medium bg-green-500/10 text-green-600 hover:bg-green-500/20">
                        Mark Paid
                      </button>
                    )}
                    <button onClick={() => startEdit(inv)}
                      className="rounded-lg p-1.5 text-muted-foreground hover:bg-secondary" title="Edit">
                      <FileText className="h-4 w-4" />
                    </button>
                    <button onClick={() => deleteInvoice(inv.id)}
                      className="rounded-lg p-1.5 text-muted-foreground hover:bg-destructive/10 hover:text-destructive" title="Delete">
                      <Trash2 className="h-4 w-4" />
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
