import { useState } from "react";
import { motion } from "framer-motion";
import { Palette, Eye, Layout, Type, Save, CheckCircle } from "lucide-react";
import { useApp } from "@/contexts/AppContext";
import AppHeader from "@/components/AppHeader";
import Footer from "@/components/Footer";
import { toast } from "sonner";

interface WhitelabelSettings {
  primaryColor: string;
  secondaryColor: string;
  logoUrl: string;
  brandName: string;
  font: string;
  borderRadius: string;
}

export default function WhitelabelPage() {
  const { isLoggedIn, login } = useApp();
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [settings, setSettings] = useState<WhitelabelSettings>({
    primaryColor: "#6366f1",
    secondaryColor: "#8b5cf6",
    logoUrl: "",
    brandName: "My Brand",
    font: "Inter",
    borderRadius: "0.5rem",
  });

  // Load settings from localStorage or API
  useState(() => {
    const saved = localStorage.getItem("whitelabel_settings");
    if (saved) {
      setSettings(JSON.parse(saved));
    }
    setLoading(false);
  });

  const handleSave = async () => {
    setSaving(true);
    try {
      localStorage.setItem("whitelabel_settings", JSON.stringify(settings));
      toast.success("Whitelabel settings saved!");
    } finally {
      setSaving(false);
    }
  };

  if (!isLoggedIn) {
    return (
      <div className="min-h-screen bg-background">
        <AppHeader />
        <div className="flex min-h-[80vh] flex-col items-center justify-center px-4 text-center">
          <div className="mb-6 flex h-20 w-20 items-center justify-center rounded-full bg-primary/10">
            <Palette className="h-10 w-10 text-primary" />
          </div>
          <h2 className="mb-3 font-display text-2xl text-foreground sm:text-3xl">Whitelabel Settings</h2>
          <p className="mb-6 max-w-md text-sm text-muted-foreground">
            Customize the payment experience with your brand colors and logo.
          </p>
          <button onClick={login} className="rounded-lg bg-primary px-6 py-3 font-semibold text-primary-foreground shadow-glow hover:opacity-90">
            Sign In to Customize
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
          <h1 className="font-display text-2xl text-foreground sm:text-3xl">Whitelabel Settings</h1>
          <p className="mt-1 text-sm text-muted-foreground">
            Customize your payment experience with your brand identity.
          </p>
        </div>

        <div className="grid gap-8 lg:grid-cols-2">
          {/* Settings Form */}
          <div className="space-y-6">
            <div className="rounded-xl border border-border bg-card p-6">
              <h3 className="mb-4 flex items-center gap-2 text-lg font-medium text-foreground">
                <Palette className="h-5 w-5" />
                Brand Colors
              </h3>
              
              <div className="space-y-4">
                <div>
                  <label className="mb-1.5 block text-sm text-muted-foreground">Primary Color</label>
                  <div className="flex gap-3">
                    <input
                      type="color"
                      value={settings.primaryColor}
                      onChange={(e) => setSettings({ ...settings, primaryColor: e.target.value })}
                      className="h-10 w-16 rounded-lg border border-border bg-background cursor-pointer"
                    />
                    <input
                      type="text"
                      value={settings.primaryColor}
                      onChange={(e) => setSettings({ ...settings, primaryColor: e.target.value })}
                      className="flex-1 rounded-lg border border-border bg-background px-3 py-2 text-sm text-foreground"
                    />
                  </div>
                </div>

                <div>
                  <label className="mb-1.5 block text-sm text-muted-foreground">Secondary Color</label>
                  <div className="flex gap-3">
                    <input
                      type="color"
                      value={settings.secondaryColor}
                      onChange={(e) => setSettings({ ...settings, secondaryColor: e.target.value })}
                      className="h-10 w-16 rounded-lg border border-border bg-background cursor-pointer"
                    />
                    <input
                      type="text"
                      value={settings.secondaryColor}
                      onChange={(e) => setSettings({ ...settings, secondaryColor: e.target.value })}
                      className="flex-1 rounded-lg border border-border bg-background px-3 py-2 text-sm text-foreground"
                    />
                  </div>
                </div>
              </div>
            </div>

            <div className="rounded-xl border border-border bg-card p-6">
              <h3 className="mb-4 flex items-center gap-2 text-lg font-medium text-foreground">
                <Layout className="h-5 w-5" />
                Brand Identity
              </h3>
              
              <div className="space-y-4">
                <div>
                  <label className="mb-1.5 block text-sm text-muted-foreground">Brand Name</label>
                  <input
                    type="text"
                    value={settings.brandName}
                    onChange={(e) => setSettings({ ...settings, brandName: e.target.value })}
                    className="w-full rounded-lg border border-border bg-background px-3 py-2 text-sm text-foreground"
                  />
                </div>

                <div>
                  <label className="mb-1.5 block text-sm text-muted-foreground">Logo URL</label>
                  <input
                    type="text"
                    value={settings.logoUrl}
                    onChange={(e) => setSettings({ ...settings, logoUrl: e.target.value })}
                    placeholder="https://example.com/logo.png"
                    className="w-full rounded-lg border border-border bg-background px-3 py-2 text-sm text-foreground"
                  />
                </div>

                <div>
                  <label className="mb-1.5 block text-sm text-muted-foreground">Font Family</label>
                  <select
                    value={settings.font}
                    onChange={(e) => setSettings({ ...settings, font: e.target.value })}
                    className="w-full rounded-lg border border-border bg-background px-3 py-2 text-sm text-foreground"
                  >
                    <option value="Inter">Inter</option>
                    <option value="Roboto">Roboto</option>
                    <option value="Open Sans">Open Sans</option>
                    <option value="Lato">Lato</option>
                    <option value="Montserrat">Montserrat</option>
                  </select>
                </div>

                <div>
                  <label className="mb-1.5 block text-sm text-muted-foreground">Border Radius</label>
                  <select
                    value={settings.borderRadius}
                    onChange={(e) => setSettings({ ...settings, borderRadius: e.target.value })}
                    className="w-full rounded-lg border border-border bg-background px-3 py-2 text-sm text-foreground"
                  >
                    <option value="0">None</option>
                    <option value="0.25rem">Small</option>
                    <option value="0.5rem">Medium</option>
                    <option value="1rem">Large</option>
                    <option value="9999px">Full</option>
                  </select>
                </div>
              </div>
            </div>

            <button
              onClick={handleSave}
              disabled={saving}
              className="flex w-full items-center justify-center gap-2 rounded-lg bg-primary py-3 text-sm font-semibold text-primary-foreground shadow-glow hover:opacity-90 disabled:opacity-50"
            >
              {saving ? (
                <>
                  <motion.div
                    animate={{ rotate: 360 }}
                    transition={{ duration: 1, repeat: Infinity, ease: "linear" }}
                    className="h-4 w-4 rounded-full border-2 border-current border-t-transparent"
                  />
                  Saving...
                </>
              ) : (
                <>
                  <Save className="h-4 w-4" />
                  Save Settings
                </>
              )}
            </button>
          </div>

          {/* Preview */}
          <div className="lg:sticky lg:top-24 lg:h-fit">
            <div className="rounded-xl border border-border bg-card p-6">
              <h3 className="mb-4 flex items-center gap-2 text-lg font-medium text-foreground">
                <Eye className="h-5 w-5" />
                Preview
              </h3>
              
              <div
                className="rounded-lg p-6 transition-all duration-300"
                style={{
                  backgroundColor: settings.secondaryColor + "20",
                  borderRadius: settings.borderRadius,
                }}
              >
                <div className="flex items-center gap-4 mb-4">
                  {settings.logoUrl && (
                    <img 
                      src={settings.logoUrl} 
                      alt="Logo" 
                      className="h-12 w-12 rounded-lg object-cover"
                      onError={(e) => {
                        (e.target as HTMLImageElement).style.display = 'none';
                      }}
                    />
                  )}
                  <h4 
                    className="text-xl font-bold"
                    style={{ color: settings.primaryColor }}
                  >
                    {settings.brandName}
                  </h4>
                </div>
                
                <div 
                  className="h-10 w-full rounded-lg mb-3 flex items-center justify-center text-white text-sm font-medium"
                  style={{ backgroundColor: settings.primaryColor, borderRadius: settings.borderRadius }}
                >
                  Pay Now
                </div>
                
                <div className="text-xs text-muted-foreground text-center">
                  Powered by Peys
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
      <Footer />
    </div>
  );
}