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
- Bridge: `documentsOsmDocKey` + `enrichDocumentWithOsm()` overlay live OSM status when `legal_documents.doc_key = docs-{cc}-{slug}` exists.
- SQL: `APPLY_DOCUMENTS_OSM_BRIDGE.sql` / `20260813280000_documents_osm_bridge.sql` seeds vehicle form portals, links `legal_document_id`, and adds trigger syncing catalog status from OSM.
- Edge `official-sources-monitor` also updates `documents_catalog` when linked legal docs go needs_review/outdated.
- **Production requires:** edge function deployed + bridge SQL applied + `OFFICIAL_SOURCES_CRON_SECRET` (cron currently shows 0 runs until secrets/deploy are live).

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
| DE / AT | Wohnraummietvertrag (BGB), GewA1-aligned Gewerbe, Kfz privat (I–VI) + **gewerblich/MwSt**, KBA check links |
| FR / BE | Bail, CERFA 13703* (privé + pro/SIRET), HistoVec / Car-Pass |
| ES | LAU, DGT particular + **empresas/CIF**, informe DGT |
| PL | Umowa najmu, CEPiK + firma/VAT |
| IT | Locazione, PRA/ACI + imprese |
| PT | Arrendamento, IMT + empresa |
| NL | Huur, RDW + zakelijk/btw |
| UK / IE | GOV.UK / DVLA MOT check |

Vehicle docs also attach `relatedPortals` (official history / register links). Filling prepares data — **official acceptance** often requires filing on the national portal (ANTS, DGT sede, Zulassungsstelle, etc.).

We do **not** paste full copyrighted contract bodies — only field structure + link to the official portal. Templates stay under legal review.
