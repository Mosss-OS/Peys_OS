import { supabase } from "@/integrations/supabase/client";

/**
 * Flutterwave payment gateway integration.
 * Provides fiat on/off-ramp, bill payments, bank transfers, P2P marketplace, and virtual accounts.
 */

const FLUTTERWAVE_API_BASE = "https://api.flutterwave.com/v3";
const SANDBOX_API_BASE = "https://developersandbox-api.flutterwave.com/v3";

/** A saved bank account linked to a user for fiat withdrawals. */
interface BankAccount {
  id: string;
  user_id: string;
  bank_code: string;
  bank_name: string;
  account_number: string;
  account_name: string;
  country: string;
  is_verified: boolean;
  is_primary: boolean;
  created_at: string;
}

/** A bill payment category (airtime, data, electricity, TV, etc.). */
interface BillPayment {
  id: string;
  type: string;
  name: string;
  description?: string;
  icon?: string;
}

/** Mobile money account details for transfers. */
interface MobileMoneyAccount {
  phone: string;
  network: string;
  country: string;
}

/** Exchange rate details for a fiat-to-fiat transfer. */
interface ExchangeRate {
  source_currency: string;
  destination_currency: string;
  rate: number;
  fee: number;
  net_amount: number;
}

/** Service class wrapping all Flutterwave API interactions. */
export class FlutterwaveService {
  private secretKey: string;
  private publicKey: string;
  private isSandbox: boolean;

  /** Initializes the service with Flutterwave API keys and sandbox mode from environment variables. */
  constructor() {
    this.publicKey = import.meta.env.VITE_FLUTTERWAVE_PUBLIC_KEY || "";
    this.secretKey = import.meta.env.VITE_FLUTTERWAVE_SECRET_KEY || "";
    this.isSandbox = import.meta.env.VITE_FLUTTERWAVE_ENVIRONMENT === "sandbox";
  }

  /** Returns the correct API base URL depending on sandbox or production mode. */
  private getBaseUrl(): string {
    return this.isSandbox ? SANDBOX_API_BASE : FLUTTERWAVE_API_BASE;
  }

  /** Builds request headers. Uses the secret key for server-side calls and public key for client-side calls. */
  private getHeaders(isServer = false) {
    const key = isServer ? this.secretKey : this.publicKey;
    return {
      Authorization: `Bearer ${key}`,
      "Content-Type": "application/json",
    };
  }

  /** Fetches the list of countries supported by Flutterwave. */
  async getSupportedCountries(): Promise<any[]> {
    try {
      const response = await fetch(`${this.getBaseUrl()}/countries`, {
        headers: this.getHeaders(),
      });
      const data = await response.json();
      return data.data || [];
    } catch (error) {
      console.error("Failed to fetch countries:", error);
      return [];
    }
  }

  /** Fetches the list of banks available for a given country code. */
  async getBanks(countryCode: string): Promise<any[]> {
    try {
      const baseUrl = this.getBaseUrl();
      const response = await fetch(
        `${baseUrl}/banks/${countryCode}`,
        {
          headers: this.getHeaders(),
        }
      );
      const data = await response.json();
      
      if (data.status === "success" && data.data) {
        return data.data.map((bank: any) => ({
          code: bank.code || bank.bank_code,
          name: bank.name || bank.bank_name,
          id: bank.id,
        }));
      }
      
      throw new Error(data.message || "Failed to fetch banks from Flutterwave");
    } catch (error) {
      console.error("Failed to fetch banks:", error);
      throw error;
    }
  }

  /** Resolves a bank account number and returns the account holder name and validity. */
  async resolveAccount(
    bankCode: string,
    accountNumber: string,
    country: string
  ): Promise<{ account_name: string; is_valid: boolean }> {
    try {
      const response = await fetch(`${this.getBaseUrl()}/banks/account-resolve`, {
        method: "POST",
        headers: this.getHeaders(),
        body: JSON.stringify({
          account_number: accountNumber,
          bank_code: bankCode,
          country,
        }),
      });
      const data = await response.json();
      if (data.status === "success") {
        return {
          account_name: data.data.account_name,
          is_valid: true,
        };
      }
      return { account_name: "", is_valid: false };
    } catch (error) {
      console.error("Failed to resolve account:", error);
      throw error;
    }
  }

  /** Gets the exchange rate and fee for a fiat transfer between two currencies. */
  async getExchangeRate(
    sourceCurrency: string,
    destinationCurrency: string,
    amount: number
  ): Promise<ExchangeRate | null> {
    try {
      const response = await fetch(
        `${this.getBaseUrl()}/transfers/rates`,
        {
          method: "POST",
          headers: this.getHeaders(),
          body: JSON.stringify({
            source: { currency: sourceCurrency },
            destination: { currency: destinationCurrency, amount },
          }),
        }
      );
      const data = await response.json();
      if (data.status === "success") {
        const rate = parseFloat(data.data.rate);
        const sourceAmount = parseFloat(data.data.source.amount);
        const feePercentage = 0.01; // 1% flat fee on source amount
        const fee = sourceAmount * feePercentage;
        return {
          source_currency: sourceCurrency,
          destination_currency: destinationCurrency,
          rate,
          fee,
          net_amount: sourceAmount - fee,
        };
      }
      throw new Error(data.message || "Failed to get exchange rate from Flutterwave");
    } catch (error) {
      console.error("Failed to get exchange rate:", error);
      throw error;
    }
  }

  /** Initiates a single bank transfer to a supplied account. */
  async initiateTransfer(
    amount: number,
    currency: string,
    bankCode: string,
    accountNumber: string,
    accountName: string,
    narration?: string
  ): Promise<{ status: boolean; reference?: string; message?: string }> {
    try {
      const response = await fetch(`${this.getBaseUrl()}/transfers`, {
        method: "POST",
        headers: this.getHeaders(true),
        body: JSON.stringify({
          account_bank: bankCode,
          account_number: accountNumber,
          amount,
          currency,
          account_name: accountName,
          narration: narration || "Peydot Withdrawal",
          debit_currency: currency,
          reference: `peydot_${Date.now()}`,
        }),
      });
      const data = await response.json();

      if (data.status === "success") {
        return { status: true, reference: data.data.id };
      }
      return { status: false, message: data.message };
    } catch (error: any) {
      console.error("Transfer failed:", error);
      return { status: false, message: error.message };
    }
  }

  /** Creates a permanent virtual account number for a user to receive fiat deposits. */
  async createVirtualAccount(
    email: string,
    firstName: string,
    lastName: string,
    phone: string,
    currency: string = "NGN"
  ): Promise<{
    account_number?: string;
    bank_name?: string;
    order_ref?: string;
    response_code?: string;
    message?: string;
  }> {
    try {
      const response = await fetch(`${this.getBaseUrl()}/virtual-account-numbers`, {
        method: "POST",
        headers: this.getHeaders(true),
        body: JSON.stringify({
          email,
          first_name: firstName,
          last_name: lastName,
          phone,
          currency,
          is_permanent: true,
        }),
      });
      const data = await response.json();

      if (data.status === "success") {
        return {
          account_number: data.data.account_number,
          bank_name: data.data.bank_name,
          order_ref: data.data.order_ref,
          response_code: data.data.response_code,
        };
      }
      return { message: data.message };
    } catch (error: any) {
      console.error("Virtual account creation failed:", error);
      return { message: error.message };
    }
  }

  /** Returns the static list of supported bill payment categories (airtime, data, electricity, TV, betting, subscriptions). */
  async getBillCategories(): Promise<BillPayment[]> {
    const categories: BillPayment[] = [
      {
        id: "airtel",
        type: "airtel",
        name: "Airtel Airtime",
        description: "Buy airtime for Airtel",
        icon: "📱",
      },
      {
        id: "mtn",
        type: "mtn",
        name: "MTN Airtime",
        description: "Buy airtime for MTN",
        icon: "📱",
      },
      {
        id: "glo",
        type: "glo",
        name: "Glo Airtime",
        description: "Buy airtime for Glo",
        icon: "📱",
      },
      {
        id: "9mobile",
        type: "etisalat",
        name: "9Mobile Airtime",
        description: "Buy airtime for 9Mobile",
        icon: "📱",
      },
      {
        id: "mtn-data",
        type: "mtn-data",
        name: "MTN Data Plans",
        description: "Buy data bundles for MTN",
        icon: "📶",
      },
      {
        id: "airtel-data",
        type: "airtel-data",
        name: "Airtel Data Plans",
        description: "Buy data bundles for Airtel",
        icon: "📶",
      },
      {
        id: "glo-data",
        type: "glo-data",
        name: "Glo Data Plans",
        description: "Buy data bundles for Glo",
        icon: "📶",
      },
      {
        id: "9mobile-data",
        type: "etisalat-data",
        name: "9Mobile Data Plans",
        description: "Buy data bundles for 9Mobile",
        icon: "📶",
      },
      {
        id: "dstv",
        type: "dstv",
        name: "DStv",
        description: "Pay DStv bills",
        icon: "📺",
      },
      {
        id: "gotv",
        type: "gotv",
        name: "GOtv",
        description: "Pay GOtv bills",
        icon: "📺",
      },
      {
        id: "startimes",
        type: "startimes",
        name: "Startimes",
        description: "Pay Startimes bills",
        icon: "📺",
      },
      {
        id: "eko-electric",
        type: "ikeja-electric",
        name: "Eko Electricity",
        description: "Pay EKEDC bills",
        icon: "⚡",
      },
      {
        id: "ikeja-electric",
        type: "ikeja-electric",
        name: "Ikeja Electricity",
        description: "Pay Ikeja Electric bills",
        icon: "⚡",
      },
      {
        id: "port-harcourt-electric",
        type: "portharcourt-electric",
        name: "Port Harcourt Electricity",
        description: "Pay PHED bills",
        icon: "⚡",
      },
      {
        id: "jos-electric",
        type: "jos-electric",
        name: "Jos Electricity",
        description: "Pay JEDC bills",
        icon: "⚡",
      },
      {
        id: "kano-electric",
        type: "kano-electric",
        name: "Kano Electricity",
        description: "Pay KEDC bills",
        icon: "⚡",
      },
      {
        id: "ibadan-electric",
        type: "ibadan-electric",
        name: "Ibadan Electricity",
        description: "Pay IBEDC bills",
        icon: "⚡",
      },
      {
        id: "enugu-electric",
        type: "enugu-electric",
        name: "Enugu Electricity",
        description: "Pay EEDC bills",
        icon: "⚡",
      },
      {
        id: "bet9ja",
        type: "bet9ja",
        name: "Bet9ja",
        description: "Bet9ja betting",
        icon: "🎰",
      },
      {
        id: "showmax",
        type: "showmax",
        name: "Showmax",
        description: "Showmax subscription",
        icon: "🎬",
      },
      {
        id: "netflix",
        type: "netflix",
        name: "Netflix",
        description: "Netflix subscription",
        icon: "🎬",
      },
      {
        id: "spotify",
        type: "spotify",
        name: "Spotify",
        description: "Spotify subscription",
        icon: "🎵",
      },
      {
        id: "smile",
        type: "smile",
        name: "Smile Network",
        description: "Smile data and airtime",
        icon: "😊",
      },
      {
        id: "spectranet",
        type: "spectranet",
        name: "Spectranet",
        description: "Spectranet bills",
        icon: "📡",
      },
    ];
    return categories;
  }

  /** Returns data bundle plans for a given mobile network. */
  async getDataPlans(network: string): Promise<any[]> {
    const plans: Record<string, any[]> = {
      "mtn-data": [
        { id: "mtn_100mb", name: "100MB - 1 Day", amount: 50, validity: "1 day" },
        { id: "mtn_250mb", name: "250MB - 1 Day", amount: 100, validity: "1 day" },
        { id: "mtn_1gb", name: "1GB - 1 Day", amount: 300, validity: "1 day" },
        { id: "mtn_2gb", name: "2GB - 7 Days", amount: 500, validity: "7 days" },
        { id: "mtn_3gb", name: "3GB - 7 Days", amount: 750, validity: "7 days" },
        { id: "mtn_6gb", name: "6GB - 30 Days", amount: 1500, validity: "30 days" },
        { id: "mtn_10gb", name: "10GB - 30 Days", amount: 2500, validity: "30 days" },
        { id: "mtn_20gb", name: "20GB - 30 Days", amount: 4000, validity: "30 days" },
      ],
      "airtel-data": [
        { id: "airtel_50mb", name: "50MB - 1 Day", amount: 50, validity: "1 day" },
        { id: "airtel_100mb", name: "100MB - 1 Day", amount: 100, validity: "1 day" },
        { id: "airtel_750mb", name: "750MB - 7 Days", amount: 500, validity: "7 days" },
        { id: "airtel_1.5gb", name: "1.5GB - 7 Days", amount: 1000, validity: "7 days" },
        { id: "airtel_3gb", name: "3GB - 30 Days", amount: 1500, validity: "30 days" },
        { id: "airtel_6gb", name: "6GB - 30 Days", amount: 2500, validity: "30 days" },
        { id: "airtel_10gb", name: "10GB - 30 Days", amount: 3500, validity: "30 days" },
      ],
      "glo-data": [
        { id: "glo_100mb", name: "100MB - 1 Day", amount: 50, validity: "1 day" },
        { id: "glo_575mb", name: "575MB - 1 Day", amount: 100, validity: "1 day" },
        { id: "glo_1.35gb", name: "1.35GB - 7 Days", amount: 500, validity: "7 days" },
        { id: "glo_2.9gb", name: "2.9GB - 30 Days", amount: 1000, validity: "30 days" },
        { id: "glo_4.1gb", name: "4.1GB - 30 Days", amount: 1500, validity: "30 days" },
        { id: "glo_5.8gb", name: "5.8GB - 30 Days", amount: 2000, validity: "30 days" },
        { id: "glo_7.7gb", name: "7.7GB - 30 Days", amount: 2500, validity: "30 days" },
      ],
      "9mobile-data": [
        { id: "etisalat_500mb", name: "500MB - 1 Day", amount: 50, validity: "1 day" },
        { id: "etisalat_1.5gb", name: "1.5GB - 7 Days", amount: 500, validity: "7 days" },
        { id: "etisalat_3gb", name: "3GB - 30 Days", amount: 1000, validity: "30 days" },
        { id: "etisalat_4.5gb", name: "4.5GB - 30 Days", amount: 1500, validity: "30 days" },
        { id: "etisalat_6gb", name: "6GB - 30 Days", amount: 2000, validity: "30 days" },
        { id: "etisalat_10gb", name: "10GB - 30 Days", amount: 3000, validity: "30 days" },
      ],
    };
    return plans[network] || [];
  }

  /** Returns cable TV subscription plans for a given provider (DStv, GOtv, Startimes). */
  async getCablePlans(provider: string): Promise<any[]> {
    const plans: Record<string, any[]> = {
      dstv: [
        { id: "dstv_padi", name: "DStv Padi", amount: 2150, desc: "Most affordable" },
        { id: "dstv_yanga", name: "DStv Yanga", amount: 2650, desc: "Family friendly" },
        { id: "dstv_confam", name: "DStv Confam", amount: 5100, desc: "Sports & movies" },
        { id: "dstv_compact", name: "DStv Compact", amount: 8000, desc: "Popular choice" },
        { id: "dstv_compact_plus", name: "DStv Compact Plus", amount: 10500, desc: "More sports" },
        { id: "dstv_premium", name: "DStv Premium", amount: 18000, desc: "All channels" },
      ],
      gotv: [
        { id: "gotv_jinja", name: "GOtv Jinja", amount: 400, desc: "Basic" },
        { id: "gotv_jinja_plus", name: "GOtv Jinja Plus", amount: 800, desc: "Value" },
        { id: "gotv_smallie", name: "GOtv Smallie", amount: 1200, desc: "Small" },
        { id: "gotv_max", name: "GOtv Max", amount: 2200, desc: "HD channels" },
        { id: "gotv_supa", name: "GOtv Supa", amount: 3200, desc: "Best value" },
      ],
      startimes: [
        { id: "startimes_free", name: "Startimes Free", amount: 0, desc: "Free channels" },
        { id: "startimes_nova", name: "Nova", amount: 300, desc: "Basic" },
        { id: "startimes_smart", name: "Smart", amount: 500, desc: "Value" },
        { id: "startimes_classic", name: "Classic", amount: 900, desc: "Family" },
        { id: "startimes_unique", name: "Unique", amount: 1500, desc: "Premium" },
      ],
    };
    return plans[provider] || [];
  }

  /** Pays a bill via Flutterwave and saves the payment record to Supabase. */
  async payBill(
    userId: string,
    billType: string,
    itemCode: string,
    amount: number,
    customerId: string,
    phone: string
  ): Promise<{ success: boolean; reference?: string; message?: string }> {
    try {
      const response = await fetch(`${this.getBaseUrl()}/bills`, {
        method: "POST",
        headers: this.getHeaders(true),
        body: JSON.stringify({
          country: "NG",
          customer_id: customerId,
          amount,
          type: billType,
          reference: `peydot_bill_${Date.now()}`,
        }),
      });
      const data = await response.json();

      if (data.status === "success") {
        await this.saveBillPayment(userId, billType, itemCode, amount, data.data.reference, customerId);
        return { success: true, reference: data.data.reference };
      }
      return { success: false, message: data.message };
    } catch (error: any) {
      console.error("Bill payment failed:", error);
      throw error;
    }
  }

  /** Persists a completed bill payment record to the Supabase `bill_payments` table. */
  private async saveBillPayment(
    userId: string,
    billType: string,
    itemCode: string,
    amount: number,
    reference: string,
    customerId: string
  ) {
    try {
      await supabase.from("bill_payments").insert({
        user_id: userId,
        bill_type: billType,
        item_code: itemCode,
        amount,
        reference,
        customer_id: customerId,
        status: "completed",
      });
    } catch (error) {
      console.error("Failed to save bill payment:", error);
    }
  }

  /** Returns the list of mobile networks available for a given country. */
  async getMobileNetworks(country: string): Promise<any[]> {
    const networks: Record<string, any[]> = {
      NG: [
        { id: "mtn", name: "MTN", code: "MTN", color: "#FFCC00" },
        { id: "airtel", name: "Airtel", code: "AIRTEL", color: "#E60000" },
        { id: "glo", name: "Glo", code: "GLO", color: "#00A651" },
        { id: "9mobile", name: "9Mobile", code: "9MOBILE", color: "#00854D" },
      ],
      GH: [
        { id: "mtn-gh", name: "MTN Ghana", code: "MTN", color: "#FFCC00" },
        { id: "airtel-gh", name: "AirtelTigo", code: "TIGO", color: "#FF6B00" },
        { id: "vodafone-gh", name: "Vodafone Ghana", code: "VODAFONE", color: "#E60000" },
      ],
      KE: [
        { id: "safaricom", name: "Safaricom", code: "SAFARICOM", color: "#00A651" },
        { id: "airtel-ke", name: "Airtel Kenya", code: "AIRTEL", color: "#E60000" },
        { id: "telkom", name: "Telkom Kenya", code: "TELKOM", color: "#E31937" },
      ],
    };
    return networks[country] || [];
  }

  /** Calculates the transaction fee for a given amount and currency using the configured fee structure. */
  async getTransactionFee(amount: number, currency: string): Promise<number> {
    const feeStructure: Record<string, { percentage: number; min: number; max: number }> = {
      NGN: { percentage: 0.01, min: 50, max: 2500 },
      GHS: { percentage: 0.015, min: 1, max: 100 },
      KES: { percentage: 0.01, min: 25, max: 5000 },
      ZAR: { percentage: 0.0125, min: 5, max: 1000 },
      UGX: { percentage: 0.01, min: 1000, max: 200000 },
      TZS: { percentage: 0.01, min: 1000, max: 500000 },
      XOF: { percentage: 0.01, min: 100, max: 20000 },
      XAF: { percentage: 0.01, min: 100, max: 20000 },
    };
    const fee = feeStructure[currency] || { percentage: 0.01, min: 1, max: 100 };
    // Clamp fee between min and max after applying percentage
    return Math.min(Math.max(amount * fee.percentage, fee.min), fee.max);
  }

  /** Verifies the status of a transaction by its reference ID. */
  async verifyTransaction(reference: string): Promise<any> {
    try {
      const response = await fetch(
        `${this.getBaseUrl()}/transactions/${reference}/verify`,
        {
          headers: this.getHeaders(),
        }
      );
      const data = await response.json();
      return data.data;
    } catch (error) {
      console.error("Verification failed:", error);
      return null;
    }
  }

  /** Creates a virtual account linked to a specific user (includes user narration). */
  async createVirtualAccountClient(
    userId: string,
    email: string,
    firstName: string,
    lastName: string,
    phone: string,
    currency: string = "NGN"
  ): Promise<{
    success: boolean;
    account_number?: string;
    bank_name?: string;
    error?: string;
  }> {
    try {
      const response = await fetch(
        `${this.getBaseUrl()}/virtual-account-numbers`,
        {
          method: "POST",
          headers: this.getHeaders(true),
          body: JSON.stringify({
            email,
            first_name: firstName,
            last_name: lastName,
            phone,
            currency,
            is_permanent: true,
            narration: `Peydot-${userId.slice(0, 8)}`,
          }),
        }
      );
      const data = await response.json();

      if (data.status === "success") {
        return {
          success: true,
          account_number: data.data.account_number,
          bank_name: data.data.bank_name,
        };
      }
      return { success: false, error: data.message };
    } catch (error: any) {
      console.error("Virtual account creation failed:", error);
      return { success: false, error: error.message };
    }
  }

  /** Gets transfer rates including source/destination amounts and fee for a currency pair. */
  async getTransferRates(
    sourceCurrency: string,
    destinationCurrency: string,
    amount: number
  ): Promise<{
    rate: number;
    sourceAmount: number;
    destinationAmount: number;
    fee: number;
  } | null> {
    try {
      const response = await fetch(`${this.getBaseUrl()}/transfers/rates`, {
        method: "POST",
        headers: this.getHeaders(),
        body: JSON.stringify({
          source: { currency: sourceCurrency },
          destination: { currency: destinationCurrency, amount },
        }),
      });
      const data = await response.json();

      if (data.status === "success") {
        return {
          rate: parseFloat(data.data.rate),
          sourceAmount: parseFloat(data.data.source.amount),
          destinationAmount: parseFloat(data.data.destination.amount),
          fee: parseFloat(data.data.source.amount) * 0.01,
        };
      }
      return null;
    } catch (error) {
      console.error("Failed to get transfer rates:", error);
      return null;
    }
  }

  /** Initiates a bulk transfer to multiple bank accounts in a single request. */
  async initiateBulkTransfer(
    transfers: Array<{
      bankCode: string;
      accountNumber: string;
      accountName: string;
      amount: number;
      currency: string;
      reference: string;
    }>
  ): Promise<{ success: boolean; batchId?: string; error?: string }> {
    try {
      const response = await fetch(`${this.getBaseUrl()}/bulk-transfers`, {
        method: "POST",
        headers: this.getHeaders(true),
        body: JSON.stringify({
          title: `Peydot Bulk Transfer - ${new Date().toISOString()}`,
          transfers: transfers.map((t) => ({
            bank_code: t.bankCode,
            account_number: t.accountNumber,
            account_name: t.accountName,
            amount: t.amount,
            currency: t.currency,
            reference: t.reference,
            narration: "Peydot Withdrawal",
          })),
        }),
      });
      const data = await response.json();

      if (data.status === "success") {
        return { success: true, batchId: data.data.batch_id };
      }
      return { success: false, error: data.message };
    } catch (error: any) {
      console.error("Bulk transfer failed:", error);
      return { success: false, error: error.message };
    }
  }
}

/** Singleton instance of the Flutterwave service for use across the app. */
export const flutterwaveService = new FlutterwaveService();

/** Saves a verified bank account for a user in Supabase. Returns the saved BankAccount or null on failure. */
export async function saveBankAccount(
  userId: string,
  bankCode: string,
  bankName: string,
  accountNumber: string,
  accountName: string,
  country: string
): Promise<BankAccount | null> {
  try {
    const { data, error } = await supabase
      .from("bank_accounts")
      .insert({
        user_id: userId,
        bank_code: bankCode,
        bank_name: bankName,
        account_number: accountNumber,
        account_name: accountName,
        country,
        is_verified: true,
      })
      .select()
      .single();

    if (error) throw error;
    return data;
  } catch (error) {
    console.error("Failed to save bank account:", error);
    return null;
  }
}

/** Retrieves all bank accounts for a user, ordered by primary status and creation date. */
export async function getUserBankAccounts(userId: string): Promise<BankAccount[]> {
  try {
    const { data, error } = await supabase
      .from("bank_accounts")
      .select("*")
      .eq("user_id", userId)
      .order("is_primary", { ascending: false })
      .order("created_at", { ascending: false });

    if (error) throw error;
    return data || [];
  } catch (error) {
    console.error("Failed to fetch bank accounts:", error);
    return [];
  }
}

/** Deletes a bank account record by its ID. Returns true on success. */
export async function deleteBankAccount(accountId: string): Promise<boolean> {
  try {
    const { error } = await supabase
      .from("bank_accounts")
      .delete()
      .eq("id", accountId);

    if (error) throw error;
    return true;
  } catch (error) {
    console.error("Failed to delete bank account:", error);
    return false;
  }
}

/** Creates a fiat withdrawal record in Supabase with pending status. */
export async function createWithdrawal(
  userId: string,
  amount: number,
  amountUsdc: number,
  currency: string,
  bankAccountId: string,
  type: "direct" | "p2p",
  exchangeRate?: number,
  fee?: number
): Promise<{ id?: string; error?: string }> {
  try {
    const { data, error } = await supabase
      .from("fiat_withdrawals")
      .insert({
        user_id: userId,
        amount_fiat: amount,
        amount_usdc: amountUsdc,
        currency,
        exchange_rate: exchangeRate,
        fee,
        bank_account_id: bankAccountId,
        type,
        status: "pending",
      })
      .select()
      .single();

    if (error) throw error;
    return { id: data.id };
  } catch (error: any) {
    console.error("Failed to create withdrawal:", error);
    return { error: error.message };
  }
}

/** Returns the 50 most recent fiat withdrawals for a user, including joined bank account data. */
export async function getUserWithdrawals(userId: string): Promise<any[]> {
  try {
    const { data, error } = await supabase
      .from("fiat_withdrawals")
      .select("*, bank_accounts(*)")
      .eq("user_id", userId)
      .order("created_at", { ascending: false })
      .limit(50);

    if (error) throw error;
    return data || [];
  } catch (error) {
    console.error("Failed to fetch withdrawals:", error);
    return [];
  }
}

/** Fetches active P2P marketplace orders filtered by type and currency. */
export async function getP2POrders(
  type: "buy" | "sell",
  currency: string,
  limit: number = 20
): Promise<any[]> {
  try {
    const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
    const response = await fetch(
      `${supabaseUrl}/functions/v1/peys-p2p-marketplace/orders?type=${type}&currency=${currency}&limit=${limit}`,
      {
        headers: {
          "Content-Type": "application/json",
        },
      }
    );
    const data = await response.json();
    if (!response.ok) throw new Error(data.error || "Failed to fetch orders");
    return data?.orders || [];
  } catch (error) {
    console.error("Failed to fetch P2P orders:", error);
    return [];
  }
}

/** Creates a new P2P buy/sell order in Supabase. */
export async function createP2POrder(
  userId: string,
  type: "buy" | "sell",
  amountUsdc: number,
  pricePerUsdc: number,
  currency: string
): Promise<{ id?: string; error?: string }> {
  try {
    const totalFiat = amountUsdc * pricePerUsdc;

    const { data, error } = await supabase
      .from("p2p_orders")
      .insert({
        created_by: userId,
        type,
        amount_usdc: amountUsdc,
        price_per_usdc: pricePerUsdc,
        total_fiat: totalFiat,
        currency,
        status: "open",
      })
      .select()
      .single();

    if (error) throw error;
    return { id: data.id };
  } catch (error: any) {
    console.error("Failed to create P2P order:", error);
    return { error: error.message };
  }
}

/** Matches a P2P order via the edge function, with idempotency key support. */
export async function matchP2POrder(
  orderId: string,
  matcherId: string,
  amountUsdc?: number,
  idempotencyKey?: string
): Promise<{ success: boolean; error?: string; order?: any; idempotencyKey?: string }> {
  try {
    const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
    const { data: { session } } = await supabase.auth.getSession();
    
    const response = await fetch(`${supabaseUrl}/functions/v1/peys-p2p-marketplace/match`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "Authorization": `Bearer ${session?.access_token}`,
      },
      body: JSON.stringify({
        orderId,
        amountUsdc,
        idempotencyKey: idempotencyKey || crypto.randomUUID(),
      }),
    });
    
    const data = await response.json();
    
    if (!response.ok) {
      return { success: false, error: data.error || "Failed to match order" };
    }
    
    return { 
      success: true, 
      order: data.order, 
      idempotencyKey: data.idempotencyKey 
    };
  } catch (error: any) {
    console.error("Failed to match P2P order:", error);
    return { success: false, error: error.message };
  }
}

/** Saves a bill payment record to Supabase with phone number. */
export async function saveBillPaymentRecord(
  userId: string,
  billType: string,
  itemCode: string,
  amount: number,
  reference: string,
  customerId: string,
  phone: string
): Promise<void> {
  try {
    await supabase.from("bill_payments").insert({
      user_id: userId,
      bill_type: billType,
      item_code: itemCode,
      amount,
      reference,
      customer_id: customerId,
      phone_number: phone,
      status: "completed",
    });
  } catch (error) {
    console.error("Failed to save bill payment:", error);
  }
}

/** Returns recent bill payment records for a user, ordered by creation date. */
export async function getUserBillPayments(
  userId: string,
  limit: number = 20
): Promise<any[]> {
  try {
    const { data, error } = await supabase
      .from("bill_payments")
      .select("*")
      .eq("user_id", userId)
      .order("created_at", { ascending: false })
      .limit(limit);

    if (error) throw error;
    return data || [];
  } catch (error) {
    console.error("Failed to fetch bill payments:", error);
    return [];
  }
}

/** List of African countries supported by the fiat on/off-ramp and P2P marketplace. */
export const SUPPORTED_COUNTRIES = [
  { code: "NG", name: "Nigeria", currency: "NGN", flag: "🇳🇬" },
  { code: "GH", name: "Ghana", currency: "GHS", flag: "🇬🇭" },
  { code: "KE", name: "Kenya", currency: "KES", flag: "🇰🇪" },
  { code: "ZA", name: "South Africa", currency: "ZAR", flag: "🇿🇦" },
  { code: "UG", name: "Uganda", currency: "UGX", flag: "🇺🇬" },
  { code: "TZ", name: "Tanzania", currency: "TZS", flag: "🇹🇿" },
  { code: "RW", name: "Rwanda", currency: "RWF", flag: "🇷🇼" },
  { code: "ET", name: "Ethiopia", currency: "ETB", flag: "🇪🇹" },
  { code: "SN", name: "Senegal", currency: "XOF", flag: "🇸🇳" },
  { code: "CI", name: "Côte d'Ivoire", currency: "XOF", flag: "🇨🇮" },
  { code: "CM", name: "Cameroon", currency: "XAF", flag: "🇨🇲" },
  { code: "BF", name: "Burkina Faso", currency: "XOF", flag: "🇧🇫" },
  { code: "MW", name: "Malawi", currency: "MWK", flag: "🇲🇼" },
  { code: "ZM", name: "Zambia", currency: "ZMW", flag: "🇿🇲" },
  { code: "ZW", name: "Zimbabwe", currency: "ZWL", flag: "🇿🇼" },
];

/** Maps currency codes to their display symbols for formatting fiat amounts. */
export const CURRENCY_SYMBOLS: Record<string, string> = {
  NGN: "₦",
  GHS: "₵",
  KES: "KSh",
  ZAR: "R",
  UGX: "USh",
  TZS: "TSh",
  RWF: "FRw",
  ETB: "Br",
  XOF: "CFA",
  XAF: "FCFA",
  MWK: "MK",
  ZMW: "ZK",
  ZWL: "$",
};

/** Formats a fiat amount with the currency symbol and 2 decimal places. */
export function formatCurrency(amount: number, currency: string): string {
  const symbol = CURRENCY_SYMBOLS[currency] || currency + " ";
  return `${symbol}${amount.toLocaleString(undefined, {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  })}`;
}
