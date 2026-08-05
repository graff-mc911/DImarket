# Romania masters + companies directory import

Generated: 2026-08-05T12:17:40.311Z

- Total: **11** (masters: **3**, companies: **8**)
- With map coordinates: **11**
- Cities: **5** (Bucharest, Cluj-Napoca, Constanța, Iași, Timișoara)
- Site categories covered: construction, electrical, hvac
- Trade labels: Construction Company, Electrician, HVAC, Handyman, Plumbing, Renovation

## Import

```bash
node scripts/build-romania-directory-seed.mjs
node scripts/import-public-directory.mjs --data=data/directory/romania-directory-nationwide.json
node scripts/import-public-directory.mjs --data=data/directory/romania-directory-nationwide.json --apply
```
