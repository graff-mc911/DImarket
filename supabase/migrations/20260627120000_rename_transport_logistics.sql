-- Перейменування tools → Перевезення / логістика (slug tools без змін)

UPDATE categories
SET
  name = 'Перевезення / логістика',
  icon = '🚚',
  description = 'Доставка матеріалів, вантажники, переїзди, transport'
WHERE slug = 'tools';
