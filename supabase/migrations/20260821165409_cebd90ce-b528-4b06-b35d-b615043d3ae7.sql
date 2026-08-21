GRANT SELECT (id, title, description, event_type, custom_type, starts_at, ends_at,
  location_name, lat, lng, link, contact, flyer_url, co_organizers,
  extra_organizer_names, source, approved, created_by, created_at, updated_at, layer_id)
ON public.events TO anon, authenticated;

GRANT SELECT (id, source_id, name, lat, lng, actor_type, family, description, address,
  contact, delivery_days, verified_at, verified_by_role, public_visible, extra,
  created_at, updated_at, created_by, confirmation_status, confirmation_sent_at,
  confirmed_at, confirmed_by)
ON public.layer_actors TO anon, authenticated;