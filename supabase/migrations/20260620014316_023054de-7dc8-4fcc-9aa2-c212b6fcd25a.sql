CREATE TABLE IF NOT EXISTS public.layer_actors (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  source_id text NOT NULL,
  name text NOT NULL,
  lat double precision NOT NULL,
  lng double precision NOT NULL,
  actor_type text,
  family text,
  description text,
  address text,
  contact text,
  delivery_days text[],
  verified_at timestamptz,
  extra jsonb NOT NULL DEFAULT '{}'::jsonb,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

GRANT SELECT ON public.layer_actors TO anon;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.layer_actors TO authenticated;
GRANT ALL ON public.layer_actors TO service_role;

ALTER TABLE public.layer_actors ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Public can view layer actors"
  ON public.layer_actors FOR SELECT
  USING (true);

CREATE POLICY "Layer managers can insert layer actors"
  ON public.layer_actors FOR INSERT
  TO authenticated
  WITH CHECK (public.can_manage_layer(auth.uid(), source_id));

CREATE POLICY "Layer managers can update layer actors"
  ON public.layer_actors FOR UPDATE
  TO authenticated
  USING (public.can_manage_layer(auth.uid(), source_id))
  WITH CHECK (public.can_manage_layer(auth.uid(), source_id));

CREATE POLICY "Layer managers can delete layer actors"
  ON public.layer_actors FOR DELETE
  TO authenticated
  USING (public.can_manage_layer(auth.uid(), source_id));

CREATE INDEX IF NOT EXISTS layer_actors_source_idx ON public.layer_actors(source_id);

CREATE TRIGGER layer_actors_updated_at
  BEFORE UPDATE ON public.layer_actors
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();