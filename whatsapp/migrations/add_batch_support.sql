-- Add batch support to payments table
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

-- Update payment policies to include batch_id
-- (Existing policies should still work)

-- Create trigger for batches updated_at
CREATE TRIGGER update_batches_updated_at
  BEFORE UPDATE ON public.batches
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
