# Public business directory — import summary

Generated: 2026-08-04T10:30:27.700Z

## Totals

| Metric | Value |
| --- | ---: |
| Businesses ready to import | **18** |
| Categories populated | **15** |
| Cities covered | **3** |
| Duplicates removed | **0** |
| Records skipped (insufficient public info) | **7** |

## Categories

- Construction Company
- Demolition
- Doors
- Drywall
- Electrician
- Flooring
- HVAC
- Insulation
- Interior Design
- Painting
- Plastering
- Plumbing
- Renovation
- Tiles
- Windows

## Cities

- Alicante, Valencia, Spain (7)
- Darmstadt, Hessen, Germany (7)
- Madrid, Madrid, Spain (4)

## Roles

- Companies: 16
- Professionals: 2

## Skipped

- **Generic yellow-pages painter listings (Darmstadt)** — Name-only aggregator entries without a verifiable website or published phone/address owned by the business.
- **ibau / public tender notices (Darmstadt)** — Tender notices are not business directory profiles.
- **Unverified Google Maps pins without official website** — Insufficient reusable public business facts without copying third-party reviews or photos.
- **Duplicate REFISER Coslada landing pages** — Same company as REFISER Madrid; merged into one listing.
- **Duplicate Carbonell / Reformas Alicante brand variants** — Same operating company already included as Carbonell Reformas Alicante.
- **Redosan Reformas (Alicante)** — Appears only on third-party directories without a verified owned website, phone, or address.
- **Hardware / building-materials retailers without clear construction-service listing** — Insufficient public service facts for a DImarket professional/company profile.

## Files

- `public-businesses.json` — primary import payload (matches profiles schema + SEO sidecar)
- `public-businesses.csv` — flat importable table
- `public-businesses.sql` — SQL UPDATE helpers (requires auth users from the import script)
- `IMPORT_SUMMARY.json` — machine-readable summary

## Import

```bash
# Dry-run (default)
node scripts/import-public-directory.mjs

# Apply to Supabase (requires SUPABASE_SERVICE_ROLE_KEY)
node scripts/import-public-directory.mjs --apply
```

## Policy

- Only publicly listed factual business information was used.
- Bios, SEO titles, meta descriptions, and keywords are original DImarket text.
- Reviews, ratings, biographies copied from third parties, photos, logos, and website layouts were not scraped or reused.
- Auth emails are claimable directory+slug@users.dimarket.app addresses; public business emails stay in public_email only.

## Live import (production)

- Applied: 2026-08-04 via `node scripts/import-public-directory.mjs --apply` (anon signup mode)
- Result: **18/18 created** — see `import-run-report.md`
