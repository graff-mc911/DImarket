-- Матеріали → Меблі (slug furniture)

UPDATE categories
SET
  name = 'Furniture',
  slug = 'furniture',
  icon = '🪑',
  description = 'Furniture and home furnishings for sale'
WHERE slug = 'materials';

INSERT INTO categories (name, slug, icon, description)
SELECT 'Furniture', 'furniture', '🪑', 'Furniture and home furnishings for sale'
WHERE NOT EXISTS (SELECT 1 FROM categories WHERE slug = 'furniture');
