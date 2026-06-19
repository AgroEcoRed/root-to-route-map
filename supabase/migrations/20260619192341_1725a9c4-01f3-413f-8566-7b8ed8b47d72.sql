INSERT INTO public.data_source_settings (source_id, label, enabled) VALUES
  ('el_click', 'El Click Bolsones', true),
  ('el_brote', 'El Brote Tienda', true)
ON CONFLICT (source_id) DO NOTHING;