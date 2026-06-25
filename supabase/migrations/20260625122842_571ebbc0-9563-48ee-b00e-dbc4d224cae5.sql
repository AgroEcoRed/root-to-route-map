
-- 1) Events: extra columns
ALTER TABLE public.events
  ADD COLUMN IF NOT EXISTS flyer_url text,
  ADD COLUMN IF NOT EXISTS contact_email text,
  ADD COLUMN IF NOT EXISTS contact_phone text,
  ADD COLUMN IF NOT EXISTS co_organizers uuid[] NOT NULL DEFAULT '{}',
  ADD COLUMN IF NOT EXISTS extra_organizer_names text[] NOT NULL DEFAULT '{}';

-- 2) Profiles: geolocation source
ALTER TABLE public.profiles
  ADD COLUMN IF NOT EXISTS geolocation_source text;

-- 3) preliminary_imports table
CREATE TABLE IF NOT EXISTS public.preliminary_imports (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  source_type text NOT NULL CHECK (source_type IN ('file', 'link')),
  url text,
  file_path text,
  notes text,
  status text NOT NULL DEFAULT 'pending',
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

GRANT SELECT, INSERT, UPDATE, DELETE ON public.preliminary_imports TO authenticated;
GRANT ALL ON public.preliminary_imports TO service_role;

ALTER TABLE public.preliminary_imports ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own preliminary imports"
  ON public.preliminary_imports FOR SELECT
  TO authenticated
  USING (user_id = auth.uid() OR public.has_role(auth.uid(), 'admin'));

CREATE POLICY "Users can insert own preliminary imports"
  ON public.preliminary_imports FOR INSERT
  TO authenticated
  WITH CHECK (user_id = auth.uid());

CREATE POLICY "Users can update own preliminary imports"
  ON public.preliminary_imports FOR UPDATE
  TO authenticated
  USING (user_id = auth.uid() OR public.has_role(auth.uid(), 'admin'))
  WITH CHECK (user_id = auth.uid() OR public.has_role(auth.uid(), 'admin'));

CREATE POLICY "Users can delete own preliminary imports"
  ON public.preliminary_imports FOR DELETE
  TO authenticated
  USING (user_id = auth.uid() OR public.has_role(auth.uid(), 'admin'));

CREATE TRIGGER preliminary_imports_updated_at
  BEFORE UPDATE ON public.preliminary_imports
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
