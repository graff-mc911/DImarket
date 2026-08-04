#!/usr/bin/env node
/**
 * Import curated public business directory into DImarket (auth.users + profiles).
 *
 * Default: dry-run (no writes).
 * Apply:    node scripts/import-public-directory.mjs --apply
 *
 * Requires .env.local: VITE_SUPABASE_URL (or SUPABASE_URL) + SUPABASE_SERVICE_ROLE_KEY
 */
import { readFileSync, existsSync, writeFileSync } from 'fs'
import { resolve, dirname } from 'path'
import { fileURLToPath } from 'url'
import { createClient } from '@supabase/supabase-js'

const __dirname = dirname(fileURLToPath(import.meta.url))
const root = resolve(__dirname, '..')
const dataPath = resolve(root, 'data/directory/public-businesses.json')
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
  // Mirror src/lib/categoryCatalog.ts SERVICE_CATEGORY_CATALOG parents.
  if (subSlug.startsWith('transport-') || subSlug.startsWith('logistics-')) return 'tools'
  if (subSlug.startsWith('cleaning-')) return 'cleaning'
  if (subSlug.startsWith('sell-') || subSlug.startsWith('rent-')) return 'sell-rent'
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

async function syncProfessionalCategories(admin, userId, subcategorySlugs) {
  const parentSlugs = [
    ...new Set(subcategorySlugs.map((s) => categorySlugForSubcategory(s))),
  ]
  if (!parentSlugs.length) {
    await admin.from('professional_categories').delete().eq('profile_id', userId)
    return { synced: 0 }
  }

  const { data: categories, error } = await admin
    .from('categories')
    .select('id, slug')
    .in('slug', parentSlugs)

  if (error) throw new Error(`categories lookup: ${error.message}`)
  if (!categories?.length) {
    console.warn(`  warn: no categories rows for ${parentSlugs.join(', ')}`)
    return { synced: 0 }
  }

  await admin.from('professional_categories').delete().eq('profile_id', userId)
  const rows = categories.map((cat) => ({
    profile_id: userId,
    category_id: cat.id,
  }))
  const { error: insertError } = await admin.from('professional_categories').insert(rows)
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
  // Append structured public facts into bio only when address/hours exist and not already present.
  const extras = []
  if (biz.address) extras.push(`Address: ${biz.address}`)
  if (biz.business_hours) extras.push(`Hours: ${biz.business_hours}`)
  if (biz.public_email) extras.push(`Public email: ${biz.public_email}`)
  if (biz.services?.length) extras.push(`Services: ${biz.services.join('; ')}`)
  if (extras.length) {
    const block = extras.join('\n')
    if (!String(patch.bio).includes(block)) {
      patch.bio = `${biz.bio}\n\n${block}`.slice(0, 4000)
    }
  }
  return patch
}

async function findExistingByWebsiteOrName(admin, biz) {
  if (biz.website) {
    const { data } = await admin
      .from('profiles')
      .select('id, full_name, website')
      .eq('website', biz.website)
      .limit(5)
    if (data?.length) return data[0]
  }
  const { data: byName } = await admin
    .from('profiles')
    .select('id, full_name, website, location')
    .ilike('full_name', biz.full_name)
    .ilike('location', `%${biz.city}%`)
    .limit(5)
  return byName?.[0] || null
}

async function ensureAuthUser(admin, biz) {
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
  const key = env.SUPABASE_SERVICE_ROLE_KEY
  if (!url || !key) {
    console.error('Need VITE_SUPABASE_URL/SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY')
    process.exit(1)
  }

  const admin = createClient(url, key, {
    auth: { persistSession: false, autoRefreshToken: false },
  })

  const report = {
    started_at: new Date().toISOString(),
    mode: 'apply',
    imported: [],
    failed: [],
    created: 0,
    updated: 0,
    linked: 0,
  }

  for (const biz of businesses) {
    try {
      const result = await ensureAuthUser(admin, biz)
      report.imported.push({
        slug: biz.slug,
        full_name: biz.full_name,
        id: result.id,
        action: result.action,
      })
      if (result.action === 'created') report.created++
      else if (result.action === 'updated_existing') report.updated++
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
    seed_summary: payload.summary,
  }

  const reportPath = resolve(root, 'data/directory/import-run-report.json')
  writeFileSync(reportPath, JSON.stringify(report, null, 2) + '\n')
  console.log(`\nImport finished. Report: ${reportPath}`)
  console.log(JSON.stringify(report.totals, null, 2))
}

main().catch((err) => {
  console.error(err)
  process.exit(1)
})
