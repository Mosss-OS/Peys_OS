/** PrivacyPage - Privacy settings for profile visibility, transaction privacy, contact sharing, data export, and account deletion */
import { useState } from "react";
import { motion } from "framer-motion";
import { Shield, Eye, EyeOff, Lock, Users, Download, Trash2, AlertTriangle, Globe, Check, ChevronRight, ExternalLink, FileText } from "lucide-react";
import { useApp } from "@/contexts/AppContext";
import AppHeader from "@/components/AppHeader";
import Footer from "@/components/Footer";
import { toast } from "sonner";

interface ToggleOption {
  id: string;
  label: string;
  description: string;
  enabled: boolean;
}

/** PrivacyPage component - Toggle-based privacy controls across profile, transactions, contacts, data management, and danger zone */
export default function PrivacyPage() {
  const { isLoggedIn, login } = useApp();
  const [profileVisibility, setProfileVisibility] = useState<ToggleOption[]>([
    { id: "public", label: "Public Profile", description: "Anyone can view your profile", enabled: false },
    { id: "discoverable", label: "Discoverable", description: "Others can find you via search", enabled: true },
    { id: "showBalance", label: "Show Balance", description: "Display wallet balance publicly", enabled: false },
  ]);
  const [txPrivacy, setTxPrivacy] = useState<ToggleOption[]>([
    { id: "txPublic", label: "Public Transactions", description: "Your transactions are visible on blockchain", enabled: true },
    { id: "hideFromFeed", label: "Hide from Feed", description: "Don't show in social feed", enabled: false },
    { id: "memoEncryption", label: "Encrypt Memos", description: "Encrypt transaction memos", enabled: true },
  ]);
  const [contactSharing, setContactSharing] = useState<ToggleOption[]>([
    { id: "shareContacts", label: "Share Contacts", description: "Let contacts see your activity", enabled: false },
    { id: "showActivity", label: "Show Activity", description: "Display your activity to contacts", enabled: true },
  ]);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [exporting, setExporting] = useState(false);

  const toggleOption = (category: "profile" | "tx" | "contact", id: string) => {
    if (category === "profile") {
      setProfileVisibility(prev => prev.map(opt => 
        opt.id === id ? { ...opt, enabled: !opt.enabled } : opt
      ));
    } else if (category === "tx") {
      setTxPrivacy(prev => prev.map(opt => 
        opt.id === id ? { ...opt, enabled: !opt.enabled } : opt
      ));
    } else {
      setContactSharing(prev => prev.map(opt => 
        opt.id === id ? { ...opt, enabled: !opt.enabled } : opt
      ));
    }
    toast.success("Privacy settings updated");
  };

  const handleExportData = async () => {
    setExporting(true);
    await new Promise(r => setTimeout(r, 1500));
    toast.success("Your data has been exported");
    setExporting(false);
  };

  const handleDeleteAccount = async () => {
    toast.loading("Processing account deletion...");
    await new Promise(r => setTimeout(r, 2000));
    toast.success("Account deletion requested. You'll receive an email shortly.");
    setShowDeleteConfirm(false);
  };

  if (!isLoggedIn) {
    return (
      <div className="min-h-screen bg-background">
        <AppHeader />
        <div className="flex min-h-[80vh] flex-col items-center justify-center px-4 text-center">
          <div className="mb-6 flex h-20 w-20 items-center justify-center rounded-full bg-primary/10">
            <Shield className="h-10 w-10 text-primary" />
          </div>
          <h2 className="mb-3 font-display text-2xl text-foreground sm:text-3xl">Privacy Settings</h2>
          <p className="mb-6 max-w-md text-sm text-muted-foreground">
            Control your privacy and data visibility settings.
          </p>
          <button onClick={login} className="rounded-lg bg-primary px-6 py-3 font-semibold text-primary-foreground shadow-glow hover:opacity-90">
            Sign In to Manage Privacy
          </button>
        </div>
        <Footer />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      <AppHeader />
      <div className="container mx-auto max-w-2xl px-4 pt-20 pb-12 sm:pt-24 sm:pb-16">
        <div className="mb-8">
          <h1 className="font-display text-2xl text-foreground sm:text-3xl">Privacy Settings</h1>
          <p className="mt-1 text-sm text-muted-foreground">Control your privacy and data visibility</p>
        </div>

        <div className="space-y-6">
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            className="rounded-xl border border-border bg-card p-6"
          >
            <div className="mb-4 flex items-center gap-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-primary/10">
                <Eye className="h-5 w-5 text-primary" />
              </div>
              <div>
                <h2 className="font-semibold text-foreground">Profile Visibility</h2>
                <p className="text-sm text-muted-foreground">Control who can see your profile</p>
              </div>
            </div>
            <div className="space-y-3">
              {profileVisibility.map((option) => (
                <div key={option.id} className="flex items-center justify-between rounded-lg border border-border p-3">
                  <div className="flex items-center gap-3">
                    {option.enabled ? (
                      <Eye className="h-4 w-4 text-green-500" />
                    ) : (
                      <EyeOff className="h-4 w-4 text-muted-foreground" />
                    )}
                    <div>
                      <p className="font-medium text-foreground">{option.label}</p>
                      <p className="text-xs text-muted-foreground">{option.description}</p>
                    </div>
                  </div>
                  <button
                    onClick={() => toggleOption("profile", option.id)}
                    className={`relative h-6 w-11 rounded-full transition-colors ${
                      option.enabled ? "bg-primary" : "bg-secondary"
                    }`}
                  >
                    <span
                      className={`absolute top-0.5 h-5 w-5 rounded-full bg-white shadow transition-transform ${
                        option.enabled ? "left-[22px]" : "left-0.5"
                      }`}
                    />
                  </button>
                </div>
              ))}
            </div>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
            className="rounded-xl border border-border bg-card p-6"
          >
            <div className="mb-4 flex items-center gap-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-primary/10">
                <Lock className="h-5 w-5 text-primary" />
              </div>
              <div>
                <h2 className="font-semibold text-foreground">Transaction Privacy</h2>
                <p className="text-sm text-muted-foreground">Control transaction visibility</p>
              </div>
            </div>
            <div className="space-y-3">
              {txPrivacy.map((option) => (
                <div key={option.id} className="flex items-center justify-between rounded-lg border border-border p-3">
                  <div className="flex items-center gap-3">
                    {option.enabled ? (
                      <Eye className="h-4 w-4 text-green-500" />
                    ) : (
                      <EyeOff className="h-4 w-4 text-muted-foreground" />
                    )}
                    <div>
                      <p className="font-medium text-foreground">{option.label}</p>
                      <p className="text-xs text-muted-foreground">{option.description}</p>
                    </div>
                  </div>
                  <button
                    onClick={() => toggleOption("tx", option.id)}
                    className={`relative h-6 w-11 rounded-full transition-colors ${
                      option.enabled ? "bg-primary" : "bg-secondary"
                    }`}
                  >
                    <span
                      className={`absolute top-0.5 h-5 w-5 rounded-full bg-white shadow transition-transform ${
                        option.enabled ? "left-[22px]" : "left-0.5"
                      }`}
                    />
                  </button>
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
            <div className="mb-4 flex items-center gap-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-primary/10">
                <Users className="h-5 w-5 text-primary" />
              </div>
              <div>
                <h2 className="font-semibold text-foreground">Contact Sharing</h2>
                <p className="text-sm text-muted-foreground">Control contact-related privacy</p>
              </div>
            </div>
            <div className="space-y-3">
              {contactSharing.map((option) => (
                <div key={option.id} className="flex items-center justify-between rounded-lg border border-border p-3">
                  <div className="flex items-center gap-3">
                    {option.enabled ? (
                      <Check className="h-4 w-4 text-green-500" />
                    ) : (
                      <Users className="h-4 w-4 text-muted-foreground" />
                    )}
                    <div>
                      <p className="font-medium text-foreground">{option.label}</p>
                      <p className="text-xs text-muted-foreground">{option.description}</p>
                    </div>
                  </div>
                  <button
                    onClick={() => toggleOption("contact", option.id)}
                    className={`relative h-6 w-11 rounded-full transition-colors ${
                      option.enabled ? "bg-primary" : "bg-secondary"
                    }`}
                  >
                    <span
                      className={`absolute top-0.5 h-5 w-5 rounded-full bg-white shadow transition-transform ${
                        option.enabled ? "left-[22px]" : "left-0.5"
                      }`}
                    />
                  </button>
                </div>
              ))}
            </div>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.3 }}
            className="rounded-xl border border-border bg-card p-6"
          >
            <div className="mb-4 flex items-center gap-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-primary/10">
                <Download className="h-5 w-5 text-primary" />
              </div>
              <div>
                <h2 className="font-semibold text-foreground">Data Management</h2>
                <p className="text-sm text-muted-foreground">Export or delete your data</p>
              </div>
            </div>
            <button
              onClick={handleExportData}
              disabled={exporting}
              className="flex w-full items-center justify-between rounded-lg border border-border p-4 hover:bg-secondary/50"
            >
              <div className="flex items-center gap-3">
                <Download className="h-5 w-5 text-muted-foreground" />
                <div className="text-left">
                  <p className="font-medium text-foreground">Export My Data</p>
                  <p className="text-xs text-muted-foreground">Download all your data in JSON format</p>
                </div>
              </div>
              <ChevronRight className="h-5 w-5 text-muted-foreground" />
            </button>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.4 }}
            className="rounded-xl border border-red-500/20 bg-red-500/5 p-6"
          >
            <div className="mb-4 flex items-center gap-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-red-500/10">
                <Trash2 className="h-5 w-5 text-red-500" />
              </div>
              <div>
                <h2 className="font-semibold text-foreground">Danger Zone</h2>
                <p className="text-sm text-muted-foreground">Irreversible actions</p>
              </div>
            </div>
            {!showDeleteConfirm ? (
              <button
                onClick={() => setShowDeleteConfirm(true)}
                className="flex w-full items-center justify-between rounded-lg border border-red-500/20 p-4 hover:bg-red-500/10"
              >
                <div className="flex items-center gap-3">
                  <Trash2 className="h-5 w-5 text-red-500" />
                  <div className="text-left">
                    <p className="font-medium text-red-500">Delete Account</p>
                    <p className="text-xs text-muted-foreground">Permanently delete your account and data</p>
                  </div>
                </div>
                <ChevronRight className="h-5 w-5 text-red-500" />
              </button>
            ) : (
              <div className="space-y-4">
                <div className="rounded-lg border border-red-500/20 bg-red-500/10 p-4">
                  <p className="text-sm text-red-500">
                    Are you sure? This action cannot be undone. All your data will be permanently deleted.
                  </p>
                </div>
                <div className="flex gap-3">
                  <button
                    onClick={() => setShowDeleteConfirm(false)}
                    className="flex-1 rounded-lg border border-border px-4 py-2 font-medium hover:bg-secondary"
                  >
                    Cancel
                  </button>
                  <button
                    onClick={handleDeleteAccount}
                    className="flex-1 rounded-lg bg-red-500 px-4 py-2 font-medium text-white hover:bg-red-600"
                  >
                    Yes, Delete
                  </button>
                </div>
              </div>
            )}
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.5 }}
            className="rounded-xl border border-border bg-card p-6"
          >
            <h2 className="mb-4 flex items-center gap-2 font-semibold text-foreground">
              <FileText className="h-5 w-5 text-primary" />
              Privacy Policy
            </h2>
            <a
              href="#"
              className="flex items-center justify-between rounded-lg border border-border p-4 hover:bg-secondary/50"
            >
              <div className="flex items-center gap-3">
                <Globe className="h-5 w-5 text-muted-foreground" />
                <div className="text-left">
                  <p className="font-medium text-foreground">Read our Privacy Policy</p>
                  <p className="text-xs text-muted-foreground">Last updated: March 2026</p>
                </div>
              </div>
              <ExternalLink className="h-5 w-5 text-muted-foreground" />
            </a>
          </motion.div>
        </div>
      </div>
      <Footer />
    </div>
  );
}
