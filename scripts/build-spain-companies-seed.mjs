#!/usr/bin/env node
/**
 * Build Spain-wide companies directory seed (multi-source public listings).
 * Usage: node scripts/build-spain-companies-seed.mjs
 */
import { writeFileSync, mkdirSync } from 'fs'
import { resolve, dirname } from 'path'
import { fileURLToPath } from 'url'
import { SPAIN_COMPANIES_NATIONWIDE } from './spain-companies-nationwide-data.mjs'
import { SPAIN_EXPANSION } from './spain-directory-expansion-data.mjs'

const __dirname = dirname(fileURLToPath(import.meta.url))
const outDir = resolve(__dirname, '../data/directory')
mkdirSync(outDir, { recursive: true })

function normalize(raw) {
  const location = `${raw.city}, ${raw.region}, ${raw.country}`
  const keywords = [
    ...raw.categories.map((c) => c.toLowerCase()),
    raw.city,
    raw.country,
    'company',
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
    languages: raw.languages?.length ? raw.languages : ['es'],
    preferred_language: raw.languages?.[0] || 'es',
    directory_claim_email: `directory+${raw.slug}@users.dimarket.app`,
    services: raw.services || [],
    bio: raw.bio,
    seo: {
      title: `${raw.full_name} — ${raw.categories[0] || 'Company'} in ${raw.city} | DImarket`,
      meta_description: `Find ${raw.full_name} in ${raw.city}, Spain on DImarket. Request a quote for ${raw.categories.slice(0, 3).join(', ').toLowerCase()} services.`,
      keywords,
    },
    sources: raw.sources || [],
    import: {
      claimable: true,
      source: 'spain-companies-nationwide',
    },
  }
}

const seen = new Set()
const businesses = []
for (const raw of [...SPAIN_COMPANIES_NATIONWIDE, ...SPAIN_EXPANSION]) {
  if (raw.country_code !== 'ES' && raw.country !== 'Spain') continue
  if (raw.user_role !== 'company') continue
  if (seen.has(raw.slug)) continue
  seen.add(raw.slug)
  businesses.push(normalize(raw))
}

const categorySet = new Set()
const citySet = new Set()
const parentCats = new Set()
for (const b of businesses) {
  for (const c of b.categories) categorySet.add(c)
  citySet.add(b.city)
  for (const s of b.work_subcategory_slugs) {
    if (s.startsWith('legal-notary')) parentCats.add('legal-notary')
    else if (s.startsWith('accounting-finance')) parentCats.add('accounting-finance')
    else if (s.startsWith('cleaning-')) parentCats.add('cleaning')
    else if (s.startsWith('logistics-') || s.startsWith('transport-')) parentCats.add('tools')
    else if (s.startsWith('handyman-')) parentCats.add('handyman')
    else if (s.startsWith('furniture-')) parentCats.add('furniture')
    else if (s.startsWith('electrical-')) parentCats.add('electrical')
    else if (s.startsWith('sell-') || s.startsWith('rent-')) parentCats.add('sell-rent')
    else parentCats.add('construction')
  }
}

const payload = {
  version: 1,
  generated_at: new Date().toISOString(),
  source:
    'Curated Spain-wide public company directory from company websites and public registries (not Serviya-only). Factual fields only; original DImarket bios; no reviews/ratings/photos copied.',
  schema: {
    target_table: 'profiles',
    auth_required: true,
    junction: 'professional_categories',
    location_format: 'City, Region, Country',
  },
  summary: {
    businesses_ready_to_import: businesses.length,
    categories_populated: [...categorySet].sort(),
    site_category_slugs_covered: [...parentCats].sort(),
    cities_count: citySet.size,
    cities: [...citySet].sort(),
  },
  businesses,
}

const outPath = resolve(outDir, 'spain-companies-nationwide.json')
writeFileSync(outPath, JSON.stringify(payload, null, 2) + '\n')
writeFileSync(
  resolve(outDir, 'SPAIN_COMPANIES_IMPORT.md'),
  `# Spain companies nationwide import

Generated: ${payload.generated_at}

- Companies: **${businesses.length}**
- Cities: **${citySet.size}** (${[...citySet].sort().join(', ')})
- Site categories covered: ${[...parentCats].sort().join(', ')}
- Trade labels: ${[...categorySet].sort().join(', ')}

## Import

\`\`\`bash
node scripts/import-public-directory.mjs --data=data/directory/spain-companies-nationwide.json
node scripts/import-public-directory.mjs --data=data/directory/spain-companies-nationwide.json --apply
\`\`\`

## Notes

- Multi-source public listings (company websites / public registries), not limited to Serviya.
- Lawyers and accountants included (\`legal-notary\`, \`accounting-finance\` work slugs).
- Ensure DB has \`legal-notary\` and \`accounting-finance\` category rows (migration \`20260628120000_categories_legal_accounting.sql\`).
`,
)

console.log(`Wrote ${businesses.length} companies → ${outPath}`)
console.log('Site categories:', [...parentCats].sort().join(', '))
console.log('Cities:', citySet.size)
