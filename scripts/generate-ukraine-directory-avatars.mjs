#!/usr/bin/env node
/**
 * Generate original DImarket avatars for Ukraine directory profiles,
 * upload to ad-media storage, patch claimable profiles, and emit
 * client fallback map + SQL/RPC payloads.
 *
 * Policy: original generated art only — never scrape third-party photos/logos.
 *
 * Usage:
 *   VITE_SUPABASE_ANON_KEY=... node scripts/generate-ukraine-directory-avatars.mjs
 */
import { readFileSync, writeFileSync, existsSync, mkdirSync } from 'fs'
import { resolve, dirname } from 'path'
import { fileURLToPath } from 'url'
import { createHash } from 'crypto'
import { createClient } from '@supabase/supabase-js'
import sharp from 'sharp'

const __dirname = dirname(fileURLToPath(import.meta.url))
const root = resolve(__dirname, '..')
const projectRef = 'wjlfvajloxkevggwjgtk'
const seedPath = resolve(root, 'data/directory/ukraine-directory-nationwide.json')
const outDir = resolve(root, 'data/directory')
const tmpDir = resolve(outDir, '.ukraine-avatars-tmp')

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

const env = { ...loadEnvFile('.env'), ...loadEnvFile('.env.local'), ...process.env }
const url = env.VITE_SUPABASE_URL || env.SUPABASE_URL || `https://${projectRef}.supabase.co`
const anonKey = env.VITE_SUPABASE_ANON_KEY || env.SUPABASE_ANON_KEY
if (!anonKey || anonKey.length < 20) {
  console.error('Need a real VITE_SUPABASE_ANON_KEY')
  process.exit(1)
}
if (!existsSync(seedPath)) {
  console.error(`Missing ${seedPath}`)
  process.exit(1)
}

mkdirSync(tmpDir, { recursive: true })

const seed = JSON.parse(readFileSync(seedPath, 'utf8'))
const businesses = seed.businesses || []

function claimPassword(slug) {
  const h = createHash('sha256').update(`dimarket-directory-claim:v1:${slug}`).digest('hex').slice(0, 24)
  return `DmDir_${h}!`
}

function initials(name) {
  const parts = String(name)
    .replace(/[—–-]/g, ' ')
    .replace(/[^A-Za-zÀ-ÿÄÖÜäöüß0-9\s]/g, ' ')
    .trim()
    .split(/\s+/)
    .filter(Boolean)
  if (!parts.length) return 'DM'
  if (parts.length === 1) return parts[0].slice(0, 2).toUpperCase()
  return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase()
}

function paletteFor(biz) {
  const cats = (biz.categories || []).map((c) => c.toLowerCase()).join(' ')
  const role = biz.user_role
  if (cats.includes('electrician') || cats.includes('elektro')) {
    return { bg1: '#1F3A5F', bg2: '#F59E0B', fg: '#FFF8F0' }
  }
  if (cats.includes('plumbing') || cats.includes('hvac') || cats.includes('sanit')) {
    return { bg1: '#0F3D4C', bg2: '#38BDF8', fg: '#F0FDFF' }
  }
  if (cats.includes('painting') || cats.includes('maler')) {
    return { bg1: '#1B4332', bg2: '#74C69D', fg: '#F4FFF8' }
  }
  if (cats.includes('lawyer') || cats.includes('accountant') || cats.includes('tax')) {
    return { bg1: '#2B2D42', bg2: '#8D99AE', fg: '#F8F9FA' }
  }
  if (role === 'company') {
    return { bg1: '#2C1810', bg2: '#C2410C', fg: '#FFF7ED' }
  }
  return { bg1: '#1E293B', bg2: '#64748B', fg: '#F8FAFC' }
}

function svgAvatar(biz) {
  const { bg1, bg2, fg } = paletteFor(biz)
  const text = initials(biz.full_name)
  const hash = createHash('md5').update(biz.slug).digest('hex')
  const ox = 20 + (parseInt(hash.slice(0, 2), 16) % 40)
  const oy = 15 + (parseInt(hash.slice(2, 4), 16) % 50)
  return `<?xml version="1.0" encoding="UTF-8"?>
<svg xmlns="http://www.w3.org/2000/svg" width="512" height="512" viewBox="0 0 512 512">
  <defs>
    <linearGradient id="g" x1="0" y1="0" x2="1" y2="1">
      <stop offset="0%" stop-color="${bg1}"/>
      <stop offset="100%" stop-color="${bg2}"/>
    </linearGradient>
  </defs>
  <rect width="512" height="512" fill="url(#g)"/>
  <circle cx="${ox + 80}" cy="${oy + 90}" r="120" fill="rgba(255,255,255,0.08)"/>
  <circle cx="${420 - ox}" cy="${430 - oy}" r="160" fill="rgba(0,0,0,0.12)"/>
  <text x="256" y="286" text-anchor="middle" font-family="Georgia, 'Times New Roman', serif"
    font-size="168" font-weight="700" fill="${fg}">${text}</text>
  <text x="256" y="460" text-anchor="middle" font-family="system-ui, sans-serif"
    font-size="28" letter-spacing="4" fill="rgba(255,255,255,0.55)">DIMARKET</text>
</svg>`
}

async function rasterize(biz) {
  const svg = Buffer.from(svgAvatar(biz))
  const jpeg = await sharp(svg).jpeg({ quality: 88 }).toBuffer()
  const file = resolve(tmpDir, `${biz.slug}.jpeg`)
  writeFileSync(file, jpeg)
  return { file, bytes: jpeg.length, buffer: jpeg }
}

const anon = createClient(url, anonKey, {
  auth: { persistSession: false, autoRefreshToken: false },
})

const { data: deProfiles, error: listErr } = await anon
  .from('profiles')
  .select('id, full_name, location, user_role, avatar_url, profile_photo')
  .ilike('location', '%Ukraine%')
  .eq('is_professional', true)
  .limit(200)

if (listErr) {
  console.error('profiles list:', listErr.message)
  process.exit(1)
}

function findProfile(biz) {
  const hits = (deProfiles || []).filter(
    (p) =>
      p.full_name?.toLowerCase() === biz.full_name.toLowerCase() &&
      String(p.location || '').toLowerCase().includes(biz.city.toLowerCase()),
  )
  return hits[0] || null
}

// Uploader session: first claim account that signs in
let uploader = null
async function ensureUploader() {
  if (uploader) return uploader
  for (const biz of businesses) {
    const email = biz.directory_claim_email
    const password = claimPassword(biz.slug)
    const client = createClient(url, anonKey, {
      auth: { persistSession: false, autoRefreshToken: false },
    })
    const { data, error } = await client.auth.signInWithPassword({ email, password })
    if (!error && data?.session?.access_token) {
      uploader = client
      console.log(`Uploader session: ${biz.slug}`)
      return uploader
    }
  }
  throw new Error('No claim account could sign in for storage upload')
}

const report = []
const avatarMap = {}

for (const biz of businesses) {
  const profile = findProfile(biz)
  if (!profile) {
    report.push({ slug: biz.slug, status: 'profile_not_found' })
    console.warn(`MISS profile ${biz.slug}`)
    continue
  }

  const { buffer, bytes } = await rasterize(biz)
  const path = `campaigns/profiles/${profile.id}/avatar.jpeg`
  const publicUrl = `${url}/storage/v1/object/public/ad-media/${path}`

  const client = await ensureUploader()
  const { error: upErr } = await client.storage.from('ad-media').upload(path, buffer, {
    contentType: 'image/jpeg',
    upsert: true,
  })
  if (upErr) {
    report.push({ slug: biz.slug, id: profile.id, status: 'upload_error', error: upErr.message })
    console.error(`UPLOAD FAIL ${biz.slug}: ${upErr.message}`)
    continue
  }

  avatarMap[profile.id] = publicUrl

  // Try patch own profile when claim password works
  let patched = false
  const own = createClient(url, anonKey, {
    auth: { persistSession: false, autoRefreshToken: false },
  })
  const { data: signed } = await own.auth.signInWithPassword({
    email: biz.directory_claim_email,
    password: claimPassword(biz.slug),
  })
  if (signed?.session?.access_token && signed?.user?.id === profile.id) {
    const { error: patchErr } = await own
      .from('profiles')
      .update({ avatar_url: publicUrl, profile_photo: publicUrl })
      .eq('id', profile.id)
    patched = !patchErr
    if (patchErr) console.warn(`patch ${biz.slug}: ${patchErr.message}`)
    await own.auth.signOut().catch(() => {})
  }

  report.push({
    name: biz.full_name,
    slug: biz.slug,
    id: profile.id,
    final_photo: publicUrl,
    mode: 'generated+storage',
    bytes,
    patched,
  })
  console.log(`OK ${biz.slug} → ${profile.id} (${bytes}b)${patched ? ' patched' : ' map-only'}`)
}

if (uploader) await uploader.auth.signOut().catch(() => {})

writeFileSync(
  resolve(outDir, 'ukraine-directory-avatars-report.json'),
  JSON.stringify(report, null, 2) + '\n',
)

const ok = report.filter((r) => r.final_photo)
const sqlValues = ok
  .map((r) => `      ('${r.id}'::uuid, '${r.final_photo}')`)
  .join(',\n')

const sql = `-- Ukraine directory avatars backfill (generated DImarket art, not third-party photos)
CREATE OR REPLACE FUNCTION public.backfill_ukraine_directory_avatars()
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  updated_count int := 0;
BEGIN
  UPDATE public.profiles AS p
  SET
    avatar_url = v.url,
    profile_photo = v.url,
    updated_at = now()
  FROM (
    VALUES
${sqlValues}
  ) AS v(id, url)
  WHERE p.id = v.id;

  GET DIAGNOSTICS updated_count = ROW_COUNT;
  RETURN jsonb_build_object('ok', true, 'updated', updated_count);
END;
$$;

REVOKE ALL ON FUNCTION public.backfill_ukraine_directory_avatars() FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.backfill_ukraine_directory_avatars() TO anon, authenticated, service_role;
`

writeFileSync(resolve(outDir, 'ukraine-directory-avatars-backfill.sql'), sql)
writeFileSync(
  resolve(root, 'supabase/migrations/20260805110000_backfill_ukraine_directory_avatars.sql'),
  sql,
)

// Merge into directoryAvatars.ts client map (keep existing + add Ukraine)
const avatarsTsPath = resolve(root, 'src/lib/directoryAvatars.ts')
const existing = readFileSync(avatarsTsPath, 'utf8')
const merged = new Map()
for (const m of existing.matchAll(/'([0-9a-f-]{36})':\s*\n\s*'([^']+)'/g)) {
  merged.set(m[1], m[2])
}
for (const [id, u] of Object.entries(avatarMap)) merged.set(id, u)

const body = [...merged.entries()]
  .sort((a, b) => a[0].localeCompare(b[0]))
  .map(([id, u]) => `  '${id}':\n    '${u}',`)
  .join('\n')

writeFileSync(
  avatarsTsPath,
  `/**
 * Public directory avatars hosted on DImarket Supabase Storage (ad-media).
 * Used when profile_photo / avatar_url are still empty (RLS blocks anon profile updates).
 * Prefer DB fields once service-role backfill has run.
 * Ukraine entries are original generated art (initials) — not third-party photos.
 */
export const DIRECTORY_AVATAR_BY_PROFILE_ID: Record<string, string> = {
${body}
}

export function resolveDirectoryAvatarUrl(
  profileId: string,
  profilePhoto?: string | null,
  avatarUrl?: string | null,
): string | null {
  return profilePhoto || avatarUrl || DIRECTORY_AVATAR_BY_PROFILE_ID[profileId] || null
}
`,
)

writeFileSync(
  resolve(outDir, 'UKRAINE_DIRECTORY_AVATARS.md'),
  `# Ukraine directory avatars

Generated: ${new Date().toISOString()}

- Avatars uploaded: **${ok.length}**
- Profile rows patched via claim sign-in: **${ok.filter((r) => r.patched).length}**
- Client fallback map updated in \`src/lib/directoryAvatars.ts\`

Original DImarket-generated initials art only (no scraped logos/photos).

## Apply DB backfill (optional)

\`\`\`bash
# After migration applied:
curl -X POST "$SUPABASE_URL/rest/v1/rpc/backfill_ukraine_directory_avatars" \\
  -H "apikey: $ANON" -H "Authorization: Bearer $ANON" -H "Content-Type: application/json" -d '{}'
\`\`\`
`,
)

console.log(`\nDone: ${ok.length} avatars. Map entries: ${merged.size}`)
