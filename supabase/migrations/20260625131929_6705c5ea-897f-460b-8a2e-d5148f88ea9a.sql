
-- Add confirmation workflow columns to layer_actors
ALTER TABLE public.layer_actors
  ADD COLUMN IF NOT EXISTS confirmation_status text NOT NULL DEFAULT 'none',
  ADD COLUMN IF NOT EXISTS confirmation_token uuid,
  ADD COLUMN IF NOT EXISTS confirmation_sent_at timestamptz,
  ADD COLUMN IF NOT EXISTS confirmation_email text,
  ADD COLUMN IF NOT EXISTS confirmation_phone text,
  ADD COLUMN IF NOT EXISTS confirmed_at timestamptz,
  ADD COLUMN IF NOT EXISTS confirmed_by uuid;

CREATE UNIQUE INDEX IF NOT EXISTS layer_actors_confirmation_token_uidx
  ON public.layer_actors (confirmation_token)
  WHERE confirmation_token IS NOT NULL;

-- Public lookup by token (no auth required)
CREATE OR REPLACE FUNCTION public.get_actor_by_token(_token uuid)
RETURNS public.layer_actors
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT * FROM public.layer_actors
  WHERE confirmation_token = _token
  LIMIT 1;
$$;
REVOKE ALL ON FUNCTION public.get_actor_by_token(uuid) FROM public;
GRANT EXECUTE ON FUNCTION public.get_actor_by_token(uuid) TO anon, authenticated;

-- Apply edits + mark status using the token (no auth required)
CREATE OR REPLACE FUNCTION public.confirm_actor_by_token(
  _token uuid,
  _decision text,         -- 'confirmed' | 'rejected'
  _name text DEFAULT NULL,
  _description text DEFAULT NULL,
  _address text DEFAULT NULL,
  _contact text DEFAULT NULL,
  _delivery_days text[] DEFAULT NULL,
  _lat double precision DEFAULT NULL,
  _lng double precision DEFAULT NULL
)
RETURNS public.layer_actors
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  row public.layer_actors;
BEGIN
  IF _decision NOT IN ('confirmed','rejected') THEN
    RAISE EXCEPTION 'Invalid decision';
  END IF;
  UPDATE public.layer_actors
     SET name = COALESCE(_name, name),
         description = COALESCE(_description, description),
         address = COALESCE(_address, address),
         contact = COALESCE(_contact, contact),
         delivery_days = COALESCE(_delivery_days, delivery_days),
         lat = COALESCE(_lat, lat),
         lng = COALESCE(_lng, lng),
         confirmation_status = _decision,
         confirmed_at = now(),
         verified_at = CASE WHEN _decision = 'confirmed' THEN now() ELSE verified_at END
   WHERE confirmation_token = _token
   RETURNING * INTO row;
  IF row.id IS NULL THEN
    RAISE EXCEPTION 'Token not found';
  END IF;
  RETURN row;
END;
$$;
REVOKE ALL ON FUNCTION public.confirm_actor_by_token(uuid, text, text, text, text, text, text[], double precision, double precision) FROM public;
GRANT EXECUTE ON FUNCTION public.confirm_actor_by_token(uuid, text, text, text, text, text, text[], double precision, double precision) TO anon, authenticated;
