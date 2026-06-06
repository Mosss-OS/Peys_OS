/** LoadingSpinner - Animated spinner with optional text and full-screen overlay mode */
import { motion } from "framer-motion";
import { Loader2 } from "lucide-react";

interface LoadingSpinnerProps {
  size?: "sm" | "md" | "lg";
  text?: string;
  fullScreen?: boolean;
}

const sizeClasses = {
  sm: "h-4 w-4",
  md: "h-8 w-8",
  lg: "h-12 w-12",
};

/**
 * LoadingSpinner - Animated loading spinner with configurable size, text, and full-screen mode.
 * @param size - Spinner size: "sm" | "md" | "lg" (default "md")
 * @param text - Optional loading message displayed below the spinner
 * @param fullScreen - Whether to render as a full-screen overlay (default false)
 */
export default function LoadingSpinner({ size = "md", text, fullScreen = false }: LoadingSpinnerProps) {
  const spinner = (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      className="flex flex-col items-center justify-center gap-3"
    >
      <Loader2 className={`${sizeClasses[size]} animate-spin text-primary`} />
      {text && (
        <p className="text-sm text-muted-foreground animate-pulse">{text}</p>
      )}
    </motion.div>
  );

  if (fullScreen) {
    return (
      <div className="fixed inset-0 z-50 flex items-center justify-center bg-background/80 backdrop-blur-sm">
        {spinner}
      </div>
    );
  }

  return spinner;
}
