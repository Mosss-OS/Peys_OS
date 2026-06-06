import { http, createConfig, fallback } from 'wagmi';
import { base, baseSepolia } from 'wagmi/chains';
import { injected, coinbaseWallet } from 'wagmi/connectors';

/**
 * Wagmi configuration for blockchain wallet connections.
 * Supports Base Sepolia (testnet) and Base mainnet with fallback RPC URLs.
 */

/** Fallback RPC endpoints for Base Sepolia used to improve reliability. */
const baseSepoliaRpcs = [
  import.meta.env.VITE_RPC_URL_BASE_SEPOLIA || '',
  'https://sepolia.base.org',
  'https://base-sepolia-rpc.publicnode.com',
];

/** Wagmi configuration with injected and Coinbase Wallet connectors, plus fallback transport for Base Sepolia. */
export const config = createConfig({
  chains: [baseSepolia, base],
  connectors: [
    injected(),
    coinbaseWallet(),
  ],
  transports: {
    [baseSepolia.id]: fallback(baseSepoliaRpcs.map(rpc => http(rpc)), { rank: true }),
    [base.id]: http(import.meta.env.VITE_RPC_URL_BASE || 'https://mainnet.base.org'),
  },
});

/** Legacy single-chain escrow contract address (prefer chain-specific config from lib/chains.ts). */
export const ESCROW_CONTRACT_ADDRESS = import.meta.env.VITE_ESCROW_CONTRACT_ADDRESS || '';
/** Legacy single-chain USDC address (prefer chain-specific config from lib/chains.ts). */
export const USDC_ADDRESS = import.meta.env.VITE_USDC_ADDRESS || '';
/** Legacy single-chain USDT address (prefer chain-specific config from lib/chains.ts). */
export const USDT_ADDRESS = import.meta.env.VITE_USDT_ADDRESS || '';
