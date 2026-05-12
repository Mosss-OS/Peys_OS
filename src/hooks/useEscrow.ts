import { usePublicClient, useChainId } from 'wagmi';
import { useWallets } from '@privy-io/react-auth';
import { ESCROW_ABI, ERC20_ABI } from '@/constants/blockchain';
import { getChainConfig } from '@/lib/chains';
import { useCallback, useMemo, useRef } from 'react';
import { keccak256, toBytes, Address, Hex, encodeFunctionData } from 'viem';
import { usePrivyAuth } from '@/contexts/PrivyContext';

export interface Payment {
  sender: string;
  recipient: string;
  amount: bigint;
  token: string;
  secretHash: string;
  status: number;
  createdAt: bigint;
  expiresAt: bigint;
  claimedAt: bigint;
}

export { getChainConfig };

type EIP1193Provider = {
  request: (args: { method: string; params?: unknown[] }) => Promise<unknown>;
};

interface PendingNonce {
  nonce: number;
  chainId: number;
}

const pendingNonces = new Map<string, PendingNonce>();
const nonceLocks = new Map<string, Promise<void>>();

async function acquireNonceLock(walletAddress: string): Promise<() => void> {
  while (nonceLocks.has(walletAddress)) {
    await nonceLocks.get(walletAddress);
  }
  let releaseLock: () => void;
  const lockPromise = new Promise<void>((resolve) => {
    releaseLock = resolve;
  });
  nonceLocks.set(walletAddress, lockPromise);
  return releaseLock!;
}

async function getNextNonce(
  wallet: { address: string; getEthereumProvider: () => Promise<unknown> },
  chainId: number
): Promise<number> {
  const provider = await wallet.getEthereumProvider() as EIP1193Provider;
  const key = `${wallet.address.toLowerCase()}-${chainId}`;
  const pending = pendingNonces.get(key);

  try {
    const result = await provider.request({
      method: 'eth_getTransactionCount',
      params: [wallet.address, 'pending'],
    }) as string;
    const onChainNonce = parseInt(result, 16);
    const baseNonce = pending ? Math.max(pending.nonce + 1, onChainNonce) : onChainNonce;
    
    pendingNonces.set(key, { nonce: baseNonce, chainId });
    return baseNonce;
  } catch (error) {
    console.warn("Failed to get on-chain nonce, using pending:", error);
    return pending ? pending.nonce + 1 : 0;
  }
}

function incrementNonce(walletAddress: string, chainId: number) {
  const key = walletAddress.toLowerCase() + '-' + chainId;
  const current = pendingNonces.get(key);
  if (current) {
    pendingNonces.set(key, { nonce: current.nonce + 1, chainId });
  }
}

interface PendingNonce {
  nonce: number;
  chainId: number;
}

// Switch the wallet's network via EIP-1193 — works for Privy embedded + external wallets
async function switchWalletNetwork(
  wallet: { getEthereumProvider: () => Promise<unknown> },
  chainId: number
): Promise<void> {
  const provider = await wallet.getEthereumProvider() as EIP1193Provider;
  const hexChainId = `0x${chainId.toString(16)}`;
  try {
    await provider.request({ method: 'wallet_switchEthereumChain', params: [{ chainId: hexChainId }] });
  } catch (err: unknown) {
    // Error code 4902 = chain not added to wallet yet
    const code = (err as { code?: number })?.code;
    if (code === 4902) {
      throw new Error(`Chain ${chainId} is not added to your wallet. Please add it manually.`);
    }
    throw err;
  }
}

// Send a transaction using the connected wallet's EIP-1193 provider directly.
// Bypasses viem's chain requirement — works for Privy embedded + external wallets.
async function sendViaTx(
  wallet: { address: string; getEthereumProvider: () => Promise<unknown> },
  address: string,
  tx: { to: Address; data: Hex; value: bigint },
  chainId: number = 84532
): Promise<{ hash: Hex }> {
  if (!tx.to || !tx.to.startsWith('0x')) {
    console.error("Invalid 'to' address:", tx.to);
    throw new Error(`invalid to address: ${tx.to}`);
  }
  
  const releaseLock = await acquireNonceLock(wallet.address);
  let nonce: number;
  
  try {
    nonce = await getNextNonce(wallet, chainId);
  } catch (error) {
    releaseLock();
    throw error;
  }

  const provider = await wallet.getEthereumProvider() as EIP1193Provider;

  try {
    const hash = await provider.request({
      method: 'eth_sendTransaction',
      params: [{
        from: address,
        to: tx.to,
        data: tx.data,
        value: `0x${tx.value.toString(16)}`,
        nonce: `0x${nonce.toString(16)}`,
      }],
    }) as Hex;

    incrementNonce(wallet.address, chainId);
    return { hash };
  } finally {
    releaseLock();
  }
}

export function useEscrow() {
  const publicClient = usePublicClient();
  const wagmiChainId = useChainId();
  const { walletAddress } = usePrivyAuth();
  const { wallets } = useWallets();
  
  const activeWallet = wallets[0];
  const address = walletAddress as Address | undefined;
  const chainId = wagmiChainId || 84532;

  if (!activeWallet) {
    console.warn("No active wallet found");
  }

  const getContractAddresses = useCallback(() => {
    const config = getChainConfig(chainId);
    return {
      escrowContract: config.escrowContract,
      usdcAddress: config.usdcAddress,
      usdtAddress: config.usdtAddress,
    };
  }, [chainId]);

  const checkAllowance = useCallback(async (
    tokenAddress: Address,
    amount: bigint
  ): Promise<boolean> => {
    if (!address || !publicClient) return false;
    
    try {
      const { escrowContract } = getContractAddresses();
      
      const allowanceData = await (publicClient as any).readContract({
        address: tokenAddress,
        abi: ERC20_ABI,
        functionName: 'allowance',
        args: [address as Address, escrowContract as Address],
      });
      
      const currentAllowance = allowanceData as bigint;
      console.log(`Current allowance: ${currentAllowance}, Required: ${amount}`);
      
      return currentAllowance >= amount;
    } catch (error) {
      console.warn("Failed to check allowance:", error);
      return false;
    }
  }, [address, publicClient, getContractAddresses]);

  const createPayment = useCallback(async (
    tokenAddress: Address,
    amount: bigint,
    secret: string,
    memo: string,
    expiryDays: number = 7,
    onApprovalRequested?: () => void,
    onCreatingPayment?: () => void
  ): Promise<Hex | undefined> => {
    if (!address || !activeWallet) {
      throw new Error("Wallet not connected. Please connect your wallet first.");
    }

    const claimHash = keccak256(toBytes(secret));
    const expiry = BigInt(expiryDays * 24 * 60 * 60);
    const { escrowContract } = getContractAddresses();

    console.log("createPayment called", { tokenAddress, amount, escrowContract, chainId });
    
    const isNativeToken = tokenAddress.startsWith("0x00000001") || tokenAddress.startsWith("0x0000000100000000");
    
    const pc = publicClient;
    
    if (!isNativeToken) {
      let hasAllowance = false;
      try {
        hasAllowance = await checkAllowance(tokenAddress, amount);
      } catch (e) {
        console.warn("Could not check allowance:", e);
      }
      
      if (!hasAllowance) {
        if (onApprovalRequested) onApprovalRequested();
        
        try {
          const approvalData = encodeFunctionData({
            abi: ERC20_ABI,
            functionName: 'approve',
            args: [escrowContract, amount],
          });
          
          const result = await sendViaTx(activeWallet, address, {
            to: tokenAddress,
            data: approvalData,
            value: BigInt(0),
          }, chainId);

          if (result.hash && pc) {
            await pc.waitForTransactionReceipt({ hash: result.hash });
          }
        } catch (approveError: unknown) {
          const errorMsg = (approveError as Error)?.message || '';
          if (errorMsg.includes('user rejected') || errorMsg.includes('cancelled') || errorMsg.includes('rejected')) {
            throw new Error("Transaction was cancelled. Please try again.");
          }
          console.log("Continuing despite approval error:", errorMsg);
        }
      }
    }

    await new Promise(resolve => setTimeout(resolve, 1000));

    if (onCreatingPayment) onCreatingPayment();

    if (!tokenAddress || tokenAddress === '0x0000000000000000000000000000000000000000') {
      throw new Error(`Invalid token address: ${tokenAddress}. Please select a valid token.`);
    }
    
    try {
      const createPaymentData = encodeFunctionData({
        abi: ESCROW_ABI,
        functionName: 'createPayment',
        args: [address, amount, tokenAddress, claimHash, expiry],
      });
      
      const result = await sendViaTx(activeWallet, address, {
        to: escrowContract,
        data: createPaymentData,
        value: BigInt(0),
      }, chainId);

      if (!result.hash) {
        throw new Error("Transaction was submitted but no hash was returned");
      }
      
      return result.hash as Hex;
      
    } catch (createError: unknown) {
      const errorMsg = (createError as Error)?.message || '';
      
      if (errorMsg.includes('user rejected') || errorMsg.includes('cancelled') || errorMsg.includes('rejected')) {
        throw new Error("Transaction was cancelled. Please try again.");
      }
      if (errorMsg.includes('execution reverted') || errorMsg.includes('reverted')) {
        throw new Error(`Transaction reverted: ${errorMsg}`);
      }
      
      throw new Error(`Failed to create payment: ${errorMsg || 'Unknown error'}`);
    }
  }, [address, activeWallet, chainId, publicClient, checkAllowance, getContractAddresses]);

  const getPayment = useCallback(async (paymentId: Hex): Promise<{
    sender: string;
    token: string;
    amount: bigint;
    expiry: bigint;
    claimed: boolean;
    refunded: boolean;
    memo: string;
  } | null> => {
    if (!publicClient) return null;

    const { escrowContract } = getContractAddresses();

    try {
      const result = await (publicClient as any).readContract({
        address: escrowContract,
        abi: ESCROW_ABI,
        functionName: 'getPayment',
        args: [paymentId],
      }) as [string, string, bigint, string, string, number, bigint, bigint, bigint];
      
      return {
        sender: result[0],
        recipient: result[1],
        amount: result[2],
        token: result[3],
        secretHash: result[4],
        status: result[5],
        createdAt: result[6],
        expiresAt: result[7],
        claimedAt: result[8],
      };
    } catch (error) {
      console.error("Error fetching payment:", error);
      return null;
    }
  }, [publicClient, getContractAddresses]);

  const claimPayment = useCallback(async (
    paymentId: Hex,
    secret: string
  ): Promise<Hex | undefined> => {
    if (!address || !activeWallet) throw new Error("Wallet not connected");
    if (!publicClient) throw new Error("Public client not available");

    const { escrowContract } = getContractAddresses();

    try {
      const claimData = encodeFunctionData({
        abi: ESCROW_ABI,
        functionName: 'claimPayment',
        args: [paymentId, secret],
      });
      
      const result = await sendViaTx(activeWallet, address, {
        to: escrowContract,
        data: claimData,
        value: BigInt(0),
      }, chainId);
      return result.hash as Hex;
    } catch (error: unknown) {
      throw new Error(`Failed to claim: ${(error as Error).message}`);
    }
  }, [address, activeWallet, publicClient, getContractAddresses]);

  const refundPayment = useCallback(async (paymentId: Hex): Promise<Hex | undefined> => {
    if (!address || !activeWallet) throw new Error("Wallet not connected");
    if (!publicClient) throw new Error("Public client not available");

    const { escrowContract } = getContractAddresses();

    try {
      const refundData = encodeFunctionData({
        abi: ESCROW_ABI,
        functionName: 'refundPayment',
        args: [paymentId],
      });
      
      const result = await sendViaTx(activeWallet, address, {
        to: escrowContract,
        data: refundData,
        value: BigInt(0),
      }, chainId);
      return result.hash as Hex;
    } catch (error: unknown) {
      throw new Error(`Failed to refund: ${(error as Error).message}`);
    }
  }, [address, activeWallet, publicClient, getContractAddresses]);

  const estimateGas = useCallback(async (
    tokenAddress: Address,
    amount: bigint,
    secret: string,
    memo: string,
    expiryDays: number = 7
  ): Promise<bigint | undefined> => {
    if (!address || !publicClient) throw new Error("Wallet not connected");

    const claimHash = keccak256(toBytes(secret));
    const expiry = BigInt(expiryDays * 24 * 60 * 60);
    const { escrowContract } = getContractAddresses();

    try {
      return await (publicClient as any).estimateContractGas({
        address: escrowContract,
        abi: ESCROW_ABI,
        functionName: 'createPayment',
        args: [address, amount, tokenAddress, claimHash, expiry],
        account: address,
      });
    } catch (error: unknown) {
      throw new Error(`Failed to estimate gas: ${(error as Error).message}`);
    }
  }, [address, publicClient, getContractAddresses]);

  const switchNetwork = useCallback(async (targetChainId: number): Promise<void> => {
    if (!activeWallet) throw new Error("No wallet connected");
    await switchWalletNetwork(activeWallet, targetChainId);
    // Wait for the chain change to propagate
    await new Promise(resolve => setTimeout(resolve, 600));
  }, [activeWallet]);

  return {
    createPayment,
    claimPayment,
    refundPayment,
    getPayment,
    estimateGas,
    switchNetwork,
  };
}
