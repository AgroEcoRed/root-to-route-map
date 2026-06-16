
-- 1. Move pg_net out of public schema (pg_net does not support SET SCHEMA, must drop+recreate)
CREATE SCHEMA IF NOT EXISTS extensions;
DROP EXTENSION IF EXISTS pg_net;
CREATE EXTENSION IF NOT EXISTS pg_net WITH SCHEMA extensions;

-- 2. Tighten EXECUTE on SECURITY DEFINER function has_role
REVOKE EXECUTE ON FUNCTION public.has_role(uuid, public.app_role) FROM PUBLIC;
REVOKE EXECUTE ON FUNCTION public.has_role(uuid, public.app_role) FROM anon;
GRANT EXECUTE ON FUNCTION public.has_role(uuid, public.app_role) TO authenticated, service_role;

-- 3. Explicit restrictive policy clarifying biblioteca bucket is not readable via Storage API
DROP POLICY IF EXISTS "Block direct listing of biblioteca objects" ON storage.objects;
CREATE POLICY "Block direct listing of biblioteca objects"
ON storage.objects
AS RESTRICTIVE
FOR SELECT
TO anon, authenticated
USING (bucket_id <> 'biblioteca');
