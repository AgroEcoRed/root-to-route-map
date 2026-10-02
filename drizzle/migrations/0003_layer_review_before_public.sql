CREATE OR REPLACE FUNCTION public.layer_actors_review_gate()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE p jsonb;
BEGIN
  SELECT privacy INTO p FROM public.data_source_settings WHERE source_id = NEW.source_id;
  IF COALESCE((p->>'require_review')::boolean, false) THEN
    NEW.public_visible := false;
    NEW.confirmation_status := 'pending_review';
  END IF;
  RETURN NEW;
END;
$$;
REVOKE ALL ON FUNCTION public.layer_actors_review_gate() FROM PUBLIC, anon, authenticated;
CREATE TRIGGER layer_actors_review_gate
BEFORE INSERT ON public.layer_actors
FOR EACH ROW EXECUTE FUNCTION public.layer_actors_review_gate();

CREATE OR REPLACE FUNCTION public.review_layer_actor(_id uuid, _decision text)
RETURNS public.layer_actors
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE r public.layer_actors; v_src text;
BEGIN
  IF _decision NOT IN ('approve','reject') THEN RAISE EXCEPTION 'Decisión inválida'; END IF;
  SELECT source_id INTO v_src FROM public.layer_actors WHERE id = _id;
  IF v_src IS NULL THEN RAISE EXCEPTION 'No existe'; END IF;
  IF auth.uid() IS NULL OR NOT app_private.can_manage_layer(auth.uid(), v_src) THEN RAISE EXCEPTION 'forbidden'; END IF;
  UPDATE public.layer_actors SET
    public_visible = (_decision = 'approve'),
    confirmation_status = CASE WHEN _decision = 'approve' THEN 'confirmed' ELSE 'rejected' END,
    verified_at = CASE WHEN _decision = 'approve' THEN now() ELSE verified_at END,
    verified_by_role = CASE WHEN _decision = 'approve' THEN 'layer_manager' ELSE verified_by_role END
  WHERE id = _id RETURNING * INTO r;
  RETURN r;
END;
$$;
REVOKE ALL ON FUNCTION public.review_layer_actor(uuid, text) FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.review_layer_actor(uuid, text) TO authenticated;