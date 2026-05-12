import { parseAbi } from "viem";

export const ESCROW_ABI = parseAbi([
  "function claimPayment(uint256 _paymentId, string calldata _secret) external",
  "function getPayment(uint256 _paymentId) view returns (tuple(address sender, address recipient, uint256 amount, address token, bytes32 secretHash, uint8 status, uint256 createdAt, uint256 expiresAt, uint256 claimedAt))",
  "function paymentExists(uint256 _paymentId) view returns (bool)",
]);

export const ERC20_ABI = parseAbi([
  "function balanceOf(address account) view returns (uint256)",
  "function allowance(address owner, address spender) view returns (uint256)",
]);

export function getRpcUrl(chainId?: number): string {
  if (!chainId) {
    return Deno.env.get("VITE_RPC_URL_BASE_SEPOLIA") || "https://sepolia.base.org";
  }
  const rpcUrls: Record<number, string> = {
    84532: Deno.env.get("VITE_RPC_URL_BASE_SEPOLIA") || "https://sepolia.base.org",
    44787: Deno.env.get("VITE_RPC_URL_CELO") || "https://alfajores-forno.celo-testnet.org",
    8453: Deno.env.get("VITE_RPC_URL_BASE") || "https://mainnet.base.org",
    42220: Deno.env.get("VITE_RPC_URL_CELO_MAINNET") || "https://forno.celo.org",
  };
  return rpcUrls[chainId] || rpcUrls[84532]!;
}

export function getEscrowContractAddress(chainId?: number): string {
  const addresses: Record<number, string> = {
    84532: Deno.env.get("CONTRACT_BASE_SEPOLIA") || "",
    44787: Deno.env.get("CONTRACT_CELO_ALFAJORES") || "",
    8453: Deno.env.get("CONTRACT_BASE") || "",
    42220: Deno.env.get("CONTRACT_CELO_MAINNET") || "",
  };
  return addresses[chainId || 84532] || addresses[84532]!;
}

export function getChainId(chainId?: number): number {
  return chainId || 84532;
}
