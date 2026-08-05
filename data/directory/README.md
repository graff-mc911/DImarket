# DImarket public business directory

Curated initial directory of publicly listed construction companies and professionals for launch markets.

## Markets

| Market | Seed | Build | Notes |
|--------|------|-------|-------|
| Launch (DE Darmstadt + ES) | `public-businesses.json` | `build-public-directory-seed.mjs` | Early launch set |
| Spain companies | `spain-companies-nationwide.json` | `build-spain-companies-seed.mjs` | Nationwide companies |
| Spain electricians | `spain-electricians-from-listing.json` | — | Serviya-style masters |
| **Slovakia** | `slovakia-directory-nationwide.json` | `build-slovakia-directory-seed.mjs` | Masters + companies + map coords |
| **Romania** | `romania-directory-nationwide.json` | `build-romania-directory-seed.mjs` | Masters + companies + map coords |

## What is included

Factual public fields only: business name, categories, city/region/country, website, public phone, public email, public address, public hours, publicly listed services, and languages when stated.

Each profile also includes:

- Original short DImarket description (`bio`)
- Original SEO `title`, `meta_description`, `slug`, `keywords`
- Normalized `work_subcategory_slugs` for DImarket category sync
- Claimable auth email `directory+{slug}@users.dimarket.app`
- Map coordinates (`service_latitude` / `service_longitude`) when curated

## What is excluded

Reviews, ratings, third-party biographies, marketing copy copied verbatim, photos, logos, and website layouts.

## Rebuild

```bash
node scripts/build-public-directory-seed.mjs
node scripts/build-slovakia-directory-seed.mjs
node scripts/build-romania-directory-seed.mjs
```

## Import into database

```bash
node scripts/import-public-directory.mjs --data=data/directory/slovakia-directory-nationwide.json
node scripts/import-public-directory.mjs --data=data/directory/slovakia-directory-nationwide.json --apply

node scripts/import-public-directory.mjs --data=data/directory/romania-directory-nationwide.json
node scripts/import-public-directory.mjs --data=data/directory/romania-directory-nationwide.json --apply
```

Requires `SUPABASE_SERVICE_ROLE_KEY` and `VITE_SUPABASE_URL` / `SUPABASE_URL`.
To also write `service_radius_km`, set `DIRECTORY_IMPORT_SET_RADIUS=1`.