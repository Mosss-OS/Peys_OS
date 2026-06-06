CREATE TABLE IF NOT EXISTS public.api_keys (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  key TEXT NOT NULL UNIQUE,
  name TEXT NOT NULL DEFAULT 'Default',
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  rate_limit INTEGER NOT NULL DEFAULT 10,
  monthly_api_calls INTEGER NOT NULL DEFAULT 0,
  monthly_limit INTEGER NOT NULL DEFAULT 1000,
  is_active BOOLEAN NOT NULL DEFAULT true,
  locked_until TIMESTAMPTZ,
  failed_attempts INTEGER NOT NULL DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT now()
);

CREATE TABLE IF NOT EXISTS public.api_key_usage (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  api_key_id UUID NOT NULL REFERENCES public.api_keys(id) ON DELETE CASCADE,
  month TEXT NOT NULL,
  api_calls INTEGER NOT NULL DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT now(),
  UNIQUE(api_key_id, month)
);

CREATE TABLE IF NOT EXISTS public.webhooks (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  organization_id TEXT,
  url TEXT NOT NULL,
  events TEXT[] NOT NULL DEFAULT '{payment.created,payment.claimed,payment.expired,payment.refunded}',
  secret TEXT NOT NULL,
  is_active BOOLEAN NOT NULL DEFAULT true,
  last_triggered_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT now()
);

CREATE TABLE IF NOT EXISTS public.webhook_deliveries (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  webhook_id UUID NOT NULL REFERENCES public.webhooks(id) ON DELETE CASCADE,
  event_type TEXT NOT NULL,
  payload JSONB NOT NULL DEFAULT '{}',
  success BOOLEAN NOT NULL DEFAULT false,
  response_status INTEGER,
  response_body TEXT,
  duration_ms INTEGER,
  created_at TIMESTAMPTZ DEFAULT now()
);

CREATE TABLE IF NOT EXISTS public.webhook_nonces (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  nonce TEXT NOT NULL UNIQUE,
  webhook_id UUID REFERENCES public.webhooks(id) ON DELETE SET NULL,
  processed_at TIMESTAMPTZ DEFAULT now()
);

CREATE TABLE IF NOT EXISTS public.webhook_rate_limits (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  ip_address TEXT NOT NULL,
  request_count INTEGER NOT NULL DEFAULT 0,
  window_start TIMESTAMPTZ DEFAULT now(),
  created_at TIMESTAMPTZ DEFAULT now(),
  UNIQUE(ip_address)
);

CREATE OR REPLACE FUNCTION public.increment_api_call(p_api_key_id UUID, p_month TEXT)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  INSERT INTO public.api_key_usage (api_key_id, month, api_calls)
  VALUES (p_api_key_id, p_month, 1)
  ON CONFLICT (api_key_id, month)
  DO UPDATE SET api_calls = api_key_usage.api_calls + 1;

  UPDATE public.api_keys
  SET monthly_api_calls = monthly_api_calls + 1
  WHERE id = p_api_key_id;
END;
$$;

ALTER TABLE public.api_keys ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.api_key_usage ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.webhooks ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.webhook_deliveries ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.webhook_nonces ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.webhook_rate_limits ENABLE ROW LEVEL SECURITY;

CREATE INDEX IF NOT EXISTS idx_api_keys_user ON public.api_keys(user_id);
CREATE INDEX IF NOT EXISTS idx_api_keys_key ON public.api_keys(key);
CREATE INDEX IF NOT EXISTS idx_api_key_usage_key ON public.api_key_usage(api_key_id);
CREATE INDEX IF NOT EXISTS idx_api_key_usage_month ON public.api_key_usage(month);
CREATE INDEX IF NOT EXISTS idx_webhooks_user ON public.webhooks(user_id);
CREATE INDEX IF NOT EXISTS idx_webhooks_active ON public.webhooks(is_active) WHERE is_active = true;
CREATE INDEX IF NOT EXISTS idx_webhook_deliveries_webhook ON public.webhook_deliveries(webhook_id);
CREATE INDEX IF NOT EXISTS idx_webhook_nonces_nonce ON public.webhook_nonces(nonce);
CREATE INDEX IF NOT EXISTS idx_webhook_rate_limits_ip ON public.webhook_rate_limits(ip_address);
CREATE INDEX IF NOT EXISTS idx_webhook_rate_limits_window ON public.webhook_rate_limits(window_start);

CREATE POLICY "Users can view own API keys"
  ON public.api_keys FOR SELECT
  USING (user_id = auth.uid());

CREATE POLICY "Users can create own API keys"
  ON public.api_keys FOR INSERT
  WITH CHECK (user_id = auth.uid());

CREATE POLICY "Users can update own API keys"
  ON public.api_keys FOR UPDATE
  USING (user_id = auth.uid())
  WITH CHECK (user_id = auth.uid());

CREATE POLICY "Users can delete own API keys"
  ON public.api_keys FOR DELETE
  USING (user_id = auth.uid());

CREATE POLICY "Users can view own API key usage"
  ON public.api_key_usage FOR SELECT
  USING (api_key_id IN (SELECT id FROM public.api_keys WHERE user_id = auth.uid()));

CREATE POLICY "Users can view own webhooks"
  ON public.webhooks FOR SELECT
  USING (user_id = auth.uid());

CREATE POLICY "Users can create own webhooks"
  ON public.webhooks FOR INSERT
  WITH CHECK (user_id = auth.uid());

CREATE POLICY "Users can update own webhooks"
  ON public.webhooks FOR UPDATE
  USING (user_id = auth.uid())
  WITH CHECK (user_id = auth.uid());

CREATE POLICY "Users can delete own webhooks"
  ON public.webhooks FOR DELETE
  USING (user_id = auth.uid());

CREATE POLICY "Users can view own webhook deliveries"
  ON public.webhook_deliveries FOR SELECT
  USING (webhook_id IN (SELECT id FROM public.webhooks WHERE user_id = auth.uid()));
