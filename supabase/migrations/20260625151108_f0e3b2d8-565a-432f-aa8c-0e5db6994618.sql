
-- 1) Expand event_type enum with more categories
ALTER TYPE public.event_type ADD VALUE IF NOT EXISTS 'conferencia_jornada';
ALTER TYPE public.event_type ADD VALUE IF NOT EXISTS 'taller';
ALTER TYPE public.event_type ADD VALUE IF NOT EXISTS 'encuentro';
ALTER TYPE public.event_type ADD VALUE IF NOT EXISTS 'voluntariado';

-- 2) Free-text custom category for "Otra"
ALTER TABLE public.events ADD COLUMN IF NOT EXISTS custom_type text;

-- 3) Track who verified a layer actor: 'platform' (AgroEco.Red admin) or 'layer' (layer manager)
ALTER TABLE public.layer_actors ADD COLUMN IF NOT EXISTS verified_by_role text;

-- 4) Endorsements (votos de confianza) for layer actors
CREATE TABLE IF NOT EXISTS public.actor_endorsements (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  layer_actor_id uuid NOT NULL REFERENCES public.layer_actors(id) ON DELETE CASCADE,
  endorser_user_id uuid NOT NULL,
  endorser_display text,
  note text,
  created_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (layer_actor_id, endorser_user_id)
);

GRANT SELECT, INSERT ON public.actor_endorsements TO authenticated;
GRANT ALL ON public.actor_endorsements TO service_role;

ALTER TABLE public.actor_endorsements ENABLE ROW LEVEL SECURITY;

-- Anyone authenticated may read endorsements (counts are public-by-design within the network)
CREATE POLICY "Endorsements readable by authenticated"
  ON public.actor_endorsements FOR SELECT TO authenticated USING (true);

-- A user may endorse another actor (not themselves auto-endorsing their own claim), once per actor
CREATE POLICY "Authenticated users can endorse"
  ON public.actor_endorsements FOR INSERT TO authenticated
  WITH CHECK (endorser_user_id = auth.uid());

-- 5) Public aggregated counts (no PII) so anonymous map viewers can see the badge tier
CREATE OR REPLACE VIEW public.actor_endorsement_counts AS
  SELECT layer_actor_id, COUNT(*)::int AS count, MAX(created_at) AS last_at
  FROM public.actor_endorsements
  GROUP BY layer_actor_id;

GRANT SELECT ON public.actor_endorsement_counts TO anon, authenticated;
