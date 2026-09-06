-- Restore platform site categories as main so Home / Categories / mega-menu show them
-- alongside construction trade groups. Fixes missing handyman, accountants, sell-rent, vacancies.

INSERT INTO public.categories (name, slug, icon, description)
SELECT v.name, v.slug, v.icon, v.description
FROM (VALUES
  ('Прибирання / клінінг', 'cleaning', '🧹', 'Home and office cleaning'),
  ('Будівництво', 'construction', '🏗️', 'Construction and renovation'),
  ('СТО / ремонт авто', 'electrical', '🚗', 'Auto repair'),
  ('Перевезення / логістика', 'tools', '🚚', 'Transport and logistics'),
  ('Домашній майстер', 'handyman', '🛠️', 'Home handyman services'),
  ('Меблі', 'furniture', '🪑', 'Furniture'),
  ('Юрист / нотаріус', 'legal-notary', '⚖️', 'Legal and notary'),
  ('Бухгалтери', 'accounting-finance', '📊', 'Accounting and finance'),
  ('Вакансії', 'vacancies', '💼', 'Job vacancies'),
  ('Здам / Продам', 'sell-rent', '🛒', 'Rent and sell listings')
) AS v(name, slug, icon, description)
WHERE NOT EXISTS (SELECT 1 FROM public.categories c WHERE c.slug = v.slug);

UPDATE public.categories
SET
  is_main = true,
  is_service = false,
  parent_id = null,
  updated_at = now(),
  name = CASE slug
    WHEN 'handyman' THEN 'Домашній майстер'
    WHEN 'accounting-finance' THEN 'Бухгалтери'
    WHEN 'vacancies' THEN 'Вакансії'
    WHEN 'sell-rent' THEN 'Здам / Продам'
    WHEN 'cleaning' THEN 'Прибирання / клінінг'
    WHEN 'furniture' THEN 'Меблі'
    WHEN 'legal-notary' THEN 'Юрист / нотаріус'
    WHEN 'tools' THEN 'Перевезення / логістика'
    WHEN 'electrical' THEN 'СТО / ремонт авто'
    WHEN 'construction' THEN 'Будівництво'
    ELSE name
  END,
  sort_order = CASE slug
    WHEN 'construction' THEN 10
    WHEN 'handyman' THEN 20
    WHEN 'cleaning' THEN 30
    WHEN 'furniture' THEN 40
    WHEN 'electrical' THEN 50
    WHEN 'tools' THEN 60
    WHEN 'legal-notary' THEN 70
    WHEN 'accounting-finance' THEN 80
    WHEN 'sell-rent' THEN 90
    WHEN 'vacancies' THEN 100
    ELSE sort_order
  END,
  name_i18n = coalesce(name_i18n, '{}'::jsonb) || jsonb_build_object(
    'uk', CASE slug
      WHEN 'handyman' THEN 'Домашній майстер'
      WHEN 'accounting-finance' THEN 'Бухгалтери'
      WHEN 'vacancies' THEN 'Вакансії'
      WHEN 'sell-rent' THEN 'Здам / Продам'
      WHEN 'cleaning' THEN 'Прибирання / клінінг'
      WHEN 'furniture' THEN 'Меблі'
      WHEN 'legal-notary' THEN 'Юрист / нотаріус'
      WHEN 'tools' THEN 'Перевезення / логістика'
      WHEN 'electrical' THEN 'СТО / ремонт авто'
      WHEN 'construction' THEN 'Будівництво'
      ELSE name
    END,
    'en', CASE slug
      WHEN 'handyman' THEN 'Home handyman'
      WHEN 'accounting-finance' THEN 'Accountants'
      WHEN 'vacancies' THEN 'Jobs'
      WHEN 'sell-rent' THEN 'Rent / Sell'
      WHEN 'cleaning' THEN 'Cleaning'
      WHEN 'furniture' THEN 'Furniture'
      WHEN 'legal-notary' THEN 'Lawyer / Notary'
      WHEN 'tools' THEN 'Transport / logistics'
      WHEN 'electrical' THEN 'Auto repair'
      WHEN 'construction' THEN 'Construction'
      ELSE coalesce(name_i18n->>'en', name)
    END
  ),
  icon_key = coalesce(nullif(icon_key, ''), slug)
WHERE slug IN (
  'cleaning', 'construction', 'electrical', 'tools', 'handyman', 'furniture',
  'legal-notary', 'accounting-finance', 'vacancies', 'sell-rent'
);
