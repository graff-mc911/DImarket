/*
  # Revoke public execute on refresh_app_site_stats

  1. Security Changes
    - Revoke EXECUTE on refresh_app_site_stats from anon and authenticated roles
    - This function aggregates data across multiple tables and should only
      be called by service_role (e.g., via cron or admin)
    - Resolves 403 error when frontend accidentally calls this function

  2. Notes
    - Function remains available to service_role for scheduled refreshes
    - Frontend should read from app_site_stats table directly (via RLS SELECT policy)
*/

REVOKE EXECUTE ON FUNCTION public.refresh_app_site_stats() FROM anon, authenticated;
