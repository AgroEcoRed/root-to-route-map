
-- LIBRARY ITEMS
CREATE TABLE public.library_items (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  title TEXT NOT NULL,
  authors TEXT[] NOT NULL DEFAULT '{}',
  year INTEGER,
  item_type TEXT NOT NULL DEFAULT 'article',
  doi TEXT,
  url TEXT,
  abstract TEXT,
  tags TEXT[] NOT NULL DEFAULT '{}',
  file_path TEXT,
  publisher TEXT,
  journal TEXT,
  uploaded_by UUID NOT NULL,
  collection_id UUID,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE public.library_items ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Library items viewable by everyone"
  ON public.library_items FOR SELECT USING (true);

CREATE POLICY "Authenticated users can add library items"
  ON public.library_items FOR INSERT TO authenticated
  WITH CHECK (auth.uid() = uploaded_by);

CREATE POLICY "Uploader can update own item"
  ON public.library_items FOR UPDATE TO authenticated
  USING (auth.uid() = uploaded_by);

-- No DELETE policy → append-only

CREATE TRIGGER trg_library_items_updated_at
BEFORE UPDATE ON public.library_items
FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE INDEX idx_library_items_tags ON public.library_items USING GIN(tags);
CREATE INDEX idx_library_items_authors ON public.library_items USING GIN(authors);

-- LIBRARY COLLECTIONS
CREATE TABLE public.library_collections (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  name TEXT NOT NULL,
  description TEXT,
  created_by UUID NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE public.library_collections ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Collections viewable by everyone"
  ON public.library_collections FOR SELECT USING (true);

CREATE POLICY "Authenticated users can create collections"
  ON public.library_collections FOR INSERT TO authenticated
  WITH CHECK (auth.uid() = created_by);

-- GOV PROGRAMS
CREATE TABLE public.gov_programs (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  country TEXT NOT NULL,
  region TEXT,
  city TEXT,
  name TEXT NOT NULL,
  organization TEXT,
  description TEXT,
  url TEXT NOT NULL,
  topics TEXT[] NOT NULL DEFAULT '{}',
  contact TEXT,
  source TEXT NOT NULL DEFAULT 'manual',
  last_synced_at TIMESTAMPTZ,
  source_html_hash TEXT,
  created_by UUID,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE public.gov_programs ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Gov programs viewable by everyone"
  ON public.gov_programs FOR SELECT USING (true);

CREATE POLICY "Authenticated users can suggest programs"
  ON public.gov_programs FOR INSERT TO authenticated
  WITH CHECK (auth.uid() = created_by);

CREATE TRIGGER trg_gov_programs_updated_at
BEFORE UPDATE ON public.gov_programs
FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE INDEX idx_gov_programs_country ON public.gov_programs(country);

-- STORAGE BUCKET
INSERT INTO storage.buckets (id, name, public) VALUES ('biblioteca', 'biblioteca', true)
ON CONFLICT (id) DO NOTHING;

CREATE POLICY "Library files publicly readable"
  ON storage.objects FOR SELECT USING (bucket_id = 'biblioteca');

CREATE POLICY "Authenticated users can upload library files"
  ON storage.objects FOR INSERT TO authenticated
  WITH CHECK (bucket_id = 'biblioteca' AND auth.uid()::text = (storage.foldername(name))[1]);
