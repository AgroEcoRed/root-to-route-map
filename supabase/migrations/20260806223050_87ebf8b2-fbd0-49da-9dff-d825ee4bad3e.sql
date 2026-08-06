REVOKE EXECUTE ON FUNCTION public.get_referral_by_token(uuid) FROM anon, authenticated, PUBLIC;
GRANT EXECUTE ON FUNCTION public.get_referral_by_token(uuid) TO service_role;