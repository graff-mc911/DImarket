-- Окреме зображення / анімація для кожного рекламного слота
ALTER TABLE public.ad_campaigns
  ADD COLUMN IF NOT EXISTS slot_media jsonb NOT NULL DEFAULT '{}'::jsonb;

COMMENT ON COLUMN public.ad_campaigns.slot_media IS
  'Map slot_id → { mediaUrl, mediaType, slideUrls, mediaStyle }';
