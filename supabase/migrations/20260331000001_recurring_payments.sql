-- Add frequency column to payment_links for recurring support
ALTER TABLE public.payment_links 
ADD COLUMN IF NOT EXISTS frequency TEXT DEFAULT 'one_time' 
  CHECK (frequency IN ('one_time', 'weekly', 'biweekly', 'monthly', 'quarterly'));

-- Track active subscriptions created from payment links
CREATE TABLE IF NOT EXISTS public.user_subscriptions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  payment_link_id UUID REFERENCES public.payment_links(id) ON DELETE CASCADE,
  payer_email TEXT NOT NULL,
  amount NUMERIC NOT NULL CHECK (amount > 0),
  token TEXT NOT NULL DEFAULT 'USDC',
  frequency TEXT NOT NULL CHECK (frequency IN ('weekly', 'biweekly', 'monthly', 'quarterly')),
  status TEXT NOT NULL DEFAULT 'active' CHECK (status IN ('active', 'paused', 'cancelled', 'completed')),
  next_payment_date TIMESTAMPTZ NOT NULL,
  last_payment_date TIMESTAMPTZ,
  occurrences_completed INTEGER DEFAULT 0,
  max_occurrences INTEGER,
  memo TEXT,
  metadata JSONB DEFAULT '{}',
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

ALTER TABLE public.user_subscriptions ENABLE ROW LEVEL SECURITY;

CREATE INDEX IF NOT EXISTS idx_user_subscriptions_payer ON public.user_subscriptions(payer_email);
CREATE INDEX IF NOT EXISTS idx_user_subscriptions_link ON public.user_subscriptions(payment_link_id);

-- RLS: Anyone can create a subscription (they're paying)
CREATE POLICY "Anyone can create subscriptions"
  ON public.user_subscriptions FOR INSERT
  WITH CHECK (true);

-- RLS: Payment link owners can view subscriptions on their links
CREATE POLICY "Link owners can view subscriptions"
  ON public.user_subscriptions FOR SELECT
  USING (
    payment_link_id IN (
      SELECT id FROM public.payment_links 
      WHERE user_id = auth.uid()
    )
  );

-- RLS: Link owners can update subscriptions on their links
CREATE POLICY "Link owners can update subscriptions"
  ON public.user_subscriptions FOR UPDATE
  USING (
    payment_link_id IN (
      SELECT id FROM public.payment_links 
      WHERE user_id = auth.uid()
    )
  );
