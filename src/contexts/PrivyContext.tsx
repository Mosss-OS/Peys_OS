import { createContext, useContext, useState, useEffect, useCallback, ReactNode } from 'react';
import { PrivyProvider as PrivyReactProvider, usePrivy, useWallets } from '@privy-io/react-auth';
import { defineChain } from 'viem';
import { baseSepolia } from 'viem/chains';

// Base Sepolia chain definition
const baseSepoliaChain = defineChain({
  ...baseSepolia,
  testnet: true,
});

const PRIVY_APP_ID = import.meta.env.VITE_PRIVY_APP_ID;

if (!PRIVY_APP_ID) {
  console.error("CRITICAL: VITE_PRIVY_APP_ID environment variable is not set. Authentication will not work.");
}

interface PeysUser {
  id: string;
  email?: string;
  phone?: string;
  walletAddress?: string;
}

interface PrivyAuthContextType {
  user: PeysUser | null;
  isLoggedIn: boolean;
  isLoading: boolean;
  ready: boolean;
  login: () => void;
  loginWithEmailOnly: (prefillEmail?: string) => void;
  logout: () => Promise<void>;
  walletAddress: string;
}

const PrivyAuthContext = createContext<PrivyAuthContextType | null>(null);

function PrivyAuthInner({ children }: { children: ReactNode }) {
  const { login, logout: privyLogout, user: privyUser, ready, authenticated } = usePrivy();
  const { wallets } = useWallets();

  const [isLoading, setIsLoading] = useState(false);
  const [walletAddress, setWalletAddress] = useState('');

  useEffect(() => {
    const eoaWallet = wallets.find(w => w.type === 'ethereum');
    if (eoaWallet) {
      setWalletAddress(eoaWallet.address);
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
      }}
    >
      {children}
    </PrivyAuthContext.Provider>
  );
}

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
        supportedChains: [baseSepoliaChain],
      }}
    >
      <PrivyAuthInner>{children}</PrivyAuthInner>
    </PrivyReactProvider>
  );
}

export function usePrivyAuth() {
  const ctx = useContext(PrivyAuthContext);
  if (!ctx) throw new Error('usePrivyAuth must be inside PrivyAppProvider');
  return ctx;
}
