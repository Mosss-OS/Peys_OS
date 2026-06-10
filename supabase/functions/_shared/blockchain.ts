import { parseAbi } from "npm:viem";

export const ESCROW_ABI = parseAbi([
  "function createPaymentWithPermit(address _sender, address _recipient, uint256 _amount, address _token, bytes32 _secretHash, uint256 _duration, uint256 _deadline, uint8 _v, bytes32 _r, bytes32 _s) external returns (uint256)",
  "function claimPayment(uint256 _paymentId, string calldata _secret) external",
  "function getPayment(uint256 _paymentId) view returns (tuple(address sender, address recipient, uint256 amount, address token, bytes32 secretHash, uint8 status, uint256 createdAt, uint256 expiresAt, uint256 claimedAt))",
  "function paymentExists(uint256 _paymentId) view returns (bool)",
  "function getContractBalance(address _token) view returns (uint256)",
]);

export const ERC20_ABI = parseAbi([
  "function balanceOf(address account) view returns (uint256)",
  "function allowance(address owner, address spender) view returns (uint256)",
]);

export const USDC_ABI = parseAbi([
  "function permit(address owner, address spender, uint256 value, uint256 deadline, uint8 v, bytes32 r, bytes32 s) external",
  "function balanceOf(address account) view returns (uint256)",
  "function allowance(address owner, address spender) view returns (uint256)",
  "function approve(address spender, uint256 amount) returns (bool)",
]);

export function getRpcUrl(chainId?: number): string {
  if (!chainId) {
    return Deno.env.get("VITE_RPC_URL_BASE_SEPOLIA") || "https://sepolia.base.org";
  }
  const rpcUrls: Record<number, string> = {
    84532: Deno.env.get("VITE_RPC_URL_BASE_SEPOLIA") || "https://sepolia.base.org",
    44787: Deno.env.get("VITE_RPC_URL_CELO") || "https://alfajores-forno.celo-testnet.org",
    8453: Deno.env.get("VITE_RPC_URL_BASE") || "https://mainnet.base.org",
    42220: Deno.env.get("VITE_RPC_URL_CELO_MAINNET") || "https://celo-mainnet.g.alchemy.com/v2/7sXxdzivaO6JR4KsfNEqI",
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

export function getUSDCAddress(chainId?: number): string {
  const addresses: Record<number, string> = {
    84532: Deno.env.get("USDC_BASE_SEPOLIA") || "0x036CbD53842c5426634e7929541eC2318f3dCF7e",
    44787: Deno.env.get("USDC_CELO_ALFAJORES") || "",
    8453: Deno.env.get("USDC_BASE") || "",
    42220: Deno.env.get("USDC_CELO_MAINNET") || "",
  };
  return addresses[chainId || 84532] || addresses[84532]!;
}

export function getG$Address(chainId?: number): string {
  const addresses: Record<number, string> = {
    84532: Deno.env.get("GDOLLAR_BASE_SEPOLIA") || "",
    44787: Deno.env.get("GDOLLAR_CELO_ALFAJORES") || "",
    8453: Deno.env.get("GDOLLAR_BASE") || "",
    42220: Deno.env.get("GDOLLAR_CELO_MAINNET") || "0x62B8B11039FcfE5aB0C56E502b1C372A3d2a9c7A",
  };
  return addresses[chainId || 84532] || addresses[84532]!;
}
