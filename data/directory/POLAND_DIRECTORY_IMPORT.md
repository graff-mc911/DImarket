# Poland masters + companies directory import

Generated: 2026-08-05T05:33:43.382Z

- Total: **15** (masters: **8**, companies: **7**)
- With map coordinates: **15**
- Cities: **6** (Gdańsk, Kraków, Poznań, Warsaw, Wrocław, Łódź)
- Site categories covered: construction, electrical
- Trade labels: Construction Company, Drywall, Electrician, HVAC, Painting, Plastering, Plumbing, Renovation, Tiles

## Import

```bash
node scripts/build-poland-directory-seed.mjs
node scripts/import-public-directory.mjs --data=data/directory/poland-directory-nationwide.json
node scripts/import-public-directory.mjs --data=data/directory/poland-directory-nationwide.json --apply
```

## Map coordinates backfill

Existing Darmstadt profiles may already exist without `service_latitude` / `service_longitude`. After import:

```bash
node scripts/backfill-poland-directory-coords.mjs
```

Or let the GitHub Action `Backfill Poland directory coords` run on push to `main`.
