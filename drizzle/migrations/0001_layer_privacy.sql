ALTER TABLE public.data_source_settings ADD COLUMN IF NOT EXISTS privacy jsonb NOT NULL DEFAULT '{}'::jsonb;

CREATE TABLE public.layer_actor_private (
  layer_actor_id uuid PRIMARY KEY REFERENCES public.layer_actors(id) ON DELETE CASCADE,
  source_id text NOT NULL,
  lat double precision,
  lng double precision,
  contact text,
  actor_type text,
  family text,
  updated_at timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.layer_actor_private TO authenticated;
GRANT ALL ON public.layer_actor_private TO service_role;
ALTER TABLE public.layer_actor_private ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Layer managers read private data" ON public.layer_actor_private
  FOR SELECT TO authenticated USING (app_private.can_manage_layer(auth.uid(), source_id));
CREATE POLICY "Layer managers write private data" ON public.layer_actor_private
  FOR ALL TO authenticated USING (app_private.can_manage_layer(auth.uid(), source_id))
  WITH CHECK (app_private.can_manage_layer(auth.uid(), source_id));

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

  -- Guarda los datos completos de los registros que todavía no tienen copia reservada
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
  RETURN n;
END;
$$;
REVOKE ALL ON FUNCTION public.apply_layer_privacy(text) FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.apply_layer_privacy(text) TO authenticated;