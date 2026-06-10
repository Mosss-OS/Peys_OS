export interface PeysConfig {
  apiKey: string;
  baseUrl?: string;
}

export interface CreatePaymentOptions {
  recipient: string;
  amount: number;
  token: string;
  memo?: string;
  expiresIn?: number;
}

export interface Payment {
  id: string;
  paymentId: string;
  amount: number;
  token: string;
  status: PaymentStatus;
  expiresAt: string;
  claimLink?: string;
  createdAt: string;
  claimedAt?: string;
  refundedAt?: string;
  memo?: string;
}

export type PaymentStatus = 'pending' | 'claimed' | 'refunded' | 'expired' | 'cancelled';

export interface ListPaymentsOptions {
  limit?: number;
  offset?: number;
  status?: PaymentStatus;
}

export interface PaymentListResponse {
  data: Payment[];
  pagination: {
    total: number;
    limit: number;
    offset: number;
    hasMore: boolean;
  };
}

export interface CreateWebhookOptions {
  url: string;
  events?: string[];
  secret?: string;
}

export interface Webhook {
  id: string;
  url: string;
  events: string[];
  isActive: boolean;
  createdAt: string;
}

export interface WebhookListResponse {
  data: Webhook[];
}

export interface ClaimPaymentOptions {
  recipientWallet: string;
  secret?: string;
}

export interface UsageResponse {
  month: string;
  apiCalls: number;
  limit: number;
  remaining: number;
}

export interface AccountResponse {
  apiKeyId: string;
  apiKeyName: string;
  tier: 'free' | 'pro' | 'enterprise';
  monthlyLimit: number;
  email?: string;
  createdAt: string;
}

export interface PricingTier {
  name: string;
  monthly_fee: number;
  api_calls_included: number;
  per_request_fee: number;
  rate_limit: number;
  features: string[];
}

export interface PricingResponse {
  tiers: Record<string, PricingTier>;
  currency: string;
  period: string;
}

export class PeysError extends Error {
  constructor(
    message: string,
    public code?: string,
    public statusCode?: number
  ) {
    super(message);
    this.name = 'PeysError';
  }
}

export class Peys {
  private apiKey: string;
  private baseUrl: string;

  constructor(config: PeysConfig) {
    this.apiKey = config.apiKey;
    this.baseUrl = config.baseUrl || 'https://api.peys.io';
  }

  private async request<T>(
    endpoint: string,
    options: RequestInit = {}
  ): Promise<T> {
    const url = `${this.baseUrl}${endpoint}`;
    
    const response = await fetch(url, {
      ...options,
      headers: {
        'Content-Type': 'application/json',
        'X-API-Key': this.apiKey,
        ...options.headers,
      },
    });

    if (!response.ok) {
      const error = await response.json().catch(() => ({ error: 'Request failed' }));
      throw new PeysError(
        error.error || error.message || 'Request failed',
        error.code,
        response.status
      );
    }

    return response.json();
  }

  async createPayment(options: CreatePaymentOptions): Promise<Payment> {
    return this.request<Payment>('/v1/payments', {
      method: 'POST',
      body: JSON.stringify(options),
    });
  }

  async getPayment(paymentId: string): Promise<Payment> {
    return this.request<Payment>(`/v1/payments/${paymentId}`);
  }

  async listPayments(options: ListPaymentsOptions = {}): Promise<PaymentListResponse> {
    const params = new URLSearchParams();
    if (options.limit) params.append('limit', options.limit.toString());
    if (options.offset) params.append('offset', options.offset.toString());
    if (options.status) params.append('status', options.status);
    
    const query = params.toString();
    return this.request<PaymentListResponse>(`/v1/payments${query ? `?${query}` : ''}`);
  }

  async claimPayment(paymentId: string, options: ClaimPaymentOptions): Promise<{ success: boolean; claimedAt: string }> {
    return this.request(`/v1/payments/${paymentId}/claim`, {
      method: 'POST',
      body: JSON.stringify(options),
    });
  }

  async refundPayment(paymentId: string): Promise<{ success: boolean; refundedAt: string }> {
    return this.request(`/v1/payments/${paymentId}/refund`, {
      method: 'POST',
    });
  }

  async createWebhook(options: CreateWebhookOptions): Promise<Webhook> {
    return this.request<Webhook>('/v1/webhooks', {
      method: 'POST',
      body: JSON.stringify(options),
    });
  }

  async listWebhooks(): Promise<WebhookListResponse> {
    return this.request<WebhookListResponse>('/v1/webhooks');
  }

  async deleteWebhook(webhookId: string): Promise<{ success: boolean }> {
    return this.request(`/v1/webhooks/${webhookId}`, {
      method: 'DELETE',
    });
  }

  async getUsage(): Promise<UsageResponse> {
    return this.request<UsageResponse>('/v1/usage');
  }

  async getAccount(): Promise<AccountResponse> {
    return this.request<AccountResponse>('/v1/account');
  }

  async getPricing(): Promise<PricingResponse> {
    return this.request<PricingResponse>('/v1/pricing');
  }

  static createPaymentLink(claimLink: string): string {
    return `${this.prototype.baseUrl}/claim/${claimLink}`;
  }
}

export default Peys;
