REVOKE SELECT ON public.events FROM anon, authenticated;
GRANT SELECT (
  id, title, description, event_type, custom_type,
  starts_at, ends_at, location_name, lat, lng, link,
  contact, flyer_url, co_organizers, extra_organizer_names,
  source, approved, created_by, created_at, updated_at, layer_id
) ON public.events TO anon, authenticated;
GRANT INSERT, UPDATE, DELETE ON public.events TO authenticated;
GRANT ALL ON public.events TO service_role;