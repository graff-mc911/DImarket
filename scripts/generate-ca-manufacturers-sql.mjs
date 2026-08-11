/**
 * Generate idempotent SQL to seed Commercial Agents manufacturer_profiles
 * from data/commercial-agents/manufacturers-europe.json
 *
 * node scripts/generate-ca-manufacturers-sql.mjs
 */
import { readFileSync, writeFileSync, mkdirSync } from 'fs'
import { resolve, dirname } from 'path'
import { createHash } from 'crypto'
import { fileURLToPath } from 'url'

const __dirname = dirname(fileURLToPath(import.meta.url))
const root = resolve(__dirname, '..')
const dataPath = resolve(root, 'data/commercial-agents/manufacturers-europe.json')
const outPath = resolve(root, 'supabase/migrations/SEED_CA_MANUFACTURERS_REAL.sql')

const rows = JSON.parse(readFileSync(dataPath, 'utf8'))

function uuidFromSlug(slug) {
  const h = createHash('sha256').update(`dimarket-ca-mfr:${slug}`).digest('hex')
  return `${h.slice(0, 8)}-${h.slice(8, 12)}-4${h.slice(13, 16)}-a${h.slice(17, 20)}-${h.slice(20, 32)}`
}

function esc(s) {
  if (s == null) return 'NULL'
  return `'${String(s).replace(/'/g, "''")}'`
}

function textArr(arr) {
  if (!arr?.length) return `'{}'::text[]`
  return `ARRAY[${arr.map((x) => esc(x)).join(', ')}]::text[]`
}

const parts = []
parts.push(`-- ============================================================`)
parts.push(`-- Commercial Agents — REAL manufacturer profiles (Europe brands)`)
parts.push(`-- Source: data/commercial-agents/manufacturers-europe.json`)
parts.push(`-- Paste into Supabase SQL Editor → Run`)
parts.push(`-- Idempotent: fixed UUIDs per slug; safe to re-run`)
parts.push(`-- ============================================================`)
parts.push(``)
parts.push(`CREATE EXTENSION IF NOT EXISTS pgcrypto;`)
parts.push(``)
parts.push(`DO $$`)
parts.push(`DECLARE`)
parts.push(`  v_user uuid;`)
parts.push(`  v_email text;`)
parts.push(`BEGIN`)

for (const m of rows) {
  const id = uuidFromSlug(m.slug)
  const email = `directory+mfr-${m.slug}@users.dimarket.app`
  parts.push(`  -- ${m.company_name}`)
  parts.push(`  v_user := '${id}'::uuid;`)
  parts.push(`  v_email := ${esc(email)};`)
  parts.push(`
  IF NOT EXISTS (SELECT 1 FROM auth.users WHERE id = v_user) THEN
    INSERT INTO auth.users (
      instance_id, id, aud, role, email, encrypted_password, email_confirmed_at,
      raw_app_meta_data, raw_user_meta_data, created_at, updated_at,
      confirmation_token, recovery_token, email_change_token_new, email_change
    ) VALUES (
      '00000000-0000-0000-0000-000000000000',
      v_user,
      'authenticated',
      'authenticated',
      v_email,
      crypt(encode(gen_random_bytes(16), 'hex'), gen_salt('bf')),
      now(),
      '{"provider":"email","providers":["email"]}'::jsonb,
      jsonb_build_object('full_name', ${esc(m.company_name)}, 'commercial_manufacturer', true),
      now(), now(),
      '', '', '', ''
    );
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM auth.identities WHERE user_id = v_user AND provider = 'email'
  ) THEN
    INSERT INTO auth.identities (
      id, user_id, identity_data, provider, provider_id, last_sign_in_at, created_at, updated_at
    ) VALUES (
      v_user,
      v_user,
      jsonb_build_object('sub', v_user::text, 'email', v_email),
      'email',
      v_user::text,
      now(), now(), now()
    );
  END IF;

  INSERT INTO public.profiles AS p (
    id, full_name, bio, website, phone, location, user_role, is_professional,
    service_latitude, service_longitude, avatar_url, profile_photo, languages,
    availability_status, is_verified, verification_level
  ) VALUES (
    v_user,
    ${esc(m.company_name)},
    ${esc(m.description)},
    ${esc(m.website)},
    ${m.public_phone ? esc(m.public_phone) : 'NULL'},
    ${esc(`${m.headquarters}`)},
    'company',
    true,
    ${Number(m.lat)},
    ${Number(m.lng)},
    ${esc(m.logo_url)},
    ${esc(m.logo_url)},
    ${textArr(m.languages)},
    'available',
    true,
    'gold'
  )
  ON CONFLICT (id) DO UPDATE SET
    full_name = EXCLUDED.full_name,
    bio = EXCLUDED.bio,
    website = EXCLUDED.website,
    phone = COALESCE(EXCLUDED.phone, p.phone),
    location = EXCLUDED.location,
    user_role = 'company',
    is_professional = true,
    service_latitude = EXCLUDED.service_latitude,
    service_longitude = EXCLUDED.service_longitude,
    avatar_url = EXCLUDED.avatar_url,
    profile_photo = EXCLUDED.profile_photo,
    languages = EXCLUDED.languages,
    is_verified = true,
    verification_level = 'gold';

  INSERT INTO public.manufacturer_profiles AS mfr (
    profile_id, slug, company_name, description, website, logo_url,
    public_email, public_phone, show_public_contacts,
    country, headquarters, categories, products,
    target_markets, countries_available, languages,
    agent_required, non_exclusive_representation, exclusive_representation,
    verification_status, is_published, images
  ) VALUES (
    v_user,
    ${esc(m.slug)},
    ${esc(m.company_name)},
    ${esc(m.description)},
    ${esc(m.website)},
    ${esc(m.logo_url)},
    ${m.public_email ? esc(m.public_email) : 'NULL'},
    ${m.public_phone ? esc(m.public_phone) : 'NULL'},
    true,
    ${esc(m.country)},
    ${esc(m.headquarters)},
    ${textArr(m.categories)},
    ${textArr(m.products)},
    ${textArr(m.countries_available)},
    ${textArr(m.countries_available)},
    ${textArr(m.languages)},
    true,
    true,
    false,
    'verified',
    true,
    ${textArr([m.logo_url])}
  )
  ON CONFLICT (profile_id) DO UPDATE SET
    slug = EXCLUDED.slug,
    company_name = EXCLUDED.company_name,
    description = EXCLUDED.description,
    website = EXCLUDED.website,
    logo_url = EXCLUDED.logo_url,
    public_email = EXCLUDED.public_email,
    public_phone = EXCLUDED.public_phone,
    show_public_contacts = true,
    country = EXCLUDED.country,
    headquarters = EXCLUDED.headquarters,
    categories = EXCLUDED.categories,
    products = EXCLUDED.products,
    countries_available = EXCLUDED.countries_available,
    languages = EXCLUDED.languages,
    verification_status = 'verified',
    is_published = true,
    images = EXCLUDED.images,
    updated_at = now();
`)
}

parts.push(`END $$;`)
parts.push(``)
parts.push(`NOTIFY pgrst, 'reload schema';`)
parts.push(``)
parts.push(`SELECT slug, company_name, website, country, logo_url IS NOT NULL AS has_logo`)
parts.push(`FROM public.manufacturer_profiles`)
parts.push(`WHERE is_published = true`)
parts.push(`ORDER BY company_name;`)
parts.push(``)

mkdirSync(dirname(outPath), { recursive: true })
writeFileSync(outPath, parts.join('\n'), 'utf8')
console.log(`Wrote ${outPath} (${rows.length} manufacturers)`)
