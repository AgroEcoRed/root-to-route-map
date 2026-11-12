DROP POLICY IF EXISTS "Anyone can read source settings" ON public.data_source_settings;
CREATE POLICY "Read enabled source settings or managed" ON public.data_source_settings
FOR SELECT TO anon, authenticated
USING (enabled = true OR (auth.uid() IS NOT NULL AND public.can_manage_layer(auth.uid(), source_id)));

DROP POLICY IF EXISTS "SPG evaluations are viewable by everyone" ON public.spg_evaluations;
CREATE POLICY "Signed-in users can view SPG evaluations" ON public.spg_evaluations
FOR SELECT TO authenticated USING (auth.uid() IS NOT NULL);

DROP POLICY IF EXISTS "Event flyers read approved or own" ON storage.objects;
CREATE POLICY "Event flyers read own or managers" ON storage.objects
FOR SELECT TO authenticated
USING (bucket_id = 'event-flyers' AND (
  (storage.foldername(name))[1] = (auth.uid())::text
  OR public.has_role(auth.uid(), 'admin'::app_role)
));

DROP POLICY IF EXISTS "Read registered biblioteca files" ON storage.objects;
CREATE POLICY "Signed-in read registered biblioteca files" ON storage.objects
FOR SELECT TO authenticated
USING (bucket_id = 'biblioteca' AND auth.uid() IS NOT NULL
  AND EXISTS (SELECT 1 FROM public.library_items li WHERE li.file_path = objects.name));