/**
 * @file Privy authentication wrapper providing login, logout, wallet, and user info.
 */

import { createContext, useContext, useState, useEffect, useCallback, ReactNode } from 'react';
import { PrivyProvider as PrivyReactProvider, usePrivy, useWallets } from '@privy-io/react-auth';
import { defineChain } from 'viem';
import { baseSepolia, celoAlfajores, celo } from 'viem/chains';

/** Base Sepolia chain definition used as the default chain. */
const baseSepoliaChain = defineChain({
  ...baseSepolia,
  testnet: true,
});

const celoAlfajoresChain = defineChain({
  ...celoAlfajores,
  testnet: true,
});

const celoMainnetChain = defineChain({
  ...celo,
});

const PRIVY_APP_ID = import.meta.env.VITE_PRIVY_APP_ID;

// Warn if the required Privy app ID is missing from environment
if (!PRIVY_APP_ID) {
  console.error("CRITICAL: VITE_PRIVY_APP_ID environment variable is not set. Authentication will not work.");
}

/** A simplified user object derived from Privy's user data. */
interface PeysUser {
  id: string;
  email?: string;
  phone?: string;
  walletAddress?: string;
}

/** Shape of the authentication context exposed to consumers. */
interface PrivyAuthContextType {
  user: PeysUser | null;
  isLoggedIn: boolean;
  isLoading: boolean;
  ready: boolean;
  login: () => void;
  loginWithEmailOnly: (prefillEmail?: string) => void;
  logout: () => Promise<void>;
  walletAddress: string;
  linkExternalWallet: () => void;
}

const PrivyAuthContext = createContext<PrivyAuthContextType | null>(null);

/** Internal component that bridges Privy hooks into the app's auth context. */
function PrivyAuthInner({ children }: { children: ReactNode }) {
  const { login, logout: privyLogout, user: privyUser, ready, authenticated, linkWallet } = usePrivy();
  const { wallets } = useWallets();

  const [isLoading, setIsLoading] = useState(false);
  const [walletAddress, setWalletAddress] = useState('');

  // Sync wallet address from Privy wallets array whenever it changes.
  // Prefer external (non-embedded) wallets over the embedded Privy wallet so
  // users who connect MetaMask/Rabby see their funded wallet automatically.
  useEffect(() => {
    const externalWallet = wallets.find(w => w.type === 'ethereum' && w.walletClientType !== 'privy');
    if (externalWallet) {
      setWalletAddress(externalWallet.address);
      return;
    }
    const embeddedWallet = wallets.find(w => w.type === 'ethereum');
    if (embeddedWallet) {
      setWalletAddress(embeddedWallet.address);
    } else if (wallets.length > 0) {
      setWalletAddress(wallets[0].address);
    } else {
      setWalletAddress('');
    }
  }, [wallets]);

  const handleLogin = useCallback(() => {
    if (!ready) return;
    setIsLoading(true);
    login();
  }, [login, ready]);

  const handleLoginWithEmailOnly = useCallback((prefillEmail?: string) => {
    if (!ready) return;
    setIsLoading(true);
    login({
      loginMethods: ['email'],
      ...(prefillEmail && { prefill: { type: 'email', value: prefillEmail } }),
    });
  }, [login, ready]);

  useEffect(() => {
    if (ready) setIsLoading(false);
  }, [authenticated, ready]);

  const handleLinkExternalWallet = useCallback(() => {
    linkWallet();
  }, [linkWallet]);

  const handleLogout = useCallback(async () => {
    try {
      await privyLogout();
      setWalletAddress('');
    } catch (error) {
      console.error('Logout error:', error);
    }
  }, [privyLogout]);

  const user: PeysUser | null = privyUser
    ? {
        id: privyUser.id,
        email: privyUser.email?.address,
        phone: privyUser.phone?.number,
        walletAddress: walletAddress || undefined,
      }
    : null;

  return (
    <PrivyAuthContext.Provider
      value={{
        user,
        isLoggedIn: authenticated && ready,
        isLoading,
        ready,
        login: handleLogin,
        loginWithEmailOnly: handleLoginWithEmailOnly,
        logout: handleLogout,
        walletAddress,
        linkExternalWallet: handleLinkExternalWallet,
      }}
    >
      {children}
    </PrivyAuthContext.Provider>
  );
}

/**
 * Top-level provider that wraps the app with Privy's authentication SDK
 * and configures the supported login methods, embedded wallets, and chains.
 */
export function PrivyAppProvider({ children }: { children: ReactNode }) {
  return (
    <PrivyReactProvider
      appId={PRIVY_APP_ID}
      config={{
        appearance: {
          theme: 'dark',
          accentColor: '#10b981',
          logo: undefined,
        },
        loginMethods: ['email', 'sms', 'google', 'apple', 'twitter', 'wallet'],
        embeddedWallets: {
          ethereum: {
            createOnLogin: 'users-without-wallets',
          },
        },
        defaultChain: baseSepoliaChain,
        supportedChains: [baseSepoliaChain, celoAlfajoresChain, celoMainnetChain],
      }}
    >
      <PrivyAuthInner>{children}</PrivyAuthInner>
    </PrivyReactProvider>
  );
}

/**
 * Hook to access authentication state, user info, wallet address, and login/logout actions.
 */
export function usePrivyAuth() {
  const ctx = useContext(PrivyAuthContext);
  if (!ctx) throw new Error('usePrivyAuth must be inside PrivyAppProvider');
  return ctx;
}
