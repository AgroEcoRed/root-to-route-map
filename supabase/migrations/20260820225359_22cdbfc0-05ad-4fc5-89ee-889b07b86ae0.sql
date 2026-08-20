ALTER TABLE public.layer_actors ADD COLUMN IF NOT EXISTS public_visible boolean NOT NULL DEFAULT true;

GRANT SELECT (public_visible) ON public.layer_actors TO anon, authenticated;
GRANT UPDATE (public_visible) ON public.layer_actors TO authenticated;

DROP POLICY IF EXISTS "Public can view layer actors" ON public.layer_actors;
CREATE POLICY "Public can view layer actors"
ON public.layer_actors FOR SELECT
USING (
  public_visible = true
  OR app_private.can_manage_layer(auth.uid(), source_id)
  OR created_by = auth.uid()
);

INSERT INTO public.data_source_settings (source_id, label, enabled)
VALUES ('soliverde', 'Soliverde — Solidaires (iniciativas ecológicas francófonas)', true)
ON CONFLICT (source_id) DO UPDATE SET label = EXCLUDED.label, enabled = true;