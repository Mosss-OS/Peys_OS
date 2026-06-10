-- Add user_id column to payment_links for individual freelancers
ALTER TABLE public.payment_links 
ADD COLUMN IF NOT EXISTS user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE;

CREATE INDEX IF NOT EXISTS idx_payment_links_user ON public.payment_links(user_id);

-- RLS: Users can view their own payment links
CREATE POLICY "Users can view own payment links"
  ON public.payment_links FOR SELECT
  USING (user_id = auth.uid());

-- RLS: Users can create their own payment links
CREATE POLICY "Users can create payment links"
  ON public.payment_links FOR INSERT
  WITH CHECK (user_id = auth.uid());

-- RLS: Users can update their own payment links
CREATE POLICY "Users can update own payment links"
  ON public.payment_links FOR UPDATE
  USING (user_id = auth.uid())
  WITH CHECK (user_id = auth.uid());

-- RLS: Users can delete their own payment links
CREATE POLICY "Users can delete own payment links"
  ON public.payment_links FOR DELETE
  USING (user_id = auth.uid());
