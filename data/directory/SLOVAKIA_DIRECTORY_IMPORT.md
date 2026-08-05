# Slovakia masters + companies directory import

Generated: 2026-08-05T12:18:02.820Z

- Total: **12** (masters: **2**, companies: **10**)
- With map coordinates: **12**
- Cities: **5** (Banská Bystrica, Bratislava, Košice, Nitra, Trnava)
- Site categories covered: construction, electrical, hvac
- Trade labels: Construction Company, Electrician, HVAC, Plumbing, Renovation

## Import

```bash
node scripts/build-slovakia-directory-seed.mjs
node scripts/import-public-directory.mjs --data=data/directory/slovakia-directory-nationwide.json
node scripts/import-public-directory.mjs --data=data/directory/slovakia-directory-nationwide.json --apply
```
