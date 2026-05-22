/*
  Партнерська реклама: реалістичні зображення, відео без звуку (верхні бокові),
  GIF-анімації (центр), +4 нові бренди.
*/

-- Knauf — утеплення (відео + постер фасаду)
UPDATE ad_campaigns SET
  title = 'Knauf — мінеральна вата та фасадні системи',
  description = 'Теплоізоляція, гіпсокартон і ETICS для ремонту та новобудов. Офіційні системи Knauf для України.',
  image_url = 'https://images.unsplash.com/photo-1600585154340-be6161a56a0c?w=900&h=560&fit=crop&q=85',
  media_url = 'https://videos.pexels.com/video-files/3999009/3999009-uhd_2560_1440_25fps.mp4',
  media_type = 'video',
  link_url = 'https://www.knauf.ua',
  placement = 'sidebar',
  placements = ARRAY['home','sidebar','listings','mobile_sticky','footer']::text[],
  status = 'active', updated_at = now()
WHERE id = 'f81e653d-ca9e-4081-a4ca-2a17395e9924';

-- Bosch Professional — електроінструмент (відео)
UPDATE ad_campaigns SET
  title = 'Bosch Professional — акумуляторний інструмент',
  description = 'Дрилі, шуруповерти, лазерні нівеліри та сервіс Bosch для монтажників на об''єкті.',
  image_url = 'https://images.unsplash.com/photo-1572981776447-47a21a0fbb7f?w=900&h=560&fit=crop&q=85',
  media_url = 'https://videos.pexels.com/video-files/3209624/3209624-uhd_2560_1440_25fps.mp4',
  media_type = 'video',
  link_url = 'https://www.bosch-professional.com/ua/uk',
  placement = 'home',
  placements = ARRAY['home','sidebar','listings','mobile_sticky','footer']::text[],
  status = 'active', updated_at = now()
WHERE id = '89623059-83ca-4151-9f09-8fcfcb8ed889';

-- Würth — кріплення (відео)
UPDATE ad_campaigns SET
  title = 'Würth — кріплення та витратні матеріали',
  description = 'Анкери, дюбелі, хімічні кріплення та доставка на будмайданчик одним постачальником.',
  image_url = 'https://images.unsplash.com/photo-1581092160562-40aa08e78837?w=900&h=560&fit=crop&q=85',
  media_url = 'https://videos.pexels.com/video-files/4485575/4485575-uhd_2560_1440_25fps.mp4',
  media_type = 'video',
  link_url = 'https://www.wurth.ua',
  placement = 'sidebar',
  placements = ARRAY['home','sidebar','listings','mobile_sticky','footer']::text[],
  status = 'active', updated_at = now()
WHERE id = '0431275c-451e-47ed-a7a7-44167a577a29';

-- Hilti — перфорація (відео)
UPDATE ad_campaigns SET
  title = 'Hilti — перфоратори та алмазне свердління',
  description = 'Професійний інструмент, анкери та оренда обладнання Hilti для підрядників.',
  image_url = 'https://images.unsplash.com/photo-1504148455328-c376907d0c8f?w=900&h=560&fit=crop&q=85',
  media_url = 'https://videos.pexels.com/video-files/2176904/2176904-uhd_2560_1440_30fps.mp4',
  media_type = 'video',
  link_url = 'https://www.hilti.ua',
  placement = 'listings',
  placements = ARRAY['home','sidebar','listings','mobile_sticky','footer']::text[],
  status = 'active', updated_at = now()
WHERE id = '1ec41ada-4feb-4a36-b1a9-8494622ea30f';

-- Baumit — фасад (GIF центр)
UPDATE ad_campaigns SET
  title = 'Baumit — декоративні штукатурки та ETICS',
  description = 'Фасадні системи, утеплення та фінішні покриття Baumit для житла і комерції.',
  image_url = 'https://images.unsplash.com/photo-1541888946425-d81bb19240f5?w=900&h=560&fit=crop&q=85',
  media_url = 'https://media.giphy.com/media/264upSWYOxr9S/giphy.gif',
  media_type = 'gif',
  link_url = 'https://www.baumit.ua',
  placement = 'home',
  placements = ARRAY['home','sidebar','listings','footer']::text[],
  status = 'active', updated_at = now()
WHERE id = '28885e84-4be9-4ba7-8fa8-fac766c5f1f8';

-- Uponor — інженерні мережі (GIF)
UPDATE ad_campaigns SET
  title = 'Uponor — труби PEX та опалення',
  description = 'Системи водопостачання, теплої підлоги та монтажні комплекти Uponor.',
  image_url = 'https://images.unsplash.com/photo-1585704032915-8ig20df24b8e?w=900&h=560&fit=crop&q=85',
  media_url = 'https://media.giphy.com/media/l46Cy8ZBn7JDzR6Uw/giphy.gif',
  media_type = 'gif',
  link_url = 'https://www.uponor.com',
  placement = 'sidebar',
  placements = ARRAY['home','sidebar','listings','footer']::text[],
  status = 'active', updated_at = now()
WHERE id = '807b9715-ddcd-4d1f-b651-711a880a2c77';

-- VELUX — мансардні вікна (GIF)
UPDATE ad_campaigns SET
  title = 'VELUX — мансардні вікна та світлові тунелі',
  description = 'Вікна, жалюзі та монтажні комплекти для дахів і мансард.',
  image_url = 'https://images.unsplash.com/photo-1632776043539-6aedd71a6190?w=900&h=560&fit=crop&q=85',
  media_url = 'https://media.giphy.com/media/3o7TKqnN349PBUtRhi/giphy.gif',
  media_type = 'gif',
  link_url = 'https://www.velux.com',
  placement = 'home',
  placements = ARRAY['home','sidebar','listings','footer']::text[],
  status = 'active', updated_at = now()
WHERE id = '6097ef50-bb68-4041-b83f-32ecee542aad';

-- Geberit — сантехніка (фото ванної)
UPDATE ad_campaigns SET
  title = 'Geberit — інсталяції та зливні системи',
  description = 'Сховані інсталяції, зливні арматури та рішення для ванних кімнат у новобудовах.',
  image_url = 'https://images.unsplash.com/photo-1621905252507-b35492cc74b4?w=900&h=560&fit=crop&q=85',
  media_url = 'https://images.unsplash.com/photo-1621905252507-b35492cc74b4?w=900&h=560&fit=crop&q=85',
  media_type = 'image',
  link_url = 'https://www.geberit.com',
  placement = 'sidebar',
  placements = ARRAY['home','sidebar','listings','mobile_sticky','footer']::text[],
  status = 'active', updated_at = now()
WHERE id = '69df3b9f-c702-4028-b998-fc3734dc76ed';

-- Нові партнери (advertiser = site owner partner account)
INSERT INTO ad_campaigns (
  id, advertiser_id, title, description, image_url, media_url, media_type, link_url,
  placement, placements, geo_scope, country_code, country_name,
  starts_at, ends_at, status, impressions, clicks,
  stripe_payment_id, price_paid, currency_paid, approved_by, approved_at, review_note
) VALUES
(
  'a1000001-0001-4001-8001-000000000001',
  'b64a9350-4f7e-46bf-8697-d39c02491ad0',
  'Rockwool — кам''янна вата ROCKWOOL',
  'Негорюча теплоізоляція для фасадів, дахів і перегородок. Рішення ROCKWOOL для енергоефективності.',
  'https://images.unsplash.com/photo-1504307651254-35680f356dfd?w=900&h=560&fit=crop&q=85',
  'https://videos.pexels.com/video-files/3209828/3209828-uhd_2560_1440_25fps.mp4',
  'video',
  'https://www.rockwool.ua',
  'sidebar',
  ARRAY['home','sidebar','listings','mobile_sticky','footer']::text[],
  'global', 'UA', 'Україна',
  now() - interval '1 day', now() + interval '120 days', 'active', 2100, 68,
  'presence_free_a1000001', 135, 'eur',
  'b64a9350-4f7e-46bf-8697-d39c02491ad0', now(),
  'Presence partner — video side rail'
),
(
  'a1000002-0002-4002-8002-000000000002',
  'b64a9350-4f7e-46bf-8697-d39c02491ad0',
  'Ceresit — плиткові клеї та затирки',
  'Системи Ceresit для облицювання, гідроізоляції та фасадів. Підтримка майстрів на об''єкті.',
  'https://images.unsplash.com/photo-1625296316570-025e4c02e816?w=900&h=560&fit=crop&q=85',
  'https://media.giphy.com/media/26BRvYN2DmH7fVCaM/giphy.gif',
  'gif',
  'https://www.ceresit.ua',
  'home',
  ARRAY['home','sidebar','listings','footer']::text[],
  'global', 'UA', 'Україна',
  now() - interval '2 days', now() + interval '120 days', 'active', 1780, 55,
  'presence_free_a1000002', 125, 'eur',
  'b64a9350-4f7e-46bf-8697-d39c02491ad0', now(),
  'Presence partner — animated center'
),
(
  'a1000003-0003-4003-8003-000000000003',
  'b64a9350-4f7e-46bf-8697-d39c02491ad0',
  'Weber — сухі будівельні суміші',
  'Штукатурки, клеї та фасадні рішення Weber (Saint-Gobain) для професійного будівництва.',
  'https://images.unsplash.com/photo-1503387762-592deb58ef4e?w=900&h=560&fit=crop&q=85',
  'https://images.unsplash.com/photo-1503387762-592deb58ef4e?w=900&h=560&fit=crop&q=85',
  'image',
  'https://www.weber.ua',
  'listings',
  ARRAY['home','sidebar','listings','mobile_sticky','footer']::text[],
  'global', 'UA', 'Україна',
  now() - interval '3 days', now() + interval '120 days', 'active', 1650, 49,
  'presence_free_a1000003', 115, 'eur',
  'b64a9350-4f7e-46bf-8697-d39c02491ad0', now(),
  'Presence partner — side image'
),
(
  'a1000004-0004-4004-8004-000000000004',
  'b64a9350-4f7e-46bf-8697-d39c02491ad0',
  'Sika — гідроізоляція та добавки в бетон',
  'Рішення Sika для фундаментів, підвалів, швів та промислових підлог.',
  'https://images.unsplash.com/photo-1541972664089-0221394fb162?w=900&h=560&fit=crop&q=85',
  'https://media.giphy.com/media/l0HlBO7YGa8Favfh8/giphy.gif',
  'gif',
  'https://www.sika.com/ua',
  'home',
  ARRAY['home','sidebar','listings','footer']::text[],
  'global', 'UA', 'Україна',
  now() - interval '4 days', now() + interval '120 days', 'active', 1920, 61,
  'presence_free_a1000004', 105, 'eur',
  'b64a9350-4f7e-46bf-8697-d39c02491ad0', now(),
  'Presence partner — animated center'
)
ON CONFLICT (id) DO UPDATE SET
  title = EXCLUDED.title,
  description = EXCLUDED.description,
  image_url = EXCLUDED.image_url,
  media_url = EXCLUDED.media_url,
  media_type = EXCLUDED.media_type,
  link_url = EXCLUDED.link_url,
  placements = EXCLUDED.placements,
  status = 'active',
  updated_at = now();
