
-- Add registration_completed flag to gate Google sign-in to already-registered users
ALTER TABLE public.profiles
  ADD COLUMN IF NOT EXISTS registration_completed boolean NOT NULL DEFAULT false;

-- Update handle_new_user trigger to populate ALL profile fields from signup metadata
-- This fixes the geolocation/location not being saved (caused by RLS blocking the
-- post-signup UPDATE when email confirmation is required and no session exists yet).
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $function$
DECLARE
  meta jsonb := COALESCE(NEW.raw_user_meta_data, '{}'::jsonb);
  v_actor_type public.actor_type;
  v_cert public.certification_level;
  v_products text[];
  v_lat double precision;
  v_lng double precision;
  v_completed boolean;
BEGIN
  -- Safely cast actor_type
  BEGIN
    v_actor_type := COALESCE((meta->>'actor_type')::public.actor_type, 'consumer'::public.actor_type);
  EXCEPTION WHEN others THEN
    v_actor_type := 'consumer'::public.actor_type;
  END;

  -- Safely cast certification
  BEGIN
    IF meta ? 'certification' AND meta->>'certification' IS NOT NULL THEN
      v_cert := (meta->>'certification')::public.certification_level;
    ELSE
      v_cert := 'red'::public.certification_level;
    END IF;
  EXCEPTION WHEN others THEN
    v_cert := 'red'::public.certification_level;
  END;

  -- Products array from JSON
  IF meta ? 'products' AND jsonb_typeof(meta->'products') = 'array' THEN
    SELECT array_agg(value::text) INTO v_products
    FROM jsonb_array_elements_text(meta->'products');
  END IF;

  -- Numeric coordinates
  BEGIN
    v_lat := NULLIF(meta->>'lat','')::double precision;
  EXCEPTION WHEN others THEN v_lat := NULL; END;
  BEGIN
    v_lng := NULLIF(meta->>'lng','')::double precision;
  EXCEPTION WHEN others THEN v_lng := NULL; END;

  v_completed := COALESCE((meta->>'registration_completed')::boolean, false);

  INSERT INTO public.profiles (
    user_id, display_name, actor_type, phone, location, lat, lng,
    products, capacity, production_methods, description, certification,
    registration_completed
  )
  VALUES (
    NEW.id,
    COALESCE(meta->>'display_name', meta->>'full_name', NEW.email),
    v_actor_type,
    meta->>'phone',
    meta->>'location',
    v_lat,
    v_lng,
    v_products,
    meta->>'capacity',
    meta->>'production_methods',
    meta->>'description',
    v_cert,
    v_completed
  );
  RETURN NEW;
END;
$function$;
