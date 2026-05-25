-- Підкатегорії для оголошень і профілів майстрів (slug-и з categoryCatalog.ts)

ALTER TABLE listings
  ADD COLUMN IF NOT EXISTS subcategory_slugs text[] NOT NULL DEFAULT '{}';

ALTER TABLE profiles
  ADD COLUMN IF NOT EXISTS work_subcategory_slugs text[] NOT NULL DEFAULT '{}';

COMMENT ON COLUMN listings.subcategory_slugs IS 'Slugs підкатегорій з SERVICE_CATEGORY_CATALOG';
COMMENT ON COLUMN profiles.work_subcategory_slugs IS 'Види робіт майстра (slugs підкатегорій)';
