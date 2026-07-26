# DImarket Supabase Production Sync — Final Report

Generated: 2026-07-26T13:28:35.566104+00:00
Project: `wjlfvajloxkevggwjgtk` (`https://wjlfvajloxkevggwjgtk.supabase.co`)
Branch tooling: `cursor/sync-supabase-prod-6731`

## Verdict

**Production schema is out of sync with the application. Apply is blocked in this environment.**

| Metric | Value |
|--------|------:|
| Database health score (pre-apply) | **27/100** |
| Migrations in repo | 73 |
| Applied migrations this run | **0** (no Management API token) |
| Skipped migrations this run | **0** (apply not started) |
| Failed migrations this run | **0** |

### Blocker
`SUPABASE_ACCESS_TOKEN` (`sbp_...`) and `SUPABASE_SERVICE_ROLE_KEY` are not available here:
- Vercel env pull redacts secrets to `[SENSITIVE]`
- No database URL / service role in the Cloud Agent environment
- Management API cannot run SQL with the public anon key

**No production data was modified or deleted.**

## STEP 1 — Gap analysis (migrations vs prod)

### Missing tables / views (product-critical)
- `verification_requests`
- `verification_status`
- `verification_history`
- `trust_scores`
- `project_applications`
- `company_reviews`
- `professional_reviews`
- `projects`
- `homepage_metrics`
- `bookings`
- `favorites`

### Present core tables
- `verification_documents`
- `saved_items`
- `conversations`
- `messages`
- `notifications`
- `profiles`
- `listings`
- `categories`
- `reviews`
- `contractor_verifications`
- `portfolio_items`
- `ad_campaigns`

### Missing columns
- `profiles.verification_level`
- `profiles.email_verified_at`
- `profiles.phone_verified_at`
- `profiles.business_verified`
- `profiles.trusted_professional`
- `profiles.identity_verified`
- `profiles.trust_level`
- `notifications.is_archived`
- `projects.is_archived`
- `projects.status`
- `conversations.is_archived`

### Critical RPCs (all missing)
- `get_marketplace_category_page`
- `get_homepage_metrics`
- `ensure_conversation`
- `create_notification`
- `count_unread_notifications`

### Frontend RPCs missing (29)
- `admin_analytics_series`
- `admin_boost_master_rating`
- `admin_list_subscriptions`
- `admin_moderate_review`
- `admin_panel_stats`
- `admin_review_verification`
- `admin_search_profiles`
- `admin_set_listing_status`
- `admin_set_review_report_status`
- `admin_update_profile_flags`
- `admin_verify_master`
- `apply_referral_code`
- `consume_lead_credit`
- `count_unread_notifications`
- `create_notification`
- `ensure_conversation`
- `ensure_referral_code`
- `ensure_telegram_link_code`
- `get_homepage_metrics`
- `get_marketplace_category_page`
- `get_professional_booking_availability`
- `notify_job_match_professionals`
- `pro_analytics_series`
- `recompute_trust_score`
- `record_profile_view`
- `refresh_profile_rating`
- `register_geo_location`
- `track_ad_click`
- `track_ad_impression`

### Frontend RPCs present
- `admin_top_masters`
- `get_marketplace_main_categories`
- `get_public_footer_stats`
- `register_app_visit`

### Storage buckets
All required buckets missing from anon Storage API:
- `portfolio`
- `avatars`
- `company-logos`
- `company-gallery`
- `project-files`
- `verification-documents`
- `chat-files`
- `verification-docs`
- `chat-media`
- `portfolio-media`
- `ad-media`
- `review-media`

### Migration catalog probe
- Tables present in prod: **51**
- Tables missing in prod: **24**
- Functions present: **9**
- Functions missing: **48**

Notes:
- App uses `listings` for projects (no separate `projects` table required).
- `favorites` / `company_reviews` / `professional_reviews` / `verification_requests` are compatibility **views** in the critical sync migration.
- Indexes / RLS / triggers cannot be fully enumerated via anon REST; they are created idempotently by priority migrations + critical sync.

## STEP 2 — Apply plan (ready, not executed)

Safe apply command (once token is provided):

```bash
# .env.local (never commit)
SUPABASE_ACCESS_TOKEN=sbp_...
SUPABASE_SERVICE_ROLE_KEY=...          # optional, better verification
VITE_SUPABASE_ANON_KEY=...
VITE_SUPABASE_URL=https://wjlfvajloxkevggwjgtk.supabase.co

npm run db:audit-prod
npm run db:sync-prod                 # priority migrations only
# npm run db:sync-prod -- --all      # every migration file (slower)
```

Priority order (dependency-aware, skip-safe on duplicates):
1. `20260628120000_phase1_marketplace.sql`
2. `20260713100000_phase3_referrals_and_job_notify.sql`
3. `20260719120000_lead_marketplace_mvp.sql`
4. `20260720120000_create_project_wizard_ensure.sql`
5. `20260720140000_project_feed_geo_realtime.sql`
6. `20260720150000_ai_match_profile_fields.sql`
7. `20260722100000_quote_equipment_pdf.sql`
8. `20260722120000_verification_platinum.sql`
9. `20260722140000_portfolio_upgrade.sql`
10. `20260722150000_review_system_upgrade.sql`
11. `20260722160000_chat_media_push_upgrade.sql`
12. `20260722170000_booking_calendar.sql`
13. `20260722180000_notification_center_upgrade.sql`
14. `20260723120000_admin_panel.sql`
15. `20260723130000_monetization_system.sql`
16. `20260725120000_analytics_system.sql`
17. `20260725140000_marketplace_categories.sql`
18. `20260725180000_homepage_metrics.sql`
19. `20260725190000_category_completed_projects.sql`
20. `20260726250000_notification_center_complete.sql`
21. `20260726270000_trust_verification_system.sql`
22. `20260726280000_prod_schema_sync_critical.sql` ← idempotent catch-up

Script behavior:
- Uses Supabase Management API SQL endpoint
- Treats `already exists` / duplicate object errors as **skip**
- Never issues DELETE/DROP of user data
- Writes `/opt/cursor/artifacts/supabase-sync-report.md` after apply

## STEPS 3–9 — Verification status

| Check | Status |
|-------|--------|
| Critical RPCs exist & callable | ❌ Missing (all 5) |
| Required tables | ⚠️ Partial (12 present / 11 missing of probed set) |
| Required columns | ⚠️ Partial (trust/verification columns largely missing) |
| RLS policies | ⚠️ Cannot fully audit without SQL access; critical sync enables RLS + role policies |
| Storage buckets | ❌ None of required buckets visible |
| Indexes | ⚠️ Declared in migrations; not creatable without apply |
| Failed migrations / invalid FKs / views / functions | ⏸️ Not runnable until apply |

## STEP 10 — Summary

### Applied migrations
- *(none — blocked)*

### Skipped migrations
- *(none — blocked)*

### Fixed database issues
- **Tooling prepared** (not yet applied to prod):
  - `scripts/sync-prod-database.mjs` — audit + ordered apply + health score
  - `supabase/migrations/20260726280000_prod_schema_sync_critical.sql` — idempotent catch-up for columns, tables, views, RPCs, buckets, indexes, RLS
  - `npm run db:audit-prod` / `npm run db:sync-prod`

### Remaining issues
1. Provide `SUPABASE_ACCESS_TOKEN` and re-run `npm run db:sync-prod`
2. After apply, re-audit until health ≥ 90
3. Smoke-test: `/category/demolition`, chat (`ensure_conversation`), notifications unread count, verification admin, homepage metrics
4. Confirm Storage buckets in Dashboard → Storage

### Database health score
**27/100** (pre-apply)

### Safety
- No production data deleted
- No UI redesign / business-logic changes
- React components untouched
