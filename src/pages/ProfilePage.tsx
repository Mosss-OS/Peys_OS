import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import { User, Building2, Save, Loader2, ArrowLeft, Fingerprint, Shield, CheckCircle, X, Volume2, VolumeX, Link as LinkIcon, Copy, Check, ExternalLink, RefreshCw } from "lucide-react";
import { Link } from "react-router-dom";
import { useApp } from "@/contexts/AppContext";
import AppHeader from "@/components/AppHeader";
import Footer from "@/components/Footer";
import WalletReceiveCard from "@/components/WalletReceiveCard";
import BiometricAuthModal from "@/components/ui/BiometricAuthModal";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { useSound } from "@/hooks/useSound";
import { useHaptic } from "@/hooks/useHaptic";
import { useWakeLock } from "@/hooks/useWakeLock";
import GoodDollarIdentityCard from "@/components/GoodDollarIdentityCard";

type AccountType = "individual" | "organization";

interface ProfileData {
  display_name: string;
  account_type: AccountType;
  organization_name: string;
  organization_type: string;
}

const ORG_TYPES = ["NGO / Non-profit", "DAO", "Company", "Freelancer", "Government", "Other"];

export default function ProfilePage() {
  const { isLoggedIn, login, wallet, walletAddress } = useApp();
  const { soundsEnabled, setSoundsEnabled, playSound } = useSound();
  const { hapticsEnabled, setHapticsEnabled, triggerHaptic } = useHaptic();
  const { wakeLockEnabled, setWakeLockEnabled, isSupported: wakeLockSupported, isWakeLockActive } = useWakeLock();
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [biometricEnabled, setBiometricEnabled] = useState(false);
  const [showBiometricSetup, setShowBiometricSetup] = useState(false);
  const [profile, setProfile] = useState<ProfileData>({
    display_name: "",
    account_type: "individual",
    organization_name: "",
    organization_type: "",
  });

  useEffect(() => {
    if (!isLoggedIn) return;
    (async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;
      const { data } = await supabase
        .from("profiles")
        .select("display_name, account_type, organization_name, organization_type")
        .eq("user_id", user.id)
        .single();
      if (data) {
        setProfile({
          display_name: data.display_name || "",
          account_type: (data.account_type as AccountType) || "individual",
          organization_name: data.organization_name || "",
          organization_type: data.organization_type || "",
        });
      }
      setBiometricEnabled(sessionStorage.getItem("peys_biometric_enabled") === "true");
      setLoading(false);
    })();
  }, [isLoggedIn]);

  const save = async () => {
    setSaving(true);
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) { setSaving(false); return; }
    const { error } = await supabase
      .from("profiles")
      .update({
        display_name: profile.display_name || null,
        account_type: profile.account_type,
        organization_name: profile.account_type === "organization" ? profile.organization_name || null : null,
        organization_type: profile.account_type === "organization" ? profile.organization_type || null : null,
      })
      .eq("user_id", user.id);
    setSaving(false);
    if (error) toast.error("Failed to save profile");
    else toast.success("Profile saved!");
  };

  if (!isLoggedIn) {
    return (
      <div className="min-h-screen bg-background">
        <AppHeader />
        <div className="flex min-h-[80vh] flex-col items-center justify-center px-4 text-center">
          <h2 className="mb-3 font-display text-2xl text-foreground">Sign in to manage your profile</h2>
          <button onClick={login} className="rounded-lg bg-primary px-6 py-3 font-semibold text-primary-foreground shadow-glow hover:opacity-90">Sign In</button>
        </div>
        <Footer />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      <AppHeader />
      <div className="container mx-auto max-w-3xl px-4 pt-20 pb-12 sm:pt-24 sm:pb-16">
        <Link to="/dashboard" className="mb-4 inline-flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground transition-colors">
          <ArrowLeft className="h-4 w-4" /> Back to Dashboard
        </Link>

        <h1 className="mb-6 font-display text-2xl text-foreground sm:text-3xl">Profile</h1>

        {loading ? (
          <div className="flex justify-center py-12"><Loader2 className="h-6 w-6 animate-spin text-muted-foreground" /></div>
        ) : (
          <div className="space-y-4">
            {/* Account type toggle */}
            <div className="rounded-xl border border-border bg-card p-4 sm:p-6">
              <p className="mb-3 text-sm font-medium text-foreground">Account Type</p>
              <div className="flex gap-2">
                {([
                  { value: "individual" as const, label: "Individual", icon: User },
                  { value: "organization" as const, label: "Organization", icon: Building2 },
                ]).map(({ value, label, icon: Icon }) => (
                  <button
                    key={value}
                    onClick={() => setProfile((p) => ({ ...p, account_type: value }))}
                    className={`flex flex-1 items-center justify-center gap-2 rounded-lg border py-3 text-sm font-medium transition-colors ${
                      profile.account_type === value
                        ? "border-primary bg-primary/10 text-primary"
                        : "border-border text-muted-foreground hover:bg-secondary"
                    }`}
                  >
                    <Icon className="h-4 w-4" /> {label}
                  </button>
                ))}
              </div>
            </div>

            {/* Profile fields */}
            <div className="rounded-xl border border-border bg-card p-4 sm:p-6 space-y-4">
              <div>
                <label className="mb-1.5 block text-xs font-medium text-muted-foreground">Display Name</label>
                <input
                  value={profile.display_name}
                  onChange={(e) => setProfile((p) => ({ ...p, display_name: e.target.value }))}
                  placeholder="Your name"
                  className="w-full rounded-lg border border-border bg-background px-3 py-2 text-sm text-foreground placeholder:text-muted-foreground/50 focus:outline-none focus:ring-2 focus:ring-ring"
                />
              </div>

              {profile.account_type === "organization" && (
                <motion.div initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: "auto" }} className="space-y-4">
                  <div>
                    <label className="mb-1.5 block text-xs font-medium text-muted-foreground">Organization Name</label>
                    <input
                      value={profile.organization_name}
                      onChange={(e) => setProfile((p) => ({ ...p, organization_name: e.target.value }))}
                      placeholder="Acme Corp"
                      className="w-full rounded-lg border border-border bg-background px-3 py-2 text-sm text-foreground placeholder:text-muted-foreground/50 focus:outline-none focus:ring-2 focus:ring-ring"
                    />
                  </div>
                  <div>
                    <label className="mb-1.5 block text-xs font-medium text-muted-foreground">Organization Type</label>
                    <select
                      value={profile.organization_type}
                      onChange={(e) => setProfile((p) => ({ ...p, organization_type: e.target.value }))}
                      className="w-full rounded-lg border border-border bg-background px-3 py-2 text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-ring"
                    >
                      <option value="">Select type...</option>
                      {ORG_TYPES.map((t) => <option key={t} value={t}>{t}</option>)}
                    </select>
                  </div>
                </motion.div>
              )}

              <button
                onClick={save}
                disabled={saving}
                className="flex w-full items-center justify-center gap-2 rounded-lg bg-primary py-2.5 text-sm font-semibold text-primary-foreground shadow-glow hover:opacity-90 disabled:opacity-50"
              >
                {saving ? <Loader2 className="h-4 w-4 animate-spin" /> : <Save className="h-4 w-4" />}
                {saving ? "Saving..." : "Save Profile"}
              </button>
            </div>

            {/* Payment Link */}
            <PaymentLinkSection displayName={profile.display_name} />

            {/* Security Settings */}
            <div className="rounded-xl border border-border bg-card p-4 sm:p-6">
              <div className="mb-4 flex items-center gap-3">
                <div className="flex h-10 w-10 items-center justify-center rounded-full bg-primary/10">
                  <Shield className="h-5 w-5 text-primary" />
                </div>
                <div>
                  <h3 className="font-display text-lg text-foreground">Security</h3>
                  <p className="text-xs text-muted-foreground">Protect your transactions with PIN & biometric</p>
                </div>
              </div>
              
              {biometricEnabled ? (
                <div className="flex items-center justify-between rounded-lg border border-primary/20 bg-primary/5 p-4">
                  <div className="flex items-center gap-3">
                    <CheckCircle className="h-5 w-5 text-primary" />
                    <div>
                      <p className="text-sm font-medium text-foreground">Authentication Enabled</p>
                      <p className="text-xs text-muted-foreground">PIN + Biometric required for transactions</p>
                    </div>
                  </div>
                  <button
                    onClick={() => setShowBiometricSetup(true)}
                    className="rounded-lg border border-border px-3 py-1.5 text-xs font-medium text-muted-foreground hover:bg-secondary transition-colors"
                  >
                    Manage
                  </button>
                </div>
              ) : (
                <button
                  onClick={() => setShowBiometricSetup(true)}
                  className="flex w-full items-center justify-center gap-2 rounded-lg border border-dashed border-border py-4 text-sm font-medium text-muted-foreground hover:border-primary hover:text-primary transition-colors"
                >
                  <Fingerprint className="h-5 w-5" />
                  Set Up Authentication
                </button>
              )}
            </div>

            {/* Sound Settings */}
            <div className="rounded-xl border border-border bg-card p-4 sm:p-6">
              <div className="mb-4 flex items-center gap-3">
                <div className="flex h-10 w-10 items-center justify-center rounded-full bg-primary/10">
                  {soundsEnabled ? <Volume2 className="h-5 w-5 text-primary" /> : <VolumeX className="h-5 w-5 text-primary" />}
                </div>
                <div>
                  <h3 className="font-display text-lg text-foreground">Sound Effects</h3>
                  <p className="text-xs text-muted-foreground">Audio feedback for transactions</p>
                </div>
              </div>
              
              <div className="flex items-center justify-between rounded-lg border border-border bg-background p-4">
                <div>
                  <p className="text-sm font-medium text-foreground">Transaction Sounds</p>
                  <p className="text-xs text-muted-foreground">Play sounds on send, success, and error</p>
                </div>
                <button
                  onClick={() => {
                    const newVal = !soundsEnabled;
                    setSoundsEnabled(newVal);
                    if (newVal) playSound("notification");
                  }}
                  className={`relative h-6 w-11 rounded-full transition-colors ${
                    soundsEnabled ? "bg-primary" : "bg-muted"
                  }`}
                >
                  <span
                    className={`absolute top-0.5 h-5 w-5 rounded-full bg-white shadow transition-transform ${
                      soundsEnabled ? "translate-x-5" : "translate-x-0.5"
                    }`}
                  />
                </button>
              </div>
            </div>

            {/* Haptic Settings */}
            <div className="rounded-xl border border-border bg-card p-4 sm:p-6">
              <div className="mb-4 flex items-center gap-3">
                <div className="flex h-10 w-10 items-center justify-center rounded-full bg-primary/10">
                  <span className="text-lg">📳</span>
                </div>
                <div>
                  <h3 className="font-display text-lg text-foreground">Haptic Feedback</h3>
                  <p className="text-xs text-muted-foreground">Vibration feedback for mobile devices</p>
                </div>
              </div>
              
              <div className="flex items-center justify-between rounded-lg border border-border bg-background p-4">
                <div>
                  <p className="text-sm font-medium text-foreground">Vibration Feedback</p>
                  <p className="text-xs text-muted-foreground">Feel feedback on actions and errors</p>
                </div>
                <button
                  onClick={() => {
                    const newVal = !hapticsEnabled;
                    setHapticsEnabled(newVal);
                    if (newVal) triggerHaptic("toggle");
                  }}
                  className={`relative h-6 w-11 rounded-full transition-colors ${
                    hapticsEnabled ? "bg-primary" : "bg-muted"
                  }`}
                >
                  <span
                    className={`absolute top-0.5 h-5 w-5 rounded-full bg-white shadow transition-transform ${
                      hapticsEnabled ? "translate-x-5" : "translate-x-0.5"
                    }`}
                  />
                </button>
              </div>
            </div>

            {/* Wake Lock Settings */}
            <div className="rounded-xl border border-border bg-card p-4 sm:p-6">
              <div className="mb-4 flex items-center gap-3">
                <div className="flex h-10 w-10 items-center justify-center rounded-full bg-primary/10">
                  <span className="text-lg">☀️</span>
                </div>
                <div>
                  <h3 className="font-display text-lg text-foreground">Screen Wake Lock</h3>
                  <p className="text-xs text-muted-foreground">Keep screen on during transactions</p>
                </div>
              </div>
              
              {!wakeLockSupported ? (
                <div className="rounded-lg border border-border bg-background/50 p-4 text-center">
                  <p className="text-sm text-muted-foreground">Screen wake lock not supported in this browser</p>
                </div>
              ) : (
                <div className="space-y-3">
                  <div className="flex items-center justify-between rounded-lg border border-border bg-background p-4">
                    <div>
                      <p className="text-sm font-medium text-foreground">Auto Wake Lock</p>
                      <p className="text-xs text-muted-foreground">Keep screen on during transactions</p>
                    </div>
                    <button
                      onClick={() => setWakeLockEnabled(!wakeLockEnabled)}
                      className={`relative h-6 w-11 rounded-full transition-colors ${
                        wakeLockEnabled ? "bg-primary" : "bg-muted"
                      }`}
                    >
                      <span
                        className={`absolute top-0.5 h-5 w-5 rounded-full bg-white shadow transition-transform ${
                          wakeLockEnabled ? "translate-x-5" : "translate-x-0.5"
                        }`}
                      />
                    </button>
                  </div>
                  
                  {wakeLockEnabled && (
                    <div className="flex items-center gap-2 rounded-lg border border-border bg-background/50 p-3">
                      <span className={`h-2 w-2 rounded-full ${isWakeLockActive ? "bg-green-500 animate-pulse" : "bg-muted-foreground"}`} />
                      <p className="text-xs text-muted-foreground">
                        {isWakeLockActive ? "Screen wake lock active" : "Wake lock inactive (screen may sleep)"}
                      </p>
                    </div>
                  )}
                </div>
              )}
            </div>

            {/* GoodDollar Identity */}
            <GoodDollarIdentityCard />

            {/* Wallet receive */}
            <WalletReceiveCard address={walletAddress || wallet.address} />
          </div>
        )}
      </div>
      <Footer />
      <BiometricAuthModal
        open={showBiometricSetup}
        onClose={() => setShowBiometricSetup(false)}
        onSuccess={() => setBiometricEnabled(true)}
        reason="Manage your authentication settings"
      />
    </div>
  );
}

function PaymentLinkSection({ displayName }: { displayName: string }) {
  const [links, setLinks] = useState<Array<{ id: string; slug: string; title: string; amount: number | null; amount_type: string; token: string; use_count: number; status: string; frequency: string }>>([]);
  const [loading, setLoading] = useState(true);
  const [creating, setCreating] = useState(false);
  const [showForm, setShowForm] = useState(false);
  const [copied, setCopied] = useState<string | null>(null);

  const [slug, setSlug] = useState("");
  const [linkTitle, setLinkTitle] = useState("");
  const [linkDescription, setLinkDescription] = useState("");
  const [linkAmount, setLinkAmount] = useState("");
  const [linkAmountType, setLinkAmountType] = useState<"fixed" | "custom">("fixed");
  const [linkFrequency, setLinkFrequency] = useState<string>("one_time");
  const [linkToken, setLinkToken] = useState<string>("USDC");

  const appUrl = import.meta.env.VITE_APP_URL || window.location.origin;

  useEffect(() => {
    if (displayName) {
      setSlug(displayName.toLowerCase().replace(/\s+/g, "-").replace(/[^a-z0-9-]/g, ""));
      setLinkTitle(displayName);
    }
  }, [displayName]);

  useEffect(() => {
    loadLinks();
  }, []);

  const loadLinks = async () => {
    setLoading(true);
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) { setLoading(false); return; }
    const { data } = await supabase
      .from("payment_links")
      .select("id, slug, title, amount, amount_type, token, use_count, status, frequency")
      .eq("user_id", user.id)
      .order("created_at", { ascending: false });
    if (data) setLinks(data);
    setLoading(false);
  };

  const createLink = async () => {
    if (!slug) { toast.error("Please enter a slug"); return; }
    setCreating(true);
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) { setCreating(false); return; }

    const { error } = await supabase.from("payment_links").insert({
      user_id: user.id,
      title: linkTitle || displayName || "Pay Me",
      description: linkDescription || null,
      amount: linkAmount ? Math.round(Number(linkAmount) * 1000000) : null,
      amount_type: linkAmountType,
      token: linkToken,
      slug: slug,
      status: "active",
      frequency: linkFrequency,
    });

    setCreating(false);
    if (error) {
      if (error.code === "23505") {
        toast.error("This slug is already taken. Try a different one.");
      } else {
        toast.error("Failed to create payment link");
      }
      return;
    }

    toast.success("Payment link created!");
    setShowForm(false);
    setLinkAmount("");
    setLinkDescription("");
    loadLinks();
  };

  const copyLink = (slug: string) => {
    const link = `${appUrl}/pay/${slug}`;
    navigator.clipboard.writeText(link);
    setCopied(slug);
    toast.success("Link copied!");
    setTimeout(() => setCopied(null), 2000);
  };

  const deleteLink = async (id: string) => {
    const { error } = await supabase.from("payment_links").delete().eq("id", id);
    if (error) { toast.error("Failed to delete"); return; }
    toast.success("Link deleted");
    loadLinks();
  };

  return (
    <div className="rounded-xl border border-border bg-card p-4 sm:p-6">
      <div className="mb-4 flex items-center gap-3">
        <div className="flex h-10 w-10 items-center justify-center rounded-full bg-primary/10">
          <LinkIcon className="h-5 w-5 text-primary" />
        </div>
        <div className="flex-1">
          <h3 className="font-display text-lg text-foreground">Payment Link</h3>
          <p className="text-xs text-muted-foreground">Create a shareable pay link for clients</p>
        </div>
        <button
          onClick={() => setShowForm(!showForm)}
          className="rounded-lg bg-primary px-3 py-1.5 text-xs font-semibold text-primary-foreground hover:opacity-90 transition-opacity"
        >
          {showForm ? "Cancel" : "Create"}
        </button>
      </div>

      {showForm && (
        <motion.div initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: "auto" }} className="mb-4 space-y-3 rounded-lg border border-border bg-background p-4">
          <div>
            <label className="mb-1 block text-xs font-medium text-muted-foreground">Slug (your unique URL)</label>
            <div className="flex items-center gap-1 text-xs text-muted-foreground mb-1">
              <span>{appUrl}/pay/</span>
            </div>
            <input
              value={slug}
              onChange={(e) => setSlug(e.target.value.toLowerCase().replace(/[^a-z0-9-]/g, ""))}
              placeholder="your-name"
              className="w-full rounded-lg border border-border bg-background px-3 py-2 text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-ring"
            />
          </div>
          <div>
            <label className="mb-1 block text-xs font-medium text-muted-foreground">Title</label>
            <input
              value={linkTitle}
              onChange={(e) => setLinkTitle(e.target.value)}
              placeholder="Design Consultation"
              className="w-full rounded-lg border border-border bg-background px-3 py-2 text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-ring"
            />
          </div>
          <div>
            <label className="mb-1 block text-xs font-medium text-muted-foreground">Description (optional)</label>
            <input
              value={linkDescription}
              onChange={(e) => setLinkDescription(e.target.value)}
              placeholder="Payment for services"
              className="w-full rounded-lg border border-border bg-background px-3 py-2 text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-ring"
            />
          </div>
          <div>
            <label className="mb-1 block text-xs font-medium text-muted-foreground">Amount Type</label>
            <div className="flex gap-2">
              {(["fixed", "custom"] as const).map((t) => (
                <button
                  key={t}
                  onClick={() => setLinkAmountType(t)}
                  className={`flex-1 rounded-lg py-2 text-xs font-medium transition-colors ${
                    linkAmountType === t
                      ? "bg-primary text-primary-foreground"
                      : "border border-border text-muted-foreground hover:bg-secondary"
                  }`}
                >
                  {t === "fixed" ? "Fixed Amount" : "Open Amount"}
                </button>
              ))}
            </div>
          </div>
          {linkAmountType === "fixed" && (
            <div>
              <label className="mb-1 block text-xs font-medium text-muted-foreground">Amount (USD)</label>
              <input
                type="number"
                value={linkAmount}
                onChange={(e) => setLinkAmount(e.target.value)}
                placeholder="50.00"
                className="w-full rounded-lg border border-border bg-background px-3 py-2 text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-ring"
              />
            </div>
          )}
          <div>
            <label className="mb-1 block text-xs font-medium text-muted-foreground">Frequency</label>
            <select
              value={linkFrequency}
              onChange={(e) => setLinkFrequency(e.target.value)}
              className="w-full rounded-lg border border-border bg-background px-3 py-2 text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-ring"
            >
              <option value="one_time">One-time</option>
              <option value="weekly">Weekly</option>
              <option value="biweekly">Bi-weekly</option>
              <option value="monthly">Monthly</option>
              <option value="quarterly">Quarterly</option>
            </select>
          </div>
          <div>
            <label className="mb-1 block text-xs font-medium text-muted-foreground">Token</label>
            <div className="flex gap-2">
              {(["USDC", "G$"] as const).map((t) => (
                <button
                  key={t}
                  onClick={() => setLinkToken(t)}
                  className={`flex-1 rounded-lg py-2 text-xs font-medium transition-colors ${
                    linkToken === t
                      ? "bg-primary text-primary-foreground"
                      : "border border-border text-muted-foreground hover:bg-secondary"
                  }`}
                >
                  {t}
                </button>
              ))}
            </div>
          </div>
          <button
            onClick={createLink}
            disabled={creating || !slug}
            className="flex w-full items-center justify-center gap-2 rounded-lg bg-primary py-2.5 text-sm font-semibold text-primary-foreground hover:opacity-90 disabled:opacity-50 transition-opacity"
          >
            {creating ? <Loader2 className="h-4 w-4 animate-spin" /> : <LinkIcon className="h-4 w-4" />}
            {creating ? "Creating..." : "Generate Link"}
          </button>
        </motion.div>
      )}

      {loading ? (
        <div className="flex justify-center py-4">
          <Loader2 className="h-5 w-5 animate-spin text-muted-foreground" />
        </div>
      ) : links.length === 0 ? (
        <div className="rounded-lg border border-dashed border-border p-4 text-center">
          <p className="text-xs text-muted-foreground">No payment links yet. Create one to share with clients.</p>
        </div>
      ) : (
        <div className="space-y-2">
          {links.map((link) => (
            <div key={link.id} className="flex items-center justify-between rounded-lg border border-border bg-background p-3">
              <div className="min-w-0 flex-1">
                <p className="truncate text-sm font-medium text-foreground">{link.title}</p>
                <p className="text-xs text-muted-foreground">
                  {appUrl}/pay/{link.slug}
                </p>
                <p className="mt-0.5 text-xs text-muted-foreground">
                  {link.amount_type === "fixed" && link.amount
                    ? `$${(link.amount / 1000000).toFixed(2)} ${link.token}`
                    : "Open amount"}{" "}
                  &middot; {link.use_count} uses
                  {link.frequency && link.frequency !== "one_time" && (
                    <>
                      {" "}&middot; <RefreshCw className="mr-0.5 inline h-3 w-3" />
                      {link.frequency}
                    </>
                  )}
                </p>
              </div>
              <div className="flex items-center gap-1">
                <button
                  onClick={() => copyLink(link.slug)}
                  className="rounded-lg p-2 text-muted-foreground hover:bg-secondary hover:text-foreground transition-colors"
                  title="Copy link"
                >
                  {copied === link.slug ? <Check className="h-4 w-4" /> : <Copy className="h-4 w-4" />}
                </button>
                <a
                  href={`${appUrl}/pay/${link.slug}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="rounded-lg p-2 text-muted-foreground hover:bg-secondary hover:text-foreground transition-colors"
                  title="Open link"
                >
                  <ExternalLink className="h-4 w-4" />
                </a>
                <button
                  onClick={() => deleteLink(link.id)}
                  className="rounded-lg p-2 text-muted-foreground hover:bg-destructive/10 hover:text-destructive transition-colors"
                  title="Delete link"
                >
                  <X className="h-4 w-4" />
                </button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
