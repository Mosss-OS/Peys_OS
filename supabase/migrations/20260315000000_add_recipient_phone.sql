-- Add recipient_phone column to payments table for phone-based payments
ALTER TABLE public.payments 
ADD COLUMN IF NOT EXISTS recipient_phone TEXT;
