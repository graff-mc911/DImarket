-- ROCKWOOL, Ceresit, Sika: заміна заголовків/описів (без підміни чужих брендових PNG)

UPDATE ad_campaigns SET
  title = 'ROCKWOOL — більше комфорту. Краща ізоляція.',
  description = 'Кам''яна вата ROCKWOOL для фасадів, дахів і перегородок: вогнестійкість, акустика та енергоефективність. Знайдіть на DImarket.app.',
  image_url = 'https://images.unsplash.com/photo-1504307651254-35680f356dfd?w=900&h=560&fit=crop&q=85',
  media_url = 'https://images.unsplash.com/photo-1504307651254-35680f356dfd?w=900&h=560&fit=crop&q=85',
  media_type = 'image'
WHERE id = 'a1000001-0001-4001-8001-000000000001';

UPDATE ad_campaigns SET
  title = 'Ceresit — Build on quality',
  description = 'Системи Ceresit (Henkel): плиткові клеї, затирки, гідроізоляція та ETICS. Надійні рішення для майстрів — DImarket.app.',
  image_url = 'https://images.unsplash.com/photo-1625296316570-025e4c02e816?w=900&h=560&fit=crop&q=85',
  media_url = 'https://images.unsplash.com/photo-1625296316570-025e4c02e816?w=900&h=560&fit=crop&q=85',
  media_type = 'image'
WHERE id = 'a1000002-0002-4002-8002-000000000002';

UPDATE ad_campaigns SET
  title = 'Sika — BUILD ON RELIABILITY',
  description = 'Гідроізоляція, добавки в бетон, герметики та інженерні рішення Sika для фундаментів і промислових підлог. DImarket.app.',
  image_url = 'https://images.unsplash.com/photo-1541972664089-0221394fb162?w=900&h=560&fit=crop&q=85',
  media_url = 'https://images.unsplash.com/photo-1541972664089-0221394fb162?w=900&h=560&fit=crop&q=85',
  media_type = 'image'
WHERE id = 'a1000004-0004-4004-8004-000000000004';
