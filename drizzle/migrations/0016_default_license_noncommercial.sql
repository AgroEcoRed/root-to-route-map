ALTER TABLE public.producer_media ALTER COLUMN license SET DEFAULT 'CC-BY-NC-SA-4.0';
--> statement-breakpoint
ALTER TABLE public.profiles ALTER COLUMN content_license SET DEFAULT 'CC-BY-NC-SA-4.0';
--> statement-breakpoint
ALTER TABLE public.library_items ALTER COLUMN license SET DEFAULT 'CC-BY-NC-SA-4.0';
