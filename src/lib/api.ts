import { supabase } from "@/integrations/supabase/client";

/**
 * API client for communicating with Supabase Edge Functions.
 * Handles payment creation, claiming, user syncing, and token queries.
 */

/** Record returned by the get-user-payments endpoint. */
interface PaymentRecord {
  id: string;
  payment_id: string;
  amount: number;
  token: string;
  status: string;
  created_at: string;
}

const SUPABASE_URL = import.meta.env.VITE_SUPABASE_URL;
const API_URL = SUPABASE_URL ? `${SUPABASE_URL}/functions/v1` : 'http://localhost:54321/functions/v1';

/** HTTP client that wraps Supabase Edge Function calls with auth headers. */
class ApiClient {
  private baseUrl: string;

  /** @param baseUrl - Base URL for Supabase Edge Functions (defaults to API_URL). */
  constructor(baseUrl: string = API_URL) {
    this.baseUrl = baseUrl;
  }

  /** Builds an auth headers object by reading the current Supabase session token. */
  private async getAuthHeaders(): Promise<Record<string, string>> {
    const { data: { session } } = await supabase.auth.getSession();
    const headers: Record<string, string> = {
      'Content-Type': 'application/json',
    };
    
    if (session?.access_token) {
      headers['Authorization'] = `Bearer ${session.access_token}`;
    }
    
    return headers;
  }

  /** Generic request helper that prepends the base URL, attaches auth headers, and handles errors. */
  private async request<T>(endpoint: string, options: RequestInit = {}): Promise<T> {
    const url = `${this.baseUrl}${endpoint}`;
    const headers = await this.getAuthHeaders();
    
    const response = await fetch(url, {
      ...options,
      headers: {
        ...headers,
        ...options.headers,
      },
    });

    if (!response.ok) {
      const error = await response.json().catch(() => ({ error: 'Request failed' }));
      throw new Error(error.error || `HTTP ${response.status}`);
    }

    return response.json();
  }

  /** Creates a new payment and returns the on-chain payment ID, transaction hash, claim link, and expiry. */
  async createPayment(data: {
    senderAddress: string;
    senderEmail?: string;
    recipientEmail?: string;
    tokenAddress: string;
    tokenSymbol?: string;
    amount: string;
    secret: string;
    memo?: string;
    expiryDays?: number;
  }) {
    return this.request<{
      paymentId: string;
      transactionHash: string;
      claimLink: string;
      expiry: string;
    }>('/create-payment', {
      method: 'POST',
      body: JSON.stringify(data),
    });
  }

  /** Retrieves a payment by its ID with full details including sender, amount, token, and status. */
  async getPayment(id: string) {
    return this.request<{
      id: string;
      paymentId: string;
      senderAddress: string;
      amount: string;
      tokenSymbol: string;
      memo: string;
      expiry: string;
      status: 'pending' | 'claimed' | 'refunded' | 'expired';
    }>(`/get-payment`, {
      method: 'POST',
      body: JSON.stringify({ id }),
    });
  }

  /** Claims an existing payment by providing the secret and recipient address. */
  async claimPayment(id: string, data: {
    secret: string;
    recipientAddress: string;
    recipientWallet?: string;
    transactionHash?: string;
  }) {
    return this.request<{ success: boolean; transactionHash: string }>('/claim-payment', {
      method: 'POST',
      body: JSON.stringify({ id, ...data }),
    });
  }

  /** Returns all payments (sent and received) for a given wallet address. */
  async getUserPayments(walletAddress: string) {
    return this.request<PaymentRecord[]>('/get-user-payments', {
      method: 'POST',
      body: JSON.stringify({ walletAddress }),
    });
  }

  /** Queries the token balance for a given wallet and token address, optionally on a specific chain. */
  async getTokenBalance(tokenAddress: string, walletAddress: string, chainId?: number) {
    return this.request<{ balance: string }>('/get-token-balance', {
      method: 'POST',
      body: JSON.stringify({ tokenAddress, walletAddress, chainId }),
    });
  }

  /** Queries the ERC-20 allowance granted to the escrow contract for a given owner. */
  async getAllowance(tokenAddress: string, ownerAddress: string, chainId?: number) {
    return this.request<{ allowance: string }>('/get-token-allowance', {
      method: 'POST',
      body: JSON.stringify({ tokenAddress, ownerAddress, chainId }),
    });
  }

  /** Syncs a user's off-chain profile (Privy ID, email, wallet, etc.) with the backend. */
  async syncUser(data: {
    privyId: string;
    email?: string;
    phone?: string;
    name?: string;
    walletAddress?: string;
    walletType?: string;
    chainId?: number;
  }) {
    return this.request<{
      id: string;
      email?: string;
      walletAddress?: string;
    }>('/sync-user', {
      method: 'POST',
      body: JSON.stringify(data),
    });
  }
}

/** Singleton instance of the API client for use across the app. */
export const api = new ApiClient();
export default api;
