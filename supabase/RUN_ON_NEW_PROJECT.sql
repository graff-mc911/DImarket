-- ============================================================
-- Запустіть ОДИН РАЗ у Supabase SQL Editor (проєкт wjlfvajloxkevggwjgtk)
-- Після базових міграцій з supabase/migrations/ (якщо таблиць ще немає —
-- спочатку застосуйте всі файли migrations по порядку, потім цей файл).
-- ============================================================

-- Категорії (якщо порожньо)
INSERT INTO categories (name, slug, icon, description) VALUES
  ('Будівництво', 'construction', '🏗️', 'Нове будівництво'),
  ('Ремонт', 'renovation', '🔨', 'Ремонт і реконструкція'),
  ('Електрика', 'electrical', '⚡', 'Електромонтаж'),
  ('Сантехніка', 'plumbing', '🚿', 'Сантехнічні роботи'),
  ('Майстер на годину', 'handyman', '🛠️', 'Дрібні роботи'),
  ('Матеріали', 'materials', '🪵', 'Матеріали'),
  ('Інструменти', 'tools', '🔧', 'Інструменти')
ON CONFLICT (slug) DO NOTHING;

-- Статистика платформи (один рядок)
INSERT INTO app_site_stats (id, total_visits, total_listings_created, total_professionals)
VALUES (1, 0, 0, 0)
ON CONFLICT (id) DO NOTHING;

-- Перевірка
SELECT 'categories' AS tbl, COUNT(*)::int AS cnt FROM categories
UNION ALL
SELECT 'app_site_stats', COUNT(*)::int FROM app_site_stats;
