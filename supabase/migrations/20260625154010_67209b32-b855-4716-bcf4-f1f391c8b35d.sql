
ALTER TABLE public.events
  ADD COLUMN IF NOT EXISTS edit_token uuid NOT NULL DEFAULT gen_random_uuid(),
  ADD COLUMN IF NOT EXISTS focal_name text,
  ADD COLUMN IF NOT EXISTS focal_email text,
  ADD COLUMN IF NOT EXISTS submitted_by_name text;

CREATE INDEX IF NOT EXISTS idx_events_edit_token ON public.events(edit_token);

ALTER TABLE public.actor_connections
  ALTER COLUMN source_profile_id DROP NOT NULL,
  ALTER COLUMN target_profile_id DROP NOT NULL,
  ADD COLUMN IF NOT EXISTS source_layer_actor_id uuid REFERENCES public.layer_actors(id) ON DELETE CASCADE,
  ADD COLUMN IF NOT EXISTS target_layer_actor_id uuid REFERENCES public.layer_actors(id) ON DELETE CASCADE;

ALTER TABLE public.actor_connections
  DROP CONSTRAINT IF EXISTS actor_connections_source_check,
  DROP CONSTRAINT IF EXISTS actor_connections_target_check,
  ADD CONSTRAINT actor_connections_source_check CHECK (
    (source_profile_id IS NOT NULL)::int + (source_layer_actor_id IS NOT NULL)::int = 1
  ),
  ADD CONSTRAINT actor_connections_target_check CHECK (
    (target_profile_id IS NOT NULL)::int + (target_layer_actor_id IS NOT NULL)::int = 1
  );

CREATE INDEX IF NOT EXISTS idx_ac_src_layer ON public.actor_connections(source_layer_actor_id);
CREATE INDEX IF NOT EXISTS idx_ac_tgt_layer ON public.actor_connections(target_layer_actor_id);

CREATE OR REPLACE FUNCTION public.get_event_by_edit_token(_token uuid)
RETURNS public.events
LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public
AS $$ SELECT * FROM public.events WHERE edit_token = _token LIMIT 1; $$;

CREATE OR REPLACE FUNCTION public.update_event_by_token(
  _token uuid,
  _title text DEFAULT NULL,
  _description text DEFAULT NULL,
  _starts_at timestamp with time zone DEFAULT NULL,
  _ends_at timestamp with time zone DEFAULT NULL,
  _location_name text DEFAULT NULL,
  _lat double precision DEFAULT NULL,
  _lng double precision DEFAULT NULL,
  _link text DEFAULT NULL,
  _contact text DEFAULT NULL,
  _contact_email text DEFAULT NULL,
  _contact_phone text DEFAULT NULL,
  _focal_name text DEFAULT NULL,
  _focal_email text DEFAULT NULL
) RETURNS public.events
LANGUAGE plpgsql SECURITY DEFINER SET search_path = public
AS $$
DECLARE r public.events;
BEGIN
  UPDATE public.events SET
    title = COALESCE(_title, title),
    description = COALESCE(_description, description),
    starts_at = COALESCE(_starts_at, starts_at),
    ends_at = COALESCE(_ends_at, ends_at),
    location_name = COALESCE(_location_name, location_name),
    lat = COALESCE(_lat, lat),
    lng = COALESCE(_lng, lng),
    link = COALESCE(_link, link),
    contact = COALESCE(_contact, contact),
    contact_email = COALESCE(_contact_email, contact_email),
    contact_phone = COALESCE(_contact_phone, contact_phone),
    focal_name = COALESCE(_focal_name, focal_name),
    focal_email = COALESCE(_focal_email, focal_email),
    updated_at = now()
  WHERE edit_token = _token
  RETURNING * INTO r;
  IF r.id IS NULL THEN RAISE EXCEPTION 'Token inválido'; END IF;
  RETURN r;
END $$;

CREATE OR REPLACE FUNCTION public.declare_connection_by_token(
  _token uuid,
  _target_layer_actor_id uuid,
  _connection_type public.connection_type,
  _note text DEFAULT NULL,
  _strength smallint DEFAULT 3
) RETURNS public.actor_connections
LANGUAGE plpgsql SECURITY DEFINER SET search_path = public
AS $$
DECLARE
  src public.layer_actors;
  r public.actor_connections;
BEGIN
  SELECT * INTO src FROM public.layer_actors WHERE confirmation_token = _token LIMIT 1;
  IF src.id IS NULL THEN RAISE EXCEPTION 'Token inválido'; END IF;
  IF src.id = _target_layer_actor_id THEN RAISE EXCEPTION 'No podés vincularte con vos mismo'; END IF;
  INSERT INTO public.actor_connections (
    source_layer_actor_id, target_layer_actor_id, connection_type, strength, note, declared
  ) VALUES (src.id, _target_layer_actor_id, _connection_type, COALESCE(_strength,3), _note, true)
  RETURNING * INTO r;
  RETURN r;
END $$;
