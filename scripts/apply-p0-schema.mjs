/**
 * Apply P0 schema gaps on prod via Supabase Management API.
 *
 * Requires .env.local: SUPABASE_ACCESS_TOKEN=sbp_...
 *
 * Usage: node scripts/apply-p0-schema.mjs
 */
import { readFileSync, existsSync } from 'fs'
import { resolve, dirname } from 'path'
import { fileURLToPath } from 'url'
import { createClient } from '@supabase/supabase-js'

const __dirname = dirname(fileURLToPath(import.meta.url))
const root = resolve(__dirname, '..')
const projectRef = 'wjlfvajloxkevggwjgtk'

function loadEnvFile(name) {
  const path = resolve(root, name)
  if (!existsSync(path)) return {}
  const out = {}
  for (const line of readFileSync(path, 'utf8').split('\n')) {
    const t = line.trim()
    if (!t || t.startsWith('#')) continue
    const i = t.indexOf('=')
    if (i < 1) continue
    out[t.slice(0, i).trim()] = t.slice(i + 1).trim().replace(/^["']|["']$/g, '')
  }
  return out
}

function cleanEnvValue(v) {
  if (v == null) return ''
  let s = String(v).trim().replace(/^["']|["']$/g, '')
  if (!s || s === '[SENSITIVE]' || s.includes('[SENSITIVE]')) return ''
  // Reject placeholders like sbp_... / ...
  if (/^\.{2,}$/.test(s) || /_?\.\.\.$/.test(s) || s === 'PASTE_ANON_KEY_HERE') return ''
  return s
}

const fileEnv = {
  ...loadEnvFile('.env'),
  ...loadEnvFile('.env.local'),
  ...loadEnvFile('.env.vercel.local'),
}
const env = { ...fileEnv }
for (const [k, v] of Object.entries(process.env)) {
  const cleaned = cleanEnvValue(v)
  if (cleaned) env[k] = cleaned
}

const token = cleanEnvValue(env.SUPABASE_ACCESS_TOKEN)
const url = (
  cleanEnvValue(env.VITE_SUPABASE_URL) ||
  cleanEnvValue(env.SUPABASE_URL) ||
  `https://${projectRef}.supabase.co`
).replace(/\/$/, '')
let anonKey = cleanEnvValue(env.VITE_SUPABASE_ANON_KEY)

if (!token) {
  console.error(`
SUPABASE_ACCESS_TOKEN missing or is a placeholder (sbp_...).

1) Create token: https://supabase.com/dashboard/account/tokens
2) Put real value in .env.local:
   SUPABASE_ACCESS_TOKEN=sbp_...real...
3) Re-run: npm run db:apply-p0

Manual fallback (SQL Editor):
  scripts/sql/p0-prod-apply.sql
`)
  process.exit(1)
}

/** Re-apply category page RPC after city_name / wizard cols exist (full 251400 file is huge seed). */
const categoryPageRpcSql = `
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
        EXISTS (
          SELECT 1 FROM unnest(coalesce(li.subcategory_slugs, '{}'::text[])) w
          WHERE w LIKE cat.slug || '-%' OR w = cat.slug
        )
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

GRANT EXECUTE ON FUNCTION public.get_marketplace_category_page(text) TO anon, authenticated;
`

const steps = [
  {
    name: '1/7 project wizard columns + project_files',
    file: 'supabase/migrations/20260720120000_create_project_wizard_ensure.sql',
  },
  {
    name: '2/7 listings geo + realtime',
    file: 'supabase/migrations/20260720140000_project_feed_geo_realtime.sql',
  },
  {
    name: '3/7 AI match profile fields',
    file: 'supabase/migrations/20260720150000_ai_match_profile_fields.sql',
  },
  {
    name: '4/7 review system upgrade',
    file: 'supabase/migrations/20260722150000_review_system_upgrade.sql',
  },
  {
    name: '5/7 homepage_metrics',
    file: 'supabase/migrations/20260725180000_homepage_metrics.sql',
  },
  {
    name: '6/7 get_marketplace_category_page RPC',
    sql: categoryPageRpcSql,
  },
  {
    name: '7/7 category completed_projects_count',
    file: 'supabase/migrations/20260725190000_category_completed_projects.sql',
  },
]

async function applyQuery(label, sql) {
  console.log(`\n→ ${label}`)
  const res = await fetch(
    `https://api.supabase.com/v1/projects/${projectRef}/database/query`,
    {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${token}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ query: sql }),
    },
  )
  const body = await res.text()
  if (!res.ok) {
    console.error(`FAIL ${res.status}:`, body.slice(0, 1200))
    return false
  }
  console.log('OK', body.slice(0, 160) || '')
  return true
}

let failed = 0
for (const step of steps) {
  const sql = step.sql ?? readFileSync(resolve(root, step.file), 'utf8')
  const ok = await applyQuery(step.name, sql)
  if (!ok) failed += 1
}

console.log('\n--- smoke ---')
if (!anonKey) {
  try {
    const html = await (await fetch('https://dimarket.app/')).text()
    const jsPath = (html.match(/\/assets\/index-[^"]+\.js/) || [])[0]
    if (jsPath) {
      const js = await (await fetch(`https://dimarket.app${jsPath}`)).text()
      anonKey = (js.match(/eyJ[a-zA-Z0-9_-]{20,}\.[a-zA-Z0-9_-]+\.[a-zA-Z0-9_-]+/) || [])[0] || ''
      if (anonKey) console.log('Using public anon key from dimarket.app bundle for smoke')
    }
  } catch (e) {
    console.warn('Could not load prod anon key:', e.message)
  }
}
if (!anonKey) {
  console.warn('No VITE_SUPABASE_ANON_KEY — skip REST smoke')
  process.exit(failed ? 1 : 0)
}

const sb = createClient(url, anonKey)

const checks = [
  {
    name: 'listings.city_name+geo',
    run: () =>
      sb.from('listings').select('id,city_name,latitude,longitude,budget_min,urgency').limit(1),
  },
  {
    name: 'project_files',
    run: () => sb.from('project_files').select('id').limit(1),
  },
  {
    name: 'profiles.ai_fields',
    run: () =>
      sb
        .from('profiles')
        .select('id,service_latitude,service_longitude,completed_jobs,languages,availability_status')
        .limit(1),
  },
  {
    name: 'reviews.is_verified_customer',
    run: () => sb.from('reviews').select('id,is_verified_customer,like_count,media_urls').limit(1),
  },
  {
    name: 'homepage_metrics table',
    run: () => sb.from('homepage_metrics').select('key,value_num').limit(5),
  },
  {
    name: 'get_homepage_metrics',
    run: () => sb.rpc('get_homepage_metrics'),
  },
  {
    name: 'get_marketplace_category_page',
    run: () => sb.rpc('get_marketplace_category_page', { p_slug: 'construction' }),
  },
  {
    name: 'get_marketplace_main_categories',
    run: () => sb.rpc('get_marketplace_main_categories'),
  },
  {
    name: 'categories.completed_projects_count',
    run: () => sb.from('categories').select('slug,completed_projects_count').eq('is_main', true).limit(3),
  },
]

for (const c of checks) {
  const { data, error } = await c.run()
  if (error) {
    failed += 1
    console.log(`✗ ${c.name}: ${error.message}`)
  } else {
    const preview =
      data == null
        ? 'null'
        : Array.isArray(data)
          ? `rows=${data.length}`
          : typeof data === 'object'
            ? `ok=${data.ok ?? 'n/a'} keys=${Object.keys(data).slice(0, 6).join(',')}`
            : String(data).slice(0, 80)
    console.log(`✓ ${c.name}: ${preview}`)
  }
}

process.exit(failed ? 1 : 0)
