-- 1. events: column-level SELECT privileges excluding PII + edit_token
REVOKE SELECT ON public.events FROM anon, authenticated;
GRANT SELECT (id, title, description, event_type, custom_type, starts_at, ends_at,
  location_name, lat, lng, link, contact, flyer_url, co_organizers, extra_organizer_names,
  source, approved, created_by, created_at, updated_at, submitted_by_name, focal_name)
ON public.events TO anon, authenticated;
GRANT ALL ON public.events TO service_role;

-- 2. layer_actors: hide confirmation token + contact PII
REVOKE SELECT ON public.layer_actors FROM anon, authenticated;
GRANT SELECT (id, source_id, name, lat, lng, actor_type, family, description, address,
  contact, delivery_days, verified_at, verified_by_role, extra, created_at, updated_at,
  created_by, confirmation_status, confirmation_sent_at, confirmed_at, confirmed_by)
ON public.layer_actors TO anon, authenticated;
GRANT ALL ON public.layer_actors TO service_role;

-- 3. Secure accessor for the confirmation token (admins, layer managers, creator)
CREATE OR REPLACE FUNCTION public.get_actor_confirmation_token(_id uuid)
RETURNS uuid
LANGUAGE plpgsql
STABLE SECURITY DEFINER
SET search_path TO 'public'
AS $$
DECLARE
  v_src text;
  v_owner uuid;
  v_token uuid;
BEGIN
  SELECT la.source_id, la.created_by, la.confirmation_token
    INTO v_src, v_owner, v_token
  FROM public.layer_actors la WHERE la.id = _id;
  IF v_src IS NULL THEN RETURN NULL; END IF;
  IF auth.uid() IS NULL THEN RAISE EXCEPTION 'forbidden'; END IF;
  IF NOT (public.has_role(auth.uid(), 'admin'::app_role)
          OR public.can_manage_layer(auth.uid(), v_src)
          OR v_owner = auth.uid()) THEN
    RAISE EXCEPTION 'forbidden';
  END IF;
  RETURN v_token;
END;
$$;

REVOKE ALL ON FUNCTION public.get_actor_confirmation_token(uuid) FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.get_actor_confirmation_token(uuid) TO authenticated, service_role;

-- 4. SECURITY DEFINER functions must not be callable by anonymous visitors
REVOKE EXECUTE ON FUNCTION public.get_actor_confirmation_contact(uuid) FROM anon, PUBLIC;
GRANT EXECUTE ON FUNCTION public.get_actor_confirmation_contact(uuid) TO authenticated, service_role;

REVOKE EXECUTE ON FUNCTION public.claim_referral(uuid) FROM anon, PUBLIC;
GRANT EXECUTE ON FUNCTION public.claim_referral(uuid) TO authenticated, service_role;