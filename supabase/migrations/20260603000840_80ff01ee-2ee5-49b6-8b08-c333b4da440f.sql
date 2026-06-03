
-- 1. PROFILES: hide phone from anonymous users via public view; restrict base table SELECT to authenticated
DROP POLICY IF EXISTS "Profiles are viewable by everyone" ON public.profiles;
CREATE POLICY "Profiles viewable by authenticated"
  ON public.profiles FOR SELECT
  TO authenticated
  USING (true);

CREATE OR REPLACE VIEW public.public_profiles
WITH (security_invoker = on) AS
SELECT id, user_id, display_name, actor_type, avatar_url, location, lat, lng,
       products, capacity, production_methods, description, certification,
       spg_id, created_at, updated_at
FROM public.profiles
WHERE registration_completed = true;

GRANT SELECT ON public.public_profiles TO anon, authenticated;

-- 2. PRODUCER_MEDIA: restrict reads to authenticated users
DROP POLICY IF EXISTS "Media viewable by everyone" ON public.producer_media;
CREATE POLICY "Media viewable by authenticated"
  ON public.producer_media FOR SELECT
  TO authenticated
  USING (true);

-- 3. PROFILE_MILESTONES: owner-only reads
DROP POLICY IF EXISTS "Milestones viewable by everyone" ON public.profile_milestones;
CREATE POLICY "Owners read own milestones"
  ON public.profile_milestones FOR SELECT
  TO authenticated
  USING (auth.uid() = user_id);

-- 4. TRANSITION_RECORDS: owner-only reads
DROP POLICY IF EXISTS "Transition records viewable by everyone" ON public.transition_records;
CREATE POLICY "Owners read own transition records"
  ON public.transition_records FOR SELECT
  TO authenticated
  USING (auth.uid() = user_id);

-- 5. CUSTOM_CATEGORIES: owner update/delete
CREATE POLICY "Owners update own custom categories"
  ON public.custom_categories FOR UPDATE
  TO authenticated
  USING (auth.uid() = created_by);
CREATE POLICY "Owners delete own custom categories"
  ON public.custom_categories FOR DELETE
  TO authenticated
  USING (auth.uid() = created_by);

-- 6. LIBRARY_COLLECTIONS: owner update/delete
CREATE POLICY "Owners update own collections"
  ON public.library_collections FOR UPDATE
  TO authenticated
  USING (auth.uid() = created_by);
CREATE POLICY "Owners delete own collections"
  ON public.library_collections FOR DELETE
  TO authenticated
  USING (auth.uid() = created_by);

-- 7. LIBRARY_ITEMS: owner delete
CREATE POLICY "Owners delete own library items"
  ON public.library_items FOR DELETE
  TO authenticated
  USING (auth.uid() = uploaded_by);

-- 8. STORAGE: remove broad listing/public read policies
DROP POLICY IF EXISTS "Producer media public read" ON storage.objects;
DROP POLICY IF EXISTS "Library files publicly readable" ON storage.objects;
-- Authenticated users may still list biblioteca; direct public URLs continue to work for the public bucket
CREATE POLICY "Biblioteca readable by authenticated"
  ON storage.objects FOR SELECT
  TO authenticated
  USING (bucket_id = 'biblioteca');
-- Producer media: only owners can list their own folder; signed URLs provide public access
CREATE POLICY "Producer media owner read"
  ON storage.objects FOR SELECT
  TO authenticated
  USING (bucket_id = 'producer-media' AND auth.uid()::text = (storage.foldername(name))[1]);

-- 9. Lock down trigger functions from direct execution
REVOKE EXECUTE ON FUNCTION public.handle_new_user() FROM PUBLIC, anon, authenticated;
REVOKE EXECUTE ON FUNCTION public.update_updated_at_column() FROM PUBLIC, anon, authenticated;
REVOKE EXECUTE ON FUNCTION public.touch_updated_at() FROM PUBLIC, anon, authenticated;
