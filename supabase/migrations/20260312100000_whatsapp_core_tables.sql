-- WhatsApp Integration - Core Tables for Secure Payments
-- Issue #9: Refactor WhatsApp to use Supabase
-- Date: 2026-03-12

-- ============================================
-- WALLETS TABLE
-- Stores wallet addresses only (NOT private keys)
-- Security: Private keys handled by Privy SDK
-- ============================================

CREATE TABLE IF NOT EXISTS public.wallets (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  profile_id UUID REFERENCES public.profiles(id) ON DELETE SET NULL,
  wallet_address TEXT UNIQUE NOT NULL,
  wallet_type TEXT DEFAULT 'privy' CHECK (wallet_type IN ('privy', 'external')),
  chain_id INTEGER DEFAULT 8454,
  chain_name TEXT DEFAULT 'base-sepolia',
  is_primary BOOLEAN DEFAULT true,
  privy_user_id TEXT,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

ALTER TABLE public.wallets ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view their own wallets"
  ON public.wallets FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Service role can manage all wallets"
  ON public.wallets FOR ALL
  USING (auth.role() = 'service_role');

CREATE INDEX IF NOT EXISTS idx_wallets_profile ON public.wallets(profile_id);
CREATE INDEX IF NOT EXISTS idx_wallets_address ON public.wallets(wallet_address);
CREATE INDEX IF NOT EXISTS idx_wallets_user ON public.wallets(user_id);

-- ============================================
-- TRANSACTIONS TABLE
-- Full audit trail for all USDC transfers
-- ============================================

CREATE TABLE IF NOT EXISTS public.transactions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tx_hash TEXT UNIQUE,
  user_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  profile_id UUID REFERENCES public.profiles(id) ON DELETE SET NULL,
  type TEXT NOT NULL CHECK (type IN ('send', 'receive', 'escrow_create', 'escrow_claim', 'escrow_refund', 'deposit', 'withdraw')),
  amount BIGINT NOT NULL,
  amount_usd FLOAT,
  token TEXT NOT NULL DEFAULT 'USDC' CHECK (token IN ('USDC', 'USDT', 'PASS')),
  status TEXT DEFAULT 'pending' CHECK (status IN ('pending', 'confirmed', 'failed', 'cancelled')),
  recipient_phone TEXT,
  recipient_wallet TEXT,
  sender_wallet TEXT,
  escrow_id TEXT,
  fee BIGINT DEFAULT 0,
  fee_usd FLOAT,
  memo TEXT,
  block_number INTEGER,
  error_message TEXT,
  metadata JSONB DEFAULT '{}',
  created_at TIMESTAMPTZ DEFAULT now(),
  confirmed_at TIMESTAMPTZ,
  updated_at TIMESTAMPTZ DEFAULT now()
);

ALTER TABLE public.transactions ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view their own transactions"
  ON public.transactions FOR SELECT
  USING (
    auth.uid() = user_id 
    OR profile_id IN (SELECT id FROM public.profiles WHERE user_id = auth.uid())
  );

CREATE POLICY "Service role can manage all transactions"
  ON public.transactions FOR ALL
  USING (auth.role() = 'service_role');

CREATE POLICY "WhatsApp bot can insert transactions"
  ON public.transactions FOR INSERT
  WITH CHECK (true);

CREATE INDEX IF NOT EXISTS idx_transactions_profile ON public.transactions(profile_id);
CREATE INDEX IF NOT EXISTS idx_transactions_hash ON public.transactions(tx_hash);
CREATE INDEX IF NOT EXISTS idx_transactions_user ON public.transactions(user_id);
CREATE INDEX IF NOT EXISTS idx_transactions_status ON public.transactions(status);
CREATE INDEX IF NOT EXISTS idx_transactions_created ON public.transactions(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_transactions_phone ON public.transactions(recipient_phone);

-- ============================================
-- ESCROW PAYMENTS TABLE
-- Tracks PeyDot escrow contract payments
-- ============================================

CREATE TABLE IF NOT EXISTS public.escrow_payments (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  payment_id TEXT UNIQUE NOT NULL,
  secret_hash TEXT NOT NULL,
  sender_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  sender_profile_id UUID REFERENCES public.profiles(id) ON DELETE SET NULL,
  sender_wallet TEXT NOT NULL,
  recipient_phone TEXT,
  claim_code TEXT,
  amount BIGINT NOT NULL,
  amount_usd FLOAT,
  token TEXT NOT NULL DEFAULT 'USDC',
  expiry TIMESTAMPTZ NOT NULL,
  status TEXT DEFAULT 'pending' CHECK (status IN ('pending', 'claimed', 'refunded', 'expired', 'cancelled')),
  tx_hash TEXT,
  contract_tx_hash TEXT,
  memo TEXT,
  metadata JSONB DEFAULT '{}',
  created_at TIMESTAMPTZ DEFAULT now(),
  claimed_at TIMESTAMPTZ,
  refunded_at TIMESTAMPTZ,
  updated_at TIMESTAMPTZ DEFAULT now()
);

ALTER TABLE public.escrow_payments ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view their own escrow payments"
  ON public.escrow_payments FOR SELECT
  USING (
    auth.uid() = sender_id
    OR sender_profile_id IN (SELECT id FROM public.profiles WHERE user_id = auth.uid())
    OR recipient_phone IN (SELECT phone_number FROM public.profiles WHERE user_id = auth.uid())
  );

CREATE POLICY "Service role can manage all escrow payments"
  ON public.escrow_payments FOR ALL
  USING (auth.role() = 'service_role');

CREATE POLICY "Anyone can insert escrow payments"
  ON public.escrow_payments FOR INSERT
  WITH CHECK (true);

CREATE INDEX IF NOT EXISTS idx_escrow_payment_id ON public.escrow_payments(payment_id);
CREATE INDEX IF NOT EXISTS idx_escrow_sender ON public.escrow_payments(sender_id);
CREATE INDEX IF NOT EXISTS idx_escrow_recipient ON public.escrow_payments(recipient_phone);
CREATE INDEX IF NOT EXISTS idx_escrow_status ON public.escrow_payments(status);
CREATE INDEX IF NOT EXISTS idx_escrow_expiry ON public.escrow_payments(expiry);
CREATE INDEX IF NOT EXISTS idx_escrow_claim_code ON public.escrow_payments(claim_code);

-- ============================================
-- TRIGGERS FOR UPDATED_AT
-- ============================================

CREATE OR REPLACE FUNCTION public.update_wallets_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS update_wallets_updated_at ON public.wallets;
CREATE TRIGGER update_wallets_updated_at
  BEFORE UPDATE ON public.wallets
  FOR EACH ROW EXECUTE FUNCTION public.update_wallets_updated_at();

CREATE OR REPLACE FUNCTION public.update_transactions_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS update_transactions_updated_at ON public.transactions;
CREATE TRIGGER update_transactions_updated_at
  BEFORE UPDATE ON public.transactions
  FOR EACH ROW EXECUTE FUNCTION public.update_transactions_updated_at();

CREATE OR REPLACE FUNCTION public.update_escrow_payments_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS update_escrow_payments_updated_at ON public.escrow_payments;
CREATE TRIGGER update_escrow_payments_updated_at
  BEFORE UPDATE ON public.escrow_payments
  FOR EACH ROW EXECUTE FUNCTION public.update_escrow_payments_updated_at();

-- ============================================
-- FUNCTION TO AUTO-EXPIRE ESCROW PAYMENTS
-- ============================================

CREATE OR REPLACE FUNCTION public.check_expired_escrow()
RETURNS void AS $$
BEGIN
  UPDATE public.escrow_payments
  SET status = 'expired'
  WHERE status = 'pending'
  AND expiry < now();
END;
$$ LANGUAGE plpgsql;

CREATE INDEX IF NOT EXISTS idx_escrow_expires_at ON public.escrow_payments(status, expiry)
  WHERE status = 'pending';
