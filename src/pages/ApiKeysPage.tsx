import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import { Key, Plus, Copy, Check, Eye, EyeOff, Trash2, RefreshCw, Loader2, ExternalLink, AlertCircle } from "lucide-react";
import { useApp } from "@/contexts/AppContext";
import AppHeader from "@/components/AppHeader";
import Footer from "@/components/Footer";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

interface ApiKey {
  id: string;
  key: string;
  name: string;
  rate_limit: number;
  monthly_api_calls: number;
  monthly_limit: number;
  is_active: boolean;
  locked_until: string | null;
  created_at: string;
}

export default function ApiKeysPage() {
  const { isLoggedIn, login } = useApp();
  const [keys, setKeys] = useState<ApiKey[]>([]);
  const [loading, setLoading] = useState(true);
  const [creating, setCreating] = useState(false);
  const [showNewKey, setShowNewKey] = useState<string | null>(null);
  const [visibleKeys, setVisibleKeys] = useState<Set<string>>(new Set());
  const [copiedKey, setCopiedKey] = useState<string | null>(null);
  const [newKeyName, setNewKeyName] = useState("");

  useEffect(() => {
    if (isLoggedIn) fetchKeys();
    else setLoading(false);
  }, [isLoggedIn]);

  const fetchKeys = async () => {
    try {
      setLoading(true);
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) { setLoading(false); return; }

      const { data, error } = await supabase
        .from("api_keys")
        .select("*")
        .eq("user_id", user.id)
        .order("created_at", { ascending: false });

      if (error) throw error;
      setKeys(data || []);
    } catch (err) {
      console.error("Error fetching API keys:", err);
      toast.error("Failed to load API keys");
    } finally {
      setLoading(false);
    }
  };

  const generateKey = () => {
    const chars = "abcdefghijklmnopqrstuvwxyz0123456789";
    let result = "";
    for (let i = 0; i < 32; i++) result += chars.charAt(Math.floor(Math.random() * chars.length));
    return `pk_live_${result}`;
  };

  const createKey = async () => {
    try {
      setCreating(true);
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) { toast.error("Not authenticated"); return; }

      const newKey = generateKey();
      const { data, error } = await supabase
        .from("api_keys")
        .insert({
          key: newKey,
          name: newKeyName.trim() || `Key ${keys.length + 1}`,
          user_id: user.id,
        })
        .select()
        .single();

      if (error) throw error;

      setKeys([data, ...keys]);
      setShowNewKey(newKey);
      setNewKeyName("");
      toast.success("API key created");
    } catch (err) {
      console.error("Error creating API key:", err);
      toast.error("Failed to create API key");
    } finally {
      setCreating(false);
    }
  };

  const deleteKey = async (id: string) => {
    const { error } = await supabase.from("api_keys").delete().eq("id", id);
    if (error) { toast.error("Failed to delete API key"); return; }
    setKeys(keys.filter(k => k.id !== id));
    toast.success("API key deleted");
  };

  const toggleKey = async (id: string, active: boolean) => {
    const { error } = await supabase.from("api_keys").update({ is_active: active }).eq("id", id);
    if (error) { toast.error("Failed to update API key"); return; }
    setKeys(keys.map(k => k.id === id ? { ...k, is_active: active } : k));
    toast.success(active ? "API key enabled" : "API key disabled");
  };

  const copyToClipboard = async (text: string) => {
    await navigator.clipboard.writeText(text);
    setCopiedKey(text);
    setTimeout(() => setCopiedKey(null), 2000);
    toast.success("Copied to clipboard");
  };

  const maskKey = (key: string) => {
    if (key.length <= 12) return key;
    return key.slice(0, 8) + "••••••••" + key.slice(-4);
  };

  if (!isLoggedIn) {
    return (
      <div className="min-h-screen bg-background">
        <AppHeader />
        <div className="flex min-h-[80vh] flex-col items-center justify-center px-4">
          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="text-center">
            <Key className="mx-auto mb-4 h-12 w-12 text-primary" />
            <h2 className="mb-3 font-display text-2xl text-foreground sm:text-3xl">API Keys</h2>
            <p className="mb-6 text-sm text-muted-foreground">Manage API keys for integrating Peys payments.</p>
            <button onClick={login} className="rounded-lg bg-primary px-6 py-3 font-semibold text-primary-foreground shadow-glow transition-opacity hover:opacity-90">
              Sign In
            </button>
          </motion.div>
        </div>
        <Footer />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      <AppHeader />
      <div className="container mx-auto max-w-4xl px-4 pt-20 pb-12 sm:pt-24 sm:pb-16">
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}>
          <div className="flex items-center justify-between mb-8">
            <div>
              <h1 className="font-display text-2xl text-foreground sm:text-3xl">API Keys</h1>
              <p className="mt-1 text-sm text-muted-foreground">Integrate Peys payments into your apps</p>
            </div>
            <button
              onClick={() => document.getElementById("create-key-form")?.scrollIntoView({ behavior: "smooth" })}
              className="flex items-center gap-2 rounded-lg bg-primary px-4 py-2.5 text-sm font-semibold text-primary-foreground shadow-glow transition-opacity hover:opacity-90"
            >
              <Plus className="h-4 w-4" />
              Create Key
            </button>
          </div>
        </motion.div>

        <div className="mb-8 rounded-xl border border-border bg-card p-6" id="create-key-form">
          <h2 className="mb-4 text-sm font-semibold text-foreground">Create a new API key</h2>
          <div className="flex gap-3">
            <input
              type="text"
              value={newKeyName}
              onChange={e => setNewKeyName(e.target.value)}
              placeholder="Key name (e.g., Production, Staging)"
              className="flex-1 rounded-lg border border-border bg-background px-3 py-2.5 text-sm text-foreground placeholder:text-muted-foreground/50 focus:border-primary focus:outline-none"
              onKeyDown={e => e.key === "Enter" && createKey()}
            />
            <button
              onClick={createKey}
              disabled={creating}
              className="flex items-center gap-2 rounded-lg bg-primary px-5 py-2.5 text-sm font-semibold text-primary-foreground transition-opacity hover:opacity-90 disabled:opacity-50"
            >
              {creating ? <Loader2 className="h-4 w-4 animate-spin" /> : <Plus className="h-4 w-4" />}
              Create
            </button>
          </div>
        </div>

        {showNewKey && (
          <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }}
            className="mb-8 rounded-xl border border-green-500/20 bg-green-500/5 p-5"
          >
            <div className="flex items-start gap-3">
              <Check className="mt-0.5 h-5 w-5 shrink-0 text-green-500" />
              <div className="min-w-0 flex-1">
                <p className="font-semibold text-foreground">API key created</p>
                <p className="mt-1 text-xs text-muted-foreground">
                  Copy this key now. You won't be able to see it again.
                </p>
                <div className="mt-3 flex items-center gap-2">
                  <code className="flex-1 rounded-lg bg-background px-3 py-2 font-mono text-sm text-foreground break-all">
                    {showNewKey}
                  </code>
                  <button
                    onClick={() => copyToClipboard(showNewKey)}
                    className="flex shrink-0 items-center gap-1.5 rounded-lg bg-primary px-3 py-2 text-xs font-medium text-primary-foreground"
                  >
                    {copiedKey === showNewKey ? <Check className="h-3.5 w-3.5" /> : <Copy className="h-3.5 w-3.5" />}
                    {copiedKey === showNewKey ? "Copied" : "Copy"}
                  </button>
                </div>
                <button
                  onClick={() => setShowNewKey(null)}
                  className="mt-2 text-xs text-muted-foreground hover:text-foreground"
                >
                  Dismiss
                </button>
              </div>
            </div>
          </motion.div>
        )}

        {loading ? (
          <div className="flex items-center justify-center py-12">
            <Loader2 className="h-8 w-8 animate-spin text-primary" />
          </div>
        ) : keys.length === 0 ? (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }}
            className="flex flex-col items-center justify-center rounded-xl border border-border bg-card p-12 text-center"
          >
            <Key className="mb-4 h-12 w-12 text-muted-foreground/50" />
            <h3 className="mb-2 text-lg font-semibold text-foreground">No API keys yet</h3>
            <p className="max-w-md text-sm text-muted-foreground">
              Create your first API key to start integrating Peys payments into your applications.
            </p>
          </motion.div>
        ) : (
          <div className="space-y-3">
            {keys.map((k, i) => {
              const isVisible = visibleKeys.has(k.id);
              const progress = k.monthly_limit > 0 ? Math.round((k.monthly_api_calls / k.monthly_limit) * 100) : 0;
              return (
                <motion.div
                  key={k.id}
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: i * 0.03 }}
                  className={`rounded-xl border p-5 ${
                    k.is_active ? "border-border bg-card" : "border-border/50 bg-card/50 opacity-60"
                  }`}
                >
                  <div className="flex items-start justify-between gap-4">
                    <div className="min-w-0 flex-1">
                      <div className="flex items-center gap-3 mb-1.5">
                        <h3 className="font-semibold text-foreground">{k.name}</h3>
                        <span className={`inline-flex items-center rounded-full px-2 py-0.5 text-xs font-medium ${
                          k.is_active ? "bg-green-500/10 text-green-500" : "bg-muted text-muted-foreground"
                        }`}>
                          {k.is_active ? "Active" : "Disabled"}
                        </span>
                      </div>
                      <div className="flex items-center gap-2 font-mono text-sm">
                        <span className="text-foreground">{isVisible ? k.key : maskKey(k.key)}</span>
                        <button
                          onClick={() => {
                            const next = new Set(visibleKeys);
                            isVisible ? next.delete(k.id) : next.add(k.id);
                            setVisibleKeys(next);
                          }}
                          className="text-muted-foreground hover:text-foreground"
                        >
                          {isVisible ? <EyeOff className="h-3.5 w-3.5" /> : <Eye className="h-3.5 w-3.5" />}
                        </button>
                        <button
                          onClick={() => copyToClipboard(k.key)}
                          className="text-muted-foreground hover:text-foreground"
                        >
                          {copiedKey === k.key ? <Check className="h-3.5 w-3.5" /> : <Copy className="h-3.5 w-3.5" />}
                        </button>
                      </div>
                    </div>
                    <div className="flex items-center gap-2 shrink-0">
                      <button
                        onClick={() => toggleKey(k.id, !k.is_active)}
                        className={`rounded-lg border px-3 py-1.5 text-xs font-medium transition-colors ${
                          k.is_active
                            ? "border-border text-muted-foreground hover:bg-secondary"
                            : "border-green-500/30 text-green-500 hover:bg-green-500/10"
                        }`}
                      >
                        {k.is_active ? "Disable" : "Enable"}
                      </button>
                      <button
                        onClick={() => deleteKey(k.id)}
                        className="rounded-lg border border-border px-3 py-1.5 text-xs font-medium text-destructive hover:bg-destructive/10"
                      >
                        <Trash2 className="h-3.5 w-3.5" />
                      </button>
                    </div>
                  </div>
                  <div className="mt-4 flex flex-wrap items-center gap-x-6 gap-y-2 text-xs text-muted-foreground">
                    <span>Created {new Date(k.created_at).toLocaleDateString()}</span>
                    {k.monthly_limit > 0 && (
                      <span className="flex items-center gap-2">
                        Usage
                        <div className="flex h-1.5 w-24 rounded-full bg-secondary overflow-hidden">
                          <div
                            className={`h-full rounded-full transition-all ${
                              progress > 80 ? "bg-destructive" : "bg-primary"
                            }`}
                            style={{ width: `${Math.min(progress, 100)}%` }}
                          />
                        </div>
                        {k.monthly_api_calls}/{k.monthly_limit}
                      </span>
                    )}
                    <span>Rate: {k.rate_limit} req/s</span>
                  </div>
                </motion.div>
              );
            })}
          </div>
        )}

        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.3 }}
          className="mt-8 rounded-xl border border-border bg-card p-6"
        >
          <div className="flex items-start gap-3">
            <ExternalLink className="mt-0.5 h-5 w-5 text-primary" />
            <div>
              <h3 className="font-semibold text-foreground">API Documentation</h3>
              <p className="mt-1 text-sm text-muted-foreground">
                Use your API keys to authenticate requests to the Peys API. See the full API reference for endpoints, request formats, and webhook integration.
              </p>
              <a
                href="/api-docs"
                className="mt-3 inline-flex items-center gap-1.5 text-sm font-medium text-primary hover:underline"
              >
                View API docs <ExternalLink className="h-3.5 w-3.5" />
              </a>
            </div>
          </div>
        </motion.div>
      </div>
      <Footer />
    </div>
  );
}