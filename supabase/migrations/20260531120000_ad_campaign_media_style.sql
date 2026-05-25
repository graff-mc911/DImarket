-- Налаштування кадрування / фільтрів / слайдшоу банера
ALTER TABLE ad_campaigns ADD COLUMN IF NOT EXISTS media_style jsonb DEFAULT '{}';
