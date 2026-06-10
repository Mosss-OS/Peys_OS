const PRIVATE_IP_RANGES = [
  /^127\./,
  /^10\./,
  /^172\.(1[6-9]|2[0-9]|3[0-1])\./,
  /^192\.168\./,
  /^169\.254\./,
  /^0\./,
  /^::1$/,
  /^fc00:/i,
  /^fe80:/i,
];

const BLOCKED_HOSTS = [
  "localhost",
  "localhost.localdomain",
  "metadata.google.internal",
  "metadata.google",
  "169.254.169.254",
  "metadata.aws.internal",
  "kubernetes.default.svc",
];

export function isUrlSafe(urlString: string): { valid: boolean; error?: string } {
  try {
    const url = new URL(urlString);

    if (!["http:", "https:"].includes(url.protocol)) {
      return { valid: false, error: "Only HTTP and HTTPS protocols allowed" };
    }

    const hostname = url.hostname.toLowerCase();

    if (BLOCKED_HOSTS.includes(hostname)) {
      return { valid: false, error: "This URL is not allowed" };
    }

    for (const pattern of PRIVATE_IP_RANGES) {
      if (pattern.test(hostname)) {
        return { valid: false, error: "Private IP addresses are not allowed" };
      }
    }

    const ipRegex = /^(\d{1,3}\.){3}\d{1,3}$/;
    if (ipRegex.test(hostname)) {
      const parts = hostname.split(".").map(Number);
      if (parts[0] === 0 || parts[0] === 255) {
        return { valid: false, error: "Invalid IP address range" };
      }
    }

    return { valid: true };
  } catch {
    return { valid: false, error: "Invalid URL format" };
  }
}
