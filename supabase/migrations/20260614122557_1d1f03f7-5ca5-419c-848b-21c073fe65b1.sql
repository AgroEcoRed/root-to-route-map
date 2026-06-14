DROP POLICY IF EXISTS "Deny listing biblioteca objects" ON storage.objects;

CREATE POLICY "Restrict listing biblioteca objects"
ON storage.objects
AS RESTRICTIVE
FOR SELECT
TO anon, authenticated
USING (bucket_id <> 'biblioteca');