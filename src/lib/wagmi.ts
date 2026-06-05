import { http, createConfig, fallback } from 'wagmi';
import { base, baseSepolia } from 'wagmi/chains';
import { injected, coinbaseWallet } from 'wagmi/connectors';

const baseSepoliaRpcs = [
  import.meta.env.VITE_RPC_URL_BASE_SEPOLIA || '',
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

export const ESCROW_CONTRACT_ADDRESS = import.meta.env.VITE_ESCROW_CONTRACT_ADDRESS || '';
export const USDC_ADDRESS = import.meta.env.VITE_USDC_ADDRESS || '';
export const USDT_ADDRESS = import.meta.env.VITE_USDT_ADDRESS || '';
