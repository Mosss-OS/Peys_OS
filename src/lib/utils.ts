import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";

/**
 * Utility helpers shared across the app.
 */

/** Merges Tailwind CSS class names with proper precedence using tailwind-merge and clsx. */
export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}
