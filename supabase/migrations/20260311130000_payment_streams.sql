-- Streaming payments table
-- Note: Full streaming implementation requires smart contract
-- This provides database storage for stream metadata

CREATE TABLE IF NOT EXISTS public.payment_streams (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES auth.users(id),
  wallet_address TEXT,
  recipient_address TEXT NOT NULL,
  recipient_email TEXT,
  token TEXT NOT NULL CHECK (token IN ('USDC', 'USDT')),
  total_amount NUMERIC NOT NULL CHECK (total_amount > 0),
  streamed_amount NUMERIC NOT NULL DEFAULT 0,
  rate_per_second NUMERIC NOT NULL,
  status TEXT NOT NULL DEFAULT 'active' CHECK (status IN ('active', 'paused', 'completed', 'cancelled')),
  started_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  ends_at TIMESTAMP WITH TIME ZONE NOT NULL,
  cancelled_at TIMESTAMP WITH TIME ZONE,
  memo TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

ALTER TABLE public.payment_streams ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view their own streams"
  ON public.payment_streams FOR SELECT
  USING (auth.uid() = user_id OR wallet_address IS NOT NULL);

CREATE POLICY "Authenticated users can create streams"
  ON public.payment_streams FOR INSERT
  WITH CHECK (auth.uid() = user_id OR wallet_address IS NOT NULL);

CREATE POLICY "Users can update their own streams"
  ON public.payment_streams FOR UPDATE
  USING (auth.uid() = user_id OR wallet_address IS NOT NULL);

CREATE POLICY "Users can delete their own streams"
  ON public.payment_streams FOR DELETE
  USING (auth.uid() = user_id OR wallet_address IS NOT NULL);

CREATE TRIGGER update_payment_streams_updated_at
  BEFORE UPDATE ON public.payment_streams
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
