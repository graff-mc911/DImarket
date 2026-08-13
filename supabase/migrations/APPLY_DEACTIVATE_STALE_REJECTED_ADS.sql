-- Production hotfix: owner-cancelled campaigns left with status='active'
-- (review_note contains Відхилено/скасовано) still appear on dimarket.app.
-- Safe: only touches rows whose review_note already indicates owner cancellation.
-- Known live row: 4ef33bff-593e-476f-966f-f2854fb3eb26
--   title: "This will be your advertisement."
--   review_note: owner_managed: Відхилено власником
--   status was incorrectly still 'active'

UPDATE public.ad_campaigns
SET
  status = 'rejected',
  approved_by = NULL,
  approved_at = NULL,
  updated_at = now()
WHERE status = 'active'
  AND (
    id = '4ef33bff-593e-476f-966f-f2854fb3eb26'::uuid
    OR review_note ILIKE '%відхилено%'
    OR review_note ILIKE '%скасовано%'
    OR review_note ILIKE '%rejected%'
    OR review_note ILIKE '%cancelled%'
    OR review_note ILIKE '%canceled%'
  );

-- Align owner profile flag so dashboard reject/delete UPDATE matches RLS
-- (UI email bypass ≠ is_site_owner() in DB).
UPDATE public.profiles p
SET
  is_site_owner = true,
  user_role = COALESCE(NULLIF(p.user_role, ''), 'owner'),
  updated_at = now()
FROM auth.users u
WHERE u.id = p.id
  AND lower(u.email) = lower('ivan.sovban@gmail.com');
