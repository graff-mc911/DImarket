# Documents & Procedures

Public category for jurisdiction-aware contracts, licenses, permits, and government procedures.

## Rules

- Never invent legal requirements, licenses, taxes, or contract clauses.
- Unverified templates stay `under_review` with “Template requires legal review”.
- Always show official `source_url`. **Do not show a fake “last verified” date** — `lastVerified` is null until OSM/human check.
- Reuse AppContext location (Header) — no parallel geo system.
- Extends OSM; does not replace `legal_documents` monitor.
- **Public UX is `/documents` only.** `/legal-documents` redirects to the hub; `/legal-documents/:docKey` remains for OSM-tracked detail when published in DB.

## Trust / freshness

- Static `catalog.ts` / `euPack.ts` / `officialForms.ts` ship with `lastVerified: null`.
- `DocumentDetailPage` uses `DocumentFreshnessBadge` via `documentVerificationStatus()` (`needs_review` / `needs_research` until real verification).
- Do **not** bulk-seed `documents_catalog` with seed dates as `last_verified_at`.
- Future: link rows via `legal_document_id` so OSM Phase 1–7 drives freshness.

## Routes

| Path | Page |
|------|------|
| `/documents` | Hub + 13 subcategories |
| `/documents/:subcategory` | Filtered list |
| `/documents/:country/:slug` | National document |
| `/documents/:country/:city/:slug` | City-scoped document |
| `/category/documents-procedures` | Alias → hub |
| `/category/official-documents` | Alias → hub |
| `/legal-documents` | → Documents hub (unified public surface) |
| `/legal-documents/:docKey` | OSM monitored legal document detail |

## Key files

- `src/config/categories.ts` — category + subcategories (expandable Category UI)
- `src/lib/documents/*` — types, Spain catalog, location scoring, PDF
- `src/lib/documents/officialForms.ts` — country-local fillable blanks (labels in form language; official portal URLs)
- `src/pages/DocumentsHub.tsx`, `DocumentDetailPage.tsx`
- `supabase/migrations/20260813260000_documents_procedures_catalog.sql`
- Search tab `documents` in `advancedSearch.ts` / `Search.tsx`
- AI intent `documents_procedures` in `problemGuideEngine.ts`

Catalog: Spain curated + generated packs for all countries in `countrySources` (DE, FR, PL, IT, PT, RO, NL, CZ, HU, BG, AT, SK, IE, SE, DK, FI, GR, BE, LU, LT, LV, EE, HR, SI, CY, MT, CH, NO, UK).

City overlays: Alicante (ES), Darmstadt (DE).

Each national pack includes: business registration, contracts, licenses/permits, tax, residence, government, legal, banks, personal documents — pointers / under_review only.

### Fillable blanks (not English skeletons)

`withOfficialForm()` overlays field schemas from `officialForms.ts` per country + slug:

| Country | Model examples |
|---------|----------------|
| DE / AT | Wohnraummietvertrag (BGB), GewA1-aligned Gewerbe, Kfz-Kaufvertrag / KBA |
| FR / BE | Bail d’habitation, CERFA 13703*, guichet unique formalités |
| ES | LAU arrendamiento, DGT transferencia, AEAT 036/037, SEPE |
| PL | Umowa najmu (KC), CEIDG / gov.pl |
| IT | Locazione, ACI/PRA, Registro Imprese |
| PT | Arrendamento + Finanças, IMT, Empresa na Hora |
| NL | Huurovereenkomst, KVK, RDW-style sale |
| UK / IE | GOV.UK / RTB-aligned particulars |

We do **not** paste full copyrighted contract bodies — only field structure + link to the official portal. Templates stay under legal review.
