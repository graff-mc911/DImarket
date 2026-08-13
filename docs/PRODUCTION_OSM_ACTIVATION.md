# Official Sources — Production Activation Checklist

Project ref: `wjlfvajloxkevggwjgtk`  
Edge URL: `https://wjlfvajloxkevggwjgtk.supabase.co/functions/v1/official-sources-monitor`

This is an **operator runbook**. Agent cloud environment does **not** have a valid
`SUPABASE_ACCESS_TOKEN`, cannot deploy Edge Functions, cannot set GitHub secrets,
and cannot `workflow_dispatch` (API 403).

## Measured production state (read-only anon REST, 2026-08-13)

| Object | Count / status |
|--------|----------------|
| `official_sources` | **12** (all `is_active=true`, all `needs_review`) |
| `legal_documents` | **2** (both `verified` + published; linked to sources) |
| `document_versions` | **2** (`published`) |
| `source_checks` | **0** |
| `source_changes` | **0** |
| `document_audit_log` | **0** |
| `documents_catalog` | **MISSING** (PostgREST PGRST205) |
| `osm_weekly_digest_runs` | **MISSING** |
| `docs-*` / `docs-src-*` bridge keys | **0** |
| Edge `official-sources-monitor` | **HTTP 404** |
| GitHub Actions daily cron runs | **0** |
| GitHub Actions weekly digest runs | **0** |

---

## USER ACTION REQUIRED (exact)

### 1) Supabase Access Token (deploy + optional SQL API)

| Field | Value |
|-------|--------|
| **ЩО** | Create personal access token `sbp_…` |
| **ДЕ** | https://supabase.com/dashboard/account/tokens |
| **КОМАНДА** (local machine with repo) | `export SUPABASE_ACCESS_TOKEN='sbp_…'` then `npm run deploy:official-sources` |
| **ОЧІКУЄТЬСЯ** | Deploy success; then `curl` below returns **not** 404 |

Verify after deploy:

```bash
curl -sS -w "\nHTTP %{http_code}\n" -X POST \
  "https://wjlfvajloxkevggwjgtk.supabase.co/functions/v1/official-sources-monitor" \
  -H "Content-Type: application/json" \
  -d '{"action":"status"}'
```

Expected: HTTP **401/403** without secret (auth required) — **never 404**.  
With secret:

```bash
curl -sS -w "\nHTTP %{http_code}\n" -X POST \
  "https://wjlfvajloxkevggwjgtk.supabase.co/functions/v1/official-sources-monitor" \
  -H "Content-Type: application/json" \
  -H "x-cron-secret: $OFFICIAL_SOURCES_CRON_SECRET" \
  -d '{"action":"status"}'
```

Expected: HTTP **200** + JSON `{ sources, review_required, … }`.

---

### 2) SQL Editor — apply missing schema (order matters)

| Field | Value |
|-------|--------|
| **ЩО** | Paste APPLY files in order (IF NOT EXISTS — safe to re-run core) |
| **ДЕ** | Supabase Dashboard → Project `wjlfvajloxkevggwjgtk` → SQL Editor |
| **ФАЙЛИ** (from branch `cursor/docs-osm-bridge-audit-fix-81bd` or after merge) | See ordered list below |
| **ОЧІКУЄТЬСЯ** | Tables exist; verification queries return numbers |

**Ordered checklist (paste one file per run, wait for success):**

1. `supabase/migrations/APPLY_OFFICIAL_SOURCE_MONITOR.sql` — already largely present (12 sources / 2 docs). Re-run only if unsure; uses IF NOT EXISTS.
2. `APPLY_OFFICIAL_SOURCE_MONITOR_PHASE2.sql`
3. `APPLY_OFFICIAL_SOURCE_MONITOR_PHASE3.sql`
4. `APPLY_OFFICIAL_SOURCE_MONITOR_PHASE4.sql`
5. `APPLY_OFFICIAL_SOURCE_MONITOR_PHASE5.sql`
6. **`APPLY_OFFICIAL_SOURCE_MONITOR_PHASE6.sql`** ← creates `osm_weekly_digest_runs` (**MISSING now**)
7. `APPLY_OFFICIAL_SOURCE_MONITOR_PHASE7.sql`
8. **`APPLY_DOCUMENTS_PROCEDURES_CATALOG.sql`** ← creates `documents_catalog` (**MISSING now**)
9. **`APPLY_DOCUMENTS_OSM_BRIDGE.sql`** ← seeds `docs-src-*` / `docs-*`, links `legal_document_id`, sync trigger

**Verification SQL (run after step 9):**

```sql
SELECT 'official_sources' AS t, count(*)::int AS n FROM public.official_sources
UNION ALL SELECT 'legal_documents', count(*)::int FROM public.legal_documents
UNION ALL SELECT 'documents_catalog', count(*)::int FROM public.documents_catalog
UNION ALL SELECT 'catalog_linked', count(*)::int FROM public.documents_catalog WHERE legal_document_id IS NOT NULL
UNION ALL SELECT 'catalog_unlinked', count(*)::int FROM public.documents_catalog WHERE legal_document_id IS NULL
UNION ALL SELECT 'docs_star_legal', count(*)::int FROM public.legal_documents WHERE doc_key LIKE 'docs-%'
UNION ALL SELECT 'docs_src_sources', count(*)::int FROM public.official_sources WHERE source_key LIKE 'docs-src-%'
UNION ALL SELECT 'osm_weekly_digest_runs', count(*)::int FROM public.osm_weekly_digest_runs
UNION ALL SELECT 'source_checks', count(*)::int FROM public.source_checks
UNION ALL SELECT 'source_changes', count(*)::int FROM public.source_changes;
```

Expected after bridge (approximate):

- `docs_src_sources` ≥ **11** (vehicle portal seeds)
- `docs_star_legal` ≥ **11**
- `catalog_linked` ≥ **11**
- `documents_catalog` exists (n ≥ linked)
- `osm_weekly_digest_runs` table exists (n may be 0)

---

### 3) Edge secret `OFFICIAL_SOURCES_CRON_SECRET`

| Field | Value |
|-------|--------|
| **ЩО** | Set random secret (do not reuse in chat) |
| **ДЕ (Supabase)** | Dashboard → Edge Functions → Secrets → `OFFICIAL_SOURCES_CRON_SECRET` |
| **ДЕ (GitHub)** | Repo Settings → Secrets and variables → Actions → `OFFICIAL_SOURCES_CRON_SECRET` |
| **КОМАНДА (optional CLI)** | `npx supabase secrets set OFFICIAL_SOURCES_CRON_SECRET='…' --project-ref wjlfvajloxkevggwjgtk` |
| **ОЧІКУЄТЬСЯ** | Cron workflows no longer print “secret not set — skip”; edge accepts `x-cron-secret` |

Fallback name also accepted by code/workflows: `MARKETING_CRON_SECRET` (if already set for marketing-agent).

---

### 4) Deploy Edge Function

```bash
export SUPABASE_ACCESS_TOKEN='sbp_…'   # from step 1
cd /path/to/DImarket
git checkout cursor/docs-osm-bridge-audit-fix-81bd   # or main after merge
npm run deploy:official-sources
```

Equivalent:

```bash
npx supabase functions deploy official-sources-monitor --project-ref wjlfvajloxkevggwjgtk
```

---

### 5) Manual cron tests (GitHub Actions)

| Field | Value |
|-------|--------|
| **ЩО** | `workflow_dispatch` daily + weekly |
| **ДЕ** | GitHub → Actions → “Official Sources Monitor Cron” → Run workflow |
| **ТАКОЖ** | Actions → “Official Sources Weekly Digest” → Run workflow |
| **ОЧІКУЄТЬСЯ** | Run appears (total > 0); conclusion **success**; not a no-op skip |

CLI (needs write permission — cloud agent has 403):

```bash
gh workflow run "Official Sources Monitor Cron" --ref main
gh workflow run "Official Sources Weekly Digest" --ref main
gh run list --workflow="Official Sources Monitor Cron" --limit 3
```

Safe edge test after secret set:

```bash
# status — non-destructive
curl -sS -X POST \
  "https://wjlfvajloxkevggwjgtk.supabase.co/functions/v1/official-sources-monitor" \
  -H "Content-Type: application/json" \
  -H "x-cron-secret: $OFFICIAL_SOURCES_CRON_SECRET" \
  -d '{"action":"status"}'

# one forced check cycle (writes source_checks; may create review if hash changed)
curl -sS -X POST \
  "https://wjlfvajloxkevggwjgtk.supabase.co/functions/v1/official-sources-monitor" \
  -H "Content-Type: application/json" \
  -H "x-cron-secret: $OFFICIAL_SOURCES_CRON_SECRET" \
  -d '{"action":"check_now"}'
```

Then in SQL Editor:

```sql
SELECT count(*) AS checks FROM public.source_checks;
SELECT count(*) AS changes FROM public.source_changes;
SELECT verification_status, count(*) FROM public.official_sources GROUP BY 1;
```

Expected: `source_checks` **> 0** after `check_now`.

---

## What this agent already verified (no assumption)

- Deploy with current env token → `LegacyInvalidAccessTokenError`
- Apply migration API → `401 JWT could not be decoded`
- `gh workflow run` → **403** Resource not accessible by integration
- `gh api …/actions/secrets` → **403**
- Production edge POST → **404 NOT_FOUND**
- Cron workflow totals → **0 / 0**
- Anon REST inventory numbers above

## Form schema versioning

`officialForms.ts` remains **PARTIAL** — UI forms are not fully stored as `document_versions` schemas. Out of scope for this activation; do not mark PASS.
