CREATE TABLE public.layer_actor_links (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  layer_id text NOT NULL,
  source_actor_id uuid NOT NULL REFERENCES public.layer_actors(id) ON DELETE CASCADE,
  target_actor_id uuid NOT NULL REFERENCES public.layer_actors(id) ON DELETE CASCADE,
  link_type text NOT NULL DEFAULT 'Trabajo conjunto',
  note text,
  created_by uuid,
  created_at timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.layer_actor_links TO authenticated;
GRANT ALL ON public.layer_actor_links TO service_role;
ALTER TABLE public.layer_actor_links ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Layer team reads links" ON public.layer_actor_links FOR SELECT TO authenticated USING (public.can_manage_layer(auth.uid(), layer_id));
CREATE POLICY "Layer team adds links" ON public.layer_actor_links FOR INSERT TO authenticated WITH CHECK (public.can_manage_layer(auth.uid(), layer_id));
CREATE POLICY "Layer team edits links" ON public.layer_actor_links FOR UPDATE TO authenticated USING (public.can_manage_layer(auth.uid(), layer_id));
CREATE POLICY "Layer team deletes links" ON public.layer_actor_links FOR DELETE TO authenticated USING (public.can_manage_layer(auth.uid(), layer_id));