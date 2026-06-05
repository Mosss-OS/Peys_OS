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
