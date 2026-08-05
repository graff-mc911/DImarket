# Ukraine masters + companies directory import

Generated: 2026-08-05T06:10:31.362Z

- Total: **16** (masters: **2**, companies: **14**)
- With map coordinates: **16**
- Cities: **5** (Dnipro, Kharkiv, Kyiv, Lviv, Odesa)
- Site categories covered: construction, electrical, handyman
- Trade labels: Electrician, HVAC, Handyman, Interior Design, Painting, Plumbing, Renovation

## Import

```bash
node scripts/build-ukraine-directory-seed.mjs
node scripts/import-public-directory.mjs --data=data/directory/ukraine-directory-nationwide.json
node scripts/import-public-directory.mjs --data=data/directory/ukraine-directory-nationwide.json --apply
```

## Map coordinates backfill

Existing Darmstadt profiles may already exist without `service_latitude` / `service_longitude`. After import:

```bash
node scripts/backfill-ukraine-directory-coords.mjs
```

Or let the GitHub Action `Backfill Ukraine directory coords` run on push to `main`.
