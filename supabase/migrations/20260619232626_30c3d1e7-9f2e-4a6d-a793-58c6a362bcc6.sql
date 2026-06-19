
CREATE TABLE public.layer_managers (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  layer_id text NOT NULL,
  granted_by uuid REFERENCES auth.users(id) ON DELETE SET NULL,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (user_id, layer_id)
);

GRANT SELECT, INSERT, UPDATE, DELETE ON public.layer_managers TO authenticated;
GRANT ALL ON public.layer_managers TO service_role;

ALTER TABLE public.layer_managers ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Admins manage layer_managers"
  ON public.layer_managers FOR ALL
  TO authenticated
  USING (public.has_role(auth.uid(), 'admin'))
  WITH CHECK (public.has_role(auth.uid(), 'admin'));

CREATE POLICY "Users can view their own layer assignments"
  ON public.layer_managers FOR SELECT
  TO authenticated
  USING (user_id = auth.uid());

CREATE TRIGGER update_layer_managers_updated_at
  BEFORE UPDATE ON public.layer_managers
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE OR REPLACE FUNCTION public.can_manage_layer(_user_id uuid, _layer_id text)
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT
    public.has_role(_user_id, 'admin')
    OR EXISTS (
      SELECT 1 FROM public.layer_managers
      WHERE user_id = _user_id AND layer_id = _layer_id
    );
$$;
