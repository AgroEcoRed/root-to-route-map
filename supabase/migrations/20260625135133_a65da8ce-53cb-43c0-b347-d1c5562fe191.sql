
-- 1) events: column-level revoke for anon (authenticated users still see contacts)
REVOKE SELECT (contact_email, contact_phone) ON public.events FROM anon;

-- 2) layer_actors: hide confirmation PII from anonymous visitors
REVOKE SELECT (confirmation_email, confirmation_phone, confirmation_token) ON public.layer_actors FROM anon;

-- 3) Lock down token-confirmation SECURITY DEFINER functions: only callable via service_role
--    (the public confirmation flow now goes through the `confirm-actor` edge function).
REVOKE EXECUTE ON FUNCTION public.get_actor_by_token(uuid) FROM PUBLIC, anon, authenticated;
REVOKE EXECUTE ON FUNCTION public.confirm_actor_by_token(uuid, text, text, text, text, text, text[], double precision, double precision) FROM PUBLIC, anon, authenticated;
GRANT EXECUTE ON FUNCTION public.get_actor_by_token(uuid) TO service_role;
GRANT EXECUTE ON FUNCTION public.confirm_actor_by_token(uuid, text, text, text, text, text, text[], double precision, double precision) TO service_role;
