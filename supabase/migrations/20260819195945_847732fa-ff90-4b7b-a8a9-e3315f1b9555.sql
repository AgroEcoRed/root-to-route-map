INSERT INTO public.data_source_settings (source_id, label, enabled)
VALUES ('mes_agroecologia', 'Mes de la Agroecología', true)
ON CONFLICT (source_id) DO UPDATE SET label = EXCLUDED.label, enabled = true, updated_at = now();

INSERT INTO public.layer_manager_invites (email, layer_id)
VALUES ('mesdelaagroecologia@gmail.com', 'mes_agroecologia')
ON CONFLICT DO NOTHING;