CREATE SCHEMA IF NOT EXISTS app_private;
GRANT USAGE ON SCHEMA app_private TO authenticated, service_role;

CREATE OR REPLACE FUNCTION app_private.has_role(_user_id uuid, _role public.app_role)
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path TO 'public'
AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.user_roles WHERE user_id = _user_id AND role = _role
  )
$$;

CREATE OR REPLACE FUNCTION app_private.can_manage_layer(_user_id uuid, _layer_id text)
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path TO 'public, app_private'
AS $$
  SELECT
    app_private.has_role(_user_id, 'admin')
    OR EXISTS (
      SELECT 1 FROM public.layer_managers
      WHERE user_id = _user_id AND layer_id = _layer_id
    );
$$;

REVOKE ALL ON FUNCTION app_private.has_role(uuid, public.app_role) FROM PUBLIC, anon;
REVOKE ALL ON FUNCTION app_private.can_manage_layer(uuid, text) FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION app_private.has_role(uuid, public.app_role) TO authenticated, service_role;
GRANT EXECUTE ON FUNCTION app_private.can_manage_layer(uuid, text) TO authenticated, service_role;

-- actor_connections
DROP POLICY IF EXISTS "Owners or admins can delete connections" ON public.actor_connections;
CREATE POLICY "Owners or admins can delete connections" ON public.actor_connections
FOR DELETE TO authenticated
USING (
  app_private.has_role(auth.uid(), 'admin'::app_role)
  OR EXISTS (SELECT 1 FROM public.profiles p WHERE p.id = actor_connections.source_profile_id AND p.user_id = auth.uid())
);

DROP POLICY IF EXISTS "Owners or admins can update connections" ON public.actor_connections;
CREATE POLICY "Owners or admins can update connections" ON public.actor_connections
FOR UPDATE TO authenticated
USING (
  app_private.has_role(auth.uid(), 'admin'::app_role)
  OR EXISTS (SELECT 1 FROM public.profiles p WHERE p.id = actor_connections.source_profile_id AND p.user_id = auth.uid())
);

DROP POLICY IF EXISTS "Users can declare connections from their own profile" ON public.actor_connections;
CREATE POLICY "Users can declare connections from their own profile" ON public.actor_connections
FOR INSERT TO authenticated
WITH CHECK (
  app_private.has_role(auth.uid(), 'admin'::app_role)
  OR EXISTS (SELECT 1 FROM public.profiles p WHERE p.id = actor_connections.source_profile_id AND p.user_id = auth.uid())
);

-- admin-managed tables
DROP POLICY IF EXISTS "Admins manage ai_hints" ON public.ai_hints;
CREATE POLICY "Admins manage ai_hints" ON public.ai_hints
FOR ALL TO authenticated
USING (app_private.has_role(auth.uid(), 'admin'::app_role))
WITH CHECK (app_private.has_role(auth.uid(), 'admin'::app_role));

DROP POLICY IF EXISTS "Admins manage MTR facets" ON public.mtr_facets;
CREATE POLICY "Admins manage MTR facets" ON public.mtr_facets
FOR ALL TO authenticated
USING (app_private.has_role(auth.uid(), 'admin'::app_role))
WITH CHECK (app_private.has_role(auth.uid(), 'admin'::app_role));

DROP POLICY IF EXISTS "Admins manage MTR products" ON public.mtr_products;
CREATE POLICY "Admins manage MTR products" ON public.mtr_products
FOR ALL TO authenticated
USING (app_private.has_role(auth.uid(), 'admin'::app_role))
WITH CHECK (app_private.has_role(auth.uid(), 'admin'::app_role));

DROP POLICY IF EXISTS "Admins can view sync log" ON public.mtr_sync_log;
CREATE POLICY "Admins can view sync log" ON public.mtr_sync_log
FOR SELECT TO authenticated
USING (app_private.has_role(auth.uid(), 'admin'::app_role));

-- data_source_settings
DROP POLICY IF EXISTS "Admins insert source settings" ON public.data_source_settings;
CREATE POLICY "Admins insert source settings" ON public.data_source_settings
FOR INSERT TO authenticated
WITH CHECK (app_private.has_role(auth.uid(), 'admin'::app_role));

DROP POLICY IF EXISTS "Admins update source settings" ON public.data_source_settings;
CREATE POLICY "Admins update source settings" ON public.data_source_settings
FOR UPDATE TO authenticated
USING (app_private.has_role(auth.uid(), 'admin'::app_role))
WITH CHECK (app_private.has_role(auth.uid(), 'admin'::app_role));

DROP POLICY IF EXISTS "Layer managers can toggle their layer" ON public.data_source_settings;
CREATE POLICY "Layer managers can toggle their layer" ON public.data_source_settings
FOR UPDATE TO authenticated
USING (app_private.can_manage_layer(auth.uid(), source_id))
WITH CHECK (app_private.can_manage_layer(auth.uid(), source_id));

-- events
DROP POLICY IF EXISTS "Authenticated can view approved or own events" ON public.events;
CREATE POLICY "Authenticated can view approved or own events" ON public.events
FOR SELECT TO authenticated
USING (approved = true OR auth.uid() = created_by OR app_private.has_role(auth.uid(), 'admin'::app_role));

DROP POLICY IF EXISTS "Owners or admins can delete events" ON public.events;
CREATE POLICY "Owners or admins can delete events" ON public.events
FOR DELETE TO authenticated
USING (auth.uid() = created_by OR app_private.has_role(auth.uid(), 'admin'::app_role));

DROP POLICY IF EXISTS "Owners or admins can update events" ON public.events;
CREATE POLICY "Owners or admins can update events" ON public.events
FOR UPDATE TO authenticated
USING (auth.uid() = created_by OR app_private.has_role(auth.uid(), 'admin'::app_role))
WITH CHECK (auth.uid() = created_by OR app_private.has_role(auth.uid(), 'admin'::app_role));

-- layer actors and layer managers
DROP POLICY IF EXISTS "Layer managers can delete layer actors" ON public.layer_actors;
CREATE POLICY "Layer managers can delete layer actors" ON public.layer_actors
FOR DELETE TO authenticated
USING (app_private.can_manage_layer(auth.uid(), source_id));

DROP POLICY IF EXISTS "Layer managers can insert layer actors" ON public.layer_actors;
CREATE POLICY "Layer managers can insert layer actors" ON public.layer_actors
FOR INSERT TO authenticated
WITH CHECK (app_private.can_manage_layer(auth.uid(), source_id));

DROP POLICY IF EXISTS "Layer managers can update layer actors" ON public.layer_actors;
CREATE POLICY "Layer managers can update layer actors" ON public.layer_actors
FOR UPDATE TO authenticated
USING (app_private.can_manage_layer(auth.uid(), source_id))
WITH CHECK (app_private.can_manage_layer(auth.uid(), source_id));

DROP POLICY IF EXISTS "Admins can manage layer manager invites" ON public.layer_manager_invites;
CREATE POLICY "Admins can manage layer manager invites" ON public.layer_manager_invites
FOR ALL TO authenticated
USING (app_private.has_role(auth.uid(), 'admin'::app_role))
WITH CHECK (app_private.has_role(auth.uid(), 'admin'::app_role));

DROP POLICY IF EXISTS "Admins manage layer_managers" ON public.layer_managers;
CREATE POLICY "Admins manage layer_managers" ON public.layer_managers
FOR ALL TO authenticated
USING (app_private.has_role(auth.uid(), 'admin'::app_role))
WITH CHECK (app_private.has_role(auth.uid(), 'admin'::app_role));

-- preliminary_imports
DROP POLICY IF EXISTS "Users can delete own preliminary imports" ON public.preliminary_imports;
CREATE POLICY "Users can delete own preliminary imports" ON public.preliminary_imports
FOR DELETE TO authenticated
USING (user_id = auth.uid() OR app_private.has_role(auth.uid(), 'admin'::app_role));

DROP POLICY IF EXISTS "Users can update own preliminary imports" ON public.preliminary_imports;
CREATE POLICY "Users can update own preliminary imports" ON public.preliminary_imports
FOR UPDATE TO authenticated
USING (user_id = auth.uid() OR app_private.has_role(auth.uid(), 'admin'::app_role))
WITH CHECK (user_id = auth.uid() OR app_private.has_role(auth.uid(), 'admin'::app_role));

DROP POLICY IF EXISTS "Users can view own preliminary imports" ON public.preliminary_imports;
CREATE POLICY "Users can view own preliminary imports" ON public.preliminary_imports
FOR SELECT TO authenticated
USING (user_id = auth.uid() OR app_private.has_role(auth.uid(), 'admin'::app_role));

-- user_roles
DROP POLICY IF EXISTS "Admins manage roles" ON public.user_roles;
CREATE POLICY "Admins manage roles" ON public.user_roles
FOR ALL TO authenticated
USING (app_private.has_role(auth.uid(), 'admin'::app_role))
WITH CHECK (app_private.has_role(auth.uid(), 'admin'::app_role));

DROP POLICY IF EXISTS "Users can view own roles" ON public.user_roles;
CREATE POLICY "Users can view own roles" ON public.user_roles
FOR SELECT TO authenticated
USING (user_id = auth.uid() OR app_private.has_role(auth.uid(), 'admin'::app_role));

-- Keep public wrappers unavailable as direct RPC calls from the browser.
REVOKE ALL ON FUNCTION public.has_role(uuid, public.app_role) FROM PUBLIC, anon, authenticated;
REVOKE ALL ON FUNCTION public.can_manage_layer(uuid, text) FROM PUBLIC, anon, authenticated;
REVOKE ALL ON FUNCTION public.get_my_event_edit_token(uuid) FROM PUBLIC, anon, authenticated;
GRANT EXECUTE ON FUNCTION public.has_role(uuid, public.app_role) TO service_role;
GRANT EXECUTE ON FUNCTION public.can_manage_layer(uuid, text) TO service_role;
GRANT EXECUTE ON FUNCTION public.get_my_event_edit_token(uuid) TO service_role;