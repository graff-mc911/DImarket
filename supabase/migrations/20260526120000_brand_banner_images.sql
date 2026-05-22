-- Банери брендів (public/ads/brands/*.png на dimarket.app)
-- Локально фронт також підміняє через partnerAdMedia.ts

UPDATE ad_campaigns SET
  title = 'Knauf — BUILD ON US',
  description = 'Системи гіпсокартону, утеплення та універсальна штукатурка MP 75 для будь-якого об''єкта. Будуйте на надійних матеріалах Knauf — знайдіть на DImarket.app.',
  image_url = 'https://dimarket.app/ads/brands/knauf.png',
  media_url = 'https://dimarket.app/ads/brands/knauf.png',
  media_type = 'image',
  link_url = 'https://www.knauf.ua'
WHERE id = 'f81e653d-ca9e-4081-a4ca-2a17395e9924';

UPDATE ad_campaigns SET
  title = 'DEWALT — GUARANTEED TOUGH',
  description = 'Високопродуктивний акумуляторний інструмент XR для найважчих задач на об''єкті. Доступно на DImarket.app.',
  image_url = 'https://dimarket.app/ads/brands/dewalt.png',
  media_url = 'https://dimarket.app/ads/brands/dewalt.png',
  media_type = 'image',
  link_url = 'https://www.dewalt.com'
WHERE id = '89623059-83ca-4151-9f09-8fcfcb8ed889';

UPDATE ad_campaigns SET
  title = 'Festool — BUILT BETTER TO BUILD BETTER',
  description = 'Преміальні інструменти та системи Systainer. Знайдіть на DImarket.app.',
  image_url = 'https://dimarket.app/ads/brands/festool.png',
  media_url = 'https://dimarket.app/ads/brands/festool.png',
  media_type = 'image',
  link_url = 'https://www.festool.com'
WHERE id = '0431275c-451e-47ed-a7a7-44167a577a29';

UPDATE ad_campaigns SET
  title = 'Hilti — OUTPERFORM. OUTLAST.',
  description = 'Інструмент і сервіс для професіоналів. Дивіться пропозиції на DImarket.app.',
  image_url = 'https://dimarket.app/ads/brands/hilti.png',
  media_url = 'https://dimarket.app/ads/brands/hilti.png',
  media_type = 'image',
  link_url = 'https://www.hilti.ua'
WHERE id = '1ec41ada-4feb-4a36-b1a9-8494622ea30f';

UPDATE ad_campaigns SET
  title = 'GREE — PERFECT CLIMATE',
  description = 'Клімат-контроль: енергозбереження, тиха робота, Wi‑Fi. На DImarket.app.',
  image_url = 'https://dimarket.app/ads/brands/gree.png',
  media_url = 'https://dimarket.app/ads/brands/gree.png',
  media_type = 'image',
  link_url = 'https://www.gree.com',
  placements = ARRAY['home','home_center','sidebar','listings','footer']::text[]
WHERE id = '28885e84-4be9-4ba7-8fa8-fac766c5f1f8';

UPDATE ad_campaigns SET
  title = 'Uponor — BUILD ON RELIABILITY',
  description = 'Водопостачання, опалення та охолодження Uponor. Знайдіть на DImarket.app.',
  image_url = 'https://dimarket.app/ads/brands/uponor.png',
  media_url = 'https://dimarket.app/ads/brands/uponor.png',
  media_type = 'image',
  link_url = 'https://www.uponor.com'
WHERE id = '807b9715-ddcd-4d1f-b651-711a880a2c77';

UPDATE ad_campaigns SET
  title = 'VELUX — MORE DAYLIGHT. BETTER LIVING.',
  description = 'Мансардні вікна та світлові рішення. Обирайте на DImarket.app.',
  image_url = 'https://dimarket.app/ads/brands/velux.png',
  media_url = 'https://dimarket.app/ads/brands/velux.png',
  media_type = 'image',
  link_url = 'https://www.velux.com'
WHERE id = '6097ef50-bb68-4041-b83f-32ecee542aad';

UPDATE ad_campaigns SET
  title = 'Geberit — THE ART OF BATHROOM PERFECTION',
  description = 'Інсталяції та зливні системи для ванних кімнат. Деталі на DImarket.app.',
  image_url = 'https://dimarket.app/ads/brands/geberit.png',
  media_url = 'https://dimarket.app/ads/brands/geberit.png',
  media_type = 'image',
  link_url = 'https://www.geberit.com'
WHERE id = '69df3b9f-c702-4028-b998-fc3734dc76ed';

UPDATE profiles SET full_name = 'DEWALT Україна', website = 'https://www.dewalt.com',
  bio = '[demo_brand_advertiser] DEWALT — Guaranteed Tough.'
WHERE id = 'e1000002-0002-4002-8002-000000000002';

UPDATE profiles SET full_name = 'Festool', website = 'https://www.festool.com',
  bio = '[demo_brand_advertiser] Festool — преміальні інструменти.'
WHERE id = 'e1000003-0003-4003-8003-000000000003';

UPDATE profiles SET full_name = 'GREE Climate', website = 'https://www.gree.com',
  bio = '[demo_brand_advertiser] GREE — Perfect Climate (центральний блок).'
WHERE id = 'e1000005-0005-4005-8005-000000000005';
