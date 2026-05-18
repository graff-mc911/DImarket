/*
  # Remove Subscription Fields

  1. Changes
    - Remove `subscription_tier` column from profiles table
    - Remove `subscription_expires_at` column from profiles table
  
  2. Notes
    - Making the platform completely free
    - No payment or subscription functionality needed
*/

DO $$
BEGIN
  IF EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'profiles' AND column_name = 'subscription_tier'
  ) THEN
    ALTER TABLE profiles DROP COLUMN subscription_tier;
  END IF;

  IF EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'profiles' AND column_name = 'subscription_expires_at'
  ) THEN
    ALTER TABLE profiles DROP COLUMN subscription_expires_at;
  END IF;
END $$;
