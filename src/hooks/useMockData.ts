import { useState } from "react";

export interface Transaction {
  id: string;
  type: "sent" | "claimed" | "pending";
  amount: number;
  token: "USDC" | "USDT" | "PASS" | "G$";
  counterparty: string;
  memo?: string;
  timestamp: Date;
  claimLink?: string;
  expiresAt?: Date;
  status?: string;
  chain?: string;
}

export interface UserWallet {
  address: string;
  balanceUSDC: number;
  balanceUSDT: number;
}

const MOCK_WALLET: UserWallet = {
  address: "0x1a2B...9f4E",
  balanceUSDC: 1250.0,
  balanceUSDT: 340.5,
};

const MOCK_TRANSACTIONS: Transaction[] = [
  {
    id: "1",
    type: "sent",
    amount: 50,
    token: "USDC",
    counterparty: "moses@email.com",
    memo: "Lunch money 🍕",
    timestamp: new Date(Date.now() - 3600000),
    claimLink: "abc123",
  },
  {
    id: "2",
    type: "claimed",
    amount: 200,
    token: "USDT",
    counterparty: "alice@email.com",
    memo: "Freelance payment",
    timestamp: new Date(Date.now() - 86400000),
  },
  {
    id: "3",
    type: "pending",
    amount: 100,
    token: "USDC",
    counterparty: "bob@email.com",
    timestamp: new Date(Date.now() - 7200000),
    claimLink: "def456",
    expiresAt: new Date(Date.now() + 86400000 * 6),
  },
  {
    id: "4",
    type: "claimed",
    amount: 75,
    token: "USDC",
    counterparty: "grace@email.com",
    memo: "Birthday gift 🎂",
    timestamp: new Date(Date.now() - 172800000),
  },
];

export function useMockData() {
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [wallet] = useState<UserWallet>(MOCK_WALLET);
  const [transactions] = useState<Transaction[]>(MOCK_TRANSACTIONS);

  return {
    isLoggedIn,
    setIsLoggedIn,
    wallet,
    transactions,
    login: () => setIsLoggedIn(true),
    logout: () => setIsLoggedIn(false),
  };
}
