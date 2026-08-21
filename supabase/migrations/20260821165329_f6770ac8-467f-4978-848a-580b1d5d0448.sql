CREATE OR REPLACE VIEW public.public_events
WITH (security_invoker = true) AS
SELECT id, title, description, event_type, custom_type, starts_at, ends_at,
       location_name, lat, lng, link, contact, flyer_url, co_organizers,
       extra_organizer_names, source, approved, created_by, created_at,
       updated_at, layer_id
FROM public.events
WHERE approved = true;

CREATE OR REPLACE VIEW public.public_layer_actors
WITH (security_invoker = true) AS
SELECT id, source_id, name, lat, lng, actor_type, family, description, address,
       contact, delivery_days, verified_at, verified_by_role, public_visible,
       extra, created_at, updated_at, created_by, confirmation_status,
       confirmation_sent_at, confirmed_at, confirmed_by
FROM public.layer_actors;

GRANT SELECT ON public.public_events TO anon, authenticated;
GRANT SELECT ON public.public_layer_actors TO anon, authenticated;

REVOKE SELECT ON public.events FROM anon, authenticated;
REVOKE SELECT ON public.layer_actors FROM anon, authenticated;
REVOKE SELECT (contact_email, contact_phone, focal_email, edit_token) ON public.events FROM anon, authenticated;
REVOKE SELECT (confirmation_email, confirmation_phone, confirmation_token) ON public.layer_actors FROM anon, authenticated;