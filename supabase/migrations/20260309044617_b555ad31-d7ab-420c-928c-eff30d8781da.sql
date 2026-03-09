
-- Table for user-created custom categories (global)
CREATE TABLE public.custom_categories (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL UNIQUE,
  type text NOT NULL CHECK (type IN ('oferta', 'demanda', 'servicio')),
  created_by uuid NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE public.custom_categories ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Custom categories viewable by everyone"
  ON public.custom_categories FOR SELECT
  USING (true);

CREATE POLICY "Authenticated users can insert custom categories"
  ON public.custom_categories FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = created_by);
