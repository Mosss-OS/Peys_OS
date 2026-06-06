/**
 * Input sanitization utilities to prevent XSS and ensure data integrity.
 */

/** Truncates and trims a string to a maximum length (default 255 chars). Returns empty string on invalid input. */
export function sanitizeString(input: string, maxLength: number = 255): string {
  if (!input || typeof input !== "string") return "";
  return input.slice(0, maxLength).trim();
}

/** Validates and sanitizes an email address. Returns the normalized email or empty string if invalid. */
export function sanitizeEmail(input: string): string {
  if (!input || typeof input !== "string") return "";
  const sanitized = input.trim().toLowerCase();
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return emailRegex.test(sanitized) ? sanitized : "";
}

/** Strips non-digit characters and validates a phone number (10-15 digits, optional leading +). */
export function sanitizePhone(input: string): string {
  if (!input || typeof input !== "string") return "";
  const cleaned = input.replace(/\D/g, "");
  const phoneRegex = /^\+?\d{10,15}$/;
  return phoneRegex.test(cleaned) ? cleaned : "";
}

/** Cleans and validates a WhatsApp number. Returns the sanitized number or empty string if invalid. */
export function sanitizeWhatsAppNumber(input: string): string {
  if (!input || typeof input !== "string") return "";
  const cleaned = input.replace(/[\s\-\(\)]/g, "").replace(/\D/g, "");
  const whatsappRegex = /^\+?(\d{1,3})?(\d{9,15})$/;
  if (!whatsappRegex.test(cleaned)) return "";
  const startsWithCountryCode = cleaned.startsWith("+") || cleaned.length > 12;
  if (!startsWithCountryCode && cleaned.length >= 10) {
    return cleaned;
  }
  return whatsappRegex.test(cleaned) ? cleaned : "";
}

/** Removes non-numeric characters (except '.') from an amount string and validates it as a non-negative number. */
export function sanitizeAmount(input: string): string {
  if (!input || typeof input !== "string") return "0";
  const sanitized = input.replace(/[^0-9.]/g, "");
  const num = parseFloat(sanitized);
  return isNaN(num) || num < 0 ? "0" : sanitized;
}

/** Sanitizes a URL parameter by stripping HTML tags, script protocols, and dangerous characters. */
export function sanitizeUrlParam(input: string | null): string {
  if (!input) return "";
  return sanitizeString(input, 500)
    .replace(/[<>'";&]/g, "") // Strip HTML special chars to prevent XSS
    .replace(/javascript:/gi, "") // Block javascript: protocol injection
    .replace(/data:/gi, ""); // Block data: protocol injection
}
