
-- 1) actor_endorsements: eliminar política inclusiva de anónimos y revocar SELECT a anon
DROP POLICY IF EXISTS "Endorsements row visible (column grants restrict fields)" ON public.actor_endorsements;
REVOKE SELECT ON public.actor_endorsements FROM anon;

-- 2) events: revocar lectura de columnas de contacto y edit_token a anon y authenticated
REVOKE SELECT (contact_email, contact_phone, focal_email, edit_token) ON public.events FROM anon;
REVOKE SELECT (contact_email, contact_phone, focal_email, edit_token) ON public.events FROM authenticated;

-- 3) layer_actors: revocar lectura de datos de contacto de confirmación
REVOKE SELECT (confirmation_email, confirmation_phone) ON public.layer_actors FROM anon;
REVOKE SELECT (confirmation_email, confirmation_phone) ON public.layer_actors FROM authenticated;

-- RPC para que administradores y gestores de capa vean los contactos de confirmación
CREATE OR REPLACE FUNCTION public.get_actor_confirmation_contact(_id uuid)
RETURNS TABLE (confirmation_email text, confirmation_phone text)
LANGUAGE plpgsql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_src text;
BEGIN
  SELECT la.source_id INTO v_src FROM public.layer_actors la WHERE la.id = _id;
  IF v_src IS NULL THEN
    RETURN;
  END IF;
  IF NOT (public.has_role(auth.uid(), 'admin'::app_role) OR public.can_manage_layer(auth.uid(), v_src)) THEN
    RAISE EXCEPTION 'forbidden';
  END IF;
  RETURN QUERY
  SELECT la.confirmation_email, la.confirmation_phone
  FROM public.layer_actors la
  WHERE la.id = _id;
END;
$$;
GRANT EXECUTE ON FUNCTION public.get_actor_confirmation_contact(uuid) TO authenticated;

-- 4) Storage bucket biblioteca: exigir que el archivo esté registrado en library_items
DROP POLICY IF EXISTS "Authenticated can read biblioteca" ON storage.objects;
CREATE POLICY "Authenticated can read registered biblioteca files"
ON storage.objects
FOR SELECT
TO authenticated
USING (
  bucket_id = 'biblioteca'
  AND EXISTS (
    SELECT 1 FROM public.library_items li WHERE li.file_path = storage.objects.name
  )
);
