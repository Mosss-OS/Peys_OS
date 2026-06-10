-- WhatsApp Integration Schema for PeyDot
-- Issue #7: Database Schema - Add WhatsApp fields to profiles
-- Date: 2026-03-12

-- ============================================
-- PROFILES TABLE UPDATES
-- ============================================

-- Add WhatsApp-specific columns to profiles
ALTER TABLE public.profiles 
ADD COLUMN IF NOT EXISTS phone_number TEXT UNIQUE,
ADD COLUMN IF NOT EXISTS whatsapp_id TEXT,
ADD COLUMN IF NOT EXISTS passcode_hash TEXT,
ADD COLUMN IF NOT EXISTS whatsapp_linked BOOLEAN DEFAULT false,
ADD COLUMN IF NOT EXISTS primary_wallet_address TEXT;

-- ============================================
-- WHATSAPP SESSIONS TABLE
-- ============================================

CREATE TABLE IF NOT EXISTS public.whatsapp_sessions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE,
  phone_number TEXT UNIQUE NOT NULL,
  whatsapp_jid TEXT,
  session_data JSONB,
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

ALTER TABLE public.whatsapp_sessions ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view their own WhatsApp sessions"
  ON public.whatsapp_sessions FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own WhatsApp sessions"
  ON public.whatsapp_sessions FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own WhatsApp sessions"
  ON public.whatsapp_sessions FOR UPDATE
  USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own WhatsApp sessions"
  ON public.whatsapp_sessions FOR DELETE
  USING (auth.uid() = user_id);

-- ============================================
-- WHATSAPP COMMANDS AUDIT LOG
-- ============================================

CREATE TABLE IF NOT EXISTS public.whatsapp_commands (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES public.profiles(id) ON DELETE SET NULL,
  phone_number TEXT NOT NULL,
  command TEXT NOT NULL,
  parameters JSONB,
  response TEXT,
  status TEXT DEFAULT 'success' CHECK (status IN ('success', 'failed', 'pending')),
  error_message TEXT,
  executed_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

ALTER TABLE public.whatsapp_commands ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can view WhatsApp commands"
  ON public.whatsapp_commands FOR SELECT
  USING (true);

CREATE POLICY "WhatsApp bot can insert commands"
  ON public.whatsapp_commands FOR INSERT
  WITH CHECK (true);

-- ============================================
-- INDEXES FOR PERFORMANCE
-- ============================================

CREATE INDEX IF NOT EXISTS idx_whatsapp_sessions_phone 
  ON public.whatsapp_sessions(phone_number);

CREATE INDEX IF NOT EXISTS idx_whatsapp_sessions_user 
  ON public.whatsapp_sessions(user_id);

CREATE INDEX IF NOT EXISTS idx_whatsapp_commands_phone 
  ON public.whatsapp_commands(phone_number);

CREATE INDEX IF NOT EXISTS idx_whatsapp_commands_user 
  ON public.whatsapp_commands(user_id);

CREATE INDEX IF NOT EXISTS idx_whatsapp_commands_executed 
  ON public.whatsapp_commands(executed_at DESC);

-- ============================================
-- TRIGGERS FOR UPDATED_AT
-- ============================================

CREATE OR REPLACE FUNCTION public.update_whatsapp_sessions_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS update_whatsapp_sessions_updated_at 
  ON public.whatsapp_sessions;

CREATE TRIGGER update_whatsapp_sessions_updated_at
  BEFORE UPDATE ON public.whatsapp_sessions
  FOR EACH ROW EXECUTE FUNCTION public.update_whatsapp_sessions_updated_at();
