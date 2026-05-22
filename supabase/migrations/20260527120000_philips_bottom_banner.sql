-- Philips — нижній боковий банер

INSERT INTO ad_campaigns (
  id, advertiser_id, title, description, image_url, media_url, media_type, link_url,
  placement, placements, geo_scope, country_code, country_name,
  starts_at, ends_at, status, impressions, clicks,
  stripe_payment_id, price_paid, currency_paid, approved_by, approved_at, review_note
) VALUES (
  'a1000005-0005-4005-8005-000000000005',
  'e1000013-0013-4013-8013-000000000013',
  'Philips — Light that improves life.',
  'Інноваційні рішення Philips для освітлення: комфорт, якість і надійність. Знайдіть на DImarket.app.',
  'https://dimarket.app/ads/brands/philips.png',
  'https://dimarket.app/ads/brands/philips.png',
  'image',
  'https://www.philips.ua',
  'sidebar',
  ARRAY['home','sidebar','listings','mobile_sticky','footer']::text[],
  'global', 'UA', 'Україна',
  now() - interval '5 days', now() + interval '120 days', 'active', 1850, 58,
  'presence_free_a1000005', 128, 'eur',
  'b64a9350-4f7e-46bf-8697-d39c02491ad0', now(),
  'Presence partner — Philips bottom rail'
)
ON CONFLICT (id) DO UPDATE SET
  title = EXCLUDED.title,
  description = EXCLUDED.description,
  image_url = EXCLUDED.image_url,
  media_url = EXCLUDED.media_url,
  media_type = EXCLUDED.media_type,
  link_url = EXCLUDED.link_url,
  placements = EXCLUDED.placements,
  updated_at = now();
