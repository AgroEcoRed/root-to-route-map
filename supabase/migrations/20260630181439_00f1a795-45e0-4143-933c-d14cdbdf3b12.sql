REVOKE ALL ON FUNCTION public.claim_layer_manager_invites() FROM PUBLIC, anon, authenticated;
GRANT EXECUTE ON FUNCTION public.claim_layer_manager_invites() TO service_role;