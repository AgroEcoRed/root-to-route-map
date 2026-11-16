CREATE TABLE public.layer_export_requests (
 id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
 layer_id text NOT NULL REFERENCES public.data_source_settings(source_id),
 requester_id uuid NOT NULL,
 requester_name text NOT NULL,
 purpose text NOT NULL CHECK (char_length(purpose) BETWEEN 10 AND 2000),
 status text NOT NULL DEFAULT 'pending' CHECK (status IN ('pending','approved','rejected','revoked')),
 reviewed_by uuid,
 reviewed_at timestamptz,
 created_at timestamptz NOT NULL DEFAULT now(),
 UNIQUE(layer_id, requester_id)
);
GRANT SELECT ON public.layer_export_requests TO authenticated;
GRANT ALL ON public.layer_export_requests TO service_role;
ALTER TABLE public.layer_export_requests ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Requester and layer team read export requests" ON public.layer_export_requests FOR SELECT TO authenticated USING (requester_id = auth.uid() OR app_private.can_manage_layer(auth.uid(),layer_id));
CREATE INDEX layer_export_requests_status_idx ON public.layer_export_requests(layer_id,status);