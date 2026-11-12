DROP POLICY IF EXISTS "Signed-in users can view SPG evaluations" ON public.spg_evaluations;
CREATE POLICY "SPG evaluations are public" ON public.spg_evaluations
FOR SELECT TO anon, authenticated USING (EXISTS (SELECT 1 FROM public.spgs s WHERE s.id = spg_id));
GRANT SELECT ON public.spg_evaluations TO anon;

DROP POLICY IF EXISTS "Biblioteca files read by uploader or admin" ON storage.objects;
CREATE POLICY "Read registered biblioteca files" ON storage.objects
FOR SELECT TO anon, authenticated
USING (bucket_id = 'biblioteca' AND EXISTS (SELECT 1 FROM public.library_items li WHERE li.file_path = objects.name));

DROP POLICY IF EXISTS "Event flyers read own or managers" ON storage.objects;
CREATE POLICY "Event flyers read approved or own" ON storage.objects
FOR SELECT TO anon, authenticated
USING (bucket_id = 'event-flyers' AND (
  (auth.uid() IS NOT NULL AND (storage.foldername(name))[1] = (auth.uid())::text)
  OR public.has_role(auth.uid(), 'admin'::app_role)
  OR EXISTS (SELECT 1 FROM public.events e WHERE e.approved = true AND e.flyer_url LIKE '%/event-flyers/' || objects.name)
));