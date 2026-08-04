-- DImarket public business directory
-- profiles.id must already exist in auth.users (use scripts/import-public-directory.mjs --apply).
-- SEO fields are stored in data/directory/public-businesses.json (profiles has no SEO columns).
BEGIN;

-- B&P Bau (bp-bau-darmstadt)
UPDATE profiles SET
  full_name = 'B&P Bau',
  bio = 'Construction and renovation company headquartered in Darmstadt. Public service list covers new build and renovation, interior fit-out, facade and painting work, plus electrical, sanitary, and climate trades.',
  phone = NULL,
  location = 'Darmstadt, Hessen, Germany',
  website = 'https://www.b-pbau.de/',
  user_role = 'company',
  is_professional = true,
  languages = ARRAY['de']::text[],
  preferred_language = 'de',
  work_subcategory_slugs = ARRAY['masonry-partitions', 'painting-walls', 'painting-facade', 'electro-wiring', 'plumbing-install', 'hvac-ac', 'drywall-install']::text[],
  availability_status = 'available',
  updated_at = now()
WHERE website = 'https://www.b-pbau.de/'
   OR (full_name = 'B&P Bau' AND location ILIKE '%Darmstadt%');

-- Domenico Di Santo Malerbetrieb (domenico-di-santo-malerbetrieb-darmstadt)
UPDATE profiles SET
  full_name = 'Domenico Di Santo Malerbetrieb',
  bio = 'Family-run painting business serving Darmstadt and nearby towns. Publicly described services include painting, wallpapering, plastering, drywall, and floor covering for private, commercial, and institutional clients.',
  phone = NULL,
  location = 'Darmstadt, Hessen, Germany',
  website = 'https://www.disanto-domenico.de/malerbetrieb-darmstadt/',
  user_role = 'professional',
  is_professional = true,
  languages = ARRAY['de']::text[],
  preferred_language = 'de',
  work_subcategory_slugs = ARRAY['painting-walls', 'painting-ceiling', 'plastering-manual', 'drywall-install', 'flooring-laminate', 'wallpaper-install']::text[],
  availability_status = 'available',
  updated_at = now()
WHERE website = 'https://www.disanto-domenico.de/malerbetrieb-darmstadt/'
   OR (full_name = 'Domenico Di Santo Malerbetrieb' AND location ILIKE '%Darmstadt%');

-- Heinrich Schmid GmbH & Co. KG — Darmstadt (heinrich-schmid-darmstadt)
UPDATE profiles SET
  full_name = 'Heinrich Schmid GmbH & Co. KG — Darmstadt',
  bio = 'Regional branch of a German trades company in Darmstadt. Public location lists painting, drywall, flooring, tiling, plaster, facade renovation, and insulation for residential and commercial interiors.',
  phone = '+49 6151 1301912',
  location = 'Darmstadt, Hessen, Germany',
  website = 'https://www.heinrich-schmid.com/standorte/darmstadt-273/',
  user_role = 'company',
  is_professional = true,
  languages = ARRAY['de', 'en']::text[],
  preferred_language = 'de',
  work_subcategory_slugs = ARRAY['painting-walls', 'painting-facade', 'drywall-install', 'drywall-partitions', 'flooring-parquet', 'flooring-laminate', 'flooring-screed', 'tiling-install', 'plastering-manual', 'facade-insulation', 'insulation-thermal', 'facade-repair']::text[],
  availability_status = 'available',
  updated_at = now()
WHERE website = 'https://www.heinrich-schmid.com/standorte/darmstadt-273/'
   OR (full_name = 'Heinrich Schmid GmbH & Co. KG — Darmstadt' AND location ILIKE '%Darmstadt%');

-- Kraft GmbH Darmstadt (kraft-gmbh-darmstadt)
UPDATE profiles SET
  full_name = 'Kraft GmbH Darmstadt',
  bio = 'Darmstadt finishing trades company with a public workshop address in the Messeler Park area. Listed services focus on interior painting and renovation of residential and commercial rooms.',
  phone = '+49 6151 384170',
  location = 'Darmstadt, Hessen, Germany',
  website = 'https://www.kraft-gmbh-darmstadt.de/',
  user_role = 'company',
  is_professional = true,
  languages = ARRAY['de']::text[],
  preferred_language = 'de',
  work_subcategory_slugs = ARRAY['painting-walls', 'painting-ceiling', 'drywall-install', 'plastering-manual']::text[],
  availability_status = 'available',
  updated_at = now()
WHERE website = 'https://www.kraft-gmbh-darmstadt.de/'
   OR (full_name = 'Kraft GmbH Darmstadt' AND location ILIKE '%Darmstadt%');

-- Patrick Noël Malerhandwerk GmbH (patrick-noel-malerhandwerk-darmstadt)
UPDATE profiles SET
  full_name = 'Patrick Noël Malerhandwerk GmbH',
  bio = 'Registered painting trades company in Darmstadt-Eberstadt. Public impressum lists painting and related finishing work, with selective demolition and renovation support for private and commercial properties.',
  phone = '+49 6151 5013326',
  location = 'Darmstadt, Hessen, Germany',
  website = 'https://www.noel-malerhandwerk.de/',
  user_role = 'company',
  is_professional = true,
  languages = ARRAY['de']::text[],
  preferred_language = 'de',
  work_subcategory_slugs = ARRAY['painting-walls', 'painting-ceiling', 'painting-facade', 'plastering-manual', 'demolition-walls', 'demolition-partitions']::text[],
  availability_status = 'available',
  updated_at = now()
WHERE website = 'https://www.noel-malerhandwerk.de/'
   OR (full_name = 'Patrick Noël Malerhandwerk GmbH' AND location ILIKE '%Darmstadt%');

-- Stark Elektro (stark-elektro-darmstadt)
UPDATE profiles SET
  full_name = 'Stark Elektro',
  bio = 'Master electrician company based in Darmstadt serving the Rhine-Main area. Publicly listed services cover electrical installation and renovation, photovoltaic systems, EV wallboxes, and smart-home wiring for residential and commercial clients.',
  phone = '+49 177 6988882',
  location = 'Darmstadt, Hessen, Germany',
  website = 'https://stark-elektro.de/',
  user_role = 'company',
  is_professional = true,
  languages = ARRAY['de', 'en']::text[],
  preferred_language = 'de',
  work_subcategory_slugs = ARRAY['electro-wiring', 'electro-rewiring', 'electro-panels', 'electro-lighting', 'electro-smart-home', 'solar-panels', 'solar-installation', 'smart-home-systems']::text[],
  availability_status = 'available',
  updated_at = now()
WHERE website = 'https://stark-elektro.de/'
   OR (full_name = 'Stark Elektro' AND location ILIKE '%Darmstadt%');

-- Zimmermann & Sohn GmbH (zimmermann-und-sohn-darmstadt)
UPDATE profiles SET
  full_name = 'Zimmermann & Sohn GmbH',
  bio = 'Long-established painting and finishing company in Darmstadt. Public site lists painting, plastering, drywall, flooring, tiling, facade work, and insulation for renovation and heritage-related projects.',
  phone = '+49 6151 46297',
  location = 'Darmstadt, Hessen, Germany',
  website = 'https://zimmermannundsohn.de/',
  user_role = 'company',
  is_professional = true,
  languages = ARRAY['de']::text[],
  preferred_language = 'de',
  work_subcategory_slugs = ARRAY['painting-walls', 'painting-facade', 'plastering-manual', 'plastering-decorative', 'drywall-install', 'flooring-parquet', 'tiling-install', 'facade-insulation', 'wallpaper-install']::text[],
  availability_status = 'available',
  updated_at = now()
WHERE website = 'https://zimmermannundsohn.de/'
   OR (full_name = 'Zimmermann & Sohn GmbH' AND location ILIKE '%Darmstadt%');

-- Carbonell Reformas Alicante (carbonell-reformas-alicante)
UPDATE profiles SET
  full_name = 'Carbonell Reformas Alicante',
  bio = 'Alicante renovation firm established around 2010. Public listings cover full-flat, bathroom, and kitchen renovations plus facade and commercial fit-out work, with published weekday and Saturday hours.',
  phone = '+34 966 262 802',
  location = 'Alicante, Valencia, Spain',
  website = 'https://carbonellreformasalicante.com/',
  user_role = 'company',
  is_professional = true,
  languages = ARRAY['es', 'en']::text[],
  preferred_language = 'es',
  work_subcategory_slugs = ARRAY['plumbing-install', 'electro-wiring', 'tiling-bathroom', 'tiling-kitchen', 'painting-walls', 'carpentry-doors-install', 'design-engineering-interior', 'demolition-partitions']::text[],
  availability_status = 'available',
  updated_at = now()
WHERE website = 'https://carbonellreformasalicante.com/'
   OR (full_name = 'Carbonell Reformas Alicante' AND location ILIKE '%Alicante%');

-- Coypa Reformas y Fontanería Alicante (coypa-fontaneria-reformas-alicante)
UPDATE profiles SET
  full_name = 'Coypa Reformas y Fontanería Alicante',
  bio = 'Alicante plumbing and renovation company with a public address on Calle Nou d’Octubre. Services listed include bathroom renovations, plumbing repairs, electrical work, and air-conditioning interventions.',
  phone = NULL,
  location = 'Alicante, Valencia, Spain',
  website = 'https://fontaneriayreformasalicante.com/',
  user_role = 'company',
  is_professional = true,
  languages = ARRAY['es']::text[],
  preferred_language = 'es',
  work_subcategory_slugs = ARRAY['plumbing-install', 'plumbing-repair', 'plumbing-showers', 'electro-wiring', 'hvac-ac', 'tiling-bathroom']::text[],
  availability_status = 'available',
  updated_at = now()
WHERE website = 'https://fontaneriayreformasalicante.com/'
   OR (full_name = 'Coypa Reformas y Fontanería Alicante' AND location ILIKE '%Alicante%');

-- Explanada Reformas (explanada-reformas-alicante)
UPDATE profiles SET
  full_name = 'Explanada Reformas',
  bio = 'Alicante renovation company with a public office on Calle Jacinto Maltés. Listed projects cover full residential renovations, commercial premises, and second homes in Alicante and nearby areas.',
  phone = '+34 865 443 420',
  location = 'Alicante, Valencia, Spain',
  website = 'https://reformasintegralesalicante.pro/',
  user_role = 'company',
  is_professional = true,
  languages = ARRAY['es']::text[],
  preferred_language = 'es',
  work_subcategory_slugs = ARRAY['masonry-partitions', 'plumbing-install', 'electro-wiring', 'painting-walls', 'tiling-install', 'flooring-laminate']::text[],
  availability_status = 'available',
  updated_at = now()
WHERE website = 'https://reformasintegralesalicante.pro/'
   OR (full_name = 'Explanada Reformas' AND location ILIKE '%Alicante%');

-- MultiHogar Alicante (multihogar-alicante)
UPDATE profiles SET
  full_name = 'MultiHogar Alicante',
  bio = 'Home services company based in El Campello (Alicante province). Public contact lists plumbing, authorized electrical work, shutter repairs, and general residential call-outs.',
  phone = '+34 627 378 977',
  location = 'Alicante, Valencia, Spain',
  website = 'https://multihogaralicante.es/',
  user_role = 'company',
  is_professional = true,
  languages = ARRAY['es']::text[],
  preferred_language = 'es',
  work_subcategory_slugs = ARRAY['plumbing-repair', 'plumbing-install', 'electro-wiring', 'electro-outlets', 'electro-lighting', 'windows-repair']::text[],
  availability_status = 'available',
  updated_at = now()
WHERE website = 'https://multihogaralicante.es/'
   OR (full_name = 'MultiHogar Alicante' AND location ILIKE '%Alicante%');

-- Reformas Alacant (reformas-alacant)
UPDATE profiles SET
  full_name = 'Reformas Alacant',
  bio = 'Alicante renovation company coordinating in-house plumbing, electrical, carpentry, drywall, masonry, and painting trades. Public contact lists full-home, kitchen, bathroom, and commercial premises renovations across the city.',
  phone = '+34 634 579 438',
  location = 'Alicante, Valencia, Spain',
  website = 'https://reformasalacant.es/',
  user_role = 'company',
  is_professional = true,
  languages = ARRAY['es', 'en']::text[],
  preferred_language = 'es',
  work_subcategory_slugs = ARRAY['plumbing-install', 'plumbing-showers', 'electro-wiring', 'electro-lighting', 'painting-walls', 'drywall-install', 'drywall-suspended-ceiling', 'carpentry-doors-install', 'masonry-partitions', 'tiling-bathroom', 'tiling-kitchen', 'demolition-partitions']::text[],
  availability_status = 'available',
  updated_at = now()
WHERE website = 'https://reformasalacant.es/'
   OR (full_name = 'Reformas Alacant' AND location ILIKE '%Alicante%');

-- Reformas Esquivel (reformas-esquivel-alicante)
UPDATE profiles SET
  full_name = 'Reformas Esquivel',
  bio = 'Independent renovation trades business serving Alicante. Public service list includes plumbing, masonry, tiling, painting, and door/window fitting for residential clients.',
  phone = NULL,
  location = 'Alicante, Valencia, Spain',
  website = 'https://www.reformasesquivel.com/',
  user_role = 'professional',
  is_professional = true,
  languages = ARRAY['es']::text[],
  preferred_language = 'es',
  work_subcategory_slugs = ARRAY['plumbing-repair', 'plumbing-install', 'plumbing-showers', 'painting-walls', 'tiling-install', 'masonry-partitions', 'carpentry-doors-install', 'windows-install']::text[],
  availability_status = 'available',
  updated_at = now()
WHERE website = 'https://www.reformasesquivel.com/'
   OR (full_name = 'Reformas Esquivel' AND location ILIKE '%Alicante%');

-- Urbasan Reformas & Interiorismo (urbasan-alicante)
UPDATE profiles SET
  full_name = 'Urbasan Reformas & Interiorismo',
  bio = 'Alicante renovation and interior-design company with a public showroom address on Calle San Agatángelo. Listed work includes turnkey home renovations plus kitchen and bathroom projects.',
  phone = '+34 965 133 046',
  location = 'Alicante, Valencia, Spain',
  website = 'https://www.urbasan.com/',
  user_role = 'company',
  is_professional = true,
  languages = ARRAY['es']::text[],
  preferred_language = 'es',
  work_subcategory_slugs = ARRAY['design-engineering-interior', 'tiling-bathroom', 'tiling-kitchen', 'plumbing-install', 'electro-wiring', 'painting-walls', 'carpentry-doors-install']::text[],
  availability_status = 'available',
  updated_at = now()
WHERE website = 'https://www.urbasan.com/'
   OR (full_name = 'Urbasan Reformas & Interiorismo' AND location ILIKE '%Alicante%');

-- Construcciones Carmona (construcciones-carmona-madrid)
UPDATE profiles SET
  full_name = 'Construcciones Carmona',
  bio = 'Family construction and renovation company based in Mataelpino, covering Madrid city and the northwest sierra municipalities. Public hours and trades include masonry, plumbing, electrical, carpentry, climate, and painting.',
  phone = '+34 613 014 831',
  location = 'Madrid, Madrid, Spain',
  website = 'https://construccionesreformasmadrid.es/',
  user_role = 'company',
  is_professional = true,
  languages = ARRAY['es']::text[],
  preferred_language = 'es',
  work_subcategory_slugs = ARRAY['masonry-brick', 'masonry-partitions', 'plumbing-install', 'electro-wiring', 'hvac-ac', 'painting-walls', 'carpentry-doors-install', 'carpentry-wood-structures']::text[],
  availability_status = 'available',
  updated_at = now()
WHERE website = 'https://construccionesreformasmadrid.es/'
   OR (full_name = 'Construcciones Carmona' AND location ILIKE '%Madrid%');

-- JM Reformas Élite S.L. (jm-reformas-elite-madrid)
UPDATE profiles SET
  full_name = 'JM Reformas Élite S.L.',
  bio = 'Madrid renovation company (S.L.) with a published address in the south of the city. Public services span demolition, masonry, plumbing, electrical work, painting, tiling, and full home renovations.',
  phone = '+34 624 614 361',
  location = 'Madrid, Madrid, Spain',
  website = 'https://jmreformaselite.com/',
  user_role = 'company',
  is_professional = true,
  languages = ARRAY['es']::text[],
  preferred_language = 'es',
  work_subcategory_slugs = ARRAY['demolition-partitions', 'demolition-walls', 'masonry-partitions', 'plumbing-install', 'electro-wiring', 'painting-walls', 'tiling-install', 'carpentry-doors-install']::text[],
  availability_status = 'available',
  updated_at = now()
WHERE website = 'https://jmreformaselite.com/'
   OR (full_name = 'JM Reformas Élite S.L.' AND location ILIKE '%Madrid%');

-- REFISER — Obras y Reformas (refiser-madrid)
UPDATE profiles SET
  full_name = 'REFISER — Obras y Reformas',
  bio = 'Madrid renovation and building-works company with a public office on Calle Ebanistería. Listed trades include masonry, plumbing, electrical work, painting, and carpentry for homes and commercial premises.',
  phone = '+34 638 419 932',
  location = 'Madrid, Madrid, Spain',
  website = 'https://refiser.com/',
  user_role = 'company',
  is_professional = true,
  languages = ARRAY['es']::text[],
  preferred_language = 'es',
  work_subcategory_slugs = ARRAY['masonry-partitions', 'plumbing-install', 'plumbing-repair', 'plumbing-heating', 'electro-wiring', 'electro-outlets', 'painting-walls', 'carpentry-doors-install']::text[],
  availability_status = 'available',
  updated_at = now()
WHERE website = 'https://refiser.com/'
   OR (full_name = 'REFISER — Obras y Reformas' AND location ILIKE '%Madrid%');

-- Reformas y Multiservicios Moraga (reformas-multiservicios-moraga-madrid)
UPDATE profiles SET
  full_name = 'Reformas y Multiservicios Moraga',
  bio = 'Madrid multi-service renovation and plumbing company with a public address on Calle Menasalbas. Listed work includes plumbing call-outs, bathroom and kitchen renovations, electrical work, painting, floors, and doors.',
  phone = '+34 625 112 025',
  location = 'Madrid, Madrid, Spain',
  website = 'https://www.reformasymultiservicios.es/',
  user_role = 'company',
  is_professional = true,
  languages = ARRAY['es']::text[],
  preferred_language = 'es',
  work_subcategory_slugs = ARRAY['plumbing-repair', 'plumbing-boilers', 'plumbing-showers', 'electro-wiring', 'painting-walls', 'flooring-laminate', 'carpentry-doors-install']::text[],
  availability_status = 'available',
  updated_at = now()
WHERE website = 'https://www.reformasymultiservicios.es/'
   OR (full_name = 'Reformas y Multiservicios Moraga' AND location ILIKE '%Madrid%');

COMMIT;
