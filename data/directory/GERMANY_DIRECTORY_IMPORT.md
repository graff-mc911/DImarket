# Germany masters + companies directory import

Generated: 2026-08-04T21:44:51.316Z

- Total: **31** (masters: **8**, companies: **23**)
- With map coordinates: **31**
- Cities: **13** (Berlin, Bremen, Cologne, Darmstadt, Dresden, Düsseldorf, Frankfurt, Hamburg, Hannover, Leipzig, Munich, Nuremberg, Stuttgart)
- Site categories covered: construction, electrical
- Trade labels: Construction Company, Demolition, Drywall, Electrician, Flooring, HVAC, Insulation, Painting, Plastering, Plumbing, Renovation, Tiles

## Import

```bash
node scripts/build-germany-directory-seed.mjs
node scripts/import-public-directory.mjs --data=data/directory/germany-directory-nationwide.json
node scripts/import-public-directory.mjs --data=data/directory/germany-directory-nationwide.json --apply
```

## Map coordinates backfill

Existing Darmstadt profiles may already exist without `service_latitude` / `service_longitude`. After import:

```bash
node scripts/backfill-germany-directory-coords.mjs
```

Or let the GitHub Action `Backfill Germany directory coords` run on push to `main`.
