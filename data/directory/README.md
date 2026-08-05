# DImarket public business directory

Curated initial directory of publicly listed construction companies and professionals for launch markets (Germany nationwide, Spain, Alicante/Madrid).

## What is included

Factual public fields only: business name, categories, city/region/country, website, public phone, public email, public address, public hours, publicly listed services, languages when stated, and map coordinates (`service_latitude` / `service_longitude`).

Each profile also includes:

- Original short DImarket description (`bio`)
- Original SEO `title`, `meta_description`, `slug`, `keywords`
- Normalized `work_subcategory_slugs` for DImarket category sync
- Claimable auth email `directory+{slug}@users.dimarket.app`

## What is excluded

Reviews, ratings, third-party biographies, marketing copy copied verbatim, photos, logos, and website layouts.

## Files

- `public-businesses.json` — primary multi-market seed
- `spain-companies-nationwide.json` — Spain companies
- `germany-directory-nationwide.json` — Germany masters + companies (with map coords)
- `GERMANY_DIRECTORY_IMPORT.md` — Germany import notes
- `germany-coords-backfill.sql` — map coordinate backfill for existing rows

## Rebuild

```bash
node scripts/build-public-directory-seed.mjs
node scripts/build-spain-companies-seed.mjs
node scripts/build-germany-directory-seed.mjs
```

## Import into database

```bash
node scripts/import-public-directory.mjs --data=data/directory/germany-directory-nationwide.json
node scripts/import-public-directory.mjs --data=data/directory/germany-directory-nationwide.json --apply
node scripts/backfill-germany-directory-coords.mjs
```

Requires `VITE_SUPABASE_URL` and either `SUPABASE_SERVICE_ROLE_KEY` or `VITE_SUPABASE_ANON_KEY`.
