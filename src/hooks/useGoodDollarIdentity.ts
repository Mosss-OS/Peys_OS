import { useState, useEffect, useCallback } from "react";
import { usePublicClient, useChainId } from "wagmi";
import { usePrivyAuth } from "@/contexts/PrivyContext";
import { createPublicClient, http } from "viem";
import { baseSepolia } from "viem/chains";

export interface GoodDollarIdentity {
  isVerified: boolean;
  isRegistered: boolean;
  walletLinked: boolean;
  verificationLevel: "none" | "basic" | "verified" | "unique-human";
  uniqueHumanId?: string;
  lastVerified?: Date;
}

// GoodDollar Identity contract address on Celo Mainnet
// On Base Sepolia, this is a placeholder until deployment
const GDOLLAR_IDENTITY_ADDRESS = import.meta.env.VITE_GDOLLAR_IDENTITY_ADDRESS || "";

const GDOLLAR_IDENTITY_ABI = [
  {
    inputs: [{ name: "account", type: "address" }],
    name: "isVerified",
    outputs: [{ name: "", type: "bool" }],
    stateMutability: "view",
    type: "function",
  },
  {
    inputs: [{ name: "account", type: "address" }],
    name: "isUniqueHuman",
    outputs: [{ name: "", type: "bool" }],
    stateMutability: "view",
    type: "function",
  },
  {
    inputs: [{ name: "account", type: "address" }],
    name: "identity",
    outputs: [
      { name: "registered", type: "bool" },
      { name: "verified", type: "bool" },
      { name: "uniqueHuman", type: "bool" },
      { name: "wallet", type: "address" },
    ],
    stateMutability: "view",
    type: "function",
  },
] as const;

export function useGoodDollarIdentity() {
  const { walletAddress } = usePrivyAuth();
  const wagmiChainId = useChainId();
  const [identity, setIdentity] = useState<GoodDollarIdentity>({
    isVerified: false,
    isRegistered: false,
    walletLinked: false,
    verificationLevel: "none",
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const checkIdentity = useCallback(async () => {
    if (!walletAddress || !GDOLLAR_IDENTITY_ADDRESS) {
      setIdentity({
        isVerified: false,
        isRegistered: false,
        walletLinked: false,
        verificationLevel: "none",
      });
      return;
    }

    setLoading(true);
    setError(null);

    try {
      const publicClient = createPublicClient({
        chain: baseSepolia,
        transport: http("https://sepolia.base.org"),
      });

      const result = await (publicClient as any).readContract({
        address: GDOLLAR_IDENTITY_ADDRESS as `0x${string}`,
        abi: GDOLLAR_IDENTITY_ABI,
        functionName: "identity",
        args: [walletAddress as `0x${string}`],
      });

      const [registered, verified, uniqueHuman, wallet] = result as [boolean, boolean, boolean, string];

      const level = uniqueHuman ? "unique-human" : verified ? "verified" : registered ? "basic" : "none";

      setIdentity({
        isVerified: verified || uniqueHuman,
        isRegistered: registered,
        walletLinked: wallet.toLowerCase() === walletAddress.toLowerCase(),
        verificationLevel: level,
        uniqueHumanId: uniqueHuman ? walletAddress : undefined,
        lastVerified: verified ? new Date() : undefined,
      });
    } catch (err: any) {
      if (err?.message?.includes("execution reverted") || err?.message?.includes("not deployed")) {
        setIdentity({
          isVerified: false,
          isRegistered: false,
          walletLinked: false,
          verificationLevel: "none",
        });
      } else {
        setError(err?.message || "Failed to check identity");
      }
    } finally {
      setLoading(false);
    }
  }, [walletAddress]);

  useEffect(() => {
    checkIdentity();
  }, [checkIdentity]);

  const requestVerification = useCallback(async () => {
    if (!GDOLLAR_IDENTITY_ADDRESS) {
      throw new Error("GoodDollar Identity not deployed on this network yet");
    }
    // In production, this would open GoodDollar's identity verification flow
    // For now, simulate the flow
    setLoading(true);
    try {
      await new Promise(resolve => setTimeout(resolve, 2000));
      setIdentity(prev => ({
        ...prev,
        isVerified: true,
        isRegistered: true,
        verificationLevel: "basic",
        lastVerified: new Date(),
      }));
    } finally {
      setLoading(false);
    }
  }, []);

  return {
    identity,
    loading,
    error,
    checkIdentity,
    requestVerification,
    isIdentityDeployed: !!GDOLLAR_IDENTITY_ADDRESS,
  };
}
