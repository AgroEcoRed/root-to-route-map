
-- Restore column-level grants on public.events. The previous security fix
-- revoked all privileges, which blocks PostgREST from returning any rows
-- even when RLS policies would allow them. Grant SELECT on the safe public
-- columns (excluding focal_email / contact_email / edit_token PII).
GRANT SELECT (
  id, title, description, event_type, custom_type, starts_at, ends_at,
  location_name, lat, lng, link, contact, contact_phone, flyer_url,
  co_organizers, extra_organizer_names, source, approved, created_by,
  created_at, updated_at, submitted_by_name, focal_name
) ON public.events TO anon, authenticated;

GRANT INSERT, UPDATE, DELETE ON public.events TO authenticated;
GRANT ALL ON public.events TO service_role;
