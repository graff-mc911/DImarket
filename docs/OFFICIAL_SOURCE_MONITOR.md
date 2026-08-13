# Official Source Monitor & Document Version Control

**Name:** Automatic monitoring of official sources + version control  
**Not:** Silent AI rewrite of legal documents

## Pipeline

```
OFFICIAL SOURCE → FETCH/CHECK → COMPARE → CHANGE EVENT
→ REVIEW → APPROVE → PUBLISH → USER SEES CURRENT VERSION
```

## What shipped (MVP)

| Piece | Location |
|-------|----------|
| Schema | `supabase/migrations/20260813120000_official_source_monitor.sql` |
| Apply paste | `supabase/migrations/APPLY_OFFICIAL_SOURCE_MONITOR.sql` |
| Core logic | `src/lib/officialSources/` |
| Edge monitor | `supabase/functions/official-sources-monitor/` |
| Cron | `.github/workflows/official-sources-cron.yml` |
| Admin UI | `/admin/official-sources` |
| Freshness badge | `DocumentFreshnessBadge` + legal disclaimer |
| Tests | `npm run test:official-sources` |

## Spain-first sources (real URLs only)

- BOE (`boe.es`)
- Administración General del Estado
- Agencia Tributaria
- Your Europe Business (EU)
- Generalitat Valenciana
- Ayuntamiento de Alicante

Seeded `legal_documents` are **procedure pointers** with `needs_research` / unpublished — **no invented contract text**.

## How checks work

1. Cron (daily) or owner **Check sources now** calls edge `official-sources-monitor`.
2. Fetch official URL → strip scripts/styles → normalize whitespace → SHA-256 hash.
3. Same hash → `verified`. Different hash → `source_changes` + documents `needs_review`.
4. HTTP fail / 404 → `unavailable` / `outdated`; old content is **not** shown as current.
5. Admin reviews change (diff excerpts). Approve does **not** invent new legal clauses — it records review. Publishing curated document versions is a separate step.

## Effective dates

`document_versions` support `published_at`, `effective_from`, `effective_until`.  
`resolveCurrentVersion()` picks the published version in the current window; future versions stay stored until `effective_from`.

## Trust (no fake AI %)

Trust labels come from `trust_tier` / source type (EU, gazette, national, regional, municipal…).

## User-facing badge

- 🟢 Current / 🟡 Needs review / 🔴 Outdated or unavailable  
- Last verified date + official source link + disclaimer

## Deploy

```bash
# 1. Apply SQL in Supabase SQL editor (or):
npm run db:apply-official-sources

# 2. Deploy function
npm run deploy:official-sources

# 3. Optional cron secret (GitHub Actions)
# OFFICIAL_SOURCES_CRON_SECRET or fallback MARKETING_CRON_SECRET
```

## Tests

```bash
npm run test:official-sources
```

Covers: hash equality, change detection, versioning, effective/future, overdue freshness, unavailable, diff, Spain priority.

## Phase 2

| Feature | Details |
|---------|---------|
| Telegram alerts | critical/high changes → `TELEGRAM_ADMIN_CHAT_ID` or `TELEGRAM_CHANNEL_ID` |
| Publish / rollback | Admin actions via edge — audit log, no silent rewrite |
| Effective switch | Cron auto-activates version when `effective_from` reached |
| Public UI | `/legal-documents` + `/legal-documents/:key` |
| EU config | DE, FR, PL official sources seeded |
| SQL | `APPLY_OFFICIAL_SOURCE_MONITOR_PHASE2.sql` |

Published Spain entries are **pointers only** — link to BOE / Your Europe, not full legal text.
