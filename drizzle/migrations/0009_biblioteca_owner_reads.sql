DROP POLICY IF EXISTS "Signed-in read registered biblioteca files" ON storage.objects;
CREATE POLICY "Biblioteca files read by uploader or admin" ON storage.objects
FOR SELECT TO authenticated
USING (bucket_id = 'biblioteca' AND (
  (storage.foldername(name))[1] = (auth.uid())::text
  OR public.has_role(auth.uid(), 'admin'::app_role)
));