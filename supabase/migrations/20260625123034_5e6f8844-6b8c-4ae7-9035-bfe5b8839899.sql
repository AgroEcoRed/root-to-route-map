
ALTER TABLE public.layer_actors
  ADD COLUMN IF NOT EXISTS created_by uuid REFERENCES auth.users(id) ON DELETE SET NULL;

-- Allow regular authenticated users to add points to the 'user_points' layer they own.
CREATE POLICY "Users can insert own user_points"
  ON public.layer_actors FOR INSERT
  TO authenticated
  WITH CHECK (source_id = 'user_points' AND created_by = auth.uid());

CREATE POLICY "Users can update own user_points"
  ON public.layer_actors FOR UPDATE
  TO authenticated
  USING (source_id = 'user_points' AND created_by = auth.uid())
  WITH CHECK (source_id = 'user_points' AND created_by = auth.uid());

CREATE POLICY "Users can delete own user_points"
  ON public.layer_actors FOR DELETE
  TO authenticated
  USING (source_id = 'user_points' AND created_by = auth.uid());
