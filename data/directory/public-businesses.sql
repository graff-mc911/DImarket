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

-- Bilbao Fontaneros (bilbao-fontaneros)
UPDATE profiles SET
  full_name = 'Bilbao Fontaneros',
  bio = 'Bilbao plumbing company with a published address in Ugasko and weekday/Saturday hours. Public services cover plumbing repairs and installations, bathroom renovations, heating/hot water, and urgent call-outs within stated hours across Bizkaia.',
  phone = '+34 944 483 647',
  location = 'Bilbao, Basque Country, Spain',
  website = 'https://www.bilbaofontaneros.com/',
  user_role = 'company',
  is_professional = true,
  languages = ARRAY['es', 'eu']::text[],
  preferred_language = 'es',
  work_subcategory_slugs = ARRAY['plumbing-repair', 'plumbing-install', 'plumbing-heating', 'plumbing-boilers', 'plumbing-showers', 'hvac-heating', 'tiling-bathroom']::text[],
  availability_status = 'available',
  updated_at = now()
WHERE website = 'https://www.bilbaofontaneros.com/'
   OR (full_name = 'Bilbao Fontaneros' AND location ILIKE '%Bilbao%');

-- Reformas Vilar (reformas-vilar-barcelona)
UPDATE profiles SET
  full_name = 'Reformas Vilar',
  bio = 'Barcelona-area renovation company based in Esplugues de Llobregat. Public contact lists full and partial renovations of homes, bathrooms, kitchens, and commercial premises with plumbing, electrical, drywall, painting, and carpentry trades.',
  phone = '+34 678 824 747',
  location = 'Esplugues de Llobregat, Catalonia, Spain',
  website = 'https://reformasvilar.com/',
  user_role = 'company',
  is_professional = true,
  languages = ARRAY['es', 'ca']::text[],
  preferred_language = 'es',
  work_subcategory_slugs = ARRAY['plumbing-install', 'electro-wiring', 'painting-walls', 'drywall-install', 'masonry-partitions', 'carpentry-doors-install', 'tiling-bathroom', 'tiling-kitchen', 'windows-aluminum']::text[],
  availability_status = 'available',
  updated_at = now()
WHERE website = 'https://reformasvilar.com/'
   OR (full_name = 'Reformas Vilar' AND location ILIKE '%Esplugues de Llobregat%');

-- Fontaneros Granada (fontaneros-granada)
UPDATE profiles SET
  full_name = 'Fontaneros Granada',
  bio = 'Granada plumbing company publicly listing round-the-clock emergency call-outs plus scheduled installations, boiler/heater work, and bathroom renovation services across Granada city and nearby municipalities.',
  phone = '+34 958 223 491',
  location = 'Granada, Andalusia, Spain',
  website = 'https://granadafontaneros.com/',
  user_role = 'company',
  is_professional = true,
  languages = ARRAY['es']::text[],
  preferred_language = 'es',
  work_subcategory_slugs = ARRAY['plumbing-repair', 'plumbing-install', 'plumbing-boilers', 'plumbing-showers', 'tiling-bathroom']::text[],
  availability_status = 'available',
  updated_at = now()
WHERE website = 'https://granadafontaneros.com/'
   OR (full_name = 'Fontaneros Granada' AND location ILIKE '%Granada%');

-- Instalaciones y Reformas (instalaciones-y-reformas-barcelona)
UPDATE profiles SET
  full_name = 'Instalaciones y Reformas',
  bio = 'Electrical installation and renovation company with a published shop address in L’Hospitalet de Llobregat serving the Barcelona area. Public phones and email are listed for electrical reforms and related works.',
  phone = '+34 933 377 548',
  location = 'L''Hospitalet de Llobregat, Catalonia, Spain',
  website = 'https://www.instalacionesyreformas.es/',
  user_role = 'company',
  is_professional = true,
  languages = ARRAY['es', 'ca']::text[],
  preferred_language = 'es',
  work_subcategory_slugs = ARRAY['electro-wiring', 'electro-panels', 'electro-lighting', 'electro-outlets', 'plumbing-install']::text[],
  availability_status = 'available',
  updated_at = now()
WHERE website = 'https://www.instalacionesyreformas.es/'
   OR (full_name = 'Instalaciones y Reformas' AND location ILIKE '%L''Hospitalet de Llobregat%');

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

-- Grupo Reinsol (grupo-reinsol-malaga)
UPDATE profiles SET
  full_name = 'Grupo Reinsol',
  bio = 'Málaga construction and renovation company with a published city-centre office. Public services include full renovations, kitchens, bathrooms, commercial spaces, facade rehabilitation, interior design, and community maintenance.',
  phone = '+34 661 948 116',
  location = 'Málaga, Andalusia, Spain',
  website = 'https://www.gruporeinsol.com/',
  user_role = 'company',
  is_professional = true,
  languages = ARRAY['es']::text[],
  preferred_language = 'es',
  work_subcategory_slugs = ARRAY['masonry-brick', 'masonry-partitions', 'plumbing-install', 'electro-wiring', 'painting-walls', 'facade-repair', 'design-engineering-interior']::text[],
  availability_status = 'available',
  updated_at = now()
WHERE website = 'https://www.gruporeinsol.com/'
   OR (full_name = 'Grupo Reinsol' AND location ILIKE '%Málaga%');

-- Insergan Servicios y Mantenimientos S.L. (insergan-malaga)
UPDATE profiles SET
  full_name = 'Insergan Servicios y Mantenimientos S.L.',
  bio = 'Family construction and maintenance company in Málaga. Public listings cover rehabilitation, renovations of homes and commercial premises, community repairs, and technical advice for building maintenance in Málaga and eastern Andalusia.',
  phone = '+34 952 313 006',
  location = 'Málaga, Andalusia, Spain',
  website = 'https://insergan.com/',
  user_role = 'company',
  is_professional = true,
  languages = ARRAY['es']::text[],
  preferred_language = 'es',
  work_subcategory_slugs = ARRAY['masonry-brick', 'masonry-partitions', 'facade-repair', 'plumbing-install', 'electro-wiring', 'painting-walls']::text[],
  availability_status = 'available',
  updated_at = now()
WHERE website = 'https://insergan.com/'
   OR (full_name = 'Insergan Servicios y Mantenimientos S.L.' AND location ILIKE '%Málaga%');

-- Reformas Group S.L. (reformas-group-malaga)
UPDATE profiles SET
  full_name = 'Reformas Group S.L.',
  bio = 'Málaga renovation company (S.L.) with a published office on Emilio López Cerezo. Public listings cover full and partial renovations of homes, chalets, kitchens, bathrooms, offices, and commercial spaces in Málaga and Costa del Sol municipalities.',
  phone = '+34 684 744 071',
  location = 'Málaga, Andalusia, Spain',
  website = 'https://reformasgroup.es/',
  user_role = 'company',
  is_professional = true,
  languages = ARRAY['es', 'en']::text[],
  preferred_language = 'es',
  work_subcategory_slugs = ARRAY['masonry-partitions', 'plumbing-install', 'electro-wiring', 'tiling-bathroom', 'tiling-kitchen', 'painting-walls', 'carpentry-doors-install']::text[],
  availability_status = 'available',
  updated_at = now()
WHERE website = 'https://reformasgroup.es/'
   OR (full_name = 'Reformas Group S.L.' AND location ILIKE '%Málaga%');

-- Castillo Reformas (castillo-reformas-murcia)
UPDATE profiles SET
  full_name = 'Castillo Reformas',
  bio = 'Murcia-region renovation company with a published phone and email. Public services include full renovations, kitchens, bathrooms, tiling, flooring, drywall, plumbing, electrical work, carpentry, and facade rehabilitation across Murcia and nearby towns.',
  phone = '+34 619 861 323',
  location = 'Murcia, Murcia, Spain',
  website = 'https://www.castilloreformas.com/',
  user_role = 'company',
  is_professional = true,
  languages = ARRAY['es']::text[],
  preferred_language = 'es',
  work_subcategory_slugs = ARRAY['tiling-bathroom', 'tiling-kitchen', 'flooring-laminate', 'drywall-install', 'plumbing-install', 'electro-wiring', 'painting-walls', 'masonry-partitions', 'carpentry-doors-install', 'facade-repair']::text[],
  availability_status = 'available',
  updated_at = now()
WHERE website = 'https://www.castilloreformas.com/'
   OR (full_name = 'Castillo Reformas' AND location ILIKE '%Murcia%');

-- TECNIASIST (tecniasist-granada)
UPDATE profiles SET
  full_name = 'TECNIASIST',
  bio = 'Granada-area renovation and repair company based in Peligros (Juncaril industrial estate). Public hours and services cover full renovations, emergency plumbing, electrical work, masonry, drywall, painting, tiling, and general home repairs across Granada metro.',
  phone = '+34 645 515 888',
  location = 'Peligros, Andalusia, Spain',
  website = 'https://tecniasist.es/',
  user_role = 'company',
  is_professional = true,
  languages = ARRAY['es']::text[],
  preferred_language = 'es',
  work_subcategory_slugs = ARRAY['plumbing-repair', 'plumbing-install', 'electro-wiring', 'painting-walls', 'drywall-install', 'masonry-partitions', 'tiling-install', 'carpentry-doors-install', 'demolition-partitions']::text[],
  availability_status = 'available',
  updated_at = now()
WHERE website = 'https://tecniasist.es/'
   OR (full_name = 'TECNIASIST' AND location ILIKE '%Peligros%');

-- DeReformaSevilla (dereforma-sevilla)
UPDATE profiles SET
  full_name = 'DeReformaSevilla',
  bio = 'Seville renovation company with published weekday hours. Public service list covers flats, bathrooms, kitchens, offices, commercial premises, terraces, and facade-related renovations across Seville districts.',
  phone = '+34 614 174 191',
  location = 'Sevilla, Andalusia, Spain',
  website = 'https://dereformasevilla.es/',
  user_role = 'company',
  is_professional = true,
  languages = ARRAY['es']::text[],
  preferred_language = 'es',
  work_subcategory_slugs = ARRAY['masonry-partitions', 'tiling-bathroom', 'tiling-kitchen', 'plumbing-install', 'electro-wiring', 'painting-walls', 'facade-repair']::text[],
  availability_status = 'available',
  updated_at = now()
WHERE website = 'https://dereformasevilla.es/'
   OR (full_name = 'DeReformaSevilla' AND location ILIKE '%Sevilla%');

-- Reforma Integral VLC (reforma-integral-vlc-torrent)
UPDATE profiles SET
  full_name = 'Reforma Integral VLC',
  bio = 'Renovation company based in Torrent (Valencia metro area) with a published street address. Public services cover full renovations plus electrical and plumbing works for homes and businesses.',
  phone = '+34 696 583 457',
  location = 'Torrent, Valencia, Spain',
  website = 'https://reformaintegralenvalencia.com/',
  user_role = 'company',
  is_professional = true,
  languages = ARRAY['es']::text[],
  preferred_language = 'es',
  work_subcategory_slugs = ARRAY['electro-wiring', 'plumbing-install', 'painting-walls', 'tiling-install', 'masonry-partitions', 'demolition-partitions']::text[],
  availability_status = 'available',
  updated_at = now()
WHERE website = 'https://reformaintegralenvalencia.com/'
   OR (full_name = 'Reforma Integral VLC' AND location ILIKE '%Torrent%');

-- Lamin Reformas y Fontanería (lamin-reformas-fontaneria-valencia)
UPDATE profiles SET
  full_name = 'Lamin Reformas y Fontanería',
  bio = 'Valencia plumbing and renovation business publicly advertising round-the-clock plumbing and electrical emergencies plus bathroom, kitchen, and general home renovations across the Valencian Community.',
  phone = NULL,
  location = 'Valencia, Valencia, Spain',
  website = 'https://reformaslamin.com/',
  user_role = 'professional',
  is_professional = true,
  languages = ARRAY['es']::text[],
  preferred_language = 'es',
  work_subcategory_slugs = ARRAY['plumbing-repair', 'plumbing-install', 'plumbing-showers', 'electro-wiring', 'tiling-bathroom', 'tiling-kitchen']::text[],
  availability_status = 'available',
  updated_at = now()
WHERE website = 'https://reformaslamin.com/'
   OR (full_name = 'Lamin Reformas y Fontanería' AND location ILIKE '%Valencia%');

-- Reformas Valencia 10 (reformas-valencia-10)
UPDATE profiles SET
  full_name = 'Reformas Valencia 10',
  bio = 'Valencia-city renovation firm with a public base in the Extramurs area. Listed work includes full renovations, kitchens, bathrooms, commercial premises, and coordinated masonry, plumbing, electrical, painting, and drywall trades.',
  phone = NULL,
  location = 'Valencia, Valencia, Spain',
  website = 'https://reformasvalencia10.es/',
  user_role = 'company',
  is_professional = true,
  languages = ARRAY['es']::text[],
  preferred_language = 'es',
  work_subcategory_slugs = ARRAY['masonry-partitions', 'plumbing-install', 'electro-wiring', 'painting-walls', 'drywall-install', 'tiling-bathroom', 'tiling-kitchen', 'carpentry-doors-install']::text[],
  availability_status = 'available',
  updated_at = now()
WHERE website = 'https://reformasvalencia10.es/'
   OR (full_name = 'Reformas Valencia 10' AND location ILIKE '%Valencia%');

-- VR Valencia Reformas (vr-valencia-reformas)
UPDATE profiles SET
  full_name = 'VR Valencia Reformas',
  bio = 'Valencia renovation company publicly listing full-home and commercial renovations with plumbing, electrical, painting, drywall, and air-conditioning trades, plus architecture support for chalets, flats, and offices.',
  phone = '+34 963 145 430',
  location = 'Valencia, Valencia, Spain',
  website = 'https://www.vrvalenciareformas.com/',
  user_role = 'company',
  is_professional = true,
  languages = ARRAY['es']::text[],
  preferred_language = 'es',
  work_subcategory_slugs = ARRAY['plumbing-install', 'electro-wiring', 'painting-walls', 'drywall-install', 'hvac-ac', 'tiling-bathroom', 'tiling-kitchen', 'design-engineering-architect', 'carpentry-doors-install']::text[],
  availability_status = 'available',
  updated_at = now()
WHERE website = 'https://www.vrvalenciareformas.com/'
   OR (full_name = 'VR Valencia Reformas' AND location ILIKE '%Valencia%');

-- SEIA Reformas y Proyectos (seia-reformas-zaragoza)
UPDATE profiles SET
  full_name = 'SEIA Reformas y Proyectos',
  bio = 'Zaragoza renovation firm with a published Actur-area office. Public services include full renovations of homes, offices, and industrial spaces, plus kitchens, bathrooms, climate systems, lighting/automation, and architecture coordination.',
  phone = '+34 976 958 638',
  location = 'Zaragoza, Aragon, Spain',
  website = 'https://www.seia.es/',
  user_role = 'company',
  is_professional = true,
  languages = ARRAY['es']::text[],
  preferred_language = 'es',
  work_subcategory_slugs = ARRAY['tiling-bathroom', 'tiling-kitchen', 'carpentry-doors-install', 'hvac-heating', 'hvac-ac', 'electro-smart-home', 'electro-lighting', 'design-engineering-interior', 'design-engineering-architect', 'insulation-thermal']::text[],
  availability_status = 'available',
  updated_at = now()
WHERE website = 'https://www.seia.es/'
   OR (full_name = 'SEIA Reformas y Proyectos' AND location ILIKE '%Zaragoza%');

COMMIT;
