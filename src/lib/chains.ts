import type { Address } from "viem";

export interface ChainConfig {
  id: number;
  name: string;
  escrowContract: Address;
  usdcAddress: Address;
  usdtAddress: Address;
  gdAddress: Address;
  identityAddress?: Address;
  passAddress: Address;
  streamingContract?: Address;
  batchPayrollContract?: Address;
  rpcUrl: string;
  blockExplorer?: string;
  nativeSymbol: string;
}

export const chainConfigs: Record<number, ChainConfig> = {
  // Base Sepolia (Testnet)
  84532: {
    id: 84532,
    name: "Base Sepolia Testnet",
    escrowContract: (import.meta.env.VITE_ESCROW_CONTRACT_ADDRESS_BASE_SEPOLIA || "0xb5e4A3130D774A8F3Bc0c081800b304A12a07aD1") as Address,
    usdcAddress: (import.meta.env.VITE_USDC_ADDRESS_BASE_SEPOLIA || "0x036CbD53842c5426634e7929541eC2318f3dCF7e") as Address,
    usdtAddress: (import.meta.env.VITE_USDT_ADDRESS_BASE_SEPOLIA || "") as Address,
    gdAddress: (import.meta.env.VITE_GDOLLAR_ADDRESS_BASE_SEPOLIA || "") as Address,
    passAddress: "" as Address,
    rpcUrl: import.meta.env.VITE_RPC_URL_BASE_SEPOLIA || "https://sepolia.base.org",
    blockExplorer: "https://sepolia.basescan.org",
    nativeSymbol: "ETH",
  },
  // Celo Alfajores (Testnet)
  44787: {
    id: 44787,
    name: "Celo Alfajores Testnet",
    escrowContract: (import.meta.env.VITE_ESCROW_CONTRACT_ADDRESS_CELO || "") as Address,
    usdcAddress: (import.meta.env.VITE_USDC_ADDRESS_CELO || "") as Address,
    usdtAddress: (import.meta.env.VITE_USDT_ADDRESS_CELO || "") as Address,
    gdAddress: (import.meta.env.VITE_GDOLLAR_ADDRESS_CELO || "0x03d3daB843e6c03b3d271eff9178e6A96c28D25f") as Address,
    identityAddress: (import.meta.env.VITE_GDOLLAR_IDENTITY_ADDRESS || "0x6dB189E677EEaB0833C6693DFeaa979e37447eee") as Address,
    passAddress: "" as Address,
    rpcUrl: import.meta.env.VITE_RPC_URL_CELO || "https://alfajores-forno.celo-testnet.org",
    blockExplorer: "https://alfajores.celoscan.io",
    nativeSymbol: "CELO",
  },
};

export function getChainConfig(chainId: number): ChainConfig {
  return chainConfigs[chainId] || chainConfigs[84532];
}

export function getDefaultChainId(): number {
  return 84532; // Base Sepolia Testnet
}
