ALTER TABLE public.events ADD COLUMN IF NOT EXISTS layer_id text;
CREATE INDEX IF NOT EXISTS events_layer_id_idx ON public.events (layer_id);

DROP POLICY IF EXISTS "Layer managers manage their layer events" ON public.events;
CREATE POLICY "Layer managers manage their layer events"
ON public.events
FOR ALL
TO authenticated
USING (layer_id IS NOT NULL AND public.can_manage_layer(auth.uid(), layer_id))
WITH CHECK (layer_id IS NOT NULL AND public.can_manage_layer(auth.uid(), layer_id));