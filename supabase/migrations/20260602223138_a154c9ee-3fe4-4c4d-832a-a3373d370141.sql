CREATE TABLE public.producer_media (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id uuid NOT NULL,
  media_url text NOT NULL,
  media_type text NOT NULL CHECK (media_type IN ('image','video')),
  storage_path text NOT NULL,
  caption text,
  sort_order integer NOT NULL DEFAULT 0,
  size_bytes bigint,
  duration_seconds numeric,
  created_at timestamp with time zone NOT NULL DEFAULT now()
);

GRANT SELECT ON public.producer_media TO anon;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.producer_media TO authenticated;
GRANT ALL ON public.producer_media TO service_role;

ALTER TABLE public.producer_media ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Media viewable by everyone"
  ON public.producer_media FOR SELECT USING (true);

CREATE POLICY "Users insert own media"
  ON public.producer_media FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users update own media"
  ON public.producer_media FOR UPDATE USING (auth.uid() = user_id);

CREATE POLICY "Users delete own media"
  ON public.producer_media FOR DELETE USING (auth.uid() = user_id);

CREATE INDEX idx_producer_media_user ON public.producer_media(user_id, sort_order);