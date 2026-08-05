#!/usr/bin/env node
/**
 * Build Poland-wide masters + companies directory seed.
 * Usage: node scripts/build-poland-directory-seed.mjs
 */
import { writeFileSync, mkdirSync } from 'fs'
import { resolve, dirname } from 'path'
import { fileURLToPath } from 'url'
import { POLAND_DIRECTORY_NATIONWIDE } from './poland-directory-nationwide-data.mjs'

const __dirname = dirname(fileURLToPath(import.meta.url))
const outDir = resolve(__dirname, '../data/directory')
mkdirSync(outDir, { recursive: true })

function normalize(raw) {
  const location = `${raw.city}, ${raw.region}, ${raw.country}`
  const roleLabel = raw.user_role === 'company' ? 'Company' : 'Professional'
  const keywords = [
    ...raw.categories.map((c) => c.toLowerCase()),
    raw.city,
    raw.country,
    raw.user_role,
    'Poland',
    'DImarket',
  ]
  return {
    slug: raw.slug,
    full_name: raw.full_name,
    user_role: raw.user_role,
    is_professional: true,
    categories: raw.categories,
    work_subcategory_slugs: raw.work_subcategory_slugs,
    city: raw.city,
    region: raw.region,
    country: raw.country,
    country_code: raw.country_code,
    location,
    address: raw.address ?? null,
    phone: raw.phone ?? null,
    public_email: raw.public_email ?? null,
    website: raw.website ?? null,
    business_hours: raw.business_hours ?? null,
    languages: raw.languages?.length ? raw.languages : ['pl'],
    preferred_language: raw.languages?.[0] || 'pl',
    directory_claim_email: `directory+${raw.slug}@users.dimarket.app`,
    services: raw.services || [],
    bio: raw.bio,
    service_latitude: raw.service_latitude ?? null,
    service_longitude: raw.service_longitude ?? null,
    service_radius_km: raw.service_radius_km ?? null,
    seo: {
      title: `${raw.full_name} — ${raw.categories[0] || roleLabel} in ${raw.city} | DImarket`,
      meta_description: `Find ${raw.full_name} in ${raw.city}, Poland on DImarket. Request a quote for ${raw.categories.slice(0, 3).join(', ').toLowerCase()} services.`,
      keywords,
    },
    sources: raw.sources || [],
    import: {
      claimable: true,
      source: 'poland-directory-nationwide',
    },
  }
}

const seen = new Set()
const businesses = []
for (const raw of POLAND_DIRECTORY_NATIONWIDE) {
  if (raw.country_code !== 'PL' && raw.country !== 'Poland') continue
  if (seen.has(raw.slug)) continue
  seen.add(raw.slug)
  businesses.push(normalize(raw))
}

const categorySet = new Set()
const citySet = new Set()
const roleSet = new Set()
const parentCats = new Set()
for (const b of businesses) {
  for (const c of b.categories) categorySet.add(c)
  citySet.add(b.city)
  roleSet.add(b.user_role)
  for (const s of b.work_subcategory_slugs) {
    if (s.startsWith('legal-notary')) parentCats.add('legal-notary')
    else if (s.startsWith('accounting-finance')) parentCats.add('accounting-finance')
    else if (s.startsWith('cleaning-')) parentCats.add('cleaning')
    else if (s.startsWith('logistics-') || s.startsWith('transport-')) parentCats.add('tools')
    else if (s.startsWith('handyman-')) parentCats.add('handyman')
    else if (s.startsWith('furniture-')) parentCats.add('furniture')
    else if (s.startsWith('electrical-') || s.startsWith('electro-') || s.startsWith('solar-') || s.startsWith('smart-home'))
      parentCats.add('electrical')
    else if (s.startsWith('sell-') || s.startsWith('rent-')) parentCats.add('sell-rent')
    else parentCats.add('construction')
  }
}

const withCoords = businesses.filter(
  (b) => b.service_latitude != null && b.service_longitude != null,
).length

const payload = {
  version: 1,
  generated_at: new Date().toISOString(),
  source:
    'Curated Poland-wide public masters and companies from company websites / Impressum. Factual fields only; original DImarket bios; no reviews/ratings/photos copied. Includes map coordinates.',
  schema: {
    target_table: 'profiles',
    auth_required: true,
    junction: 'professional_categories',
    location_format: 'City, Region, Country',
    map_fields: ['service_latitude', 'service_longitude', 'service_radius_km'],
  },
  summary: {
    businesses_ready_to_import: businesses.length,
    masters: businesses.filter((b) => b.user_role === 'professional').length,
    companies: businesses.filter((b) => b.user_role === 'company').length,
    with_map_coordinates: withCoords,
    roles: [...roleSet].sort(),
    categories_populated: [...categorySet].sort(),
    site_category_slugs_covered: [...parentCats].sort(),
    cities_count: citySet.size,
    cities: [...citySet].sort(),
  },
  businesses,
}

const outPath = resolve(outDir, 'poland-directory-nationwide.json')
writeFileSync(outPath, JSON.stringify(payload, null, 2) + '\n')
writeFileSync(
  resolve(outDir, 'POLAND_DIRECTORY_IMPORT.md'),
  `# Poland masters + companies directory import

Generated: ${payload.generated_at}

- Total: **${businesses.length}** (masters: **${payload.summary.masters}**, companies: **${payload.summary.companies}**)
- With map coordinates: **${withCoords}**
- Cities: **${citySet.size}** (${[...citySet].sort().join(', ')})
- Site categories covered: ${[...parentCats].sort().join(', ')}
- Trade labels: ${[...categorySet].sort().join(', ')}

## Import

\`\`\`bash
node scripts/build-poland-directory-seed.mjs
node scripts/import-public-directory.mjs --data=data/directory/poland-directory-nationwide.json
node scripts/import-public-directory.mjs --data=data/directory/poland-directory-nationwide.json --apply
\`\`\`

## Map coordinates backfill

Existing Darmstadt profiles may already exist without \`service_latitude\` / \`service_longitude\`. After import:

\`\`\`bash
node scripts/backfill-poland-directory-coords.mjs
\`\`\`

Or let the GitHub Action \`Backfill Poland directory coords\` run on push to \`main\`.
`,
)

console.log(`Wrote ${businesses.length} businesses → ${outPath}`)
console.log(`  masters=${payload.summary.masters} companies=${payload.summary.companies} coords=${withCoords}`)
console.log('Cities:', [...citySet].sort().join(', '))
