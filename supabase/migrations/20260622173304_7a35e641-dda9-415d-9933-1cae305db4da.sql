
-- 1) Revoke EXECUTE on SECURITY DEFINER helper from anon / PUBLIC.
REVOKE EXECUTE ON FUNCTION public.can_manage_layer(uuid, text) FROM anon, PUBLIC;

-- 2) Sanitize layer_actors: move email out of description into contact, then strip emails/phones from description.
-- 2a) Backfill contact with first email found in description when contact is empty/null.
UPDATE public.layer_actors
SET contact = COALESCE(
      NULLIF(btrim(contact), ''),
      (regexp_match(description, '[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Za-z]{2,}'))[1]
    )
WHERE description IS NOT NULL
  AND description ~ '[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Za-z]{2,}'
  AND (contact IS NULL OR btrim(contact) = '');

-- 2b) Remove email addresses from description.
UPDATE public.layer_actors
SET description = btrim(regexp_replace(description, '[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Za-z]{2,}', '', 'g'))
WHERE description ~ '[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Za-z]{2,}';

-- 2c) Remove phone-like patterns (7+ digit groups, optional +, spaces, parens, dashes) from description.
UPDATE public.layer_actors
SET description = btrim(regexp_replace(description, '\+?\d[\d\s().\-]{6,}\d', '', 'g'))
WHERE description ~ '\+?\d[\d\s().\-]{6,}\d';

-- 2d) Tidy up dangling labels like "Email:", "Tel.", "Cel." and orphan punctuation left after stripping.
UPDATE public.layer_actors
SET description = btrim(regexp_replace(
      regexp_replace(description, '(?i)\m(e-?mail|correo|tel\.?|tel[ée]fono|cel\.?|celular|whats?app|contacto)\M[ :/-]*', ' ', 'g'),
      '[ \t]*[/,-]+[ \t]*(?=[/,-]|$)', ' ', 'g'))
WHERE description IS NOT NULL;

-- 2e) Column-level visibility: hide `contact` from anonymous visitors.
REVOKE SELECT ON public.layer_actors FROM anon;
GRANT SELECT (
  id, name, actor_type, address, description, lat, lng,
  source_id, family, delivery_days, extra, verified_at, created_at, updated_at
) ON public.layer_actors TO anon;
-- Authenticated and service_role keep full SELECT (no change).
GRANT SELECT ON public.layer_actors TO authenticated;

-- 3) Storage: bucket flipped to private via the storage tool. Add an
-- authenticated read policy so signed-in users can fetch / signed-URL library files.
DROP POLICY IF EXISTS "Authenticated can read biblioteca" ON storage.objects;
CREATE POLICY "Authenticated can read biblioteca"
ON storage.objects
FOR SELECT
TO authenticated
USING (bucket_id = 'biblioteca');
