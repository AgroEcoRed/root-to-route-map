CREATE OR REPLACE FUNCTION public.events_approval_guard()
RETURNS trigger LANGUAGE plpgsql SECURITY DEFINER SET search_path TO 'public' AS $$
BEGIN
  IF current_user IN ('authenticated','anon') THEN
    IF NOT (public.has_role(auth.uid(),'admin'::app_role)
            OR (NEW.layer_id IS NOT NULL AND public.can_manage_layer(auth.uid(), NEW.layer_id))) THEN
      IF TG_OP = 'INSERT' THEN NEW.approved := false;
      ELSE NEW.approved := OLD.approved; END IF;
    END IF;
  END IF;
  RETURN NEW;
END $$;
DROP TRIGGER IF EXISTS events_approval_guard ON public.events;
CREATE TRIGGER events_approval_guard BEFORE INSERT OR UPDATE ON public.events
FOR EACH ROW EXECUTE FUNCTION public.events_approval_guard();

CREATE OR REPLACE FUNCTION public.layer_actors_verification_guard()
RETURNS trigger LANGUAGE plpgsql SECURITY DEFINER SET search_path TO 'public' AS $$
BEGIN
  IF current_user IN ('authenticated','anon') AND NOT public.can_manage_layer(auth.uid(), NEW.source_id) THEN
    IF TG_OP = 'INSERT' THEN
      NEW.verified_at := NULL; NEW.verified_by_role := NULL;
    ELSE
      NEW.verified_at := OLD.verified_at; NEW.verified_by_role := OLD.verified_by_role;
    END IF;
  END IF;
  RETURN NEW;
END $$;
DROP TRIGGER IF EXISTS layer_actors_verification_guard ON public.layer_actors;
CREATE TRIGGER layer_actors_verification_guard BEFORE INSERT OR UPDATE ON public.layer_actors
FOR EACH ROW EXECUTE FUNCTION public.layer_actors_verification_guard();