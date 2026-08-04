# Spain electricians listing import (2026-08-04)

Source page used for **public listing facts only**: names, cities, service titles, starting prices, experience/hourly when stated.

## Included
- 10 DImarket profiles (9 masters + 1 company)
- Original DImarket bios + SEO sidecar fields
- `work_subcategory_slugs` under electro-*
- Claimable emails `directory+{slug}@users.dimarket.app`

## Excluded (on purpose)
- Photos / profile images from third-party storage
- Reviews and ratings
- Marketing/SEO page copy from the source site
- Logos and layout assets

## Import

```bash
node scripts/import-public-directory.mjs --data=data/directory/spain-electricians-from-listing.json
node scripts/import-public-directory.mjs --data=data/directory/spain-electricians-from-listing.json --apply
```

## Avatars

Public listing photos were downloaded and re-hosted on DImarket Supabase Storage (`ad-media/campaigns/profiles/{id}/avatar.*`).

- UI resolves them via `src/lib/directoryAvatars.ts` (catalog + detail cards).
- DB backfill SQL: `data/directory/spain-electricians-avatars-backfill.sql`
- Apply when keys available: `node scripts/apply-electrician-avatars.mjs`
