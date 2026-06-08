/**
 * Maps blockchain/provider errors to user-friendly messages with retry guidance.
 */

interface ParsedError {
  message: string;
  canRetry: boolean;
  action?: "switch_network" | "fund_wallet" | "approve_token";
}

const COMMON_ERRORS: [RegExp, ParsedError][] = [
  [/user rejected|cancelled|rejected|not signed/i, {
    message: "Transaction was cancelled. You can try again when ready.",
    canRetry: true,
  }],
  [/nonce|Nonce too low/i, {
    message: "Nonce conflict — a pending transaction is stuck. Open your wallet, cancel or speed it up, then retry.",
    canRetry: true,
  }],
  [/insufficient funds|out of gas|gas required exceeds/i, {
    message: "Insufficient funds for gas. Add native token (ETH/CELO) to your wallet.",
    canRetry: false,
  }],
  [/execution reverted|reverted/i, {
    message: "Transaction reverted by the contract. The operation may not be valid.",
    canRetry: false,
  }],
  [/wallet_switchEthereumChain|chain.*not.*added/i, {
    message: "This network is not in your wallet. Please add it manually.",
    canRetry: true,
    action: "switch_network",
  }],
  [/already claimed|PaymentNotFound|InvalidClaimHash/i, {
    message: "This payment has already been claimed or is invalid.",
    canRetry: false,
  }],
  [/rate limit|429|too many requests/i, {
    message: "Rate limited by the network. Please wait a moment and try again.",
    canRetry: true,
  }],
  [/timeout|TIMEOUT|fetch failed|network error/i, {
    message: "Network connection issue. Check your internet and try again.",
    canRetry: true,
  }],
  [/403.*forbidden|forbidden/i, {
    message: "Access denied. Your IP or request may be blocked.",
    canRetry: false,
  }],
];

export function parseTxError(err: unknown): ParsedError {
  const msg = (err instanceof Error ? err.message : String(err || "")).trim();
  if (!msg) return { message: "An unknown error occurred.", canRetry: true };

  for (const [pattern, parsed] of COMMON_ERRORS) {
    if (pattern.test(msg)) return parsed;
  }

  return { message: msg.length > 200 ? msg.slice(0, 200) + "…" : msg, canRetry: true };
}
