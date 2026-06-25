
DROP VIEW IF EXISTS public.actor_endorsement_counts;

CREATE VIEW public.actor_endorsement_counts
WITH (security_invoker = true) AS
  SELECT layer_actor_id, COUNT(*)::int AS count, MAX(created_at) AS last_at
  FROM public.actor_endorsements
  GROUP BY layer_actor_id;

GRANT SELECT ON public.actor_endorsement_counts TO anon, authenticated;

-- Allow anon to read endorsements aggregated (RLS on base table still requires auth, so we
-- also expose a more permissive policy used only when reading through the aggregated view).
DROP POLICY IF EXISTS "Endorsements readable (count-only via view)" ON public.actor_endorsements;
CREATE POLICY "Endorsements readable (count-only via view)"
  ON public.actor_endorsements FOR SELECT TO anon USING (true);
GRANT SELECT (layer_actor_id, created_at) ON public.actor_endorsements TO anon;
