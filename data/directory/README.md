# DImarket public business directory

Curated initial directory of publicly listed construction companies and professionals for launch markets (Darmstadt, Alicante, Madrid).

## What is included

Factual public fields only: business name, categories, city/region/country, website, public phone, public email, public address, public hours, publicly listed services, and languages when stated.

Each profile also includes:

- Original short DImarket description (`bio`)
- Original SEO `title`, `meta_description`, `slug`, `keywords`
- Normalized `work_subcategory_slugs` for DImarket category sync
- Claimable auth email `directory+{slug}@users.dimarket.app`

## What is excluded

Reviews, ratings, third-party biographies, marketing copy copied verbatim, photos, logos, and website layouts.

## Files

- `public-businesses.json` — primary import payload (profiles schema + SEO sidecar)
- `public-businesses.csv` — flat importable table
- `public-businesses.sql` — SQL UPDATE helpers (after auth users exist)
- `IMPORT_SUMMARY.md` / `IMPORT_SUMMARY.json` — counts and skipped records

## Rebuild

```bash
node scripts/build-public-directory-seed.mjs
```

## Import into database

```bash
node scripts/import-public-directory.mjs          # dry-run
node scripts/import-public-directory.mjs --apply  # create auth users + profiles
```

Requires `SUPABASE_SERVICE_ROLE_KEY` and `VITE_SUPABASE_URL` / `SUPABASE_URL`.
