
-- Fix: actor_endorsements expose endorser identity to anon
DROP POLICY IF EXISTS "Endorsements readable (count-only via view)" ON public.actor_endorsements;
DROP POLICY IF EXISTS "Endorsements readable by all auth" ON public.actor_endorsements;
REVOKE SELECT ON public.actor_endorsements FROM anon;
REVOKE SELECT ON public.actor_endorsements FROM authenticated;
GRANT SELECT (layer_actor_id, created_at) ON public.actor_endorsements TO anon, authenticated;
-- Allow row visibility but only the granted columns above (column-level grants restrict actual access)
CREATE POLICY "Endorsements row visible (column grants restrict fields)"
  ON public.actor_endorsements FOR SELECT TO anon, authenticated USING (true);

-- Fix: layer_actors expose confirmation PII to authenticated users (already revoked from anon)
REVOKE SELECT (confirmation_email, confirmation_phone, confirmation_token) ON public.layer_actors FROM authenticated;
