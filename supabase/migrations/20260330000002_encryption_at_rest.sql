-- SEC-046: Insufficient Encryption at Rest
-- Supabase provides encryption at rest by default using AWS KMS
-- Additional column-level encryption can be enabled for sensitive fields

-- Note: Supabase Enterprise provides column-level encryption
-- For this implementation, we document the following:

-- 1. Supabase Database: All data is encrypted at rest using AES-256
-- 2. Row Level Security (RLS) is enabled on all sensitive tables
-- 3. For additional column-level encryption, use Supabase Vault:

-- Example: Add sensitive columns to vault
-- CREATE EXTENSION IF NOT EXISTS vault;

-- The following fields should be encrypted at application level for sensitive data:
-- - Payment secrets (claim_secret in payments table)
-- - API keys in profiles
-- - Wallet private keys (if stored)

-- Current RLS policies already protect data access
