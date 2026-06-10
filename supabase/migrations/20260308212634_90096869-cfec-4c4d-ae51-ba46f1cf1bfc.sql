-- Fix: Replace overly permissive INSERT policy on notifications
-- Only allow authenticated users to insert, and restrict to service-role or own user_id
DROP POLICY "Anyone can insert notifications" ON public.notifications;

CREATE POLICY "Authenticated users can insert notifications"
  ON public.notifications FOR INSERT
  WITH CHECK (auth.uid() = user_id);

-- Fix: Tighten UPDATE policy on payments to require authentication
DROP POLICY "Recipients can claim payments" ON public.payments;

CREATE POLICY "Authenticated users can claim pending payments"
  ON public.payments FOR UPDATE
  USING (auth.uid() IS NOT NULL AND status = 'pending');