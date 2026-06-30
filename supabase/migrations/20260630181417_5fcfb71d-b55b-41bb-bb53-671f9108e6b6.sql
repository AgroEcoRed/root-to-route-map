CREATE TABLE IF NOT EXISTS public.layer_manager_invites (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  email text NOT NULL,
  layer_id text NOT NULL,
  invited_by uuid REFERENCES auth.users(id) ON DELETE SET NULL,
  accepted_by uuid REFERENCES auth.users(id) ON DELETE SET NULL,
  accepted_at timestamptz,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  CONSTRAINT layer_manager_invites_email_layer_unique UNIQUE (email, layer_id),
  CONSTRAINT layer_manager_invites_email_lowercase CHECK (email = lower(email))
);

GRANT SELECT, INSERT, UPDATE, DELETE ON public.layer_manager_invites TO authenticated;
GRANT ALL ON public.layer_manager_invites TO service_role;

ALTER TABLE public.layer_manager_invites ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Admins can manage layer manager invites"
ON public.layer_manager_invites
FOR ALL
TO authenticated
USING (public.has_role(auth.uid(), 'admin'::app_role))
WITH CHECK (public.has_role(auth.uid(), 'admin'::app_role));

CREATE POLICY "Invited users can view their own layer invites"
ON public.layer_manager_invites
FOR SELECT
TO authenticated
USING (lower(email) = lower(COALESCE(auth.jwt() ->> 'email', '')));

CREATE OR REPLACE TRIGGER update_layer_manager_invites_updated_at
BEFORE UPDATE ON public.layer_manager_invites
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();

CREATE OR REPLACE FUNCTION public.claim_layer_manager_invites()
RETURNS SETOF public.layer_managers
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_email text := lower(COALESCE(auth.jwt() ->> 'email', ''));
BEGIN
  IF auth.uid() IS NULL OR v_email = '' THEN
    RETURN;
  END IF;

  INSERT INTO public.layer_managers (user_id, layer_id, granted_by)
  SELECT auth.uid(), i.layer_id, i.invited_by
  FROM public.layer_manager_invites i
  WHERE i.email = v_email
  ON CONFLICT (user_id, layer_id) DO NOTHING;

  UPDATE public.layer_manager_invites
  SET accepted_by = auth.uid(),
      accepted_at = COALESCE(accepted_at, now()),
      updated_at = now()
  WHERE email = v_email
    AND accepted_by IS NULL;

  RETURN QUERY
  SELECT lm.*
  FROM public.layer_managers lm
  WHERE lm.user_id = auth.uid()
    AND lm.layer_id IN (
      SELECT i.layer_id FROM public.layer_manager_invites i WHERE i.email = v_email
    );
END;
$$;

REVOKE ALL ON FUNCTION public.claim_layer_manager_invites() FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.claim_layer_manager_invites() TO authenticated;

INSERT INTO public.data_source_settings (source_id, label, enabled)
VALUES ('nat_san_martin', 'NAT San Martín', true)
ON CONFLICT (source_id) DO UPDATE
SET label = EXCLUDED.label,
    enabled = EXCLUDED.enabled,
    updated_at = now();

INSERT INTO public.layer_manager_invites (email, layer_id)
VALUES ('natsanmartin@unsam.edu.ar', 'nat_san_martin')
ON CONFLICT (email, layer_id) DO UPDATE
SET updated_at = now();