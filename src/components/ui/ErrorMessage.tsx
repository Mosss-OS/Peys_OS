/** ErrorMessage - Error alert with optional retry and dismiss actions, accepts string or Error object */
import { AlertCircle, RefreshCw, X } from "lucide-react";

interface ErrorMessageProps {
  error: string | Error;
  onRetry?: () => void;
  onDismiss?: () => void;
  className?: string;
}

/**
 * ErrorMessage - Displays an error alert with optional retry and dismiss actions.
 * @param error - Error string or Error object to display
 * @param onRetry - Optional callback for "Try again" button
 * @param onDismiss - Optional callback for dismiss (X) button
 * @param className - Additional CSS classes
 */
export default function ErrorMessage({ error, onRetry, onDismiss, className = "" }: ErrorMessageProps) {
  const errorMessage = typeof error === "string" ? error : error.message;

  return (
    <div className={`rounded-xl border border-destructive/20 bg-destructive/5 p-4 ${className}`}>
      <div className="flex items-start gap-3">
        <AlertCircle className="h-5 w-5 shrink-0 text-destructive" />
        <div className="flex-1 min-w-0">
          <p className="text-sm font-medium text-foreground">Something went wrong</p>
          <p className="mt-1 text-xs text-muted-foreground break-words">
            {errorMessage || "An unexpected error occurred. Please try again."}
          </p>
        </div>
        {onDismiss && (
          <button
            onClick={onDismiss}
            className="shrink-0 text-muted-foreground hover:text-foreground transition-colors"
          >
            <X className="h-4 w-4" />
          </button>
        )}
      </div>
      {onRetry && (
        <button
          onClick={onRetry}
          className="mt-3 flex items-center gap-1.5 text-xs font-medium text-primary hover:text-primary/80 transition-colors"
        >
          <RefreshCw className="h-3.5 w-3.5" />
          Try again
        </button>
      )}
    </div>
  );
}
