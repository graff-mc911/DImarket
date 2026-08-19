#!/usr/bin/env node
/**
 * Build public services + manufacturers directory expansion.
 * Usage: node scripts/build-public-services-expansion.mjs
 */
import { writeFileSync, mkdirSync, readFileSync } from 'fs'
import { resolve, dirname } from 'path'
import { fileURLToPath } from 'url'
import {
  PUBLIC_SERVICES_EXPANSION,
  PUBLIC_MANUFACTURERS_EXPANSION,
} from './public-services-expansion-data.mjs'

const __dirname = dirname(fileURLToPath(import.meta.url))
const root = resolve(__dirname, '..')
const outDir = resolve(root, 'data/directory')
mkdirSync(outDir, { recursive: true })

function parentCatForSlug(s) {
  if (s.startsWith('legal-notary') || s.startsWith('legal-')) return 'legal-notary'
  if (s.startsWith('accounting-finance') || s.startsWith('accounting-')) return 'accounting-finance'
  if (s.startsWith('cleaning-')) return 'cleaning'
  if (s.startsWith('logistics-') || s.startsWith('transport-')) return 'tools'
  if (s.startsWith('handyman-')) return 'handyman'
  if (s.startsWith('furniture-')) return 'furniture'
  if (s.startsWith('electrical-')) return 'electrical'
  if (s.startsWith('sell-') || s.startsWith('rent-')) return 'sell-rent'
  if (s.startsWith('design-engineering')) return 'design-engineering'
  return 'construction'
}

function normalize(raw) {
  const location = `${raw.city}, ${raw.region}, ${raw.country}`
  const keywords = [
    ...raw.categories.map((c) => c.toLowerCase()),
    raw.city,
    raw.country,
    'company',
    'DImarket',
  ]
  const out = {
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
    languages: raw.languages?.length ? raw.languages : ['es'],
    preferred_language: raw.languages?.[0] || 'es',
    directory_claim_email: `directory+${raw.slug}@users.dimarket.app`,
    services: raw.services || [],
    bio: raw.bio,
    service_latitude: raw.service_latitude ?? null,
    service_longitude: raw.service_longitude ?? null,
    seo: {
      title: `${raw.full_name} — ${raw.categories[0] || 'Company'} in ${raw.city} | DImarket`,
      meta_description: `Find ${raw.full_name} in ${raw.city}, ${raw.country} on DImarket. Request a quote for ${raw.categories.slice(0, 3).join(', ').toLowerCase()} services.`,
      keywords,
    },
    sources: raw.sources || [],
    import: {
      claimable: true,
      source: 'public-services-expansion',
    },
  }
  if (raw.ca_manufacturer) out.ca_manufacturer = raw.ca_manufacturer
  return out
}

const seen = new Set()
const businesses = []
for (const raw of [...PUBLIC_SERVICES_EXPANSION, ...PUBLIC_MANUFACTURERS_EXPANSION]) {
  if (seen.has(raw.slug)) continue
  seen.add(raw.slug)
  businesses.push(normalize(raw))
}

const categorySet = new Set()
const citySet = new Set()
const parentCats = new Set()
const byKind = { realestate: 0, legal: 0, accounting: 0, cleaning: 0, architect: 0, engineer: 0, manufacturer: 0, construction: 0 }
for (const b of businesses) {
  for (const c of b.categories) categorySet.add(c)
  citySet.add(`${b.city}, ${b.region}, ${b.country}`)
  for (const s of b.work_subcategory_slugs) parentCats.add(parentCatForSlug(s))
  const w = b.work_subcategory_slugs.join(' ')
  if (b.ca_manufacturer) byKind.manufacturer++
  else if (/sell-property|rent-property/.test(w)) byKind.realestate++
  else if (/legal-/.test(w) && !/accounting-/.test(w)) byKind.legal++
  else if (/accounting-/.test(w)) byKind.accounting++
  else if (/cleaning-/.test(w)) byKind.cleaning++
  else if (/design-engineering-architect|design-engineering-interior/.test(w) && !/design-engineering-engineering/.test(w)) byKind.architect++
  else if (/design-engineering-engineering|design-engineering-structural/.test(w)) byKind.engineer++
  else byKind.construction++
}

const payload = {
  version: 1,
  generated_at: new Date().toISOString(),
  source:
    'Curated public companies and manufacturers from official websites. Factual fields only; original DImarket bios; no reviews/ratings/photos copied.',
  schema: {
    target_table: 'profiles',
    auth_required: true,
    junction: 'professional_categories',
    location_format: 'City, Region, Country',
    manufacturer_sidecar: 'ca_manufacturer → manufacturer_profiles',
  },
  summary: {
    businesses_ready_to_import: businesses.length,
    by_kind: byKind,
    categories_populated: [...categorySet].sort(),
    site_category_slugs_covered: [...parentCats].sort(),
    cities_count: citySet.size,
    cities: [...citySet].sort(),
  },
  businesses,
}

const outPath = resolve(outDir, 'public-services-expansion.json')
writeFileSync(outPath, JSON.stringify(payload, null, 2) + '\n')

writeFileSync(
  resolve(outDir, 'PUBLIC_SERVICES_EXPANSION.md'),
  `# Public services directory expansion

Generated: ${payload.generated_at}

- Total: **${businesses.length}**
- Real estate: **${byKind.realestate}**
- Legal: **${byKind.legal}**
- Accounting: **${byKind.accounting}**
- Cleaning: **${byKind.cleaning}**
- Architects: **${byKind.architect}**
- Engineers: **${byKind.engineer}**
- Manufacturers: **${byKind.manufacturer}**
- Construction companies: **${byKind.construction}**
- Cities: **${citySet.size}**
- Site categories: ${[...parentCats].sort().join(', ')}

## Import

\`\`\`bash
node scripts/build-public-services-expansion.mjs
node scripts/import-public-directory.mjs --data=data/directory/public-services-expansion.json
node scripts/import-public-directory.mjs --data=data/directory/public-services-expansion.json --apply
\`\`\`

## Policy

- Only publicly listed factual business information was used.
- Bios and SEO text are original DImarket copy.
- Reviews, ratings, third-party biographies, photos, and logos were not copied.
- Manufacturer rows also write \`manufacturer_profiles\` when the signed-in import session is available.
`,
)

const caPath = resolve(root, 'data/commercial-agents/manufacturers-europe.json')
const existingCa = JSON.parse(readFileSync(caPath, 'utf8'))
const existingSlugs = new Set(existingCa.map((m) => m.slug))
let addedCa = 0
for (const raw of PUBLIC_MANUFACTURERS_EXPANSION) {
  const m = raw.ca_manufacturer
  if (!m || existingSlugs.has(m.slug)) continue
  existingCa.push({
    slug: m.slug,
    company_name: m.company_name,
    description: m.description,
    website: m.website,
    logo_url: m.logo_url || null,
    public_email: m.public_email || null,
    public_phone: m.public_phone || null,
    country: m.country,
    headquarters: m.headquarters,
    lat: m.lat,
    lng: m.lng,
    categories: m.categories,
    products: m.products,
    countries_available: m.countries_available,
    languages: m.languages,
  })
  existingSlugs.add(m.slug)
  addedCa++
}
if (addedCa) {
  writeFileSync(caPath, JSON.stringify(existingCa, null, 2) + '\n')
}

console.log(`Wrote ${businesses.length} businesses → ${outPath}`)
console.log('By kind:', JSON.stringify(byKind))
console.log('Site categories:', [...parentCats].sort().join(', '))
console.log(`Manufacturers-europe.json added: ${addedCa} (total ${existingCa.length})`)
