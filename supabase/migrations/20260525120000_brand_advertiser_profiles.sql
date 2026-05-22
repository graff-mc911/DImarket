/*
  Демо-рекламодавці для брендів на банерах.
  Повне створення (auth.users + profiles + campaigns):
    node scripts/seed-brand-advertisers.mjs
  Потрібен SUPABASE_SERVICE_ROLE_KEY у .env.local

  Після seed — власник може видаляти кампанії в /dashboard.
*/

-- Власник сайту може видаляти будь-яку рекламну кампанію
DROP POLICY IF EXISTS "Site owners can delete ad campaigns" ON ad_campaigns;
CREATE POLICY "Site owners can delete ad campaigns"
  ON ad_campaigns FOR DELETE
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM profiles WHERE id = auth.uid() AND is_site_owner = true
    )
  );

-- Привʼязка кампаній до окремих профілів (якщо профілі вже створені скриптом)
UPDATE ad_campaigns SET advertiser_id = 'e1000001-0001-4001-8001-000000000001', updated_at = now()
WHERE id = 'f81e653d-ca9e-4081-a4ca-2a17395e9924';

UPDATE ad_campaigns SET advertiser_id = 'e1000002-0002-4002-8002-000000000002', updated_at = now()
WHERE id = '89623059-83ca-4151-9f09-8fcfcb8ed889';

UPDATE ad_campaigns SET advertiser_id = 'e1000003-0003-4003-8003-000000000003', updated_at = now()
WHERE id = '0431275c-451e-47ed-a7a7-44167a577a29';

UPDATE ad_campaigns SET advertiser_id = 'e1000004-0004-4004-8004-000000000004', updated_at = now()
WHERE id = '1ec41ada-4feb-4a36-b1a9-8494622ea30f';

UPDATE ad_campaigns SET advertiser_id = 'e1000005-0005-4005-8005-000000000005', updated_at = now()
WHERE id = '28885e84-4be9-4ba7-8fa8-fac766c5f1f8';

UPDATE ad_campaigns SET advertiser_id = 'e1000006-0006-4006-8006-000000000006', updated_at = now()
WHERE id = '807b9715-ddcd-4d1f-b651-711a880a2c77';

UPDATE ad_campaigns SET advertiser_id = 'e1000007-0007-4007-8007-000000000007', updated_at = now()
WHERE id = '6097ef50-bb68-4041-b83f-32ecee542aad';

UPDATE ad_campaigns SET advertiser_id = 'e1000008-0008-4008-8008-000000000008', updated_at = now()
WHERE id = '69df3b9f-c702-4028-b998-fc3734dc76ed';

UPDATE ad_campaigns SET advertiser_id = 'e1000009-0009-4009-8009-000000000009', updated_at = now()
WHERE id = 'a1000001-0001-4001-8001-000000000001';

UPDATE ad_campaigns SET advertiser_id = 'e1000010-0010-4010-8010-000000000010', updated_at = now()
WHERE id = 'a1000002-0002-4002-8002-000000000002';

UPDATE ad_campaigns SET advertiser_id = 'e1000011-0011-4011-8011-000000000011', updated_at = now()
WHERE id = 'a1000003-0003-4003-8003-000000000003';

UPDATE ad_campaigns SET advertiser_id = 'e1000012-0012-4012-8012-000000000012', updated_at = now()
WHERE id = 'a1000004-0004-4004-8004-000000000004';
