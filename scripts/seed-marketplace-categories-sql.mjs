import fs from 'fs'

const src = fs.readFileSync('src/lib/constructionWorkGroups.ts', 'utf8')
const groups = []
const groupRe =
  /\{\s*slug:\s*'([^']+)',\s*label:\s*\{([^}]+)\},\s*subcategories:\s*\[([\s\S]*?)\]\s*,?\s*\}/g
let m
while ((m = groupRe.exec(src))) {
  const slug = m[1]
  const subs = []
  const subRe = /\{\s*slug:\s*'([^']+)',\s*label:\s*\{([^}]+)\}/g
  let s
  while ((s = subRe.exec(m[3]))) {
    const labelBlock = s[2]
    const pick = (key) => {
      const re = new RegExp(key + ":\\s*'((?:\\\\'|[^'])*)'")
      const hit = labelBlock.match(re)
      return hit ? hit[1].replace(/\\'/g, "'") : null
    }
    const en = pick('en') || s[1]
    const uk = pick('uk') || en
    const ru = pick('ru') || en
    subs.push({ slug: s[1], en, uk, ru })
  }
  groups.push({ slug, subs })
}

let sql = '\n-- Seed services (subcategories)\nDO $$\nBEGIN\n'
for (const g of groups) {
  g.subs.forEach((sub, i) => {
    const nameI18n = JSON.stringify({ en: sub.en, uk: sub.uk, ru: sub.ru }).replace(/'/g, "''")
    const enEsc = sub.en.replace(/'/g, "''")
    sql += `  PERFORM public.upsert_marketplace_category('${sub.slug}', '${enEsc}', '${g.slug}', NULL, NULL, NULL, false, true, ${(i + 1) * 10}, '${nameI18n}'::jsonb, '{}'::jsonb);\n`
  })
}
sql += 'END $$;\n'

sql += `
-- Refresh cached counts on main categories
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
    updated_at = now()
  WHERE c.is_main = true;

  UPDATE categories c SET
    services_count = (
      SELECT COUNT(*) FROM categories s WHERE s.parent_id = c.id
    )
  WHERE c.slug = 'construction';
END;
$$;

SELECT public.refresh_marketplace_category_stats();

GRANT EXECUTE ON FUNCTION public.refresh_marketplace_category_stats() TO authenticated, service_role;
GRANT EXECUTE ON FUNCTION public.upsert_marketplace_category(text, text, text, text, text, text, boolean, boolean, integer, jsonb, jsonb) TO service_role;

-- Public read of marketplace categories (already typically public SELECT on categories)
DROP POLICY IF EXISTS "categories_public_read" ON categories;
CREATE POLICY "categories_public_read" ON categories
  FOR SELECT USING (true);

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
      services_count, professionals_count, avg_rating
    FROM categories
    WHERE is_main = true
    ORDER BY sort_order, name
  ) t;
$$;

CREATE OR REPLACE FUNCTION public.get_marketplace_category_page(p_slug text)
RETURNS jsonb
LANGUAGE plpgsql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  cat categories%ROWTYPE;
  services jsonb;
  pros jsonb;
  projects jsonb;
BEGIN
  SELECT * INTO cat FROM categories WHERE slug = p_slug LIMIT 1;
  IF NOT FOUND THEN
    RETURN jsonb_build_object('ok', false, 'error', 'not_found');
  END IF;

  SELECT coalesce(jsonb_agg(row_to_json(s)::jsonb ORDER BY s.sort_order), '[]'::jsonb)
  INTO services
  FROM (
    SELECT id, name, slug, icon, icon_key, name_i18n, description_i18n, sort_order, parent_id
    FROM categories
    WHERE parent_id = cat.id AND coalesce(is_service, true) = true
    ORDER BY sort_order, name
  ) s;

  -- If this is a main category with no services, try children that are mains? no — services only

  SELECT coalesce(jsonb_agg(row_to_json(p)::jsonb), '[]'::jsonb)
  INTO pros
  FROM (
    SELECT
      pr.id, pr.full_name, pr.profile_photo, pr.avatar_url, pr.location,
      pr.rating, pr.total_reviews, pr.is_verified, pr.is_premium, pr.is_featured,
      pr.work_subcategory_slugs
    FROM profiles pr
    WHERE pr.is_professional = true
      AND (
        EXISTS (
          SELECT 1 FROM unnest(coalesce(pr.work_subcategory_slugs, '{}'::text[])) w
          WHERE w LIKE cat.slug || '-%' OR w = cat.slug
        )
      )
    ORDER BY pr.is_featured DESC NULLS LAST, pr.is_premium DESC NULLS LAST, pr.rating DESC NULLS LAST
    LIMIT 12
  ) p;

  SELECT coalesce(jsonb_agg(row_to_json(l)::jsonb), '[]'::jsonb)
  INTO projects
  FROM (
    SELECT
      li.id, li.title, li.description, li.location, li.city_name, li.created_at,
      li.urgency, li.budget_min, li.budget_max
    FROM listings li
    WHERE li.listing_type = 'service_request'
      AND coalesce(li.status, 'active') = 'active'
      AND (
        li.work_subcategory_slug LIKE cat.slug || '-%'
        OR li.work_subcategory_slug = cat.slug
        OR EXISTS (
          SELECT 1 FROM categories sc
          WHERE sc.id = li.category_id
            AND (sc.id = cat.id OR sc.parent_id = cat.id OR sc.slug = cat.slug)
        )
      )
    ORDER BY li.created_at DESC
    LIMIT 8
  ) l;

  RETURN jsonb_build_object(
    'ok', true,
    'category', row_to_json(cat),
    'services', services,
    'professionals', pros,
    'projects', projects
  );
END;
$$;

GRANT EXECUTE ON FUNCTION public.get_marketplace_main_categories() TO anon, authenticated;
GRANT EXECUTE ON FUNCTION public.get_marketplace_category_page(text) TO anon, authenticated;
`

fs.appendFileSync('supabase/migrations/20260725140000_marketplace_categories.sql', sql)
console.log('groups', groups.length, 'services', groups.reduce((a, g) => a + g.subs.length, 0))
