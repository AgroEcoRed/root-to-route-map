DROP POLICY IF EXISTS "Block direct listing of biblioteca objects" ON storage.objects;
DROP POLICY IF EXISTS "Restrict listing biblioteca objects" ON storage.objects;
DROP POLICY IF EXISTS "public read biblioteca" ON storage.objects;
DROP POLICY IF EXISTS "Authenticated can read registered biblioteca files" ON storage.objects;
CREATE POLICY "Read registered biblioteca files"
ON storage.objects FOR SELECT TO anon, authenticated
USING (
  bucket_id = 'biblioteca'
  AND EXISTS (SELECT 1 FROM public.library_items li WHERE li.file_path = objects.name)
);