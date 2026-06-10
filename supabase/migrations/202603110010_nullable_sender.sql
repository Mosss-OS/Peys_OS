-- Make sender_user_id nullable for wallet-based auth
ALTER TABLE public.payments ALTER COLUMN sender_user_id DROP NOT NULL;
