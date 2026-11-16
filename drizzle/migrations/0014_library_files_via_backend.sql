DROP POLICY IF EXISTS "Read published biblioteca documents" ON storage.objects;

CREATE OR REPLACE FUNCTION public.published_library_file_path(_item_id uuid)
RETURNS text
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public, storage
AS $$
  SELECT li.file_path
  FROM public.library_items li
  JOIN storage.objects o ON o.bucket_id = 'biblioteca' AND o.name = li.file_path
  WHERE li.id = _item_id
    AND (
      li.uploaded_by::text = o.owner_id
      OR li.uploaded_by::text = (storage.foldername(o.name))[1]
      OR (o.owner_id IS NULL AND (storage.foldername(o.name))[1] = 'spg-seed')
    )
  LIMIT 1;
$$;
REVOKE ALL ON FUNCTION public.published_library_file_path(uuid) FROM PUBLIC, anon, authenticated;
GRANT EXECUTE ON FUNCTION public.published_library_file_path(uuid) TO service_role;