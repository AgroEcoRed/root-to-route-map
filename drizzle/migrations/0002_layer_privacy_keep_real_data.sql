CREATE OR REPLACE FUNCTION public.layer_actors_privacy_sync()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  p jsonb;
BEGIN
  IF current_setting('app.applying_privacy', true) = '1' THEN
    RETURN NEW;
  END IF;
  SELECT privacy INTO p FROM public.data_source_settings WHERE source_id = NEW.source_id;
  p := COALESCE(p, '{}'::jsonb);
  IF NOT (COALESCE((p->>'hide_contact')::boolean,false) OR COALESCE((p->>'blur_location')::boolean,false) OR COALESCE((p->>'hide_type')::boolean,false))
     AND NOT EXISTS (SELECT 1 FROM public.layer_actor_private WHERE layer_actor_id = NEW.id) THEN
    RETURN NEW;
  END IF;

  IF TG_OP = 'INSERT' OR NOT EXISTS (SELECT 1 FROM public.layer_actor_private WHERE layer_actor_id = NEW.id) THEN
    INSERT INTO public.layer_actor_private (layer_actor_id, source_id, lat, lng, contact, actor_type, family)
    VALUES (NEW.id, NEW.source_id, NEW.lat, NEW.lng, NEW.contact, NEW.actor_type, NEW.family)
    ON CONFLICT (layer_actor_id) DO NOTHING;
  ELSE
    -- Solo los campos que realmente cambió quien edita pasan a la copia completa
    UPDATE public.layer_actor_private x SET
      source_id = NEW.source_id,
      lat = CASE WHEN NEW.lat IS DISTINCT FROM OLD.lat THEN NEW.lat ELSE x.lat END,
      lng = CASE WHEN NEW.lng IS DISTINCT FROM OLD.lng THEN NEW.lng ELSE x.lng END,
      contact = CASE WHEN NEW.contact IS DISTINCT FROM OLD.contact THEN NEW.contact ELSE x.contact END,
      actor_type = CASE WHEN NEW.actor_type IS DISTINCT FROM OLD.actor_type THEN NEW.actor_type ELSE x.actor_type END,
      family = CASE WHEN NEW.family IS DISTINCT FROM OLD.family THEN NEW.family ELSE x.family END,
      updated_at = now()
    WHERE x.layer_actor_id = NEW.id;
  END IF;

  IF COALESCE((p->>'blur_location')::boolean,false) THEN
    SELECT round(x.lat::numeric,2)::double precision, round(x.lng::numeric,2)::double precision INTO NEW.lat, NEW.lng
    FROM public.layer_actor_private x WHERE x.layer_actor_id = NEW.id;
  END IF;
  IF COALESCE((p->>'hide_contact')::boolean,false) THEN NEW.contact := NULL; END IF;
  IF COALESCE((p->>'hide_type')::boolean,false) THEN NEW.actor_type := NULL; NEW.family := NULL; END IF;
  RETURN NEW;
END;
$$;
REVOKE ALL ON FUNCTION public.layer_actors_privacy_sync() FROM PUBLIC, anon, authenticated;

CREATE TRIGGER layer_actors_privacy_sync
BEFORE INSERT OR UPDATE ON public.layer_actors
FOR EACH ROW EXECUTE FUNCTION public.layer_actors_privacy_sync();

CREATE OR REPLACE FUNCTION public.apply_layer_privacy(_layer_id text)
RETURNS integer
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  p jsonb;
  n integer;
BEGIN
  IF auth.uid() IS NULL OR NOT app_private.can_manage_layer(auth.uid(), _layer_id) THEN
    RAISE EXCEPTION 'forbidden';
  END IF;
  SELECT COALESCE(privacy, '{}'::jsonb) INTO p FROM public.data_source_settings WHERE source_id = _layer_id;
  p := COALESCE(p, '{}'::jsonb);
  PERFORM set_config('app.applying_privacy', '1', true);

  INSERT INTO public.layer_actor_private (layer_actor_id, source_id, lat, lng, contact, actor_type, family)
  SELECT la.id, la.source_id, la.lat, la.lng, la.contact, la.actor_type, la.family
  FROM public.layer_actors la
  WHERE la.source_id = _layer_id
    AND NOT EXISTS (SELECT 1 FROM public.layer_actor_private x WHERE x.layer_actor_id = la.id);

  UPDATE public.layer_actors la SET
    lat = CASE WHEN COALESCE((p->>'blur_location')::boolean, false) THEN round(x.lat::numeric, 2)::double precision ELSE x.lat END,
    lng = CASE WHEN COALESCE((p->>'blur_location')::boolean, false) THEN round(x.lng::numeric, 2)::double precision ELSE x.lng END,
    contact = CASE WHEN COALESCE((p->>'hide_contact')::boolean, false) THEN NULL ELSE x.contact END,
    actor_type = CASE WHEN COALESCE((p->>'hide_type')::boolean, false) THEN NULL ELSE x.actor_type END,
    family = CASE WHEN COALESCE((p->>'hide_type')::boolean, false) THEN NULL ELSE x.family END
  FROM public.layer_actor_private x
  WHERE x.layer_actor_id = la.id AND la.source_id = _layer_id;
  GET DIAGNOSTICS n = ROW_COUNT;
  PERFORM set_config('app.applying_privacy', '0', true);
  RETURN n;
END;
$$;