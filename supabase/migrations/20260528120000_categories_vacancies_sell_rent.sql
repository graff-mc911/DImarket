-- Категорії для меню шапки: базові + Вакансії, Продам/Оренда

INSERT INTO categories (name, slug, icon, description)
SELECT 'Cleaning', 'cleaning', '🧹', 'Home, office, and post-renovation cleaning'
WHERE NOT EXISTS (SELECT 1 FROM categories WHERE slug = 'cleaning');

INSERT INTO categories (name, slug, icon, description)
SELECT 'Construction', 'construction', '🏗️', 'New construction and building projects'
WHERE NOT EXISTS (SELECT 1 FROM categories WHERE slug = 'construction');

INSERT INTO categories (name, slug, icon, description)
SELECT 'Electrical', 'electrical', '⚡', 'Electrical work and repairs'
WHERE NOT EXISTS (SELECT 1 FROM categories WHERE slug = 'electrical');

INSERT INTO categories (name, slug, icon, description)
SELECT 'Tools', 'tools', '🔧', 'Tools and equipment'
WHERE NOT EXISTS (SELECT 1 FROM categories WHERE slug = 'tools');

INSERT INTO categories (name, slug, icon, description)
SELECT 'Handyman', 'handyman', '🛠️', 'General handyman services'
WHERE NOT EXISTS (SELECT 1 FROM categories WHERE slug = 'handyman');

INSERT INTO categories (name, slug, icon, description)
SELECT 'Furniture', 'furniture', '🪑', 'Furniture and home furnishings for sale'
WHERE NOT EXISTS (SELECT 1 FROM categories WHERE slug = 'furniture');

INSERT INTO categories (name, slug, icon, description)
SELECT 'Vacancies', 'vacancies', '💼', 'Job vacancies and hiring'
WHERE NOT EXISTS (SELECT 1 FROM categories WHERE slug = 'vacancies');

INSERT INTO categories (name, slug, icon, description)
SELECT 'For sale / Rent', 'sell-rent', '🏷️', 'Items and property for sale or rent'
WHERE NOT EXISTS (SELECT 1 FROM categories WHERE slug = 'sell-rent');
