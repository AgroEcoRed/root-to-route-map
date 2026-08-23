CREATE OR REPLACE FUNCTION public.get_layer_events(_layer_id text)
RETURNS TABLE(
  id uuid, title text, description text, event_type public.event_type,
  custom_type text, starts_at timestamptz, ends_at timestamptz,
  location_name text, lat double precision, lng double precision,
  approved boolean, focal_name text, link text, contact text
)
LANGUAGE plpgsql
STABLE SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  IF auth.uid() IS NULL THEN RAISE EXCEPTION 'forbidden'; END IF;
  IF NOT app_private.can_manage_layer(auth.uid(), _layer_id) THEN
    RAISE EXCEPTION 'forbidden';
  END IF;
  RETURN QUERY
  SELECT e.id, e.title, e.description, e.event_type, e.custom_type,
         e.starts_at, e.ends_at, e.location_name, e.lat, e.lng,
         e.approved, e.focal_name, e.link, e.contact
  FROM public.events e
  WHERE e.layer_id = _layer_id
  ORDER BY e.starts_at ASC;
END;
$$;

REVOKE ALL ON FUNCTION public.get_layer_events(text) FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.get_layer_events(text) TO authenticated;