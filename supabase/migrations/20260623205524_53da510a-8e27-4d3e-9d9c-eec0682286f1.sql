
-- AI hints: reusable rules/snippets the AI takes as extra context
CREATE TYPE public.ai_hint_scope AS ENUM ('registration', 'chatbot', 'both');

CREATE TABLE public.ai_hints (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  scope public.ai_hint_scope NOT NULL DEFAULT 'both',
  title TEXT NOT NULL,
  content TEXT NOT NULL,
  tags TEXT[] NOT NULL DEFAULT '{}',
  enabled BOOLEAN NOT NULL DEFAULT true,
  priority INTEGER NOT NULL DEFAULT 0,
  created_by UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

GRANT SELECT, INSERT, UPDATE, DELETE ON public.ai_hints TO authenticated;
GRANT ALL ON public.ai_hints TO service_role;

ALTER TABLE public.ai_hints ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Admins manage ai_hints"
  ON public.ai_hints FOR ALL
  TO authenticated
  USING (public.has_role(auth.uid(), 'admin'))
  WITH CHECK (public.has_role(auth.uid(), 'admin'));

CREATE TRIGGER ai_hints_updated_at
  BEFORE UPDATE ON public.ai_hints
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE INDEX ai_hints_scope_enabled_idx ON public.ai_hints (scope, enabled, priority DESC);
