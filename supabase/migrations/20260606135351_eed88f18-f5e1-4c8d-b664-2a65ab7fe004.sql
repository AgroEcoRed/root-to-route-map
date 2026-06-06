-- Restrict profiles SELECT to owner; broader directory still served by public_profiles view
DROP POLICY IF EXISTS "Profiles viewable by authenticated" ON public.profiles;
CREATE POLICY "Users can view own profile"
ON public.profiles FOR SELECT
TO authenticated
USING (auth.uid() = user_id);

-- Restrict producer_media SELECT to owner
DROP POLICY IF EXISTS "Media viewable by authenticated" ON public.producer_media;
CREATE POLICY "Users view own media"
ON public.producer_media FOR SELECT
TO authenticated
USING (auth.uid() = user_id);

-- Prevent listing/enumeration of biblioteca bucket via Storage API.
-- Files remain accessible via direct public URL (bucket is public),
-- but list/select through storage.objects is denied.
CREATE POLICY "Deny listing biblioteca objects"
ON storage.objects FOR SELECT
TO anon, authenticated
USING (bucket_id <> 'biblioteca');