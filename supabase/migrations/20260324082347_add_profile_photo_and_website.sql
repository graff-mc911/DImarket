/*
  # Add Profile Photo and Website Fields

  ## Changes Made:
  
  ### 1. Profiles Table Updates
    - Add `profile_photo` (text) - URL for profile photo
    - Add `website` (text) - Professional's website URL
  
  These fields are needed for the Settings page functionality.
*/

-- Add profile_photo field if not exists
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'profiles' AND column_name = 'profile_photo'
  ) THEN
    ALTER TABLE profiles ADD COLUMN profile_photo text;
  END IF;
END $$;

-- Add website field if not exists
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'profiles' AND column_name = 'website'
  ) THEN
    ALTER TABLE profiles ADD COLUMN website text;
  END IF;
END $$;
