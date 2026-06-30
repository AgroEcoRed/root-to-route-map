GRANT SELECT, INSERT, UPDATE, DELETE ON public.layer_manager_invites TO authenticated;
GRANT ALL ON public.layer_manager_invites TO service_role;

REVOKE ALL ON FUNCTION public.claim_layer_manager_invites() FROM PUBLIC, anon, authenticated;
GRANT EXECUTE ON FUNCTION public.claim_layer_manager_invites() TO service_role;