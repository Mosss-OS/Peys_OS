/**
 * Legacy single-chain contract addresses and RPC URL.
 * Prefer chain-specific configuration from lib/chains.ts for new code.
 */

/** Legacy escrow contract address cast to viem Address type. */
export const ESCROW_CONTRACT_ADDRESS = (import.meta.env.VITE_ESCROW_CONTRACT_ADDRESS || '') as `0x${string}`;
/** Legacy USDC token address cast to viem Address type. */
export const USDC_ADDRESS = (import.meta.env.VITE_USDC_ADDRESS || '') as `0x${string}`;
/** Legacy USDT token address cast to viem Address type. */
export const USDT_ADDRESS = (import.meta.env.VITE_USDT_ADDRESS || '') as `0x${string}`;
/** Legacy RPC URL for wallet/contract interactions. */
export const RPC_URL = import.meta.env.VITE_RPC_URL || '';
