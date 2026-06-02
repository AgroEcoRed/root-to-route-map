CREATE POLICY "Producer media public read"
  ON storage.objects FOR SELECT
  USING (bucket_id = 'producer-media');

CREATE POLICY "Producer media owner insert"
  ON storage.objects FOR INSERT
  WITH CHECK (bucket_id = 'producer-media' AND auth.uid()::text = (storage.foldername(name))[1]);

CREATE POLICY "Producer media owner update"
  ON storage.objects FOR UPDATE
  USING (bucket_id = 'producer-media' AND auth.uid()::text = (storage.foldername(name))[1]);

CREATE POLICY "Producer media owner delete"
  ON storage.objects FOR DELETE
  USING (bucket_id = 'producer-media' AND auth.uid()::text = (storage.foldername(name))[1]);