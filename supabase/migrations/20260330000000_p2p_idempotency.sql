-- Add idempotency_key column to p2p_orders for duplicate trade prevention
ALTER TABLE p2p_orders ADD COLUMN IF NOT EXISTS idempotency_key UUID;

CREATE INDEX IF NOT EXISTS idx_p2p_orders_idempotency ON p2p_orders(idempotency_key) WHERE idempotency_key IS NOT NULL;
