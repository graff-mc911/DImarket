/*
  Placeholder-реклама DImarket для пілотних міст (DE/ES).
  Власні банери до появи партнерських брендів.
  Безпечно повторювати: ON CONFLICT DO UPDATE.
*/

INSERT INTO ad_campaigns (
  id, advertiser_id, title, description, image_url, media_url, media_type, link_url,
  placement, placements, geo_scope, country_code, country_name, cities,
  starts_at, ends_at, status, impressions, clicks,
  stripe_payment_id, price_paid, currency_paid, approved_by, approved_at, review_note
) VALUES
(
  'a1d2e3f4-1111-4000-8000-000000000001',
  'b64a9350-4f7e-46bf-8697-d39c02491ad0',
  'DImarket — Handwerker in Darmstadt',
  'Kostenlose Plattform für Aufträge und Profil. Registrieren Sie sich als Meister oder Firma in Darmstadt.',
  'https://images.pexels.com/photos/159306/construction-site-build-construction-work-159306.jpeg?auto=compress&cs=tinysrgb&w=800',
  'https://images.pexels.com/photos/159306/construction-site-build-construction-work-159306.jpeg?auto=compress&cs=tinysrgb&w=800',
  'image',
  'https://dimarket.app/register',
  'sidebar',
  ARRAY['home','sidebar','listings','professionals','mobile_sticky']::text[],
  'cities', 'DE', 'Germany', ARRAY['Darmstadt']::text[],
  now() - interval '1 day', NULL, 'active', 0, 0,
  'launch_placeholder_de_darmstadt', 0, 'eur',
  'b64a9350-4f7e-46bf-8697-d39c02491ad0', now(),
  'Launch market placeholder — Darmstadt DE'
),
(
  'a1d2e3f4-2222-4000-8000-000000000002',
  'b64a9350-4f7e-46bf-8697-d39c02491ad0',
  'DImarket — Profesionales en Alicante',
  'Plataforma gratuita para solicitudes y perfil. Regístrate como profesional o empresa en Alicante.',
  'https://images.pexels.com/photos/1249611/pexels-photo-1249611.jpeg?auto=compress&cs=tinysrgb&w=800',
  'https://images.pexels.com/photos/1249611/pexels-photo-1249611.jpeg?auto=compress&cs=tinysrgb&w=800',
  'image',
  'https://dimarket.app/register',
  'home',
  ARRAY['home','home_center','sidebar','listings','professionals','mobile_sticky']::text[],
  'cities', 'ES', 'Spain', ARRAY['Alicante']::text[],
  now() - interval '1 day', NULL, 'active', 0, 0,
  'launch_placeholder_es_alicante', 0, 'eur',
  'b64a9350-4f7e-46bf-8697-d39c02491ad0', now(),
  'Launch market placeholder — Alicante ES'
),
(
  'a1d2e3f4-3333-4000-8000-000000000003',
  'b64a9350-4f7e-46bf-8697-d39c02491ad0',
  'DImarket — Empresas y oficios en Madrid',
  'Encuentra clientes en Madrid. Perfil gratuito para maestros y empresas de construcción.',
  'https://images.pexels.com/photos/3862139/pexels-photo-3862139.jpeg?auto=compress&cs=tinysrgb&w=800',
  'https://images.pexels.com/photos/3862139/pexels-photo-3862139.jpeg?auto=compress&cs=tinysrgb&w=800',
  'image',
  'https://dimarket.app/register',
  'sidebar',
  ARRAY['home','sidebar','listings','professionals','companies','mobile_sticky']::text[],
  'cities', 'ES', 'Spain', ARRAY['Madrid']::text[],
  now() - interval '1 day', NULL, 'active', 0, 0,
  'launch_placeholder_es_madrid', 0, 'eur',
  'b64a9350-4f7e-46bf-8697-d39c02491ad0', now(),
  'Launch market placeholder — Madrid ES'
)
ON CONFLICT (id) DO UPDATE SET
  title = EXCLUDED.title,
  description = EXCLUDED.description,
  image_url = EXCLUDED.image_url,
  media_url = EXCLUDED.media_url,
  link_url = EXCLUDED.link_url,
  placements = EXCLUDED.placements,
  geo_scope = EXCLUDED.geo_scope,
  country_code = EXCLUDED.country_code,
  country_name = EXCLUDED.country_name,
  cities = EXCLUDED.cities,
  ends_at = EXCLUDED.ends_at,
  status = EXCLUDED.status,
  review_note = EXCLUDED.review_note,
  updated_at = now();
