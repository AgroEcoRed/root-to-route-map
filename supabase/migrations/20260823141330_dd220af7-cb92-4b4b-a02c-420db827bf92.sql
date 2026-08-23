DROP POLICY IF EXISTS "Layer managers manage their layer events" ON public.events;
CREATE POLICY "Layer managers manage their layer events"
ON public.events
FOR ALL
TO authenticated
USING (layer_id IS NOT NULL AND app_private.can_manage_layer(auth.uid(), layer_id))
WITH CHECK (layer_id IS NOT NULL AND app_private.can_manage_layer(auth.uid(), layer_id));

DROP POLICY IF EXISTS "Admins view all referrals" ON public.referrals;
CREATE POLICY "Admins view all referrals"
ON public.referrals
FOR SELECT
TO authenticated
USING (app_private.has_role(auth.uid(), 'admin'::app_role));