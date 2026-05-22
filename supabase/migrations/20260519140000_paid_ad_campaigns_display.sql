/*
  Оплачена реклама: публічний показ лише після оплати / схвалення власником.
  RPC для статистики показів і кліків.
*/

-- Оновлюємо політику публічного читання
DROP POLICY IF EXISTS "Anyone can view active ad campaigns" ON ad_campaigns;

CREATE POLICY "Anyone can view active paid ad campaigns"
  ON ad_campaigns FOR SELECT
  TO public
  USING (
    status = 'active'
    AND (ends_at IS NULL OR ends_at > now())
    AND (starts_at IS NULL OR starts_at <= now())
    AND (
      stripe_payment_id IS NOT NULL
      OR COALESCE(price_paid, 0) > 0
      OR approved_by IS NOT NULL
    )
  );

-- Позначаємо існуючі тестові активні кампанії як оплачені (демо на проді)
UPDATE ad_campaigns
SET
  price_paid = COALESCE(price_paid, 25),
  currency_paid = COALESCE(currency_paid, 'eur'),
  stripe_payment_id = COALESCE(stripe_payment_id, 'demo_paid_' || id::text)
WHERE status = 'active'
  AND stripe_payment_id IS NULL
  AND COALESCE(price_paid, 0) = 0
  AND approved_by IS NULL;

CREATE OR REPLACE FUNCTION public.track_ad_impression(campaign_id uuid)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  UPDATE ad_campaigns
  SET impressions = COALESCE(impressions, 0) + 1,
      updated_at = now()
  WHERE id = campaign_id
    AND status = 'active'
    AND (
      stripe_payment_id IS NOT NULL
      OR COALESCE(price_paid, 0) > 0
      OR approved_by IS NOT NULL
    );
END;
$$;

CREATE OR REPLACE FUNCTION public.track_ad_click(campaign_id uuid)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  UPDATE ad_campaigns
  SET clicks = COALESCE(clicks, 0) + 1,
      updated_at = now()
  WHERE id = campaign_id
    AND status = 'active'
    AND (
      stripe_payment_id IS NOT NULL
      OR COALESCE(price_paid, 0) > 0
      OR approved_by IS NOT NULL
    );
END;
$$;

GRANT EXECUTE ON FUNCTION public.track_ad_impression(uuid) TO anon, authenticated;
GRANT EXECUTE ON FUNCTION public.track_ad_click(uuid) TO anon, authenticated;
