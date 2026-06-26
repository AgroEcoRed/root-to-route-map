
-- 1) Hide focal_email, contact_email, edit_token from the public Data API.
--    Anyone (anon or authenticated) can still read non-sensitive event fields,
--    but the personal contact email and the per-event edit token are now only
--    accessible to admins/owners through dedicated server-side flows
--    (notify-event-created + edit-event-by-token edge functions, and the new
--    get_my_event_edit_token RPC for the creator).
REVOKE SELECT ON public.events FROM anon, authenticated;
GRANT SELECT (
  id, title, description, event_type, custom_type,
  starts_at, ends_at, location_name, lat, lng, link,
  contact, contact_phone, flyer_url,
  co_organizers, extra_organizer_names, source, approved,
  created_by, created_at, updated_at,
  submitted_by_name, focal_name
) ON public.events TO anon, authenticated;

-- 2) After creating an event the owner needs the edit_token to copy the
--    edit link. Provide it through a SECURITY DEFINER RPC that returns the
--    token ONLY when the caller is the owner or an admin — never to anyone
--    else, even though they may be authenticated.
CREATE OR REPLACE FUNCTION public.get_my_event_edit_token(_event_id uuid)
RETURNS uuid
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT edit_token FROM public.events
   WHERE id = _event_id
     AND (created_by = auth.uid() OR public.has_role(auth.uid(), 'admin'::app_role))
   LIMIT 1;
$$;
REVOKE EXECUTE ON FUNCTION public.get_my_event_edit_token(uuid) FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.get_my_event_edit_token(uuid) TO authenticated, service_role;

-- 3) Split the public-readable events policy in two so anon never triggers
--    the has_role() SECURITY DEFINER check, which lets us revoke EXECUTE
--    from anon (see step 4) without breaking the public map.
DROP POLICY IF EXISTS "Public can view approved upcoming events" ON public.events;
CREATE POLICY "Anon can view approved events"
  ON public.events FOR SELECT
  TO anon
  USING (approved = true);
CREATE POLICY "Authenticated can view approved or own events"
  ON public.events FOR SELECT
  TO authenticated
  USING (
    approved = true
    OR auth.uid() = created_by
    OR public.has_role(auth.uid(), 'admin'::app_role)
  );

-- 4) Stop letting anonymous callers execute the SECURITY DEFINER helpers.
--    They are only meant to be evaluated from within RLS qual expressions
--    of *authenticated* policies and from server-side code.
REVOKE EXECUTE ON FUNCTION public.has_role(uuid, public.app_role) FROM anon, public;
GRANT EXECUTE ON FUNCTION public.has_role(uuid, public.app_role) TO authenticated, service_role;

REVOKE EXECUTE ON FUNCTION public.can_manage_layer(uuid, text) FROM anon, public;
GRANT EXECUTE ON FUNCTION public.can_manage_layer(uuid, text) TO authenticated, service_role;
