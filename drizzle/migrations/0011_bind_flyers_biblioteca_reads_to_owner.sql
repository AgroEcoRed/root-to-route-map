DROP POLICY IF EXISTS "Event flyers read approved or own" ON storage.objects;
CREATE POLICY "Event flyers read own or admin" ON storage.objects FOR SELECT TO authenticated
USING (bucket_id = 'event-flyers' AND (owner_id = (select auth.uid()::text) OR (storage.foldername(name))[1] = (select auth.uid()::text) OR public.has_role((select auth.uid()), 'admin'::public.app_role)));

DROP POLICY IF EXISTS "Read registered biblioteca files" ON storage.objects;
CREATE POLICY "Biblioteca read own or admin" ON storage.objects FOR SELECT TO authenticated
USING (bucket_id = 'biblioteca' AND (owner_id = (select auth.uid()::text) OR public.has_role((select auth.uid()), 'admin'::public.app_role)));