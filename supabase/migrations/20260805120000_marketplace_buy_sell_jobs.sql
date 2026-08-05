-- Marketplace (Buy & Sell) + Jobs fields on listings
-- Extends existing listings table; keeps sell-rent / vacancies categories.

ALTER TABLE listings DROP CONSTRAINT IF EXISTS listings_listing_type_check;
ALTER TABLE listings
  ADD CONSTRAINT listings_listing_type_check
  CHECK (listing_type IN (
    'service_request',
    'service_offer',
    'item_sale',
    'item_wanted',
    'job_vacancy'
  ));

ALTER TABLE listings
  ADD COLUMN IF NOT EXISTS item_condition text
    CHECK (item_condition IS NULL OR item_condition IN ('new', 'used')),
  ADD COLUMN IF NOT EXISTS availability_status text
    CHECK (availability_status IS NULL OR availability_status IN ('available', 'sold', 'reserved')),
  ADD COLUMN IF NOT EXISTS company_name text,
  ADD COLUMN IF NOT EXISTS employment_type text
    CHECK (
      employment_type IS NULL OR employment_type IN (
        'full_time', 'part_time', 'contract', 'temporary', 'internship', 'freelance'
      )
    ),
  ADD COLUMN IF NOT EXISTS experience_level text
    CHECK (
      experience_level IS NULL OR experience_level IN (
        'none', 'junior', 'mid', 'senior', 'lead'
      )
    ),
  ADD COLUMN IF NOT EXISTS job_languages text[] DEFAULT '{}'::text[],
  ADD COLUMN IF NOT EXISTS work_arrangement text
    CHECK (
      work_arrangement IS NULL OR work_arrangement IN ('onsite', 'hybrid', 'remote')
    ),
  ADD COLUMN IF NOT EXISTS requirements text,
  ADD COLUMN IF NOT EXISTS benefits text;

CREATE INDEX IF NOT EXISTS idx_listings_item_condition
  ON listings (item_condition)
  WHERE item_condition IS NOT NULL;

CREATE INDEX IF NOT EXISTS idx_listings_employment_type
  ON listings (employment_type)
  WHERE employment_type IS NOT NULL;

CREATE INDEX IF NOT EXISTS idx_listings_work_arrangement
  ON listings (work_arrangement)
  WHERE work_arrangement IS NOT NULL;

CREATE INDEX IF NOT EXISTS idx_listings_job_vacancy
  ON listings (status, listing_type, created_at DESC)
  WHERE listing_type = 'job_vacancy' AND status = 'active';

CREATE INDEX IF NOT EXISTS idx_listings_marketplace_items
  ON listings (status, listing_type, created_at DESC)
  WHERE listing_type IN ('item_sale', 'item_wanted') AND status = 'active';

-- Refresh category display names for international audience
UPDATE categories
SET
  name = 'Marketplace (Buy & Sell)',
  icon = '🛒',
  description = 'Buy, sell and rent materials, tools, equipment, vehicles and property'
WHERE slug = 'sell-rent';

UPDATE categories
SET
  name = 'Jobs',
  icon = '💼',
  description = 'Job vacancies and hiring across construction and related trades'
WHERE slug = 'vacancies';
