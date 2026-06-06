/**
 * DocsLayout - Two-column (desktop) / single-column (mobile) layout for
 * developer documentation. Includes a collapsible sidebar nav, table of
 * contents with active heading tracking, and a progress indicator.
 */
import { useState, useEffect } from "react";
import { Link, useLocation } from "react-router-dom";
import { motion } from "framer-motion";
import { Menu, X, ChevronRight, ChevronDown, ArrowLeft, Circle } from "lucide-react";
import AppHeader from "@/components/AppHeader";

const navItems = [
  { 
    section: "Documentation", 
    items: [
      { to: "/docs", label: "Overview", desc: "Full developer docs" },
    ]
  },
  { 
    section: "Getting Started", 
    items: [
      { to: "/docs/quickstart", label: "Quick Start", desc: "Get started in 5 min" },
      { to: "/docs/installation", label: "Installation", desc: "Setup the SDK" },
    ]
  },
  { 
    section: "Products", 
    items: [
      { to: "/docs/payments", label: "Magic Claim Links", desc: "Send payments via email" },
      { to: "/docs/claims", label: "Payment Claims", desc: "Claim flow" },
      { to: "/docs/webhooks", label: "Webhooks", desc: "Event notifications" },
    ]
  },
  { 
    section: "API Reference", 
    items: [
      { to: "/docs/api/authentication", label: "Authentication", desc: "API keys" },
      { to: "/docs/api/payments", label: "Payments API", desc: "Endpoints" },
      { to: "/docs/api/webhooks-api", label: "Webhooks API", desc: "Configure webhooks" },
      { to: "/docs/api/errors", label: "Errors & Limits", desc: "Error codes" },
    ]
  },
  { 
    section: "SDKs", 
    items: [
      { to: "/docs/sdks/javascript", label: "JavaScript SDK", desc: "JS & TypeScript" },
      { to: "/docs/sdks/python", label: "Python SDK", desc: "Python library" },
      { to: "/docs/sdks/go", label: "Go SDK", desc: "Go client" },
    ]
  },
  { 
    section: "UI Components", 
    items: [
      { to: "/docs/widgets/overview", label: "Overview", desc: "Embed payments" },
      { to: "/docs/widgets/pay-button", label: "Pay Button", desc: "Simple button" },
      { to: "/docs/widgets/payment-form", label: "Payment Form", desc: "Full form" },
    ]
  },
  { 
    section: "Resources", 
    items: [
      { to: "/docs/sdks/pricing", label: "Pricing", desc: "Plans and billing" },
      { to: "/docs/smart-contracts", label: "Smart Contracts", desc: "Advanced contracts" },
    ]
  },
];

const pageHeadings: Record<string, { id: string; label: string }[]> = {
  "/docs": [
    { id: "getting-started", label: "Getting Started" },
    { id: "products", label: "Products" },
    { id: "use-cases", label: "Popular Use Cases" },
    { id: "networks", label: "Supported Networks" },
  ],
  "/docs/quickstart": [
    { id: "step-1-install", label: "Step 1: Install the SDK" },
    { id: "step-2-initialize", label: "Step 2: Initialize the Client" },
    { id: "step-3-create", label: "Step 3: Create a Payment" },
    { id: "step-4-webhooks", label: "Step 4: Handle Webhooks" },
    { id: "step-5-verify", label: "Step 5: Verify Payment Status" },
  ],
  "/docs/installation": [
    { id: "requirements", label: "Requirements" },
    { id: "install-sdk", label: "Install the SDK" },
    { id: "environment-variables", label: "Environment Variables" },
    { id: "typescript", label: "TypeScript Support" },
    { id: "browser-vs-node", label: "Browser vs Node.js" },
    { id: "verify", label: "Verify Installation" },
  ],
  "/docs/payments": [
    { id: "overview", label: "Overview" },
    { id: "create-payment", label: "Create a Payment" },
    { id: "statuses", label: "Payment Statuses" },
    { id: "get-payment", label: "Get Payment Details" },
    { id: "list-payments", label: "List Payments" },
    { id: "cancel", label: "Cancel a Payment" },
    { id: "request", label: "Request Payment" },
  ],
  "/docs/claims": [
    { id: "overview", label: "Overview" },
    { id: "claim-flow", label: "Claim Flow" },
    { id: "claim-api", label: "Claim via API" },
    { id: "check-status", label: "Check Claim Status" },
    { id: "statuses", label: "Claim Statuses" },
  ],
  "/docs/webhooks": [
    { id: "overview", label: "Overview" },
    { id: "event-types", label: "Event Types" },
    { id: "setup", label: "Setting Up Webhooks" },
    { id: "verify", label: "Verifying Webhook Signatures" },
    { id: "payload", label: "Webhook Payload" },
    { id: "retry", label: "Retry Policy" },
  ],
  "/docs/api/authentication": [
    { id: "api-keys", label: "API Keys" },
    { id: "using-keys", label: "Using API Keys" },
    { id: "key-types", label: "Key Types" },
    { id: "security", label: "Security Best Practices" },
    { id: "rate-limiting", label: "Rate Limiting" },
  ],
  "/docs/api/payments": [
    { id: "base-url", label: "Base URL" },
    { id: "create-payment", label: "Create Payment" },
    { id: "get-payment", label: "Get Payment" },
    { id: "list-payments", label: "List Payments" },
    { id: "cancel-payment", label: "Cancel Payment" },
    { id: "claim-payment", label: "Claim Payment" },
  ],
  "/docs/sdks/javascript": [
    { id: "installation", label: "Installation" },
    { id: "initialization", label: "Initialization" },
    { id: "payments-api", label: "Payments API" },
    { id: "webhooks-api", label: "Webhooks API" },
    { id: "typescript", label: "TypeScript Types" },
    { id: "error-handling", label: "Error Handling" },
  ],
  "/docs/sdks/python": [
    { id: "installation", label: "Installation" },
    { id: "initialization", label: "Initialization" },
    { id: "usage", label: "Usage Examples" },
    { id: "async", label: "Async Support" },
  ],
  "/docs/sdks/go": [
    { id: "installation", label: "Installation" },
    { id: "initialization", label: "Initialization" },
    { id: "usage", label: "Usage Examples" },
    { id: "error-handling", label: "Error Handling" },
  ],
  "/docs/sdks/pricing": [
    { id: "overview", label: "Overview" },
    { id: "supported-sdks", label: "Supported SDKs" },
    { id: "pricing-plans", label: "Pricing Plans" },
    { id: "performance", label: "SDK Performance" },
    { id: "features", label: "Feature Comparison" },
    { id: "faq", label: "FAQ" },
  ],
  "/docs/widgets/overview": [
    { id: "overview", label: "Overview" },
    { id: "available-widgets", label: "Available Widgets" },
    { id: "installation", label: "Installation" },
    { id: "quick-example", label: "Quick Example" },
    { id: "features", label: "Features" },
    { id: "browser-support", label: "Browser Support" },
  ],
  "/docs/widgets/pay-button": [
    { id: "quick-start", label: "Quick Start" },
    { id: "attributes", label: "Attributes" },
    { id: "full-example", label: "Full Example" },
    { id: "callbacks", label: "Callbacks" },
    { id: "programmatic", label: "Programmatic Usage" },
  ],
  "/docs/widgets/payment-form": [
    { id: "overview", label: "Overview" },
    { id: "quick-start", label: "Quick Start" },
    { id: "attributes", label: "Attributes" },
    { id: "full-example", label: "Full Example" },
    { id: "events", label: "Events" },
    { id: "styling", label: "Styling" },
  ],
};

/**
 * useActiveHeading - Tracks which section heading is currently visible
 * in the viewport using IntersectionObserver.
 * @param headings - Array of { id, label } heading objects to observe.
 * @returns The id of the currently active (most top-visible) heading.
 */
function useActiveHeading(headings: { id: string; label: string }[]) {
  const [activeId, setActiveId] = useState<string>("");

  useEffect(() => {
    if (headings.length === 0) return;

    const observer = new IntersectionObserver(
      (entries) => {
        const intersecting = entries.filter((entry) => entry.isIntersecting);
        if (intersecting.length > 0) {
          const sorted = intersecting.sort((a, b) => {
            const rectA = a.boundingClientRect;
            const rectB = b.boundingClientRect;
            return rectA.top - rectB.top;
          });
          setActiveId(sorted[0].target.id);
        }
      },
      { rootMargin: "-80px 0px -80% 0px", threshold: 0 }
    );

    headings.forEach((heading) => {
      const element = document.getElementById(heading.id);
      if (element) observer.observe(element);
    });

    return () => observer.disconnect();
  }, [headings]);

  return activeId;
}

/**
 * Sidebar - Navigation sidebar listing documentation sections with
 * expandable/collapsible groups and active-page highlighting.
 * @param props.onClose - Callback to close the sidebar (used on mobile).
 */
function Sidebar({ onClose }: { onClose?: () => void }) {
  const location = useLocation();
  const [expandedSections, setExpandedSections] = useState<Record<string, boolean>>(() => {
    // Expand all sections by default, but collapse based on current page
    const expanded: Record<string, boolean> = {};
    navItems.forEach((section) => {
      const isCurrentSection = section.items.some(item => location.pathname === item.to);
      expanded[section.section] = !isCurrentSection;
    });
    return expanded;
  });

  /**
   * toggleSection - Expands or collapses a sidebar section.
   * @param section - The section name key.
   */
  const toggleSection = (section: string) => {
    setExpandedSections(prev => ({
      ...prev,
      [section]: !prev[section]
    }));
  };

  return (
    <nav className="p-4 space-y-1">
      <Link
        to="/developers"
        className="flex items-center gap-1 text-xs text-muted-foreground hover:text-foreground mb-4"
      >
        <ArrowLeft className="h-3 w-3" /> Back to Developers
      </Link>
      
      {navItems.map((section) => (
        <div key={section.section} className="mb-2">
          <button
            onClick={() => toggleSection(section.section)}
            className="flex items-center justify-between w-full px-3 py-1.5 text-[10px] font-semibold uppercase tracking-wider text-muted-foreground hover:text-foreground"
          >
            {section.section}
            {expandedSections[section.section] ? (
              <ChevronDown className="h-3 w-3" />
            ) : (
              <ChevronRight className="h-3 w-3" />
            )}
          </button>
          
          {expandedSections[section.section] && (
            <ul className="mt-1 space-y-px">
              {section.items.map((item) => (
                <li key={item.to}>
                  <Link
                    to={item.to}
                    onClick={onClose}
                    className={`flex flex-col rounded-md px-3 py-1.5 text-xs transition-colors ${
                      location.pathname === item.to
                        ? "bg-primary/10 text-primary font-medium"
                        : "text-muted-foreground hover:bg-secondary hover:text-foreground"
                    }`}
                  >
                    <span className="font-medium text-[13px]">{item.label}</span>
                    <span className="text-[11px] opacity-60">{item.desc}</span>
                  </Link>
                </li>
              ))}
            </ul>
          )}
        </div>
      ))}
    </nav>
  );
}

/**
 * DocsLayout - Renders the full documentation page shell: AppHeader, left
 * sidebar nav, main content area, and right "On This Page" table of contents
 * with scroll-spy and progress bar.
 * @param props.children - The page content rendered in the main area.
 */
export default function DocsLayout({ children }: { children: React.ReactNode }) {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const location = useLocation();
  
  const currentHeadings = pageHeadings[location.pathname] || [];
  const activeHeading = useActiveHeading(currentHeadings);

  /**
   * scrollToHeading - Smooth-scrolls the page to the element with the given id.
   * @param id - The DOM element id to scroll to.
   */
  const scrollToHeading = (id: string) => {
    const element = document.getElementById(id);
    if (element) {
      element.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }
  };

  return (
    <div className="min-h-screen bg-background">
      <AppHeader />
      
      <div className="flex pt-16">
        {/* Mobile sidebar toggle */}
        <button
          onClick={() => setSidebarOpen(!sidebarOpen)}
          className="fixed bottom-4 right-4 z-50 lg:hidden rounded-full bg-primary p-3 shadow-lg"
        >
          {sidebarOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
        </button>

        {/* Left Sidebar - Always visible on desktop */}
        <aside className="hidden lg:block sticky top-16 left-0 z-30 h-[calc(100vh-4rem)] w-72 shrink-0 overflow-y-auto border-r border-border bg-card">
          <Sidebar />
        </aside>

        {/* Mobile Sidebar - Overlay */}
        {sidebarOpen && (
          <div className="fixed inset-0 z-40 lg:hidden">
            <div 
              className="absolute inset-0 bg-background/80 backdrop-blur-sm"
              onClick={() => setSidebarOpen(false)}
            />
            <aside className="absolute left-0 top-0 h-full w-72 bg-card border-r border-border shadow-xl">
              <Sidebar onClose={() => setSidebarOpen(false)} />
            </aside>
          </div>
        )}

        {/* Main content */}
        <main className="flex-1 min-w-0">
          <div className="container mx-auto max-w-5xl px-4 py-8 lg:px-8">
            {children}
          </div>
        </main>

        {/* Right Sidebar - Table of Contents */}
        {currentHeadings.length > 0 && (
          <aside className="hidden xl:block sticky top-16 h-[calc(100vh-4rem)] w-64 shrink-0 overflow-y-auto border-l border-border bg-card/30">
            <div className="p-4">
              <h4 className="mb-3 text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                On This Page
              </h4>
              <nav className="space-y-1">
                {currentHeadings.map((heading) => (
                  <button
                    key={heading.id}
                    onClick={() => scrollToHeading(heading.id)}
                    className={`block w-full text-left text-sm py-1.5 px-3 rounded transition-colors ${
                      activeHeading === heading.id
                        ? "text-primary font-medium bg-primary/5"
                        : "text-muted-foreground hover:text-foreground hover:bg-secondary/50"
                    }`}
                  >
                    {heading.label}
                  </button>
                ))}
              </nav>
              
              {/* Progress indicator */}
              <div className="mt-6 pt-4 border-t border-border">
                {activeHeading ? (
                  <>
                    <div className="flex items-center gap-2 text-xs text-muted-foreground">
                      <Circle className="h-2 w-2 fill-current text-green-500" />
                      <span>{currentHeadings.findIndex(h => h.id === activeHeading) + 1} of {currentHeadings.length}</span>
                    </div>
                    <div className="mt-2 h-1.5 rounded-full bg-secondary overflow-hidden">
                      <div 
                        className="h-full bg-primary rounded-full transition-all duration-300"
                        style={{ width: `${((currentHeadings.findIndex(h => h.id === activeHeading) + 1) / currentHeadings.length) * 100}%` }}
                      />
                    </div>
                  </>
                ) : (
                  <div className="flex items-center gap-2 text-xs text-muted-foreground">
                    <Circle className="h-2 w-2 fill-current text-muted-foreground" />
                    <span>0 of {currentHeadings.length}</span>
                  </div>
                )}
              </div>
            </div>
          </aside>
        )}
      </div>
    </div>
  );
}
