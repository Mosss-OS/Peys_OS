import type { Address } from "viem";
import { ESCROW_ABI as CORRECT_ESCROW_ABI, ERC20_ABI } from "@/lib/abis";

/**
 * Blockchain constants including contract ABIs, legacy addresses, and pricing.
 *
 * NOTE: Contract addresses here are deprecated — use chain-specific config from lib/chains.ts.
 */

// Re-export the correct ABIs from lib/abis.ts to avoid duplication
export { ERC20_ABI };
/** Re-exported escrow ABI from lib/abis.ts (avoids duplication). */
export const ESCROW_ABI = CORRECT_ESCROW_ABI;

// NOTE: These addresses are now deprecated. Use chain-specific addresses from src/lib/chains.ts instead.
// These fallback values are kept for backward compatibility but should not be used in new code.
/** Deprecated — use getChainConfig(chainId).escrowContract instead. */
export const ESCROW_CONTRACT_ADDRESS: Address = (import.meta.env.VITE_ESCROW_CONTRACT_ADDRESS || "") as Address;
/** Deprecated — use getChainConfig(chainId).usdcAddress instead. */
export const USDC_ADDRESS: Address = (import.meta.env.VITE_USDC_ADDRESS || "") as Address;
/** Deprecated — use getChainConfig(chainId).usdtAddress instead. */
export const USDT_ADDRESS: Address = (import.meta.env.VITE_USDT_ADDRESS || "") as Address;
/** Deprecated — use getChainConfig(chainId).gdAddress instead. */
export const GDOLLAR_ADDRESS: Address = (import.meta.env.VITE_GDOLLAR_ADDRESS || "") as Address;
/** Legacy default RPC URL (Base Sepolia). */
export const RPC_URL = import.meta.env.VITE_RPC_URL_BASE_SEPOLIA || "https://sepolia.base.org";

// G$ / USD price (approximate market price)
// G$ trades at ~$0.000113 on Celo (Ubeswap V2) as of June 2024
// This should be replaced with a price oracle in production
/** Approximate market price of G$ token in USD. Should be replaced with a price oracle in production. */
export const GD_PRICE_IN_USD = 0.000113;
