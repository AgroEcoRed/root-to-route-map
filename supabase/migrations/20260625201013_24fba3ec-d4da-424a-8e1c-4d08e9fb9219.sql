GRANT EXECUTE ON FUNCTION public.has_role(uuid, public.app_role) TO anon, authenticated;
GRANT EXECUTE ON FUNCTION public.can_manage_layer(uuid, text) TO anon, authenticated;

UPDATE public.events
SET focal_name = 'Florencia Arancibia',
    focal_email = 'farancibia@unsam.edu.ar,florenciapaulaarancibia@gmail.com',
    contact_email = 'sec.investigacion.ehys@unsam.edu.ar'
WHERE id = 'c788f31c-b5cd-41f0-b626-be09142f686a';