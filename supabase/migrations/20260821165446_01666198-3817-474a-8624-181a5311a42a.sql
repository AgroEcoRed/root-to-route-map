DROP POLICY IF EXISTS "Public can view layer actors" ON public.layer_actors;

CREATE POLICY "Public can view visible layer actors"
ON public.layer_actors
FOR SELECT
TO anon
USING (public_visible = true);

CREATE POLICY "Authenticated can view permitted layer actors"
ON public.layer_actors
FOR SELECT
TO authenticated
USING (
  public_visible = true
  OR created_by = auth.uid()
  OR app_private.can_manage_layer(auth.uid(), source_id)
);