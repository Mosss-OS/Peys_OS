-- Add PASS token to allowed tokens in payments table
ALTER TABLE public.payments DROP CONSTRAINT payments_token_check;
ALTER TABLE public.payments ADD CONSTRAINT payments_token_check CHECK (token IN ('USDC', 'USDT', 'PASS'));
