-- Soft-delete Cursor Cloud agent test projects from public feeds.
-- Safe to re-run.

UPDATE public.listings
SET
  status = 'deleted',
  updated_at = now()
WHERE status IS DISTINCT FROM 'deleted'
  AND (
    id = '5bd4ed77-5926-4def-846d-e8396079fefa'
    OR title ILIKE '%Cursor Cloud test%'
    OR description ILIKE '%Test listing created by Cursor Cloud%'
  );

SELECT id, title, status, location, updated_at
FROM public.listings
WHERE id = '5bd4ed77-5926-4def-846d-e8396079fefa'
   OR title ILIKE '%Cursor Cloud test%';
