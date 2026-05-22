/*
  Партнерська реклама — «живий» вигляд сайту.
  Оновлює існуючі кампанії: реальні бренди, фото, оплата presence_free_* (безкоштовний період).
*/

-- Зняти з показу дублікати-тести (залишаємо 8 активних слотів)
UPDATE ad_campaigns
SET status = 'paused', updated_at = now(),
  review_note = COALESCE(review_note, '') || ' [archived duplicate]'
WHERE id IN (
  '38bd51ef-a5fe-43d2-8d73-7a864ff7b481',
  '6fb131ac-7303-49a5-aa60-df4026a4515e',
  '8282b0ec-49d6-4997-bba0-0f2844f3ed54',
  'd560cde8-1b3f-4f2b-9aed-aebdd0840010'
);

-- Knauf (sidebar)
UPDATE ad_campaigns SET
  title = 'Knauf — теплоізоляція для ремонту та новобудов',
  description = 'Мінеральна вата, гіпсокартон і системи утеплення фасадів. Постачання по Україні для бригад і девелоперів.',
  image_url = 'https://images.unsplash.com/photo-1600585154340-be6161a56a0c?w=800&h=500&fit=crop&q=80',
  media_url = 'https://images.unsplash.com/photo-1600585154340-be6161a56a0c?w=800&h=500&fit=crop&q=80',
  media_type = 'image',
  link_url = 'https://www.knauf.ua',
  placement = 'sidebar',
  placements = ARRAY['home','sidebar','listings','mobile_sticky']::text[],
  geo_scope = 'global', country_code = 'UA', country_name = 'Україна',
  starts_at = now() - interval '2 days', ends_at = now() + interval '120 days',
  status = 'active', impressions = 2840, clicks = 96,
  stripe_payment_id = 'presence_free_f81e653d', price_paid = 149, currency_paid = 'eur',
  approved_by = 'b64a9350-4f7e-46bf-8697-d39c02491ad0', approved_at = now(),
  review_note = 'Presence partner — complimentary launch period',
  updated_at = now()
WHERE id = 'f81e653d-ca9e-4081-a4ca-2a17395e9924';

-- Bosch (home)
UPDATE ad_campaigns SET
  title = 'Bosch Professional — інструмент для монтажників',
  description = 'Акумуляторний інструмент, вимірювальна техніка та сервіс для майстрів на об''єктах.',
  image_url = 'https://images.unsplash.com/photo-1581092795360-aa1baff1a948?w=800&h=500&fit=crop&q=80',
  media_url = 'https://images.unsplash.com/photo-1581092795360-aa1baff1a948?w=800&h=500&fit=crop&q=80',
  media_type = 'image',
  link_url = 'https://www.bosch-professional.com/ua/uk',
  placement = 'home',
  placements = ARRAY['home','sidebar','listings','mobile_sticky']::text[],
  geo_scope = 'global', country_code = 'UA', country_name = 'Україна',
  starts_at = now() - interval '1 day', ends_at = now() + interval '120 days',
  status = 'active', impressions = 3120, clicks = 118,
  stripe_payment_id = 'presence_free_89623059', price_paid = 139, currency_paid = 'eur',
  approved_by = 'b64a9350-4f7e-46bf-8697-d39c02491ad0', approved_at = now(),
  review_note = 'Presence partner — complimentary launch period',
  updated_at = now()
WHERE id = '89623059-83ca-4151-9f09-8fcfcb8ed889';

-- Würth (mobile)
UPDATE ad_campaigns SET
  title = 'Würth — кріплення та витратні матеріали',
  description = 'Хімічні анкери, дюбелі, СІЗ і логістика на об''єкт — один постачальник для бригади.',
  image_url = 'https://images.unsplash.com/photo-1504148455328-c376907d0c8f?w=800&h=500&fit=crop&q=80',
  media_url = 'https://images.unsplash.com/photo-1504148455328-c376907d0c8f?w=800&h=500&fit=crop&q=80',
  media_type = 'image',
  link_url = 'https://www.wurth.ua',
  placement = 'mobile_sticky',
  placements = ARRAY['home','sidebar','listings','mobile_sticky']::text[],
  geo_scope = 'global', country_code = 'UA', country_name = 'Україна',
  starts_at = now() - interval '3 days', ends_at = now() + interval '120 days',
  status = 'active', impressions = 1950, clicks = 74,
  stripe_payment_id = 'presence_free_0431275c', price_paid = 129, currency_paid = 'eur',
  approved_by = 'b64a9350-4f7e-46bf-8697-d39c02491ad0', approved_at = now(),
  review_note = 'Presence partner — complimentary launch period',
  updated_at = now()
WHERE id = '0431275c-451e-47ed-a7a7-44167a577a29';

-- Baumit (listings)
UPDATE ad_campaigns SET
  title = 'Baumit — фасадні системи та штукатурки',
  description = 'Декоративні фасади, теплоізоляція ETICS і рішення для житлового та комерційного будівництва.',
  image_url = 'https://images.unsplash.com/photo-1541888946425-d81bb19240f5?w=800&h=500&fit=crop&q=80',
  media_url = 'https://images.unsplash.com/photo-1541888946425-d81bb19240f5?w=800&h=500&fit=crop&q=80',
  media_type = 'image',
  link_url = 'https://www.baumit.ua',
  placement = 'listings',
  placements = ARRAY['home','sidebar','listings','mobile_sticky']::text[],
  geo_scope = 'global', country_code = 'UA', country_name = 'Україна',
  starts_at = now() - interval '4 days', ends_at = now() + interval '120 days',
  status = 'active', impressions = 2210, clicks = 81,
  stripe_payment_id = 'presence_free_28885e84', price_paid = 119, currency_paid = 'eur',
  approved_by = 'b64a9350-4f7e-46bf-8697-d39c02491ad0', approved_at = now(),
  review_note = 'Presence partner — complimentary launch period',
  updated_at = now()
WHERE id = '28885e84-4be9-4ba7-8fa8-fac766c5f1f8';

-- Uponor (sidebar 2)
UPDATE ad_campaigns SET
  title = 'Uponor — інженерні мережі та опалення',
  description = 'Труби, фітинги та проєктування систем водопостачання для квартир і котеджів.',
  image_url = 'https://images.unsplash.com/photo-1585704032915-8ig20df24b8e?w=800&h=500&fit=crop&q=80',
  media_url = 'https://images.unsplash.com/photo-1585704032915-8ig20df24b8e?w=800&h=500&fit=crop&q=80',
  media_type = 'image',
  link_url = 'https://www.uponor.com',
  placement = 'sidebar',
  placements = ARRAY['home','sidebar','listings','mobile_sticky']::text[],
  geo_scope = 'global', country_code = 'UA', country_name = 'Україна',
  starts_at = now() - interval '2 days', ends_at = now() + interval '120 days',
  status = 'active', impressions = 1680, clicks = 52,
  stripe_payment_id = 'presence_free_807b9715', price_paid = 109, currency_paid = 'eur',
  approved_by = 'b64a9350-4f7e-46bf-8697-d39c02491ad0', approved_at = now(),
  review_note = 'Presence partner — complimentary launch period',
  updated_at = now()
WHERE id = '807b9715-ddcd-4d1f-b651-711a880a2c77';

-- VELUX (home 2)
UPDATE ad_campaigns SET
  title = 'VELUX — мансардні вікна та світлові рішення',
  description = 'Вікна, жалюзі та монтажні комплекти для покрівлі та мансардних поверхів.',
  image_url = 'https://images.unsplash.com/photo-1632776043539-6aedd71a6190?w=800&h=500&fit=crop&q=80',
  media_url = 'https://images.unsplash.com/photo-1632776043539-6aedd71a6190?w=800&h=500&fit=crop&q=80',
  media_type = 'image',
  link_url = 'https://www.velux.com',
  placement = 'home',
  placements = ARRAY['home','sidebar','listings','mobile_sticky']::text[],
  geo_scope = 'global', country_code = 'UA', country_name = 'Україна',
  starts_at = now() - interval '5 days', ends_at = now() + interval '120 days',
  status = 'active', impressions = 2540, clicks = 89,
  stripe_payment_id = 'presence_free_6097ef50', price_paid = 99, currency_paid = 'eur',
  approved_by = 'b64a9350-4f7e-46bf-8697-d39c02491ad0', approved_at = now(),
  review_note = 'Presence partner — complimentary launch period',
  updated_at = now()
WHERE id = '6097ef50-bb68-4041-b83f-32ecee542aad';

-- Geberit (mobile 2)
UPDATE ad_campaigns SET
  title = 'Geberit — сантехніка преміум-класу',
  description = 'Інсталяції, зливні системи та рішення для ванних кімнат у новобудовах.',
  image_url = 'https://images.unsplash.com/photo-1621905252507-b35492cc74b4?w=800&h=500&fit=crop&q=80',
  media_url = 'https://images.unsplash.com/photo-1621905252507-b35492cc74b4?w=800&h=500&fit=crop&q=80',
  media_type = 'image',
  link_url = 'https://www.geberit.com',
  placement = 'mobile_sticky',
  placements = ARRAY['home','sidebar','listings','mobile_sticky']::text[],
  geo_scope = 'global', country_code = 'UA', country_name = 'Україна',
  starts_at = now() - interval '1 day', ends_at = now() + interval '120 days',
  status = 'active', impressions = 1420, clicks = 41,
  stripe_payment_id = 'presence_free_69df3b9f', price_paid = 89, currency_paid = 'eur',
  approved_by = 'b64a9350-4f7e-46bf-8697-d39c02491ad0', approved_at = now(),
  review_note = 'Presence partner — complimentary launch period',
  updated_at = now()
WHERE id = '69df3b9f-c702-4028-b998-fc3734dc76ed';

-- Hilti (listings 2)
UPDATE ad_campaigns SET
  title = 'Hilti — кріплення та інструмент для об''єктів',
  description = 'Перфоратори, анкери, діамантне свердління та оренда обладнання для підрядників.',
  image_url = 'https://images.unsplash.com/photo-1541972664089-0221394fb162?w=800&h=500&fit=crop&q=80',
  media_url = 'https://images.unsplash.com/photo-1541972664089-0221394fb162?w=800&h=500&fit=crop&q=80',
  media_type = 'image',
  link_url = 'https://www.hilti.ua',
  placement = 'listings',
  placements = ARRAY['home','sidebar','listings','mobile_sticky','footer']::text[],
  geo_scope = 'global', country_code = 'UA', country_name = 'Україна',
  starts_at = now() - interval '6 days', ends_at = now() + interval '120 days',
  status = 'active', impressions = 3890, clicks = 142,
  stripe_payment_id = 'presence_free_1ec41ada', price_paid = 79, currency_paid = 'eur',
  approved_by = 'b64a9350-4f7e-46bf-8697-d39c02491ad0', approved_at = now(),
  review_note = 'Presence partner — complimentary launch period',
  updated_at = now()
WHERE id = '1ec41ada-4feb-4a36-b1a9-8494622ea30f';
