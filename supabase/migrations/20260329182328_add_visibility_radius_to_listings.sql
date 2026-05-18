/*
  # Add Visibility Radius Field to Listings

  1. Changes
    - Add `visibility_radius` column to `listings` table
      - Type: text
      - Allowed values: 'city', 'district', 'region', 'country', 'state', 'land', 'global'
      - Default: 'city'
      - Description: Defines the geographical visibility scope of the listing
  
  2. Notes
    - This field allows users to control how widely their listing is visible
    - Default is 'city' for local visibility
    - 'land' refers to German states (Bundesländer)
*/

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'listings' AND column_name = 'visibility_radius'
  ) THEN
    ALTER TABLE listings ADD COLUMN visibility_radius text DEFAULT 'city';
    ALTER TABLE listings ADD CONSTRAINT visibility_radius_check 
      CHECK (visibility_radius IN ('city', 'district', 'region', 'country', 'state', 'land', 'global'));
  END IF;
END $$;