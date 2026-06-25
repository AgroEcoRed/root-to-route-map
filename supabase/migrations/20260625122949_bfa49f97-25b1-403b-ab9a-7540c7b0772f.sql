
-- event-flyers bucket: public read so popups can display the image, owner-scoped write
CREATE POLICY "Event flyers public read"
  ON storage.objects FOR SELECT
  USING (bucket_id = 'event-flyers');

CREATE POLICY "Event flyers owner insert"
  ON storage.objects FOR INSERT
  TO authenticated
  WITH CHECK (bucket_id = 'event-flyers' AND auth.uid()::text = (storage.foldername(name))[1]);

CREATE POLICY "Event flyers owner update"
  ON storage.objects FOR UPDATE
  TO authenticated
  USING (bucket_id = 'event-flyers' AND auth.uid()::text = (storage.foldername(name))[1]);

CREATE POLICY "Event flyers owner delete"
  ON storage.objects FOR DELETE
  TO authenticated
  USING (bucket_id = 'event-flyers' AND auth.uid()::text = (storage.foldername(name))[1]);
