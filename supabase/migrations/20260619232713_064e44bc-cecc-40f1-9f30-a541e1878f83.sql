
CREATE POLICY "Layer managers can toggle their layer"
  ON public.data_source_settings FOR UPDATE
  TO authenticated
  USING (public.can_manage_layer(auth.uid(), source_id))
  WITH CHECK (public.can_manage_layer(auth.uid(), source_id));
