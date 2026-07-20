-- Create Project wizard uses lead marketplace schema (already applied in 20260719120000).
-- This file documents required objects for /create-project.

-- listings: budget_min, budget_max, deadline_type, deadline_at, urgency,
--           preferred_language, wizard_completed, postal_code, country_name, city_name
-- project_files + storage bucket project-files
-- RLS policies for project_files

-- No-op ensure: project-files bucket
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES (
  'project-files',
  'project-files',
  true,
  52428800,
  ARRAY[
    'image/jpeg', 'image/png', 'image/webp', 'image/gif',
    'video/mp4', 'video/webm',
    'application/pdf'
  ]
)
ON CONFLICT (id) DO NOTHING;
