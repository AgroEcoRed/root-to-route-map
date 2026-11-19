CREATE TABLE public.private_order_links (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  order_slug text NOT NULL UNIQUE,
  access_key_hash text NOT NULL UNIQUE CHECK (access_key_hash ~ '^[0-9a-f]{64}$'),
  payload jsonb NOT NULL CHECK (jsonb_typeof(payload) = 'object'),
  revoked_at timestamp with time zone,
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  updated_at timestamp with time zone NOT NULL DEFAULT now()
);
GRANT ALL ON public.private_order_links TO service_role;
ALTER TABLE public.private_order_links ENABLE ROW LEVEL SECURITY;
REVOKE ALL ON public.private_order_links FROM anon, authenticated;