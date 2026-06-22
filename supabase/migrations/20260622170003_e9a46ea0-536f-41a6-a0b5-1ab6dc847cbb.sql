ALTER TABLE public.library_items
  ADD COLUMN IF NOT EXISTS lat double precision,
  ADD COLUMN IF NOT EXISTS lng double precision,
  ADD COLUMN IF NOT EXISTS actor_id uuid,
  ADD COLUMN IF NOT EXISTS route_geojson jsonb;

CREATE INDEX IF NOT EXISTS library_items_geo_idx ON public.library_items (lat, lng);
CREATE INDEX IF NOT EXISTS library_items_actor_idx ON public.library_items (actor_id);