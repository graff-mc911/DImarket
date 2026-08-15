-- VERIFY_OWNER_PROFILE_MODERATION_SCHEMA.sql
-- Paste in Supabase SQL Editor AFTER APPLY_OWNER_PROFILE_MODERATION_SCHEMA_ONLY.sql
-- READ-ONLY. Does not hide or soft-delete any profiles.

SELECT
  (SELECT COUNT(*) FROM information_schema.columns
    WHERE table_schema = 'public' AND table_name = 'profiles' AND column_name = 'deleted_at') AS has_deleted_at,
  (SELECT COUNT(*) FROM information_schema.columns
    WHERE table_schema = 'public' AND table_name = 'profiles' AND column_name = 'hidden_at') AS has_hidden_at,
  (SELECT COUNT(*) FROM information_schema.columns
    WHERE table_schema = 'public' AND table_name = 'profiles' AND column_name = 'ranking_priority') AS has_ranking_priority,
  (SELECT COUNT(*) FROM information_schema.columns
    WHERE table_schema = 'public' AND table_name = 'profiles' AND column_name = 'deleted_by') AS has_deleted_by,
  (SELECT COUNT(*) FROM information_schema.columns
    WHERE table_schema = 'public' AND table_name = 'profiles' AND column_name = 'hidden_by') AS has_hidden_by,
  (SELECT COUNT(*) FROM pg_proc p
     JOIN pg_namespace n ON n.oid = p.pronamespace
    WHERE n.nspname = 'public' AND p.proname = 'admin_search_profiles') AS has_admin_search_profiles,
  (SELECT COUNT(*) FROM pg_proc p
     JOIN pg_namespace n ON n.oid = p.pronamespace
    WHERE n.nspname = 'public' AND p.proname = 'admin_hide_profile') AS has_admin_hide_profile,
  (SELECT COUNT(*) FROM pg_proc p
     JOIN pg_namespace n ON n.oid = p.pronamespace
    WHERE n.nspname = 'public' AND p.proname = 'admin_soft_delete_profile') AS has_admin_soft_delete_profile,
  (SELECT COUNT(*) FROM pg_proc p
     JOIN pg_namespace n ON n.oid = p.pronamespace
    WHERE n.nspname = 'public' AND p.proname = 'admin_restore_profile') AS has_admin_restore_profile,
  (SELECT COUNT(*) FROM pg_proc p
     JOIN pg_namespace n ON n.oid = p.pronamespace
    WHERE n.nspname = 'public' AND p.proname = 'admin_set_ranking_priority') AS has_admin_set_ranking_priority,
  (SELECT COUNT(*) FROM pg_proc p
     JOIN pg_namespace n ON n.oid = p.pronamespace
    WHERE n.nspname = 'public' AND p.proname = 'admin_unhide_profile') AS has_admin_unhide_profile,
  (SELECT COUNT(*) FROM pg_proc p
     JOIN pg_namespace n ON n.oid = p.pronamespace
    WHERE n.nspname = 'public' AND p.proname = 'admin_profile_consistency_counts') AS has_admin_profile_consistency_counts,
  (SELECT COUNT(*) FROM pg_proc p
     JOIN pg_namespace n ON n.oid = p.pronamespace
    WHERE n.nspname = 'public' AND p.proname = 'admin_update_profile_flags') AS has_admin_update_profile_flags;

-- Expected result: every value = 1
