-- ============================================================
-- Marketplace categories: main trades + services, cover images,
-- stats for premium Choose Category UI
-- ============================================================

ALTER TABLE categories
  ADD COLUMN IF NOT EXISTS cover_image_url text,
  ADD COLUMN IF NOT EXISTS sort_order integer NOT NULL DEFAULT 0,
  ADD COLUMN IF NOT EXISTS is_main boolean NOT NULL DEFAULT false,
  ADD COLUMN IF NOT EXISTS is_service boolean NOT NULL DEFAULT false,
  ADD COLUMN IF NOT EXISTS icon_key text,
  ADD COLUMN IF NOT EXISTS name_i18n jsonb NOT NULL DEFAULT '{}'::jsonb,
  ADD COLUMN IF NOT EXISTS description_i18n jsonb NOT NULL DEFAULT '{}'::jsonb,
  ADD COLUMN IF NOT EXISTS services_count integer NOT NULL DEFAULT 0,
  ADD COLUMN IF NOT EXISTS professionals_count integer NOT NULL DEFAULT 0,
  ADD COLUMN IF NOT EXISTS avg_rating numeric(4,2),
  ADD COLUMN IF NOT EXISTS updated_at timestamptz NOT NULL DEFAULT now();

CREATE INDEX IF NOT EXISTS idx_categories_main ON categories(is_main, sort_order)
  WHERE is_main = true;
CREATE INDEX IF NOT EXISTS idx_categories_parent ON categories(parent_id, sort_order);
CREATE INDEX IF NOT EXISTS idx_categories_slug ON categories(slug);

-- Upsert helper
CREATE OR REPLACE FUNCTION public.upsert_marketplace_category(
  p_slug text,
  p_name text,
  p_parent_slug text DEFAULT NULL,
  p_icon text DEFAULT NULL,
  p_icon_key text DEFAULT NULL,
  p_cover text DEFAULT NULL,
  p_is_main boolean DEFAULT false,
  p_is_service boolean DEFAULT false,
  p_sort integer DEFAULT 0,
  p_name_i18n jsonb DEFAULT '{}'::jsonb,
  p_description_i18n jsonb DEFAULT '{}'::jsonb
)
RETURNS uuid
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_parent uuid;
  v_id uuid;
BEGIN
  IF p_parent_slug IS NOT NULL THEN
    SELECT id INTO v_parent FROM categories WHERE slug = p_parent_slug LIMIT 1;
  END IF;

  SELECT id INTO v_id FROM categories WHERE slug = p_slug LIMIT 1;

  IF v_id IS NULL THEN
    INSERT INTO categories (
      name, slug, parent_id, icon, icon_key, cover_image_url,
      is_main, is_service, sort_order, name_i18n, description_i18n, description
    ) VALUES (
      p_name, p_slug, v_parent, p_icon, p_icon_key, p_cover,
      p_is_main, p_is_service, p_sort, p_name_i18n, p_description_i18n,
      COALESCE(p_description_i18n->>'en', p_name)
    )
    RETURNING id INTO v_id;
  ELSE
    UPDATE categories SET
      name = p_name,
      parent_id = COALESCE(v_parent, parent_id),
      icon = COALESCE(p_icon, icon),
      icon_key = COALESCE(p_icon_key, icon_key),
      cover_image_url = COALESCE(p_cover, cover_image_url),
      is_main = p_is_main,
      is_service = p_is_service,
      sort_order = p_sort,
      name_i18n = CASE WHEN p_name_i18n = '{}'::jsonb THEN name_i18n ELSE p_name_i18n END,
      description_i18n = CASE WHEN p_description_i18n = '{}'::jsonb THEN description_i18n ELSE p_description_i18n END,
      description = COALESCE(p_description_i18n->>'en', description, p_name),
      updated_at = now()
    WHERE id = v_id;
  END IF;

  RETURN v_id;
END;
$$;

-- Seed main categories (construction trades)
DO $$
DECLARE
  root_id uuid;
BEGIN
  -- Ensure construction root exists (not shown as main card)
  SELECT public.upsert_marketplace_category(
    'construction', 'Construction', NULL, '🏗️', 'building',
    'https://images.unsplash.com/photo-1503387762-592deb58ef4e?auto=format&fit=crop&w=1200&q=80',
    false, false, 0,
    '{"en":"Construction","uk":"Будівництво","ru":"Строительство","de":"Bauwesen","es":"Construcción"}'::jsonb,
    '{"en":"All construction and renovation trades on DImarket."}'::jsonb
  ) INTO root_id;

  PERFORM public.upsert_marketplace_category('demolition','Demolition','construction','🧱','hammer',
    'https://images.unsplash.com/photo-1504307651254-35680f356dfd?auto=format&fit=crop&w=1200&q=80',
    true,false,10,
    '{"en":"Demolition","uk":"Демонтаж","ru":"Демонтаж","de":"Abriss","es":"Demolición"}'::jsonb,
    '{"en":"Safe demolition of walls, floors, ceilings and debris removal.","uk":"Безпечний демонтаж стін, підлоги, стелі та вивіз сміття."}'::jsonb);
  PERFORM public.upsert_marketplace_category('earthworks','Earthworks','construction','⛏️','shovel',
    'https://images.unsplash.com/photo-1581094794329-c8112a89af12?auto=format&fit=crop&w=1200&q=80',
    true,false,20,
    '{"en":"Earthworks","uk":"Земляні роботи","ru":"Земляные работы","de":"Erdarbeiten","es":"Movimiento de tierras"}'::jsonb,
    '{"en":"Excavation, trenching, grading and drainage."}'::jsonb);
  PERFORM public.upsert_marketplace_category('foundation','Foundations','construction','🏗️','building-2',
    'https://images.unsplash.com/photo-1541888946425-d81bb19240f5?auto=format&fit=crop&w=1200&q=80',
    true,false,30,
    '{"en":"Foundations","uk":"Фундамент","ru":"Фундамент","de":"Fundamente","es":"Cimentaciones"}'::jsonb,
    '{"en":"Strip, slab and pier foundations with waterproofing."}'::jsonb);
  PERFORM public.upsert_marketplace_category('concrete','Concrete','construction','🪨','boxes',
    'https://images.unsplash.com/photo-1590674899484-d5640e854abe?auto=format&fit=crop&w=1200&q=80',
    true,false,40,
    '{"en":"Concrete","uk":"Бетонні роботи","ru":"Бетонные работы","de":"Betonarbeiten","es":"Hormigón"}'::jsonb,
    '{"en":"Concreting, screeds, stairs, paths and formwork."}'::jsonb);
  PERFORM public.upsert_marketplace_category('masonry','Masonry','construction','🧱','brick-wall',
    'https://images.unsplash.com/photo-1590086782792-42dd2350140d?auto=format&fit=crop&w=1200&q=80',
    true,false,50,
    '{"en":"Masonry","uk":"Мурування","ru":"Кладка","de":"Maurerarbeiten","es":"Albañilería"}'::jsonb,
    '{"en":"Brick, block and stone masonry for walls and partitions."}'::jsonb);
  PERFORM public.upsert_marketplace_category('roofing','Roofing','construction','🏠','home',
    'https://images.unsplash.com/photo-1632778149956-c0c3c768f3e2?auto=format&fit=crop&w=1200&q=80',
    true,false,60,
    '{"en":"Roofing","uk":"Покрівля","ru":"Кровля","de":"Dacharbeiten","es":"Cubiertas"}'::jsonb,
    '{"en":"Roof installation, repair, waterproofing and gutters."}'::jsonb);
  PERFORM public.upsert_marketplace_category('facade','Facade','construction','🏡','panels-top-left',
    'https://images.unsplash.com/photo-1486406146926-c627a92ad1ab?auto=format&fit=crop&w=1200&q=80',
    true,false,70,
    '{"en":"Facade","uk":"Фасади","ru":"Фасады","de":"Fassade","es":"Fachadas"}'::jsonb,
    '{"en":"Facade insulation, plaster, cladding and repair."}'::jsonb);
  PERFORM public.upsert_marketplace_category('plastering','Plastering','construction','🧱','paintbrush',
    'https://images.unsplash.com/photo-1562259949-e8e7689d7828?auto=format&fit=crop&w=1200&q=80',
    true,false,80,
    '{"en":"Plastering","uk":"Штукатурка","ru":"Штукатурка","de":"Putzarbeiten","es":"Enlucido"}'::jsonb,
    '{"en":"Machine and manual plastering for smooth walls."}'::jsonb);
  PERFORM public.upsert_marketplace_category('painting','Painting','construction','🎨','paintbrush',
    'https://images.unsplash.com/photo-1562259949-e8e7689d7828?auto=format&fit=crop&w=1200&q=80',
    true,false,90,
    '{"en":"Painting","uk":"Малярні роботи","ru":"Малярные работы","de":"Malerarbeiten","es":"Pintura"}'::jsonb,
    '{"en":"Interior and exterior painting, putty and priming."}'::jsonb);
  PERFORM public.upsert_marketplace_category('wallpaper','Wallpaper','construction','🖼️','layers',
    'https://images.unsplash.com/photo-1615876234076-c5d6d8e6f0a0?auto=format&fit=crop&w=1200&q=80',
    true,false,100,
    '{"en":"Wallpaper","uk":"Шпалери","ru":"Обои","de":"Tapeten","es":"Papel pintado"}'::jsonb,
    '{"en":"Wallpaper installation and removal for every room."}'::jsonb);
  PERFORM public.upsert_marketplace_category('drywall','Drywall','construction','📐','panels-top-left',
    'https://images.unsplash.com/photo-1503387762-592deb58ef4e?auto=format&fit=crop&w=1200&q=80',
    true,false,110,
    '{"en":"Drywall","uk":"Гіпсокартон","ru":"Гипсокартон","de":"Trockenbau","es":"Pladur"}'::jsonb,
    '{"en":"Drywall installation, partitions and ceilings."}'::jsonb);
  PERFORM public.upsert_marketplace_category('tiling','Tile Installation','construction','⬜','grid-3x3',
    'https://images.unsplash.com/photo-1584622650111-993a426fbf0a?auto=format&fit=crop&w=1200&q=80',
    true,false,120,
    '{"en":"Tile Installation","uk":"Плитка","ru":"Плитка","de":"Fliesen","es":"Alicatado"}'::jsonb,
    '{"en":"Floor and wall tiling for bathrooms, kitchens and more."}'::jsonb);
  PERFORM public.upsert_marketplace_category('flooring','Flooring','construction','🪵','layers',
    'https://images.unsplash.com/photo-1581858726788-75bc0f6a952d?auto=format&fit=crop&w=1200&q=80',
    true,false,130,
    '{"en":"Flooring","uk":"Підлога","ru":"Полы","de":"Bodenbeläge","es":"Suelos"}'::jsonb,
    '{"en":"Laminate, parquet, vinyl and other floor coverings."}'::jsonb);
  PERFORM public.upsert_marketplace_category('carpentry','Carpentry','construction','🪚','hammer',
    'https://images.unsplash.com/photo-1504148455328-c376907d081c?auto=format&fit=crop&w=1200&q=80',
    true,false,140,
    '{"en":"Carpentry","uk":"Столярні роботи","ru":"Столярные работы","de":"Schreinerei","es":"Carpintería"}'::jsonb,
    '{"en":"Doors, furniture, custom woodwork and finishes."}'::jsonb);
  PERFORM public.upsert_marketplace_category('windows','Windows','construction','🪟','square',
    'https://images.unsplash.com/photo-1497366216548-37526070297c?auto=format&fit=crop&w=1200&q=80',
    true,false,150,
    '{"en":"Windows","uk":"Вікна","ru":"Окна","de":"Fenster","es":"Ventanas"}'::jsonb,
    '{"en":"Window installation, replacement and sealing."}'::jsonb);
  PERFORM public.upsert_marketplace_category('plumbing','Plumbing','construction','🔧','droplets',
    'https://images.unsplash.com/photo-1607472586893-ed1d13afc1b0?auto=format&fit=crop&w=1200&q=80',
    true,false,160,
    '{"en":"Plumbing","uk":"Сантехніка","ru":"Сантехника","de":"Sanitär","es":"Fontanería"}'::jsonb,
    '{"en":"Pipes, bathrooms, kitchens and leak repairs."}'::jsonb);
  PERFORM public.upsert_marketplace_category('electro','Electrical','construction','⚡','zap',
    'https://images.unsplash.com/photo-1621905251189-08b45d6a269e?auto=format&fit=crop&w=1200&q=80',
    true,false,170,
    '{"en":"Electrical","uk":"Електрика","ru":"Электрика","de":"Elektro","es":"Electricidad"}'::jsonb,
    '{"en":"Wiring, sockets, lighting and electrical upgrades."}'::jsonb);
  PERFORM public.upsert_marketplace_category('hvac','HVAC','construction','❄️','wind',
    'https://images.unsplash.com/photo-1631545806609-8c2f0c1f0f0f?auto=format&fit=crop&w=1200&q=80',
    true,false,180,
    '{"en":"HVAC","uk":"Опалення / клімат","ru":"Отопление / климат","de":"HLK","es":"Climatización"}'::jsonb,
    '{"en":"Heating, ventilation and air conditioning systems."}'::jsonb);
  PERFORM public.upsert_marketplace_category('insulation','Insulation','construction','🧱','thermometer',
    'https://images.unsplash.com/photo-1504307651254-35680f356dfd?auto=format&fit=crop&w=1200&q=80',
    true,false,190,
    '{"en":"Insulation","uk":"Утеплення","ru":"Утепление","de":"Dämmung","es":"Aislamiento"}'::jsonb,
    '{"en":"Thermal and acoustic insulation for comfort and savings."}'::jsonb);
  PERFORM public.upsert_marketplace_category('welding','Welding','construction','🔥','flame',
    'https://images.unsplash.com/photo-1504328345606-18bbc8c9d7d1?auto=format&fit=crop&w=1200&q=80',
    true,false,200,
    '{"en":"Welding","uk":"Зварювання","ru":"Сварка","de":"Schweißen","es":"Soldadura"}'::jsonb,
    '{"en":"Professional welding for structures and repairs."}'::jsonb);
  PERFORM public.upsert_marketplace_category('metal','Metal Structures','construction','⚙️','wrench',
    'https://images.unsplash.com/photo-1565793298595-6a879b1d9492?auto=format&fit=crop&w=1200&q=80',
    true,false,210,
    '{"en":"Metal Structures","uk":"Металоконструкції","ru":"Металлоконструкции","de":"Metallbau","es":"Estructuras metálicas"}'::jsonb,
    '{"en":"Custom metal frames, gates and structural steel."}'::jsonb);
  PERFORM public.upsert_marketplace_category('glass','Glass','construction','🪟','square',
    'https://images.unsplash.com/photo-1497366811353-6870744d04b2?auto=format&fit=crop&w=1200&q=80',
    true,false,220,
    '{"en":"Glass","uk":"Скло","ru":"Стекло","de":"Glas","es":"Cristalería"}'::jsonb,
    '{"en":"Shower glass, mirrors, doors and facade glazing."}'::jsonb);
  PERFORM public.upsert_marketplace_category('landscaping','Landscape','construction','🌳','trees',
    'https://images.unsplash.com/photo-1558904541-efa843a96f01?auto=format&fit=crop&w=1200&q=80',
    true,false,230,
    '{"en":"Landscape","uk":"Ландшафт","ru":"Ландшафт","de":"Landschaftsbau","es":"Paisajismo"}'::jsonb,
    '{"en":"Paving, fences, planting and outdoor living spaces."}'::jsonb);
  PERFORM public.upsert_marketplace_category('pools','Pools','construction','🏊','waves',
    'https://images.unsplash.com/photo-1576013551627-0cc20b96c2a7?auto=format&fit=crop&w=1200&q=80',
    true,false,240,
    '{"en":"Pools","uk":"Басейни","ru":"Бассейны","de":"Pools","es":"Piscinas"}'::jsonb,
    '{"en":"Pool construction, repair and maintenance."}'::jsonb);
  PERFORM public.upsert_marketplace_category('solar','Solar','construction','☀️','sun',
    'https://images.unsplash.com/photo-1509391366360-2e959784a276?auto=format&fit=crop&w=1200&q=80',
    true,false,250,
    '{"en":"Solar","uk":"Сонячні системи","ru":"Солнечные системы","de":"Solar","es":"Solar"}'::jsonb,
    '{"en":"Solar panels, inverters and battery storage."}'::jsonb);
  PERFORM public.upsert_marketplace_category('smart-home','Smart Home','construction','🏡','cpu',
    'https://images.unsplash.com/photo-1558002038-1055907df827?auto=format&fit=crop&w=1200&q=80',
    true,false,260,
    '{"en":"Smart Home","uk":"Розумний дім","ru":"Умный дом","de":"Smart Home","es":"Hogar inteligente"}'::jsonb,
    '{"en":"Home automation, lighting control and smart security."}'::jsonb);
  PERFORM public.upsert_marketplace_category('design-engineering','Engineering','construction','📐','ruler',
    'https://images.unsplash.com/photo-1503387762-592deb58ef4e?auto=format&fit=crop&w=1200&q=80',
    true,false,270,
    '{"en":"Engineering","uk":"Інженерія","ru":"Инженерия","de":"Planung","es":"Ingeniería"}'::jsonb,
    '{"en":"Architecture, structural engineering and interior design."}'::jsonb);
END $$;

-- Seed services (subcategories)
DO $$
BEGIN
  PERFORM public.upsert_marketplace_category('demolition-walls', 'Wall demolition', 'demolition', NULL, NULL, NULL, false, true, 10, '{"en":"Wall demolition","uk":"Демонтаж стін","ru":"Демонтаж стен"}'::jsonb, '{}'::jsonb);
  PERFORM public.upsert_marketplace_category('demolition-partitions', 'Partition demolition', 'demolition', NULL, NULL, NULL, false, true, 20, '{"en":"Partition demolition","uk":"Демонтаж перегородок","ru":"Демонтаж перегородок"}'::jsonb, '{}'::jsonb);
  PERFORM public.upsert_marketplace_category('demolition-tile', 'Tile removal', 'demolition', NULL, NULL, NULL, false, true, 30, '{"en":"Tile removal","uk":"Демонтаж плитки","ru":"Демонтаж плитки"}'::jsonb, '{}'::jsonb);
  PERFORM public.upsert_marketplace_category('demolition-floor', 'Floor demolition', 'demolition', NULL, NULL, NULL, false, true, 40, '{"en":"Floor demolition","uk":"Демонтаж підлоги","ru":"Демонтаж пола"}'::jsonb, '{}'::jsonb);
  PERFORM public.upsert_marketplace_category('demolition-laminate', 'Laminate removal', 'demolition', NULL, NULL, NULL, false, true, 50, '{"en":"Laminate removal","uk":"Демонтаж ламінату","ru":"Демонтаж ламината"}'::jsonb, '{}'::jsonb);
  PERFORM public.upsert_marketplace_category('demolition-parquet', 'Parquet removal', 'demolition', NULL, NULL, NULL, false, true, 60, '{"en":"Parquet removal","uk":"Демонтаж паркету","ru":"Демонтаж паркета"}'::jsonb, '{}'::jsonb);
  PERFORM public.upsert_marketplace_category('demolition-doors', 'Door removal', 'demolition', NULL, NULL, NULL, false, true, 70, '{"en":"Door removal","uk":"Демонтаж дверей","ru":"Демонтаж дверей"}'::jsonb, '{}'::jsonb);
  PERFORM public.upsert_marketplace_category('demolition-windows', 'Window removal', 'demolition', NULL, NULL, NULL, false, true, 80, '{"en":"Window removal","uk":"Демонтаж вікон","ru":"Демонтаж окон"}'::jsonb, '{}'::jsonb);
  PERFORM public.upsert_marketplace_category('demolition-ceiling', 'Ceiling demolition', 'demolition', NULL, NULL, NULL, false, true, 90, '{"en":"Ceiling demolition","uk":"Демонтаж стелі","ru":"Демонтаж потолка"}'::jsonb, '{}'::jsonb);
  PERFORM public.upsert_marketplace_category('demolition-plumbing', 'Plumbing demolition', 'demolition', NULL, NULL, NULL, false, true, 100, '{"en":"Plumbing demolition","uk":"Демонтаж сантехніки","ru":"Демонтаж сантехники"}'::jsonb, '{}'::jsonb);
  PERFORM public.upsert_marketplace_category('demolition-electrical', 'Electrical demolition', 'demolition', NULL, NULL, NULL, false, true, 110, '{"en":"Electrical demolition","uk":"Демонтаж електрики","ru":"Демонтаж электрики"}'::jsonb, '{}'::jsonb);
  PERFORM public.upsert_marketplace_category('demolition-debris-removal', 'Construction debris removal', 'demolition', NULL, NULL, NULL, false, true, 120, '{"en":"Construction debris removal","uk":"Вивіз будівельного сміття","ru":"Вывоз строительного мусора"}'::jsonb, '{}'::jsonb);
  PERFORM public.upsert_marketplace_category('earthworks-trenching', 'Trench digging', 'earthworks', NULL, NULL, NULL, false, true, 10, '{"en":"Trench digging","uk":"Копання траншей","ru":"Копание траншей"}'::jsonb, '{}'::jsonb);
  PERFORM public.upsert_marketplace_category('earthworks-excavation', 'Excavation', 'earthworks', NULL, NULL, NULL, false, true, 20, '{"en":"Excavation","uk":"Копання котлованів","ru":"Копание котлованов"}'::jsonb, '{}'::jsonb);
  PERFORM public.upsert_marketplace_category('earthworks-grading', 'Site grading', 'earthworks', NULL, NULL, NULL, false, true, 30, '{"en":"Site grading","uk":"Планування ділянки","ru":"Планировка участка"}'::jsonb, '{}'::jsonb);
  PERFORM public.upsert_marketplace_category('earthworks-backfill', 'Backfill', 'earthworks', NULL, NULL, NULL, false, true, 40, '{"en":"Backfill","uk":"Засипка","ru":"Засыпка"}'::jsonb, '{}'::jsonb);
  PERFORM public.upsert_marketplace_category('earthworks-compaction', 'Soil compaction', 'earthworks', NULL, NULL, NULL, false, true, 50, '{"en":"Soil compaction","uk":"Ущільнення ґрунту","ru":"Уплотнение грунта"}'::jsonb, '{}'::jsonb);
  PERFORM public.upsert_marketplace_category('earthworks-drainage', 'Drainage work', 'earthworks', NULL, NULL, NULL, false, true, 60, '{"en":"Drainage work","uk":"Дренажні роботи","ru":"Дренажные работы"}'::jsonb, '{}'::jsonb);
  PERFORM public.upsert_marketplace_category('foundation-strip', 'Strip foundation', 'foundation', NULL, NULL, NULL, false, true, 10, '{"en":"Strip foundation","uk":"Стрічковий фундамент","ru":"Ленточный фундамент"}'::jsonb, '{}'::jsonb);
  PERFORM public.upsert_marketplace_category('foundation-slab', 'Slab foundation', 'foundation', NULL, NULL, NULL, false, true, 20, '{"en":"Slab foundation","uk":"Плитний фундамент","ru":"Плитный фундамент"}'::jsonb, '{}'::jsonb);
  PERFORM public.upsert_marketplace_category('foundation-pier', 'Pier foundation', 'foundation', NULL, NULL, NULL, false, true, 30, '{"en":"Pier foundation","uk":"Стовпчастий фундамент","ru":"Столбчатый фундамент"}'::jsonb, '{}'::jsonb);
  PERFORM public.upsert_marketplace_category('foundation-rebar', 'Foundation rebar', 'foundation', NULL, NULL, NULL, false, true, 40, '{"en":"Foundation rebar","uk":"Армування фундаменту","ru":"Армирование фундамента"}'::jsonb, '{}'::jsonb);
  PERFORM public.upsert_marketplace_category('foundation-waterproofing', 'Foundation waterproofing', 'foundation', NULL, NULL, NULL, false, true, 50, '{"en":"Foundation waterproofing","uk":"Гідроізоляція фундаменту","ru":"Гидроизоляция фундамента"}'::jsonb, '{}'::jsonb);
  PERFORM public.upsert_marketplace_category('foundation-concrete-pour', 'Concrete pour', 'foundation', NULL, NULL, NULL, false, true, 60, '{"en":"Concrete pour","uk":"Заливка бетону","ru":"Заливка бетона"}'::jsonb, '{}'::jsonb);
  PERFORM public.upsert_marketplace_category('concrete-concreting', 'Concreting', 'concrete', NULL, NULL, NULL, false, true, 10, '{"en":"Concreting","uk":"Бетонування","ru":"Бетонирование"}'::jsonb, '{}'::jsonb);
  PERFORM public.upsert_marketplace_category('concrete-slab-pour', 'Slab pouring', 'concrete', NULL, NULL, NULL, false, true, 20, '{"en":"Slab pouring","uk":"Заливка плит","ru":"Заливка плит"}'::jsonb, '{}'::jsonb);
  PERFORM public.upsert_marketplace_category('concrete-stairs', 'Concrete stairs', 'concrete', NULL, NULL, NULL, false, true, 30, '{"en":"Concrete stairs","uk":"Бетонні сходи","ru":"Бетонные лестницы"}'::jsonb, '{}'::jsonb);
  PERFORM public.upsert_marketplace_category('concrete-platforms', 'Concrete platforms', 'concrete', NULL, NULL, NULL, false, true, 40, '{"en":"Concrete platforms","uk":"Бетонні площадки","ru":"Бетонные площадки"}'::jsonb, '{}'::jsonb);
  PERFORM public.upsert_marketplace_category('concrete-paths', 'Concrete paths', 'concrete', NULL, NULL, NULL, false, true, 50, '{"en":"Concrete paths","uk":"Бетонні доріжки","ru":"Бетонные дорожки"}'::jsonb, '{}'::jsonb);
  PERFORM public.upsert_marketplace_category('concrete-rebar', 'Rebar', 'concrete', NULL, NULL, NULL, false, true, 60, '{"en":"Rebar","uk":"Армування","ru":"Армирование"}'::jsonb, '{}'::jsonb);
  PERFORM public.upsert_marketplace_category('concrete-formwork', 'Formwork', 'concrete', NULL, NULL, NULL, false, true, 70, '{"en":"Formwork","uk":"Опалубка","ru":"Опалубка"}'::jsonb, '{}'::jsonb);
  PERFORM public.upsert_marketplace_category('concrete-screed', 'Screed', 'concrete', NULL, NULL, NULL, false, true, 80, '{"en":"Screed","uk":"Стяжка","ru":"Стяжка"}'::jsonb, '{}'::jsonb);
  PERFORM public.upsert_marketplace_category('masonry-brick', 'Brick masonry', 'masonry', NULL, NULL, NULL, false, true, 10, '{"en":"Brick masonry","uk":"Цегляна кладка","ru":"Кирпичная кладка"}'::jsonb, '{}'::jsonb);
  PERFORM public.upsert_marketplace_category('masonry-aerated-block', 'Aerated concrete block', 'masonry', NULL, NULL, NULL, false, true, 20, '{"en":"Aerated concrete block","uk":"Газоблок","ru":"Газоблок"}'::jsonb, '{}'::jsonb);
  PERFORM public.upsert_marketplace_category('masonry-foam-block', 'Foam block', 'masonry', NULL, NULL, NULL, false, true, 30, '{"en":"Foam block","uk":"Піноблок","ru":"Пеноблок"}'::jsonb, '{}'::jsonb);
  PERFORM public.upsert_marketplace_category('masonry-ceramic-block', 'Ceramic block', 'masonry', NULL, NULL, NULL, false, true, 40, '{"en":"Ceramic block","uk":"Керамоблок","ru":"Керамоблок"}'::jsonb, '{}'::jsonb);
  PERFORM public.upsert_marketplace_category('masonry-stone', 'Stone masonry', 'masonry', NULL, NULL, NULL, false, true, 50, '{"en":"Stone masonry","uk":"Кам''яна кладка","ru":"Каменная кладка"}'::jsonb, '{}'::jsonb);
  PERFORM public.upsert_marketplace_category('masonry-partitions', 'Partitions', 'masonry', NULL, NULL, NULL, false, true, 60, '{"en":"Partitions","uk":"Перегородки","ru":"Перегородки"}'::jsonb, '{}'::jsonb);
  PERFORM public.upsert_marketplace_category('masonry-load-bearing-walls', 'Load-bearing walls', 'masonry', NULL, NULL, NULL, false, true, 70, '{"en":"Load-bearing walls","uk":"Несучі стіни","ru":"Несущие стены"}'::jsonb, '{}'::jsonb);
  PERFORM public.upsert_marketplace_category('masonry-fireplaces', 'Fireplaces', 'masonry', NULL, NULL, NULL, false, true, 80, '{"en":"Fireplaces","uk":"Каміни","ru":"Камины"}'::jsonb, '{}'::jsonb);
  PERFORM public.upsert_marketplace_category('masonry-chimneys', 'Chimneys', 'masonry', NULL, NULL, NULL, false, true, 90, '{"en":"Chimneys","uk":"Димоходи","ru":"Дымоходы"}'::jsonb, '{}'::jsonb);
  PERFORM public.upsert_marketplace_category('roofing-install', 'Roof installation', 'roofing', NULL, NULL, NULL, false, true, 10, '{"en":"Roof installation","uk":"Монтаж даху","ru":"Монтаж крыши"}'::jsonb, '{}'::jsonb);
  PERFORM public.upsert_marketplace_category('roofing-repair', 'Roof repair', 'roofing', NULL, NULL, NULL, false, true, 20, '{"en":"Roof repair","uk":"Ремонт даху","ru":"Ремонт крыши"}'::jsonb, '{}'::jsonb);
  PERFORM public.upsert_marketplace_category('roofing-metal-tile', 'Metal tile roofing', 'roofing', NULL, NULL, NULL, false, true, 30, '{"en":"Metal tile roofing","uk":"Металочерепиця","ru":"Металлочерепица"}'::jsonb, '{}'::jsonb);
  PERFORM public.upsert_marketplace_category('roofing-bitumen', 'Bitumen roofing', 'roofing', NULL, NULL, NULL, false, true, 40, '{"en":"Bitumen roofing","uk":"Бітумна покрівля","ru":"Битумная кровля"}'::jsonb, '{}'::jsonb);
  PERFORM public.upsert_marketplace_category('roofing-flat-roof', 'Flat roof', 'roofing', NULL, NULL, NULL, false, true, 50, '{"en":"Flat roof","uk":"Плоска покрівля","ru":"Плоская кровля"}'::jsonb, '{}'::jsonb);
  PERFORM public.upsert_marketplace_category('roofing-tile', 'Roof tiles', 'roofing', NULL, NULL, NULL, false, true, 60, '{"en":"Roof tiles","uk":"Черепиця","ru":"Черепица"}'::jsonb, '{}'::jsonb);
  PERFORM public.upsert_marketplace_category('roofing-waterproofing', 'Roof waterproofing', 'roofing', NULL, NULL, NULL, false, true, 70, '{"en":"Roof waterproofing","uk":"Гідроізоляція даху","ru":"Гидроизоляция крыши"}'::jsonb, '{}'::jsonb);
  PERFORM public.upsert_marketplace_category('roofing-insulation', 'Roof insulation', 'roofing', NULL, NULL, NULL, false, true, 80, '{"en":"Roof insulation","uk":"Утеплення даху","ru":"Утепление крыши"}'::jsonb, '{}'::jsonb);
  PERFORM public.upsert_marketplace_category('roofing-gutters', 'Gutter installation', 'roofing', NULL, NULL, NULL, false, true, 90, '{"en":"Gutter installation","uk":"Монтаж водостоків","ru":"Монтаж водостоков"}'::jsonb, '{}'::jsonb);
  PERFORM public.upsert_marketplace_category('roofing-soffits', 'Soffits', 'roofing', NULL, NULL, NULL, false, true, 100, '{"en":"Soffits","uk":"Софіти","ru":"Софиты"}'::jsonb, '{}'::jsonb);
  PERFORM public.upsert_marketplace_category('roofing-gutters-metal', 'Gutters', 'roofing', NULL, NULL, NULL, false, true, 110, '{"en":"Gutters","uk":"Ринви","ru":"Желоба"}'::jsonb, '{}'::jsonb);
  PERFORM public.upsert_marketplace_category('facade-insulation', 'Facade insulation', 'facade', NULL, NULL, NULL, false, true, 10, '{"en":"Facade insulation","uk":"Утеплення фасаду","ru":"Утепление фасада"}'::jsonb, '{}'::jsonb);
  PERFORM public.upsert_marketplace_category('facade-foam', 'Foam insulation', 'facade', NULL, NULL, NULL, false, true, 20, '{"en":"Foam insulation","uk":"Пінопласт","ru":"Пенопласт"}'::jsonb, '{}'::jsonb);
  PERFORM public.upsert_marketplace_category('facade-mineral-wool', 'Mineral wool', 'facade', NULL, NULL, NULL, false, true, 30, '{"en":"Mineral wool","uk":"Мінеральна вата","ru":"Минеральная вата"}'::jsonb, '{}'::jsonb);
  PERFORM public.upsert_marketplace_category('facade-plaster', 'Facade plaster', 'facade', NULL, NULL, NULL, false, true, 40, '{"en":"Facade plaster","uk":"Штукатурка фасаду","ru":"Штукатурка фасада"}'::jsonb, '{}'::jsonb);
  PERFORM public.upsert_marketplace_category('facade-painting', 'Facade painting', 'facade', NULL, NULL, NULL, false, true, 50, '{"en":"Facade painting","uk":"Фарбування фасаду","ru":"Покраска фасада"}'::jsonb, '{}'::jsonb);
  PERFORM public.upsert_marketplace_category('facade-ventilated', 'Ventilated facade', 'facade', NULL, NULL, NULL, false, true, 60, '{"en":"Ventilated facade","uk":"Вентильований фасад","ru":"Вентилируемый фасад"}'::jsonb, '{}'::jsonb);
  PERFORM public.upsert_marketplace_category('facade-clinker', 'Clinker', 'facade', NULL, NULL, NULL, false, true, 70, '{"en":"Clinker","uk":"Клінкер","ru":"Клинкер"}'::jsonb, '{}'::jsonb);
  PERFORM public.upsert_marketplace_category('facade-panels', 'Facade panels', 'facade', NULL, NULL, NULL, false, true, 80, '{"en":"Facade panels","uk":"Фасадні панелі","ru":"Фасадные панели"}'::jsonb, '{}'::jsonb);
  PERFORM public.upsert_marketplace_category('facade-repair', 'Facade repair', 'facade', NULL, NULL, NULL, false, true, 90, '{"en":"Facade repair","uk":"Ремонт фасаду","ru":"Ремонт фасада"}'::jsonb, '{}'::jsonb);
  PERFORM public.upsert_marketplace_category('plastering-machine', 'Machine plastering', 'plastering', NULL, NULL, NULL, false, true, 10, '{"en":"Machine plastering","uk":"Машинна штукатурка","ru":"Машинная штукатурка"}'::jsonb, '{}'::jsonb);
  PERFORM public.upsert_marketplace_category('plastering-manual', 'Manual plastering', 'plastering', NULL, NULL, NULL, false, true, 20, '{"en":"Manual plastering","uk":"Ручна штукатурка","ru":"Ручная штукатурка"}'::jsonb, '{}'::jsonb);
  PERFORM public.upsert_marketplace_category('plastering-gypsum', 'Gypsum plaster', 'plastering', NULL, NULL, NULL, false, true, 30, '{"en":"Gypsum plaster","uk":"Гіпсова штукатурка","ru":"Гипсовая штукатурка"}'::jsonb, '{}'::jsonb);
  PERFORM public.upsert_marketplace_category('plastering-cement', 'Cement plaster', 'plastering', NULL, NULL, NULL, false, true, 40, '{"en":"Cement plaster","uk":"Цементна штукатурка","ru":"Цементная штукатурка"}'::jsonb, '{}'::jsonb);
  PERFORM public.upsert_marketplace_category('plastering-decorative', 'Decorative plaster', 'plastering', NULL, NULL, NULL, false, true, 50, '{"en":"Decorative plaster","uk":"Декоративна штукатурка","ru":"Декоративная штукатурка"}'::jsonb, '{}'::jsonb);
  PERFORM public.upsert_marketplace_category('plastering-leveling', 'Wall leveling', 'plastering', NULL, NULL, NULL, false, true, 60, '{"en":"Wall leveling","uk":"Вирівнювання стін","ru":"Выравнивание стен"}'::jsonb, '{}'::jsonb);
  PERFORM public.upsert_marketplace_category('painting-walls', 'Wall painting', 'painting', NULL, NULL, NULL, false, true, 10, '{"en":"Wall painting","uk":"Фарбування стін","ru":"Покраска стен"}'::jsonb, '{}'::jsonb);
  PERFORM public.upsert_marketplace_category('painting-ceiling', 'Ceiling painting', 'painting', NULL, NULL, NULL, false, true, 20, '{"en":"Ceiling painting","uk":"Фарбування стелі","ru":"Покраска потолка"}'::jsonb, '{}'::jsonb);
  PERFORM public.upsert_marketplace_category('painting-facade', 'Facade painting', 'painting', NULL, NULL, NULL, false, true, 30, '{"en":"Facade painting","uk":"Фарбування фасаду","ru":"Покраска фасада"}'::jsonb, '{}'::jsonb);
  PERFORM public.upsert_marketplace_category('painting-doors', 'Door painting', 'painting', NULL, NULL, NULL, false, true, 40, '{"en":"Door painting","uk":"Фарбування дверей","ru":"Покраска дверей"}'::jsonb, '{}'::jsonb);
  PERFORM public.upsert_marketplace_category('painting-windows', 'Window painting', 'painting', NULL, NULL, NULL, false, true, 50, '{"en":"Window painting","uk":"Фарбування вікон","ru":"Покраска окон"}'::jsonb, '{}'::jsonb);
  PERFORM public.upsert_marketplace_category('painting-metal', 'Metal painting', 'painting', NULL, NULL, NULL, false, true, 60, '{"en":"Metal painting","uk":"Фарбування металу","ru":"Покраска металла"}'::jsonb, '{}'::jsonb);
  PERFORM public.upsert_marketplace_category('painting-putty', 'Puttying', 'painting', NULL, NULL, NULL, false, true, 70, '{"en":"Puttying","uk":"Шпаклювання","ru":"Шпаклевание"}'::jsonb, '{}'::jsonb);
  PERFORM public.upsert_marketplace_category('painting-priming', 'Priming', 'painting', NULL, NULL, NULL, false, true, 80, '{"en":"Priming","uk":"Грунтування","ru":"Грунтование"}'::jsonb, '{}'::jsonb);
  PERFORM public.upsert_marketplace_category('wallpaper-install', 'Wallpaper installation', 'wallpaper', NULL, NULL, NULL, false, true, 10, '{"en":"Wallpaper installation","uk":"Поклейка шпалер","ru":"Поклейка обоев"}'::jsonb, '{}'::jsonb);
  PERFORM public.upsert_marketplace_category('wallpaper-removal', 'Wallpaper removal', 'wallpaper', NULL, NULL, NULL, false, true, 20, '{"en":"Wallpaper removal","uk":"Демонтаж шпалер","ru":"Снятие обоев"}'::jsonb, '{}'::jsonb);
  PERFORM public.upsert_marketplace_category('wallpaper-non-woven', 'Non-woven wallpaper', 'wallpaper', NULL, NULL, NULL, false, true, 30, '{"en":"Non-woven wallpaper","uk":"Флізелінові шпалери","ru":"Флизелиновые обои"}'::jsonb, '{}'::jsonb);
  PERFORM public.upsert_marketplace_category('wallpaper-vinyl', 'Vinyl wallpaper', 'wallpaper', NULL, NULL, NULL, false, true, 40, '{"en":"Vinyl wallpaper","uk":"Вінілові шпалери","ru":"Виниловые обои"}'::jsonb, '{}'::jsonb);
  PERFORM public.upsert_marketplace_category('wallpaper-photo', 'Photo wallpaper', 'wallpaper', NULL, NULL, NULL, false, true, 50, '{"en":"Photo wallpaper","uk":"Фото-шпалери","ru":"Фотообои"}'::jsonb, '{}'::jsonb);
  PERFORM public.upsert_marketplace_category('drywall-install', 'Drywall installation', 'drywall', NULL, NULL, NULL, false, true, 10, '{"en":"Drywall installation","uk":"Монтаж гіпсокартону","ru":"Монтаж гипсокартона"}'::jsonb, '{}'::jsonb);
  PERFORM public.upsert_marketplace_category('drywall-partitions', 'Drywall partitions', 'drywall', NULL, NULL, NULL, false, true, 20, '{"en":"Drywall partitions","uk":"Перегородки","ru":"Перегородки"}'::jsonb, '{}'::jsonb);
  PERFORM public.upsert_marketplace_category('drywall-suspended-ceiling', 'Suspended ceilings', 'drywall', NULL, NULL, NULL, false, true, 30, '{"en":"Suspended ceilings","uk":"Підвісні стелі","ru":"Подвесные потолки"}'::jsonb, '{}'::jsonb);
  PERFORM public.upsert_marketplace_category('drywall-niches', 'Niches', 'drywall', NULL, NULL, NULL, false, true, 40, '{"en":"Niches","uk":"Ніші","ru":"Ниши"}'::jsonb, '{}'::jsonb);
  PERFORM public.upsert_marketplace_category('drywall-boxes', 'Utility boxes', 'drywall', NULL, NULL, NULL, false, true, 50, '{"en":"Utility boxes","uk":"Короби","ru":"Короба"}'::jsonb, '{}'::jsonb);
  PERFORM public.upsert_marketplace_category('drywall-multi-level-ceiling', 'Multi-level ceilings', 'drywall', NULL, NULL, NULL, false, true, 60, '{"en":"Multi-level ceilings","uk":"Багаторівневі стелі","ru":"Многоуровневые потолки"}'::jsonb, '{}'::jsonb);
  PERFORM public.upsert_marketplace_category('drywall-soundproofing', 'Soundproofing', 'drywall', NULL, NULL, NULL, false, true, 70, '{"en":"Soundproofing","uk":"Шумоізоляція","ru":"Шумоизоляция"}'::jsonb, '{}'::jsonb);
  PERFORM public.upsert_marketplace_category('tiling-install', 'Tile installation', 'tiling', NULL, NULL, NULL, false, true, 10, '{"en":"Tile installation","uk":"Укладання плитки","ru":"Укладка плитки"}'::jsonb, '{}'::jsonb);
  PERFORM public.upsert_marketplace_category('tiling-bathroom', 'Bathroom tiling', 'tiling', NULL, NULL, NULL, false, true, 20, '{"en":"Bathroom tiling","uk":"Ванна","ru":"Ванная"}'::jsonb, '{}'::jsonb);
  PERFORM public.upsert_marketplace_category('tiling-kitchen', 'Kitchen tiling', 'tiling', NULL, NULL, NULL, false, true, 30, '{"en":"Kitchen tiling","uk":"Кухня","ru":"Кухня"}'::jsonb, '{}'::jsonb);
  PERFORM public.upsert_marketplace_category('tiling-floor', 'Floor tiling', 'tiling', NULL, NULL, NULL, false, true, 40, '{"en":"Floor tiling","uk":"Підлога","ru":"Пол"}'::jsonb, '{}'::jsonb);
  PERFORM public.upsert_marketplace_category('tiling-walls', 'Wall tiling', 'tiling', NULL, NULL, NULL, false, true, 50, '{"en":"Wall tiling","uk":"Стіни","ru":"Стены"}'::jsonb, '{}'::jsonb);
  PERFORM public.upsert_marketplace_category('tiling-mosaic', 'Mosaic', 'tiling', NULL, NULL, NULL, false, true, 60, '{"en":"Mosaic","uk":"Мозаїка","ru":"Мозаика"}'::jsonb, '{}'::jsonb);
  PERFORM public.upsert_marketplace_category('tiling-porcelain', 'Porcelain tile', 'tiling', NULL, NULL, NULL, false, true, 70, '{"en":"Porcelain tile","uk":"Керамограніт","ru":"Керамогранит"}'::jsonb, '{}'::jsonb);
  PERFORM public.upsert_marketplace_category('tiling-grouting', 'Grouting', 'tiling', NULL, NULL, NULL, false, true, 80, '{"en":"Grouting","uk":"Затирка швів","ru":"Затирка швов"}'::jsonb, '{}'::jsonb);
  PERFORM public.upsert_marketplace_category('tiling-repair', 'Tile repair', 'tiling', NULL, NULL, NULL, false, true, 90, '{"en":"Tile repair","uk":"Ремонт плитки","ru":"Ремонт плитки"}'::jsonb, '{}'::jsonb);
  PERFORM public.upsert_marketplace_category('flooring-laminate', 'Laminate', 'flooring', NULL, NULL, NULL, false, true, 10, '{"en":"Laminate","uk":"Ламінат","ru":"Ламинат"}'::jsonb, '{}'::jsonb);
  PERFORM public.upsert_marketplace_category('flooring-vinyl', 'Vinyl flooring', 'flooring', NULL, NULL, NULL, false, true, 20, '{"en":"Vinyl flooring","uk":"Вініл","ru":"Винил"}'::jsonb, '{}'::jsonb);
  PERFORM public.upsert_marketplace_category('flooring-spc', 'SPC flooring', 'flooring', NULL, NULL, NULL, false, true, 30, '{"en":"SPC flooring","uk":"SPC","ru":"SPC"}'::jsonb, '{}'::jsonb);
  PERFORM public.upsert_marketplace_category('flooring-parquet', 'Parquet', 'flooring', NULL, NULL, NULL, false, true, 40, '{"en":"Parquet","uk":"Паркет","ru":"Паркет"}'::jsonb, '{}'::jsonb);
  PERFORM public.upsert_marketplace_category('flooring-solid-wood', 'Solid wood flooring', 'flooring', NULL, NULL, NULL, false, true, 50, '{"en":"Solid wood flooring","uk":"Масивна дошка","ru":"Массивная доска"}'::jsonb, '{}'::jsonb);
  PERFORM public.upsert_marketplace_category('flooring-linoleum', 'Linoleum', 'flooring', NULL, NULL, NULL, false, true, 60, '{"en":"Linoleum","uk":"Лінолеум","ru":"Линолеум"}'::jsonb, '{}'::jsonb);
  PERFORM public.upsert_marketplace_category('flooring-carpet', 'Carpet', 'flooring', NULL, NULL, NULL, false, true, 70, '{"en":"Carpet","uk":"Ковролін","ru":"Ковролин"}'::jsonb, '{}'::jsonb);
  PERFORM public.upsert_marketplace_category('flooring-epoxy', 'Epoxy floor', 'flooring', NULL, NULL, NULL, false, true, 80, '{"en":"Epoxy floor","uk":"Епоксидна підлога","ru":"Эпоксидный пол"}'::jsonb, '{}'::jsonb);
  PERFORM public.upsert_marketplace_category('flooring-polyurethane', 'Polyurethane floor', 'flooring', NULL, NULL, NULL, false, true, 90, '{"en":"Polyurethane floor","uk":"Поліуретанова підлога","ru":"Полиуретановый пол"}'::jsonb, '{}'::jsonb);
  PERFORM public.upsert_marketplace_category('flooring-screed', 'Floor screed', 'flooring', NULL, NULL, NULL, false, true, 100, '{"en":"Floor screed","uk":"Стяжка","ru":"Стяжка"}'::jsonb, '{}'::jsonb);
  PERFORM public.upsert_marketplace_category('flooring-self-leveling', 'Self-leveling floor', 'flooring', NULL, NULL, NULL, false, true, 110, '{"en":"Self-leveling floor","uk":"Самовирівнююча підлога","ru":"Самовыравнивающийся пол"}'::jsonb, '{}'::jsonb);
  PERFORM public.upsert_marketplace_category('carpentry-doors-install', 'Door installation', 'carpentry', NULL, NULL, NULL, false, true, 10, '{"en":"Door installation","uk":"Монтаж дверей","ru":"Монтаж дверей"}'::jsonb, '{}'::jsonb);
  PERFORM public.upsert_marketplace_category('carpentry-entrance-doors', 'Entrance doors', 'carpentry', NULL, NULL, NULL, false, true, 20, '{"en":"Entrance doors","uk":"Вхідні двері","ru":"Входные двери"}'::jsonb, '{}'::jsonb);
  PERFORM public.upsert_marketplace_category('carpentry-interior-doors', 'Interior doors', 'carpentry', NULL, NULL, NULL, false, true, 30, '{"en":"Interior doors","uk":"Міжкімнатні двері","ru":"Межкомнатные двери"}'::jsonb, '{}'::jsonb);
  PERFORM public.upsert_marketplace_category('carpentry-arches', 'Arches', 'carpentry', NULL, NULL, NULL, false, true, 40, '{"en":"Arches","uk":"Арки","ru":"Арки"}'::jsonb, '{}'::jsonb);
  PERFORM public.upsert_marketplace_category('carpentry-skirting', 'Skirting boards', 'carpentry', NULL, NULL, NULL, false, true, 50, '{"en":"Skirting boards","uk":"Плінтуси","ru":"Плинтусы"}'::jsonb, '{}'::jsonb);
  PERFORM public.upsert_marketplace_category('carpentry-thresholds', 'Thresholds', 'carpentry', NULL, NULL, NULL, false, true, 60, '{"en":"Thresholds","uk":"Пороги","ru":"Пороги"}'::jsonb, '{}'::jsonb);
  PERFORM public.upsert_marketplace_category('carpentry-wood-structures', 'Wood structures', 'carpentry', NULL, NULL, NULL, false, true, 70, '{"en":"Wood structures","uk":"Дерев''яні конструкції","ru":"Деревянные конструкции"}'::jsonb, '{}'::jsonb);
  PERFORM public.upsert_marketplace_category('carpentry-stairs', 'Wood stairs', 'carpentry', NULL, NULL, NULL, false, true, 80, '{"en":"Wood stairs","uk":"Сходи","ru":"Лестницы"}'::jsonb, '{}'::jsonb);
  PERFORM public.upsert_marketplace_category('windows-install', 'Window installation', 'windows', NULL, NULL, NULL, false, true, 10, '{"en":"Window installation","uk":"Монтаж вікон","ru":"Монтаж окон"}'::jsonb, '{}'::jsonb);
  PERFORM public.upsert_marketplace_category('windows-removal', 'Window removal', 'windows', NULL, NULL, NULL, false, true, 20, '{"en":"Window removal","uk":"Демонтаж вікон","ru":"Демонтаж окон"}'::jsonb, '{}'::jsonb);
  PERFORM public.upsert_marketplace_category('windows-pvc', 'PVC windows', 'windows', NULL, NULL, NULL, false, true, 30, '{"en":"PVC windows","uk":"ПВХ вікна","ru":"ПВХ окна"}'::jsonb, '{}'::jsonb);
  PERFORM public.upsert_marketplace_category('windows-aluminum', 'Aluminum windows', 'windows', NULL, NULL, NULL, false, true, 40, '{"en":"Aluminum windows","uk":"Алюмінієві вікна","ru":"Алюминиевые окна"}'::jsonb, '{}'::jsonb);
  PERFORM public.upsert_marketplace_category('windows-wood', 'Wood windows', 'windows', NULL, NULL, NULL, false, true, 50, '{"en":"Wood windows","uk":"Дерев''яні вікна","ru":"Деревянные окна"}'::jsonb, '{}'::jsonb);
  PERFORM public.upsert_marketplace_category('windows-adjustment', 'Window adjustment', 'windows', NULL, NULL, NULL, false, true, 60, '{"en":"Window adjustment","uk":"Регулювання","ru":"Регулировка"}'::jsonb, '{}'::jsonb);
  PERFORM public.upsert_marketplace_category('windows-repair', 'Window repair', 'windows', NULL, NULL, NULL, false, true, 70, '{"en":"Window repair","uk":"Ремонт вікон","ru":"Ремонт окон"}'::jsonb, '{}'::jsonb);
  PERFORM public.upsert_marketplace_category('windows-glass-replacement', 'IGU replacement', 'windows', NULL, NULL, NULL, false, true, 80, '{"en":"IGU replacement","uk":"Заміна склопакетів","ru":"Замена стеклопакетов"}'::jsonb, '{}'::jsonb);
  PERFORM public.upsert_marketplace_category('plumbing-install', 'Plumbing installation', 'plumbing', NULL, NULL, NULL, false, true, 10, '{"en":"Plumbing installation","uk":"Монтаж сантехніки","ru":"Монтаж сантехники"}'::jsonb, '{}'::jsonb);
  PERFORM public.upsert_marketplace_category('plumbing-repair', 'Plumbing repair', 'plumbing', NULL, NULL, NULL, false, true, 20, '{"en":"Plumbing repair","uk":"Ремонт сантехніки","ru":"Ремонт сантехники"}'::jsonb, '{}'::jsonb);
  PERFORM public.upsert_marketplace_category('plumbing-pipes', 'Pipes', 'plumbing', NULL, NULL, NULL, false, true, 30, '{"en":"Pipes","uk":"Труби","ru":"Трубы"}'::jsonb, '{}'::jsonb);
  PERFORM public.upsert_marketplace_category('plumbing-sewer', 'Sewer', 'plumbing', NULL, NULL, NULL, false, true, 40, '{"en":"Sewer","uk":"Каналізація","ru":"Канализация"}'::jsonb, '{}'::jsonb);
  PERFORM public.upsert_marketplace_category('plumbing-water-supply', 'Water supply', 'plumbing', NULL, NULL, NULL, false, true, 50, '{"en":"Water supply","uk":"Водопостачання","ru":"Водоснабжение"}'::jsonb, '{}'::jsonb);
  PERFORM public.upsert_marketplace_category('plumbing-heating', 'Heating plumbing', 'plumbing', NULL, NULL, NULL, false, true, 60, '{"en":"Heating plumbing","uk":"Опалення","ru":"Отопление"}'::jsonb, '{}'::jsonb);
  PERFORM public.upsert_marketplace_category('plumbing-radiators', 'Radiators', 'plumbing', NULL, NULL, NULL, false, true, 70, '{"en":"Radiators","uk":"Радіатори","ru":"Радиаторы"}'::jsonb, '{}'::jsonb);
  PERFORM public.upsert_marketplace_category('plumbing-boilers', 'Water heaters', 'plumbing', NULL, NULL, NULL, false, true, 80, '{"en":"Water heaters","uk":"Бойлери","ru":"Бойлеры"}'::jsonb, '{}'::jsonb);
  PERFORM public.upsert_marketplace_category('plumbing-showers', 'Showers', 'plumbing', NULL, NULL, NULL, false, true, 90, '{"en":"Showers","uk":"Душові","ru":"Душевые"}'::jsonb, '{}'::jsonb);
  PERFORM public.upsert_marketplace_category('plumbing-toilets', 'Toilets', 'plumbing', NULL, NULL, NULL, false, true, 100, '{"en":"Toilets","uk":"Унітази","ru":"Унитазы"}'::jsonb, '{}'::jsonb);
  PERFORM public.upsert_marketplace_category('plumbing-sinks', 'Sinks', 'plumbing', NULL, NULL, NULL, false, true, 110, '{"en":"Sinks","uk":"Умивальники","ru":"Умывальники"}'::jsonb, '{}'::jsonb);
  PERFORM public.upsert_marketplace_category('plumbing-pumps', 'Pumps', 'plumbing', NULL, NULL, NULL, false, true, 120, '{"en":"Pumps","uk":"Насоси","ru":"Насосы"}'::jsonb, '{}'::jsonb);
  PERFORM public.upsert_marketplace_category('plumbing-underfloor-heating', 'Underfloor heating', 'plumbing', NULL, NULL, NULL, false, true, 130, '{"en":"Underfloor heating","uk":"Тепла підлога","ru":"Теплый пол"}'::jsonb, '{}'::jsonb);
  PERFORM public.upsert_marketplace_category('electro-wiring', 'Wiring', 'electro', NULL, NULL, NULL, false, true, 10, '{"en":"Wiring","uk":"Проводка","ru":"Проводка"}'::jsonb, '{}'::jsonb);
  PERFORM public.upsert_marketplace_category('electro-rewiring', 'Rewiring', 'electro', NULL, NULL, NULL, false, true, 20, '{"en":"Rewiring","uk":"Перепроводка","ru":"Перепроводка"}'::jsonb, '{}'::jsonb);
  PERFORM public.upsert_marketplace_category('electro-panels', 'Electrical panels', 'electro', NULL, NULL, NULL, false, true, 30, '{"en":"Electrical panels","uk":"Щитки","ru":"Щитки"}'::jsonb, '{}'::jsonb);
  PERFORM public.upsert_marketplace_category('electro-breakers', 'Circuit breakers', 'electro', NULL, NULL, NULL, false, true, 40, '{"en":"Circuit breakers","uk":"Автомати","ru":"Автоматы"}'::jsonb, '{}'::jsonb);
  PERFORM public.upsert_marketplace_category('electro-outlets', 'Outlets', 'electro', NULL, NULL, NULL, false, true, 50, '{"en":"Outlets","uk":"Розетки","ru":"Розетки"}'::jsonb, '{}'::jsonb);
  PERFORM public.upsert_marketplace_category('electro-switches', 'Switches', 'electro', NULL, NULL, NULL, false, true, 60, '{"en":"Switches","uk":"Вимикачі","ru":"Выключатели"}'::jsonb, '{}'::jsonb);
  PERFORM public.upsert_marketplace_category('electro-lighting', 'Lighting', 'electro', NULL, NULL, NULL, false, true, 70, '{"en":"Lighting","uk":"Освітлення","ru":"Освещение"}'::jsonb, '{}'::jsonb);
  PERFORM public.upsert_marketplace_category('electro-led', 'LED lighting', 'electro', NULL, NULL, NULL, false, true, 80, '{"en":"LED lighting","uk":"LED","ru":"LED"}'::jsonb, '{}'::jsonb);
  PERFORM public.upsert_marketplace_category('electro-smart-home', 'Smart home', 'electro', NULL, NULL, NULL, false, true, 90, '{"en":"Smart home","uk":"Smart home","ru":"Smart home"}'::jsonb, '{}'::jsonb);
  PERFORM public.upsert_marketplace_category('electro-intercom', 'Intercoms', 'electro', NULL, NULL, NULL, false, true, 100, '{"en":"Intercoms","uk":"Домофони","ru":"Домофоны"}'::jsonb, '{}'::jsonb);
  PERFORM public.upsert_marketplace_category('electro-cameras', 'Security cameras', 'electro', NULL, NULL, NULL, false, true, 110, '{"en":"Security cameras","uk":"Камери","ru":"Камеры"}'::jsonb, '{}'::jsonb);
  PERFORM public.upsert_marketplace_category('electro-alarm', 'Alarm systems', 'electro', NULL, NULL, NULL, false, true, 120, '{"en":"Alarm systems","uk":"Сигналізація","ru":"Сигнализация"}'::jsonb, '{}'::jsonb);
  PERFORM public.upsert_marketplace_category('hvac-ac', 'Air conditioning', 'hvac', NULL, NULL, NULL, false, true, 10, '{"en":"Air conditioning","uk":"Кондиціонери","ru":"Кондиционеры"}'::jsonb, '{}'::jsonb);
  PERFORM public.upsert_marketplace_category('hvac-ventilation', 'Ventilation', 'hvac', NULL, NULL, NULL, false, true, 20, '{"en":"Ventilation","uk":"Вентиляція","ru":"Вентиляция"}'::jsonb, '{}'::jsonb);
  PERFORM public.upsert_marketplace_category('hvac-recuperation', 'Heat recovery ventilation', 'hvac', NULL, NULL, NULL, false, true, 30, '{"en":"Heat recovery ventilation","uk":"Рекуперація","ru":"Рекуперация"}'::jsonb, '{}'::jsonb);
  PERFORM public.upsert_marketplace_category('hvac-heat-pumps', 'Heat pumps', 'hvac', NULL, NULL, NULL, false, true, 40, '{"en":"Heat pumps","uk":"Теплові насоси","ru":"Тепловые насосы"}'::jsonb, '{}'::jsonb);
  PERFORM public.upsert_marketplace_category('hvac-heating', 'HVAC heating', 'hvac', NULL, NULL, NULL, false, true, 50, '{"en":"HVAC heating","uk":"Опалення","ru":"Отопление"}'::jsonb, '{}'::jsonb);
  PERFORM public.upsert_marketplace_category('hvac-ac-cleaning', 'AC cleaning', 'hvac', NULL, NULL, NULL, false, true, 60, '{"en":"AC cleaning","uk":"Чистка кондиціонерів","ru":"Чистка кондиционеров"}'::jsonb, '{}'::jsonb);
  PERFORM public.upsert_marketplace_category('insulation-thermal', 'Thermal insulation', 'insulation', NULL, NULL, NULL, false, true, 10, '{"en":"Thermal insulation","uk":"Теплоізоляція","ru":"Теплоизоляция"}'::jsonb, '{}'::jsonb);
  PERFORM public.upsert_marketplace_category('insulation-sound', 'Sound insulation', 'insulation', NULL, NULL, NULL, false, true, 20, '{"en":"Sound insulation","uk":"Шумоізоляція","ru":"Шумоизоляция"}'::jsonb, '{}'::jsonb);
  PERFORM public.upsert_marketplace_category('insulation-waterproofing', 'Waterproofing', 'insulation', NULL, NULL, NULL, false, true, 30, '{"en":"Waterproofing","uk":"Гідроізоляція","ru":"Гидроизоляция"}'::jsonb, '{}'::jsonb);
  PERFORM public.upsert_marketplace_category('insulation-vapor', 'Vapor barrier', 'insulation', NULL, NULL, NULL, false, true, 40, '{"en":"Vapor barrier","uk":"Пароізоляція","ru":"Пароизоляция"}'::jsonb, '{}'::jsonb);
  PERFORM public.upsert_marketplace_category('welding-metal-structures', 'Metal structures', 'welding', NULL, NULL, NULL, false, true, 10, '{"en":"Metal structures","uk":"Металоконструкції","ru":"Металлоконструкции"}'::jsonb, '{}'::jsonb);
  PERFORM public.upsert_marketplace_category('welding-welding', 'Welding', 'welding', NULL, NULL, NULL, false, true, 20, '{"en":"Welding","uk":"Зварювання","ru":"Сварка"}'::jsonb, '{}'::jsonb);
  PERFORM public.upsert_marketplace_category('welding-fences', 'Fences', 'welding', NULL, NULL, NULL, false, true, 30, '{"en":"Fences","uk":"Огорожі","ru":"Ограждения"}'::jsonb, '{}'::jsonb);
  PERFORM public.upsert_marketplace_category('welding-gates', 'Gates', 'welding', NULL, NULL, NULL, false, true, 40, '{"en":"Gates","uk":"Ворота","ru":"Ворота"}'::jsonb, '{}'::jsonb);
  PERFORM public.upsert_marketplace_category('welding-railings', 'Railings', 'welding', NULL, NULL, NULL, false, true, 50, '{"en":"Railings","uk":"Перила","ru":"Перила"}'::jsonb, '{}'::jsonb);
  PERFORM public.upsert_marketplace_category('welding-canopies', 'Canopies', 'welding', NULL, NULL, NULL, false, true, 60, '{"en":"Canopies","uk":"Навіси","ru":"Навесы"}'::jsonb, '{}'::jsonb);
  PERFORM public.upsert_marketplace_category('metal-frames', 'Metal frames', 'metal', NULL, NULL, NULL, false, true, 10, '{"en":"Metal frames","uk":"Каркаси","ru":"Каркасы"}'::jsonb, '{}'::jsonb);
  PERFORM public.upsert_marketplace_category('metal-hangars', 'Hangars', 'metal', NULL, NULL, NULL, false, true, 20, '{"en":"Hangars","uk":"Ангари","ru":"Ангары"}'::jsonb, '{}'::jsonb);
  PERFORM public.upsert_marketplace_category('metal-stairs', 'Metal stairs', 'metal', NULL, NULL, NULL, false, true, 30, '{"en":"Metal stairs","uk":"Сходи","ru":"Лестницы"}'::jsonb, '{}'::jsonb);
  PERFORM public.upsert_marketplace_category('metal-balconies', 'Balconies', 'metal', NULL, NULL, NULL, false, true, 40, '{"en":"Balconies","uk":"Балкони","ru":"Балконы"}'::jsonb, '{}'::jsonb);
  PERFORM public.upsert_marketplace_category('metal-canopies', 'Metal canopies', 'metal', NULL, NULL, NULL, false, true, 50, '{"en":"Metal canopies","uk":"Навіси","ru":"Навесы"}'::jsonb, '{}'::jsonb);
  PERFORM public.upsert_marketplace_category('glass-shower-enclosures', 'Shower enclosures', 'glass', NULL, NULL, NULL, false, true, 10, '{"en":"Shower enclosures","uk":"Душові перегородки","ru":"Душевые перегородки"}'::jsonb, '{}'::jsonb);
  PERFORM public.upsert_marketplace_category('glass-glass-doors', 'Glass doors', 'glass', NULL, NULL, NULL, false, true, 20, '{"en":"Glass doors","uk":"Скляні двері","ru":"Стеклянные двери"}'::jsonb, '{}'::jsonb);
  PERFORM public.upsert_marketplace_category('glass-mirrors', 'Mirrors', 'glass', NULL, NULL, NULL, false, true, 30, '{"en":"Mirrors","uk":"Дзеркала","ru":"Зеркала"}'::jsonb, '{}'::jsonb);
  PERFORM public.upsert_marketplace_category('glass-facade-glazing', 'Facade glazing', 'glass', NULL, NULL, NULL, false, true, 40, '{"en":"Facade glazing","uk":"Фасадне скління","ru":"Фасадное остекление"}'::jsonb, '{}'::jsonb);
  PERFORM public.upsert_marketplace_category('landscaping-cobblestone', 'Cobblestone', 'landscaping', NULL, NULL, NULL, false, true, 10, '{"en":"Cobblestone","uk":"Бруківка","ru":"Брусчатка"}'::jsonb, '{}'::jsonb);
  PERFORM public.upsert_marketplace_category('landscaping-paving-slabs', 'Paving slabs', 'landscaping', NULL, NULL, NULL, false, true, 20, '{"en":"Paving slabs","uk":"Тротуарна плитка","ru":"Тротуарная плитка"}'::jsonb, '{}'::jsonb);
  PERFORM public.upsert_marketplace_category('landscaping-fences', 'Fences', 'landscaping', NULL, NULL, NULL, false, true, 30, '{"en":"Fences","uk":"Паркани","ru":"Заборы"}'::jsonb, '{}'::jsonb);
  PERFORM public.upsert_marketplace_category('landscaping-greening', 'Landscaping / planting', 'landscaping', NULL, NULL, NULL, false, true, 40, '{"en":"Landscaping / planting","uk":"Озеленення","ru":"Озеленение"}'::jsonb, '{}'::jsonb);
  PERFORM public.upsert_marketplace_category('landscaping-irrigation', 'Automatic irrigation', 'landscaping', NULL, NULL, NULL, false, true, 50, '{"en":"Automatic irrigation","uk":"Автоматичний полив","ru":"Автоматический полив"}'::jsonb, '{}'::jsonb);
  PERFORM public.upsert_marketplace_category('landscaping-terraces', 'Terraces', 'landscaping', NULL, NULL, NULL, false, true, 60, '{"en":"Terraces","uk":"Тераси","ru":"Террасы"}'::jsonb, '{}'::jsonb);
  PERFORM public.upsert_marketplace_category('landscaping-gazebos', 'Gazebos', 'landscaping', NULL, NULL, NULL, false, true, 70, '{"en":"Gazebos","uk":"Альтанки","ru":"Беседки"}'::jsonb, '{}'::jsonb);
  PERFORM public.upsert_marketplace_category('pools-construction', 'Pool construction', 'pools', NULL, NULL, NULL, false, true, 10, '{"en":"Pool construction","uk":"Будівництво басейнів","ru":"Строительство бассейнов"}'::jsonb, '{}'::jsonb);
  PERFORM public.upsert_marketplace_category('pools-repair', 'Pool repair', 'pools', NULL, NULL, NULL, false, true, 20, '{"en":"Pool repair","uk":"Ремонт басейнів","ru":"Ремонт бассейнов"}'::jsonb, '{}'::jsonb);
  PERFORM public.upsert_marketplace_category('pools-maintenance', 'Pool maintenance', 'pools', NULL, NULL, NULL, false, true, 30, '{"en":"Pool maintenance","uk":"Обслуговування","ru":"Обслуживание"}'::jsonb, '{}'::jsonb);
  PERFORM public.upsert_marketplace_category('solar-panels', 'Solar panels', 'solar', NULL, NULL, NULL, false, true, 10, '{"en":"Solar panels","uk":"Сонячні панелі","ru":"Солнечные панели"}'::jsonb, '{}'::jsonb);
  PERFORM public.upsert_marketplace_category('solar-inverters', 'Inverters', 'solar', NULL, NULL, NULL, false, true, 20, '{"en":"Inverters","uk":"Інвертори","ru":"Инверторы"}'::jsonb, '{}'::jsonb);
  PERFORM public.upsert_marketplace_category('solar-battery', 'Battery storage', 'solar', NULL, NULL, NULL, false, true, 30, '{"en":"Battery storage","uk":"Акумулятори","ru":"Аккумуляторы"}'::jsonb, '{}'::jsonb);
  PERFORM public.upsert_marketplace_category('solar-installation', 'Installation', 'solar', NULL, NULL, NULL, false, true, 40, '{"en":"Installation","uk":"Монтаж","ru":"Монтаж"}'::jsonb, '{}'::jsonb);
  PERFORM public.upsert_marketplace_category('smart-home-systems', 'Smart home', 'smart-home', NULL, NULL, NULL, false, true, 10, '{"en":"Smart home","uk":"Розумний дім","ru":"Умный дом"}'::jsonb, '{}'::jsonb);
  PERFORM public.upsert_marketplace_category('smart-home-automation', 'Home automation', 'smart-home', NULL, NULL, NULL, false, true, 20, '{"en":"Home automation","uk":"Автоматизація","ru":"Автоматизация"}'::jsonb, '{}'::jsonb);
  PERFORM public.upsert_marketplace_category('smart-home-lighting', 'Lighting control', 'smart-home', NULL, NULL, NULL, false, true, 30, '{"en":"Lighting control","uk":"Контроль освітлення","ru":"Контроль освещения"}'::jsonb, '{}'::jsonb);
  PERFORM public.upsert_marketplace_category('smart-home-security', 'Smart security', 'smart-home', NULL, NULL, NULL, false, true, 40, '{"en":"Smart security","uk":"Безпека","ru":"Безопасность"}'::jsonb, '{}'::jsonb);
  PERFORM public.upsert_marketplace_category('design-engineering-architect', 'Architect', 'design-engineering', NULL, NULL, NULL, false, true, 10, '{"en":"Architect","uk":"Архітектор","ru":"Архитектор"}'::jsonb, '{}'::jsonb);
  PERFORM public.upsert_marketplace_category('design-engineering-structural', 'Structural engineer', 'design-engineering', NULL, NULL, NULL, false, true, 20, '{"en":"Structural engineer","uk":"Статик","ru":"Статик"}'::jsonb, '{}'::jsonb);
  PERFORM public.upsert_marketplace_category('design-engineering-interior', 'Interior design', 'design-engineering', NULL, NULL, NULL, false, true, 30, '{"en":"Interior design","uk":"Дизайн інтер''єру","ru":"Дизайн интерьера"}'::jsonb, '{}'::jsonb);
  PERFORM public.upsert_marketplace_category('design-engineering-3d', '3D visualization', 'design-engineering', NULL, NULL, NULL, false, true, 40, '{"en":"3D visualization","uk":"3D візуалізація","ru":"3D визуализация"}'::jsonb, '{}'::jsonb);
  PERFORM public.upsert_marketplace_category('design-engineering-engineering', 'Engineering', 'design-engineering', NULL, NULL, NULL, false, true, 50, '{"en":"Engineering","uk":"Інженерія","ru":"Инженерия"}'::jsonb, '{}'::jsonb);
END $$;

-- Refresh cached counts on main categories
CREATE OR REPLACE FUNCTION public.refresh_marketplace_category_stats()
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  UPDATE categories c SET
    services_count = (
      SELECT COUNT(*) FROM categories s
      WHERE s.parent_id = c.id AND coalesce(s.is_service, false) = true
    ),
    professionals_count = (
      SELECT COUNT(DISTINCT p.id)
      FROM profiles p
      WHERE p.is_professional = true
        AND (
          EXISTS (
            SELECT 1 FROM unnest(coalesce(p.work_subcategory_slugs, '{}'::text[])) w
            WHERE w LIKE c.slug || '-%' OR w = c.slug
          )
          OR EXISTS (
            SELECT 1
            FROM professional_categories pc
            JOIN categories sc ON sc.id = pc.category_id
            WHERE pc.profile_id = p.id
              AND (sc.id = c.id OR sc.parent_id = c.id OR sc.slug LIKE c.slug || '-%')
          )
        )
    ),
    avg_rating = (
      SELECT ROUND(AVG(p.rating)::numeric, 2)
      FROM profiles p
      WHERE p.is_professional = true
        AND coalesce(p.total_reviews, 0) > 0
        AND (
          EXISTS (
            SELECT 1 FROM unnest(coalesce(p.work_subcategory_slugs, '{}'::text[])) w
            WHERE w LIKE c.slug || '-%' OR w = c.slug
          )
        )
    ),
    updated_at = now()
  WHERE c.is_main = true;

  UPDATE categories c SET
    services_count = (
      SELECT COUNT(*) FROM categories s WHERE s.parent_id = c.id
    )
  WHERE c.slug = 'construction';
END;
$$;

SELECT public.refresh_marketplace_category_stats();

GRANT EXECUTE ON FUNCTION public.refresh_marketplace_category_stats() TO authenticated, service_role;
GRANT EXECUTE ON FUNCTION public.upsert_marketplace_category(text, text, text, text, text, text, boolean, boolean, integer, jsonb, jsonb) TO service_role;

-- Public read of marketplace categories (already typically public SELECT on categories)
DROP POLICY IF EXISTS "categories_public_read" ON categories;
CREATE POLICY "categories_public_read" ON categories
  FOR SELECT USING (true);

CREATE OR REPLACE FUNCTION public.get_marketplace_main_categories()
RETURNS jsonb
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT coalesce(jsonb_agg(row_to_json(t)::jsonb ORDER BY t.sort_order), '[]'::jsonb)
  FROM (
    SELECT
      id, name, slug, icon, icon_key, cover_image_url, description,
      name_i18n, description_i18n, sort_order,
      services_count, professionals_count, avg_rating
    FROM categories
    WHERE is_main = true
    ORDER BY sort_order, name
  ) t;
$$;

CREATE OR REPLACE FUNCTION public.get_marketplace_category_page(p_slug text)
RETURNS jsonb
LANGUAGE plpgsql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  cat categories%ROWTYPE;
  services jsonb;
  pros jsonb;
  projects jsonb;
BEGIN
  SELECT * INTO cat FROM categories WHERE slug = p_slug LIMIT 1;
  IF NOT FOUND THEN
    RETURN jsonb_build_object('ok', false, 'error', 'not_found');
  END IF;

  SELECT coalesce(jsonb_agg(row_to_json(s)::jsonb ORDER BY s.sort_order), '[]'::jsonb)
  INTO services
  FROM (
    SELECT id, name, slug, icon, icon_key, name_i18n, description_i18n, sort_order, parent_id
    FROM categories
    WHERE parent_id = cat.id AND coalesce(is_service, true) = true
    ORDER BY sort_order, name
  ) s;

  -- If this is a main category with no services, try children that are mains? no — services only

  SELECT coalesce(jsonb_agg(row_to_json(p)::jsonb), '[]'::jsonb)
  INTO pros
  FROM (
    SELECT
      pr.id, pr.full_name, pr.profile_photo, pr.avatar_url, pr.location,
      pr.rating, pr.total_reviews, pr.is_verified, pr.is_premium, pr.is_featured,
      pr.work_subcategory_slugs
    FROM profiles pr
    WHERE pr.is_professional = true
      AND (
        EXISTS (
          SELECT 1 FROM unnest(coalesce(pr.work_subcategory_slugs, '{}'::text[])) w
          WHERE w LIKE cat.slug || '-%' OR w = cat.slug
        )
      )
    ORDER BY pr.is_featured DESC NULLS LAST, pr.is_premium DESC NULLS LAST, pr.rating DESC NULLS LAST
    LIMIT 12
  ) p;

  SELECT coalesce(jsonb_agg(row_to_json(l)::jsonb), '[]'::jsonb)
  INTO projects
  FROM (
    SELECT
      li.id, li.title, li.description, li.location, li.city_name, li.created_at,
      li.urgency, li.budget_min, li.budget_max
    FROM listings li
    WHERE li.listing_type = 'service_request'
      AND coalesce(li.status, 'active') = 'active'
      AND (
        EXISTS (
          SELECT 1 FROM unnest(coalesce(li.subcategory_slugs, '{}'::text[])) w
          WHERE w LIKE cat.slug || '-%' OR w = cat.slug
        )
        OR EXISTS (
          SELECT 1 FROM categories sc
          WHERE sc.id = li.category_id
            AND (sc.id = cat.id OR sc.parent_id = cat.id OR sc.slug = cat.slug)
        )
      )
    ORDER BY li.created_at DESC
    LIMIT 8
  ) l;

  RETURN jsonb_build_object(
    'ok', true,
    'category', row_to_json(cat),
    'services', services,
    'professionals', pros,
    'projects', projects
  );
END;
$$;

GRANT EXECUTE ON FUNCTION public.get_marketplace_main_categories() TO anon, authenticated;
GRANT EXECUTE ON FUNCTION public.get_marketplace_category_page(text) TO anon, authenticated;
