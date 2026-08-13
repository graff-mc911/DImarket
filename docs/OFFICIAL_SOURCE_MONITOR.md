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

## Phase 3

| Feature | Details |
|---------|---------|
| Myers line diff | Admin side-by-side diff for source changes |
| Draft templates | Admin creates draft version → review → publish |
| Spain rental draft | `es-rental-agreement-template` seeded as `review_required` |
| PDF export | `/legal-documents/:key` → Save as PDF with version/source footer |
| IT / PT / RO | Normattiva, DRE, Portal Legislativ + gov portals |
| SQL | `APPLY_OFFICIAL_SOURCE_MONITOR_PHASE3.sql` |

## Phase 4

| Feature | Details |
|---------|---------|
| Rich text editor | Admin markdown toolbar + preview for draft versions |
| Auto-draft | On hash change → `review_required` draft with excerpts (never auto-publish) |
| Email alerts | Resend (`RESEND_API_KEY`, `OSM_ALERT_EMAIL`) for critical/high alongside Telegram |
| NL / CZ / HU / BG | wetten.overheid.nl, e-Sbírka, NJT, lex.bg + gov portals |
| SQL | `APPLY_OFFICIAL_SOURCE_MONITOR_PHASE4.sql` |

Edge secrets for email: `RESEND_API_KEY`, `OSM_ALERT_EMAIL` (or `ADMIN_EMAIL`), optional `RESEND_FROM_EMAIL`.

Auto-draft versions use prefix `auto-` — admin UI shows badge; publish only after manual review.

## Phase 5

| Feature | Details |
|---------|---------|
| Pointer publish | All `*-legislation-entry` docs get published pointer version (`2026.08-pointer`) |
| DE / FR / PL docs | Legislation entry documents seeded (sources existed since phase 2) |
| AT / SK / IE / SE / DK / FI / GR / BE / LU | Official gazette + gov portals seeded and published |
| Edit draft | Admin can edit `draft` / `review_required` / `approved` versions (edge `update_draft_version`) |
| Template editor | Pointer template insert, blockquote, code, h3 in markdown toolbar |
| Email-only fallback | Alert status UI when only Resend is configured; notify logic skips unconfigured channels |
| Public filter | `/legal-documents` country filter |
| SQL | `APPLY_OFFICIAL_SOURCE_MONITOR_PHASE5.sql` |

## Phase 6

| Feature | Details |
|---------|---------|
| LT / LV / EE / HR / SI | Official gazette + gov portals, published legislation pointers |
| Rental drafts | DE, FR, IT, PL, NL `contract_template` skeletons (`review_required`, not published) |
| Webhook alerts | `OSM_WEBHOOK_URL` (+ optional `OSM_WEBHOOK_SECRET`) on critical/high changes |
| Weekly digest | Edge `weekly_digest` — pending review summary (email, or Telegram fallback) |
| Cron | `.github/workflows/official-sources-weekly-digest.yml` (Mondays 07:00 UTC) |
| SQL | `APPLY_OFFICIAL_SOURCE_MONITOR_PHASE6.sql` |

Webhook payload: `{ event, severity, change_id, source_name, country_code, source_url, summary, affected_documents, admin_url, detected_at }`.

## Phase 7

| Feature | Details |
|---------|---------|
| CY / MT / CH / NO / UK | Official gazette + gov portals, published legislation pointers |
| Rental drafts | AT, PT, IE, BE, UK skeletons (`review_required`) |
| Rental hubs | ES/DE/FR/UK published **hub pointers** (not contracts) |
| Approve draft | Edge `approve_version` — approve before publish (separate steps) |
| Slack webhook | `OSM_SLACK_WEBHOOK_URL` or Slack-style `hooks.slack.com` URL |
| Filters | Admin doc-kind filter; public type filter |
| SQL | `APPLY_OFFICIAL_SOURCE_MONITOR_PHASE7.sql` |

Contract templates are **never** auto-published. Public rental hubs are informational pointers only.
