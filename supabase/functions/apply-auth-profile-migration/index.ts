import 'jsr:@supabase/functions-js/edge-runtime.d.ts'
import { corsHeaders, jsonResponse } from '../_shared/cors.ts'

const SQL_BLOCKS = [
  `CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  meta jsonb;
  role_text text;
  is_prof boolean;
  display_name text;
BEGIN
  meta := COALESCE(NEW.raw_user_meta_data, '{}'::jsonb);
  role_text := lower(COALESCE(meta->>'user_role', 'client'));
  IF role_text = 'advertiser' THEN role_text := 'client';
  ELSIF role_text NOT IN ('client', 'professional', 'company', 'owner') THEN role_text := 'client';
  END IF;
  is_prof := role_text IN ('professional', 'company');
  display_name := nullif(trim(meta->>'full_name'), '');
  IF display_name IS NULL THEN display_name := split_part(COALESCE(NEW.email, 'user'), '@', 1); END IF;
  INSERT INTO public.profiles (id, full_name, user_role, is_professional, phone, location)
  VALUES (NEW.id, display_name, role_text, is_prof, nullif(trim(meta->>'phone'), ''), nullif(trim(meta->>'location'), ''))
  ON CONFLICT (id) DO UPDATE SET
    full_name = COALESCE(nullif(trim(EXCLUDED.full_name), ''), profiles.full_name),
    user_role = CASE WHEN profiles.user_role IS NOT NULL AND profiles.user_role <> 'client' THEN profiles.user_role ELSE EXCLUDED.user_role END,
    is_professional = profiles.is_professional OR EXCLUDED.is_professional,
    phone = COALESCE(EXCLUDED.phone, profiles.phone),
    location = COALESCE(EXCLUDED.location, profiles.location);
  RETURN NEW;
END;
$$`,

  `DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users`,

  `CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW
  EXECUTE FUNCTION public.handle_new_user()`,

  `INSERT INTO public.profiles (id, full_name, user_role, is_professional, phone, location)
SELECT u.id,
  COALESCE(nullif(trim(u.raw_user_meta_data->>'full_name'), ''), split_part(COALESCE(u.email, 'user'), '@', 1)),
  CASE
    WHEN lower(COALESCE(u.raw_user_meta_data->>'user_role', 'client')) = 'advertiser' THEN 'client'
    WHEN lower(COALESCE(u.raw_user_meta_data->>'user_role', 'client')) IN ('professional', 'company', 'owner', 'client')
      THEN lower(COALESCE(u.raw_user_meta_data->>'user_role', 'client'))
    ELSE 'client'
  END,
  lower(COALESCE(u.raw_user_meta_data->>'user_role', 'client')) IN ('professional', 'company'),
  nullif(trim(u.raw_user_meta_data->>'phone'), ''),
  nullif(trim(u.raw_user_meta_data->>'location'), '')
FROM auth.users u
LEFT JOIN public.profiles p ON p.id = u.id
WHERE p.id IS NULL
ON CONFLICT (id) DO NOTHING`,

  `UPDATE public.profiles p SET
  user_role = CASE WHEN lower(u.raw_user_meta_data->>'user_role') IN ('professional', 'company') THEN lower(u.raw_user_meta_data->>'user_role') ELSE p.user_role END,
  is_professional = true,
  full_name = COALESCE(nullif(trim(p.full_name), ''), nullif(trim(u.raw_user_meta_data->>'full_name'), ''), p.full_name)
FROM auth.users u
WHERE p.id = u.id
  AND lower(COALESCE(u.raw_user_meta_data->>'user_role', '')) IN ('professional', 'company')
  AND (p.is_professional IS NOT TRUE OR p.user_role NOT IN ('professional', 'company'))`,

  `CREATE OR REPLACE FUNCTION public.get_public_footer_stats()
RETURNS jsonb
LANGUAGE sql
SECURITY DEFINER
SET search_path = public
STABLE
AS $$
  SELECT jsonb_build_object(
    'total_professionals', (SELECT COUNT(*)::int FROM public.profiles WHERE is_professional = true),
    'total_listings_created', (SELECT COUNT(*)::int FROM public.listings),
    'total_successful_listings', (SELECT COUNT(*)::int FROM public.listings WHERE status IN ('sold', 'completed', 'closed')),
    'total_visits', COALESCE((SELECT total_visits FROM public.app_site_stats WHERE id = 1), 0),
    'countries_count', (SELECT COUNT(DISTINCT COALESCE(nullif(trim(location), ''), 'Unknown')) FROM public.profiles WHERE is_professional = true AND location IS NOT NULL AND trim(location) <> '')
  );
$$`,

  `REVOKE ALL ON FUNCTION public.get_public_footer_stats() FROM PUBLIC`,
  `GRANT EXECUTE ON FUNCTION public.get_public_footer_stats() TO anon, authenticated`,
]

Deno.serve(async (req: Request) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { status: 200, headers: corsHeaders })
  }

  if (req.method !== 'POST') {
    return jsonResponse({ error: 'Method not allowed' }, 405)
  }

  const secret = Deno.env.get('MIGRATION_SECRET')
  const header = req.headers.get('x-migration-secret')
  if (!secret || header !== secret) {
    return jsonResponse({ error: 'Unauthorized' }, 401)
  }

  const dbUrl = Deno.env.get('SUPABASE_DB_URL')
  if (!dbUrl) {
    return jsonResponse({ error: 'SUPABASE_DB_URL is not set on this project' }, 500)
  }

  const { default: postgres } = await import('npm:postgres@3.4.5')
  const sql = postgres(dbUrl, { prepare: false })

  try {
    for (const block of SQL_BLOCKS) {
      await sql.unsafe(block)
    }

    const [{ count }] = await sql<{ count: string }[]>`
      SELECT COUNT(*)::text AS count FROM public.profiles WHERE is_professional = true
    `

    return jsonResponse({ ok: true, total_professionals: Number(count) })
  } catch (err) {
    const message = err instanceof Error ? err.message : String(err)
    return jsonResponse({ error: message }, 500)
  } finally {
    await sql.end({ timeout: 5 })
  }
})
