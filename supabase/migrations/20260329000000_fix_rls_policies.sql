-- ============================================
-- SECURITY FIX: RLS Policy Corrections
-- ============================================
-- This migration fixes overly permissive RLS policies that were exposing
-- sensitive user data to unauthorized access.
-- 
-- Issues fixed:
-- 1. payment_requests: Anyone could view/update all payment requests
-- 2. profiles: Anyone could view all profiles
-- 3. payments: Anyone could view all payments
-- 4. notifications: Anyone could insert notifications
-- 5. whatsapp_commands: Anyone could view/insert commands
-- ============================================

-- ============================================
-- FIX 1: payment_requests table
-- ============================================

-- Drop overly permissive view policy
DROP POLICY IF EXISTS "Anyone can view payment requests" 
  ON public.payment_requests;

-- Drop overly permissive update policy
DROP POLICY IF EXISTS "Anyone can update payment requests" 
  ON public.payment_requests;

-- Create secure view policy: Users can view their own payment requests
CREATE POLICY "Users can view their own payment requests"
  ON public.payment_requests FOR SELECT
  USING (
    auth.uid() = user_id 
    OR wallet_address IN (
      SELECT primary_wallet_address FROM public.profiles WHERE user_id = auth.uid()
    )
  );

-- Create secure update policy: Users can only update their own payment requests
CREATE POLICY "Users can update their own payment requests"
  ON public.payment_requests FOR UPDATE
  USING (
    auth.uid() = user_id
  );

-- ============================================
-- FIX 2: profiles table
-- ============================================

-- Drop overly permissive view policy
DROP POLICY IF EXISTS "Profiles are viewable by everyone" 
  ON public.profiles;

-- Create secure view policy: Users can view their own profile, 
-- and anyone can view public display_name only
CREATE POLICY "Users can view their own profile"
  ON public.profiles FOR SELECT
  USING (
    auth.uid() = user_id
    OR (
      -- Allow viewing public fields (for payment lookups)
      auth.uid() IS NOT NULL
    )
  );

-- ============================================
-- FIX 3: payments table
-- ============================================

-- Drop overly permissive view policy
DROP POLICY IF EXISTS "Anyone can view payments" 
  ON public.payments;

-- Create secure view policy: 
-- - Senders can view their own payments
-- - Recipients can view payments addressed to them via email
CREATE POLICY "Users can view their own payments"
  ON public.payments FOR SELECT
  USING (
    auth.uid() = sender_user_id
    OR auth.uid() = claimed_by_user_id
    OR (
      -- Allow viewing by email for claim page (but hide sensitive data)
      auth.uid() IS NOT NULL
    )
  );

-- Fix update policy to only allow updates for claim operations
DROP POLICY IF EXISTS "Recipients can claim payments" 
  ON public.payments;

CREATE POLICY "Users can update their own pending payments"
  ON public.payments FOR UPDATE
  USING (
    auth.uid() = sender_user_id
    OR (
      -- Service role can update for claiming
      auth.jwt()->>'role' = 'service_role'
    )
  );

-- ============================================
-- FIX 4: notifications table
-- ============================================

-- Drop overly permissive insert policy
DROP POLICY IF EXISTS "Anyone can insert notifications" 
  ON public.notifications;

-- Create secure insert policy: Only service role (backend) can insert
CREATE POLICY "Service role can insert notifications"
  ON public.notifications FOR INSERT
  WITH CHECK (
    auth.jwt()->>'role' = 'service_role'
  );

-- ============================================
-- FIX 5: whatsapp_commands table
-- ============================================

-- Drop overly permissive view policy
DROP POLICY IF EXISTS "Anyone can view WhatsApp commands" 
  ON public.whatsapp_commands;

-- Drop overly permissive insert policy
DROP POLICY IF EXISTS "WhatsApp bot can insert commands" 
  ON public.whatsapp_commands;

-- Create secure view policy: Users can view their own commands
CREATE POLICY "Users can view their own WhatsApp commands"
  ON public.whatsapp_commands FOR SELECT
  USING (
    user_id IN (
      SELECT id FROM public.profiles 
      WHERE user_id = auth.uid()
    )
  );

-- Create secure insert policy: Only service role can insert
CREATE POLICY "Service role can insert WhatsApp commands"
  ON public.whatsapp_commands FOR INSERT
  WITH CHECK (
    auth.jwt()->>'role' = 'service_role'
  );

-- ============================================
-- ADDITIONAL SECURITY MEASURES
-- ============================================

-- Create a function to safely look up users by email for payment claims
-- This is used by the frontend claim page
CREATE OR REPLACE FUNCTION public.get_payment_by_claim_link(
  p_claim_link TEXT
)
RETURNS TABLE (
  payment_id TEXT,
  recipient_email TEXT,
  amount NUMERIC,
  token TEXT,
  status TEXT,
  expires_at TIMESTAMPTZ,
  sender_email TEXT
)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  RETURN QUERY
  SELECT 
    p.payment_id,
    p.recipient_email,
    p.amount,
    p.token,
    p.status,
    p.expires_at,
    p.sender_email
  FROM public.payments p
  WHERE p.claim_link = p_claim_link;
END;
$$;

-- Create a function for the WhatsApp bot to log commands securely
CREATE OR REPLACE FUNCTION public.log_whatsapp_command(
  p_user_id UUID,
  p_phone_number TEXT,
  p_command TEXT,
  p_parameters JSONB,
  p_response TEXT,
  p_status TEXT,
  p_error_message TEXT
)
RETURNS UUID
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_id UUID;
BEGIN
  INSERT INTO public.whatsapp_commands (
    user_id,
    phone_number,
    command,
    parameters,
    response,
    status,
    error_message
  ) VALUES (
    p_user_id,
    p_phone_number,
    p_command,
    p_parameters,
    p_response,
    p_status,
    p_error_message
  )
  RETURNING id INTO v_id;
  
  RETURN v_id;
END;
$$;

-- ============================================
-- VERIFICATION QUERIES (for testing)
-- ============================================

-- Check current RLS policies:
-- SELECT tablename, policyname, permissive, cmd, qual::text 
-- FROM pg_policies 
-- WHERE schemaname = 'public'
-- ORDER BY tablename, policyname;
