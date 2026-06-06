/**
 * MobileBottomNav - Mobile-only bottom navigation bar with primary links
 * (Home, Dashboard, Send) and an expandable "More" menu with nav items
 * and a Developers sub-section.
 */
import { Link, useLocation } from "react-router-dom";
import { useState } from "react";
import { Home, Send, LayoutDashboard, Users, BarChart3, MessageCircle, MoreHorizontal, Zap, Building2, Wallet, FileText, Code, ChevronDown, ChevronRight, Globe, Calendar, Shield, RefreshCw, Coffee, Package, Activity, Tag, Gift, ShieldCheck, AlertTriangle, Clock, Trophy, Heart, Smartphone, Vault, Palette, Receipt, Split, HandHeart, FileSpreadsheet, PiggyBank, LayoutTemplate, UserCircle, Store, BadgeCheck, TrendingUp, CreditCard, QrCode, Settings, Clipboard, ShieldIcon, ClockIcon, UsersIcon, Camera, ArrowDownToLine, ArrowUpFromLine, Bell, UsersRound, AlertCircle, Fuel, HelpCircle, KeyRound, Keyboard, Accessibility as AccessibilityIcon, Fingerprint, Languages, Wifi, Database, Gauge, Hand, Undo2, Mic } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { toast } from "sonner";

const primaryItems = [
  { to: "/", label: "Home", icon: Home },
  { to: "/dashboard", label: "Dashboard", icon: LayoutDashboard },
  { to: "/send", label: "Send", icon: Send },
];

const moreItems = [
  { to: "/dashboard", label: "Dashboard", icon: LayoutDashboard },
  { to: "/contacts", label: "Contacts", icon: Users },
  { to: "/affiliate", label: "Affiliate", icon: Users },
  { to: "/games", label: "Games", icon: Trophy },
  { to: "/giftcards", label: "Gift Cards", icon: Gift },
  { to: "/feed", label: "Feed", icon: Heart },
  { to: "/timelock", label: "Time-Lock", icon: Vault },
  { to: "/nfc", label: "NFC", icon: Smartphone },
  { to: "/account-recovery", label: "Recovery", icon: ShieldCheck },
  { to: "/approvals", label: "Approvals", icon: ShieldCheck },
  { to: "/disputes", label: "Disputes", icon: AlertTriangle },
  { to: "/subscriptions", label: "Subscriptions", icon: Clock },
  { to: "/cashback", label: "Cashback", icon: Gift },
  { to: "/tipjar", label: "Tip Jar", icon: Coffee },
  { to: "/bundle", label: "Bundle", icon: Package },
  { to: "/explorer", label: "Explorer", icon: Activity },
  { to: "/labels", label: "Labels", icon: Tag },
  { to: "/recurring", label: "Recurring", icon: RefreshCw },
  { to: "/analytics", label: "Analytics", icon: BarChart3 },
  { to: "/badges", label: "Badges", icon: Shield },
  { to: "/collective", label: "Collective", icon: Users },
  { to: "/streaming", label: "Stream", icon: Zap },
  { to: "/calendar", label: "Calendar", icon: Calendar },
  { to: "/organizations", label: "Orgs", icon: Building2 },
  { to: "/whitelabel", label: "Whitelabel", icon: Palette },
  { to: "/tax-report", label: "Tax Report", icon: Receipt },
  { to: "/invoice", label: "Invoice", icon: FileText },
  { to: "/donation", label: "Donation", icon: HandHeart },
  { to: "/split-bill", label: "Split Bill", icon: Split },
  { to: "/statement", label: "Statement", icon: FileSpreadsheet },
  { to: "/privacy", label: "Privacy", icon: UserCircle },
  { to: "/referral", label: "Referral", icon: Gift },
  { to: "/budget", label: "Budget", icon: PiggyBank },
  { to: "/templates", label: "Templates", icon: LayoutTemplate },
  { to: "/merchant", label: "Merchant", icon: Store },
  { to: "/verification", label: "Verify", icon: BadgeCheck },
  { to: "/loyalty", label: "Loyalty", icon: Trophy },
  { to: "/limits", label: "Limits", icon: TrendingUp },
  { to: "/qr-service", label: "QR", icon: QrCode },
  { to: "/roundup", label: "Round-Up", icon: PiggyBank },
  { to: "/auto-receive", label: "Auto-Recv", icon: Settings },
  { to: "/clipboard", label: "Clipboard", icon: Clipboard },
  { to: "/biometric", label: "Security", icon: ShieldIcon },
  { to: "/scheduled", label: "Scheduled", icon: ClockIcon },
  { to: "/bulk-send", label: "Bulk Send", icon: UsersIcon },
  { to: "/import-export", label: "Import/Export", icon: ArrowDownToLine },
  { to: "/qr-scanner", label: "QR Scanner", icon: Camera },
  { to: "/notifications", label: "Alerts", icon: Bell },
  { to: "/pending", label: "Pending", icon: ClockIcon },
  { to: "/address-book", label: "Contacts", icon: UsersRound },
  { to: "/receipt", label: "Receipt", icon: Receipt },
  { to: "/network-gas", label: "Network", icon: Fuel },
  { to: "/security", label: "Security", icon: ShieldIcon },
  { to: "/help-faq", label: "Help", icon: HelpCircle },
  { to: "/waiting-room", label: "Queue", icon: Clock },
  { to: "/keyboard-shortcuts", label: "Keys", icon: Keyboard },
  { to: "/accessibility", label: "A11y", icon: AccessibilityIcon },
  { to: "/sessions", label: "Sessions", icon: Fingerprint },
  { to: "/language", label: "Language", icon: Languages },
  { to: "/websocket", label: "WebSocket", icon: Wifi },
  { to: "/cache", label: "Cache", icon: Database },
  { to: "/rate-limit", label: "Rate", icon: Gauge },
  { to: "/gesture-controls", label: "Gestures", icon: Hand },
  { to: "/undo", label: "Undo", icon: Undo2 },
  { to: "/voice-input", label: "Voice", icon: Mic },
  { to: "/request", label: "Request", icon: Wallet },
];

const devItems = [
  { to: "/docs", label: "Docs", icon: Globe, coming: false },
  { to: "/docs/quickstart", label: "Quick Start", icon: Zap, coming: false },
  { to: "/docs/api/payments", label: "API", icon: Code, coming: false },
  { to: "/docs/sdks/javascript", label: "SDKs", icon: Code, coming: false },
];

/**
 * MobileBottomNav - Renders a fixed bottom nav on mobile (xl:hidden)
 * with primary routes and a slide-up "More" panel.
 */
export default function MobileBottomNav() {
  const location = useLocation();
  const [showMore, setShowMore] = useState(false);
  const [showDev, setShowDev] = useState(false);

  return (
    <>
      <nav className="fixed bottom-0 left-0 right-0 z-50 border-t border-border bg-card/95 backdrop-blur-xl xl:hidden">
        <div className="flex items-center justify-around py-2 px-1">
          {primaryItems.map((item) => {
            const isActive = location.pathname === item.to;
            const Icon = item.icon;
            return (
              <Link
                key={item.to}
                to={item.to}
                onClick={() => setShowMore(false)}
                className={`flex flex-col items-center gap-0.5 rounded-lg px-2 py-1.5 text-[10px] font-medium transition-colors ${
                  isActive
                    ? "text-primary"
                    : "text-muted-foreground hover:text-foreground"
                }`}
              >
                <Icon className={`h-5 w-5 ${isActive ? "text-primary" : ""}`} />
                {item.label}
              </Link>
            );
          })}
          <button
            onClick={() => setShowMore(!showMore)}
            className="flex flex-col items-center gap-0.5 rounded-lg px-2 py-1.5 text-[10px] font-medium text-muted-foreground hover:text-foreground"
          >
            <MoreHorizontal className="h-5 w-5" />
            More
          </button>
        </div>
        {/* Safe area for iOS */}
        <div className="h-[env(safe-area-inset-bottom)]" />
      </nav>

      {/* More Menu Dropdown */}
      <AnimatePresence>
        {showMore && (
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 10 }}
            className="fixed bottom-14 left-0 right-0 z-40 bg-card border-t border-border px-4 py-3 xl:hidden"
          >
            <div className="grid grid-cols-4 gap-2">
              {moreItems.map((item) => {
                const isActive = location.pathname === item.to;
                const Icon = item.icon;
                return (
                  <Link
                    key={item.to}
                    to={item.to}
                    onClick={() => setShowMore(false)}
                    className={`flex flex-col items-center gap-1 rounded-lg px-2 py-2 text-[10px] font-medium transition-colors ${
                      isActive
                        ? "text-primary bg-primary/10"
                        : "text-muted-foreground hover:text-foreground"
                    }`}
                  >
                    <Icon className={`h-5 w-5 ${isActive ? "text-primary" : ""}`} />
                    {item.label}
                  </Link>
                );
              })}
            </div>
            
            {/* Developers Section */}
            <div className="mt-3 border-t border-border pt-3">
              <button
                onClick={() => setShowDev(!showDev)}
                className="flex w-full items-center justify-between rounded-lg px-2 py-2 text-xs font-medium text-muted-foreground"
              >
                <div className="flex items-center gap-2">
                  <Code className="h-4 w-4" />
                  Developers
                </div>
                {showDev ? <ChevronDown className="h-4 w-4" /> : <ChevronRight className="h-4 w-4" />}
              </button>
              <AnimatePresence>
                {showDev && (
                  <motion.div
                    initial={{ height: 0, opacity: 0 }}
                    animate={{ height: "auto", opacity: 1 }}
                    exit={{ height: 0, opacity: 0 }}
                    className="grid grid-cols-4 gap-2 mt-2"
                  >
                    {devItems.map((item) => {
                      const isActive = location.pathname === item.to;
                      const Icon = item.icon;
                      const handleClick = (e: React.MouseEvent) => {
                        if (item.coming) {
                          e.preventDefault();
                          toast.info("Coming soon! Developer features will be available soon.");
                          return;
                        }
                        setShowMore(false);
                        setShowDev(false);
                      };
                      return (
                        <Link
                          key={item.to}
                          to={item.to}
                          onClick={handleClick}
                          className={`flex flex-col items-center gap-1 rounded-lg px-2 py-2 text-[10px] font-medium transition-colors ${
                            isActive
                              ? "text-primary bg-primary/10"
                              : item.coming
                                ? "text-muted-foreground/50 cursor-not-allowed"
                                : "text-muted-foreground hover:text-foreground"
                          }`}
                        >
                          <Icon className={`h-4 w-4 ${isActive ? "text-primary" : ""}`} />
                          {item.label}
                        </Link>
                      );
                    })}
                  </motion.div>
                )}
              </AnimatePresence>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
}
