
-- ============ EVENTS ============
CREATE TYPE public.event_type AS ENUM ('feria', 'intercambio', 'formacion', 'otro');
CREATE TYPE public.event_source AS ENUM ('user', 'admin', 'community');

CREATE TABLE public.events (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  title TEXT NOT NULL,
  description TEXT,
  event_type public.event_type NOT NULL DEFAULT 'otro',
  starts_at TIMESTAMPTZ NOT NULL,
  ends_at TIMESTAMPTZ,
  location_name TEXT,
  lat DOUBLE PRECISION,
  lng DOUBLE PRECISION,
  link TEXT,
  contact TEXT,
  source public.event_source NOT NULL DEFAULT 'user',
  approved BOOLEAN NOT NULL DEFAULT false,
  created_by UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

GRANT SELECT ON public.events TO anon;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.events TO authenticated;
GRANT ALL ON public.events TO service_role;

ALTER TABLE public.events ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Public can view approved upcoming events"
  ON public.events FOR SELECT
  USING (approved = true OR auth.uid() = created_by OR public.has_role(auth.uid(), 'admin'));

CREATE POLICY "Authenticated users can create events"
  ON public.events FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = created_by);

CREATE POLICY "Owners or admins can update events"
  ON public.events FOR UPDATE
  TO authenticated
  USING (auth.uid() = created_by OR public.has_role(auth.uid(), 'admin'))
  WITH CHECK (auth.uid() = created_by OR public.has_role(auth.uid(), 'admin'));

CREATE POLICY "Owners or admins can delete events"
  ON public.events FOR DELETE
  TO authenticated
  USING (auth.uid() = created_by OR public.has_role(auth.uid(), 'admin'));

CREATE TRIGGER events_updated_at
  BEFORE UPDATE ON public.events
  FOR EACH ROW EXECUTE FUNCTION public.touch_updated_at();

CREATE INDEX idx_events_starts_at ON public.events(starts_at);
CREATE INDEX idx_events_approved ON public.events(approved);

-- ============ ACTOR CONNECTIONS ============
CREATE TYPE public.connection_type AS ENUM (
  'proveedor', 'comprador', 'colaboracion', 'spg', 'intercambio', 'red', 'otro'
);

CREATE TABLE public.actor_connections (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  source_profile_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  target_profile_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  connection_type public.connection_type NOT NULL DEFAULT 'colaboracion',
  strength SMALLINT NOT NULL DEFAULT 3 CHECK (strength BETWEEN 1 AND 5),
  note TEXT,
  declared BOOLEAN NOT NULL DEFAULT true,
  created_by UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  CONSTRAINT actor_connections_distinct CHECK (source_profile_id <> target_profile_id),
  CONSTRAINT actor_connections_unique UNIQUE (source_profile_id, target_profile_id, connection_type)
);

GRANT SELECT ON public.actor_connections TO anon;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.actor_connections TO authenticated;
GRANT ALL ON public.actor_connections TO service_role;

ALTER TABLE public.actor_connections ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can view connections"
  ON public.actor_connections FOR SELECT
  USING (true);

CREATE POLICY "Users can declare connections from their own profile"
  ON public.actor_connections FOR INSERT
  TO authenticated
  WITH CHECK (
    public.has_role(auth.uid(), 'admin')
    OR EXISTS (SELECT 1 FROM public.profiles p WHERE p.id = source_profile_id AND p.user_id = auth.uid())
  );

CREATE POLICY "Owners or admins can update connections"
  ON public.actor_connections FOR UPDATE
  TO authenticated
  USING (
    public.has_role(auth.uid(), 'admin')
    OR EXISTS (SELECT 1 FROM public.profiles p WHERE p.id = source_profile_id AND p.user_id = auth.uid())
  );

CREATE POLICY "Owners or admins can delete connections"
  ON public.actor_connections FOR DELETE
  TO authenticated
  USING (
    public.has_role(auth.uid(), 'admin')
    OR EXISTS (SELECT 1 FROM public.profiles p WHERE p.id = source_profile_id AND p.user_id = auth.uid())
  );

CREATE TRIGGER actor_connections_updated_at
  BEFORE UPDATE ON public.actor_connections
  FOR EACH ROW EXECUTE FUNCTION public.touch_updated_at();

CREATE INDEX idx_actor_connections_source ON public.actor_connections(source_profile_id);
CREATE INDEX idx_actor_connections_target ON public.actor_connections(target_profile_id);

-- Add 'eventos' as a manageable data source layer
INSERT INTO public.data_source_settings (source_id, label, enabled)
VALUES ('eventos', 'Actividades futuras', true)
ON CONFLICT (source_id) DO NOTHING;
