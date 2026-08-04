# Spain companies nationwide import

Generated: 2026-08-04T14:43:49.629Z

- Companies: **50**
- Cities: **20** (Arroyomolinos, Badalona, Barcelona, Bilbao, Ciudad Real, Esplugues de Llobregat, Granada, L'Hospitalet de Llobregat, Madrid, Murcia, Málaga, Peligros, Pinto, San Fernando de Henares, Sant Boi de Llobregat, Sevilla, Torrent, Valencia, Viladecans, Zaragoza)
- Site categories covered: accounting-finance, cleaning, construction, electrical, furniture, handyman, legal-notary, sell-rent, tools
- Trade labels: Accountant, Architecture, Auto Electrician, Auto Repair, Carpentry, Cleaning, Construction Company, Doors, Drywall, Electrician, Equipment Rental, Flooring, Furniture, Gestoría, HVAC, Handyman, Interior Design, Landscaping, Lawyer, Moving, Painting, Plumbing, Renovation, Tax Consultant, Tiles

## Import

```bash
node scripts/import-public-directory.mjs --data=data/directory/spain-companies-nationwide.json
node scripts/import-public-directory.mjs --data=data/directory/spain-companies-nationwide.json --apply
```

## Notes

- Multi-source public listings (company websites / public registries), not limited to Serviya.
- Lawyers and accountants included (`legal-notary`, `accounting-finance` work slugs).
- Ensure DB has `legal-notary` and `accounting-finance` category rows (migration `20260628120000_categories_legal_accounting.sql`).
