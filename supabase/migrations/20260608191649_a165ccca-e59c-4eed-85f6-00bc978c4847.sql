DROP VIEW IF EXISTS public.public_profiles;
CREATE VIEW public.public_profiles AS
SELECT id, user_id, display_name, actor_type, avatar_url, location, lat, lng,
       products, capacity, production_methods, description, certification, spg_id,
       content_license, created_at, updated_at
FROM public.profiles
WHERE registration_completed = true;
GRANT SELECT ON public.public_profiles TO anon, authenticated;