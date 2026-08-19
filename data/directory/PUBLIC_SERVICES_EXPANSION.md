# Public services directory expansion

Generated: 2026-08-19T15:51:05.576Z

- Total: **32**
- Real estate: **5**
- Legal: **2**
- Accounting: **2**
- Cleaning: **5**
- Architects: **2**
- Engineers: **5**
- Manufacturers: **10**
- Construction companies: **1**
- Cities: **17**
- Site categories: accounting-finance, cleaning, construction, design-engineering, legal-notary, sell-rent

## Import

```bash
node scripts/build-public-services-expansion.mjs
node scripts/import-public-directory.mjs --data=data/directory/public-services-expansion.json
node scripts/import-public-directory.mjs --data=data/directory/public-services-expansion.json --apply
```

## Policy

- Only publicly listed factual business information was used.
- Bios and SEO text are original DImarket copy.
- Reviews, ratings, third-party biographies, photos, and logos were not copied.
- Manufacturer rows also write `manufacturer_profiles` when the signed-in import session is available.
