DROP POLICY IF EXISTS "Event flyers public read" ON storage.objects;
CREATE POLICY "Event flyers read approved or own" ON storage.objects FOR SELECT TO anon, authenticated
USING (
  bucket_id = 'event-flyers' AND (
    (auth.uid() IS NOT NULL AND (storage.foldername(name))[1] = auth.uid()::text)
    OR EXISTS (SELECT 1 FROM public.events e WHERE e.approved = true AND e.flyer_url LIKE '%/event-flyers/' || objects.name)
  )
);

DROP POLICY IF EXISTS "Anyone can view connections" ON public.actor_connections;
CREATE POLICY "View connections between public actors" ON public.actor_connections FOR SELECT TO anon, authenticated
USING (
  created_by = auth.uid()
  OR public.has_role(auth.uid(), 'admin'::app_role)
  OR (
    (source_layer_actor_id IS NULL OR EXISTS (SELECT 1 FROM public.layer_actors a WHERE a.id = source_layer_actor_id AND a.public_visible))
    AND (target_layer_actor_id IS NULL OR EXISTS (SELECT 1 FROM public.layer_actors a WHERE a.id = target_layer_actor_id AND a.public_visible))
  )
);