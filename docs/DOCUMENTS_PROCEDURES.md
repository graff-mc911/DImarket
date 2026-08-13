# Documents & Procedures

Public category for jurisdiction-aware contracts, licenses, permits, and government procedures.

## Rules

- Never invent legal requirements, licenses, taxes, or contract clauses.
- Unverified templates stay `under_review` with “Template requires legal review”.
- Always show official `source_url` + last verified.
- Reuse AppContext location (Header) — no parallel geo system.
- Extends OSM; does not replace `legal_documents` monitor.

## Routes

| Path | Page |
|------|------|
| `/documents` | Hub + 13 subcategories |
| `/documents/:subcategory` | Filtered list |
| `/documents/:country/:slug` | National document |
| `/documents/:country/:city/:slug` | City-scoped document |
| `/category/documents-procedures` | Alias → hub |
| `/category/official-documents` | Alias → hub |
| `/legal-documents` | OSM pointer list (legacy) |

## Key files

- `src/config/categories.ts` — category + subcategories (expandable Category UI)
- `src/lib/documents/*` — types, Spain catalog, location scoring, PDF
- `src/pages/DocumentsHub.tsx`, `DocumentDetailPage.tsx`
- `supabase/migrations/20260813260000_documents_procedures_catalog.sql`
- Search tab `documents` in `advancedSearch.ts` / `Search.tsx`
- AI intent `documents_procedures` in `problemGuideEngine.ts`

## Spain MVP

Catalog seeds in `src/lib/documents/catalog.ts` (works without SQL). Apply `APPLY_DOCUMENTS_PROCEDURES_CATALOG.sql` when ready to store in Supabase.
