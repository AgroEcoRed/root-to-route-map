
-- SPG (Sistema Participativo de Garantía) table
CREATE TABLE public.spgs (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL,
  description text,
  region text,
  peer_visit_count int NOT NULL DEFAULT 0,
  evaluation_form_url text,
  methodology text,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE public.spgs ENABLE ROW LEVEL SECURITY;

CREATE POLICY "SPGs are viewable by everyone" ON public.spgs FOR SELECT USING (true);

-- SPG evaluations table
CREATE TABLE public.spg_evaluations (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  spg_id uuid REFERENCES public.spgs(id) ON DELETE CASCADE NOT NULL,
  evaluation_type text NOT NULL, -- e.g. 'suelo', 'agua', 'biodiversidad', 'igualdad_genero'
  title text NOT NULL,
  result text,
  notes text,
  evaluated_at timestamptz,
  created_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE public.spg_evaluations ENABLE ROW LEVEL SECURITY;

CREATE POLICY "SPG evaluations are viewable by everyone" ON public.spg_evaluations FOR SELECT USING (true);

-- Add spg_id to profiles for producers
ALTER TABLE public.profiles ADD COLUMN spg_id uuid REFERENCES public.spgs(id) ON DELETE SET NULL;

-- Trigger for updated_at on spgs
CREATE TRIGGER update_spgs_updated_at BEFORE UPDATE ON public.spgs
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
