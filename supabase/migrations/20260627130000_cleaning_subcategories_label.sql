-- Прибирання / клінінг (slug cleaning без змін)

UPDATE categories
SET
  name = 'Прибирання / клінінг',
  icon = '🧹',
  description = 'Прибирання після ремонту, cleaning, deep cleaning, construction cleaning'
WHERE slug = 'cleaning';
