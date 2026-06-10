CREATE TABLE IF NOT EXISTS public.collective_proposals (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  description TEXT NOT NULL,
  category TEXT NOT NULL DEFAULT 'distribution' CHECK (category IN ('distribution', 'parameter', 'development', 'community')),
  status TEXT NOT NULL DEFAULT 'active' CHECK (status IN ('active', 'passed', 'rejected', 'executed')),
  for_votes NUMERIC NOT NULL DEFAULT 0,
  against_votes NUMERIC NOT NULL DEFAULT 0,
  deadline TIMESTAMPTZ NOT NULL DEFAULT (now() + interval '14 days'),
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

CREATE TABLE IF NOT EXISTS public.collective_votes (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  proposal_id UUID REFERENCES public.collective_proposals(id) ON DELETE CASCADE,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  support BOOLEAN NOT NULL,
  weight NUMERIC NOT NULL DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT now(),
  UNIQUE(proposal_id, user_id)
);

ALTER TABLE public.collective_proposals ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.collective_votes ENABLE ROW LEVEL SECURITY;

CREATE INDEX IF NOT EXISTS idx_proposals_user ON public.collective_proposals(user_id);
CREATE INDEX IF NOT EXISTS idx_proposals_status ON public.collective_proposals(status);
CREATE INDEX IF NOT EXISTS idx_votes_proposal ON public.collective_votes(proposal_id);
CREATE INDEX IF NOT EXISTS idx_votes_user ON public.collective_votes(user_id);

CREATE POLICY "Anyone can view proposals"
  ON public.collective_proposals FOR SELECT
  USING (true);

CREATE POLICY "Users can create proposals"
  ON public.collective_proposals FOR INSERT
  WITH CHECK (user_id = auth.uid());

CREATE POLICY "Users can update own proposals"
  ON public.collective_proposals FOR UPDATE
  USING (user_id = auth.uid())
  WITH CHECK (user_id = auth.uid());

CREATE POLICY "Users can delete own proposals"
  ON public.collective_proposals FOR DELETE
  USING (user_id = auth.uid());

CREATE POLICY "Anyone can view votes"
  ON public.collective_votes FOR SELECT
  USING (true);

CREATE POLICY "Users can vote"
  ON public.collective_votes FOR INSERT
  WITH CHECK (user_id = auth.uid());

CREATE POLICY "Users can update own vote"
  ON public.collective_votes FOR UPDATE
  USING (user_id = auth.uid())
  WITH CHECK (user_id = auth.uid());
