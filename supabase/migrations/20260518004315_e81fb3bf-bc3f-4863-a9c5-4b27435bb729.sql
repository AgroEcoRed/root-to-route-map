
-- Dimensions enum
CREATE TYPE public.transition_dimension AS ENUM (
  'agronomic',
  'ecological',
  'economic',
  'social',
  'cultural'
);

-- Periodic transition records
CREATE TABLE public.transition_records (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL,
  dimension public.transition_dimension NOT NULL,
  indicator_key TEXT NOT NULL,
  value NUMERIC NOT NULL CHECK (value >= 0 AND value <= 100),
  period_year INT NOT NULL,
  period_quarter INT CHECK (period_quarter BETWEEN 1 AND 4),
  notes TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX idx_transition_records_user ON public.transition_records(user_id);
CREATE INDEX idx_transition_records_period ON public.transition_records(period_year DESC);

ALTER TABLE public.transition_records ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Transition records viewable by everyone"
  ON public.transition_records FOR SELECT USING (true);

CREATE POLICY "Users insert own transition records"
  ON public.transition_records FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users update own transition records"
  ON public.transition_records FOR UPDATE
  USING (auth.uid() = user_id);

CREATE POLICY "Users delete own transition records"
  ON public.transition_records FOR DELETE
  USING (auth.uid() = user_id);

-- Milestones on the trajectory timeline
CREATE TABLE public.profile_milestones (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL,
  occurred_on DATE NOT NULL,
  title TEXT NOT NULL,
  description TEXT,
  milestone_type TEXT NOT NULL DEFAULT 'general',
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX idx_milestones_user ON public.profile_milestones(user_id, occurred_on DESC);

ALTER TABLE public.profile_milestones ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Milestones viewable by everyone"
  ON public.profile_milestones FOR SELECT USING (true);

CREATE POLICY "Users insert own milestones"
  ON public.profile_milestones FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users update own milestones"
  ON public.profile_milestones FOR UPDATE
  USING (auth.uid() = user_id);

CREATE POLICY "Users delete own milestones"
  ON public.profile_milestones FOR DELETE
  USING (auth.uid() = user_id);

-- Updated_at trigger (reuses existing function if present)
CREATE OR REPLACE FUNCTION public.touch_updated_at()
RETURNS TRIGGER LANGUAGE plpgsql SET search_path = public AS $$
BEGIN NEW.updated_at = now(); RETURN NEW; END $$;

CREATE TRIGGER transition_records_touch
  BEFORE UPDATE ON public.transition_records
  FOR EACH ROW EXECUTE FUNCTION public.touch_updated_at();
