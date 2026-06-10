-- ============================================
-- PeyDot Magic Links - Database Schema
-- Run this in Supabase SQL Editor
-- ============================================

-- Create profiles table for user wallet mapping
CREATE TABLE public.profiles (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL UNIQUE REFERENCES auth.users(id) ON DELETE CASCADE,
  email TEXT,
  wallet_address TEXT,
  display_name TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Profiles are viewable by everyone"
  ON public.profiles FOR SELECT USING (true);

CREATE POLICY "Users can update their own profile"
  ON public.profiles FOR UPDATE USING (auth.uid() = user_id);

CREATE POLICY "Users can insert  ON public.pro their own profile"
files FOR INSERT WITH CHECK (auth.uid() = user_id);

-- Create payments table to track escrow payments and claim links
CREATE TABLE public.payments (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  payment_id TEXT NOT NULL UNIQUE,
  sender_user_id UUID NOT NULL REFERENCES auth.users(id),
  sender_email TEXT NOT NULL,
  sender_wallet TEXT,
  recipient_email TEXT NOT NULL,
  amount NUMERIC NOT NULL CHECK (amount > 0),
  token TEXT NOT NULL CHECK (token IN ('USDC', 'USDT')),
  memo TEXT,
  claim_secret TEXT NOT NULL,
  claim_link TEXT NOT NULL UNIQUE,
  blockchain_payment_id TEXT,
  status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'claimed', 'expired', 'refunded')),
  tx_hash TEXT,
  claimed_by_user_id UUID REFERENCES auth.users(id),
  claimed_at TIMESTAMP WITH TIME ZONE,
  expires_at TIMESTAMP WITH TIME ZONE NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

ALTER TABLE public.payments ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can view payments"
  ON public.payments FOR SELECT USING (true);

CREATE POLICY "Authenticated users can create payments"
  ON public.payments FOR INSERT WITH CHECK (auth.uid() = sender_user_id);

CREATE POLICY "Recipients can claim payments"
  ON public.payments FOR UPDATE USING (status = 'pending');

-- Create notifications table
CREATE TABLE public.notifications (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  type TEXT NOT NULL CHECK (type IN ('payment_received', 'payment_claimed', 'payment_expired', 'payment_refunded')),
  title TEXT NOT NULL,
  message TEXT NOT NULL,
  payment_id UUID REFERENCES public.payments(id),
  read BOOLEAN NOT NULL DEFAULT false,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

ALTER TABLE public.notifications ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view their own notifications"
  ON public.notifications FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can update their own notifications"
  ON public.notifications FOR UPDATE USING (auth.uid() = user_id);

CREATE POLICY "Anyone can insert notifications"
  ON public.notifications FOR INSERT WITH CHECK (true);

-- Timestamp update function
CREATE OR REPLACE FUNCTION public.update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SET search_path = public;

CREATE TRIGGER update_profiles_updated_at
  BEFORE UPDATE ON public.profiles
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_payments_updated_at
  BEFORE UPDATE ON public.payments
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- Auto-create profile on signup
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.profiles (user_id, email)
  VALUES (NEW.id, NEW.email);
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- Function to notify recipient
CREATE OR REPLACE FUNCTION public.notify_recipient(
  p_recipient_email TEXT,
  p_title TEXT,
  p_message TEXT,
  p_payment_id UUID,
  p_type TEXT DEFAULT 'payment_received'
)
RETURNS VOID AS $$
DECLARE
  v_user_id UUID;
BEGIN
  SELECT user_id INTO v_user_id
  FROM public.profiles
  WHERE email = p_recipient_email
  LIMIT 1;

  IF v_user_id IS NOT NULL THEN
    INSERT INTO public.notifications (user_id, type, title, message, payment_id)
    VALUES (v_user_id, p_type, p_title, p_message, p_payment_id);
  END IF;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

-- ============================================
-- Batch Payments Support
-- ============================================

-- Create batches table
CREATE TABLE public.batches (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  total_amount NUMERIC NOT NULL,
  recipient_count INTEGER NOT NULL,
  status TEXT NOT NULL DEFAULT 'processing' CHECK (status IN ('processing', 'completed', 'aborted', 'failed')),
  completed_at TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

ALTER TABLE public.batches ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view their own batches"
  ON public.batches FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can create their own batches"
  ON public.batches FOR INSERT WITH CHECK (auth.uid() = user_id);

-- Add batch_id to payments table
ALTER TABLE public.payments
ADD COLUMN batch_id UUID REFERENCES public.batches(id);

-- Create trigger for batches updated_at
CREATE TRIGGER update_batches_updated_at
  BEFORE UPDATE ON public.batches
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
