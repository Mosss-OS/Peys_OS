import type { Address } from "viem";
import { ESCROW_ABI as CORRECT_ESCROW_ABI, ERC20_ABI } from "@/lib/abis";

// Re-export the correct ABIs from lib/abis.ts to avoid duplication
export { ERC20_ABI };
export const ESCROW_ABI = CORRECT_ESCROW_ABI;

// NOTE: These addresses are now deprecated. Use chain-specific addresses from src/lib/chains.ts instead.
// These fallback values are kept for backward compatibility but should not be used in new code.
export const ESCROW_CONTRACT_ADDRESS: Address = (import.meta.env.VITE_ESCROW_CONTRACT_ADDRESS || "0x0000000000000000000000000000000000000001") as Address;
export const USDC_ADDRESS: Address = (import.meta.env.VITE_USDC_ADDRESS || "0x0000000000000000000000000000000000000001") as Address;
export const USDT_ADDRESS: Address = (import.meta.env.VITE_USDT_ADDRESS || "0x0000000000000000000000000000000000000001") as Address;
export const GDOLLAR_ADDRESS: Address = (import.meta.env.VITE_GDOLLAR_ADDRESS || "0x0000000000000000000000000000000000000001") as Address;
export const RPC_URL = import.meta.env.VITE_RPC_URL_BASE_SEPOLIA || "https://sepolia.base.org";

// G$ / USD price (approximate market price)
// G$ trades at ~$0.000113 on Celo (Ubeswap V2) as of June 2024
// This should be replaced with a price oracle in production
export const GD_PRICE_IN_USD = 0.000113;
