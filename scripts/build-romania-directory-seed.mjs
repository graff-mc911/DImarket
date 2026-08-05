#!/usr/bin/env node
/**
 * Build Romania-wide masters + companies directory seed.
 * Usage: node scripts/build-romania-directory-seed.mjs
 */
import { writeFileSync, mkdirSync } from 'fs'
import { resolve, dirname } from 'path'
import { fileURLToPath } from 'url'
import { ROMANIA_DIRECTORY_NATIONWIDE } from './romania-directory-nationwide-data.mjs'

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
    'Romania',
    'România',
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
    languages: raw.languages?.length ? raw.languages : ['ro'],
    preferred_language: raw.languages?.[0] || 'ro',
    directory_claim_email: `directory+${raw.slug}@users.dimarket.app`,
    services: raw.services || [],
    bio: raw.bio,
    service_latitude: raw.service_latitude ?? null,
    service_longitude: raw.service_longitude ?? null,
    service_radius_km: raw.service_radius_km ?? null,
    seo: {
      title: `${raw.full_name} — ${raw.categories[0] || roleLabel} in ${raw.city} | DImarket`,
      meta_description: `Find ${raw.full_name} in ${raw.city}, Romania on DImarket. Request a quote for ${raw.categories.slice(0, 3).join(', ').toLowerCase()} services.`,
      keywords,
    },
    sources: raw.sources || [],
    import: {
      claimable: true,
      source: 'romania-directory-nationwide',
    },
  }
}

const seen = new Set()
const businesses = []
for (const raw of ROMANIA_DIRECTORY_NATIONWIDE) {
  if (raw.country_code !== 'RO' && raw.country !== 'Romania') continue
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
  for (const s of b.work_subcategory_slugs || []) {
    if (s.startsWith('electro-') || s.startsWith('solar-') || s.startsWith('smart-home'))
      parentCats.add('electrical')
    else if (s.startsWith('plumbing-') || s.startsWith('hvac-')) parentCats.add('hvac')
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
    'Curated Romania-wide public masters and companies from company websites. Factual fields only; original DImarket bios; no reviews/ratings/photos copied. Includes map coordinates.',
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

const outPath = resolve(outDir, 'romania-directory-nationwide.json')
writeFileSync(outPath, JSON.stringify(payload, null, 2) + '\n')
writeFileSync(
  resolve(outDir, 'ROMANIA_DIRECTORY_IMPORT.md'),
  `# Romania masters + companies directory import

Generated: ${payload.generated_at}

- Total: **${businesses.length}** (masters: **${payload.summary.masters}**, companies: **${payload.summary.companies}**)
- With map coordinates: **${withCoords}**
- Cities: **${citySet.size}** (${[...citySet].sort().join(', ')})
- Site categories covered: ${[...parentCats].sort().join(', ')}
- Trade labels: ${[...categorySet].sort().join(', ')}

## Import

\`\`\`bash
node scripts/build-romania-directory-seed.mjs
node scripts/import-public-directory.mjs --data=data/directory/romania-directory-nationwide.json
node scripts/import-public-directory.mjs --data=data/directory/romania-directory-nationwide.json --apply
\`\`\`
`,
)

console.log(`Wrote ${businesses.length} businesses → ${outPath}`)
console.log(
  `  masters=${payload.summary.masters} companies=${payload.summary.companies} coords=${withCoords}`,
)
console.log('Cities:', [...citySet].sort().join(', '))
