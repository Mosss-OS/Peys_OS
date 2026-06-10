-- Developer Platform API Keys & Webhooks
-- Issue #3: Developer Platform - REST API, SDKs, and Documentation
-- Date: 2026-03-12

-- ============================================
-- API KEYS TABLE
-- ============================================

CREATE TABLE IF NOT EXISTS public.api_keys (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  key TEXT UNIQUE NOT NULL,
  name TEXT NOT NULL,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  organization_id UUID REFERENCES public.organizations(id) ON DELETE SET NULL,
  rate_limit INTEGER DEFAULT 10,
  monthly_api_calls INTEGER DEFAULT 0,
  monthly_limit INTEGER DEFAULT 1000,
  is_active BOOLEAN DEFAULT true,
  last_used_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT now(),
  expires_at TIMESTAMPTZ
);

ALTER TABLE public.api_keys ENABLE ROW LEVEL SECURITY;

CREATE INDEX idx_api_keys_user ON public.api_keys(user_id);
CREATE INDEX idx_api_keys_org ON public.api_keys(organization_id);
CREATE INDEX idx_api_keys_key ON public.api_keys(key);

-- API Key RLS Policies
CREATE POLICY "Users can view own API keys" ON public.api_keys
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can create API keys" ON public.api_keys
  FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own API keys" ON public.api_keys
  FOR UPDATE USING (auth.uid() = user_id);

CREATE POLICY "Users can delete own API keys" ON public.api_keys
  FOR DELETE USING (auth.uid() = user_id);

-- ============================================
-- API KEY USAGE TABLE
-- ============================================

CREATE TABLE IF NOT EXISTS public.api_key_usage (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  api_key_id UUID REFERENCES public.api_keys(id) ON DELETE CASCADE,
  month TEXT NOT NULL,
  api_calls INTEGER DEFAULT 0,
  errors INTEGER DEFAULT 0,
  last_request_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT now(),
  UNIQUE(api_key_id, month)
);

ALTER TABLE public.api_key_usage ENABLE ROW LEVEL SECURITY;

CREATE INDEX idx_api_key_usage_key_month ON public.api_key_usage(api_key_id, month);

-- ============================================
-- WEBHOOKS TABLE
-- ============================================

CREATE TABLE IF NOT EXISTS public.webhooks (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  organization_id UUID REFERENCES public.organizations(id) ON DELETE SET NULL,
  url TEXT NOT NULL,
  events TEXT[] DEFAULT ARRAY['payment.created', 'payment.claimed', 'payment.expired', 'payment.refunded'],
  secret TEXT,
  is_active BOOLEAN DEFAULT true,
  last_triggered_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

ALTER TABLE public.webhooks ENABLE ROW LEVEL SECURITY;

CREATE INDEX idx_webhooks_user ON public.webhooks(user_id);
CREATE INDEX idx_webhooks_org ON public.webhooks(organization_id);

-- Webhook RLS Policies
CREATE POLICY "Users can view own webhooks" ON public.webhooks
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can create webhooks" ON public.webhooks
  FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own webhooks" ON public.webhooks
  FOR UPDATE USING (auth.uid() = user_id);

CREATE POLICY "Users can delete own webhooks" ON public.webhooks
  FOR DELETE USING (auth.uid() = user_id);

-- ============================================
-- WEBHOOK DELIVERY LOGS
-- ============================================

CREATE TABLE IF NOT EXISTS public.webhook_deliveries (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  webhook_id UUID REFERENCES public.webhooks(id) ON DELETE CASCADE,
  event_type TEXT NOT NULL,
  payload JSONB,
  response_status INTEGER,
  response_body TEXT,
  success BOOLEAN DEFAULT false,
  retry_count INTEGER DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT now()
);

ALTER TABLE public.webhook_deliveries ENABLE ROW LEVEL SECURITY;

CREATE INDEX idx_webhook_deliveries_webhook ON public.webhook_deliveries(webhook_id);
CREATE INDEX idx_webhook_deliveries_created ON public.webhook_deliveries(created_at DESC);

-- ============================================
-- PRICING TIERS TABLE
-- ============================================

CREATE TABLE IF NOT EXISTS public.pricing_tiers (
  id TEXT PRIMARY KEY,
  name TEXT NOT NULL,
  monthly_fee INTEGER DEFAULT 0,
  api_calls_included INTEGER DEFAULT 1000,
  per_request_fee NUMERIC(10, 6) DEFAULT 0.001,
  rate_limit INTEGER DEFAULT 10,
  features JSONB DEFAULT '[]',
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT now()
);

-- Insert default pricing tiers
INSERT INTO public.pricing_tiers (id, name, monthly_fee, api_calls_included, per_request_fee, rate_limit, features) VALUES
('free', 'Free', 0, 1000, 0.001, 10, '["1000 API calls/month", "Testnet only", "Community support"]'),
('pro', 'Pro', 99, 100000, 0.0005, 100, '["100K API calls/month", "Mainnet + Testnet", "Priority support", "Webhooks", "Analytics"]'),
('enterprise', 'Enterprise', 0, -1, 0.0003, 1000, '["Unlimited calls", "Dedicated support", "Custom chains", "SLA", "Account manager"]')
ON CONFLICT (id) DO NOTHING;

-- ============================================
-- SUBSCRIPTIONS TABLE
-- ============================================

CREATE TABLE IF NOT EXISTS public.subscriptions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  organization_id UUID REFERENCES public.organizations(id) ON DELETE SET NULL,
  tier_id TEXT REFERENCES public.pricing_tiers(id),
  status TEXT DEFAULT 'active' CHECK (status IN ('active', 'cancelled', 'past_due', 'trialing')),
  current_period_start TIMESTAMPTZ DEFAULT now(),
  current_period_end TIMESTAMPTZ,
  cancel_at_period_end BOOLEAN DEFAULT false,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

ALTER TABLE public.subscriptions ENABLE ROW LEVEL SECURITY;

CREATE INDEX idx_subscriptions_user ON public.subscriptions(user_id);
CREATE INDEX idx_subscriptions_org ON public.subscriptions(organization_id);
CREATE INDEX idx_subscriptions_status ON public.subscriptions(status);

-- ============================================
-- API CALLS TO PAYMENTS TABLE
-- ============================================

ALTER TABLE public.payments ADD COLUMN IF NOT EXISTS api_key_id UUID REFERENCES public.api_keys(id) ON DELETE SET NULL;
ALTER TABLE public.payments ADD COLUMN IF NOT EXISTS webhook_id UUID REFERENCES public.webhooks(id) ON DELETE SET NULL;

CREATE INDEX idx_payments_api_key ON public.payments(api_key_id);

-- ============================================
-- RPC FUNCTIONS
-- ============================================

-- Increment API call counter
CREATE OR REPLACE FUNCTION increment_api_call(p_api_key_id UUID, p_month TEXT)
RETURNS VOID AS $$
BEGIN
  INSERT INTO public.api_key_usage (api_key_id, month, api_calls, last_request_at)
  VALUES (p_api_key_id, p_month, 1, NOW())
  ON CONFLICT (api_key_id, month)
  DO UPDATE SET 
    api_calls = api_key_usage.api_calls + 1,
    last_request_at = NOW();
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Get API key info (for validation)
CREATE OR REPLACE FUNCTION get_api_key_info(p_key TEXT)
RETURNS TABLE (
  id UUID,
  user_id UUID,
  organization_id UUID,
  name TEXT,
  rate_limit INTEGER,
  monthly_api_calls INTEGER,
  monthly_limit INTEGER,
  is_active BOOLEAN
) AS $$
BEGIN
  RETURN QUERY
  SELECT 
    ak.id,
    ak.user_id,
    ak.organization_id,
    ak.name,
    ak.rate_limit,
    ak.monthly_api_calls,
    ak.monthly_limit,
    ak.is_active
  FROM public.api_keys ak
  WHERE ak.key = p_key AND ak.is_active = true;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- ============================================
-- PAYMENT STATUS ENUM
-- ============================================

DO $$ 
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'payment_status') THEN
    CREATE TYPE payment_status AS ENUM ('pending', 'claimed', 'refunded', 'expired', 'cancelled');
  END IF;
END $$;
