-- Юридичні та фінансові категорії для меню та «Популярні категорії»

INSERT INTO categories (name, slug, icon, description)
SELECT
  'Lawyer / Notary',
  'legal-notary',
  '⚖️',
  'Legal advice, contracts, notary services'
WHERE NOT EXISTS (SELECT 1 FROM categories WHERE slug = 'legal-notary');

INSERT INTO categories (name, slug, icon, description)
SELECT
  'Accountant / Financial consultant',
  'accounting-finance',
  '📊',
  'Bookkeeping, taxes, financial consulting'
WHERE NOT EXISTS (SELECT 1 FROM categories WHERE slug = 'accounting-finance');
