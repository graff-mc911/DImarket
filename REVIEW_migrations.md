# Supabase Migrations Review — DImarket

Scope: `/home/user/workspace/DImarket/supabase/migrations/` (119 `.sql` files: 98 timestamped, 15 `APPLY_*`, 2 `SEED_*`, 1 `FIX_*` root-level runbook script). No shared-helpers folder exists inside `supabase/migrations/`; the only `_shared/` directory in the project is `supabase/functions/_shared/` (`cors.ts`, `openai.ts`), which holds Edge Function helpers, not SQL migration helpers (see §7).

All files were read in full or in relevant part. No files were modified.

---

## 1. Summary of key findings

1. **Genuine ordering bug**: three early-May files (`20260502132744`, `20260502143255`, `20260503065101`) modify/`REVOKE` on `public.app_site_stats`, `register_app_visit()`, and `refresh_app_site_stats()` — but the table and functions are not created until `20260514190333_create_app_site_stats_and_functions.sql`, twelve days later. Replaying migrations in filename order on a fresh database would make the three May files fail (`ERROR: relation "app_site_stats" does not exist` / `function does not exist`).
2. **Two timestamp collisions** (`20260628120000_*` ×2, `20260813180000_*` ×2) — harmless in practice because the colliding files touch unrelated tables, but they are a filename hygiene problem and a latent risk if Supabase's lexical tie-breaking ever needs to be deterministic for dependent files.
3. **APPLY_/SEED_/FIX_ prefixed files duplicate migration history.** Every `APPLY_OFFICIAL_SOURCE_MONITOR*` file is functionally byte-identical (only comment-line differences) to its timestamped twin — these are "paste into SQL editor" copies kept for manual hotfix application, not meant to be run again through the CLI/migration runner once the timestamped version has been applied. Running both is not harmful (all are idempotent) but is redundant and risks confusion about which file is canonical.
4. **Two APPLY_ files contain real drift** from their timestamped counterparts: `APPLY_AD_CAMPAIGNS_OWNER_RLS.sql` and `APPLY_DEACTIVATE_STALE_REJECTED_ADS.sql` (see §3 table) — both still safe to run, but they are not simple mirrors.
5. **`APPLY_OWNER_PROFILE_MODERATION_SCHEMA_ONLY.sql`** is `APPLY_OWNER_PROFILE_MODERATION.sql` **minus** a destructive one-shot `UPDATE` that hides QA-named public profiles — i.e. it is a deliberately defanged variant, not a duplicate error.
6. **A real data-loss incident is encoded in the migration history**: `20260519120000_delete_demo_ad_campaigns.sql` deleted rows that `20260522150000_seed_partner_ad_campaigns.sql` and `20260523140000_partner_ads_real_media.sql` then tried to `UPDATE` by hardcoded id (silently affecting 0 rows), until `20260528150000_restore_partner_ad_campaigns.sql` re-`INSERT`ed the same hardcoded UUIDs to recover. This chain works today only because the restore file exists later in the sequence; it is fragile.
7. **`SEED_CA_MANUFACTURERS_REAL.sql` inserts directly into `auth.users`** (30 occurrences) — bypasses Supabase Auth's normal user-creation flow, a known-risky pattern (no email flow, could break on Supabase auth schema changes, and is unusual for a "migration").
8. **Two developer/production secrets are hardcoded** in migration SQL: the owner login email `ivan.sovban@gmail.com` (multiple files) and a live row UUID / project ref comments (`APPLY_SCB_ACCOUNT_LINKS.sql`, `APPLY_DEACTIVATE_STALE_REJECTED_ADS.sql`). Not a migration-correctness bug, but worth flagging for a security/ops review.
9. **All `CREATE TABLE` statements use `IF NOT EXISTS`** (39/39 files that create tables) — no unguarded creates found.
10. **All `ADD COLUMN` statements are guarded** — either via `ADD COLUMN IF NOT EXISTS` (majority, newer files) or via `DO $$ IF NOT EXISTS (SELECT ... information_schema.columns) ... END $$` blocks (older files, pre-August). No unguarded `ADD COLUMN` that would fail on re-run was found.
11. **Only one destructive `DROP COLUMN`** exists (`20260324175649_remove_subscription_fields.sql`), and it is itself guarded by an `information_schema` existence check — safe to re-run, but it does permanently delete the `subscription_tier` / `subscription_expires_at` columns and their data the first time it runs.
12. **The `official_source_monitor` phase1–7 sequence (2026-08-13/14) is internally consistent and non-overlapping** in intent (each phase adds a distinct set of country codes), and every `INSERT` uses `ON CONFLICT DO UPDATE` / `DO NOTHING`, so even though some country codes (DE, FR, PL, IT, AT, BE, IE, PT) recur across phases, the recurrence is deliberate (adding `legal_documents`/`official_sources` rows for a country already seeded into `country_sources`), not a duplicate error.
13. **No `TRUNCATE` or `DROP TABLE` statements exist anywhere** in the migration set.

---

## 2. Migrations grouped by feature area

| # | Feature area | Files (chronological) | Aggregate risk |
|---|---|---|---|
| A | **Core marketplace schema** (categories, profiles, listings, images, portfolio, reviews, messages) | `20260323181005_create_buildster_schema.sql`, `20260324052021_add_professional_features_and_messaging.sql`, `20260324082347_add_profile_photo_and_website.sql`, `20260324175649_remove_subscription_fields.sql`, `20260327172059_fix_rls_security_policies.sql`, `20260329182328_add_visibility_radius_to_listings.sql` | Low — one intentional `DROP COLUMN` (guarded) |
| B | **App stats / security-definer hardening** | `20260502132744_revoke_public_execute_on_security_definer_functions.sql`, `20260502143255_switch_register_app_visit_to_security_invoker.sql`, `20260503065101_revoke_execute_on_refresh_app_site_stats.sql`, `20260514190333_create_app_site_stats_and_functions.sql`, `20260529180000_fix_country_ranking_stats.sql` | **High — forward-reference/ordering bug** (see §4.1) |
| C | **Ad campaigns / advertising** | `20260514190419_create_ad_campaigns_feedback_and_profiles_extras.sql`, `20260519130000_dimarket_complete_backend.sql`, `20260519120000_delete_demo_ad_campaigns.sql`, `20260519140000_paid_ad_campaigns_display.sql`, `20260522150000_seed_partner_ad_campaigns.sql`, `20260523140000_partner_ads_real_media.sql`, `20260524180000_partner_ads_images_only.sql`, `20260525120000_brand_advertiser_profiles.sql`, `20260526120000_brand_banner_images.sql`, `20260526200000_brand_banners_rockwool_ceresit_sika.sql`, `20260527120000_philips_bottom_banner.sql`, `20260528150000_restore_partner_ad_campaigns.sql`, `20260529140000_production_self_serve_ads.sql`, `20260531120000_ad_campaign_media_style.sql`, `20260630140000_ad_campaign_slot_media.sql`, `20260712100000_fix_owner_ad_perpetual_schedule.sql`, `20260712120000_seed_launch_market_placeholder_ads.sql`, `20260813180000_ad_campaigns_owner_rls_align.sql` / `APPLY_AD_CAMPAIGNS_OWNER_RLS.sql`, `20260814010000_deactivate_stale_rejected_ads.sql` / `APPLY_DEACTIVATE_STALE_REJECTED_ADS.sql` | **Medium — data-loss/no-op incident chain** (see §4.6) |
| D | **Categories catalog & renames** | `20260523120000_add_cleaning_category.sql`, `20260528120000_categories_vacancies_sell_rent.sql`, `20260528130000_rename_materials_to_furniture.sql`, `20260624120000_rename_categories_auto_transport.sql`, `20260625120000_category_subcategories.sql`, `20260627120000_rename_transport_logistics.sql`, `20260627130000_cleaning_subcategories_label.sql`, `20260627140000_sell_rent_equipment_rental.sql`, `20260628120000_categories_legal_accounting.sql`, `20260725140000_marketplace_categories.sql`, `20260725190000_category_completed_projects.sql` | Low — churny but idempotent (see §4.5 for cosmetic rename overlap) |
| E | **Payments / self-serve ads infra** | `20260527180500_payments_unique_session_id.sql`, `20260529120000_ensure_geo_catalog_for_ads.sql`, `20260530120000_register_geo_location_rpc.sql` | Low |
| F | **Telegram bot integration** | `20260528180000_telegram_listings_bot.sql`, `20260528200000_telegram_listing_authors.sql`, `20260713120000_phase4_digest_telegram.sql` | Low |
| G | **AI bots / AI platform** | `20260601120000_ai_bot_sessions.sql`, `20260602120000_ai_platform.sql`, `20260629120000_marketing_agent.sql`, `20260630120000_marketing_agent_automation.sql`, `20260701120000_admin_ai_assistant.sql`, `20260702120000_admin_local_rating_rpc.sql`, `20260702130000_fix_rating_stars_scale.sql`, `20260806120000_ai_project_pipeline.sql`, `20260806160000_ai_ops_construction.sql` | Low |
| H | **Auth/profile triggers & backfill** | `20260524120000_auth_user_profile_trigger.sql`, `20260524140000_profile_backfill_and_public_stats.sql`, `20260804150000_backfill_directory_electrician_avatars.sql` | Low |
| I | **Lead marketplace / project wizard** | `20260628120000_phase1_marketplace.sql`, `20260713100000_phase3_referrals_and_job_notify.sql`, `20260719120000_lead_marketplace_mvp.sql`, `20260720120000_create_project_wizard_ensure.sql`, `20260720140000_project_feed_geo_realtime.sql`, `20260720150000_ai_match_profile_fields.sql`, `20260804180000_profile_service_radius_km.sql` | Low — redundant but harmless (see §4.5b) |
| J | **Quotes, verification, portfolio, reviews, chat, booking, notifications ("upgrade" wave)** | `20260722100000_quote_equipment_pdf.sql`, `20260722120000_verification_platinum.sql`, `20260722140000_portfolio_upgrade.sql`, `20260722150000_review_system_upgrade.sql`, `20260722160000_chat_media_push_upgrade.sql`, `20260722170000_booking_calendar.sql`, `20260722180000_notification_center_upgrade.sql` | Low |
| K | **Admin panel / monetization / analytics** | `20260723120000_admin_panel.sql`, `20260723130000_monetization_system.sql`, `20260725120000_analytics_system.sql`, `20260725180000_homepage_metrics.sql` | Low — `is_site_owner()` redefined 4× identically (harmless) |
| L | **Cost estimator / AI ops for construction** | `20260805140000_cost_estimates.sql`, `20260806140000_cost_estimates_archive.sql` | Low |
| M | **Project milestones / escrow / Stripe Connect** | `20260807180000_project_milestones_hired_write.sql`, `20260807190000_pro_performance_learning_rls.sql`, `20260807200000_project_escrows.sql`, `20260807201000_payments_project_escrow_type.sql`, `20260810120000_stripe_connect_escrow_payout.sql` | Low |
| N | **Commercial Agents (manufacturers/agents marketplace)** | `20260810180000_commercial_agents.sql` / `APPLY_COMMERCIAL_AGENTS_PROD.sql`, `20260811120000_commercial_agents_grants.sql`, `20260812120000_scb_account_links.sql` / `APPLY_SCB_ACCOUNT_LINKS.sql`, `20260813190000_mfr_agent_roles_products_ads.sql` / `APPLY_MFR_AGENT_ROLES_PRODUCTS_ADS.sql`, `20260814120000_ca_owner_moderation.sql` / `APPLY_CA_OWNER_MODERATION.sql`, `SEED_COMMERCIAL_AGENTS_DEMO.sql`, `SEED_CA_MANUFACTURERS_REAL.sql` | **Medium — direct `auth.users` inserts, duplicated grants block** (see §4.7, §3) |
| O | **Official Source Monitor (legal/regulatory tracker)** | `20260813120000_official_source_monitor.sql` / `APPLY_OFFICIAL_SOURCE_MONITOR.sql` through `20260813240000_official_source_monitor_phase7.sql` / `APPLY_OFFICIAL_SOURCE_MONITOR_PHASE7.sql`, `20260813260000_documents_procedures_catalog.sql` / `APPLY_DOCUMENTS_PROCEDURES_CATALOG.sql` | Low — see §5 (dedicated phase analysis) |
| P | **Owner/profile moderation & QA cleanup** | `20260813210000_owner_profile_moderation.sql` / `APPLY_OWNER_PROFILE_MODERATION.sql` / `APPLY_OWNER_PROFILE_MODERATION_SCHEMA_ONLY.sql`, `APPLY_HIDE_QA_PUBLIC_PROFILES.sql`, `20260814010000_deactivate_stale_rejected_ads.sql` | Medium — contains a destructive `UPDATE` block that soft-hides matching profiles (see §6) |
| Q | **Calculator catalog** | `20260820120000_calculator_catalog.sql` | Low |
| R | **Cross-cutting data fix** | `FIX_UKRAINIAN_LANG_CODE_UA.sql` | Low — all statements idempotent/guarded |

---

## 3. Duplicate / mirrored pairs — detail and recommendation

| Pair | Diff result | Recommendation |
|---|---|---|
| `APPLY_OFFICIAL_SOURCE_MONITOR.sql` ↔ `20260813120000_official_source_monitor.sql` | **Byte-identical** | Keep the timestamped file as canonical (it is what the Supabase CLI/migration table tracks). Treat `APPLY_*` as a manual-apply archive copy; do not re-run through the migration runner if the timestamped one already ran — it is harmless either way (idempotent) but redundant. |
| `APPLY_OFFICIAL_SOURCE_MONITOR_PHASE2.sql` ↔ `20260813140000_official_source_monitor_phase2.sql` | Identical | Same as above. |
| `APPLY_OFFICIAL_SOURCE_MONITOR_PHASE3.sql` ↔ `20260813160000_official_source_monitor_phase3.sql` | Identical | Same as above. |
| `APPLY_OFFICIAL_SOURCE_MONITOR_PHASE4.sql` ↔ `20260813180000_official_source_monitor_phase4.sql` | Only header comment differs (line 1–2): APPLY says "Phase 4: NL/CZ/HU/BG, email alert tracking, auto-draft **on hash change**", timestamped says "**auto-draft metadata on versions**" | Cosmetic only. Same recommendation. |
| `APPLY_OFFICIAL_SOURCE_MONITOR_PHASE5.sql` ↔ `20260813200000_official_source_monitor_phase5.sql` | Only a "Paste in Supabase SQL editor after Phase 4" comment line removed in the timestamped copy | Cosmetic only. Same recommendation. |
| `APPLY_OFFICIAL_SOURCE_MONITOR_PHASE6.sql` ↔ `20260813220000_official_source_monitor_phase6.sql` | Only the "Paste in Supabase SQL editor…" comment line differs | Cosmetic only. Same recommendation. |
| `APPLY_OFFICIAL_SOURCE_MONITOR_PHASE7.sql` ↔ `20260813240000_official_source_monitor_phase7.sql` | Only the "Paste in Supabase SQL editor…" comment line differs | Cosmetic only. Same recommendation. |
| `APPLY_DOCUMENTS_PROCEDURES_CATALOG.sql` ↔ `20260813260000_documents_procedures_catalog.sql` | Byte-identical | Same recommendation. |
| `APPLY_MFR_AGENT_ROLES_PRODUCTS_ADS.sql` ↔ `20260813190000_mfr_agent_roles_products_ads.sql` | Byte-identical | Same recommendation. |
| `APPLY_CA_OWNER_MODERATION.sql` ↔ `20260814120000_ca_owner_moderation.sql` | Byte-identical | Same recommendation. |
| `APPLY_AD_CAMPAIGNS_OWNER_RLS.sql` ↔ `20260813180000_ad_campaigns_owner_rls_align.sql` | **Real drift**: APPLY version's owner-sync `UPDATE` (line 24) sets `user_role = COALESCE(NULLIF(p.user_role, ''), 'owner')` and also stamps `updated_at = now()`; the timestamped version unconditionally sets `user_role = 'owner'` and does not touch `updated_at`. Both are safe/idempotent, but APPLY's version is strictly better (preserves a pre-existing non-owner role like `'company'` on the owner's account rather than overwriting it, and stamps `updated_at`). | **Recommend treating `APPLY_AD_CAMPAIGNS_OWNER_RLS.sql`'s logic as canonical going forward** — if this needs to be re-applied, port the `COALESCE`/`updated_at` refinement into a new timestamped migration rather than re-running the old one, since the CLI will consider `20260813180000_ad_campaigns_owner_rls_align.sql` already applied. |
| `APPLY_DEACTIVATE_STALE_REJECTED_ADS.sql` ↔ `20260814010000_deactivate_stale_rejected_ads.sql` | **Real (intentional) drift**: the timestamped file's own header says "Mirror of APPLY_DEACTIVATE_STALE_REJECTED_ADS.sql for migration history" but is missing the APPLY file's second `UPDATE` block that also runs `UPDATE public.profiles SET is_site_owner = true, user_role = COALESCE(...)` for the owner email. Functionally the timestamped file only fixes the stale `ad_campaigns` rows; it does not re-sync the owner profile flag (which by this point is already handled by `20260813180000_ad_campaigns_owner_rls_align.sql`). | No action needed — the omission in the timestamped file is intentional and non-duplicative given the owner-flag sync already happened in the ad_campaigns_owner_rls migration. Both are safe to run any number of times (`WHERE status = 'active' AND (...)` guards prevent re-matching already-fixed rows). |
| `APPLY_SCB_ACCOUNT_LINKS.sql` ↔ `20260812120000_scb_account_links.sql` | Only header/footer comments differ (deployment notes, project ref `wjlfvajloxkevggwjgtk`, and a reference to `dnqudrucyypmfuskyfjw.supabase.co` — a **second Supabase project**) — SQL body identical | Same recommendation as the identical pairs. Flag the cross-project secret hint in `APPLY_SCB_ACCOUNT_LINKS.sql` lines 30–35 for an ops/secrets review (references `SCB_SUPABASE_SERVICE_ROLE_KEY` deployment step, not a literal secret value, but still project-identifying). |
| `APPLY_OWNER_PROFILE_MODERATION.sql` ↔ `20260813210000_owner_profile_moderation.sql` | Byte-identical | Same recommendation. |
| `APPLY_OWNER_PROFILE_MODERATION.sql` ↔ `APPLY_OWNER_PROFILE_MODERATION_SCHEMA_ONLY.sql` | `SCHEMA_ONLY` is missing lines 372–386 of the full file: a one-shot destructive `UPDATE public.profiles SET hidden_at = ..., hidden_by = ... WHERE full_name ILIKE 'QA %' OR ...` | These are **not duplicates but deliberate variants** — `SCHEMA_ONLY` exists so the schema/RPC changes can be deployed without also running the QA-hiding data mutation. **If both are ever run back-to-back, the effect is identical to running the full file once** (the extra block in the full file is additive and idempotent via `hidden_at = COALESCE(hidden_at, now())`). No error risk, but keep `SCHEMA_ONLY` used only when the data mutation is explicitly not wanted. |
| `APPLY_COMMERCIAL_AGENTS_PROD.sql` ↔ `20260810180000_commercial_agents.sql` + `20260811120000_commercial_agents_grants.sql` | APPLY_COMMERCIAL_AGENTS_PROD.sql (541 lines) = `20260810180000_commercial_agents.sql` (504 lines, schema/RLS) **plus** a 31-line GRANT block that is byte-identical to the entirety of `20260811120000_commercial_agents_grants.sql` | **This is the clearest true duplicate in the set.** The APPLY file is a concatenation of two already-separately-migrated files. Applying both is not an error (all GRANTs are additive/idempotent, `NOTIFY pgrst, 'reload schema'` is side-effect-free to repeat), but it means `APPLY_COMMERCIAL_AGENTS_PROD.sql` should be treated purely as a historical "what I pasted into the SQL editor that day" artifact, not as a migration to re-run — the canonical, tracked versions are the two timestamped files. |
| `SEED_COMMERCIAL_AGENTS_DEMO.sql` ↔ `SEED_CA_MANUFACTURERS_REAL.sql` | **Not duplicates** — different data sets (one owner-linked demo manufacturer/agent/opportunity via `DO $$` block using the existing site-owner profile; the other creates ~10 real European manufacturer brands with **freshly `INSERT`ed `auth.users` rows** and fixed UUIDs) | Both are idempotent (`ON CONFLICT`/existence checks) and safe to re-run, but `SEED_CA_MANUFACTURERS_REAL.sql`'s direct `auth.users` inserts are a distinct risk category — see §4.7. Neither has a timestamped migration counterpart, meaning neither is tracked by the Supabase migration history table; both must be applied manually and are easy to forget when spinning up a fresh environment. |

---

## 4. Ordering / forward-reference / logic issues

### 4.1 Confirmed ordering bug — `app_site_stats` referenced before creation (HIGH)

- `20260502132744_revoke_public_execute_on_security_definer_functions.sql` line 20: `REVOKE EXECUTE ON FUNCTION public.refresh_app_site_stats() FROM PUBLIC;` — function does not exist yet.
- `20260502143255_switch_register_app_visit_to_security_invoker.sql` lines 18–37: `CREATE OR REPLACE FUNCTION public.register_app_visit() ... UPDATE public.app_site_stats SET total_visits = total_visits + 1 WHERE id = 1; ...` and `CREATE POLICY "Anon and authenticated can increment visit counter" ON public.app_site_stats ...` — table `app_site_stats` does not exist yet (`CREATE POLICY ON` a non-existent table errors immediately).
- `20260503065101_revoke_execute_on_refresh_app_site_stats.sql` line 15: `REVOKE EXECUTE ON FUNCTION public.refresh_app_site_stats() FROM anon, authenticated;` — same problem.
- The table and both functions are only actually created at `20260514190333_create_app_site_stats_and_functions.sql` lines 24–127.
- **Impact**: on a brand-new database applying migrations strictly in filename order, the three May files will throw `ERROR: relation "app_site_stats" does not exist` (42P01) or `ERROR: function public.refresh_app_site_stats() does not exist` (42883), halting the migration run.
- **Likely cause**: these three files were almost certainly first run directly against the already-live production database (where the table already existed from an earlier, unrecorded manual change) and only added to the migrations folder afterward without correcting their timestamps.
- **Recommendation**: rename/renumber these three files to timestamps after `20260514190333`, or (safer, since renumbering already-applied migrations breaks the Supabase migration-history table if they were already applied in prod) leave history as-is for the live database but add a one-time guard note in the repo README that a fresh/staging environment must apply `20260514190333_create_app_site_stats_and_functions.sql` before the three May files, or skip the three and let `20260514190333` (which recreates the same functions/RLS) supersede them. Do not attempt to fix by editing the files themselves per task instructions.

### 4.2 Timestamp collisions (filenames share the identical 14-digit prefix)

- `20260628120000_categories_legal_accounting.sql` and `20260628120000_phase1_marketplace.sql` — both stamped `20260628120000`. Checked: no cross-references between them (one only inserts two `categories` rows, the other creates unrelated AI job/reviews/messages tables). **No functional risk**, but Supabase's migration tooling sorts ties alphabetically by filename, so `categories_legal_accounting` would apply before `phase1_marketplace` — currently harmless since there's no dependency either direction.
- `20260813180000_ad_campaigns_owner_rls_align.sql` and `20260813180000_official_source_monitor_phase4.sql` — both stamped `20260813180000`. Checked: no overlap (one only touches `public.ad_campaigns` RLS/`is_site_owner()`, the other only touches `official_source_monitor` country/source tables). **No functional risk** today, but any future migration that depends on both being applied in a specific order would be fragile.
- **Recommendation**: going forward, ensure unique-to-the-second (or finer) timestamps when generating migration filenames to avoid relying on alphabetical tie-breaking.

### 4.3 `pg_constraint` dynamic-drop pattern (safe, but worth naming as a fragile idiom)

Several files drop a table's CHECK constraint by dynamically discovering its name via `pg_constraint`/`pg_class` instead of naming it directly, then re-add a named constraint:
- `20260519130000_dimarket_complete_backend.sql` (ad/profile constraints)
- `20260529120000_ensure_geo_catalog_for_ads.sql` (unique constraint existence check)
- `20260529140000_production_self_serve_ads.sql` (status/geo_scope constraints, lines with `LIKE '%status%'` / `LIKE '%geo_scope%'`)
- `20260722160000_chat_media_push_upgrade.sql`, `20260722180000_notification_center_upgrade.sql` (attachment/notification type constraints)
- `20260722120000_verification_platinum.sql` (verification_level constraint, uses direct `DROP CONSTRAINT IF EXISTS profiles_verification_level_check` — named, not dynamic)
- `20260813190000_mfr_agent_roles_products_ads.sql` lines 7–22 (drops any constraint on `profiles` whose definition `ILIKE '%user_role%'`)

This pattern is idempotent and safe as written, but the `LIKE '%status%'`/`ILIKE '%user_role%'` matching is broad — if a future migration adds an unrelated constraint whose name or definition happens to contain the same substring on the same table, it could be dropped unintentionally. Not an active bug, but worth flagging as a maintainability risk.

### 4.4 Verified dependency ordering (all correct)

Checked and confirmed **no forward references** in the following dependency chains:
- `ad_campaigns` table created at `20260514190419_create_ad_campaigns_feedback_and_profiles_extras.sql` (line 28) before any `ALTER TABLE ad_campaigns` in `20260519130000_dimarket_complete_backend.sql` (line 82+).
- `manufacturer_profiles`/`agent_profiles` created at `20260810180000_commercial_agents.sql` before being referenced/extended by `20260813190000_mfr_agent_roles_products_ads.sql` (line 107, 165–167) and `20260814120000_ca_owner_moderation.sql` (lines 5–14).
- `project_milestones` created at `20260806120000_ai_project_pipeline.sql` before its RLS is widened in `20260807180000_project_milestones_hired_write.sql`.
- `pro_performance_profiles` created at `20260806160000_ai_ops_construction.sql` before its RLS is widened in `20260807190000_pro_performance_learning_rls.sql`.
- `project_escrows` created at `20260807200000_project_escrows.sql` before `payments_payment_type_check` is widened to accept `'project_escrow'` in `20260807201000_payments_project_escrow_type.sql`.
- `legal_documents` ↔ `document_versions` circular FK in `20260813120000_official_source_monitor.sql` (lines 133–196) is correctly sequenced: `legal_documents.current_version_id` column exists nullable first, `document_versions` table is created next, then the FK constraint is added via `DROP CONSTRAINT IF EXISTS` + `ADD CONSTRAINT` — a standard, safe pattern for circular references.
- `cost_estimates` (Aug 5) before `cost_estimates_archive`'s `ADD COLUMN archived` (Aug 6).
- `deleted_at`/`hidden_at` columns are added on `public.profiles` within `20260813210000_owner_profile_moderation.sql` itself (lines 6–9) before being read later in the same file — self-consistent, not a cross-file forward reference.

### 4.5 Redundant (non-error) duplication of logic

- **(a) Category rename churn**: the `tools` category slug is renamed twice with different target names — `20260624120000_rename_categories_auto_transport.sql` (line 10) sets `name = 'Перевезення і доставка'`, then just 3 days later `20260627120000_rename_transport_logistics.sql` (line 5) overwrites it to `name = 'Перевезення / логістика'`. Not an error (both are plain `UPDATE ... WHERE slug = 'tools'`), but it shows the categories table was edited iteratively without consolidating into one migration — cosmetic churn only.
- **(b) `20260719120000_lead_marketplace_mvp.sql`** (lines 6–36) and **`20260720120000_create_project_wizard_ensure.sql`** (lines 4–36) add the **exact same nine `listings` columns** (`budget_min`, `budget_max`, `deadline_type`, `deadline_at`, `urgency`, `preferred_language`, `wizard_completed`, `postal_code`, `country_name`, `city_name`) with identical `information_schema`-guarded `DO` blocks. The second file is a no-op for those columns (guards prevent errors) — its only new contribution is the `project_files` table (lines 38+). This is safe but redundant; the "ensure" file's name suggests it was written defensively without checking that the prior day's migration already covered it.
- **(c) `is_site_owner()`** is defined via `CREATE OR REPLACE FUNCTION` identically in four files (`20260723130000_monetization_system.sql`, `20260725120000_analytics_system.sql`, `20260813180000_ad_campaigns_owner_rls_align.sql`, `20260814120000_ca_owner_moderation.sql`) — harmless repetition (`CREATE OR REPLACE` always succeeds), but four separate "sources of truth" for the same function body increases the chance of an accidental drift in a future edit.

### 4.6 Data-loss / no-op incident chain in ad_campaigns (MEDIUM — historical, already recovered)

1. `20260519120000_delete_demo_ad_campaigns.sql` (lines 2–26): unconditionally `DELETE FROM ad_campaigns WHERE stripe_payment_id LIKE 'presence_free_%' OR ... OR id IN ('f81e653d-...', '89623059-...', ...)` — removes rows by hardcoded UUID and by pattern match on `review_note`/`stripe_payment_id`.
2. `20260522150000_seed_partner_ad_campaigns.sql` (lines 15+) and `20260523140000_partner_ads_real_media.sql` (lines 6+) then run `UPDATE ad_campaigns SET ... WHERE id = 'f81e653d-ca9e-4081-a4ca-2a17395e9924'` — but that row was deleted by step 1, so these `UPDATE`s silently affect 0 rows (no SQL error, but the intended effect — updating Knauf's banner — never happens).
3. `20260524180000_partner_ads_images_only.sql` and `20260526120000_brand_banner_images.sql` repeat the same `UPDATE ... WHERE id = 'f81e653d...'` pattern, also silently no-op.
4. `20260528150000_restore_partner_ad_campaigns.sql` (line 13) finally re-`INSERT`s the row with the same hardcoded id `'f81e653d-ca9e-4081-a4ca-2a17395e9924'` via `ON CONFLICT (id) DO UPDATE`, restoring it — the file's own header comment (line 2) explicitly says this is "Restoration of partner ads after 20260519120000_delete_demo_ad_campaigns.sql (on prod the ad_campaigns table was empty — public SELECT returned [])."
- **Current state**: safe, because the restore file runs last in the sequence and uses `ON CONFLICT DO UPDATE`, so replaying the whole migration history end-to-end reaches the correct final state. **Risk**: if any *new* migration is ever inserted between `20260519120000` and `20260528150000` that also assumes these rows exist, it would silently no-op the same way. This chain is a strong argument for not deleting seed/demo rows by broad pattern match in future migrations — prefer soft-delete flags.

### 4.7 Direct `auth.users` manipulation (MEDIUM)

`SEED_CA_MANUFACTURERS_REAL.sql` inserts directly into `auth.users` 30 times (e.g. lines 9–27 for the Knauf manufacturer profile), generating a random encrypted password via `crypt(encode(gen_random_bytes(16), 'hex'), gen_salt('bf'))` and a synthetic `directory+mfr-knauf@users.dimarket.app` email. This bypasses Supabase Auth's managed user-creation API entirely. It is guarded by `IF NOT EXISTS (SELECT 1 FROM auth.users WHERE id = v_user)` so it won't error on re-run, but:
- These accounts have no real password (users can never log in with them normally), no email confirmation flow, and no `auth.identities` row, which some Supabase Auth versions expect — a future Supabase upgrade that tightens `auth.users` schema constraints could break this file.
- This file has no timestamped migration counterpart, so it will not run automatically as part of `supabase db push`/`migration up` — it must be manually pasted, and a fresh environment could easily miss it.

---

## 5. `official_source_monitor` phase 1–7 sequence (2026-08-13/14) — consistency check

| Phase | File | Adds |
|---|---|---|
| 1 | `20260813120000_official_source_monitor.sql` | Core tables: `country_sources`, `official_sources`, `source_checks`, `source_changes`, `legal_documents`, `document_versions`, `document_audit_log`; RLS; `is_dimarket_owner()`. Seeds `country_sources` for `ES` (Spain). |
| 2 | `20260813140000_official_source_monitor_phase2.sql` | `ALTER TABLE source_changes ADD COLUMN alert_sent_at`; index; seeds `DE`, `FR`, `PL` country sources. |
| 3 | `20260813160000_official_source_monitor_phase3.sql` | Seeds `IT`, `PT`, `RO` country sources + official sources + draft document templates. |
| 4 | `20260813180000_official_source_monitor_phase4.sql` | Seeds `NL`, `CZ`, `HU`, `BG`; `ALTER TABLE source_changes` (email alert tracking additions). |
| 5 | `20260813200000_official_source_monitor_phase5.sql` | Publishes EU legislation pointers for `DE`/`FR`/`PL` (referencing sources seeded in phase 2); seeds `AT`, `SK`, `IE`, `SE`, `DK`, `FI`, `GR`, `BE`, `LU`. |
| 6 | `20260813220000_official_source_monitor_phase6.sql` | `ALTER TABLE source_changes` again; new table `osm_weekly_digest_runs`; seeds `EE`, `HR`, `LT`, `LV`, `SI`; adds rental-agreement document templates for `DE`, `IT`, `NL`, `PL`, `FR` (countries already seeded in earlier phases — expected re-touch, not a duplicate seed). |
| 7 | `20260813240000_official_source_monitor_phase7.sql` | Seeds `CY`, `MT`, `CH`, `NO`; adds rental templates/hub pointers for `AT`, `PT`, `IE`, `BE`, `FR`, `ES` (again, re-touching earlier-seeded countries to add *new* document rows, not re-inserting the same country row). |

**Verdict**: the sequence is **consistent and non-overlapping** in the sense that matters — no phase re-inserts a country's `country_sources` row expecting a first-time `INSERT`; every `INSERT` on `country_sources` uses `ON CONFLICT (country_code) DO UPDATE`, every `INSERT` on `official_sources` uses `ON CONFLICT (source_key) DO UPDATE`, and every `INSERT` on `legal_documents` uses `ON CONFLICT (doc_key) DO UPDATE`, with `document_versions` using `ON CONFLICT (document_id, version_number) DO NOTHING`. Re-touches of DE/FR/PL/IT/AT/BE/IE/PT across phases 5–7 are additive (new document rows referencing already-seeded sources), confirmed by reading the actual `INSERT` targets, not just grepping for country-code strings. All seven phases plus `20260813260000_documents_procedures_catalog.sql` can be replayed in order on a fresh database or replayed again on an already-migrated database with identical end state.

The only wrinkle already covered above (§4.2): `20260813180000_official_source_monitor_phase4.sql` shares its numeric timestamp with `20260813180000_ad_campaigns_owner_rls_align.sql`, but the two do not interact.

---

## 6. Dangerous statements (DROP / DELETE / TRUNCATE / data-mutating)

| File | Line(s) | Statement | Danger level | Notes |
|---|---|---|---|---|
| `20260324175649_remove_subscription_fields.sql` | 19, 26 | `ALTER TABLE profiles DROP COLUMN subscription_tier;` / `DROP COLUMN subscription_expires_at;` | **Destructive (data loss)**, but guarded | Wrapped in `IF EXISTS (SELECT 1 FROM information_schema.columns ...)`, so safe to re-run; still permanently deletes the two columns' data on first run. No downstream migration re-adds these columns under the same names, so this is intentional deprecation, not an accidental drop. |
| `20260519120000_delete_demo_ad_campaigns.sql` | 2–22, 24–26 | `DELETE FROM ad_campaigns WHERE ...` and `DELETE FROM profiles WHERE bio ILIKE '%[demo_brand_advertiser]%' OR id::text LIKE 'e10000%';` | **Destructive (data loss)**, unguarded by any existence check (by design — it's a one-time cleanup) | Broad pattern matching (`LIKE`, `ILIKE`) combined with a `DELETE` is inherently risky if a real (non-demo) row ever matches the pattern. This specific run caused the no-op chain documented in §4.6. Re-running this file today is safe only because the matched rows either no longer exist or no longer match — but the broad `WHERE` clause remains a latent risk if similar `review_note`/`stripe_payment_id` values are ever reused for real campaigns. |
| `20260814010000_deactivate_stale_rejected_ads.sql` / `APPLY_DEACTIVATE_STALE_REJECTED_ADS.sql` | ad_campaigns block | `UPDATE public.ad_campaigns SET status = 'rejected', approved_by = NULL, approved_at = NULL ... WHERE status = 'active' AND (id = '...' OR review_note ILIKE '%rejected%' OR ...)` | Medium (state mutation, not deletion) | Guarded by `WHERE status = 'active'`, so re-running is a no-op once rows are already `'rejected'`. Broad `ILIKE` pattern matching again — same category of risk as above, but scoped to a status change rather than row deletion. |
| `20260813210000_owner_profile_moderation.sql` / `APPLY_OWNER_PROFILE_MODERATION.sql` | function body (`~line 280s`, `hide_profile`/similar RPC) | `UPDATE profiles SET hidden_at = now(), hidden_by = ... WHERE id = p_id` (soft-hide RPC, callable by owner only via `is_site_owner()` check) | Low-medium (soft delete, reversible) | This is an RPC definition, not a direct data mutation at migration time — it only executes when called by the app/owner. Reversible (there's a corresponding "unhide" path implied by the `hidden_at IS NOT NULL` filter logic). |
| `APPLY_OWNER_PROFILE_MODERATION.sql` / `20260813210000_owner_profile_moderation.sql` | lines 372–386 (both files, confirmed byte-identical) | `UPDATE public.profiles SET hidden_at = COALESCE(hidden_at, now()), hidden_by = COALESCE(hidden_by, auth.uid()), updated_at = now() WHERE deleted_at IS NULL AND (full_name ILIKE 'QA %' OR ...)` | **Destructive-ish (soft hide) one-shot data mutation, executes immediately on file run** | This block runs immediately as part of the migration (not inside a callable function) and is present in **both** `APPLY_OWNER_PROFILE_MODERATION.sql` and its timestamped twin `20260813210000_owner_profile_moderation.sql`, but deliberately **absent** from `APPLY_OWNER_PROFILE_MODERATION_SCHEMA_ONLY.sql` (verified: the `SCHEMA_ONLY` variant is missing exactly this UPDATE block per the §3 diff). Idempotent via `COALESCE`, and non-destructive in the sense that it only sets a soft-hide flag (no `DELETE`), but it does modify real profile rows matching a fuzzy name pattern (`QA %`, `side-ads-e2e-%`, etc.) without a preview step. |
| `APPLY_HIDE_QA_PUBLIC_PROFILES.sql` | lines 25–43 | `UPDATE public.profiles SET is_professional = false ...` / `UPDATE public.manufacturer_profiles SET is_published = false ...` / `UPDATE public.agent_profiles SET is_published = false ...` | Low — **inert as committed** | The entire destructive block is wrapped in a `/* ... */` SQL block comment (lines 25–43) with an explicit instruction "APPLY (uncomment after preview OK)". As currently written, running this file only executes the `SELECT` preview (lines 9–16) — it is a runbook, not a live migration. Flagged for awareness only: if anyone uncomments and runs it, it deactivates any profile/manufacturer/agent whose name matches QA-test patterns. |
| `20260814120000_ca_owner_moderation.sql` / `APPLY_CA_OWNER_MODERATION.sql` | lines 93, 112 | `DELETE FROM public.agent_profiles WHERE id = p_id;` / `DELETE FROM public.manufacturer_profiles WHERE id = p_id;` | Medium — inside an owner-only RPC | Same pattern as the hide-profile RPC above: only executes when explicitly called by an authenticated site owner (checked via `is_site_owner()`), not at migration-apply time. Legitimate admin "delete listing" functionality, not an accidental drop. |
| `FIX_UKRAINIAN_LANG_CODE_UA.sql` | throughout | Multiple `UPDATE public.profiles / manufacturer_profiles / agent_profiles / representation_opportunities SET languages = array_replace(...)` | Low | All guarded by `WHERE languages @> ARRAY[...]` / `&&` array-overlap conditions; purely a data-normalization fix, re-running is a safe no-op once converged. |

**No `TRUNCATE` and no `DROP TABLE` statements exist anywhere in the 119 files.**

---

## 7. `_shared/` folder check

No `_shared/` directory exists under `supabase/migrations/`. The only `_shared/` folder in the project is `supabase/functions/_shared/`, containing:
- `cors.ts` — CORS header helper for Edge Functions.
- `openai.ts` — OpenAI client helper for Edge Functions.

These are TypeScript helpers for Supabase **Edge Functions**, unrelated to SQL migrations, and were not otherwise referenced by any `.sql` file (migrations don't import TS). No SQL-level shared-helper convention (e.g. a shared `functions.sql` migration with common PL/pgSQL utilities) exists — each migration defines its own helper functions inline (e.g. `is_site_owner()`, `is_dimarket_owner()` are each redefined per-file rather than factored into one place), which explains the redundancy noted in §4.5(c).

---

## 8. Full migration file table

Legend for **Risk**: 🟢 Low (idempotent, no dependency issues) · 🟡 Medium (redundant, cosmetic drift, or soft/reversible mutation) · 🔴 High (real ordering bug or destructive statement)

| File | Feature | Risk |
|---|---|---|
| `20260323181005_create_buildster_schema.sql` | Core schema baseline (categories, profiles, listings, images, portfolio, reviews, messages) + RLS | 🟢 |
| `20260324052021_add_professional_features_and_messaging.sql` | Profile subscription/portfolio fields + messages table + RLS | 🟢 |
| `20260324082347_add_profile_photo_and_website.sql` | Profile photo/website columns | 🟢 |
| `20260324175649_remove_subscription_fields.sql` | Drops `subscription_tier`/`subscription_expires_at` | 🟡 destructive but guarded, intentional |
| `20260327172059_fix_rls_security_policies.sql` | Tightens guest listing/review/image RLS | 🟢 |
| `20260329182328_add_visibility_radius_to_listings.sql` | `visibility_radius` column + CHECK | 🟢 |
| `20260502132744_revoke_public_execute_on_security_definer_functions.sql` | REVOKE on `refresh_app_site_stats`/`register_app_visit` | 🔴 forward reference (table/functions created later, §4.1) |
| `20260502143255_switch_register_app_visit_to_security_invoker.sql` | Redefines `register_app_visit` as SECURITY INVOKER + RLS policy on `app_site_stats` | 🔴 forward reference (§4.1) |
| `20260503065101_revoke_execute_on_refresh_app_site_stats.sql` | REVOKE on `refresh_app_site_stats` from anon/authenticated | 🔴 forward reference (§4.1) |
| `20260514190333_create_app_site_stats_and_functions.sql` | Creates `app_site_stats` table + `register_app_visit`/`refresh_app_site_stats` (supersedes the three files above) | 🟢 |
| `20260514190419_create_ad_campaigns_feedback_and_profiles_extras.sql` | Creates `ad_campaigns`, `feedback_messages`, `profiles.is_site_owner` | 🟢 |
| `20260519120000_delete_demo_ad_campaigns.sql` | Bulk `DELETE` of demo ad campaigns/profiles | 🔴 destructive, unguarded pattern match (§4.6, §6) |
| `20260519130000_dimarket_complete_backend.sql` | Adds many `profiles`/`listings`/`ad_campaigns`/`payments`/`announcements`/`saved_items`/`geo_catalog` columns/tables | 🟢 |
| `20260519140000_paid_ad_campaigns_display.sql` | Public ad visibility policy tied to payment status | 🟢 |
| `20260522150000_seed_partner_ad_campaigns.sql` | Updates hardcoded-id ad campaigns with real brand content | 🟡 silently no-oped by prior DELETE (§4.6) |
| `20260523120000_add_cleaning_category.sql` | Adds `Cleaning` category | 🟢 |
| `20260523140000_partner_ads_real_media.sql` | Updates hardcoded-id ad campaigns with video/media | 🟡 silently no-oped by prior DELETE (§4.6) |
| `20260524120000_auth_user_profile_trigger.sql` | `handle_new_user()` trigger function | 🟢 |
| `20260524140000_profile_backfill_and_public_stats.sql` | Re-defines trigger + backfill + public stats RPC | 🟢 |
| `20260524180000_partner_ads_images_only.sql` | Updates hardcoded-id ad campaigns to images-only | 🟡 silently no-oped by prior DELETE (§4.6) |
| `20260525120000_brand_advertiser_profiles.sql` | Owner-delete RLS policy for ad campaigns | 🟢 |
| `20260526120000_brand_banner_images.sql` | Updates hardcoded-id ad campaign banners | 🟡 depends on rows restored later (§4.6) |
| `20260526200000_brand_banners_rockwool_ceresit_sika.sql` | Updates hardcoded-id ad campaigns (new brand ids `a1000001`-`a1000004`) | 🟢 (these ids not part of the delete/restore incident) |
| `20260527120000_philips_bottom_banner.sql` | `INSERT ... ON CONFLICT DO UPDATE` new Philips banner | 🟢 |
| `20260527180500_payments_unique_session_id.sql` | Unique index on `payments.stripe_session_id` | 🟢 |
| `20260528120000_categories_vacancies_sell_rent.sql` | Adds several categories | 🟢 |
| `20260528130000_rename_materials_to_furniture.sql` | Renames `materials` → `Furniture` | 🟢 |
| `20260528150000_restore_partner_ad_campaigns.sql` | Re-inserts deleted ad campaign rows | 🟡 recovery migration for §4.6 incident |
| `20260528180000_telegram_listings_bot.sql` | `telegram_bot_sessions` table | 🟢 |
| `20260528200000_telegram_listing_authors.sql` | `telegram_user_id`/`telegram_chat_id` on `profiles` | 🟢 |
| `20260529120000_ensure_geo_catalog_for_ads.sql` | `geo_catalog` table + `active_geo` view | 🟢 |
| `20260529140000_production_self_serve_ads.sql` | `ad_campaigns.regions`, status/geo_scope CHECK rewrite, storage bucket + policies | 🟢 |
| `20260529180000_fix_country_ranking_stats.sql` | Rewrites `refresh_app_site_stats`, adds `extract_location_country`, `build_country_ranking_json`, `get_public_footer_stats` | 🟢 |
| `20260530120000_register_geo_location_rpc.sql` | `register_geo_location()` RPC | 🟢 |
| `20260531120000_ad_campaign_media_style.sql` | `ad_campaigns.media_style` column | 🟢 |
| `20260601120000_ai_bot_sessions.sql` | `ai_bot_sessions`/`ai_bot_messages` tables + RLS | 🟢 |
| `20260602120000_ai_platform.sql` | `ai_conversations`, `ai_messages`, `ai_bot_tasks`, `ai_leads`, `ai_matches` and more | 🟢 |
| `20260624120000_rename_categories_auto_transport.sql` | Renames `electrical`/`tools` category display names | 🟡 later overwritten (§4.5a) |
| `20260625120000_category_subcategories.sql` | `subcategory_slugs`/`work_subcategory_slugs` columns | 🟢 |
| `20260627120000_rename_transport_logistics.sql` | Renames `tools` category again | 🟡 overwrites prior rename (§4.5a) |
| `20260627130000_cleaning_subcategories_label.sql` | Renames `cleaning` category label | 🟢 |
| `20260627140000_sell_rent_equipment_rental.sql` | Updates `sell-rent` category description | 🟢 |
| `20260628120000_categories_legal_accounting.sql` | Adds legal/accounting categories | 🟡 timestamp collision with phase1_marketplace (§4.2), no functional conflict |
| `20260628120000_phase1_marketplace.sql` | AI job sessions, chat delivery status, reviews 2.0, notifications, matching | 🟡 timestamp collision (§4.2), no functional conflict |
| `20260629120000_marketing_agent.sql` | Marketing agent config/campaigns/posts/analytics tables | 🟢 |
| `20260630120000_marketing_agent_automation.sql` | Enables marketing agent defaults + pg_cron | 🟢 |
| `20260630140000_ad_campaign_slot_media.sql` | `ad_campaigns.slot_media` column | 🟢 |
| `20260701120000_admin_ai_assistant.sql` | `ai_knowledge_base`, audit log tables | 🟢 |
| `20260702120000_admin_local_rating_rpc.sql` | Admin rating/verification RPCs | 🟢 |
| `20260702130000_fix_rating_stars_scale.sql` | Fixes rating scale bug in `admin_boost_master_rating` | 🟢 |
| `20260712100000_fix_owner_ad_perpetual_schedule.sql` | Fixes owner-managed ad `ends_at` bug | 🟢 |
| `20260712120000_seed_launch_market_placeholder_ads.sql` | Placeholder ads for DE/ES launch markets | 🟢 |
| `20260713100000_phase3_referrals_and_job_notify.sql` | `referral_codes` table, job-match notify RPC | 🟢 |
| `20260713120000_phase4_digest_telegram.sql` | Email digest prefs + Telegram link code columns | 🟢 |
| `20260719120000_lead_marketplace_mvp.sql` | Listings project fields, applications, quotes, verification tiers | 🟡 columns re-added redundantly in next file (§4.5b) |
| `20260720120000_create_project_wizard_ensure.sql` | Re-guards same listings columns + `project_files` table/storage | 🟡 redundant with prior file (§4.5b) |
| `20260720140000_project_feed_geo_realtime.sql` | `listings.latitude`/`longitude` | 🟢 |
| `20260720150000_ai_match_profile_fields.sql` | `profiles` matching fields (`completed_jobs`, `languages`, `availability_status`, geo) | 🟢 |
| `20260722100000_quote_equipment_pdf.sql` | `quotes.equipment` jsonb column | 🟢 |
| `20260722120000_verification_platinum.sql` | Platinum verification tier + email/phone verified columns | 🟢 |
| `20260722140000_portfolio_upgrade.sql` | Portfolio media type/before-after/likes columns | 🟢 |
| `20260722150000_review_system_upgrade.sql` | Review media/likes/verified-customer columns | 🟢 |
| `20260722160000_chat_media_push_upgrade.sql` | Expands chat attachment types, push hook | 🟢 |
| `20260722170000_booking_calendar.sql` | `booking_blocked_dates`, bookings, Google Calendar tokens | 🟢 |
| `20260722180000_notification_center_upgrade.sql` | Notification type expansion, prefs, `create_notification()` | 🟢 |
| `20260723120000_admin_panel.sql` | Owner RPCs + admin policies; `is_site_owner()` v1 | 🟢 |
| `20260723130000_monetization_system.sql` | Plans, Stripe subscriptions, lead credits, sponsored projects | 🟢 |
| `20260725120000_analytics_system.sql` | Profile views, response metrics RPCs | 🟢 |
| `20260725140000_marketplace_categories.sql` | Large (67 KB) marketplace category catalog rewrite | 🟢 (verified `ON CONFLICT`/idempotent pattern used throughout) |
| `20260725180000_homepage_metrics.sql` | `homepage_metrics` table | 🟢 |
| `20260725190000_category_completed_projects.sql` | `categories.completed_projects_count` + refresh RPC | 🟢 |
| `20260804150000_backfill_directory_electrician_avatars.sql` | One-shot avatar backfill RPC | 🟢 |
| `20260804180000_profile_service_radius_km.sql` | `profiles.service_radius_km` | 🟢 |
| `20260805140000_cost_estimates.sql` | `cost_estimates` table + learning hooks | 🟢 |
| `20260806120000_ai_project_pipeline.sql` | Application response statuses + `project_milestones` | 🟢 |
| `20260806140000_cost_estimates_archive.sql` | `cost_estimates.archived` column | 🟢 |
| `20260806160000_ai_ops_construction.sql` | `project_media`, `pro_performance_profiles`, and 2 more tables | 🟢 |
| `20260807180000_project_milestones_hired_write.sql` | Widens milestone write RLS to hired pro | 🟢 |
| `20260807190000_pro_performance_learning_rls.sql` | Widens `pro_performance_profiles` upsert RLS | 🟢 |
| `20260807200000_project_escrows.sql` | `project_escrows` table | 🟢 |
| `20260807201000_payments_project_escrow_type.sql` | Widens `payments.payment_type` CHECK | 🟢 |
| `20260810120000_stripe_connect_escrow_payout.sql` | Stripe Connect columns on `profiles` | 🟢 |
| `20260810180000_commercial_agents.sql` | Manufacturer/agent profiles, opportunities, applications, invitations, reports, analytics (canonical for Commercial Agents schema) | 🟢 |
| `20260811120000_commercial_agents_grants.sql` | GRANTs + `NOTIFY pgrst, 'reload schema'` for Commercial Agents tables | 🟡 duplicated inside `APPLY_COMMERCIAL_AGENTS_PROD.sql` (§3) |
| `20260812120000_scb_account_links.sql` | `scb_account_links` table (cross-app linking) | 🟢 |
| `20260813120000_official_source_monitor.sql` | OSM phase 1: core tables + ES seed | 🟢 |
| `20260813140000_official_source_monitor_phase2.sql` | OSM phase 2: DE/FR/PL seed + alert dedupe | 🟢 |
| `20260813160000_official_source_monitor_phase3.sql` | OSM phase 3: IT/PT/RO seed + draft templates | 🟢 |
| `20260813180000_ad_campaigns_owner_rls_align.sql` | Aligns `ad_campaigns` owner RLS with `is_site_owner()` | 🟡 timestamp collision (§4.2), drift vs APPLY twin (§3) |
| `20260813180000_official_source_monitor_phase4.sql` | OSM phase 4: NL/CZ/HU/BG seed + email alert tracking | 🟡 timestamp collision (§4.2) |
| `20260813190000_mfr_agent_roles_products_ads.sql` | Widens `profiles.user_role`, adds `manufacturer_products`, links `ad_campaigns` to manufacturer/agent | 🟢 |
| `20260813200000_official_source_monitor_phase5.sql` | OSM phase 5: publishes EU legislation pointers + 9-country seed | 🟢 |
| `20260813210000_owner_profile_moderation.sql` | `deleted_at`/`hidden_at` on profiles + moderation RPCs | 🟡 contains QA-hide data mutation identical to APPLY twin (§6) |
| `20260813220000_official_source_monitor_phase6.sql` | OSM phase 6: 5-country seed + `osm_weekly_digest_runs` table | 🟢 |
| `20260813240000_official_source_monitor_phase7.sql` | OSM phase 7: CY/MT/CH/NO seed + rental hub pointers | 🟢 |
| `20260813260000_documents_procedures_catalog.sql` | Documents/procedures catalog tables | 🟢 |
| `20260814010000_deactivate_stale_rejected_ads.sql` | Fixes stale `active` ads that should be `rejected` | 🟡 drift vs APPLY twin, broad `ILIKE` (§3, §6) |
| `20260814120000_ca_owner_moderation.sql` | Manufacturer/agent verification CHECK widen + owner delete RPCs | 🟢 |
| `20260820120000_calculator_catalog.sql` | Remodeling calculator catalog tables | 🟢 |
| `APPLY_AD_CAMPAIGNS_OWNER_RLS.sql` | Manual-apply mirror of `20260813180000_ad_campaigns_owner_rls_align.sql` | 🟡 real drift, hardcoded email (§3) |
| `APPLY_CA_OWNER_MODERATION.sql` | Manual-apply mirror of `20260814120000_ca_owner_moderation.sql` | 🟢 identical |
| `APPLY_COMMERCIAL_AGENTS_PROD.sql` | Manual-apply concatenation of `20260810180000_commercial_agents.sql` + `20260811120000_commercial_agents_grants.sql` | 🟡 true duplicate (§3) |
| `APPLY_DEACTIVATE_STALE_REJECTED_ADS.sql` | Manual-apply superset of `20260814010000_deactivate_stale_rejected_ads.sql` | 🟡 real drift, hardcoded email (§3, §6) |
| `APPLY_DOCUMENTS_PROCEDURES_CATALOG.sql` | Manual-apply mirror of `20260813260000_documents_procedures_catalog.sql` | 🟢 identical |
| `APPLY_HIDE_QA_PUBLIC_PROFILES.sql` | Standalone runbook (preview + commented-out destructive UPDATE) | 🟡 inert as committed, no timestamped counterpart (§6) |
| `APPLY_MFR_AGENT_ROLES_PRODUCTS_ADS.sql` | Manual-apply mirror of `20260813190000_mfr_agent_roles_products_ads.sql` | 🟢 identical |
| `APPLY_OFFICIAL_SOURCE_MONITOR.sql` | Manual-apply mirror of `20260813120000_official_source_monitor.sql` | 🟢 identical |
| `APPLY_OFFICIAL_SOURCE_MONITOR_PHASE2.sql` | Manual-apply mirror of phase2 | 🟢 identical |
| `APPLY_OFFICIAL_SOURCE_MONITOR_PHASE3.sql` | Manual-apply mirror of phase3 | 🟢 identical |
| `APPLY_OFFICIAL_SOURCE_MONITOR_PHASE4.sql` | Manual-apply mirror of phase4 | 🟢 cosmetic comment diff only |
| `APPLY_OFFICIAL_SOURCE_MONITOR_PHASE5.sql` | Manual-apply mirror of phase5 | 🟢 cosmetic comment diff only |
| `APPLY_OFFICIAL_SOURCE_MONITOR_PHASE6.sql` | Manual-apply mirror of phase6 | 🟢 cosmetic comment diff only |
| `APPLY_OFFICIAL_SOURCE_MONITOR_PHASE7.sql` | Manual-apply mirror of phase7 | 🟢 cosmetic comment diff only |
| `APPLY_OWNER_PROFILE_MODERATION.sql` | Manual-apply mirror of `20260813210000_owner_profile_moderation.sql` | 🟡 identical (contains QA-hide mutation, §6) |
| `APPLY_OWNER_PROFILE_MODERATION_SCHEMA_ONLY.sql` | Same as above minus the QA-hide mutation | 🟢 deliberate variant, not duplicate error (§3) |
| `APPLY_SCB_ACCOUNT_LINKS.sql` | Manual-apply mirror of `20260812120000_scb_account_links.sql` | 🟡 cosmetic diff, project-ref/secret-name comments (§3) |
| `FIX_UKRAINIAN_LANG_CODE_UA.sql` | Cross-table `UA`/`UK` language code normalization | 🟢 |
| `SEED_CA_MANUFACTURERS_REAL.sql` | Seeds ~10 real manufacturer brands, incl. direct `auth.users` inserts | 🟡 risky pattern, no timestamped counterpart (§4.7) |
| `SEED_COMMERCIAL_AGENTS_DEMO.sql` | Seeds one demo manufacturer/agent/opportunity using site-owner profile | 🟢 no timestamped counterpart, but low risk |

---

## 9. Recommendations summary

1. **Do not re-run `APPLY_*` files through the Supabase migration CLI** if their timestamped twin has already been applied — treat `APPLY_*` purely as "paste into SQL editor" historical archives. The two files with real drift (`APPLY_AD_CAMPAIGNS_OWNER_RLS.sql`, `APPLY_DEACTIVATE_STALE_REJECTED_ADS.sql`) should have their improvements ported into a *new* timestamped migration rather than being re-run directly.
2. **Fix the `app_site_stats` ordering issue** for any fresh/staging database bootstrap: either apply `20260514190333_create_app_site_stats_and_functions.sql` out of order before the three May files, or document that the three May files can be skipped on fresh installs since `20260514190333` (and later `20260529180000_fix_country_ranking_stats.sql`) supersede their function definitions.
3. **Rename future migrations to avoid timestamp collisions** — two same-timestamp pairs exist today (harmless, but fragile).
4. **Avoid direct `auth.users` INSERTs** in future seed scripts (`SEED_CA_MANUFACTURERS_REAL.sql` is the only offender) — prefer the Supabase Admin API / `supabase.auth.admin.createUser()` from a server-side script, as `SEED_COMMERCIAL_AGENTS_DEMO.sql` and the commented `APPLY_HIDE_QA_PUBLIC_PROFILES.sql` already model safer non-Auth-bypassing patterns.
5. **Move the two un-tracked seed files (`SEED_CA_MANUFACTURERS_REAL.sql`, `SEED_COMMERCIAL_AGENTS_DEMO.sql`) and the runbook (`APPLY_HIDE_QA_PUBLIC_PROFILES.sql`) out of the `migrations/` folder** (e.g. into a `scripts/` or `seed/` folder) since they are not part of the Supabase migration-history tracking and their presence in `migrations/` implies a false sense that `supabase db push` covers them.
6. **Consider factoring `is_site_owner()`, `is_dimarket_owner()`, and similar helper functions into a single canonical migration** rather than redefining identical bodies across 4+ files, to reduce future drift risk (currently zero drift, but the redundancy itself is the risk).
7. **No files require correction for CREATE TABLE/ADD COLUMN idempotency** — this codebase already follows good guard practices (`IF NOT EXISTS` / `information_schema` checks) throughout.
