/**
 * Footer - Site-wide footer with logo, social links, and navigation columns
 * for Personal, Organization, Legal, and Developers resources.
 */
import { Link } from "react-router-dom";
import { Github, X, MessageCircle, Code, AlertCircle } from "lucide-react";
import { useTheme } from "@/contexts/ThemeContext";
import { isDisabledRoute } from "@/config/coreRoutes";

interface FooterLink {
  to: string;
  label: string;
  disabled?: boolean;
}

const personalLinks: FooterLink[] = [
  { to: "/send", label: "Send", disabled: false },
  { to: "/claim/demo", label: "Claim", disabled: false },
  { to: "/request", label: "Request", disabled: true },
  { to: "/contacts", label: "Contacts", disabled: true },
];

const orgLinks: FooterLink[] = [
  { to: "/batch", label: "Batch Payroll", disabled: true },
  { to: "/streaming", label: "Streaming", disabled: true },
  { to: "/analytics", label: "Analytics", disabled: true },
  { to: "/dashboard", label: "Dashboard", disabled: false },
];

const legalLinks: FooterLink[] = [
  { to: "/privacy-policy", label: "Privacy Policy", disabled: false },
  { to: "/terms-of-service", label: "Terms of Service", disabled: false },
  { to: "/data-deletion", label: "Data Deletion", disabled: false },
];

const devLinks: FooterLink[] = [
  { to: "/developers", label: "REST API", disabled: false },
  { to: "/docs/sdks/javascript", label: "SDKs", disabled: false },
  { to: "/docs/sdks/pricing", label: "SDK Pricing", disabled: true },
  { to: "/docs/webhooks", label: "Webhooks", disabled: true },
  { to: "/docs/widgets/overview", label: "Widgets", disabled: true },
];

function FooterLinkItem({ link }: { link: FooterLink }) {
  const disabled = link.disabled;
  if (disabled) {
    return (
      <div className="flex items-center gap-1.5 text-muted-foreground/50 cursor-not-allowed">
        <AlertCircle className="h-3 w-3" />
        <span>{link.label}</span>
        <span className="rounded-full bg-secondary px-1.5 py-0.5 text-[9px] font-medium text-muted-foreground">Disabled</span>
      </div>
    );
  }
  return (
    <Link to={link.to} className="block text-muted-foreground transition-colors hover:text-foreground">{link.label}</Link>
  );
}

/**
 * Footer - Renders the page footer with branding, social icons, and link groups.
 */
export default function Footer() {
  const { theme } = useTheme();
  const logoSrc = theme === "light"
    ? "https://res.cloudinary.com/dv0tt80vn/image/upload/v1780854543/peys_white_cropped.png"
    : "https://res.cloudinary.com/dv0tt80vn/image/upload/v1780783511/peys_logo_white_cropped.png";
  
  return (
    <footer className="hidden lg:block border-t border-border py-12 pb-24 sm:py-16 xl:pb-16">
      <div className="container mx-auto px-4">
        <div className="flex flex-col gap-10 sm:flex-row sm:justify-between">
          <div className="max-w-xs">
            <div className="flex items-center gap-2">
              <img src={logoSrc} alt="Peys" className="h-10 w-10 rounded-lg" />
              <span className="text-base font-semibold text-foreground">Peys</span>
            </div>
            <p className="mt-3 text-xs leading-relaxed text-muted-foreground">
              The G$ stablecoin payment OS.<br />
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
                {personalLinks.map((link) => <FooterLinkItem key={link.to} link={link} />)}
              </div>
            </div>
            <div>
              <p className="mb-3 font-semibold uppercase tracking-widest text-muted-foreground/50">Organization</p>
              <div className="space-y-2.5">
                {orgLinks.map((link) => <FooterLinkItem key={link.to} link={link} />)}
              </div>
            </div>
            <div>
              <p className="mb-3 font-semibold uppercase tracking-widest text-muted-foreground/50">Legal</p>
              <div className="space-y-2.5">
                {legalLinks.map((link) => <FooterLinkItem key={link.to} link={link} />)}
              </div>
            </div>
            <div className="hidden sm:block">
              <p className="mb-3 font-semibold uppercase tracking-widest text-muted-foreground/50">Developers</p>
              <div className="space-y-2.5">
                {devLinks.map((link) => <FooterLinkItem key={link.to} link={link} />)}
              </div>
            </div>
          </div>
        </div>

        <div className="mt-10 border-t border-border pt-6 text-center text-[11px] text-muted-foreground/50">
          © 2025 Peys · Built on Base, Celo & Polygon · Secure G$ stablecoin payments
        </div>
      </div>
    </footer>
  );
}
