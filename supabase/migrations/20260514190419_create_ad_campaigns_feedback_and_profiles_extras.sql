/*
  # Create ad_campaigns, feedback_messages tables and add is_site_owner to profiles

  1. New Tables
    - `ad_campaigns` - advertising campaigns with geo-targeting
    - `feedback_messages` - contact form submissions

  2. Profile Changes
    - Add `is_site_owner` boolean column to profiles

  3. Security
    - RLS enabled on all new tables
    - Appropriate policies for each table
*/

-- Add is_site_owner to profiles if not exists
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'profiles' AND column_name = 'is_site_owner'
  ) THEN
    ALTER TABLE profiles ADD COLUMN is_site_owner boolean DEFAULT false;
  END IF;
END $$;

-- Create ad_campaigns table
CREATE TABLE IF NOT EXISTS ad_campaigns (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  advertiser_id uuid REFERENCES profiles(id) ON DELETE CASCADE NOT NULL,
  title text NOT NULL,
  description text,
  image_url text NOT NULL,
  link_url text NOT NULL,
  placement text NOT NULL CHECK (placement IN ('home', 'listings', 'sidebar', 'footer', 'mobile_sticky')),
  geo_scope text NOT NULL CHECK (geo_scope IN ('city', 'region', 'country', 'global')),
  country_code text,
  country_name text,
  region_name text,
  city_name text,
  starts_at timestamptz,
  ends_at timestamptz,
  status text DEFAULT 'draft' CHECK (status IN ('draft', 'pending_review', 'active', 'paused', 'rejected', 'expired', 'deleted')),
  review_note text,
  approved_by uuid REFERENCES profiles(id) ON DELETE SET NULL,
  approved_at timestamptz,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

ALTER TABLE ad_campaigns ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can view active ad campaigns"
  ON ad_campaigns FOR SELECT
  TO public
  USING (status = 'active' AND (ends_at IS NULL OR ends_at > now()));

CREATE POLICY "Site owners can view all ad campaigns"
  ON ad_campaigns FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM profiles WHERE id = auth.uid() AND is_site_owner = true
    )
  );

CREATE POLICY "Advertisers can view own campaigns"
  ON ad_campaigns FOR SELECT
  TO authenticated
  USING (advertiser_id = auth.uid());

CREATE POLICY "Authenticated users can create ad campaigns"
  ON ad_campaigns FOR INSERT
  TO authenticated
  WITH CHECK (advertiser_id = auth.uid());

CREATE POLICY "Advertisers can update own campaigns"
  ON ad_campaigns FOR UPDATE
  TO authenticated
  USING (advertiser_id = auth.uid())
  WITH CHECK (advertiser_id = auth.uid());

CREATE POLICY "Site owners can update any campaign"
  ON ad_campaigns FOR UPDATE
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM profiles WHERE id = auth.uid() AND is_site_owner = true
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM profiles WHERE id = auth.uid() AND is_site_owner = true
    )
  );

CREATE POLICY "Advertisers can delete own campaigns"
  ON ad_campaigns FOR DELETE
  TO authenticated
  USING (advertiser_id = auth.uid());

-- Create feedback_messages table
CREATE TABLE IF NOT EXISTS feedback_messages (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  sender_id uuid REFERENCES profiles(id) ON DELETE SET NULL,
  name text NOT NULL,
  email text NOT NULL,
  phone text,
  subject text NOT NULL,
  message text NOT NULL,
  status text DEFAULT 'new' CHECK (status IN ('new', 'in_progress', 'resolved', 'archived')),
  is_read boolean DEFAULT false,
  created_at timestamptz DEFAULT now()
);

ALTER TABLE feedback_messages ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can submit feedback"
  ON feedback_messages FOR INSERT
  TO public
  WITH CHECK (
    name IS NOT NULL AND name != ''
    AND email IS NOT NULL AND email != ''
    AND subject IS NOT NULL AND subject != ''
    AND message IS NOT NULL AND message != ''
  );

CREATE POLICY "Site owners can view all feedback"
  ON feedback_messages FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM profiles WHERE id = auth.uid() AND is_site_owner = true
    )
  );

CREATE POLICY "Site owners can update feedback status"
  ON feedback_messages FOR UPDATE
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM profiles WHERE id = auth.uid() AND is_site_owner = true
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM profiles WHERE id = auth.uid() AND is_site_owner = true
    )
  );

-- Indexes
CREATE INDEX IF NOT EXISTS idx_ad_campaigns_status ON ad_campaigns(status);
CREATE INDEX IF NOT EXISTS idx_ad_campaigns_advertiser ON ad_campaigns(advertiser_id);
CREATE INDEX IF NOT EXISTS idx_ad_campaigns_placement ON ad_campaigns(placement);
CREATE INDEX IF NOT EXISTS idx_feedback_status ON feedback_messages(status);
CREATE INDEX IF NOT EXISTS idx_feedback_is_read ON feedback_messages(is_read);
