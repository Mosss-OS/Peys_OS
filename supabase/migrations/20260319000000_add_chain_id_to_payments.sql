-- Add chain_id to payments table so the claim page knows which network to use
ALTER TABLE public.payments ADD COLUMN IF NOT EXISTS chain_id INTEGER;
