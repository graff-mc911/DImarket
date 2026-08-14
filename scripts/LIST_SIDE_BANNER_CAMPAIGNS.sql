-- List campaigns that still reference retired side / left / right placements.
-- Run in Supabase SQL Editor (service role). Do NOT auto-delete.
-- After owner confirmation: UPDATE status='inactive' or DELETE.

SELECT
  c.id AS campaign_id,
  COALESCE(p.full_name, p.email, c.advertiser_id::text) AS advertiser,
  c.placement,
  c.placements,
  c.status,
  c.title,
  c.starts_at,
  c.ends_at,
  c.updated_at
FROM ad_campaigns c
LEFT JOIN profiles p ON p.id = c.advertiser_id
WHERE
  c.placement IN ('sidebar', 'side_left', 'side_right')
  OR c.placements && ARRAY[
    'sidebar',
    'side_left',
    'side_right',
    'home_side_l1', 'home_side_l2', 'home_side_l3', 'home_side_l4',
    'home_side_r1', 'home_side_r2', 'home_side_r3', 'home_side_r4',
    'listings_side_l1', 'listings_side_l2', 'listings_side_l3', 'listings_side_l4',
    'listings_side_r1', 'listings_side_r2', 'listings_side_r3', 'listings_side_r4',
    'professionals_side_l1', 'professionals_side_l2', 'professionals_side_l3', 'professionals_side_l4',
    'professionals_side_r1', 'professionals_side_r2', 'professionals_side_r3', 'professionals_side_r4',
    'default_side_l1', 'default_side_l2', 'default_side_l3', 'default_side_l4',
    'default_side_r1', 'default_side_r2', 'default_side_r3', 'default_side_r4'
  ]::text[]
  OR EXISTS (
    SELECT 1
    FROM unnest(COALESCE(c.placements, ARRAY[]::text[])) AS slot
    WHERE slot ILIKE '%_side_%'
       OR slot IN ('sidebar', 'side_left', 'side_right')
  )
ORDER BY c.updated_at DESC NULLS LAST;
