/**
 * AppHeader - Top navigation bar with logo, desktop nav dropdowns
 * (Personal, Organization, Developers), theme toggle, notification bell,
 * login/logout buttons, and a mobile slide-out menu.
 */
import { useState } from "react";
import { Link, useLocation } from "react-router-dom";
import { Menu, X, Sun, Moon, ChevronDown, MessageCircle, Send, Wallet, Link2, Users, Zap, BarChart3, FileText, CreditCard, Building2, User, Code, Terminal, Box, Globe, Lock, Key, Webhook, AlertCircle, Coffee } from "lucide-react";
import { useApp } from "@/contexts/AppContext";
import { useTheme } from "@/contexts/ThemeContext";
import { motion, AnimatePresence } from "framer-motion";
import { toast } from "sonner";
import NotificationBell from "@/components/NotificationBell";

/**
 * AppHeader - Renders the site-wide header with responsive navigation,
 * theme switching, authentication controls, and notifications.
 */
export default function AppHeader() {
  const { isLoggedIn, login, logout, wallet } = useApp();
  const { theme, toggleTheme } = useTheme();
  const location = useLocation();
  const logoSrc = theme === "light"
    ? "https://res.cloudinary.com/dv0tt80vn/image/upload/v1780854543/peys_white_cropped.png"
    : "https://res.cloudinary.com/dv0tt80vn/image/upload/v1780783511/peys_logo_white_cropped.png";
  const [mobileOpen, setMobileOpen] = useState(false);
  const [personalOpen, setPersonalOpen] = useState(false);
  const [orgOpen, setOrgOpen] = useState(false);
  const [devOpen, setDevOpen] = useState(false);

  const personalItems = [
    { to: "/send", label: "Send Money", desc: "Send via link or address", icon: Send, disabled: false },
    { to: "/tipjar", label: "Tip Jar", desc: "Receive G$ tips", icon: Coffee, disabled: false },
    { to: "/collective", label: "GoodCollective", desc: "Community governance", icon: Users, disabled: false },
    { to: "/request", label: "Request", desc: "Create payment request", icon: FileText, disabled: true },
    { to: "/contacts", label: "Contacts", desc: "Manage recipients", icon: Users, disabled: true },
  ];

  const mobilePersonalItems = [
    { to: "/send", label: "Send Money", desc: "Send via link or address", icon: Send, disabled: false },
    { to: "/tipjar", label: "Tip Jar", desc: "Receive G$ tips", icon: Coffee, disabled: false },
    { to: "/collective", label: "GoodCollective", desc: "Community governance", icon: Users, disabled: false },
    { to: "/request", label: "Request", desc: "Create payment request", icon: FileText, disabled: true },
    { to: "/contacts", label: "Contacts", desc: "Manage recipients", icon: Users, disabled: true },
  ];

  const orgItems = [
    { to: "/batch", label: "Batch Payments", desc: "Pay multiple people", icon: CreditCard, disabled: true },
    { to: "/escrow", label: "Escrow", desc: "Manage pending payments", icon: Lock, disabled: true },
    { to: "/streaming", label: "Streaming", desc: "Stream payments", icon: Zap, disabled: true },
    { to: "/analytics", label: "Analytics", desc: "Track & report", icon: BarChart3, disabled: true },
    { to: "/dashboard", label: "Dashboard", desc: "Overview", icon: Building2, disabled: false },
    { to: "/organizations", label: "Organizations", desc: "Team & business", icon: Building2, disabled: true },
  ];

  const devItems = [
    { to: "/docs", label: "Documentation", desc: "Full developer docs", icon: Globe, disabled: false },
    { to: "/docs/quickstart", label: "Quick Start", desc: "Get started in 5 min", icon: Zap, disabled: false },
    { to: "/api-keys", label: "API Keys", desc: "Manage your API keys", icon: Key, disabled: false },
    { to: "/webhooks", label: "Webhooks", desc: "Configure webhook endpoints", icon: Webhook, disabled: true },
    { to: "/docs/api/payments", label: "API Reference", desc: "REST API endpoints", icon: Code, disabled: false },
    { to: "/docs/sdks/javascript", label: "SDKs", desc: "JS, Python, Go", icon: Terminal, disabled: false },
    { to: "/docs/sdks/pricing", label: "SDK Pricing", desc: "Pricing for SDKs", icon: CreditCard, disabled: true },
  ];

  /**
   * handleLogin - Triggers the login flow via AppContext and shows a welcome toast.
   */
  const handleLogin = () => {
    login();
    toast.success("Welcome back! 👋");
  };

  /**
   * handleLogout - Signs the user out via AppContext and shows a confirmation toast.
   */
  const handleLogout = () => {
    logout();
    toast("Signed out successfully");
  };

  return (
    <>
      <header className="fixed top-0 left-0 right-0 z-50 border-b border-border bg-background/80 backdrop-blur-xl">
        <div className="container mx-auto flex h-14 items-center justify-between px-4 sm:h-16 lg:px-8">
          <Link to="/" className="flex items-center gap-2 shrink-0">
            <img
              src={logoSrc}
              alt="Peys"
              className="h-10 w-10 rounded-lg sm:h-11 sm:w-11"
            />
            <span className="text-base font-semibold text-foreground tracking-tight sm:text-lg">
              Peys
            </span>
          </Link>

          <nav className="hidden items-center gap-1 rounded-full border border-border bg-secondary/50 px-1.5 py-1 xl:flex">
            <Link
              to="/"
              className={`rounded-full px-4 py-1.5 text-sm font-medium transition-all ${
                location.pathname === "/"
                  ? "bg-primary text-primary-foreground shadow-sm"
                  : "text-muted-foreground hover:text-foreground hover:bg-secondary"
              }`}
            >
              Home
            </Link>

            {/* Personal dropdown */}
            <div
              className="relative"
              onMouseEnter={() => setPersonalOpen(true)}
              onMouseLeave={() => setPersonalOpen(false)}
            >
              <button
                className={`flex items-center gap-1 rounded-full px-4 py-1.5 text-sm font-medium transition-all ${
                  personalOpen
                    ? "bg-primary text-primary-foreground"
                    : "text-muted-foreground hover:text-foreground hover:bg-secondary"
                }`}
              >
                <User className="h-4 w-4" />
                Personal <ChevronDown className="h-3 w-3" />
              </button>

              <AnimatePresence>
                {personalOpen && (
                  <motion.div
                    initial={{ opacity: 0, y: 8 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: 8 }}
                    transition={{ duration: 0.15 }}
                    className="absolute left-0 top-full pt-2 z-50"
                  >
                    <div className="w-72 rounded-xl border border-border bg-card p-2 shadow-elevated">
                      <p className="mb-2 px-3 py-1 text-[10px] font-semibold uppercase tracking-widest text-muted-foreground/50">
                        For Individuals
                      </p>
                        {personalItems.map((item) => {
                          const Icon = item.icon;
                          const disabled = item.disabled;
                          if (disabled) {
                            return (
                              <div
                                key={item.to}
                                className="flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm text-muted-foreground/50 cursor-not-allowed"
                                onClick={() => toast.info("This feature is disabled for MVP. Core send→claim flow only.")}
                              >
                                <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-secondary opacity-50">
                                  <Icon className="h-4 w-4" />
                                </div>
                                <div>
                                  <div className="font-medium text-muted-foreground/50">{item.label}</div>
                                  <div className="text-xs text-muted-foreground">{item.desc}</div>
                                </div>
                                <AlertCircle className="h-4 w-4 text-muted-foreground/50 ml-auto" />
                              </div>
                            );
                          }
                          return (
                            <Link
                              key={item.to}
                              to={item.to}
                              onClick={() => setPersonalOpen(false)}
                              className={`flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm transition-colors ${
                                location.pathname === item.to
                                  ? "bg-primary/10 text-primary font-medium"
                                  : "text-muted-foreground hover:bg-secondary hover:text-foreground"
                              }`}
                            >
                              <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-secondary">
                                <Icon className="h-4 w-4" />
                              </div>
                              <div>
                                <div className="font-medium text-foreground">{item.label}</div>
                                <div className="text-xs text-muted-foreground">{item.desc}</div>
                              </div>
                            </Link>
                          );
                        })}
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>
            </div>

            {/* Organization dropdown */}
            <div
              className="relative"
              onMouseEnter={() => setOrgOpen(true)}
              onMouseLeave={() => setOrgOpen(false)}
            >
              <button
                className={`flex items-center gap-1 rounded-full px-4 py-1.5 text-sm font-medium transition-all ${
                  orgOpen
                    ? "bg-primary text-primary-foreground"
                    : "text-muted-foreground hover:text-foreground hover:bg-secondary"
                }`}
              >
                <Building2 className="h-4 w-4" />
                Organization <ChevronDown className="h-3 w-3" />
              </button>

              <AnimatePresence>
                {orgOpen && (
                  <motion.div
                    initial={{ opacity: 0, y: 8 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: 8 }}
                    transition={{ duration: 0.15 }}
                    className="absolute left-0 top-full pt-2 z-50"
                  >
                    <div className="w-72 rounded-xl border border-border bg-card p-2 shadow-elevated">
                      <p className="mb-2 px-3 py-1 text-[10px] font-semibold uppercase tracking-widest text-muted-foreground/50">
                        For Teams & Business
                      </p>
                        {orgItems.map((item) => {
                          const Icon = item.icon;
                          const disabled = item.disabled;
                          if (disabled) {
                            return (
                              <div
                                key={item.to}
                                className="flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm text-muted-foreground/50 cursor-not-allowed"
                                onClick={() => toast.info("This feature is disabled for MVP. Core send→claim flow only.")}
                              >
                                <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-secondary opacity-50">
                                  <Icon className="h-4 w-4" />
                                </div>
                                <div>
                                  <div className="font-medium text-muted-foreground/50">{item.label}</div>
                                  <div className="text-xs text-muted-foreground">{item.desc}</div>
                                </div>
                                <AlertCircle className="h-4 w-4 text-muted-foreground/50 ml-auto" />
                              </div>
                            );
                          }
                          return (
                            <Link
                              key={item.to}
                              to={item.to}
                              onClick={() => setOrgOpen(false)}
                              className={`flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm transition-colors ${
                                location.pathname === item.to
                                  ? "bg-primary/10 text-primary font-medium"
                                  : "text-muted-foreground hover:bg-secondary hover:text-foreground"
                              }`}
                            >
                              <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-secondary">
                                <Icon className="h-4 w-4" />
                              </div>
                              <div>
                                <div className="font-medium text-foreground">{item.label}</div>
                                <div className="text-xs text-muted-foreground">{item.desc}</div>
                              </div>
                            </Link>
                          );
                        })}
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>
            </div>

            {/* Developers dropdown */}
            <div
              className="relative"
              onMouseEnter={() => setDevOpen(true)}
              onMouseLeave={() => setDevOpen(false)}
            >
              <button
                className={`flex items-center gap-1 rounded-full px-4 py-1.5 text-sm font-medium transition-all ${
                  devOpen
                    ? "bg-primary text-primary-foreground"
                    : "text-muted-foreground hover:text-foreground hover:bg-secondary"
                }`}
              >
                <Code className="h-4 w-4" />
                Developers <ChevronDown className="h-3 w-3" />
              </button>

              <AnimatePresence>
                {devOpen && (
                  <motion.div
                    initial={{ opacity: 0, y: 8 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: 8 }}
                    transition={{ duration: 0.15 }}
                    className="absolute left-0 top-full pt-2 z-50"
                  >
                    <div className="w-72 rounded-xl border border-border bg-card p-2 shadow-elevated">
                      <div className="mb-2 px-3 py-1">
                        <p className="text-[10px] font-semibold uppercase tracking-widest text-muted-foreground/50">
                          For Developers
                        </p>
                      </div>
                        {devItems.map((item) => {
                          const Icon = item.icon;
                          const disabled = item.disabled;
                          if (disabled) {
                            return (
                              <div
                                key={item.to}
                                className="flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm text-muted-foreground/50 cursor-not-allowed"
                                onClick={() => toast.info("This feature is disabled for MVP. Core send→claim flow only.")}
                              >
                                <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-secondary opacity-50">
                                  <Icon className="h-4 w-4" />
                                </div>
                                <div>
                                  <div className="font-medium flex items-center gap-2 text-muted-foreground/50">
                                    {item.label}
                                    <span className="rounded-full bg-secondary px-1.5 py-0.5 text-[9px] font-medium text-muted-foreground">
                                      Disabled
                                    </span>
                                  </div>
                                  <div className="text-xs text-muted-foreground">{item.desc}</div>
                                </div>
                                <AlertCircle className="h-4 w-4 text-muted-foreground/50 ml-auto" />
                              </div>
                            );
                          }
                          return (
                            <Link
                              key={item.to}
                              to={item.to}
                              onClick={() => setDevOpen(false)}
                              className="flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm transition-colors text-muted-foreground hover:bg-secondary hover:text-foreground"
                            >
                              <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-secondary">
                                <Icon className="h-4 w-4" />
                              </div>
                              <div>
                                <div className="font-medium flex items-center gap-2 text-foreground">
                                  {item.label}
                                </div>
                                <div className="text-xs text-muted-foreground">{item.desc}</div>
                              </div>
                            </Link>
                         );
                       })}
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>
            </div>

            <Link
              to="/dashboard"
              className={`rounded-full px-4 py-1.5 text-sm font-medium transition-all ${
                location.pathname === "/dashboard"
                  ? "bg-primary text-primary-foreground shadow-sm"
                  : "text-muted-foreground hover:text-foreground hover:bg-secondary"
              }`}
            >
              Dashboard
            </Link>
          </nav>

          <div className="flex items-center gap-2 sm:gap-3">
            <button
              onClick={toggleTheme}
              className="flex h-8 w-8 items-center justify-center rounded-lg border border-border text-muted-foreground transition-colors hover:text-foreground hover:bg-secondary sm:h-9 sm:w-9"
              aria-label="Toggle theme"
            >
              {theme === "light" ? (
                <Moon className="h-4 w-4" />
              ) : (
                <Sun className="h-4 w-4" />
              )}
            </button>

            <NotificationBell />

            <div className="hidden items-center gap-3 xl:flex">
              {isLoggedIn ? (
                <>
                  <span className="text-sm text-muted-foreground">
                    {wallet.address}
                  </span>
                  <button
                    onClick={handleLogout}
                    className="rounded-lg bg-destructive/10 px-4 py-2 text-sm font-medium text-destructive transition-colors hover:bg-destructive/20"
                  >
                    Sign Out
                  </button>
                </>
              ) : (
                <>
                  <button
                    onClick={handleLogin}
                    className="text-sm font-medium text-muted-foreground hover:text-foreground transition-colors"
                  >
                    Login
                  </button>
                  <button
                    onClick={handleLogin}
                    className="rounded-lg bg-primary px-4 py-2 text-sm font-semibold text-primary-foreground transition-opacity hover:opacity-90"
                  >
                    Open Account
                  </button>
                </>
              )}
            </div>

            <button
              onClick={() => setMobileOpen(!mobileOpen)}
              className="flex h-8 w-8 items-center justify-center rounded-lg border border-border text-muted-foreground xl:hidden"
              aria-label="Toggle menu"
            >
              {mobileOpen ? (
                <X className="h-4 w-4" />
              ) : (
                <Menu className="h-4 w-4" />
              )}
            </button>
          </div>
        </div>
      </header>

      <AnimatePresence>
        {mobileOpen && (
          <>
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="fixed inset-0 z-40 bg-background/60 backdrop-blur-sm xl:hidden"
              onClick={() => setMobileOpen(false)}
            />
            <motion.div
              initial={{ x: "100%" }}
              animate={{ x: 0 }}
              exit={{ x: "100%" }}
              transition={{ type: "spring", damping: 25, stiffness: 300 }}
              className="fixed top-0 right-0 z-50 h-full w-72 border-l border-border bg-card shadow-elevated xl:hidden"
            >
              <div className="flex h-14 items-center justify-between border-b border-border px-4">
                <span className="text-sm font-semibold text-foreground">
                  Menu
                </span>
                <button
                  onClick={() => setMobileOpen(false)}
                  className="text-muted-foreground"
                >
                  <X className="h-5 w-5" />
                </button>
              </div>
              <nav className="flex flex-col gap-1 p-4">
                <Link
                  to="/"
                  onClick={() => setMobileOpen(false)}
                  className={`rounded-lg px-3 py-2.5 text-sm font-medium transition-colors ${location.pathname === "/" ? "bg-primary/10 text-primary" : "text-muted-foreground hover:bg-secondary hover:text-foreground"}`}
                >
                  Home
                </Link>

                {/* Personal Section - Expandable */}
                <button
                  onClick={() => setPersonalOpen(!personalOpen)}
                  className="mt-3 flex items-center justify-between rounded-lg px-3 py-2 text-xs font-semibold uppercase tracking-widest text-muted-foreground"
                >
                  Personal
                  {personalOpen ? <ChevronDown className="h-4 w-4 rotate-180" /> : <ChevronDown className="h-4 w-4" />}
                </button>
                <AnimatePresence>
                  {personalOpen && (
                    <motion.div
                      initial={{ height: 0, opacity: 0 }}
                      animate={{ height: "auto", opacity: 1 }}
                      exit={{ height: 0, opacity: 0 }}
                      className="overflow-hidden"
                    >
                       <div className="grid grid-cols-1 gap-1 p-1">
                          {personalItems.map((item) => {
                            const disabled = item.disabled;
                            if (disabled) {
                              return (
                                <div
                                  key={item.to}
                                  className="flex items-center gap-3 rounded-lg px-3 py-3 text-sm font-medium text-muted-foreground/50 cursor-not-allowed"
                                  onClick={() => toast.info("This feature is disabled for MVP. Core send→claim flow only.")}
                                >
                                  <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-secondary opacity-50">
                                    <item.icon className="h-4 w-4" />
                                  </div>
                                  <div>
                                    <div className="font-medium text-muted-foreground/50">{item.label}</div>
                                    <div className="text-xs text-muted-foreground">{item.desc}</div>
                                  </div>
                                  <AlertCircle className="h-4 w-4 text-muted-foreground/50 ml-auto" />
                                </div>
                              );
                            }
                            return (
                              <Link
                                key={item.to}
                                to={item.to}
                                onClick={() => { setMobileOpen(false); setPersonalOpen(false); }}
                                className={`flex items-center gap-3 rounded-lg px-3 py-3 text-sm font-medium transition-colors ${
                                  location.pathname === item.to 
                                    ? "bg-primary/10 text-primary" 
                                    : "text-muted-foreground hover:bg-secondary hover:text-foreground"
                                }`}
                              >
                                <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-secondary">
                                  <item.icon className="h-4 w-4" />
                                </div>
                                <div>
                                  <div className="font-medium text-foreground">{item.label}</div>
                                  <div className="text-xs text-muted-foreground">{item.desc}</div>
                                </div>
                              </Link>
                            );
                          })}
                       </div>
                    </motion.div>
                  )}
                </AnimatePresence>

                {/* Organization Section - Expandable */}
                <button
                  onClick={() => setOrgOpen(!orgOpen)}
                  className="mt-3 flex items-center justify-between rounded-lg px-3 py-2 text-xs font-semibold uppercase tracking-widest text-muted-foreground"
                >
                  Organization
                  {orgOpen ? <ChevronDown className="h-4 w-4 rotate-180" /> : <ChevronDown className="h-4 w-4" />}
                </button>
                <AnimatePresence>
                  {orgOpen && (
                    <motion.div
                      initial={{ height: 0, opacity: 0 }}
                      animate={{ height: "auto", opacity: 1 }}
                      exit={{ height: 0, opacity: 0 }}
                      className="overflow-hidden"
                    >
                       <div className="grid grid-cols-1 gap-1 p-1">
                          {orgItems.map((item) => {
                            const disabled = item.disabled;
                            if (disabled) {
                              return (
                                <div
                                  key={item.to}
                                  className="flex items-center gap-3 rounded-lg px-3 py-3 text-sm font-medium text-muted-foreground/50 cursor-not-allowed"
                                  onClick={() => toast.info("This feature is disabled for MVP. Core send→claim flow only.")}
                                >
                                  <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-secondary opacity-50">
                                    <item.icon className="h-4 w-4" />
                                  </div>
                                  <div>
                                    <div className="font-medium text-muted-foreground/50">{item.label}</div>
                                    <div className="text-xs text-muted-foreground">{item.desc}</div>
                                  </div>
                                  <AlertCircle className="h-4 w-4 text-muted-foreground/50 ml-auto" />
                                </div>
                              );
                            }
                            return (
                              <Link
                                key={item.to}
                                to={item.to}
                                onClick={() => { setMobileOpen(false); setOrgOpen(false); }}
                                className={`flex items-center gap-3 rounded-lg px-3 py-3 text-sm font-medium transition-colors ${
                                  location.pathname === item.to 
                                    ? "bg-primary/10 text-primary" 
                                    : "text-muted-foreground hover:bg-secondary hover:text-foreground"
                                }`}
                              >
                                <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-secondary">
                                  <item.icon className="h-4 w-4" />
                                </div>
                                <div>
                                  <div className="font-medium text-foreground">{item.label}</div>
                                  <div className="text-xs text-muted-foreground">{item.desc}</div>
                                </div>
                              </Link>
                            );
                          })}
                       </div>
                    </motion.div>
                  )}
                </AnimatePresence>

                {/* Developers Section - Expandable */}
                <button
                  onClick={() => setDevOpen(!devOpen)}
                  className="mt-3 flex items-center justify-between rounded-lg px-3 py-2 text-xs font-semibold uppercase tracking-widest text-muted-foreground"
                >
                  Developers
                  {devOpen ? <ChevronDown className="h-4 w-4 rotate-180" /> : <ChevronDown className="h-4 w-4" />}
                </button>
                <AnimatePresence>
                  {devOpen && (
                    <motion.div
                      initial={{ height: 0, opacity: 0 }}
                      animate={{ height: "auto", opacity: 1 }}
                      exit={{ height: 0, opacity: 0 }}
                      className="overflow-hidden"
                    >
                       <div className="grid grid-cols-1 gap-1 p-1">
                          {devItems.map((item) => {
                            const Icon = item.icon;
                            const disabled = item.disabled;
                            if (disabled) {
                              return (
                                <div
                                  key={item.to}
                                  className="flex items-center gap-3 rounded-lg px-3 py-3 text-sm font-medium text-muted-foreground/50 cursor-not-allowed"
                                  onClick={() => toast.info("This feature is disabled for MVP. Core send→claim flow only.")}
                                >
                                  <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-secondary opacity-50">
                                    <Icon className="h-4 w-4" />
                                  </div>
                                  <div className="flex flex-col">
                                    <div className="flex items-center gap-2">
                                      <span className="font-medium text-muted-foreground/50">{item.label}</span>
                                      <span className="rounded-full bg-secondary px-2 py-0.5 text-[10px] font-medium text-muted-foreground">Disabled</span>
                                    </div>
                                    <div className="text-xs text-muted-foreground">{item.desc}</div>
                                  </div>
                                  <AlertCircle className="h-4 w-4 text-muted-foreground/50 ml-auto" />
                                </div>
                              );
                            }
                            return (
                              <Link
                                key={item.to}
                                to={item.to}
                                onClick={() => { setMobileOpen(false); setDevOpen(false); }}
                                className={`flex items-center gap-3 rounded-lg px-3 py-3 text-sm font-medium transition-colors ${
                                  location.pathname === item.to 
                                    ? "bg-primary/10 text-primary" 
                                    : "text-muted-foreground hover:bg-secondary hover:text-foreground"
                                }`}
                              >
                                <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-secondary">
                                  <Icon className="h-4 w-4" />
                                </div>
                                <div className="flex flex-col">
                                  <div className="flex items-center gap-2">
                                    <span className="font-medium text-foreground">{item.label}</span>
                                  </div>
                                  <div className="text-xs text-muted-foreground">{item.desc}</div>
                                </div>
                              </Link>
                           );
                         })}
                      </div>
                    </motion.div>
                  )}
                </AnimatePresence>

                <Link
                  to="/dashboard"
                  onClick={() => setMobileOpen(false)}
                  className={`mt-3 rounded-lg px-3 py-2.5 text-sm font-medium transition-colors ${location.pathname === "/dashboard" ? "bg-primary/10 text-primary" : "text-muted-foreground hover:bg-secondary hover:text-foreground"}`}
                >
                  Dashboard
                </Link>
              </nav>
              <div className="border-t border-border p-4">
                {isLoggedIn ? (
                  <div className="space-y-3">
                    <p className="text-xs text-muted-foreground">
                      {wallet.address}
                    </p>
                    <button
                      onClick={() => {
                        handleLogout();
                        setMobileOpen(false);
                      }}
                      className="w-full rounded-lg bg-destructive/10 py-2.5 text-sm font-medium text-destructive transition-colors hover:bg-destructive/20"
                    >
                      Sign Out
                    </button>
                  </div>
                ) : (
                  <div className="space-y-2">
                    <button
                      onClick={() => {
                        handleLogin();
                        setMobileOpen(false);
                      }}
                      className="w-full rounded-lg bg-primary py-2.5 text-sm font-semibold text-primary-foreground transition-opacity hover:opacity-90"
                    >
                      Open Account
                    </button>
                    <button
                      onClick={() => {
                        handleLogin();
                        setMobileOpen(false);
                      }}
                      className="w-full rounded-lg border border-border py-2.5 text-sm font-medium text-foreground transition-colors hover:bg-secondary"
                    >
                      Login
                    </button>
                  </div>
                )}
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>
    </>
  );
}
