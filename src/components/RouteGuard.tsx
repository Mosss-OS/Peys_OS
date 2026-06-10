import { useLocation, Navigate } from "react-router-dom";
import { Link } from "react-router-dom";
import { AlertCircle, ArrowLeft, Home } from "lucide-react";
import { motion } from "framer-motion";
import { isDisabledRoute, getDisabledRouteInfo } from "@/config/coreRoutes";
import { toast } from "sonner";

/**
 * RouteGuard - Protects disabled routes by showing a "Feature Disabled" page.
 * Only allows access to core routes for the MVP.
 */
interface RouteGuardProps {
  children: React.ReactNode;
}

export function RouteGuard({ children }: RouteGuardProps) {
  const location = useLocation();
  const isDisabled = isDisabledRoute(location.pathname);
  const disabledInfo = getDisabledRouteInfo(location.pathname);

  if (isDisabled) {
    const category = disabledInfo?.category || "unknown";
    
    return (
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.3 }}
        className="min-h-screen bg-background flex items-center justify-center px-4"
      >
        <div className="max-w-md w-full text-center">
          <div className="mb-6 flex h-16 w-16 items-center justify-center rounded-full bg-destructive/10 mx-auto">
            <AlertCircle className="h-8 w-8 text-destructive" />
          </div>
          <h1 className="mb-3 font-display text-2xl text-foreground">Feature Disabled for MVP</h1>
          <p className="mb-4 text-sm text-muted-foreground">
            This feature (<code className="bg-secondary px-1.5 py-0.5 rounded text-xs">{location.pathname}</code>) is part of the <strong>{category}</strong> category and has been disabled for the MVP.
          </p>
          <p className="mb-6 text-sm text-muted-foreground">
            The current build focuses on the core <strong>send → claim</strong> flow with G$ integration (Tip Jar, Identity, GoodCollective).
          </p>
          <div className="flex gap-3 justify-center">
            <Link
              to="/"
              className="flex items-center gap-2 rounded-lg bg-primary px-6 py-2.5 text-sm font-semibold text-primary-foreground shadow-glow hover:opacity-90"
            >
              <Home className="h-4 w-4" />
              Go to Home
            </Link>
            <button
              onClick={() => {
                toast.info("Core features: Send, Claim, Tip Jar, Collective, Dashboard, API Keys, Docs");
              }}
              className="flex items-center gap-2 rounded-lg border border-border px-6 py-2.5 text-sm font-medium text-foreground hover:bg-secondary"
            >
              <ArrowLeft className="h-4 w-4" />
              Core Features
            </button>
          </div>
        </div>
      </motion.div>
    );
  }

  return <>{children}</>;
}