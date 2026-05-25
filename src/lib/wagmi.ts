import { http, createConfig, fallback } from 'wagmi';
import { base, baseSepolia } from 'wagmi/chains';
import { injected, coinbaseWallet } from 'wagmi/connectors';

const baseSepoliaRpcs = [
  import.meta.env.VITE_RPC_URL_BASE_SEPOLIA || 'https://base-sepolia.g.alchemy.com/v2/demo',
  'https://sepolia.base.org',
  'https://base-sepolia-rpc.publicnode.com',
];

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

export const ESCROW_CONTRACT_ADDRESS = import.meta.env.VITE_ESCROW_CONTRACT_ADDRESS || '0x0000000000000000000000000000000000000001';
export const USDC_ADDRESS = import.meta.env.VITE_USDC_ADDRESS || '0xA0b86991c6218b36c1d19D4a2e9Eb0cE3606eB48';
export const USDT_ADDRESS = import.meta.env.VITE_USDT_ADDRESS || '0xdAC17F958D2ee523a2206206994597C13D831ec7';
