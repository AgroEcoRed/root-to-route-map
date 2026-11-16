UPDATE public.gov_programs SET url = 'https://www.argentina.gob.ar/agricultura/agricultura-familiar' WHERE url = 'https://www.argentina.gob.ar/agricultura/agricultura-familiar/renaf';
--> statement-breakpoint
UPDATE public.gov_programs SET url = 'https://www.afip.gob.ar/monotributo/monotributo-social/' WHERE url = 'https://www.argentina.gob.ar/desarrollosocial/monotributosocial';
--> statement-breakpoint
UPDATE public.gov_programs SET url = 'https://www.gov.br/mda/pt-br' WHERE url LIKE 'https://www.gov.br/agricultura/pt-br/assuntos/agricultura-familiar/%';
--> statement-breakpoint
UPDATE public.gov_programs SET url = 'https://www.indap.gob.cl/' WHERE url = 'https://www.indap.gob.cl/programas/prodesal';
--> statement-breakpoint
UPDATE public.gov_programs SET url = 'https://www.sag.gob.cl/' WHERE url = 'https://www.sag.gob.cl/ambitos-de-accion/agricultura-organica';
