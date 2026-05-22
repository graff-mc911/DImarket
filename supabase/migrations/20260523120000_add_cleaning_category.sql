INSERT INTO categories (name, slug, icon, description)
SELECT
  'Cleaning',
  'cleaning',
  '🧹',
  'Home, office, and commercial cleaning services'
WHERE NOT EXISTS (
  SELECT 1 FROM categories WHERE slug = 'cleaning'
);
