-- ============================================
-- Webhook Security Tables Migration
-- ============================================
-- Adds tables for rate limiting, nonce tracking, and webhook retry support

-- Rate limiting table for webhook dispatcher
CREATE TABLE IF NOT EXISTS webhook_rate_limits (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  ip_address TEXT NOT NULL,
  request_count INTEGER DEFAULT 1,
  window_start TIMESTAMPTZ DEFAULT NOW(),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(ip_address)
);

-- Index for faster lookups
CREATE INDEX IF NOT EXISTS idx_webhook_rate_limits_ip ON webhook_rate_limits(ip_address);

-- Nonce tracking table to prevent replay attacks
CREATE TABLE IF NOT EXISTS webhook_nonces (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  nonce TEXT NOT NULL UNIQUE,
  processed_at TIMESTAMPTZ NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Index for faster nonce lookups and cleanup
CREATE INDEX IF NOT EXISTS idx_webhook_nonces_processed_at ON webhook_nonces(processed_at);

-- Enhanced webhook_deliveries table with retry support
-- Note: This assumes the table exists, so we use ALTER for existing table
DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'webhook_deliveries' AND column_name = 'retry_count') THEN
    ALTER TABLE webhook_deliveries ADD COLUMN retry_count INTEGER DEFAULT 0;
  END IF;
  
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'webhook_deliveries' AND column_name = 'next_retry_at') THEN
    ALTER TABLE webhook_deliveries ADD COLUMN next_retry_at TIMESTAMPTZ;
  END IF;
  
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'webhook_deliveries' AND column_name = 'status') THEN
    ALTER TABLE webhook_deliveries ADD COLUMN status TEXT DEFAULT 'pending';
  END IF;
END $$;

-- Create retry queue table for failed webhook deliveries
CREATE TABLE IF NOT EXISTS webhook_retries (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  delivery_id UUID REFERENCES webhook_deliveries(id),
  webhook_id UUID REFERENCES webhooks(id),
  event_type TEXT NOT NULL,
  payload JSONB NOT NULL,
  retry_count INTEGER DEFAULT 0,
  next_retry_at TIMESTAMPTZ NOT NULL,
  status TEXT DEFAULT 'pending',
  last_error TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Index for fetching pending retries
CREATE INDEX IF NOT EXISTS idx_webhook_retries_status_next ON webhook_retries(status, next_retry_at) WHERE status = 'pending';

-- Add RLS policies for webhook security tables
ALTER TABLE webhook_rate_limits ENABLE ROW LEVEL SECURITY;
ALTER TABLE webhook_nonces ENABLE ROW LEVEL SECURITY;
ALTER TABLE webhook_retries ENABLE ROW LEVEL SECURITY;

-- Service role can do anything
CREATE POLICY "Service role full access rate_limits" ON webhook_rate_limits
  FOR ALL USING (auth.role() = 'service_role');

CREATE POLICY "Service role full access nonces" ON webhook_nonces
  FOR ALL USING (auth.role() = 'service_role');

CREATE POLICY "Service role full access retries" ON webhook_retries
  FOR ALL USING (auth.role() = 'service_role');

-- Function to clean up old rate limit entries (older than 1 hour)
CREATE OR REPLACE FUNCTION cleanup_old_rate_limits()
RETURNS void AS $$
BEGIN
  DELETE FROM webhook_rate_limits 
  WHERE window_start < NOW() - INTERVAL '1 hour';
END;
$$ LANGUAGE plpgsql;

-- Function to clean up old nonces (older than 48 hours)
CREATE OR REPLACE FUNCTION cleanup_old_nonces()
RETURNS void AS $$
BEGIN
  DELETE FROM webhook_nonces 
  WHERE processed_at < NOW() - INTERVAL '48 hours';
END;
$$ LANGUAGE plpgsql;

-- Grant execute on functions
GRANT EXECUTE ON FUNCTION cleanup_old_rate_limits() TO service_role;
GRANT EXECUTE ON FUNCTION cleanup_old_nonces() TO service_role;

-- Comments for documentation
COMMENT ON TABLE webhook_rate_limits IS 'Tracks webhook API rate limits per IP address';
COMMENT ON TABLE webhook_nonces IS 'Tracks processed nonces to prevent replay attacks';
COMMENT ON TABLE webhook_retries IS 'Queue for retrying failed webhook deliveries';
