
-- ============ ROLES ============
CREATE TYPE public.app_role AS ENUM ('admin', 'moderator', 'user');

CREATE TABLE public.user_roles (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  role public.app_role NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (user_id, role)
);

GRANT SELECT ON public.user_roles TO authenticated;
GRANT ALL ON public.user_roles TO service_role;

ALTER TABLE public.user_roles ENABLE ROW LEVEL SECURITY;

CREATE OR REPLACE FUNCTION public.has_role(_user_id uuid, _role public.app_role)
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.user_roles WHERE user_id = _user_id AND role = _role
  )
$$;

CREATE POLICY "Users can view own roles" ON public.user_roles
  FOR SELECT TO authenticated
  USING (user_id = auth.uid() OR public.has_role(auth.uid(), 'admin'));

CREATE POLICY "Admins manage roles" ON public.user_roles
  FOR ALL TO authenticated
  USING (public.has_role(auth.uid(), 'admin'))
  WITH CHECK (public.has_role(auth.uid(), 'admin'));

-- Auto-assign admin role to designated email on signup
CREATE OR REPLACE FUNCTION public.assign_admin_on_signup()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  IF NEW.email = 'andreapatriciasosa@gmail.com' THEN
    INSERT INTO public.user_roles (user_id, role)
    VALUES (NEW.id, 'admin')
    ON CONFLICT (user_id, role) DO NOTHING;
  END IF;
  RETURN NEW;
END;
$$;

CREATE TRIGGER on_auth_user_assign_admin
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.assign_admin_on_signup();

-- Backfill if the admin user already exists
INSERT INTO public.user_roles (user_id, role)
SELECT id, 'admin'::public.app_role FROM auth.users
WHERE email = 'andreapatriciasosa@gmail.com'
ON CONFLICT (user_id, role) DO NOTHING;

-- ============ DATA SOURCE SETTINGS (admin-controlled map layers) ============
CREATE TABLE public.data_source_settings (
  source_id text PRIMARY KEY,
  label text NOT NULL,
  enabled boolean NOT NULL DEFAULT true,
  updated_at timestamptz NOT NULL DEFAULT now(),
  updated_by uuid REFERENCES auth.users(id)
);

GRANT SELECT ON public.data_source_settings TO anon, authenticated;
GRANT ALL ON public.data_source_settings TO service_role;

ALTER TABLE public.data_source_settings ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can read source settings" ON public.data_source_settings
  FOR SELECT USING (true);
CREATE POLICY "Admins update source settings" ON public.data_source_settings
  FOR UPDATE TO authenticated
  USING (public.has_role(auth.uid(), 'admin'))
  WITH CHECK (public.has_role(auth.uid(), 'admin'));
CREATE POLICY "Admins insert source settings" ON public.data_source_settings
  FOR INSERT TO authenticated
  WITH CHECK (public.has_role(auth.uid(), 'admin'));

INSERT INTO public.data_source_settings (source_id, label, enabled) VALUES
  ('rutas_sanas', 'Rutas Sanas del Alimento', true),
  ('mercado_territorial', 'Mercado Territorial', true),
  ('agroeco', 'AgroEco.Red (perfiles propios)', true)
ON CONFLICT DO NOTHING;

-- ============ MTR FACETS (sellos: agroecologico, en_red, sintacc, etc.) ============
CREATE TABLE public.mtr_facets (
  code text PRIMARY KEY,
  name text NOT NULL,
  facet_code text,
  facet_name text,
  external_id text,
  updated_at timestamptz NOT NULL DEFAULT now()
);

GRANT SELECT ON public.mtr_facets TO anon, authenticated;
GRANT ALL ON public.mtr_facets TO service_role;

ALTER TABLE public.mtr_facets ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can read MTR facets" ON public.mtr_facets
  FOR SELECT USING (true);
CREATE POLICY "Admins manage MTR facets" ON public.mtr_facets
  FOR ALL TO authenticated
  USING (public.has_role(auth.uid(), 'admin'))
  WITH CHECK (public.has_role(auth.uid(), 'admin'));

-- ============ MTR PRODUCTS (cached from tiendaschasqui.ar/mtr/catalogo) ============
CREATE TABLE public.mtr_products (
  product_id text PRIMARY KEY,
  name text NOT NULL,
  slug text,
  description text,
  image_url text,
  price_cents integer,
  currency text DEFAULT 'ARS',
  facet_value_ids text[] DEFAULT '{}',
  collection_ids text[] DEFAULT '{}',
  in_stock boolean DEFAULT true,
  source_url text,
  updated_at timestamptz NOT NULL DEFAULT now()
);

GRANT SELECT ON public.mtr_products TO anon, authenticated;
GRANT ALL ON public.mtr_products TO service_role;

ALTER TABLE public.mtr_products ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can read MTR products" ON public.mtr_products
  FOR SELECT USING (true);
CREATE POLICY "Admins manage MTR products" ON public.mtr_products
  FOR ALL TO authenticated
  USING (public.has_role(auth.uid(), 'admin'))
  WITH CHECK (public.has_role(auth.uid(), 'admin'));

CREATE INDEX idx_mtr_products_in_stock ON public.mtr_products (in_stock);
CREATE INDEX idx_mtr_products_updated_at ON public.mtr_products (updated_at);

-- ============ SYNC LOG ============
CREATE TABLE public.mtr_sync_log (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  started_at timestamptz NOT NULL DEFAULT now(),
  finished_at timestamptz,
  status text NOT NULL DEFAULT 'running',
  products_synced integer,
  facets_synced integer,
  error_message text
);

GRANT SELECT ON public.mtr_sync_log TO authenticated;
GRANT ALL ON public.mtr_sync_log TO service_role;

ALTER TABLE public.mtr_sync_log ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Admins can view sync log" ON public.mtr_sync_log
  FOR SELECT TO authenticated
  USING (public.has_role(auth.uid(), 'admin'));
