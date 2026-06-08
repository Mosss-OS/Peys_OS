import type { Address } from "viem";

/**
 * Per-chain configuration for the escrow contract, token addresses, and RPC endpoints.
 */

/** Configuration required to interact with a single blockchain network. */
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

/** Map of chain IDs to their full configuration objects. Falls back to environment variables or hardcoded defaults. */
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
    escrowContract: (import.meta.env.VITE_ESCROW_CONTRACT_ADDRESS_CELO || "0x0b4e459faa79a52a28e9776bc5a0402fc0328544480b4ca4257f7f10973e5562") as Address,
    usdcAddress: (import.meta.env.VITE_USDC_ADDRESS_CELO || "0x2F25deB3848C207fc8E0c34035B3Ba7fC157602B") as Address,
    usdtAddress: (import.meta.env.VITE_USDT_ADDRESS_CELO || "") as Address,
    gdAddress: (import.meta.env.VITE_GDOLLAR_ADDRESS_CELO || "0x03d3daB843e6c03b3d271eff9178e6A96c28D25f") as Address,
    identityAddress: (import.meta.env.VITE_GDOLLAR_IDENTITY_ADDRESS || "0x6dB189E677EEaB0833C6693DFeaa979e37447eee") as Address,
    passAddress: "" as Address,
    rpcUrl: import.meta.env.VITE_RPC_URL_CELO || "https://alfajores-forno.celo-testnet.org",
    blockExplorer: "https://alfajores.celoscan.io",
    nativeSymbol: "CELO",
  },
  // Celo Mainnet
  42220: {
    id: 42220,
    name: "Celo Mainnet",
    escrowContract: (import.meta.env.VITE_ESCROW_CONTRACT_ADDRESS_CELO_MAINNET || "0x9F50a6a0464C590d6ED48AEc36690Efd3752F5E1") as Address,
    usdcAddress: (import.meta.env.VITE_USDC_ADDRESS_CELO_MAINNET || "0xcebA9300f2b948710d2653dD7f07b3Ff9F7fA88") as Address,
    usdtAddress: (import.meta.env.VITE_USDT_ADDRESS_CELO_MAINNET || "") as Address,
    gdAddress: (import.meta.env.VITE_GDOLLAR_ADDRESS_CELO_MAINNET || "0x62B8B11039FcfE5aB0C56E502b1C372A3d2a9c7A") as Address,
    identityAddress: "" as Address,
    passAddress: "" as Address,
    rpcUrl: import.meta.env.VITE_RPC_URL_CELO_MAINNET || "https://celo-mainnet.g.alchemy.com/v2/7sXxdzivaO6JR4KsfNEqI",
    blockExplorer: "https://celoscan.io",
    nativeSymbol: "CELO",
  },
};

/** Returns the configuration for a given chain ID, falling back to Base Sepolia if the chain is not configured. */
export function getChainConfig(chainId: number): ChainConfig {
  return chainConfigs[chainId] || chainConfigs[84532];
}

/** Returns the default chain ID (Base Sepolia Testnet) used when no chain is explicitly selected. */
export function getDefaultChainId(): number {
  return 84532; // Base Sepolia Testnet
}
