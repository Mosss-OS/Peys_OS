-- ============================================
-- WhatsApp Bot Database Schema
-- Same tables as main app for consistency
-- ============================================

-- This file documents the required tables.
-- Actual migrations are in the main project's supabase/migrations folder.
-- Run: supabase db push from the main project to apply all migrations.

-- ============================================
-- Required Tables (created by main project migrations)
-- ============================================

-- PROFILES TABLE
-- Main project migration: 20260308212624_6ace508f-5de8-4886-ad78-8cbd84d218c1.sql
-- WhatsApp additions: 20260312000000_whatsapp_schema.sql
/*
CREATE TABLE public.profiles (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID UNIQUE REFERENCES auth.users(id) ON DELETE CASCADE,
  email TEXT,
  wallet_address TEXT,
  display_name TEXT,
  -- WhatsApp fields (from 20260312000000)
  phone_number TEXT UNIQUE,
  whatsapp_id TEXT UNIQUE,
  passcode_hash TEXT,
  whatsapp_linked BOOLEAN DEFAULT false,
  primary_wallet_address TEXT,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);
*/

-- WHATSAPP SESSIONS TABLE
-- Main project migration: 20260312000000_whatsapp_schema.sql
/*
CREATE TABLE public.whatsapp_sessions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE,
  phone_number TEXT UNIQUE NOT NULL,
  whatsapp_jid TEXT,
  session_data JSONB,
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);
*/

-- WHATSAPP COMMANDS TABLE (Audit log)
-- Main project migration: 20260312000000_whatsapp_schema.sql
/*
CREATE TABLE public.whatsapp_commands (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES public.profiles(id) ON DELETE SET NULL,
  phone_number TEXT NOT NULL,
  command TEXT NOT NULL,
  parameters JSONB,
  response TEXT,
  status TEXT DEFAULT 'success',
  error_message TEXT,
  executed_at TIMESTAMPTZ DEFAULT now()
);
*/

-- WALLETS TABLE
-- Main project migration: 20260312100000_whatsapp_core_tables.sql
/*
CREATE TABLE public.wallets (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  profile_id UUID REFERENCES public.profiles(id) ON DELETE SET NULL,
  wallet_address TEXT UNIQUE NOT NULL,
  wallet_type TEXT DEFAULT 'privy',
  chain_id INTEGER DEFAULT 8453,
  chain_name TEXT DEFAULT 'base-sepolia',
  is_primary BOOLEAN DEFAULT true,
  privy_user_id TEXT,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);
*/

-- TRANSACTIONS TABLE
-- Main project migration: 20260312100000_whatsapp_core_tables.sql
/*
CREATE TABLE public.transactions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tx_hash TEXT UNIQUE,
  user_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  profile_id UUID REFERENCES public.profiles(id) ON DELETE SET NULL,
  type TEXT NOT NULL CHECK (type IN ('send', 'receive', 'escrow_create', 'escrow_claim', 'escrow_refund', 'deposit', 'withdraw')),
  amount BIGINT NOT NULL,
  amount_usd FLOAT,
  token TEXT NOT NULL DEFAULT 'USDC',
  status TEXT DEFAULT 'pending',
  recipient_phone TEXT,
  recipient_wallet TEXT,
  sender_wallet TEXT,
  escrow_id TEXT,
  fee BIGINT DEFAULT 0,
  memo TEXT,
  block_number INTEGER,
  metadata JSONB DEFAULT '{}',
  created_at TIMESTAMPTZ DEFAULT now(),
  confirmed_at TIMESTAMPTZ,
  updated_at TIMESTAMPTZ DEFAULT now()
);
*/

-- ESCROW PAYMENTS TABLE
-- Main project migration: 20260312100000_whatsapp_core_tables.sql
/*
CREATE TABLE public.escrow_payments (
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
  status TEXT DEFAULT 'pending',
  tx_hash TEXT,
  memo TEXT,
  metadata JSONB DEFAULT '{}',
  created_at TIMESTAMPTZ DEFAULT now(),
  claimed_at TIMESTAMPTZ,
  refunded_at TIMESTAMPTZ,
  updated_at TIMESTAMPTZ DEFAULT now()
);
*/

-- NOTIFICATIONS TABLE
-- Main project migration: 20260308212624_6ace508f-5de8-4886-ad78-8cbd84d218c1.sql
/*
CREATE TABLE public.notifications (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  type TEXT NOT NULL,
  title TEXT NOT NULL,
  message TEXT NOT NULL,
  payment_id UUID REFERENCES public.payments(id),
  read BOOLEAN DEFAULT false,
  created_at TIMESTAMPTZ DEFAULT now()
);
*/

-- ============================================
-- Indexes (created by main project migrations)
-- ============================================

/*
-- WhatsApp Sessions
CREATE INDEX idx_whatsapp_sessions_phone ON public.whatsapp_sessions(phone_number);
CREATE INDEX idx_whatsapp_sessions_user ON public.whatsapp_sessions(user_id);

-- WhatsApp Commands  
CREATE INDEX idx_whatsapp_commands_phone ON public.whatsapp_commands(phone_number);
CREATE INDEX idx_whatsapp_commands_user ON public.whatsapp_commands(user_id);
CREATE INDEX idx_whatsapp_commands_executed ON public.whatsapp_commands(executed_at DESC);

-- Wallets
CREATE INDEX idx_wallets_profile ON public.wallets(profile_id);
CREATE INDEX idx_wallets_address ON public.wallets(wallet_address);

-- Transactions
CREATE INDEX idx_transactions_profile ON public.transactions(profile_id);
CREATE INDEX idx_transactions_hash ON public.transactions(tx_hash);
CREATE INDEX idx_transactions_status ON public.transactions(status);
CREATE INDEX idx_transactions_created ON public.transactions(created_at DESC);
CREATE INDEX idx_transactions_phone ON public.transactions(recipient_phone);

-- Escrow
CREATE INDEX idx_escrow_payment_id ON public.escrow_payments(payment_id);
CREATE INDEX idx_escrow_recipient ON public.escrow_payments(recipient_phone);
CREATE INDEX idx_escrow_status ON public.escrow_payments(status);
CREATE INDEX idx_escrow_claim_code ON public.escrow_payments(claim_code);
*/
