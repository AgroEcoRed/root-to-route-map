CREATE POLICY "Read published biblioteca documents" ON storage.objects
FOR SELECT TO anon, authenticated
USING (
  bucket_id = 'biblioteca'
  AND EXISTS (
    SELECT 1 FROM public.library_items li
    WHERE li.file_path = objects.name
      AND (
        li.uploaded_by::text = objects.owner_id
        OR li.uploaded_by::text = (storage.foldername(objects.name))[1]
        OR (objects.owner_id IS NULL AND (storage.foldername(objects.name))[1] = 'spg-seed')
      )
  )
);
COMMENT ON POLICY "Read published biblioteca documents" ON storage.objects IS 'Public read access only to catalogued documents bound to their uploader or the curated SPG seed folder. Unregistered internal files remain private; owner/admin access is unchanged.';