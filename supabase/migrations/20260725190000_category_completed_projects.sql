-- Extend marketplace categories with completed projects cache
ALTER TABLE categories
  ADD COLUMN IF NOT EXISTS completed_projects_count integer NOT NULL DEFAULT 0;

CREATE OR REPLACE FUNCTION public.refresh_marketplace_category_stats()
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  UPDATE categories c SET
    services_count = (
      SELECT COUNT(*) FROM categories s
      WHERE s.parent_id = c.id AND coalesce(s.is_service, false) = true
    ),
    professionals_count = (
      SELECT COUNT(DISTINCT p.id)
      FROM profiles p
      WHERE p.is_professional = true
        AND (
          EXISTS (
            SELECT 1 FROM unnest(coalesce(p.work_subcategory_slugs, '{}'::text[])) w
            WHERE w LIKE c.slug || '-%' OR w = c.slug
          )
          OR EXISTS (
            SELECT 1
            FROM professional_categories pc
            JOIN categories sc ON sc.id = pc.category_id
            WHERE pc.profile_id = p.id
              AND (sc.id = c.id OR sc.parent_id = c.id OR sc.slug LIKE c.slug || '-%')
          )
        )
    ),
    avg_rating = (
      SELECT ROUND(AVG(p.rating)::numeric, 2)
      FROM profiles p
      WHERE p.is_professional = true
        AND coalesce(p.total_reviews, 0) > 0
        AND (
          EXISTS (
            SELECT 1 FROM unnest(coalesce(p.work_subcategory_slugs, '{}'::text[])) w
            WHERE w LIKE c.slug || '-%' OR w = c.slug
          )
        )
    ),
    completed_projects_count = GREATEST(
      COALESCE((
        SELECT COUNT(*)::integer
        FROM listings li
        WHERE li.listing_type = 'service_request'
          AND (
            EXISTS (
              SELECT 1 FROM unnest(coalesce(li.subcategory_slugs, '{}'::text[])) w
              WHERE w LIKE c.slug || '-%' OR w = c.slug
            )
            OR EXISTS (
              SELECT 1 FROM categories sc
              WHERE sc.id = li.category_id
                AND (sc.id = c.id OR sc.parent_id = c.id OR sc.slug = c.slug)
            )
          )
      ), 0),
      COALESCE((
        SELECT SUM(coalesce(p.completed_jobs, 0))::integer
        FROM profiles p
        WHERE p.is_professional = true
          AND EXISTS (
            SELECT 1 FROM unnest(coalesce(p.work_subcategory_slugs, '{}'::text[])) w
            WHERE w LIKE c.slug || '-%' OR w = c.slug
          )
      ), 0)
    ),
    updated_at = now()
  WHERE c.is_main = true;

  UPDATE categories c SET
    services_count = (
      SELECT COUNT(*) FROM categories s WHERE s.parent_id = c.id
    )
  WHERE c.slug = 'construction';
END;
$$;

CREATE OR REPLACE FUNCTION public.get_marketplace_main_categories()
RETURNS jsonb
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT coalesce(jsonb_agg(row_to_json(t)::jsonb ORDER BY t.sort_order), '[]'::jsonb)
  FROM (
    SELECT
      id, name, slug, icon, icon_key, cover_image_url, description,
      name_i18n, description_i18n, sort_order,
      services_count, professionals_count, avg_rating, completed_projects_count
    FROM categories
    WHERE is_main = true
    ORDER BY sort_order, name
  ) t;
$$;

SELECT public.refresh_marketplace_category_stats();
