-- Перейменування категорій: electrical → СТО ремонт авто, tools → Перевезення і доставка
-- Slug лишаються (electrical, tools) для сумісності з існуючими оголошеннями.

UPDATE categories
SET
  name = 'СТО ремонт авто',
  icon = '🚗',
  description = 'Станція технічного обслуговування та ремонт автомобілів'
WHERE slug = 'electrical';

UPDATE categories
SET
  name = 'Перевезення і доставка',
  icon = '🚚',
  description = 'Вантажні перевезення, доставка матеріалів і вантажів'
WHERE slug = 'tools';
