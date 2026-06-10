/**
 * @file Global application context providing wallet balances, transactions, and auth integration.
 */

import { createContext, useContext, useState, useEffect, useCallback, ReactNode } from "react";
import { usePrivyAuth } from "@/contexts/PrivyContext";
import { createPublicClient, http, formatUnits, type Address, type PublicClient, defineChain } from "viem";
import { baseSepolia } from "viem/chains";
import { ERC20_ABI, GD_PRICE_IN_USD } from "@/constants/blockchain";
import { chainConfigs } from "@/lib/chains";
import { supabase } from "@/integrations/supabase/client";
import type { Transaction } from "@/types/transaction";

const celoAlfajores = defineChain({
  id: 44787,
  name: "Celo Alfajores",
  nativeCurrency: { name: "CELO", symbol: "CELO", decimals: 18 },
  rpcUrls: { default: { http: ["https://alfajores-forno.celo-testnet.org"] } },
  blockExplorers: { default: { name: "Celoscan", url: "https://alfajores.celoscan.io" } },
});

const celoMainnet = defineChain({
  id: 42220,
  name: "Celo",
  nativeCurrency: { name: "CELO", symbol: "CELO", decimals: 18 },
  rpcUrls: { default: { http: ["https://celo-mainnet.g.alchemy.com/v2/7sXxdzivaO6JR4KsfNEqI"] } },
  blockExplorers: { default: { name: "Celoscan", url: "https://celoscan.io" } },
});

const chainObjects: Record<number, ReturnType<typeof defineChain>> = {
  84532: baseSepolia,
  44787: celoAlfajores,
  42220: celoMainnet,
};

/** Token and native-coin balances for a single blockchain network. */
export interface NetworkBalance {
  chainId: number;
  networkName: string;
  usdc: number;
  usdt: number;
  g$: number;
  nativeToken: number;
  nativeSymbol: string;
}

/** Aggregated wallet data including per-network and total USD balances. */
interface UserWallet {
  address: string;
  balanceUSDC: number;
  balanceUSDT: number;
  balanceG$: number;
  totalBalanceUSD: number;
  networkBalances: NetworkBalance[];
}

/** Shape of the global application context exposed to consumers. */
interface AppContextType {
  isLoggedIn: boolean;
  isLoading: boolean;
  login: () => void;
  logout: () => void;
  wallet: UserWallet;
  transactions: Transaction[];
  walletAddress: string;
  refreshBalances: () => void;
  refreshTransactions: () => void;
  transactionsLoading: boolean;
  selectedNetwork: number | null;
  setSelectedNetwork: (network: number | null) => void;
}

const AppContext = createContext<AppContextType | null>(null);

/** Pre-built viem public clients keyed by chain ID for reading on-chain data. */
const publicClients = Object.entries(chainConfigs).reduce((acc, [chainId, config]) => {
  const id = Number(chainId);
  acc[id] = createPublicClient({
    chain: chainObjects[id] || baseSepolia,
    transport: http(config.rpcUrl),
  });
  return acc;
}, {} as Record<number, ReturnType<typeof createPublicClient>>);

/**
 * Provider that aggregates wallet balances across all supported chains,
 * loads transaction history, and syncs auth state with Supabase.
 */
export function AppProvider({ children }: { children: ReactNode }) {
  const { isLoggedIn, isLoading, login, logout, walletAddress } = usePrivyAuth();
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [transactionsLoading, setTransactionsLoading] = useState(false);
  const [balanceUSDC, setBalanceUSDC] = useState(0);
  const [balanceUSDT, setBalanceUSDT] = useState(0);
  const [balanceG$, setBalanceG$] = useState(0);
  const [totalBalanceUSD, setTotalBalanceUSD] = useState(0);
  const [networkBalances, setNetworkBalances] = useState<NetworkBalance[]>([]);
  const [selectedNetwork, setSelectedNetwork] = useState<number | null>(null);

  const shortAddr = walletAddress
    ? walletAddress.slice(0, 6) + "..." + walletAddress.slice(-4)
    : "Not connected";

  /**
   * Fetch token and native-coin balances across all configured chains.
   * Returns early with zeroed balances if the user is not logged in.
   */
  const fetchBalances = useCallback(async () => {
    if (!walletAddress || !isLoggedIn) {
      console.log('[DEBUG] fetchBalances skipped — wallet:', !!walletAddress, 'loggedIn:', isLoggedIn);
      setBalanceUSDC(0);
      setBalanceUSDT(0);
      setBalanceG$(0);
      setTotalBalanceUSD(0);
      setNetworkBalances([]);
      return;
    }

    console.log('[DEBUG] fetchBalances starting for wallet:', walletAddress);
    const addr = walletAddress as Address;
    const netBalances: NetworkBalance[] = [];
    let totalUSDC = 0;
    let totalUSDT = 0;
    let totalG$ = 0;

    // Guard against zero-address or malformed token addresses
    const isValidAddress = (addr: string) => {
      if (!addr || !addr.startsWith("0x") || addr.length < 42) return false;
      const cleanAddr = addr.toLowerCase();
      return !cleanAddr.startsWith("0x0000000000000000000000000000000000000");
    };

    /** Read an ERC-20 token balance for the user's wallet. */
    const readBalance = async (client: PublicClient, tokenAddr: Address, decimals: number = 6) => {
      if (!isValidAddress(tokenAddr)) {
        return 0;
      }
      try {
        const [raw] = await Promise.all([
          client.readContract({
            address: tokenAddr,
            abi: ERC20_ABI,
            functionName: "balanceOf",
            args: [addr],
          }),
        ]);
        if (!raw || raw === 0n) return 0;
        const formatted = Number(formatUnits(raw as bigint, decimals));
        console.log(`[DEBUG] readBalance: ${tokenAddr.slice(0,10)} → ${formatted} (raw=${raw})`);
        return formatted;
      } catch (err) {
        console.error('Error reading token balance:', err);
        return 0;
      }
    };

    /** Read the native coin balance (e.g. ETH) for the user's wallet. */
    const readNativeBalance = async (client: PublicClient) => {
      try {
        const balance = await client.getBalance({ address: addr });
        const formatted = Number(formatUnits(balance, 18));
        console.log(`[DEBUG] nativeBalance: ${formatted} ETH`);
        return formatted;
      } catch (err) {
        console.error('Error reading native balance:', err);
        return 0;
      }
    };

    await Promise.all(
      Object.entries(chainConfigs).map(async ([chainId, config]) => {
        const client = publicClients[Number(chainId)];
        console.log(`[DEBUG] chain ${chainId}: client exists = ${!!client}, rpc = ${config.rpcUrl?.slice(0,40)}...`);

        const [usdcBalance, usdtBalance, g$Balance, nativeBalance] = await Promise.all([
          readBalance(client, config.usdcAddress, 6),
          readBalance(client, config.usdtAddress, 6),
          readBalance(client, config.gdAddress, 18),
          readNativeBalance(client),
        ]);

        console.log(`[DEBUG] ${config.name}: USDC=${usdcBalance} USDT=${usdtBalance} G$${g$Balance} NATIVE=${nativeBalance} ${config.nativeSymbol}`);

        netBalances.push({
          chainId: Number(chainId),
          networkName: config.name,
          usdc: usdcBalance,
          usdt: usdtBalance,
          g$: g$Balance,
          nativeToken: nativeBalance,
          nativeSymbol: config.nativeSymbol || "ETH",
        });

        totalUSDC += usdcBalance;
        totalUSDT += usdtBalance;
        totalG$ += g$Balance;
      })
    );

    netBalances.sort((a, b) => (b.usdc + b.usdt) - (a.usdc + a.usdt));

    console.log('[DEBUG] fetchBalances complete — total USDC:', totalUSDC, 'total G$:', totalG$);

    setBalanceUSDC(totalUSDC);
    setBalanceUSDT(totalUSDT);
    setBalanceG$(totalG$);
    setTotalBalanceUSD(totalUSDC + totalUSDT + (totalG$ * GD_PRICE_IN_USD));
    setNetworkBalances(netBalances);
  }, [walletAddress, isLoggedIn]);

  /**
   * Load recent payment transactions from Supabase that involve the current user.
   * Queries by user ID, email, or wallet address.
   */
  const fetchTransactions = useCallback(async () => {
    if (!isLoggedIn) {
      setTransactions([]);
      return;
    }

    setTransactionsLoading(true);
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        setTransactions([]);
        setTransactionsLoading(false);
        return;
      }

      const userEmail = user.email || "";
      const userWallet = walletAddress;

      let query = supabase
        .from("payments")
        .select("*")
        .order("created_at", { ascending: false })
        .limit(50);

      const orFilter = [];
      if (user.id) {
        orFilter.push(`sender_user_id.eq.${user.id}`);
      }
      if (userEmail) {
        orFilter.push(`recipient_email.eq.${userEmail}`);
      }
      if (userWallet) {
        orFilter.push(`sender_wallet.eq.${userWallet}`);
      }

      if (orFilter.length > 0) {
        query = query.or(orFilter.join(','));
      }

      const { data: payments, error } = await query;

      if (error) {
        setTransactions([]);
        setTransactionsLoading(false);
        return;
      }

      const mapped: Transaction[] = (payments || []).map((p) => {
        let type: Transaction["type"];
        const isSender = p.sender_user_id === user.id || p.sender_wallet?.toLowerCase() === userWallet?.toLowerCase();
        const isRecipient = p.recipient_email?.toLowerCase() === userEmail?.toLowerCase();
        
        if (p.status === "claimed") {
          type = isSender ? "sent" : "claimed";
        } else if (p.status === "pending") {
          type = "pending";
        } else if (p.status === "expired") {
          type = isSender ? "sent" : "claimed";
        } else {
          type = isSender ? "sent" : "claimed";
        }

        let counterparty: string;
        if (isSender) {
          counterparty = p.recipient_email || "Unknown";
        } else {
          counterparty = p.sender_email || p.sender_wallet?.slice(0, 6) + "..." + p.sender_wallet?.slice(-4) || "Unknown";
        }

        return {
          id: p.id,
          type,
          amount: Number(p.amount),
          token: (p.token === "USDT" ? "USDT" : p.token === "G$" ? "G$" : "USDC") as "USDC" | "USDT" | "G$",
          counterparty,
          memo: p.memo || undefined,
          timestamp: new Date(p.created_at),
          claimLink: p.claim_link || undefined,
          expiresAt: p.expires_at ? new Date(p.expires_at) : undefined,
          status: p.status,
        };
      });

      setTransactions(mapped);
    } catch (err) {
      console.error("Transaction fetch error:", err);
    } finally {
      setTransactionsLoading(false);
    }
  }, [isLoggedIn, walletAddress]);

  useEffect(() => {
    fetchBalances();
    if (isLoggedIn && walletAddress) {
      const interval = setInterval(fetchBalances, 30_000);
      return () => clearInterval(interval);
    }
  }, [fetchBalances, isLoggedIn, walletAddress]);

  useEffect(() => {
    fetchTransactions();
  }, [fetchTransactions]);

  const wallet: UserWallet = {
    address: shortAddr,
    balanceUSDC,
    balanceUSDT,
    balanceG$,
    totalBalanceUSD,
    networkBalances,
  };

  useEffect(() => {
    // Ensure Supabase session stays in sync with Privy auth state
    const syncSupabaseAuth = async () => {
      try {
        const { data: { user } } = await supabase.auth.getUser();
        if (isLoggedIn && !user) {
          const privyUser = localStorage.getItem('privy_user');
          if (privyUser) {
            console.log('Privy user detected, Supabase auth should sync automatically');
          }
        }
      } catch (err) {
        console.error('Auth sync error:', err);
      }
    };

    if (isLoggedIn) {
      syncSupabaseAuth();
    }
  }, [isLoggedIn]);

  return (
    <AppContext.Provider
      value={{
        isLoggedIn,
        isLoading,
        login,
        logout,
        wallet,
        transactions,
        walletAddress,
        refreshBalances: fetchBalances,
        refreshTransactions: fetchTransactions,
        transactionsLoading,
        selectedNetwork,
        setSelectedNetwork,
      }}
    >
      {children}
    </AppContext.Provider>
  );
}

/**
 * Hook to access the global application context (wallet, balances, transactions).
 */
export function useApp() {
  const ctx = useContext(AppContext);
  if (!ctx) throw new Error("useApp must be inside AppProvider");
  return ctx;
}
