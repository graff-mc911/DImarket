#!/usr/bin/env node
/**
 * Import curated public business directory into DImarket (auth.users + profiles).
 *
 * Default: dry-run (no writes).
 * Apply:    node scripts/import-public-directory.mjs --apply
 *
 * Auth modes (first match wins):
 * 1) SUPABASE_SERVICE_ROLE_KEY — admin createUser / upsert
 * 2) VITE_SUPABASE_ANON_KEY — signUp + session profile update (claimable accounts)
 *
 * Requires VITE_SUPABASE_URL (or SUPABASE_URL) in .env.local
 */
import { readFileSync, existsSync, writeFileSync } from 'fs'
import { resolve, dirname } from 'path'
import { fileURLToPath } from 'url'
import { createClient } from '@supabase/supabase-js'
import { randomBytes } from 'crypto'

const __dirname = dirname(fileURLToPath(import.meta.url))
const root = resolve(__dirname, '..')
const dataArg = process.argv.find((a) => a.startsWith('--data='))
const dataPath = resolve(
  root,
  dataArg ? dataArg.slice('--data='.length) : 'data/directory/public-businesses.json',
)
const apply = process.argv.includes('--apply')
const limitArg = process.argv.find((a) => a.startsWith('--limit='))
const limit = limitArg ? Number(limitArg.split('=')[1]) : Infinity

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

function categorySlugForSubcategory(subSlug) {
  if (subSlug.startsWith('transport-') || subSlug.startsWith('logistics-')) return 'tools'
  if (subSlug.startsWith('cleaning-')) return 'cleaning'
  if (subSlug.startsWith('sell-') || subSlug.startsWith('rent-')) return 'sell-rent'
  if (subSlug.startsWith('legal-notary') || subSlug.startsWith('legal-')) return 'legal-notary'
  if (subSlug.startsWith('accounting-finance') || subSlug.startsWith('accounting-'))
    return 'accounting-finance'
  if (subSlug.startsWith('handyman-')) return 'handyman'
  if (subSlug.startsWith('furniture-')) return 'furniture'
  if (subSlug.startsWith('electrical-')) return 'electrical'
  return 'construction'
}

async function findAuthUserByEmail(admin, email) {
  const needle = email.toLowerCase()
  for (let page = 1; page <= 10; page++) {
    const { data, error } = await admin.auth.admin.listUsers({ page, perPage: 200 })
    if (error) throw new Error(`listUsers: ${error.message}`)
    const hit = data?.users?.find((u) => u.email?.toLowerCase() === needle)
    if (hit) return hit
    if (!data?.users?.length || data.users.length < 200) break
  }
  return null
}

async function syncProfessionalCategories(client, userId, subcategorySlugs) {
  const parentSlugs = [
    ...new Set(subcategorySlugs.map((s) => categorySlugForSubcategory(s))),
  ]
  if (!parentSlugs.length) {
    await client.from('professional_categories').delete().eq('profile_id', userId)
    return { synced: 0 }
  }

  const { data: categories, error } = await client
    .from('categories')
    .select('id, slug')
    .in('slug', parentSlugs)

  if (error) throw new Error(`categories lookup: ${error.message}`)
  if (!categories?.length) {
    console.warn(`  warn: no categories rows for ${parentSlugs.join(', ')}`)
    return { synced: 0 }
  }

  await client.from('professional_categories').delete().eq('profile_id', userId)
  const rows = categories.map((cat) => ({
    profile_id: userId,
    category_id: cat.id,
  }))
  const { error: insertError } = await client.from('professional_categories').insert(rows)
  if (insertError) throw new Error(`professional_categories: ${insertError.message}`)
  return { synced: rows.length }
}

function loadPayload() {
  if (!existsSync(dataPath)) {
    console.error(`Missing ${dataPath}. Run: node scripts/build-public-directory-seed.mjs`)
    process.exit(1)
  }
  return JSON.parse(readFileSync(dataPath, 'utf8'))
}

function profilePatch(biz) {
  const patch = {
    full_name: biz.full_name,
    bio: biz.bio,
    phone: biz.phone || null,
    location: biz.location,
    website: biz.website || null,
    user_role: biz.user_role,
    is_professional: true,
    languages: biz.languages || [],
    preferred_language: biz.preferred_language || biz.languages?.[0] || 'en',
    work_subcategory_slugs: biz.work_subcategory_slugs || [],
    availability_status: 'available',
  }
  if (biz.service_latitude != null && Number.isFinite(Number(biz.service_latitude))) {
    patch.service_latitude = Number(biz.service_latitude)
  }
  if (biz.service_longitude != null && Number.isFinite(Number(biz.service_longitude))) {
    patch.service_longitude = Number(biz.service_longitude)
  }
  // service_radius_km only when explicitly enabled (column may lag in some envs).
  if (
    process.env.DIRECTORY_IMPORT_SET_RADIUS === '1' &&
    biz.service_radius_km != null &&
    Number.isFinite(Number(biz.service_radius_km))
  ) {
    patch.service_radius_km = Number(biz.service_radius_km)
  }
  const extras = []
  if (biz.address) extras.push(`Address: ${biz.address}`)
  if (biz.business_hours) extras.push(`Hours: ${biz.business_hours}`)
  if (biz.public_email) extras.push(`Public email: ${biz.public_email}`)
  if (biz.years_experience) extras.push(`Experience: ${biz.years_experience} years`)
  if (biz.hourly_rate_eur) extras.push(`Rate: ${biz.hourly_rate_eur} €/h`)
  if (biz.tags?.length) extras.push(`Tags: ${biz.tags.join('; ')}`)
  if (biz.services?.length) extras.push(`Services: ${biz.services.join('; ')}`)
  if (extras.length) {
    const block = extras.join('\n')
    if (!String(patch.bio).includes(block)) {
      patch.bio = `${biz.bio}\n\n${block}`.slice(0, 4000)
    }
  }
  return patch
}

async function findExistingByWebsiteOrName(client, biz) {
  // Prefer exact name + city so multi-office brands (same website) can each import.
  const { data: byName } = await client
    .from('profiles')
    .select('id, full_name, website, location')
    .ilike('full_name', biz.full_name)
    .ilike('location', `%${biz.city}%`)
    .limit(5)
  if (byName?.length) return byName[0]

  if (biz.website) {
    const { data } = await client
      .from('profiles')
      .select('id, full_name, website, location')
      .eq('website', biz.website)
      .ilike('full_name', biz.full_name)
      .limit(5)
    if (data?.length) return data[0]
  }
  return null
}

function claimPassword(slug) {
  // Deterministic-enough local secret for re-runs via signIn; not published.
  return `DmDir_${slug}_${randomBytes(8).toString('hex')}!`
}

async function ensureViaAdmin(admin, biz) {
  const email = biz.directory_claim_email
  const patch = profilePatch(biz)

  const existing = await findExistingByWebsiteOrName(admin, biz)
  if (existing?.id) {
    const { error } = await admin.from('profiles').update(patch).eq('id', existing.id)
    if (error) throw new Error(`profile update ${biz.slug}: ${error.message}`)
    await syncProfessionalCategories(admin, existing.id, biz.work_subcategory_slugs)
    return { id: existing.id, action: 'updated_existing' }
  }

  const { data: created, error } = await admin.auth.admin.createUser({
    email,
    email_confirm: true,
    user_metadata: {
      full_name: biz.full_name,
      user_role: biz.user_role,
      phone: biz.phone || '',
      location: biz.location,
      directory_slug: biz.slug,
      directory_source: 'public-business-directory',
    },
  })

  let userId = created?.user?.id
  if (error && !userId) {
    const hit = await findAuthUserByEmail(admin, email)
    if (!hit) throw new Error(`createUser ${biz.slug}: ${error.message}`)
    userId = hit.id
  }

  const { error: upsertErr } = await admin.from('profiles').upsert(
    { id: userId, ...patch },
    { onConflict: 'id' },
  )
  if (upsertErr) throw new Error(`profile upsert ${biz.slug}: ${upsertErr.message}`)

  await syncProfessionalCategories(admin, userId, biz.work_subcategory_slugs)
  return { id: userId, action: error && userId ? 'linked_existing_auth' : 'created' }
}

async function ensureViaSignup(anonClient, url, anonKey, biz) {
  const email = biz.directory_claim_email
  const patch = profilePatch(biz)

  const existing = await findExistingByWebsiteOrName(anonClient, biz)
  if (existing?.id) {
    return { id: existing.id, action: 'skipped_existing_public_profile' }
  }

  const password = claimPassword(biz.slug)
  const { data: signed, error: signErr } = await anonClient.auth.signUp({
    email,
    password,
    options: {
      data: {
        full_name: biz.full_name,
        user_role: biz.user_role,
        phone: biz.phone || '',
        location: biz.location,
        directory_slug: biz.slug,
        directory_source: 'public-business-directory',
      },
    },
  })

  const session = signed?.session
  const userId = signed?.user?.id

  if (signErr || !userId) {
    const msg = signErr?.message || 'signUp failed'
    if (/already|registered|exists/i.test(msg)) {
      return { id: null, action: 'exists_needs_service_role', error: msg }
    }
    throw new Error(`signUp ${biz.slug}: ${msg}`)
  }

  if (!session?.access_token) {
    return { id: userId, action: 'created_pending_confirm', error: 'no session (email confirm required)' }
  }

  const authed = createClient(url, anonKey, {
    auth: { persistSession: false, autoRefreshToken: false },
  })
  await authed.auth.setSession({
    access_token: session.access_token,
    refresh_token: session.refresh_token,
  })

  const { error: upErr } = await authed.from('profiles').update(patch).eq('id', userId)
  if (upErr) throw new Error(`profile update ${biz.slug}: ${upErr.message}`)

  await syncProfessionalCategories(authed, userId, biz.work_subcategory_slugs)
  await authed.auth.signOut()

  return { id: userId, action: 'created_via_signup' }
}

async function main() {
  const payload = loadPayload()
  const businesses = (payload.businesses || []).slice(0, limit)

  console.log(`Directory seed: ${businesses.length} businesses`)
  console.log(`Mode: ${apply ? 'APPLY' : 'DRY-RUN'}`)
  console.log(
    `Summary from seed: ready=${payload.summary?.businesses_ready_to_import}, categories=${payload.summary?.categories_count}, cities=${payload.summary?.cities_count}, skipped=${payload.summary?.records_skipped_insufficient_public_info}, dupes=${payload.summary?.duplicates_removed}`,
  )

  if (!apply) {
    for (const b of businesses) {
      console.log(
        `  · ${b.full_name} | ${b.user_role} | ${b.location} | cats=${b.categories.join('+')} | ${b.website || b.phone || 'no-contact'}`,
      )
    }
    console.log('\nDry-run complete. Re-run with --apply to write to Supabase.')
    return
  }

  const env = { ...loadEnvFile('.env'), ...loadEnvFile('.env.local'), ...process.env }
  const url = env.VITE_SUPABASE_URL || env.SUPABASE_URL
  const serviceKey = env.SUPABASE_SERVICE_ROLE_KEY
  const anonKey = env.VITE_SUPABASE_ANON_KEY || env.SUPABASE_ANON_KEY
  if (!url) {
    console.error('Need VITE_SUPABASE_URL / SUPABASE_URL')
    process.exit(1)
  }
  if (!serviceKey && !anonKey) {
    console.error('Need SUPABASE_SERVICE_ROLE_KEY or VITE_SUPABASE_ANON_KEY')
    process.exit(1)
  }

  process.env.VITE_SUPABASE_URL = url
  if (anonKey) process.env.VITE_SUPABASE_ANON_KEY = anonKey

  const mode = serviceKey ? 'service_role' : 'anon_signup'
  console.log(`Auth mode: ${mode}`)

  const admin = serviceKey
    ? createClient(url, serviceKey, {
        auth: { persistSession: false, autoRefreshToken: false },
      })
    : null

  const anon = createClient(url, anonKey || serviceKey, {
    auth: { persistSession: false, autoRefreshToken: false },
  })

  const report = {
    started_at: new Date().toISOString(),
    mode: `apply:${mode}`,
    imported: [],
    failed: [],
    created: 0,
    updated: 0,
    linked: 0,
    skipped: 0,
  }

  for (const biz of businesses) {
    try {
      const result = admin
        ? await ensureViaAdmin(admin, biz)
        : await ensureViaSignup(anon, url, anonKey, biz)

      if (result.error && !result.id) {
        report.failed.push({ slug: biz.slug, error: result.error, action: result.action })
        console.error(`FAIL ${biz.slug}: ${result.error}`)
        continue
      }

      report.imported.push({
        slug: biz.slug,
        full_name: biz.full_name,
        id: result.id,
        action: result.action,
      })
      if (result.action === 'created' || result.action === 'created_via_signup') report.created++
      else if (result.action === 'updated_existing') report.updated++
      else if (String(result.action).startsWith('skipped') || result.action === 'created_pending_confirm')
        report.skipped++
      else report.linked++
      console.log(`OK ${result.action} ${biz.slug} → ${result.id}`)
    } catch (err) {
      report.failed.push({ slug: biz.slug, error: err.message })
      console.error(`FAIL ${biz.slug}: ${err.message}`)
    }
  }

  report.finished_at = new Date().toISOString()
  report.totals = {
    attempted: businesses.length,
    succeeded: report.imported.length,
    failed: report.failed.length,
    created: report.created,
    updated: report.updated,
    linked: report.linked,
    skipped: report.skipped,
    seed_summary: payload.summary,
  }

  const reportPath = resolve(root, 'data/directory/import-run-report.json')
  writeFileSync(reportPath, JSON.stringify(report, null, 2) + '\n')

  const md = `# Import run report

- Started: ${report.started_at}
- Finished: ${report.finished_at}
- Mode: \`${report.mode}\`

| Metric | Value |
| --- | ---: |
| Attempted | ${report.totals.attempted} |
| Succeeded | ${report.totals.succeeded} |
| Failed | ${report.totals.failed} |
| Created | ${report.totals.created} |
| Updated | ${report.totals.updated} |
| Linked / other | ${report.totals.linked} |
| Skipped | ${report.totals.skipped} |

## Imported

${report.imported.map((r) => `- \`${r.action}\` **${r.full_name}** (\`${r.slug}\`) → \`${r.id}\``).join('\n') || '_none_'}

## Failed

${report.failed.map((r) => `- \`${r.slug}\`: ${r.error}`).join('\n') || '_none_'}
`
  writeFileSync(resolve(root, 'data/directory/import-run-report.md'), md)

  console.log(`\nImport finished. Report: ${reportPath}`)
  console.log(JSON.stringify(report.totals, null, 2))
  if (report.failed.length) process.exitCode = 1
}

main().catch((err) => {
  console.error(err)
  process.exit(1)
})
