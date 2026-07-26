-- Companies Directory: construction companies, suppliers, manufacturers, stores

CREATE TABLE IF NOT EXISTS companies (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  owner_id uuid REFERENCES profiles(id) ON DELETE SET NULL,
  slug text NOT NULL UNIQUE,
  name text NOT NULL,
  logo_url text,
  cover_url text,
  short_description text,
  about text,
  category_slug text NOT NULL,
  is_verified boolean NOT NULL DEFAULT false,
  is_premium boolean NOT NULL DEFAULT false,
  is_featured boolean NOT NULL DEFAULT false,
  rating numeric(3,2) NOT NULL DEFAULT 0,
  reviews_count integer NOT NULL DEFAULT 0,
  completed_projects integer NOT NULL DEFAULT 0,
  employees_count integer,
  founded_year integer,
  country_code text,
  country_name text,
  city text,
  address text,
  postal_code text,
  latitude double precision,
  longitude double precision,
  languages text[] NOT NULL DEFAULT '{}',
  website text,
  phone text,
  email text,
  opening_hours jsonb NOT NULL DEFAULT '{}'::jsonb,
  social jsonb NOT NULL DEFAULT '{}'::jsonb,
  status text NOT NULL DEFAULT 'published'
    CHECK (status IN ('draft', 'published', 'hidden')),
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_companies_status_featured
  ON companies(status, is_featured DESC, rating DESC);
CREATE INDEX IF NOT EXISTS idx_companies_category
  ON companies(category_slug) WHERE status = 'published';
CREATE INDEX IF NOT EXISTS idx_companies_geo
  ON companies(country_code, city);
CREATE INDEX IF NOT EXISTS idx_companies_owner
  ON companies(owner_id);
CREATE INDEX IF NOT EXISTS idx_companies_search
  ON companies USING gin (
    to_tsvector('simple', coalesce(name, '') || ' ' || coalesce(short_description, '') || ' ' || coalesce(city, ''))
  );

CREATE TABLE IF NOT EXISTS company_services (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  company_id uuid NOT NULL REFERENCES companies(id) ON DELETE CASCADE,
  name text NOT NULL,
  description text,
  category_slug text,
  sort_order integer NOT NULL DEFAULT 0,
  created_at timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX IF NOT EXISTS idx_company_services_company ON company_services(company_id);

CREATE TABLE IF NOT EXISTS company_gallery (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  company_id uuid NOT NULL REFERENCES companies(id) ON DELETE CASCADE,
  url text NOT NULL,
  caption text,
  media_type text NOT NULL DEFAULT 'image' CHECK (media_type IN ('image', 'video')),
  sort_order integer NOT NULL DEFAULT 0,
  created_at timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX IF NOT EXISTS idx_company_gallery_company ON company_gallery(company_id, sort_order);

CREATE TABLE IF NOT EXISTS company_reviews (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  company_id uuid NOT NULL REFERENCES companies(id) ON DELETE CASCADE,
  reviewer_id uuid REFERENCES profiles(id) ON DELETE SET NULL,
  reviewer_name text NOT NULL,
  rating integer NOT NULL CHECK (rating >= 1 AND rating <= 5),
  comment text,
  is_verified boolean NOT NULL DEFAULT false,
  is_hidden boolean NOT NULL DEFAULT false,
  created_at timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX IF NOT EXISTS idx_company_reviews_company
  ON company_reviews(company_id, created_at DESC);

CREATE TABLE IF NOT EXISTS company_brands (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  company_id uuid NOT NULL REFERENCES companies(id) ON DELETE CASCADE,
  name text NOT NULL,
  logo_url text,
  sort_order integer NOT NULL DEFAULT 0,
  created_at timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX IF NOT EXISTS idx_company_brands_company ON company_brands(company_id);

CREATE TABLE IF NOT EXISTS company_team (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  company_id uuid NOT NULL REFERENCES companies(id) ON DELETE CASCADE,
  name text NOT NULL,
  role_title text,
  avatar_url text,
  sort_order integer NOT NULL DEFAULT 0,
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS company_certificates (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  company_id uuid NOT NULL REFERENCES companies(id) ON DELETE CASCADE,
  title text NOT NULL,
  issuer text,
  year integer,
  document_url text,
  sort_order integer NOT NULL DEFAULT 0,
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS company_licenses (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  company_id uuid NOT NULL REFERENCES companies(id) ON DELETE CASCADE,
  title text NOT NULL,
  license_number text,
  issuer text,
  expires_at date,
  sort_order integer NOT NULL DEFAULT 0,
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS company_portfolio (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  company_id uuid NOT NULL REFERENCES companies(id) ON DELETE CASCADE,
  title text NOT NULL,
  description text,
  image_url text,
  category_slug text,
  completed_at date,
  sort_order integer NOT NULL DEFAULT 0,
  created_at timestamptz NOT NULL DEFAULT now()
);

-- Rating refresh
CREATE OR REPLACE FUNCTION public.refresh_company_rating(p_company_id uuid)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  UPDATE companies c
  SET
    rating = COALESCE((
      SELECT ROUND(AVG(r.rating)::numeric, 2)
      FROM company_reviews r
      WHERE r.company_id = p_company_id AND r.is_hidden = false
    ), 0),
    reviews_count = COALESCE((
      SELECT count(*)::int
      FROM company_reviews r
      WHERE r.company_id = p_company_id AND r.is_hidden = false
    ), 0),
    updated_at = now()
  WHERE c.id = p_company_id;
END;
$$;

CREATE OR REPLACE FUNCTION public.trg_company_reviews_rating()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  PERFORM public.refresh_company_rating(COALESCE(NEW.company_id, OLD.company_id));
  RETURN NULL;
END;
$$;

DROP TRIGGER IF EXISTS trg_company_reviews_rating ON company_reviews;
CREATE TRIGGER trg_company_reviews_rating
  AFTER INSERT OR UPDATE OR DELETE ON company_reviews
  FOR EACH ROW EXECUTE FUNCTION public.trg_company_reviews_rating();

CREATE OR REPLACE FUNCTION public.set_companies_updated_at()
RETURNS trigger
LANGUAGE plpgsql
AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS trg_companies_updated_at ON companies;
CREATE TRIGGER trg_companies_updated_at
  BEFORE UPDATE ON companies
  FOR EACH ROW EXECUTE FUNCTION public.set_companies_updated_at();

-- RLS
ALTER TABLE companies ENABLE ROW LEVEL SECURITY;
ALTER TABLE company_services ENABLE ROW LEVEL SECURITY;
ALTER TABLE company_gallery ENABLE ROW LEVEL SECURITY;
ALTER TABLE company_reviews ENABLE ROW LEVEL SECURITY;
ALTER TABLE company_brands ENABLE ROW LEVEL SECURITY;
ALTER TABLE company_team ENABLE ROW LEVEL SECURITY;
ALTER TABLE company_certificates ENABLE ROW LEVEL SECURITY;
ALTER TABLE company_licenses ENABLE ROW LEVEL SECURITY;
ALTER TABLE company_portfolio ENABLE ROW LEVEL SECURITY;

CREATE OR REPLACE FUNCTION public.is_site_owner()
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1 FROM profiles p
    WHERE p.id = auth.uid() AND (p.is_site_owner = true OR p.user_role = 'owner')
  );
$$;

-- Companies policies
DROP POLICY IF EXISTS "companies_select_published" ON companies;
CREATE POLICY "companies_select_published" ON companies FOR SELECT TO anon, authenticated
  USING (
    status = 'published'
    OR owner_id = auth.uid()
    OR public.is_site_owner()
  );

DROP POLICY IF EXISTS "companies_insert_owner" ON companies;
CREATE POLICY "companies_insert_owner" ON companies FOR INSERT TO authenticated
  WITH CHECK (
    owner_id = auth.uid()
    OR public.is_site_owner()
  );

DROP POLICY IF EXISTS "companies_update_owner" ON companies;
CREATE POLICY "companies_update_owner" ON companies FOR UPDATE TO authenticated
  USING (owner_id = auth.uid() OR public.is_site_owner())
  WITH CHECK (owner_id = auth.uid() OR public.is_site_owner());

DROP POLICY IF EXISTS "companies_delete_admin" ON companies;
CREATE POLICY "companies_delete_admin" ON companies FOR DELETE TO authenticated
  USING (owner_id = auth.uid() OR public.is_site_owner());

-- Helper: related tables readable if company visible
CREATE OR REPLACE FUNCTION public.can_view_company(p_company_id uuid)
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1 FROM companies c
    WHERE c.id = p_company_id
      AND (
        c.status = 'published'
        OR c.owner_id = auth.uid()
        OR public.is_site_owner()
      )
  );
$$;

CREATE OR REPLACE FUNCTION public.can_edit_company(p_company_id uuid)
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1 FROM companies c
    WHERE c.id = p_company_id
      AND (c.owner_id = auth.uid() OR public.is_site_owner())
  );
$$;

-- Generic related-table policies
DO $$
DECLARE
  t text;
BEGIN
  FOREACH t IN ARRAY ARRAY[
    'company_services', 'company_gallery', 'company_brands',
    'company_team', 'company_certificates', 'company_licenses', 'company_portfolio'
  ]
  LOOP
    EXECUTE format('DROP POLICY IF EXISTS %I ON %I', t || '_select', t);
    EXECUTE format(
      'CREATE POLICY %I ON %I FOR SELECT TO anon, authenticated USING (public.can_view_company(company_id))',
      t || '_select', t
    );
    EXECUTE format('DROP POLICY IF EXISTS %I ON %I', t || '_write', t);
    EXECUTE format(
      'CREATE POLICY %I ON %I FOR ALL TO authenticated USING (public.can_edit_company(company_id)) WITH CHECK (public.can_edit_company(company_id))',
      t || '_write', t
    );
  END LOOP;
END $$;

DROP POLICY IF EXISTS "company_reviews_select" ON company_reviews;
CREATE POLICY "company_reviews_select" ON company_reviews FOR SELECT TO anon, authenticated
  USING (is_hidden = false AND public.can_view_company(company_id));

DROP POLICY IF EXISTS "company_reviews_insert" ON company_reviews;
CREATE POLICY "company_reviews_insert" ON company_reviews FOR INSERT TO authenticated
  WITH CHECK (
    reviewer_id = auth.uid()
    AND public.can_view_company(company_id)
    AND rating BETWEEN 1 AND 5
  );

DROP POLICY IF EXISTS "company_reviews_update_admin" ON company_reviews;
CREATE POLICY "company_reviews_update_admin" ON company_reviews FOR UPDATE TO authenticated
  USING (reviewer_id = auth.uid() OR public.is_site_owner())
  WITH CHECK (reviewer_id = auth.uid() OR public.is_site_owner());

DROP POLICY IF EXISTS "company_reviews_delete_admin" ON company_reviews;
CREATE POLICY "company_reviews_delete_admin" ON company_reviews FOR DELETE TO authenticated
  USING (reviewer_id = auth.uid() OR public.is_site_owner());

-- Seed demo companies (idempotent by slug)
INSERT INTO companies (
  slug, name, logo_url, cover_url, short_description, about, category_slug,
  is_verified, is_premium, is_featured, rating, reviews_count, completed_projects,
  employees_count, founded_year, country_code, country_name, city, address,
  latitude, longitude, languages, website, phone, opening_hours, social, status
) VALUES
(
  'bauhaus-berlin-group',
  'Bauhaus Berlin Group',
  'https://images.unsplash.com/photo-1486406146926-c627a92ad1ab?w=200&h=200&fit=crop',
  'https://images.unsplash.com/photo-1504307651254-35680f356dfd?w=1400&h=500&fit=crop',
  'Full-cycle construction company for residential and commercial projects across Germany.',
  'Bauhaus Berlin Group delivers turnkey construction, from foundations to finishing. Our teams coordinate architects, engineers and certified trades under one contract.',
  'construction-companies',
  true, true, true, 4.90, 128, 340, 85, 2008, 'DE', 'Germany', 'Berlin',
  'Alexanderplatz 1, Berlin', 52.5219, 13.4132,
  ARRAY['de','en','pl'], 'https://example.com/bauhaus-berlin', '+49 30 123456',
  '{"timezone":"Europe/Berlin","days":{"mon":[["08:00","18:00"]],"tue":[["08:00","18:00"]],"wed":[["08:00","18:00"]],"thu":[["08:00","18:00"]],"fri":[["08:00","17:00"]],"sat":[],"sun":[]}}'::jsonb,
  '{"linkedin":"https://linkedin.com","instagram":"https://instagram.com"}'::jsonb,
  'published'
),
(
  'renova-madrid',
  'Renova Madrid',
  'https://images.unsplash.com/photo-1497366216548-37526070297c?w=200&h=200&fit=crop',
  'https://images.unsplash.com/photo-1581578731548-c64695cc6952?w=1400&h=500&fit=crop',
  'Apartment and office renovations with fixed timelines and transparent budgets.',
  'Specialists in kitchen, bathroom and full-flat renovations for homeowners and landlords in Madrid.',
  'renovation-companies',
  true, false, true, 4.70, 86, 210, 32, 2014, 'ES', 'Spain', 'Madrid',
  'Calle Gran Vía 28, Madrid', 40.4203, -3.7058,
  ARRAY['es','en'], 'https://example.com/renova-madrid', '+34 91 555 0101',
  '{"timezone":"Europe/Madrid","days":{"mon":[["09:00","19:00"]],"tue":[["09:00","19:00"]],"wed":[["09:00","19:00"]],"thu":[["09:00","19:00"]],"fri":[["09:00","18:00"]],"sat":[["10:00","14:00"]],"sun":[]}}'::jsonb,
  '{"facebook":"https://facebook.com"}'::jsonb,
  'published'
),
(
  'atelier-nord-architects',
  'Atelier Nord Architects',
  'https://images.unsplash.com/photo-1503387762-592deb58ef4e?w=200&h=200&fit=crop',
  'https://images.unsplash.com/photo-1487958449943-2429e8be8625?w=1400&h=500&fit=crop',
  'Architecture studio focused on sustainable residential design.',
  'We design energy-efficient homes and mixed-use buildings with clear permitting support.',
  'architects',
  true, true, false, 4.80, 54, 96, 18, 2011, 'FR', 'France', 'Paris',
  '12 Rue de Rivoli, Paris', 48.8556, 2.3608,
  ARRAY['fr','en'], 'https://example.com/atelier-nord', '+33 1 42 00 00 00',
  '{"timezone":"Europe/Paris","days":{"mon":[["09:00","18:00"]],"tue":[["09:00","18:00"]],"wed":[["09:00","18:00"]],"thu":[["09:00","18:00"]],"fri":[["09:00","17:00"]],"sat":[],"sun":[]}}'::jsonb,
  '{"linkedin":"https://linkedin.com"}'::jsonb,
  'published'
),
(
  'euro-engineering-warsaw',
  'Euro Engineering Warsaw',
  'https://images.unsplash.com/photo-1581094794329-c8112a89af12?w=200&h=200&fit=crop',
  'https://images.unsplash.com/photo-1504328345606-18bbc8c9d7d1?w=1400&h=500&fit=crop',
  'Structural and MEP engineering for mid-size commercial builds.',
  'Licensed engineers providing calculations, site supervision and BIM coordination.',
  'engineering',
  true, false, false, 4.60, 41, 120, 45, 2005, 'PL', 'Poland', 'Warsaw',
  'ul. Marszałkowska 100, Warsaw', 52.2297, 21.0122,
  ARRAY['pl','en','uk'], 'https://example.com/euro-eng', '+48 22 111 22 33',
  '{"timezone":"Europe/Warsaw","days":{"mon":[["08:00","17:00"]],"tue":[["08:00","17:00"]],"wed":[["08:00","17:00"]],"thu":[["08:00","17:00"]],"fri":[["08:00","16:00"]],"sat":[],"sun":[]}}'::jsonb,
  '{}'::jsonb,
  'published'
),
(
  'lumen-interior-milan',
  'Lumen Interior Milan',
  'https://images.unsplash.com/photo-1618221195710-dd6b41faaea6?w=200&h=200&fit=crop',
  'https://images.unsplash.com/photo-1616486338812-3dadae4b4ace?w=1400&h=500&fit=crop',
  'Interior design studio for premium apartments and retail spaces.',
  'Concept-to-install interior design with furniture sourcing and contractor management.',
  'interior-design',
  true, true, true, 4.95, 73, 150, 14, 2016, 'IT', 'Italy', 'Milan',
  'Via Montenapoleone 8, Milan', 45.4685, 9.1950,
  ARRAY['it','en'], 'https://example.com/lumen-milan', '+39 02 1234 5678',
  '{"timezone":"Europe/Rome","days":{"mon":[["10:00","19:00"]],"tue":[["10:00","19:00"]],"wed":[["10:00","19:00"]],"thu":[["10:00","19:00"]],"fri":[["10:00","19:00"]],"sat":[["10:00","14:00"]],"sun":[]}}'::jsonb,
  '{"instagram":"https://instagram.com"}'::jsonb,
  'published'
),
(
  'buildmart-materials-kyiv',
  'BuildMart Materials',
  'https://images.unsplash.com/photo-1581092160562-40aa08e78837?w=200&h=200&fit=crop',
  'https://images.unsplash.com/photo-1504917595217-d4dc5ebe6122?w=1400&h=500&fit=crop',
  'Building materials warehouse with pro trade discounts.',
  'Cement, drywall, insulation, fasteners and delivery across Kyiv oblast.',
  'building-material-stores',
  true, false, true, 4.50, 210, 0, 60, 2009, 'UA', 'Ukraine', 'Kyiv',
  'Peremohy Ave 45, Kyiv', 50.4501, 30.5234,
  ARRAY['uk','ru','en'], 'https://example.com/buildmart', '+380 44 000 1122',
  '{"timezone":"Europe/Kyiv","days":{"mon":[["08:00","19:00"]],"tue":[["08:00","19:00"]],"wed":[["08:00","19:00"]],"thu":[["08:00","19:00"]],"fri":[["08:00","19:00"]],"sat":[["09:00","16:00"]],"sun":[]}}'::jsonb,
  '{}'::jsonb,
  'published'
),
(
  'volt-store-amsterdam',
  'Volt Electrical Store',
  'https://images.unsplash.com/photo-1621905251189-08b45d6a269e?w=200&h=200&fit=crop',
  'https://images.unsplash.com/photo-1558618666-fcd25c85cd64?w=1400&h=500&fit=crop',
  'Electrical supplies and smart switches for contractors.',
  'Cables, breakers, LED lighting and pro tooling with same-day pickup.',
  'electrical-stores',
  true, true, false, 4.40, 95, 0, 22, 2013, 'NL', 'Netherlands', 'Amsterdam',
  'Damrak 50, Amsterdam', 52.3750, 4.8950,
  ARRAY['nl','en'], 'https://example.com/volt-store', '+31 20 123 4567',
  '{"timezone":"Europe/Amsterdam","days":{"mon":[["08:30","18:00"]],"tue":[["08:30","18:00"]],"wed":[["08:30","18:00"]],"thu":[["08:30","18:00"]],"fri":[["08:30","18:00"]],"sat":[["09:00","15:00"]],"sun":[]}}'::jsonb,
  '{}'::jsonb,
  'published'
),
(
  'pipepro-supply-prague',
  'PipePro Plumbing Supply',
  'https://images.unsplash.com/photo-1607472586893-edb57bdc0e39?w=200&h=200&fit=crop',
  'https://images.unsplash.com/photo-1584622650111-993a426fbf0a?w=1400&h=500&fit=crop',
  'Wholesale plumbing and heating parts for installers.',
  'Pipes, fittings, boilers and bathroom fixtures with trade accounts.',
  'plumbing-stores',
  false, false, false, 4.30, 38, 0, 16, 2017, 'CZ', 'Czechia', 'Prague',
  'Vinohradská 12, Prague', 50.0755, 14.4378,
  ARRAY['cs','en'], 'https://example.com/pipepro', '+420 222 000 111',
  '{"timezone":"Europe/Prague","days":{"mon":[["07:30","17:00"]],"tue":[["07:30","17:00"]],"wed":[["07:30","17:00"]],"thu":[["07:30","17:00"]],"fri":[["07:30","16:00"]],"sat":[],"sun":[]}}'::jsonb,
  '{}'::jsonb,
  'published'
),
(
  'toolhub-vienna',
  'ToolHub Vienna',
  'https://images.unsplash.com/photo-1530124566582-a618bc2615dc?w=200&h=200&fit=crop',
  'https://images.unsplash.com/photo-1504148455328-c376907d081c?w=1400&h=500&fit=crop',
  'Power tools rental and sales for construction crews.',
  'Bosch, Makita and Hilti tools with weekend rental packages.',
  'tool-stores',
  true, false, false, 4.55, 67, 0, 12, 2015, 'AT', 'Austria', 'Vienna',
  'Mariahilfer Str. 80, Vienna', 48.1980, 16.3450,
  ARRAY['de','en'], 'https://example.com/toolhub', '+43 1 234567',
  '{"timezone":"Europe/Vienna","days":{"mon":[["08:00","18:00"]],"tue":[["08:00","18:00"]],"wed":[["08:00","18:00"]],"thu":[["08:00","18:00"]],"fri":[["08:00","18:00"]],"sat":[["09:00","13:00"]],"sun":[]}}'::jsonb,
  '{}'::jsonb,
  'published'
),
(
  'roofline-suppliers-munich',
  'Roofline Suppliers',
  'https://images.unsplash.com/photo-1632759145351-1d9649113c89?w=200&h=200&fit=crop',
  'https://images.unsplash.com/photo-1632759145351-1d9649113c89?w=1400&h=500&fit=crop',
  'Roofing membranes, tiles and safety gear for roofers.',
  'Supply partner for pitched and flat roof systems across Bavaria.',
  'roofing-suppliers',
  true, true, false, 4.65, 52, 0, 28, 2006, 'DE', 'Germany', 'Munich',
  'Sendlinger Str. 20, Munich', 48.1351, 11.5820,
  ARRAY['de','en'], 'https://example.com/roofline', '+49 89 987654',
  '{"timezone":"Europe/Berlin","days":{"mon":[["07:00","16:30"]],"tue":[["07:00","16:30"]],"wed":[["07:00","16:30"]],"thu":[["07:00","16:30"]],"fri":[["07:00","15:00"]],"sat":[],"sun":[]}}'::jsonb,
  '{}'::jsonb,
  'published'
),
(
  'climate-air-brussels',
  'ClimateAir HVAC',
  'https://images.unsplash.com/photo-1621905252507-b35492cc74b4?w=200&h=200&fit=crop',
  'https://images.unsplash.com/photo-1581092918056-0c4c3acd3789?w=1400&h=500&fit=crop',
  'HVAC installation and heat-pump specialists.',
  'Design, install and service ventilation and heating systems for homes and offices.',
  'hvac-suppliers',
  true, false, true, 4.75, 88, 175, 40, 2010, 'BE', 'Belgium', 'Brussels',
  'Rue Neuve 15, Brussels', 50.8503, 4.3517,
  ARRAY['fr','nl','en'], 'https://example.com/climateair', '+32 2 555 0101',
  '{"timezone":"Europe/Brussels","days":{"mon":[["08:00","17:30"]],"tue":[["08:00","17:30"]],"wed":[["08:00","17:30"]],"thu":[["08:00","17:30"]],"fri":[["08:00","16:00"]],"sat":[],"sun":[]}}'::jsonb,
  '{}'::jsonb,
  'published'
),
(
  'solara-energy-lisbon',
  'Solara Energy',
  'https://images.unsplash.com/photo-1509391366360-2e959784a276?w=200&h=200&fit=crop',
  'https://images.unsplash.com/photo-1508514177221-188b1cf16e9d?w=1400&h=500&fit=crop',
  'Residential and commercial solar installation company.',
  'Turnkey PV systems with monitoring and maintenance plans.',
  'solar-companies',
  true, true, true, 4.85, 112, 260, 55, 2012, 'PT', 'Portugal', 'Lisbon',
  'Av. da Liberdade 100, Lisbon', 38.7223, -9.1393,
  ARRAY['pt','en','es'], 'https://example.com/solara', '+351 21 000 0000',
  '{"timezone":"Europe/Lisbon","days":{"mon":[["09:00","18:00"]],"tue":[["09:00","18:00"]],"wed":[["09:00","18:00"]],"thu":[["09:00","18:00"]],"fri":[["09:00","18:00"]],"sat":[],"sun":[]}}'::jsonb,
  '{"instagram":"https://instagram.com","linkedin":"https://linkedin.com"}'::jsonb,
  'published'
),
(
  'clearview-windows-zurich',
  'ClearView Windows & Doors',
  'https://images.unsplash.com/photo-1497366811353-6870744d04b2?w=200&h=200&fit=crop',
  'https://images.unsplash.com/photo-1600607687939-ce8a6c25118c?w=1400&h=500&fit=crop',
  'High-performance windows, sliding doors and facade systems.',
  'Measurement, manufacturing and certified installation for Swiss homes.',
  'window-door-companies',
  true, false, false, 4.70, 49, 130, 35, 2004, 'CH', 'Switzerland', 'Zurich',
  'Bahnhofstrasse 40, Zurich', 47.3769, 8.5417,
  ARRAY['de','en','fr'], 'https://example.com/clearview', '+41 44 000 00 00',
  '{"timezone":"Europe/Zurich","days":{"mon":[["08:00","17:00"]],"tue":[["08:00","17:00"]],"wed":[["08:00","17:00"]],"thu":[["08:00","17:00"]],"fri":[["08:00","16:00"]],"sat":[["09:00","12:00"]],"sun":[]}}'::jsonb,
  '{}'::jsonb,
  'published'
),
(
  'nordic-living-furniture',
  'Nordic Living Furniture',
  'https://images.unsplash.com/photo-1555041469-a586c61ea9bc?w=200&h=200&fit=crop',
  'https://images.unsplash.com/photo-1618220179428-22790b461013?w=1400&h=500&fit=crop',
  'Custom cabinetry and built-in furniture for renovations.',
  'Kitchen and wardrobe manufacturing with installation teams.',
  'furniture-companies',
  false, true, false, 4.45, 61, 90, 24, 2018, 'SE', 'Sweden', 'Stockholm',
  'Drottninggatan 50, Stockholm', 59.3293, 18.0686,
  ARRAY['sv','en'], 'https://example.com/nordic-living', '+46 8 123 456',
  '{"timezone":"Europe/Stockholm","days":{"mon":[["10:00","18:00"]],"tue":[["10:00","18:00"]],"wed":[["10:00","18:00"]],"thu":[["10:00","18:00"]],"fri":[["10:00","18:00"]],"sat":[["11:00","15:00"]],"sun":[]}}'::jsonb,
  '{"instagram":"https://instagram.com"}'::jsonb,
  'published'
),
(
  'greenpath-landscape',
  'GreenPath Landscape',
  'https://images.unsplash.com/photo-1416879595882-3373a0480b5b?w=200&h=200&fit=crop',
  'https://images.unsplash.com/photo-1558904541-efa843a96f01?w=1400&h=500&fit=crop',
  'Garden design, hardscape and irrigation company.',
  'From patio builds to complete landscape renovations for private estates.',
  'landscape-companies',
  true, false, false, 4.60, 44, 110, 20, 2011, 'GB', 'United Kingdom', 'London',
  'King''s Road 120, London', 51.4875, -0.1687,
  ARRAY['en'], 'https://example.com/greenpath', '+44 20 7946 0000',
  '{"timezone":"Europe/London","days":{"mon":[["08:00","17:00"]],"tue":[["08:00","17:00"]],"wed":[["08:00","17:00"]],"thu":[["08:00","17:00"]],"fri":[["08:00","16:00"]],"sat":[],"sun":[]}}'::jsonb,
  '{}'::jsonb,
  'published'
),
(
  'aquaform-pools',
  'AquaForm Pools',
  'https://images.unsplash.com/photo-1576013551627-0cc20b96c2a7?w=200&h=200&fit=crop',
  'https://images.unsplash.com/photo-1572331160708-dfad3c5b6d7d?w=1400&h=500&fit=crop',
  'Pool construction, lining and smart filtration systems.',
  'Design-build pool company serving the Mediterranean coast.',
  'pool-companies',
  true, true, false, 4.80, 57, 85, 30, 2007, 'ES', 'Spain', 'Barcelona',
  'Passeig de Gràcia 50, Barcelona', 41.3917, 2.1649,
  ARRAY['es','ca','en'], 'https://example.com/aquaform', '+34 93 000 1111',
  '{"timezone":"Europe/Madrid","days":{"mon":[["09:00","18:00"]],"tue":[["09:00","18:00"]],"wed":[["09:00","18:00"]],"thu":[["09:00","18:00"]],"fri":[["09:00","18:00"]],"sat":[["10:00","13:00"]],"sun":[]}}'::jsonb,
  '{}'::jsonb,
  'published'
),
(
  'nexus-smarthome',
  'Nexus Smart Home',
  'https://images.unsplash.com/photo-1558002038-1055907df827?w=200&h=200&fit=crop',
  'https://images.unsplash.com/photo-1558002038-1055907df827?w=1400&h=500&fit=crop',
  'Smart lighting, security and home automation integrators.',
  'KNX and Matter-ready installations for new builds and renovations.',
  'smart-home-companies',
  true, true, true, 4.88, 76, 140, 26, 2019, 'DE', 'Germany', 'Hamburg',
  'Jungfernstieg 10, Hamburg', 53.5534, 9.9922,
  ARRAY['de','en'], 'https://example.com/nexus-smart', '+49 40 111222',
  '{"timezone":"Europe/Berlin","days":{"mon":[["09:00","18:00"]],"tue":[["09:00","18:00"]],"wed":[["09:00","18:00"]],"thu":[["09:00","18:00"]],"fri":[["09:00","17:00"]],"sat":[],"sun":[]}}'::jsonb,
  '{"linkedin":"https://linkedin.com","youtube":"https://youtube.com"}'::jsonb,
  'published'
)
ON CONFLICT (slug) DO NOTHING;

-- Related seed rows for a few companies
INSERT INTO company_services (company_id, name, description, category_slug, sort_order)
SELECT c.id, s.name, s.description, s.category_slug, s.sort_order
FROM companies c
JOIN (VALUES
  ('bauhaus-berlin-group', 'Turnkey construction', 'End-to-end build management', 'construction-companies', 1),
  ('bauhaus-berlin-group', 'Project supervision', 'Site management and quality control', 'construction-companies', 2),
  ('renova-madrid', 'Kitchen renovation', 'Full kitchen remodel packages', 'renovation-companies', 1),
  ('solara-energy-lisbon', 'Rooftop PV install', 'Residential solar systems', 'solar-companies', 1),
  ('nexus-smarthome', 'Home automation', 'Lighting, climate and security hubs', 'smart-home-companies', 1)
) AS s(slug, name, description, category_slug, sort_order)
  ON c.slug = s.slug
WHERE NOT EXISTS (
  SELECT 1 FROM company_services cs WHERE cs.company_id = c.id AND cs.name = s.name
);

INSERT INTO company_gallery (company_id, url, caption, sort_order)
SELECT c.id, g.url, g.caption, g.sort_order
FROM companies c
JOIN (VALUES
  ('bauhaus-berlin-group', 'https://images.unsplash.com/photo-1541888946425-d81bb19240f5?w=800&h=600&fit=crop', 'Commercial build', 1),
  ('bauhaus-berlin-group', 'https://images.unsplash.com/photo-1503387762-592deb58ef4e?w=800&h=600&fit=crop', 'Residential site', 2),
  ('lumen-interior-milan', 'https://images.unsplash.com/photo-1616486338812-3dadae4b4ace?w=800&h=600&fit=crop', 'Living room', 1),
  ('solara-energy-lisbon', 'https://images.unsplash.com/photo-1508514177221-188b1cf16e9d?w=800&h=600&fit=crop', 'Rooftop array', 1)
) AS g(slug, url, caption, sort_order)
  ON c.slug = g.slug
WHERE NOT EXISTS (
  SELECT 1 FROM company_gallery cg WHERE cg.company_id = c.id AND cg.url = g.url
);

INSERT INTO company_brands (company_id, name, sort_order)
SELECT c.id, b.name, b.sort_order
FROM companies c
JOIN (VALUES
  ('volt-store-amsterdam', 'Schneider Electric', 1),
  ('volt-store-amsterdam', 'Philips', 2),
  ('toolhub-vienna', 'Bosch', 1),
  ('toolhub-vienna', 'Makita', 2),
  ('solara-energy-lisbon', 'SMA', 1),
  ('solara-energy-lisbon', 'JA Solar', 2)
) AS b(slug, name, sort_order)
  ON c.slug = b.slug
WHERE NOT EXISTS (
  SELECT 1 FROM company_brands cb WHERE cb.company_id = c.id AND cb.name = b.name
);

INSERT INTO company_team (company_id, name, role_title, sort_order)
SELECT c.id, t.name, t.role_title, t.sort_order
FROM companies c
JOIN (VALUES
  ('bauhaus-berlin-group', 'Anna Keller', 'Managing Director', 1),
  ('bauhaus-berlin-group', 'Markus Vogt', 'Site Lead', 2),
  ('atelier-nord-architects', 'Claire Dupont', 'Principal Architect', 1)
) AS t(slug, name, role_title, sort_order)
  ON c.slug = t.slug
WHERE NOT EXISTS (
  SELECT 1 FROM company_team ct WHERE ct.company_id = c.id AND ct.name = t.name
);

INSERT INTO company_certificates (company_id, title, issuer, year, sort_order)
SELECT c.id, x.title, x.issuer, x.year, x.sort_order
FROM companies c
JOIN (VALUES
  ('bauhaus-berlin-group', 'ISO 9001', 'TÜV', 2022, 1),
  ('solara-energy-lisbon', 'PV Installer Certified', 'APREN', 2023, 1)
) AS x(slug, title, issuer, year, sort_order)
  ON c.slug = x.slug
WHERE NOT EXISTS (
  SELECT 1 FROM company_certificates cc WHERE cc.company_id = c.id AND cc.title = x.title
);

INSERT INTO company_licenses (company_id, title, license_number, issuer, sort_order)
SELECT c.id, x.title, x.license_number, x.issuer, x.sort_order
FROM companies c
JOIN (VALUES
  ('bauhaus-berlin-group', 'General Contractor License', 'DE-BLN-44021', 'Berlin Chamber', 1),
  ('euro-engineering-warsaw', 'Structural Engineering License', 'PL-WWA-8821', 'PIIB', 1)
) AS x(slug, title, license_number, issuer, sort_order)
  ON c.slug = x.slug
WHERE NOT EXISTS (
  SELECT 1 FROM company_licenses cl WHERE cl.company_id = c.id AND cl.title = x.title
);

INSERT INTO company_portfolio (company_id, title, description, image_url, category_slug, sort_order)
SELECT c.id, p.title, p.description, p.image_url, p.category_slug, p.sort_order
FROM companies c
JOIN (VALUES
  ('bauhaus-berlin-group', 'Mitte Office Block', '8,000 m² commercial build', 'https://images.unsplash.com/photo-1486406146926-c627a92ad1ab?w=800&h=600&fit=crop', 'construction-companies', 1),
  ('renova-madrid', 'Salamanca Flat Remodel', 'Full apartment renovation', 'https://images.unsplash.com/photo-1581578731548-c64695cc6952?w=800&h=600&fit=crop', 'renovation-companies', 1),
  ('aquaform-pools', 'Costa Villa Pool', 'Infinity pool with smart filtration', 'https://images.unsplash.com/photo-1576013551627-0cc20b96c2a7?w=800&h=600&fit=crop', 'pool-companies', 1)
) AS p(slug, title, description, image_url, category_slug, sort_order)
  ON c.slug = p.slug
WHERE NOT EXISTS (
  SELECT 1 FROM company_portfolio cp WHERE cp.company_id = c.id AND cp.title = p.title
);

INSERT INTO company_reviews (company_id, reviewer_name, rating, comment, is_verified)
SELECT c.id, r.reviewer_name, r.rating, r.comment, true
FROM companies c
JOIN (VALUES
  ('bauhaus-berlin-group', 'Thomas M.', 5, 'On-time delivery and excellent site coordination.'),
  ('bauhaus-berlin-group', 'Elena K.', 5, 'Transparent budgeting throughout the project.'),
  ('renova-madrid', 'Carlos R.', 5, 'Kitchen renovation finished exactly as planned.'),
  ('solara-energy-lisbon', 'Ana S.', 5, 'Solar install was clean and production matches estimates.'),
  ('nexus-smarthome', 'Jonas P.', 5, 'Smart home setup works flawlessly with our HVAC.')
) AS r(slug, reviewer_name, rating, comment)
  ON c.slug = r.slug
WHERE NOT EXISTS (
  SELECT 1 FROM company_reviews cr
  WHERE cr.company_id = c.id AND cr.reviewer_name = r.reviewer_name AND cr.comment = r.comment
);

-- Refresh ratings from seeded reviews
DO $$
DECLARE
  cid uuid;
BEGIN
  FOR cid IN SELECT id FROM companies LOOP
    PERFORM public.refresh_company_rating(cid);
  END LOOP;
END $$;
