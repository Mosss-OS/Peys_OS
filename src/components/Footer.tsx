/**
 * Footer - Site-wide footer with logo, social links, and navigation columns
 * for Personal, Organization, Legal, and Developers resources.
 */
import { Link } from "react-router-dom";
import { Github, X, MessageCircle, Code } from "lucide-react";
import { useTheme } from "@/contexts/ThemeContext";

/**
 * Footer - Renders the page footer with branding, social icons, and link groups.
 */
export default function Footer() {
  const { theme } = useTheme();
  
  return (
    <footer className="border-t border-border py-12 pb-24 sm:py-16 xl:pb-16">
      <div className="container mx-auto px-4">
        <div className="flex flex-col gap-10 sm:flex-row sm:justify-between">
          <div className="max-w-xs">
            <div className="flex items-center gap-2">
              <img src={theme === "dark" ? "/peys_black_background.png" : "/peys_logo_alone.png"} alt="Peys" className="h-10 w-10 rounded-lg" />
              <span className="text-base font-semibold text-foreground">Peys</span>
            </div>
            <p className="mt-3 text-xs leading-relaxed text-muted-foreground">
              The stablecoin payment OS.<br />
              Built on Base, Celo & Polygon.
            </p>
            <div className="mt-4 flex gap-3">
              <a href="https://x.com/Peys_io" target="_blank" rel="noopener noreferrer" className="flex h-8 w-8 items-center justify-center rounded-full border border-border text-muted-foreground transition-colors hover:text-foreground hover:bg-secondary">
                <X className="h-3.5 w-3.5" />
              </a>
              <a href="#" className="flex h-8 w-8 items-center justify-center rounded-full border border-border text-muted-foreground transition-colors hover:text-foreground hover:bg-secondary">
                <Github className="h-3.5 w-3.5" />
              </a>
              <a href="#" className="flex h-8 w-8 items-center justify-center rounded-full border border-border text-muted-foreground transition-colors hover:text-foreground hover:bg-secondary">
                <MessageCircle className="h-3.5 w-3.5" />
              </a>
            </div>
          </div>

          <div className="grid grid-cols-3 gap-8 text-xs sm:grid-cols-4">
            <div>
              <p className="mb-3 font-semibold uppercase tracking-widest text-muted-foreground/50">Personal</p>
              <div className="space-y-2.5">
                <Link to="/send" className="block text-muted-foreground transition-colors hover:text-foreground">Send</Link>
                <Link to="/claim/demo" className="block text-muted-foreground transition-colors hover:text-foreground">Claim</Link>
                <Link to="/request" className="block text-muted-foreground transition-colors hover:text-foreground">Request</Link>
                <Link to="/contacts" className="block text-muted-foreground transition-colors hover:text-foreground">Contacts</Link>
              </div>
            </div>
            <div>
              <p className="mb-3 font-semibold uppercase tracking-widest text-muted-foreground/50">Organization</p>
              <div className="space-y-2.5">
                <Link to="/batch" className="block text-muted-foreground transition-colors hover:text-foreground">Batch Payroll</Link>
                <Link to="/streaming" className="block text-muted-foreground transition-colors hover:text-foreground">Streaming</Link>
                <Link to="/analytics" className="block text-muted-foreground transition-colors hover:text-foreground">Analytics</Link>
                <Link to="/dashboard" className="block text-muted-foreground transition-colors hover:text-foreground">Dashboard</Link>
              </div>
            </div>
            <div>
              <p className="mb-3 font-semibold uppercase tracking-widest text-muted-foreground/50">Legal</p>
              <div className="space-y-2.5">
                <Link to="/privacy-policy" className="block text-muted-foreground transition-colors hover:text-foreground">Privacy Policy</Link>
                <Link to="/terms-of-service" className="block text-muted-foreground transition-colors hover:text-foreground">Terms of Service</Link>
                <Link to="/data-deletion" className="block text-muted-foreground transition-colors hover:text-foreground">Data Deletion</Link>
              </div>
            </div>
            <div className="hidden sm:block">
              <p className="mb-3 font-semibold uppercase tracking-widest text-muted-foreground/50">Developers</p>
              <div className="space-y-2.5">
                <Link to="/developers" className="block text-muted-foreground transition-colors hover:text-foreground">REST API</Link>
                <Link to="/docs/sdks/javascript" className="block text-muted-foreground transition-colors hover:text-foreground">SDKs</Link>
                <Link to="/docs/sdks/pricing" className="block text-muted-foreground transition-colors hover:text-foreground">SDK Pricing</Link>
                <Link to="/docs/webhooks" className="block text-muted-foreground transition-colors hover:text-foreground">Webhooks</Link>
                <Link to="/docs/widgets/overview" className="block text-muted-foreground transition-colors hover:text-foreground">Widgets</Link>
              </div>
            </div>
          </div>
        </div>

        <div className="mt-10 border-t border-border pt-6 text-center text-[11px] text-muted-foreground/50">
          © 2025 Peys · Built on Base (Ethereum L2) · Secure stablecoin payments
        </div>
      </div>
    </footer>
  );
}
