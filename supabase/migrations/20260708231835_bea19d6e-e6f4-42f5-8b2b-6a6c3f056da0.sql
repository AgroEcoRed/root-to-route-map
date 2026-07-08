-- referrals: invitations from registered users to bring new experiences into the network
CREATE TABLE public.referrals (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  referrer_user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  invitee_name text NOT NULL,
  invitee_contact_type text NOT NULL CHECK (invitee_contact_type IN ('email','whatsapp')),
  invitee_contact text NOT NULL,
  token uuid NOT NULL DEFAULT gen_random_uuid() UNIQUE,
  status text NOT NULL DEFAULT 'pending' CHECK (status IN ('pending','joined','declined')),
  personal_message text,
  invited_user_id uuid REFERENCES auth.users(id) ON DELETE SET NULL,
  joined_at timestamptz,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX referrals_referrer_idx ON public.referrals(referrer_user_id);
CREATE INDEX referrals_token_idx ON public.referrals(token);

GRANT SELECT, INSERT, UPDATE, DELETE ON public.referrals TO authenticated;
GRANT ALL ON public.referrals TO service_role;

ALTER TABLE public.referrals ENABLE ROW LEVEL SECURITY;

-- Owners manage their own invitations
CREATE POLICY "Referrers manage own referrals"
  ON public.referrals FOR ALL
  TO authenticated
  USING (auth.uid() = referrer_user_id)
  WITH CHECK (auth.uid() = referrer_user_id);

-- Admins can see everything (moderation)
CREATE POLICY "Admins view all referrals"
  ON public.referrals FOR SELECT
  TO authenticated
  USING (public.has_role(auth.uid(), 'admin'::app_role));

-- updated_at trigger
CREATE TRIGGER referrals_updated_at
  BEFORE UPDATE ON public.referrals
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- Claim function: anyone logged in can mark a referral as joined using its token
CREATE OR REPLACE FUNCTION public.claim_referral(_token uuid)
RETURNS public.referrals
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE r public.referrals;
BEGIN
  IF auth.uid() IS NULL THEN
    RAISE EXCEPTION 'Necesitás iniciar sesión para reclamar la invitación';
  END IF;
  UPDATE public.referrals
     SET invited_user_id = auth.uid(),
         status = 'joined',
         joined_at = COALESCE(joined_at, now()),
         updated_at = now()
   WHERE token = _token
     AND status = 'pending'
   RETURNING * INTO r;
  RETURN r;
END;
$$;

-- Public read of the referrer's display name for a token (so the /registro?ref= page can say "Te invita X")
CREATE OR REPLACE FUNCTION public.get_referral_by_token(_token uuid)
RETURNS TABLE(referrer_name text, invitee_name text)
LANGUAGE sql
STABLE SECURITY DEFINER
SET search_path = public
AS $$
  SELECT COALESCE(p.display_name, 'Alguien de la red') AS referrer_name,
         r.invitee_name
  FROM public.referrals r
  LEFT JOIN public.profiles p ON p.user_id = r.referrer_user_id
  WHERE r.token = _token
  LIMIT 1;
$$;