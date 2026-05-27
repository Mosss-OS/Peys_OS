import { z } from "https://deno.land/x/zod@v3.22.4/mod.ts";

export const paymentStatusEnum = z.enum(["pending", "claimed", "refunded", "expired"]);

export const tokenEnum = z.enum(["USDC", "USDT", "PASS", "G$"]);

export const CreatePaymentSchema = z.object({
  recipientEmail: z.string().email("Invalid email address"),
  amount: z.number().positive("Amount must be positive").max(1_000_000, "Amount exceeds maximum"),
  token: tokenEnum,
  memo: z.string().max(500, "Memo too long").optional(),
  senderWallet: z.string().regex(/^0x[a-fA-F0-9]{40}$/, "Invalid wallet address").optional(),
  idempotencyKey: z.string().uuid("Invalid idempotency key").optional(),
});

export const CreatePaymentApiSchema = z.object({
  recipient: z.string().email("Invalid email address"),
  amount: z.union([z.number().positive(), z.string()])
    .transform(val => typeof val === "string" ? parseFloat(val) : val)
    .pipe(z.number().positive("Amount must be positive").max(1_000_000, "Amount exceeds maximum")),
  token: tokenEnum,
  memo: z.string().max(500, "Memo too long").optional(),
  expiresIn: z.number().int().positive().max(90, "Expiry too long").optional(),
  idempotencyKey: z.string().uuid("Invalid idempotency key").optional(),
});

export const ClaimPaymentSchema = z.object({
  recipientWallet: z.string().regex(/^0x[a-fA-F0-9]{40}$/, "Invalid wallet address"),
  secret: z.string().min(1, "Secret required"),
});

export const GetTokenBalanceSchema = z.object({
  tokenAddress: z.string().regex(/^0x[a-fA-F0-9]{40}$/, "Invalid token address"),
  walletAddress: z.string().regex(/^0x[a-fA-F0-9]{40}$/, "Invalid wallet address"),
  chainId: z.number().int().positive().optional(),
});

export const GetTokenAllowanceSchema = z.object({
  tokenAddress: z.string().regex(/^0x[a-fA-F0-9]{40}$/, "Invalid token address"),
  ownerAddress: z.string().regex(/^0x[a-fA-F0-9]{40}$/, "Invalid owner address"),
  spenderAddress: z.string().regex(/^0x[a-fA-F0-9]{40}$/, "Invalid spender address"),
  chainId: z.number().int().positive().optional(),
});

export const PaginationSchema = z.object({
  limit: z.coerce.number().int().positive().max(100, "Limit too high").default(10),
  offset: z.coerce.number().int().min(0).default(0),
  status: paymentStatusEnum.optional(),
});

export const FlutterwaveTransferSchema = z.object({
  withdrawalId: z.string().uuid("Invalid withdrawal ID"),
  amount: z.number().positive("Amount must be positive").max(1_000_000, "Amount exceeds maximum"),
  currency: z.enum(["NGN", "USD", "EUR", "GBP"]),
  bankCode: z.string().min(1, "Bank code required"),
  accountNumber: z.string().min(8, "Invalid account number").max(11, "Invalid account number"),
  accountName: z.string().min(1, "Account name required"),
  narration: z.string().max(100, "Narration too long").optional(),
});

export const WebhookSchema = z.object({
  url: z.string().url("Invalid webhook URL"),
  events: z.array(z.string()).optional(),
  secret: z.string().optional(),
});

export function validateSchema<T>(schema: z.ZodSchema<T>, data: unknown): { success: true; data: T } | { success: false; errors: z.ZodError } {
  const result = schema.safeParse(data);
  if (result.success) {
    return { success: true, data: result.data };
  }
  return { success: false, errors: result.error };
}

export function parseSafeInt(value: string | null, defaultValue: number, min = 1, max = 100): number {
  if (!value) return defaultValue;
  const parsed = parseInt(value, 10);
  if (isNaN(parsed)) return defaultValue;
  return Math.max(min, Math.min(max, parsed));
}

export function parseSafeFloat(value: string | null, defaultValue: number, min = 0, max = 1_000_000): number {
  if (!value) return defaultValue;
  const parsed = parseFloat(value);
  if (isNaN(parsed)) return defaultValue;
  return Math.max(min, Math.min(max, parsed));
}
