/// <reference types="vite/client" />

interface ImportMetaEnv {
  readonly VITE_SUPABASE_URL: string;
  readonly VITE_SUPABASE_PUBLISHABLE_KEY: string;
  readonly VITE_PRIVY_APP_ID: string;
  readonly VITE_PRIVY_APP_SECRET: string;
  readonly VITE_APP_URL: string;
  readonly VITE_RPC_URL_POLKADOT: string;
  readonly VITE_RPC_URL_CELO: string;
  readonly VITE_RPC_URL_CELO_MAINNET: string;
  readonly VITE_RPC_URL_BASE_SEPOLIA: string;
  readonly VITE_RPC_URL_BASE: string;
  readonly VITE_RPC_URL_POLYGON: string;
  readonly VITE_ESCROW_CONTRACT_ADDRESS_POLKADOT: string;
  readonly VITE_ESCROW_CONTRACT_ADDRESS_CELO: string;
  readonly VITE_ESCROW_CONTRACT_ADDRESS_CELO_MAINNET: string;
  readonly VITE_ESCROW_CONTRACT_ADDRESS_BASE_SEPOLIA: string;
  readonly VITE_ESCROW_CONTRACT_ADDRESS_BASE: string;
  readonly VITE_ESCROW_CONTRACT_ADDRESS_POLYGON: string;
  readonly VITE_USDC_ADDRESS_POLKADOT: string;
  readonly VITE_USDC_ADDRESS_CELO: string;
  readonly VITE_USDC_ADDRESS_CELO_MAINNET: string;
  readonly VITE_USDC_ADDRESS_BASE_SEPOLIA: string;
  readonly VITE_USDC_ADDRESS_BASE: string;
  readonly VITE_USDC_ADDRESS_POLYGON: string;
  readonly VITE_USDT_ADDRESS_POLKADOT: string;
  readonly VITE_USDT_ADDRESS_CELO: string;
  readonly VITE_USDT_ADDRESS_CELO_MAINNET: string;
  readonly VITE_USDT_ADDRESS_BASE_SEPOLIA: string;
  readonly VITE_USDT_ADDRESS_BASE: string;
  readonly VITE_USDT_ADDRESS_POLYGON: string;
  readonly VITE_GDOLLAR_ADDRESS_BASE_SEPOLIA: string;
  readonly VITE_GDOLLAR_ADDRESS_BASE: string;
  readonly VITE_GDOLLAR_ADDRESS_CELO: string;
  readonly VITE_GDOLLAR_IDENTITY_ADDRESS: string;
  readonly VITE_WHATSAPP_BOT_URL: string;
  readonly VITE_BOT_API_URL: string;
  readonly VITE_ESCROW_CONTRACT_ADDRESS: string;
  readonly VITE_USDC_ADDRESS: string;
  readonly VITE_USDT_ADDRESS: string;
  readonly VITE_GDOLLAR_ADDRESS: string;
  readonly VITE_RPC_URL: string;
}

interface ImportMeta {
  readonly env: ImportMetaEnv;
}
