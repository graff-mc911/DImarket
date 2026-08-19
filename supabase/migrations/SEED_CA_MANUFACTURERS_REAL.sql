-- ============================================================
-- Commercial Agents — REAL manufacturer profiles (Europe brands)
-- Source: data/commercial-agents/manufacturers-europe.json
-- Paste into Supabase SQL Editor → Run
-- Idempotent: fixed UUIDs per slug; safe to re-run
-- ============================================================

CREATE EXTENSION IF NOT EXISTS pgcrypto;

DO $$
DECLARE
  v_user uuid;
  v_email text;
BEGIN
  -- Knauf
  v_user := '325782e2-9830-4316-af94-b42d44965098'::uuid;
  v_email := 'directory+mfr-knauf@users.dimarket.app';

  IF NOT EXISTS (SELECT 1 FROM auth.users WHERE id = v_user) THEN
    INSERT INTO auth.users (
      instance_id, id, aud, role, email, encrypted_password, email_confirmed_at,
      raw_app_meta_data, raw_user_meta_data, created_at, updated_at,
      confirmation_token, recovery_token, email_change_token_new, email_change
    ) VALUES (
      '00000000-0000-0000-0000-000000000000',
      v_user,
      'authenticated',
      'authenticated',
      v_email,
      crypt(encode(gen_random_bytes(16), 'hex'), gen_salt('bf')),
      now(),
      '{"provider":"email","providers":["email"]}'::jsonb,
      jsonb_build_object('full_name', 'Knauf', 'commercial_manufacturer', true),
      now(), now(),
      '', '', '', ''
    );
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM auth.identities WHERE user_id = v_user AND provider = 'email'
  ) THEN
    INSERT INTO auth.identities (
      id, user_id, identity_data, provider, provider_id, last_sign_in_at, created_at, updated_at
    ) VALUES (
      v_user,
      v_user,
      jsonb_build_object('sub', v_user::text, 'email', v_email),
      'email',
      v_user::text,
      now(), now(), now()
    );
  END IF;

  INSERT INTO public.profiles AS p (
    id, full_name, bio, website, phone, location, user_role, is_professional,
    service_latitude, service_longitude, avatar_url, profile_photo, languages,
    availability_status, is_verified, verification_level
  ) VALUES (
    v_user,
    'Knauf',
    'Gypsum boards, plasters, insulation and drywall systems for construction and renovation.',
    'https://www.knauf.com',
    NULL,
    'Iphofen, Germany',
    'company',
    true,
    49.7042,
    10.2611,
    'https://dimarket.app/ads/brands/knauf.png',
    'https://dimarket.app/ads/brands/knauf.png',
    ARRAY['DE', 'EN', 'UA', 'PL']::text[],
    'available',
    true,
    'gold'
  )
  ON CONFLICT (id) DO UPDATE SET
    full_name = EXCLUDED.full_name,
    bio = EXCLUDED.bio,
    website = EXCLUDED.website,
    phone = COALESCE(EXCLUDED.phone, p.phone),
    location = EXCLUDED.location,
    user_role = 'company',
    is_professional = true,
    service_latitude = EXCLUDED.service_latitude,
    service_longitude = EXCLUDED.service_longitude,
    avatar_url = EXCLUDED.avatar_url,
    profile_photo = EXCLUDED.profile_photo,
    languages = EXCLUDED.languages,
    is_verified = true,
    verification_level = 'gold';

  INSERT INTO public.manufacturer_profiles AS mfr (
    profile_id, slug, company_name, description, website, logo_url,
    public_email, public_phone, show_public_contacts,
    country, headquarters, categories, products,
    target_markets, countries_available, languages,
    agent_required, non_exclusive_representation, exclusive_representation,
    verification_status, is_published, images
  ) VALUES (
    v_user,
    'knauf',
    'Knauf',
    'Gypsum boards, plasters, insulation and drywall systems for construction and renovation.',
    'https://www.knauf.com',
    'https://dimarket.app/ads/brands/knauf.png',
    'info@knauf.com',
    NULL,
    true,
    'Germany',
    'Iphofen, Germany',
    ARRAY['construction', 'renovation', 'manufacturers']::text[],
    ARRAY['Gypsum board', 'Plaster', 'Insulation']::text[],
    ARRAY['Germany', 'Ukraine', 'Poland', 'Spain', 'France', 'Italy']::text[],
    ARRAY['Germany', 'Ukraine', 'Poland', 'Spain', 'France', 'Italy']::text[],
    ARRAY['DE', 'EN', 'UA', 'PL']::text[],
    true,
    true,
    false,
    'verified',
    true,
    ARRAY['https://dimarket.app/ads/brands/knauf.png']::text[]
  )
  ON CONFLICT (profile_id) DO UPDATE SET
    slug = EXCLUDED.slug,
    company_name = EXCLUDED.company_name,
    description = EXCLUDED.description,
    website = EXCLUDED.website,
    logo_url = EXCLUDED.logo_url,
    public_email = EXCLUDED.public_email,
    public_phone = EXCLUDED.public_phone,
    show_public_contacts = true,
    country = EXCLUDED.country,
    headquarters = EXCLUDED.headquarters,
    categories = EXCLUDED.categories,
    products = EXCLUDED.products,
    countries_available = EXCLUDED.countries_available,
    languages = EXCLUDED.languages,
    verification_status = 'verified',
    is_published = true,
    images = EXCLUDED.images,
    updated_at = now();

  -- Hilti
  v_user := '4d79dfe7-9cbb-4928-a6bc-58391a5fa1f3'::uuid;
  v_email := 'directory+mfr-hilti@users.dimarket.app';

  IF NOT EXISTS (SELECT 1 FROM auth.users WHERE id = v_user) THEN
    INSERT INTO auth.users (
      instance_id, id, aud, role, email, encrypted_password, email_confirmed_at,
      raw_app_meta_data, raw_user_meta_data, created_at, updated_at,
      confirmation_token, recovery_token, email_change_token_new, email_change
    ) VALUES (
      '00000000-0000-0000-0000-000000000000',
      v_user,
      'authenticated',
      'authenticated',
      v_email,
      crypt(encode(gen_random_bytes(16), 'hex'), gen_salt('bf')),
      now(),
      '{"provider":"email","providers":["email"]}'::jsonb,
      jsonb_build_object('full_name', 'Hilti', 'commercial_manufacturer', true),
      now(), now(),
      '', '', '', ''
    );
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM auth.identities WHERE user_id = v_user AND provider = 'email'
  ) THEN
    INSERT INTO auth.identities (
      id, user_id, identity_data, provider, provider_id, last_sign_in_at, created_at, updated_at
    ) VALUES (
      v_user,
      v_user,
      jsonb_build_object('sub', v_user::text, 'email', v_email),
      'email',
      v_user::text,
      now(), now(), now()
    );
  END IF;

  INSERT INTO public.profiles AS p (
    id, full_name, bio, website, phone, location, user_role, is_professional,
    service_latitude, service_longitude, avatar_url, profile_photo, languages,
    availability_status, is_verified, verification_level
  ) VALUES (
    v_user,
    'Hilti',
    'Professional fastening, demolition, diamond and measuring tools for construction sites.',
    'https://www.hilti.com',
    NULL,
    'Schaan, Liechtenstein',
    'company',
    true,
    47.1667,
    9.5167,
    'https://dimarket.app/ads/brands/hilti.png',
    'https://dimarket.app/ads/brands/hilti.png',
    ARRAY['DE', 'EN', 'FR', 'IT']::text[],
    'available',
    true,
    'gold'
  )
  ON CONFLICT (id) DO UPDATE SET
    full_name = EXCLUDED.full_name,
    bio = EXCLUDED.bio,
    website = EXCLUDED.website,
    phone = COALESCE(EXCLUDED.phone, p.phone),
    location = EXCLUDED.location,
    user_role = 'company',
    is_professional = true,
    service_latitude = EXCLUDED.service_latitude,
    service_longitude = EXCLUDED.service_longitude,
    avatar_url = EXCLUDED.avatar_url,
    profile_photo = EXCLUDED.profile_photo,
    languages = EXCLUDED.languages,
    is_verified = true,
    verification_level = 'gold';

  INSERT INTO public.manufacturer_profiles AS mfr (
    profile_id, slug, company_name, description, website, logo_url,
    public_email, public_phone, show_public_contacts,
    country, headquarters, categories, products,
    target_markets, countries_available, languages,
    agent_required, non_exclusive_representation, exclusive_representation,
    verification_status, is_published, images
  ) VALUES (
    v_user,
    'hilti',
    'Hilti',
    'Professional fastening, demolition, diamond and measuring tools for construction sites.',
    'https://www.hilti.com',
    'https://dimarket.app/ads/brands/hilti.png',
    NULL,
    NULL,
    true,
    'Liechtenstein',
    'Schaan, Liechtenstein',
    ARRAY['construction', 'manufacturers', 'tools']::text[],
    ARRAY['Fasteners', 'Power tools', 'Measuring systems']::text[],
    ARRAY['Germany', 'Ukraine', 'Poland', 'Spain', 'France', 'Italy', 'Romania']::text[],
    ARRAY['Germany', 'Ukraine', 'Poland', 'Spain', 'France', 'Italy', 'Romania']::text[],
    ARRAY['DE', 'EN', 'FR', 'IT']::text[],
    true,
    true,
    false,
    'verified',
    true,
    ARRAY['https://dimarket.app/ads/brands/hilti.png']::text[]
  )
  ON CONFLICT (profile_id) DO UPDATE SET
    slug = EXCLUDED.slug,
    company_name = EXCLUDED.company_name,
    description = EXCLUDED.description,
    website = EXCLUDED.website,
    logo_url = EXCLUDED.logo_url,
    public_email = EXCLUDED.public_email,
    public_phone = EXCLUDED.public_phone,
    show_public_contacts = true,
    country = EXCLUDED.country,
    headquarters = EXCLUDED.headquarters,
    categories = EXCLUDED.categories,
    products = EXCLUDED.products,
    countries_available = EXCLUDED.countries_available,
    languages = EXCLUDED.languages,
    verification_status = 'verified',
    is_published = true,
    images = EXCLUDED.images,
    updated_at = now();

  -- Geberit
  v_user := 'dfc55592-ef99-4c9c-ae9a-c068f8b72303'::uuid;
  v_email := 'directory+mfr-geberit@users.dimarket.app';

  IF NOT EXISTS (SELECT 1 FROM auth.users WHERE id = v_user) THEN
    INSERT INTO auth.users (
      instance_id, id, aud, role, email, encrypted_password, email_confirmed_at,
      raw_app_meta_data, raw_user_meta_data, created_at, updated_at,
      confirmation_token, recovery_token, email_change_token_new, email_change
    ) VALUES (
      '00000000-0000-0000-0000-000000000000',
      v_user,
      'authenticated',
      'authenticated',
      v_email,
      crypt(encode(gen_random_bytes(16), 'hex'), gen_salt('bf')),
      now(),
      '{"provider":"email","providers":["email"]}'::jsonb,
      jsonb_build_object('full_name', 'Geberit', 'commercial_manufacturer', true),
      now(), now(),
      '', '', '', ''
    );
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM auth.identities WHERE user_id = v_user AND provider = 'email'
  ) THEN
    INSERT INTO auth.identities (
      id, user_id, identity_data, provider, provider_id, last_sign_in_at, created_at, updated_at
    ) VALUES (
      v_user,
      v_user,
      jsonb_build_object('sub', v_user::text, 'email', v_email),
      'email',
      v_user::text,
      now(), now(), now()
    );
  END IF;

  INSERT INTO public.profiles AS p (
    id, full_name, bio, website, phone, location, user_role, is_professional,
    service_latitude, service_longitude, avatar_url, profile_photo, languages,
    availability_status, is_verified, verification_level
  ) VALUES (
    v_user,
    'Geberit',
    'Sanitary products, installation systems and bathroom ceramics for residential and commercial buildings.',
    'https://www.geberit.com',
    NULL,
    'Rapperswil-Jona, Switzerland',
    'company',
    true,
    47.226,
    8.818,
    'https://dimarket.app/ads/brands/geberit.png',
    'https://dimarket.app/ads/brands/geberit.png',
    ARRAY['DE', 'EN', 'FR', 'IT']::text[],
    'available',
    true,
    'gold'
  )
  ON CONFLICT (id) DO UPDATE SET
    full_name = EXCLUDED.full_name,
    bio = EXCLUDED.bio,
    website = EXCLUDED.website,
    phone = COALESCE(EXCLUDED.phone, p.phone),
    location = EXCLUDED.location,
    user_role = 'company',
    is_professional = true,
    service_latitude = EXCLUDED.service_latitude,
    service_longitude = EXCLUDED.service_longitude,
    avatar_url = EXCLUDED.avatar_url,
    profile_photo = EXCLUDED.profile_photo,
    languages = EXCLUDED.languages,
    is_verified = true,
    verification_level = 'gold';

  INSERT INTO public.manufacturer_profiles AS mfr (
    profile_id, slug, company_name, description, website, logo_url,
    public_email, public_phone, show_public_contacts,
    country, headquarters, categories, products,
    target_markets, countries_available, languages,
    agent_required, non_exclusive_representation, exclusive_representation,
    verification_status, is_published, images
  ) VALUES (
    v_user,
    'geberit',
    'Geberit',
    'Sanitary products, installation systems and bathroom ceramics for residential and commercial buildings.',
    'https://www.geberit.com',
    'https://dimarket.app/ads/brands/geberit.png',
    NULL,
    NULL,
    true,
    'Switzerland',
    'Rapperswil-Jona, Switzerland',
    ARRAY['hvac', 'renovation', 'manufacturers']::text[],
    ARRAY['Installation systems', 'Flushing systems', 'Bathroom ceramics']::text[],
    ARRAY['Switzerland', 'Germany', 'Poland', 'Ukraine', 'Spain', 'Italy']::text[],
    ARRAY['Switzerland', 'Germany', 'Poland', 'Ukraine', 'Spain', 'Italy']::text[],
    ARRAY['DE', 'EN', 'FR', 'IT']::text[],
    true,
    true,
    false,
    'verified',
    true,
    ARRAY['https://dimarket.app/ads/brands/geberit.png']::text[]
  )
  ON CONFLICT (profile_id) DO UPDATE SET
    slug = EXCLUDED.slug,
    company_name = EXCLUDED.company_name,
    description = EXCLUDED.description,
    website = EXCLUDED.website,
    logo_url = EXCLUDED.logo_url,
    public_email = EXCLUDED.public_email,
    public_phone = EXCLUDED.public_phone,
    show_public_contacts = true,
    country = EXCLUDED.country,
    headquarters = EXCLUDED.headquarters,
    categories = EXCLUDED.categories,
    products = EXCLUDED.products,
    countries_available = EXCLUDED.countries_available,
    languages = EXCLUDED.languages,
    verification_status = 'verified',
    is_published = true,
    images = EXCLUDED.images,
    updated_at = now();

  -- VELUX
  v_user := '84a6a8b6-2ba3-4bfd-a983-d32ea0674215'::uuid;
  v_email := 'directory+mfr-velux@users.dimarket.app';

  IF NOT EXISTS (SELECT 1 FROM auth.users WHERE id = v_user) THEN
    INSERT INTO auth.users (
      instance_id, id, aud, role, email, encrypted_password, email_confirmed_at,
      raw_app_meta_data, raw_user_meta_data, created_at, updated_at,
      confirmation_token, recovery_token, email_change_token_new, email_change
    ) VALUES (
      '00000000-0000-0000-0000-000000000000',
      v_user,
      'authenticated',
      'authenticated',
      v_email,
      crypt(encode(gen_random_bytes(16), 'hex'), gen_salt('bf')),
      now(),
      '{"provider":"email","providers":["email"]}'::jsonb,
      jsonb_build_object('full_name', 'VELUX', 'commercial_manufacturer', true),
      now(), now(),
      '', '', '', ''
    );
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM auth.identities WHERE user_id = v_user AND provider = 'email'
  ) THEN
    INSERT INTO auth.identities (
      id, user_id, identity_data, provider, provider_id, last_sign_in_at, created_at, updated_at
    ) VALUES (
      v_user,
      v_user,
      jsonb_build_object('sub', v_user::text, 'email', v_email),
      'email',
      v_user::text,
      now(), now(), now()
    );
  END IF;

  INSERT INTO public.profiles AS p (
    id, full_name, bio, website, phone, location, user_role, is_professional,
    service_latitude, service_longitude, avatar_url, profile_photo, languages,
    availability_status, is_verified, verification_level
  ) VALUES (
    v_user,
    'VELUX',
    'Roof windows, skylights and daylight solutions for residential and commercial buildings.',
    'https://www.velux.com',
    NULL,
    'Hørsholm, Denmark',
    'company',
    true,
    55.871,
    12.501,
    'https://dimarket.app/ads/brands/velux.png',
    'https://dimarket.app/ads/brands/velux.png',
    ARRAY['EN', 'DE', 'PL', 'UA', 'ES', 'FR']::text[],
    'available',
    true,
    'gold'
  )
  ON CONFLICT (id) DO UPDATE SET
    full_name = EXCLUDED.full_name,
    bio = EXCLUDED.bio,
    website = EXCLUDED.website,
    phone = COALESCE(EXCLUDED.phone, p.phone),
    location = EXCLUDED.location,
    user_role = 'company',
    is_professional = true,
    service_latitude = EXCLUDED.service_latitude,
    service_longitude = EXCLUDED.service_longitude,
    avatar_url = EXCLUDED.avatar_url,
    profile_photo = EXCLUDED.profile_photo,
    languages = EXCLUDED.languages,
    is_verified = true,
    verification_level = 'gold';

  INSERT INTO public.manufacturer_profiles AS mfr (
    profile_id, slug, company_name, description, website, logo_url,
    public_email, public_phone, show_public_contacts,
    country, headquarters, categories, products,
    target_markets, countries_available, languages,
    agent_required, non_exclusive_representation, exclusive_representation,
    verification_status, is_published, images
  ) VALUES (
    v_user,
    'velux',
    'VELUX',
    'Roof windows, skylights and daylight solutions for residential and commercial buildings.',
    'https://www.velux.com',
    'https://dimarket.app/ads/brands/velux.png',
    NULL,
    NULL,
    true,
    'Denmark',
    'Hørsholm, Denmark',
    ARRAY['construction', 'renovation', 'manufacturers']::text[],
    ARRAY['Roof windows', 'Skylights', 'Blinds']::text[],
    ARRAY['Denmark', 'Germany', 'Poland', 'Ukraine', 'Spain', 'France', 'UK']::text[],
    ARRAY['Denmark', 'Germany', 'Poland', 'Ukraine', 'Spain', 'France', 'UK']::text[],
    ARRAY['EN', 'DE', 'PL', 'UA', 'ES', 'FR']::text[],
    true,
    true,
    false,
    'verified',
    true,
    ARRAY['https://dimarket.app/ads/brands/velux.png']::text[]
  )
  ON CONFLICT (profile_id) DO UPDATE SET
    slug = EXCLUDED.slug,
    company_name = EXCLUDED.company_name,
    description = EXCLUDED.description,
    website = EXCLUDED.website,
    logo_url = EXCLUDED.logo_url,
    public_email = EXCLUDED.public_email,
    public_phone = EXCLUDED.public_phone,
    show_public_contacts = true,
    country = EXCLUDED.country,
    headquarters = EXCLUDED.headquarters,
    categories = EXCLUDED.categories,
    products = EXCLUDED.products,
    countries_available = EXCLUDED.countries_available,
    languages = EXCLUDED.languages,
    verification_status = 'verified',
    is_published = true,
    images = EXCLUDED.images,
    updated_at = now();

  -- Uponor
  v_user := '3312daa0-614e-42d2-a169-af8fd61958c8'::uuid;
  v_email := 'directory+mfr-uponor@users.dimarket.app';

  IF NOT EXISTS (SELECT 1 FROM auth.users WHERE id = v_user) THEN
    INSERT INTO auth.users (
      instance_id, id, aud, role, email, encrypted_password, email_confirmed_at,
      raw_app_meta_data, raw_user_meta_data, created_at, updated_at,
      confirmation_token, recovery_token, email_change_token_new, email_change
    ) VALUES (
      '00000000-0000-0000-0000-000000000000',
      v_user,
      'authenticated',
      'authenticated',
      v_email,
      crypt(encode(gen_random_bytes(16), 'hex'), gen_salt('bf')),
      now(),
      '{"provider":"email","providers":["email"]}'::jsonb,
      jsonb_build_object('full_name', 'Uponor', 'commercial_manufacturer', true),
      now(), now(),
      '', '', '', ''
    );
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM auth.identities WHERE user_id = v_user AND provider = 'email'
  ) THEN
    INSERT INTO auth.identities (
      id, user_id, identity_data, provider, provider_id, last_sign_in_at, created_at, updated_at
    ) VALUES (
      v_user,
      v_user,
      jsonb_build_object('sub', v_user::text, 'email', v_email),
      'email',
      v_user::text,
      now(), now(), now()
    );
  END IF;

  INSERT INTO public.profiles AS p (
    id, full_name, bio, website, phone, location, user_role, is_professional,
    service_latitude, service_longitude, avatar_url, profile_photo, languages,
    availability_status, is_verified, verification_level
  ) VALUES (
    v_user,
    'Uponor',
    'Plumbing, radiant heating and cooling systems for buildings (Georg Fischer Uponor).',
    'https://www.uponor.com',
    NULL,
    'Helsinki, Finland',
    'company',
    true,
    60.1699,
    24.9384,
    'https://dimarket.app/ads/brands/uponor.png',
    'https://dimarket.app/ads/brands/uponor.png',
    ARRAY['EN', 'FI', 'DE', 'PL']::text[],
    'available',
    true,
    'gold'
  )
  ON CONFLICT (id) DO UPDATE SET
    full_name = EXCLUDED.full_name,
    bio = EXCLUDED.bio,
    website = EXCLUDED.website,
    phone = COALESCE(EXCLUDED.phone, p.phone),
    location = EXCLUDED.location,
    user_role = 'company',
    is_professional = true,
    service_latitude = EXCLUDED.service_latitude,
    service_longitude = EXCLUDED.service_longitude,
    avatar_url = EXCLUDED.avatar_url,
    profile_photo = EXCLUDED.profile_photo,
    languages = EXCLUDED.languages,
    is_verified = true,
    verification_level = 'gold';

  INSERT INTO public.manufacturer_profiles AS mfr (
    profile_id, slug, company_name, description, website, logo_url,
    public_email, public_phone, show_public_contacts,
    country, headquarters, categories, products,
    target_markets, countries_available, languages,
    agent_required, non_exclusive_representation, exclusive_representation,
    verification_status, is_published, images
  ) VALUES (
    v_user,
    'uponor',
    'Uponor',
    'Plumbing, radiant heating and cooling systems for buildings (Georg Fischer Uponor).',
    'https://www.uponor.com',
    'https://dimarket.app/ads/brands/uponor.png',
    NULL,
    NULL,
    true,
    'Finland',
    'Helsinki, Finland',
    ARRAY['hvac', 'construction', 'manufacturers']::text[],
    ARRAY['Pipes', 'Radiant heating', 'Cooling systems']::text[],
    ARRAY['Finland', 'Germany', 'Poland', 'Spain', 'Sweden', 'Ukraine']::text[],
    ARRAY['Finland', 'Germany', 'Poland', 'Spain', 'Sweden', 'Ukraine']::text[],
    ARRAY['EN', 'FI', 'DE', 'PL']::text[],
    true,
    true,
    false,
    'verified',
    true,
    ARRAY['https://dimarket.app/ads/brands/uponor.png']::text[]
  )
  ON CONFLICT (profile_id) DO UPDATE SET
    slug = EXCLUDED.slug,
    company_name = EXCLUDED.company_name,
    description = EXCLUDED.description,
    website = EXCLUDED.website,
    logo_url = EXCLUDED.logo_url,
    public_email = EXCLUDED.public_email,
    public_phone = EXCLUDED.public_phone,
    show_public_contacts = true,
    country = EXCLUDED.country,
    headquarters = EXCLUDED.headquarters,
    categories = EXCLUDED.categories,
    products = EXCLUDED.products,
    countries_available = EXCLUDED.countries_available,
    languages = EXCLUDED.languages,
    verification_status = 'verified',
    is_published = true,
    images = EXCLUDED.images,
    updated_at = now();

  -- GREE Electric
  v_user := 'e45d3114-a47f-46e5-a83c-b7f9a45a4c03'::uuid;
  v_email := 'directory+mfr-gree@users.dimarket.app';

  IF NOT EXISTS (SELECT 1 FROM auth.users WHERE id = v_user) THEN
    INSERT INTO auth.users (
      instance_id, id, aud, role, email, encrypted_password, email_confirmed_at,
      raw_app_meta_data, raw_user_meta_data, created_at, updated_at,
      confirmation_token, recovery_token, email_change_token_new, email_change
    ) VALUES (
      '00000000-0000-0000-0000-000000000000',
      v_user,
      'authenticated',
      'authenticated',
      v_email,
      crypt(encode(gen_random_bytes(16), 'hex'), gen_salt('bf')),
      now(),
      '{"provider":"email","providers":["email"]}'::jsonb,
      jsonb_build_object('full_name', 'GREE Electric', 'commercial_manufacturer', true),
      now(), now(),
      '', '', '', ''
    );
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM auth.identities WHERE user_id = v_user AND provider = 'email'
  ) THEN
    INSERT INTO auth.identities (
      id, user_id, identity_data, provider, provider_id, last_sign_in_at, created_at, updated_at
    ) VALUES (
      v_user,
      v_user,
      jsonb_build_object('sub', v_user::text, 'email', v_email),
      'email',
      v_user::text,
      now(), now(), now()
    );
  END IF;

  INSERT INTO public.profiles AS p (
    id, full_name, bio, website, phone, location, user_role, is_professional,
    service_latitude, service_longitude, avatar_url, profile_photo, languages,
    availability_status, is_verified, verification_level
  ) VALUES (
    v_user,
    'GREE Electric',
    'HVAC and climate systems — residential and commercial air conditioning.',
    'https://www.gree.com',
    NULL,
    'Zhuhai, China (EU distribution)',
    'company',
    true,
    52.2297,
    21.0122,
    'https://dimarket.app/ads/brands/gree.png',
    'https://dimarket.app/ads/brands/gree.png',
    ARRAY['EN', 'ES', 'PL', 'DE']::text[],
    'available',
    true,
    'gold'
  )
  ON CONFLICT (id) DO UPDATE SET
    full_name = EXCLUDED.full_name,
    bio = EXCLUDED.bio,
    website = EXCLUDED.website,
    phone = COALESCE(EXCLUDED.phone, p.phone),
    location = EXCLUDED.location,
    user_role = 'company',
    is_professional = true,
    service_latitude = EXCLUDED.service_latitude,
    service_longitude = EXCLUDED.service_longitude,
    avatar_url = EXCLUDED.avatar_url,
    profile_photo = EXCLUDED.profile_photo,
    languages = EXCLUDED.languages,
    is_verified = true,
    verification_level = 'gold';

  INSERT INTO public.manufacturer_profiles AS mfr (
    profile_id, slug, company_name, description, website, logo_url,
    public_email, public_phone, show_public_contacts,
    country, headquarters, categories, products,
    target_markets, countries_available, languages,
    agent_required, non_exclusive_representation, exclusive_representation,
    verification_status, is_published, images
  ) VALUES (
    v_user,
    'gree',
    'GREE Electric',
    'HVAC and climate systems — residential and commercial air conditioning.',
    'https://www.gree.com',
    'https://dimarket.app/ads/brands/gree.png',
    NULL,
    NULL,
    true,
    'China',
    'Zhuhai, China (EU distribution)',
    ARRAY['hvac', 'manufacturers']::text[],
    ARRAY['Air conditioners', 'Heat pumps', 'Multi-split systems']::text[],
    ARRAY['Poland', 'Spain', 'Germany', 'Ukraine', 'Italy', 'Romania']::text[],
    ARRAY['Poland', 'Spain', 'Germany', 'Ukraine', 'Italy', 'Romania']::text[],
    ARRAY['EN', 'ES', 'PL', 'DE']::text[],
    true,
    true,
    false,
    'verified',
    true,
    ARRAY['https://dimarket.app/ads/brands/gree.png']::text[]
  )
  ON CONFLICT (profile_id) DO UPDATE SET
    slug = EXCLUDED.slug,
    company_name = EXCLUDED.company_name,
    description = EXCLUDED.description,
    website = EXCLUDED.website,
    logo_url = EXCLUDED.logo_url,
    public_email = EXCLUDED.public_email,
    public_phone = EXCLUDED.public_phone,
    show_public_contacts = true,
    country = EXCLUDED.country,
    headquarters = EXCLUDED.headquarters,
    categories = EXCLUDED.categories,
    products = EXCLUDED.products,
    countries_available = EXCLUDED.countries_available,
    languages = EXCLUDED.languages,
    verification_status = 'verified',
    is_published = true,
    images = EXCLUDED.images,
    updated_at = now();

  -- DEWALT
  v_user := '5b3f89d7-6bb7-4da7-a7be-8ee323767804'::uuid;
  v_email := 'directory+mfr-dewalt@users.dimarket.app';

  IF NOT EXISTS (SELECT 1 FROM auth.users WHERE id = v_user) THEN
    INSERT INTO auth.users (
      instance_id, id, aud, role, email, encrypted_password, email_confirmed_at,
      raw_app_meta_data, raw_user_meta_data, created_at, updated_at,
      confirmation_token, recovery_token, email_change_token_new, email_change
    ) VALUES (
      '00000000-0000-0000-0000-000000000000',
      v_user,
      'authenticated',
      'authenticated',
      v_email,
      crypt(encode(gen_random_bytes(16), 'hex'), gen_salt('bf')),
      now(),
      '{"provider":"email","providers":["email"]}'::jsonb,
      jsonb_build_object('full_name', 'DEWALT', 'commercial_manufacturer', true),
      now(), now(),
      '', '', '', ''
    );
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM auth.identities WHERE user_id = v_user AND provider = 'email'
  ) THEN
    INSERT INTO auth.identities (
      id, user_id, identity_data, provider, provider_id, last_sign_in_at, created_at, updated_at
    ) VALUES (
      v_user,
      v_user,
      jsonb_build_object('sub', v_user::text, 'email', v_email),
      'email',
      v_user::text,
      now(), now(), now()
    );
  END IF;

  INSERT INTO public.profiles AS p (
    id, full_name, bio, website, phone, location, user_role, is_professional,
    service_latitude, service_longitude, avatar_url, profile_photo, languages,
    availability_status, is_verified, verification_level
  ) VALUES (
    v_user,
    'DEWALT',
    'Professional power tools and accessories for construction and renovation.',
    'https://www.dewalt.com',
    NULL,
    'Towson, USA (EU ops)',
    'company',
    true,
    50.1109,
    8.6821,
    'https://dimarket.app/ads/brands/dewalt.png',
    'https://dimarket.app/ads/brands/dewalt.png',
    ARRAY['EN', 'DE', 'ES', 'FR', 'PL']::text[],
    'available',
    true,
    'gold'
  )
  ON CONFLICT (id) DO UPDATE SET
    full_name = EXCLUDED.full_name,
    bio = EXCLUDED.bio,
    website = EXCLUDED.website,
    phone = COALESCE(EXCLUDED.phone, p.phone),
    location = EXCLUDED.location,
    user_role = 'company',
    is_professional = true,
    service_latitude = EXCLUDED.service_latitude,
    service_longitude = EXCLUDED.service_longitude,
    avatar_url = EXCLUDED.avatar_url,
    profile_photo = EXCLUDED.profile_photo,
    languages = EXCLUDED.languages,
    is_verified = true,
    verification_level = 'gold';

  INSERT INTO public.manufacturer_profiles AS mfr (
    profile_id, slug, company_name, description, website, logo_url,
    public_email, public_phone, show_public_contacts,
    country, headquarters, categories, products,
    target_markets, countries_available, languages,
    agent_required, non_exclusive_representation, exclusive_representation,
    verification_status, is_published, images
  ) VALUES (
    v_user,
    'dewalt',
    'DEWALT',
    'Professional power tools and accessories for construction and renovation.',
    'https://www.dewalt.com',
    'https://dimarket.app/ads/brands/dewalt.png',
    NULL,
    NULL,
    true,
    'United States',
    'Towson, USA (EU ops)',
    ARRAY['construction', 'manufacturers', 'tools']::text[],
    ARRAY['Cordless tools', 'Drills', 'Saws']::text[],
    ARRAY['Germany', 'Poland', 'Spain', 'France', 'UK', 'Ukraine']::text[],
    ARRAY['Germany', 'Poland', 'Spain', 'France', 'UK', 'Ukraine']::text[],
    ARRAY['EN', 'DE', 'ES', 'FR', 'PL']::text[],
    true,
    true,
    false,
    'verified',
    true,
    ARRAY['https://dimarket.app/ads/brands/dewalt.png']::text[]
  )
  ON CONFLICT (profile_id) DO UPDATE SET
    slug = EXCLUDED.slug,
    company_name = EXCLUDED.company_name,
    description = EXCLUDED.description,
    website = EXCLUDED.website,
    logo_url = EXCLUDED.logo_url,
    public_email = EXCLUDED.public_email,
    public_phone = EXCLUDED.public_phone,
    show_public_contacts = true,
    country = EXCLUDED.country,
    headquarters = EXCLUDED.headquarters,
    categories = EXCLUDED.categories,
    products = EXCLUDED.products,
    countries_available = EXCLUDED.countries_available,
    languages = EXCLUDED.languages,
    verification_status = 'verified',
    is_published = true,
    images = EXCLUDED.images,
    updated_at = now();

  -- Festool
  v_user := 'b536b377-9a4b-467c-a938-6864c4a95ada'::uuid;
  v_email := 'directory+mfr-festool@users.dimarket.app';

  IF NOT EXISTS (SELECT 1 FROM auth.users WHERE id = v_user) THEN
    INSERT INTO auth.users (
      instance_id, id, aud, role, email, encrypted_password, email_confirmed_at,
      raw_app_meta_data, raw_user_meta_data, created_at, updated_at,
      confirmation_token, recovery_token, email_change_token_new, email_change
    ) VALUES (
      '00000000-0000-0000-0000-000000000000',
      v_user,
      'authenticated',
      'authenticated',
      v_email,
      crypt(encode(gen_random_bytes(16), 'hex'), gen_salt('bf')),
      now(),
      '{"provider":"email","providers":["email"]}'::jsonb,
      jsonb_build_object('full_name', 'Festool', 'commercial_manufacturer', true),
      now(), now(),
      '', '', '', ''
    );
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM auth.identities WHERE user_id = v_user AND provider = 'email'
  ) THEN
    INSERT INTO auth.identities (
      id, user_id, identity_data, provider, provider_id, last_sign_in_at, created_at, updated_at
    ) VALUES (
      v_user,
      v_user,
      jsonb_build_object('sub', v_user::text, 'email', v_email),
      'email',
      v_user::text,
      now(), now(), now()
    );
  END IF;

  INSERT INTO public.profiles AS p (
    id, full_name, bio, website, phone, location, user_role, is_professional,
    service_latitude, service_longitude, avatar_url, profile_photo, languages,
    availability_status, is_verified, verification_level
  ) VALUES (
    v_user,
    'Festool',
    'Premium power tools and Systainer systems for professional trades.',
    'https://www.festool.com',
    NULL,
    'Wendlingen, Germany',
    'company',
    true,
    48.6747,
    9.3772,
    'https://dimarket.app/ads/brands/festool.png',
    'https://dimarket.app/ads/brands/festool.png',
    ARRAY['DE', 'EN', 'FR', 'IT']::text[],
    'available',
    true,
    'gold'
  )
  ON CONFLICT (id) DO UPDATE SET
    full_name = EXCLUDED.full_name,
    bio = EXCLUDED.bio,
    website = EXCLUDED.website,
    phone = COALESCE(EXCLUDED.phone, p.phone),
    location = EXCLUDED.location,
    user_role = 'company',
    is_professional = true,
    service_latitude = EXCLUDED.service_latitude,
    service_longitude = EXCLUDED.service_longitude,
    avatar_url = EXCLUDED.avatar_url,
    profile_photo = EXCLUDED.profile_photo,
    languages = EXCLUDED.languages,
    is_verified = true,
    verification_level = 'gold';

  INSERT INTO public.manufacturer_profiles AS mfr (
    profile_id, slug, company_name, description, website, logo_url,
    public_email, public_phone, show_public_contacts,
    country, headquarters, categories, products,
    target_markets, countries_available, languages,
    agent_required, non_exclusive_representation, exclusive_representation,
    verification_status, is_published, images
  ) VALUES (
    v_user,
    'festool',
    'Festool',
    'Premium power tools and Systainer systems for professional trades.',
    'https://www.festool.com',
    'https://dimarket.app/ads/brands/festool.png',
    NULL,
    NULL,
    true,
    'Germany',
    'Wendlingen, Germany',
    ARRAY['construction', 'manufacturers', 'tools']::text[],
    ARRAY['Sanders', 'Saws', 'Dust extractors']::text[],
    ARRAY['Germany', 'Austria', 'Switzerland', 'Poland', 'Spain', 'France']::text[],
    ARRAY['Germany', 'Austria', 'Switzerland', 'Poland', 'Spain', 'France']::text[],
    ARRAY['DE', 'EN', 'FR', 'IT']::text[],
    true,
    true,
    false,
    'verified',
    true,
    ARRAY['https://dimarket.app/ads/brands/festool.png']::text[]
  )
  ON CONFLICT (profile_id) DO UPDATE SET
    slug = EXCLUDED.slug,
    company_name = EXCLUDED.company_name,
    description = EXCLUDED.description,
    website = EXCLUDED.website,
    logo_url = EXCLUDED.logo_url,
    public_email = EXCLUDED.public_email,
    public_phone = EXCLUDED.public_phone,
    show_public_contacts = true,
    country = EXCLUDED.country,
    headquarters = EXCLUDED.headquarters,
    categories = EXCLUDED.categories,
    products = EXCLUDED.products,
    countries_available = EXCLUDED.countries_available,
    languages = EXCLUDED.languages,
    verification_status = 'verified',
    is_published = true,
    images = EXCLUDED.images,
    updated_at = now();

  -- Signify (Philips Lighting)
  v_user := '4a575be7-9d0a-4b03-a6d4-262acec33fcd'::uuid;
  v_email := 'directory+mfr-philips-lighting@users.dimarket.app';

  IF NOT EXISTS (SELECT 1 FROM auth.users WHERE id = v_user) THEN
    INSERT INTO auth.users (
      instance_id, id, aud, role, email, encrypted_password, email_confirmed_at,
      raw_app_meta_data, raw_user_meta_data, created_at, updated_at,
      confirmation_token, recovery_token, email_change_token_new, email_change
    ) VALUES (
      '00000000-0000-0000-0000-000000000000',
      v_user,
      'authenticated',
      'authenticated',
      v_email,
      crypt(encode(gen_random_bytes(16), 'hex'), gen_salt('bf')),
      now(),
      '{"provider":"email","providers":["email"]}'::jsonb,
      jsonb_build_object('full_name', 'Signify (Philips Lighting)', 'commercial_manufacturer', true),
      now(), now(),
      '', '', '', ''
    );
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM auth.identities WHERE user_id = v_user AND provider = 'email'
  ) THEN
    INSERT INTO auth.identities (
      id, user_id, identity_data, provider, provider_id, last_sign_in_at, created_at, updated_at
    ) VALUES (
      v_user,
      v_user,
      jsonb_build_object('sub', v_user::text, 'email', v_email),
      'email',
      v_user::text,
      now(), now(), now()
    );
  END IF;

  INSERT INTO public.profiles AS p (
    id, full_name, bio, website, phone, location, user_role, is_professional,
    service_latitude, service_longitude, avatar_url, profile_photo, languages,
    availability_status, is_verified, verification_level
  ) VALUES (
    v_user,
    'Signify (Philips Lighting)',
    'Professional and residential lighting systems and connected lighting.',
    'https://www.signify.com',
    NULL,
    'Eindhoven, Netherlands',
    'company',
    true,
    51.4416,
    5.4697,
    'https://dimarket.app/ads/brands/philips.png',
    'https://dimarket.app/ads/brands/philips.png',
    ARRAY['EN', 'NL', 'DE', 'PL']::text[],
    'available',
    true,
    'gold'
  )
  ON CONFLICT (id) DO UPDATE SET
    full_name = EXCLUDED.full_name,
    bio = EXCLUDED.bio,
    website = EXCLUDED.website,
    phone = COALESCE(EXCLUDED.phone, p.phone),
    location = EXCLUDED.location,
    user_role = 'company',
    is_professional = true,
    service_latitude = EXCLUDED.service_latitude,
    service_longitude = EXCLUDED.service_longitude,
    avatar_url = EXCLUDED.avatar_url,
    profile_photo = EXCLUDED.profile_photo,
    languages = EXCLUDED.languages,
    is_verified = true,
    verification_level = 'gold';

  INSERT INTO public.manufacturer_profiles AS mfr (
    profile_id, slug, company_name, description, website, logo_url,
    public_email, public_phone, show_public_contacts,
    country, headquarters, categories, products,
    target_markets, countries_available, languages,
    agent_required, non_exclusive_representation, exclusive_representation,
    verification_status, is_published, images
  ) VALUES (
    v_user,
    'philips-lighting',
    'Signify (Philips Lighting)',
    'Professional and residential lighting systems and connected lighting.',
    'https://www.signify.com',
    'https://dimarket.app/ads/brands/philips.png',
    NULL,
    NULL,
    true,
    'Netherlands',
    'Eindhoven, Netherlands',
    ARRAY['manufacturers', 'home-services']::text[],
    ARRAY['LED lighting', 'Connected lighting']::text[],
    ARRAY['Netherlands', 'Germany', 'Poland', 'Spain', 'Ukraine', 'France']::text[],
    ARRAY['Netherlands', 'Germany', 'Poland', 'Spain', 'Ukraine', 'France']::text[],
    ARRAY['EN', 'NL', 'DE', 'PL']::text[],
    true,
    true,
    false,
    'verified',
    true,
    ARRAY['https://dimarket.app/ads/brands/philips.png']::text[]
  )
  ON CONFLICT (profile_id) DO UPDATE SET
    slug = EXCLUDED.slug,
    company_name = EXCLUDED.company_name,
    description = EXCLUDED.description,
    website = EXCLUDED.website,
    logo_url = EXCLUDED.logo_url,
    public_email = EXCLUDED.public_email,
    public_phone = EXCLUDED.public_phone,
    show_public_contacts = true,
    country = EXCLUDED.country,
    headquarters = EXCLUDED.headquarters,
    categories = EXCLUDED.categories,
    products = EXCLUDED.products,
    countries_available = EXCLUDED.countries_available,
    languages = EXCLUDED.languages,
    verification_status = 'verified',
    is_published = true,
    images = EXCLUDED.images,
    updated_at = now();

  -- ROCKWOOL
  v_user := '26808605-c04e-4f75-a683-e8187ba006be'::uuid;
  v_email := 'directory+mfr-rockwool@users.dimarket.app';

  IF NOT EXISTS (SELECT 1 FROM auth.users WHERE id = v_user) THEN
    INSERT INTO auth.users (
      instance_id, id, aud, role, email, encrypted_password, email_confirmed_at,
      raw_app_meta_data, raw_user_meta_data, created_at, updated_at,
      confirmation_token, recovery_token, email_change_token_new, email_change
    ) VALUES (
      '00000000-0000-0000-0000-000000000000',
      v_user,
      'authenticated',
      'authenticated',
      v_email,
      crypt(encode(gen_random_bytes(16), 'hex'), gen_salt('bf')),
      now(),
      '{"provider":"email","providers":["email"]}'::jsonb,
      jsonb_build_object('full_name', 'ROCKWOOL', 'commercial_manufacturer', true),
      now(), now(),
      '', '', '', ''
    );
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM auth.identities WHERE user_id = v_user AND provider = 'email'
  ) THEN
    INSERT INTO auth.identities (
      id, user_id, identity_data, provider, provider_id, last_sign_in_at, created_at, updated_at
    ) VALUES (
      v_user,
      v_user,
      jsonb_build_object('sub', v_user::text, 'email', v_email),
      'email',
      v_user::text,
      now(), now(), now()
    );
  END IF;

  INSERT INTO public.profiles AS p (
    id, full_name, bio, website, phone, location, user_role, is_professional,
    service_latitude, service_longitude, avatar_url, profile_photo, languages,
    availability_status, is_verified, verification_level
  ) VALUES (
    v_user,
    'ROCKWOOL',
    'Stone wool insulation for energy efficiency, fire safety and acoustics.',
    'https://www.rockwool.com',
    NULL,
    'Hedehusene, Denmark',
    'company',
    true,
    55.648,
    12.211,
    'https://logo.clearbit.com/rockwool.com',
    'https://logo.clearbit.com/rockwool.com',
    ARRAY['EN', 'DE', 'PL', 'UA', 'ES']::text[],
    'available',
    true,
    'gold'
  )
  ON CONFLICT (id) DO UPDATE SET
    full_name = EXCLUDED.full_name,
    bio = EXCLUDED.bio,
    website = EXCLUDED.website,
    phone = COALESCE(EXCLUDED.phone, p.phone),
    location = EXCLUDED.location,
    user_role = 'company',
    is_professional = true,
    service_latitude = EXCLUDED.service_latitude,
    service_longitude = EXCLUDED.service_longitude,
    avatar_url = EXCLUDED.avatar_url,
    profile_photo = EXCLUDED.profile_photo,
    languages = EXCLUDED.languages,
    is_verified = true,
    verification_level = 'gold';

  INSERT INTO public.manufacturer_profiles AS mfr (
    profile_id, slug, company_name, description, website, logo_url,
    public_email, public_phone, show_public_contacts,
    country, headquarters, categories, products,
    target_markets, countries_available, languages,
    agent_required, non_exclusive_representation, exclusive_representation,
    verification_status, is_published, images
  ) VALUES (
    v_user,
    'rockwool',
    'ROCKWOOL',
    'Stone wool insulation for energy efficiency, fire safety and acoustics.',
    'https://www.rockwool.com',
    'https://logo.clearbit.com/rockwool.com',
    NULL,
    NULL,
    true,
    'Denmark',
    'Hedehusene, Denmark',
    ARRAY['construction', 'manufacturers']::text[],
    ARRAY['Stone wool insulation', 'Fire protection']::text[],
    ARRAY['Denmark', 'Germany', 'Poland', 'Ukraine', 'Spain', 'UK']::text[],
    ARRAY['Denmark', 'Germany', 'Poland', 'Ukraine', 'Spain', 'UK']::text[],
    ARRAY['EN', 'DE', 'PL', 'UA', 'ES']::text[],
    true,
    true,
    false,
    'verified',
    true,
    ARRAY['https://logo.clearbit.com/rockwool.com']::text[]
  )
  ON CONFLICT (profile_id) DO UPDATE SET
    slug = EXCLUDED.slug,
    company_name = EXCLUDED.company_name,
    description = EXCLUDED.description,
    website = EXCLUDED.website,
    logo_url = EXCLUDED.logo_url,
    public_email = EXCLUDED.public_email,
    public_phone = EXCLUDED.public_phone,
    show_public_contacts = true,
    country = EXCLUDED.country,
    headquarters = EXCLUDED.headquarters,
    categories = EXCLUDED.categories,
    products = EXCLUDED.products,
    countries_available = EXCLUDED.countries_available,
    languages = EXCLUDED.languages,
    verification_status = 'verified',
    is_published = true,
    images = EXCLUDED.images,
    updated_at = now();

  -- Sika
  v_user := '6da5d5cf-2ec1-4fea-a662-44d392f6b376'::uuid;
  v_email := 'directory+mfr-sika@users.dimarket.app';

  IF NOT EXISTS (SELECT 1 FROM auth.users WHERE id = v_user) THEN
    INSERT INTO auth.users (
      instance_id, id, aud, role, email, encrypted_password, email_confirmed_at,
      raw_app_meta_data, raw_user_meta_data, created_at, updated_at,
      confirmation_token, recovery_token, email_change_token_new, email_change
    ) VALUES (
      '00000000-0000-0000-0000-000000000000',
      v_user,
      'authenticated',
      'authenticated',
      v_email,
      crypt(encode(gen_random_bytes(16), 'hex'), gen_salt('bf')),
      now(),
      '{"provider":"email","providers":["email"]}'::jsonb,
      jsonb_build_object('full_name', 'Sika', 'commercial_manufacturer', true),
      now(), now(),
      '', '', '', ''
    );
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM auth.identities WHERE user_id = v_user AND provider = 'email'
  ) THEN
    INSERT INTO auth.identities (
      id, user_id, identity_data, provider, provider_id, last_sign_in_at, created_at, updated_at
    ) VALUES (
      v_user,
      v_user,
      jsonb_build_object('sub', v_user::text, 'email', v_email),
      'email',
      v_user::text,
      now(), now(), now()
    );
  END IF;

  INSERT INTO public.profiles AS p (
    id, full_name, bio, website, phone, location, user_role, is_professional,
    service_latitude, service_longitude, avatar_url, profile_photo, languages,
    availability_status, is_verified, verification_level
  ) VALUES (
    v_user,
    'Sika',
    'Specialty chemicals for construction — sealing, bonding, waterproofing and concrete.',
    'https://www.sika.com',
    NULL,
    'Baar, Switzerland',
    'company',
    true,
    47.1954,
    8.5294,
    'https://logo.clearbit.com/sika.com',
    'https://logo.clearbit.com/sika.com',
    ARRAY['DE', 'EN', 'FR', 'IT', 'ES']::text[],
    'available',
    true,
    'gold'
  )
  ON CONFLICT (id) DO UPDATE SET
    full_name = EXCLUDED.full_name,
    bio = EXCLUDED.bio,
    website = EXCLUDED.website,
    phone = COALESCE(EXCLUDED.phone, p.phone),
    location = EXCLUDED.location,
    user_role = 'company',
    is_professional = true,
    service_latitude = EXCLUDED.service_latitude,
    service_longitude = EXCLUDED.service_longitude,
    avatar_url = EXCLUDED.avatar_url,
    profile_photo = EXCLUDED.profile_photo,
    languages = EXCLUDED.languages,
    is_verified = true,
    verification_level = 'gold';

  INSERT INTO public.manufacturer_profiles AS mfr (
    profile_id, slug, company_name, description, website, logo_url,
    public_email, public_phone, show_public_contacts,
    country, headquarters, categories, products,
    target_markets, countries_available, languages,
    agent_required, non_exclusive_representation, exclusive_representation,
    verification_status, is_published, images
  ) VALUES (
    v_user,
    'sika',
    'Sika',
    'Specialty chemicals for construction — sealing, bonding, waterproofing and concrete.',
    'https://www.sika.com',
    'https://logo.clearbit.com/sika.com',
    NULL,
    NULL,
    true,
    'Switzerland',
    'Baar, Switzerland',
    ARRAY['construction', 'renovation', 'manufacturers']::text[],
    ARRAY['Sealants', 'Adhesives', 'Waterproofing']::text[],
    ARRAY['Switzerland', 'Germany', 'Poland', 'Spain', 'Ukraine', 'France', 'Italy']::text[],
    ARRAY['Switzerland', 'Germany', 'Poland', 'Spain', 'Ukraine', 'France', 'Italy']::text[],
    ARRAY['DE', 'EN', 'FR', 'IT', 'ES']::text[],
    true,
    true,
    false,
    'verified',
    true,
    ARRAY['https://logo.clearbit.com/sika.com']::text[]
  )
  ON CONFLICT (profile_id) DO UPDATE SET
    slug = EXCLUDED.slug,
    company_name = EXCLUDED.company_name,
    description = EXCLUDED.description,
    website = EXCLUDED.website,
    logo_url = EXCLUDED.logo_url,
    public_email = EXCLUDED.public_email,
    public_phone = EXCLUDED.public_phone,
    show_public_contacts = true,
    country = EXCLUDED.country,
    headquarters = EXCLUDED.headquarters,
    categories = EXCLUDED.categories,
    products = EXCLUDED.products,
    countries_available = EXCLUDED.countries_available,
    languages = EXCLUDED.languages,
    verification_status = 'verified',
    is_published = true,
    images = EXCLUDED.images,
    updated_at = now();

  -- Wienerberger
  v_user := 'aaef99a3-bf69-4b7f-a2f2-4071fb32de35'::uuid;
  v_email := 'directory+mfr-wienerberger@users.dimarket.app';

  IF NOT EXISTS (SELECT 1 FROM auth.users WHERE id = v_user) THEN
    INSERT INTO auth.users (
      instance_id, id, aud, role, email, encrypted_password, email_confirmed_at,
      raw_app_meta_data, raw_user_meta_data, created_at, updated_at,
      confirmation_token, recovery_token, email_change_token_new, email_change
    ) VALUES (
      '00000000-0000-0000-0000-000000000000',
      v_user,
      'authenticated',
      'authenticated',
      v_email,
      crypt(encode(gen_random_bytes(16), 'hex'), gen_salt('bf')),
      now(),
      '{"provider":"email","providers":["email"]}'::jsonb,
      jsonb_build_object('full_name', 'Wienerberger', 'commercial_manufacturer', true),
      now(), now(),
      '', '', '', ''
    );
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM auth.identities WHERE user_id = v_user AND provider = 'email'
  ) THEN
    INSERT INTO auth.identities (
      id, user_id, identity_data, provider, provider_id, last_sign_in_at, created_at, updated_at
    ) VALUES (
      v_user,
      v_user,
      jsonb_build_object('sub', v_user::text, 'email', v_email),
      'email',
      v_user::text,
      now(), now(), now()
    );
  END IF;

  INSERT INTO public.profiles AS p (
    id, full_name, bio, website, phone, location, user_role, is_professional,
    service_latitude, service_longitude, avatar_url, profile_photo, languages,
    availability_status, is_verified, verification_level
  ) VALUES (
    v_user,
    'Wienerberger',
    'Clay building materials — bricks, roof tiles and pavers across Europe.',
    'https://www.wienerberger.com',
    NULL,
    'Vienna, Austria',
    'company',
    true,
    48.2082,
    16.3738,
    'https://logo.clearbit.com/wienerberger.com',
    'https://logo.clearbit.com/wienerberger.com',
    ARRAY['DE', 'EN', 'PL', 'CS', 'RO']::text[],
    'available',
    true,
    'gold'
  )
  ON CONFLICT (id) DO UPDATE SET
    full_name = EXCLUDED.full_name,
    bio = EXCLUDED.bio,
    website = EXCLUDED.website,
    phone = COALESCE(EXCLUDED.phone, p.phone),
    location = EXCLUDED.location,
    user_role = 'company',
    is_professional = true,
    service_latitude = EXCLUDED.service_latitude,
    service_longitude = EXCLUDED.service_longitude,
    avatar_url = EXCLUDED.avatar_url,
    profile_photo = EXCLUDED.profile_photo,
    languages = EXCLUDED.languages,
    is_verified = true,
    verification_level = 'gold';

  INSERT INTO public.manufacturer_profiles AS mfr (
    profile_id, slug, company_name, description, website, logo_url,
    public_email, public_phone, show_public_contacts,
    country, headquarters, categories, products,
    target_markets, countries_available, languages,
    agent_required, non_exclusive_representation, exclusive_representation,
    verification_status, is_published, images
  ) VALUES (
    v_user,
    'wienerberger',
    'Wienerberger',
    'Clay building materials — bricks, roof tiles and pavers across Europe.',
    'https://www.wienerberger.com',
    'https://logo.clearbit.com/wienerberger.com',
    NULL,
    NULL,
    true,
    'Austria',
    'Vienna, Austria',
    ARRAY['construction', 'manufacturers']::text[],
    ARRAY['Bricks', 'Roof tiles', 'Pavers']::text[],
    ARRAY['Austria', 'Germany', 'Poland', 'Czechia', 'Romania', 'Hungary', 'Ukraine']::text[],
    ARRAY['Austria', 'Germany', 'Poland', 'Czechia', 'Romania', 'Hungary', 'Ukraine']::text[],
    ARRAY['DE', 'EN', 'PL', 'CS', 'RO']::text[],
    true,
    true,
    false,
    'verified',
    true,
    ARRAY['https://logo.clearbit.com/wienerberger.com']::text[]
  )
  ON CONFLICT (profile_id) DO UPDATE SET
    slug = EXCLUDED.slug,
    company_name = EXCLUDED.company_name,
    description = EXCLUDED.description,
    website = EXCLUDED.website,
    logo_url = EXCLUDED.logo_url,
    public_email = EXCLUDED.public_email,
    public_phone = EXCLUDED.public_phone,
    show_public_contacts = true,
    country = EXCLUDED.country,
    headquarters = EXCLUDED.headquarters,
    categories = EXCLUDED.categories,
    products = EXCLUDED.products,
    countries_available = EXCLUDED.countries_available,
    languages = EXCLUDED.languages,
    verification_status = 'verified',
    is_published = true,
    images = EXCLUDED.images,
    updated_at = now();

  -- Saint-Gobain
  v_user := '82f1c075-34bc-41f2-a9a0-ad5b932f1dae'::uuid;
  v_email := 'directory+mfr-saint-gobain@users.dimarket.app';

  IF NOT EXISTS (SELECT 1 FROM auth.users WHERE id = v_user) THEN
    INSERT INTO auth.users (
      instance_id, id, aud, role, email, encrypted_password, email_confirmed_at,
      raw_app_meta_data, raw_user_meta_data, created_at, updated_at,
      confirmation_token, recovery_token, email_change_token_new, email_change
    ) VALUES (
      '00000000-0000-0000-0000-000000000000',
      v_user,
      'authenticated',
      'authenticated',
      v_email,
      crypt(encode(gen_random_bytes(16), 'hex'), gen_salt('bf')),
      now(),
      '{"provider":"email","providers":["email"]}'::jsonb,
      jsonb_build_object('full_name', 'Saint-Gobain', 'commercial_manufacturer', true),
      now(), now(),
      '', '', '', ''
    );
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM auth.identities WHERE user_id = v_user AND provider = 'email'
  ) THEN
    INSERT INTO auth.identities (
      id, user_id, identity_data, provider, provider_id, last_sign_in_at, created_at, updated_at
    ) VALUES (
      v_user,
      v_user,
      jsonb_build_object('sub', v_user::text, 'email', v_email),
      'email',
      v_user::text,
      now(), now(), now()
    );
  END IF;

  INSERT INTO public.profiles AS p (
    id, full_name, bio, website, phone, location, user_role, is_professional,
    service_latitude, service_longitude, avatar_url, profile_photo, languages,
    availability_status, is_verified, verification_level
  ) VALUES (
    v_user,
    'Saint-Gobain',
    'Building materials group — glass, gypsum, insulation and construction chemicals.',
    'https://www.saint-gobain.com',
    NULL,
    'Courbevoie, France',
    'company',
    true,
    48.896,
    2.256,
    'https://logo.clearbit.com/saint-gobain.com',
    'https://logo.clearbit.com/saint-gobain.com',
    ARRAY['FR', 'EN', 'DE', 'ES', 'PL']::text[],
    'available',
    true,
    'gold'
  )
  ON CONFLICT (id) DO UPDATE SET
    full_name = EXCLUDED.full_name,
    bio = EXCLUDED.bio,
    website = EXCLUDED.website,
    phone = COALESCE(EXCLUDED.phone, p.phone),
    location = EXCLUDED.location,
    user_role = 'company',
    is_professional = true,
    service_latitude = EXCLUDED.service_latitude,
    service_longitude = EXCLUDED.service_longitude,
    avatar_url = EXCLUDED.avatar_url,
    profile_photo = EXCLUDED.profile_photo,
    languages = EXCLUDED.languages,
    is_verified = true,
    verification_level = 'gold';

  INSERT INTO public.manufacturer_profiles AS mfr (
    profile_id, slug, company_name, description, website, logo_url,
    public_email, public_phone, show_public_contacts,
    country, headquarters, categories, products,
    target_markets, countries_available, languages,
    agent_required, non_exclusive_representation, exclusive_representation,
    verification_status, is_published, images
  ) VALUES (
    v_user,
    'saint-gobain',
    'Saint-Gobain',
    'Building materials group — glass, gypsum, insulation and construction chemicals.',
    'https://www.saint-gobain.com',
    'https://logo.clearbit.com/saint-gobain.com',
    NULL,
    NULL,
    true,
    'France',
    'Courbevoie, France',
    ARRAY['construction', 'renovation', 'manufacturers']::text[],
    ARRAY['Glass', 'Gypsum', 'Insulation']::text[],
    ARRAY['France', 'Germany', 'Spain', 'Poland', 'Ukraine', 'Italy', 'Romania']::text[],
    ARRAY['France', 'Germany', 'Spain', 'Poland', 'Ukraine', 'Italy', 'Romania']::text[],
    ARRAY['FR', 'EN', 'DE', 'ES', 'PL']::text[],
    true,
    true,
    false,
    'verified',
    true,
    ARRAY['https://logo.clearbit.com/saint-gobain.com']::text[]
  )
  ON CONFLICT (profile_id) DO UPDATE SET
    slug = EXCLUDED.slug,
    company_name = EXCLUDED.company_name,
    description = EXCLUDED.description,
    website = EXCLUDED.website,
    logo_url = EXCLUDED.logo_url,
    public_email = EXCLUDED.public_email,
    public_phone = EXCLUDED.public_phone,
    show_public_contacts = true,
    country = EXCLUDED.country,
    headquarters = EXCLUDED.headquarters,
    categories = EXCLUDED.categories,
    products = EXCLUDED.products,
    countries_available = EXCLUDED.countries_available,
    languages = EXCLUDED.languages,
    verification_status = 'verified',
    is_published = true,
    images = EXCLUDED.images,
    updated_at = now();

  -- Bosch Professional
  v_user := '4d27c6b1-2954-406b-a748-180e8bafec87'::uuid;
  v_email := 'directory+mfr-bosch-professional@users.dimarket.app';

  IF NOT EXISTS (SELECT 1 FROM auth.users WHERE id = v_user) THEN
    INSERT INTO auth.users (
      instance_id, id, aud, role, email, encrypted_password, email_confirmed_at,
      raw_app_meta_data, raw_user_meta_data, created_at, updated_at,
      confirmation_token, recovery_token, email_change_token_new, email_change
    ) VALUES (
      '00000000-0000-0000-0000-000000000000',
      v_user,
      'authenticated',
      'authenticated',
      v_email,
      crypt(encode(gen_random_bytes(16), 'hex'), gen_salt('bf')),
      now(),
      '{"provider":"email","providers":["email"]}'::jsonb,
      jsonb_build_object('full_name', 'Bosch Professional', 'commercial_manufacturer', true),
      now(), now(),
      '', '', '', ''
    );
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM auth.identities WHERE user_id = v_user AND provider = 'email'
  ) THEN
    INSERT INTO auth.identities (
      id, user_id, identity_data, provider, provider_id, last_sign_in_at, created_at, updated_at
    ) VALUES (
      v_user,
      v_user,
      jsonb_build_object('sub', v_user::text, 'email', v_email),
      'email',
      v_user::text,
      now(), now(), now()
    );
  END IF;

  INSERT INTO public.profiles AS p (
    id, full_name, bio, website, phone, location, user_role, is_professional,
    service_latitude, service_longitude, avatar_url, profile_photo, languages,
    availability_status, is_verified, verification_level
  ) VALUES (
    v_user,
    'Bosch Professional',
    'Professional power tools, measuring tools and accessories for tradespeople.',
    'https://www.bosch-professional.com',
    NULL,
    'Leinfelden-Echterdingen, Germany',
    'company',
    true,
    48.6942,
    9.1417,
    'https://logo.clearbit.com/bosch-professional.com',
    'https://logo.clearbit.com/bosch-professional.com',
    ARRAY['DE', 'EN', 'ES', 'FR', 'PL']::text[],
    'available',
    true,
    'gold'
  )
  ON CONFLICT (id) DO UPDATE SET
    full_name = EXCLUDED.full_name,
    bio = EXCLUDED.bio,
    website = EXCLUDED.website,
    phone = COALESCE(EXCLUDED.phone, p.phone),
    location = EXCLUDED.location,
    user_role = 'company',
    is_professional = true,
    service_latitude = EXCLUDED.service_latitude,
    service_longitude = EXCLUDED.service_longitude,
    avatar_url = EXCLUDED.avatar_url,
    profile_photo = EXCLUDED.profile_photo,
    languages = EXCLUDED.languages,
    is_verified = true,
    verification_level = 'gold';

  INSERT INTO public.manufacturer_profiles AS mfr (
    profile_id, slug, company_name, description, website, logo_url,
    public_email, public_phone, show_public_contacts,
    country, headquarters, categories, products,
    target_markets, countries_available, languages,
    agent_required, non_exclusive_representation, exclusive_representation,
    verification_status, is_published, images
  ) VALUES (
    v_user,
    'bosch-professional',
    'Bosch Professional',
    'Professional power tools, measuring tools and accessories for tradespeople.',
    'https://www.bosch-professional.com',
    'https://logo.clearbit.com/bosch-professional.com',
    NULL,
    NULL,
    true,
    'Germany',
    'Leinfelden-Echterdingen, Germany',
    ARRAY['construction', 'manufacturers', 'tools']::text[],
    ARRAY['Power tools', 'Measuring tools', 'Accessories']::text[],
    ARRAY['Germany', 'Poland', 'Spain', 'France', 'Italy', 'Ukraine']::text[],
    ARRAY['Germany', 'Poland', 'Spain', 'France', 'Italy', 'Ukraine']::text[],
    ARRAY['DE', 'EN', 'ES', 'FR', 'PL']::text[],
    true,
    true,
    false,
    'verified',
    true,
    ARRAY['https://logo.clearbit.com/bosch-professional.com']::text[]
  )
  ON CONFLICT (profile_id) DO UPDATE SET
    slug = EXCLUDED.slug,
    company_name = EXCLUDED.company_name,
    description = EXCLUDED.description,
    website = EXCLUDED.website,
    logo_url = EXCLUDED.logo_url,
    public_email = EXCLUDED.public_email,
    public_phone = EXCLUDED.public_phone,
    show_public_contacts = true,
    country = EXCLUDED.country,
    headquarters = EXCLUDED.headquarters,
    categories = EXCLUDED.categories,
    products = EXCLUDED.products,
    countries_available = EXCLUDED.countries_available,
    languages = EXCLUDED.languages,
    verification_status = 'verified',
    is_published = true,
    images = EXCLUDED.images,
    updated_at = now();

  -- Würth
  v_user := '3e1b9337-4c0b-4b6e-a575-86f979f38275'::uuid;
  v_email := 'directory+mfr-wuerth@users.dimarket.app';

  IF NOT EXISTS (SELECT 1 FROM auth.users WHERE id = v_user) THEN
    INSERT INTO auth.users (
      instance_id, id, aud, role, email, encrypted_password, email_confirmed_at,
      raw_app_meta_data, raw_user_meta_data, created_at, updated_at,
      confirmation_token, recovery_token, email_change_token_new, email_change
    ) VALUES (
      '00000000-0000-0000-0000-000000000000',
      v_user,
      'authenticated',
      'authenticated',
      v_email,
      crypt(encode(gen_random_bytes(16), 'hex'), gen_salt('bf')),
      now(),
      '{"provider":"email","providers":["email"]}'::jsonb,
      jsonb_build_object('full_name', 'Würth', 'commercial_manufacturer', true),
      now(), now(),
      '', '', '', ''
    );
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM auth.identities WHERE user_id = v_user AND provider = 'email'
  ) THEN
    INSERT INTO auth.identities (
      id, user_id, identity_data, provider, provider_id, last_sign_in_at, created_at, updated_at
    ) VALUES (
      v_user,
      v_user,
      jsonb_build_object('sub', v_user::text, 'email', v_email),
      'email',
      v_user::text,
      now(), now(), now()
    );
  END IF;

  INSERT INTO public.profiles AS p (
    id, full_name, bio, website, phone, location, user_role, is_professional,
    service_latitude, service_longitude, avatar_url, profile_photo, languages,
    availability_status, is_verified, verification_level
  ) VALUES (
    v_user,
    'Würth',
    'Assembly and fastening materials, tools and consumables for construction and industry.',
    'https://www.wuerth.com',
    NULL,
    'Künzelsau, Germany',
    'company',
    true,
    49.2811,
    9.6861,
    'https://logo.clearbit.com/wuerth.com',
    'https://logo.clearbit.com/wuerth.com',
    ARRAY['DE', 'EN', 'ES', 'FR', 'IT', 'PL']::text[],
    'available',
    true,
    'gold'
  )
  ON CONFLICT (id) DO UPDATE SET
    full_name = EXCLUDED.full_name,
    bio = EXCLUDED.bio,
    website = EXCLUDED.website,
    phone = COALESCE(EXCLUDED.phone, p.phone),
    location = EXCLUDED.location,
    user_role = 'company',
    is_professional = true,
    service_latitude = EXCLUDED.service_latitude,
    service_longitude = EXCLUDED.service_longitude,
    avatar_url = EXCLUDED.avatar_url,
    profile_photo = EXCLUDED.profile_photo,
    languages = EXCLUDED.languages,
    is_verified = true,
    verification_level = 'gold';

  INSERT INTO public.manufacturer_profiles AS mfr (
    profile_id, slug, company_name, description, website, logo_url,
    public_email, public_phone, show_public_contacts,
    country, headquarters, categories, products,
    target_markets, countries_available, languages,
    agent_required, non_exclusive_representation, exclusive_representation,
    verification_status, is_published, images
  ) VALUES (
    v_user,
    'wuerth',
    'Würth',
    'Assembly and fastening materials, tools and consumables for construction and industry.',
    'https://www.wuerth.com',
    'https://logo.clearbit.com/wuerth.com',
    NULL,
    NULL,
    true,
    'Germany',
    'Künzelsau, Germany',
    ARRAY['construction', 'manufacturers', 'stores']::text[],
    ARRAY['Fasteners', 'Chemicals', 'Tools']::text[],
    ARRAY['Germany', 'Poland', 'Spain', 'France', 'Italy', 'Ukraine', 'Romania']::text[],
    ARRAY['Germany', 'Poland', 'Spain', 'France', 'Italy', 'Ukraine', 'Romania']::text[],
    ARRAY['DE', 'EN', 'ES', 'FR', 'IT', 'PL']::text[],
    true,
    true,
    false,
    'verified',
    true,
    ARRAY['https://logo.clearbit.com/wuerth.com']::text[]
  )
  ON CONFLICT (profile_id) DO UPDATE SET
    slug = EXCLUDED.slug,
    company_name = EXCLUDED.company_name,
    description = EXCLUDED.description,
    website = EXCLUDED.website,
    logo_url = EXCLUDED.logo_url,
    public_email = EXCLUDED.public_email,
    public_phone = EXCLUDED.public_phone,
    show_public_contacts = true,
    country = EXCLUDED.country,
    headquarters = EXCLUDED.headquarters,
    categories = EXCLUDED.categories,
    products = EXCLUDED.products,
    countries_available = EXCLUDED.countries_available,
    languages = EXCLUDED.languages,
    verification_status = 'verified',
    is_published = true,
    images = EXCLUDED.images,
    updated_at = now();

  -- GROHE
  v_user := '290cec32-83d3-4945-a69a-f556da67dfd7'::uuid;
  v_email := 'directory+mfr-grohe@users.dimarket.app';

  IF NOT EXISTS (SELECT 1 FROM auth.users WHERE id = v_user) THEN
    INSERT INTO auth.users (
      instance_id, id, aud, role, email, encrypted_password, email_confirmed_at,
      raw_app_meta_data, raw_user_meta_data, created_at, updated_at,
      confirmation_token, recovery_token, email_change_token_new, email_change
    ) VALUES (
      '00000000-0000-0000-0000-000000000000',
      v_user,
      'authenticated',
      'authenticated',
      v_email,
      crypt(encode(gen_random_bytes(16), 'hex'), gen_salt('bf')),
      now(),
      '{"provider":"email","providers":["email"]}'::jsonb,
      jsonb_build_object('full_name', 'GROHE', 'commercial_manufacturer', true),
      now(), now(),
      '', '', '', ''
    );
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM auth.identities WHERE user_id = v_user AND provider = 'email'
  ) THEN
    INSERT INTO auth.identities (
      id, user_id, identity_data, provider, provider_id, last_sign_in_at, created_at, updated_at
    ) VALUES (
      v_user,
      v_user,
      jsonb_build_object('sub', v_user::text, 'email', v_email),
      'email',
      v_user::text,
      now(), now(), now()
    );
  END IF;

  INSERT INTO public.profiles AS p (
    id, full_name, bio, website, phone, location, user_role, is_professional,
    service_latitude, service_longitude, avatar_url, profile_photo, languages,
    availability_status, is_verified, verification_level
  ) VALUES (
    v_user,
    'GROHE',
    'Premium sanitary fittings, showers and kitchen mixers (LIXIL).',
    'https://www.grohe.com',
    NULL,
    'Düsseldorf, Germany',
    'company',
    true,
    51.2277,
    6.7735,
    'https://logo.clearbit.com/grohe.com',
    'https://logo.clearbit.com/grohe.com',
    ARRAY['DE', 'EN', 'ES', 'FR', 'PL', 'UA']::text[],
    'available',
    true,
    'gold'
  )
  ON CONFLICT (id) DO UPDATE SET
    full_name = EXCLUDED.full_name,
    bio = EXCLUDED.bio,
    website = EXCLUDED.website,
    phone = COALESCE(EXCLUDED.phone, p.phone),
    location = EXCLUDED.location,
    user_role = 'company',
    is_professional = true,
    service_latitude = EXCLUDED.service_latitude,
    service_longitude = EXCLUDED.service_longitude,
    avatar_url = EXCLUDED.avatar_url,
    profile_photo = EXCLUDED.profile_photo,
    languages = EXCLUDED.languages,
    is_verified = true,
    verification_level = 'gold';

  INSERT INTO public.manufacturer_profiles AS mfr (
    profile_id, slug, company_name, description, website, logo_url,
    public_email, public_phone, show_public_contacts,
    country, headquarters, categories, products,
    target_markets, countries_available, languages,
    agent_required, non_exclusive_representation, exclusive_representation,
    verification_status, is_published, images
  ) VALUES (
    v_user,
    'grohe',
    'GROHE',
    'Premium sanitary fittings, showers and kitchen mixers (LIXIL).',
    'https://www.grohe.com',
    'https://logo.clearbit.com/grohe.com',
    NULL,
    NULL,
    true,
    'Germany',
    'Düsseldorf, Germany',
    ARRAY['renovation', 'hvac', 'manufacturers']::text[],
    ARRAY['Mixers', 'Showers', 'Kitchen fittings']::text[],
    ARRAY['Germany', 'Poland', 'Spain', 'Ukraine', 'France', 'Italy', 'UK']::text[],
    ARRAY['Germany', 'Poland', 'Spain', 'Ukraine', 'France', 'Italy', 'UK']::text[],
    ARRAY['DE', 'EN', 'ES', 'FR', 'PL', 'UA']::text[],
    true,
    true,
    false,
    'verified',
    true,
    ARRAY['https://logo.clearbit.com/grohe.com']::text[]
  )
  ON CONFLICT (profile_id) DO UPDATE SET
    slug = EXCLUDED.slug,
    company_name = EXCLUDED.company_name,
    description = EXCLUDED.description,
    website = EXCLUDED.website,
    logo_url = EXCLUDED.logo_url,
    public_email = EXCLUDED.public_email,
    public_phone = EXCLUDED.public_phone,
    show_public_contacts = true,
    country = EXCLUDED.country,
    headquarters = EXCLUDED.headquarters,
    categories = EXCLUDED.categories,
    products = EXCLUDED.products,
    countries_available = EXCLUDED.countries_available,
    languages = EXCLUDED.languages,
    verification_status = 'verified',
    is_published = true,
    images = EXCLUDED.images,
    updated_at = now();

  -- hansgrohe
  v_user := '678e1dcc-305a-4be9-a068-9ab33b8fa32e'::uuid;
  v_email := 'directory+mfr-hansgrohe@users.dimarket.app';

  IF NOT EXISTS (SELECT 1 FROM auth.users WHERE id = v_user) THEN
    INSERT INTO auth.users (
      instance_id, id, aud, role, email, encrypted_password, email_confirmed_at,
      raw_app_meta_data, raw_user_meta_data, created_at, updated_at,
      confirmation_token, recovery_token, email_change_token_new, email_change
    ) VALUES (
      '00000000-0000-0000-0000-000000000000',
      v_user,
      'authenticated',
      'authenticated',
      v_email,
      crypt(encode(gen_random_bytes(16), 'hex'), gen_salt('bf')),
      now(),
      '{"provider":"email","providers":["email"]}'::jsonb,
      jsonb_build_object('full_name', 'hansgrohe', 'commercial_manufacturer', true),
      now(), now(),
      '', '', '', ''
    );
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM auth.identities WHERE user_id = v_user AND provider = 'email'
  ) THEN
    INSERT INTO auth.identities (
      id, user_id, identity_data, provider, provider_id, last_sign_in_at, created_at, updated_at
    ) VALUES (
      v_user,
      v_user,
      jsonb_build_object('sub', v_user::text, 'email', v_email),
      'email',
      v_user::text,
      now(), now(), now()
    );
  END IF;

  INSERT INTO public.profiles AS p (
    id, full_name, bio, website, phone, location, user_role, is_professional,
    service_latitude, service_longitude, avatar_url, profile_photo, languages,
    availability_status, is_verified, verification_level
  ) VALUES (
    v_user,
    'hansgrohe',
    'Showers, mixers and bathroom design products for residential and hospitality.',
    'https://www.hansgrohe.com',
    NULL,
    'Schiltach, Germany',
    'company',
    true,
    48.2897,
    8.3428,
    'https://logo.clearbit.com/hansgrohe.com',
    'https://logo.clearbit.com/hansgrohe.com',
    ARRAY['DE', 'EN', 'FR', 'IT', 'ES']::text[],
    'available',
    true,
    'gold'
  )
  ON CONFLICT (id) DO UPDATE SET
    full_name = EXCLUDED.full_name,
    bio = EXCLUDED.bio,
    website = EXCLUDED.website,
    phone = COALESCE(EXCLUDED.phone, p.phone),
    location = EXCLUDED.location,
    user_role = 'company',
    is_professional = true,
    service_latitude = EXCLUDED.service_latitude,
    service_longitude = EXCLUDED.service_longitude,
    avatar_url = EXCLUDED.avatar_url,
    profile_photo = EXCLUDED.profile_photo,
    languages = EXCLUDED.languages,
    is_verified = true,
    verification_level = 'gold';

  INSERT INTO public.manufacturer_profiles AS mfr (
    profile_id, slug, company_name, description, website, logo_url,
    public_email, public_phone, show_public_contacts,
    country, headquarters, categories, products,
    target_markets, countries_available, languages,
    agent_required, non_exclusive_representation, exclusive_representation,
    verification_status, is_published, images
  ) VALUES (
    v_user,
    'hansgrohe',
    'hansgrohe',
    'Showers, mixers and bathroom design products for residential and hospitality.',
    'https://www.hansgrohe.com',
    'https://logo.clearbit.com/hansgrohe.com',
    NULL,
    NULL,
    true,
    'Germany',
    'Schiltach, Germany',
    ARRAY['renovation', 'manufacturers']::text[],
    ARRAY['Showers', 'Mixers', 'Bathroom design']::text[],
    ARRAY['Germany', 'Austria', 'Switzerland', 'Poland', 'Spain', 'France', 'Ukraine']::text[],
    ARRAY['Germany', 'Austria', 'Switzerland', 'Poland', 'Spain', 'France', 'Ukraine']::text[],
    ARRAY['DE', 'EN', 'FR', 'IT', 'ES']::text[],
    true,
    true,
    false,
    'verified',
    true,
    ARRAY['https://logo.clearbit.com/hansgrohe.com']::text[]
  )
  ON CONFLICT (profile_id) DO UPDATE SET
    slug = EXCLUDED.slug,
    company_name = EXCLUDED.company_name,
    description = EXCLUDED.description,
    website = EXCLUDED.website,
    logo_url = EXCLUDED.logo_url,
    public_email = EXCLUDED.public_email,
    public_phone = EXCLUDED.public_phone,
    show_public_contacts = true,
    country = EXCLUDED.country,
    headquarters = EXCLUDED.headquarters,
    categories = EXCLUDED.categories,
    products = EXCLUDED.products,
    countries_available = EXCLUDED.countries_available,
    languages = EXCLUDED.languages,
    verification_status = 'verified',
    is_published = true,
    images = EXCLUDED.images,
    updated_at = now();

  -- REHAU
  v_user := '0ab4834e-af4e-4d96-af8d-8224ffdcd6f2'::uuid;
  v_email := 'directory+mfr-rehau@users.dimarket.app';

  IF NOT EXISTS (SELECT 1 FROM auth.users WHERE id = v_user) THEN
    INSERT INTO auth.users (
      instance_id, id, aud, role, email, encrypted_password, email_confirmed_at,
      raw_app_meta_data, raw_user_meta_data, created_at, updated_at,
      confirmation_token, recovery_token, email_change_token_new, email_change
    ) VALUES (
      '00000000-0000-0000-0000-000000000000',
      v_user,
      'authenticated',
      'authenticated',
      v_email,
      crypt(encode(gen_random_bytes(16), 'hex'), gen_salt('bf')),
      now(),
      '{"provider":"email","providers":["email"]}'::jsonb,
      jsonb_build_object('full_name', 'REHAU', 'commercial_manufacturer', true),
      now(), now(),
      '', '', '', ''
    );
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM auth.identities WHERE user_id = v_user AND provider = 'email'
  ) THEN
    INSERT INTO auth.identities (
      id, user_id, identity_data, provider, provider_id, last_sign_in_at, created_at, updated_at
    ) VALUES (
      v_user,
      v_user,
      jsonb_build_object('sub', v_user::text, 'email', v_email),
      'email',
      v_user::text,
      now(), now(), now()
    );
  END IF;

  INSERT INTO public.profiles AS p (
    id, full_name, bio, website, phone, location, user_role, is_professional,
    service_latitude, service_longitude, avatar_url, profile_photo, languages,
    availability_status, is_verified, verification_level
  ) VALUES (
    v_user,
    'REHAU',
    'Polymer solutions for windows, building technology and infrastructure.',
    'https://www.rehau.com',
    NULL,
    'Rehau, Germany',
    'company',
    true,
    50.2467,
    12.0342,
    'https://logo.clearbit.com/rehau.com',
    'https://logo.clearbit.com/rehau.com',
    ARRAY['DE', 'EN', 'PL', 'UA', 'CS']::text[],
    'available',
    true,
    'gold'
  )
  ON CONFLICT (id) DO UPDATE SET
    full_name = EXCLUDED.full_name,
    bio = EXCLUDED.bio,
    website = EXCLUDED.website,
    phone = COALESCE(EXCLUDED.phone, p.phone),
    location = EXCLUDED.location,
    user_role = 'company',
    is_professional = true,
    service_latitude = EXCLUDED.service_latitude,
    service_longitude = EXCLUDED.service_longitude,
    avatar_url = EXCLUDED.avatar_url,
    profile_photo = EXCLUDED.profile_photo,
    languages = EXCLUDED.languages,
    is_verified = true,
    verification_level = 'gold';

  INSERT INTO public.manufacturer_profiles AS mfr (
    profile_id, slug, company_name, description, website, logo_url,
    public_email, public_phone, show_public_contacts,
    country, headquarters, categories, products,
    target_markets, countries_available, languages,
    agent_required, non_exclusive_representation, exclusive_representation,
    verification_status, is_published, images
  ) VALUES (
    v_user,
    'rehau',
    'REHAU',
    'Polymer solutions for windows, building technology and infrastructure.',
    'https://www.rehau.com',
    'https://logo.clearbit.com/rehau.com',
    NULL,
    NULL,
    true,
    'Germany',
    'Rehau, Germany',
    ARRAY['construction', 'hvac', 'manufacturers']::text[],
    ARRAY['Window profiles', 'Pipes', 'Underfloor heating']::text[],
    ARRAY['Germany', 'Poland', 'Ukraine', 'Spain', 'Czechia', 'Romania']::text[],
    ARRAY['Germany', 'Poland', 'Ukraine', 'Spain', 'Czechia', 'Romania']::text[],
    ARRAY['DE', 'EN', 'PL', 'UA', 'CS']::text[],
    true,
    true,
    false,
    'verified',
    true,
    ARRAY['https://logo.clearbit.com/rehau.com']::text[]
  )
  ON CONFLICT (profile_id) DO UPDATE SET
    slug = EXCLUDED.slug,
    company_name = EXCLUDED.company_name,
    description = EXCLUDED.description,
    website = EXCLUDED.website,
    logo_url = EXCLUDED.logo_url,
    public_email = EXCLUDED.public_email,
    public_phone = EXCLUDED.public_phone,
    show_public_contacts = true,
    country = EXCLUDED.country,
    headquarters = EXCLUDED.headquarters,
    categories = EXCLUDED.categories,
    products = EXCLUDED.products,
    countries_available = EXCLUDED.countries_available,
    languages = EXCLUDED.languages,
    verification_status = 'verified',
    is_published = true,
    images = EXCLUDED.images,
    updated_at = now();

  -- Kingspan
  v_user := '0d824e3d-aa7c-4488-af05-59f712ba8da3'::uuid;
  v_email := 'directory+mfr-kingspan@users.dimarket.app';

  IF NOT EXISTS (SELECT 1 FROM auth.users WHERE id = v_user) THEN
    INSERT INTO auth.users (
      instance_id, id, aud, role, email, encrypted_password, email_confirmed_at,
      raw_app_meta_data, raw_user_meta_data, created_at, updated_at,
      confirmation_token, recovery_token, email_change_token_new, email_change
    ) VALUES (
      '00000000-0000-0000-0000-000000000000',
      v_user,
      'authenticated',
      'authenticated',
      v_email,
      crypt(encode(gen_random_bytes(16), 'hex'), gen_salt('bf')),
      now(),
      '{"provider":"email","providers":["email"]}'::jsonb,
      jsonb_build_object('full_name', 'Kingspan', 'commercial_manufacturer', true),
      now(), now(),
      '', '', '', ''
    );
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM auth.identities WHERE user_id = v_user AND provider = 'email'
  ) THEN
    INSERT INTO auth.identities (
      id, user_id, identity_data, provider, provider_id, last_sign_in_at, created_at, updated_at
    ) VALUES (
      v_user,
      v_user,
      jsonb_build_object('sub', v_user::text, 'email', v_email),
      'email',
      v_user::text,
      now(), now(), now()
    );
  END IF;

  INSERT INTO public.profiles AS p (
    id, full_name, bio, website, phone, location, user_role, is_professional,
    service_latitude, service_longitude, avatar_url, profile_photo, languages,
    availability_status, is_verified, verification_level
  ) VALUES (
    v_user,
    'Kingspan',
    'High-performance insulation and building envelope solutions.',
    'https://www.kingspan.com',
    NULL,
    'Kingscourt, Ireland',
    'company',
    true,
    53.907,
    -6.804,
    'https://logo.clearbit.com/kingspan.com',
    'https://logo.clearbit.com/kingspan.com',
    ARRAY['EN', 'DE', 'ES', 'FR', 'PL']::text[],
    'available',
    true,
    'gold'
  )
  ON CONFLICT (id) DO UPDATE SET
    full_name = EXCLUDED.full_name,
    bio = EXCLUDED.bio,
    website = EXCLUDED.website,
    phone = COALESCE(EXCLUDED.phone, p.phone),
    location = EXCLUDED.location,
    user_role = 'company',
    is_professional = true,
    service_latitude = EXCLUDED.service_latitude,
    service_longitude = EXCLUDED.service_longitude,
    avatar_url = EXCLUDED.avatar_url,
    profile_photo = EXCLUDED.profile_photo,
    languages = EXCLUDED.languages,
    is_verified = true,
    verification_level = 'gold';

  INSERT INTO public.manufacturer_profiles AS mfr (
    profile_id, slug, company_name, description, website, logo_url,
    public_email, public_phone, show_public_contacts,
    country, headquarters, categories, products,
    target_markets, countries_available, languages,
    agent_required, non_exclusive_representation, exclusive_representation,
    verification_status, is_published, images
  ) VALUES (
    v_user,
    'kingspan',
    'Kingspan',
    'High-performance insulation and building envelope solutions.',
    'https://www.kingspan.com',
    'https://logo.clearbit.com/kingspan.com',
    NULL,
    NULL,
    true,
    'Ireland',
    'Kingscourt, Ireland',
    ARRAY['construction', 'manufacturers']::text[],
    ARRAY['Insulation panels', 'Building envelope']::text[],
    ARRAY['Ireland', 'UK', 'Germany', 'Poland', 'Spain', 'France', 'Romania']::text[],
    ARRAY['Ireland', 'UK', 'Germany', 'Poland', 'Spain', 'France', 'Romania']::text[],
    ARRAY['EN', 'DE', 'ES', 'FR', 'PL']::text[],
    true,
    true,
    false,
    'verified',
    true,
    ARRAY['https://logo.clearbit.com/kingspan.com']::text[]
  )
  ON CONFLICT (profile_id) DO UPDATE SET
    slug = EXCLUDED.slug,
    company_name = EXCLUDED.company_name,
    description = EXCLUDED.description,
    website = EXCLUDED.website,
    logo_url = EXCLUDED.logo_url,
    public_email = EXCLUDED.public_email,
    public_phone = EXCLUDED.public_phone,
    show_public_contacts = true,
    country = EXCLUDED.country,
    headquarters = EXCLUDED.headquarters,
    categories = EXCLUDED.categories,
    products = EXCLUDED.products,
    countries_available = EXCLUDED.countries_available,
    languages = EXCLUDED.languages,
    verification_status = 'verified',
    is_published = true,
    images = EXCLUDED.images,
    updated_at = now();

  -- Legrand
  v_user := 'c54e83a1-661b-4ffd-ad42-449df72b40f5'::uuid;
  v_email := 'directory+mfr-legrand@users.dimarket.app';

  IF NOT EXISTS (SELECT 1 FROM auth.users WHERE id = v_user) THEN
    INSERT INTO auth.users (
      instance_id, id, aud, role, email, encrypted_password, email_confirmed_at,
      raw_app_meta_data, raw_user_meta_data, created_at, updated_at,
      confirmation_token, recovery_token, email_change_token_new, email_change
    ) VALUES (
      '00000000-0000-0000-0000-000000000000',
      v_user,
      'authenticated',
      'authenticated',
      v_email,
      crypt(encode(gen_random_bytes(16), 'hex'), gen_salt('bf')),
      now(),
      '{"provider":"email","providers":["email"]}'::jsonb,
      jsonb_build_object('full_name', 'Legrand', 'commercial_manufacturer', true),
      now(), now(),
      '', '', '', ''
    );
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM auth.identities WHERE user_id = v_user AND provider = 'email'
  ) THEN
    INSERT INTO auth.identities (
      id, user_id, identity_data, provider, provider_id, last_sign_in_at, created_at, updated_at
    ) VALUES (
      v_user,
      v_user,
      jsonb_build_object('sub', v_user::text, 'email', v_email),
      'email',
      v_user::text,
      now(), now(), now()
    );
  END IF;

  INSERT INTO public.profiles AS p (
    id, full_name, bio, website, phone, location, user_role, is_professional,
    service_latitude, service_longitude, avatar_url, profile_photo, languages,
    availability_status, is_verified, verification_level
  ) VALUES (
    v_user,
    'Legrand',
    'Electrical and digital building infrastructures — switches, panels, cable management.',
    'https://www.legrand.com',
    NULL,
    'Limoges, France',
    'company',
    true,
    45.8336,
    1.2611,
    'https://logo.clearbit.com/legrand.com',
    'https://logo.clearbit.com/legrand.com',
    ARRAY['FR', 'EN', 'ES', 'DE', 'IT', 'PL']::text[],
    'available',
    true,
    'gold'
  )
  ON CONFLICT (id) DO UPDATE SET
    full_name = EXCLUDED.full_name,
    bio = EXCLUDED.bio,
    website = EXCLUDED.website,
    phone = COALESCE(EXCLUDED.phone, p.phone),
    location = EXCLUDED.location,
    user_role = 'company',
    is_professional = true,
    service_latitude = EXCLUDED.service_latitude,
    service_longitude = EXCLUDED.service_longitude,
    avatar_url = EXCLUDED.avatar_url,
    profile_photo = EXCLUDED.profile_photo,
    languages = EXCLUDED.languages,
    is_verified = true,
    verification_level = 'gold';

  INSERT INTO public.manufacturer_profiles AS mfr (
    profile_id, slug, company_name, description, website, logo_url,
    public_email, public_phone, show_public_contacts,
    country, headquarters, categories, products,
    target_markets, countries_available, languages,
    agent_required, non_exclusive_representation, exclusive_representation,
    verification_status, is_published, images
  ) VALUES (
    v_user,
    'legrand',
    'Legrand',
    'Electrical and digital building infrastructures — switches, panels, cable management.',
    'https://www.legrand.com',
    'https://logo.clearbit.com/legrand.com',
    NULL,
    NULL,
    true,
    'France',
    'Limoges, France',
    ARRAY['manufacturers', 'home-services']::text[],
    ARRAY['Switches', 'Distribution boards', 'Cable management']::text[],
    ARRAY['France', 'Spain', 'Germany', 'Poland', 'Italy', 'Ukraine', 'Romania']::text[],
    ARRAY['France', 'Spain', 'Germany', 'Poland', 'Italy', 'Ukraine', 'Romania']::text[],
    ARRAY['FR', 'EN', 'ES', 'DE', 'IT', 'PL']::text[],
    true,
    true,
    false,
    'verified',
    true,
    ARRAY['https://logo.clearbit.com/legrand.com']::text[]
  )
  ON CONFLICT (profile_id) DO UPDATE SET
    slug = EXCLUDED.slug,
    company_name = EXCLUDED.company_name,
    description = EXCLUDED.description,
    website = EXCLUDED.website,
    logo_url = EXCLUDED.logo_url,
    public_email = EXCLUDED.public_email,
    public_phone = EXCLUDED.public_phone,
    show_public_contacts = true,
    country = EXCLUDED.country,
    headquarters = EXCLUDED.headquarters,
    categories = EXCLUDED.categories,
    products = EXCLUDED.products,
    countries_available = EXCLUDED.countries_available,
    languages = EXCLUDED.languages,
    verification_status = 'verified',
    is_published = true,
    images = EXCLUDED.images,
    updated_at = now();

  -- Hörmann
  v_user := '492ca606-482e-4fb9-a8dc-1d27b6598c87'::uuid;
  v_email := 'directory+mfr-hormann@users.dimarket.app';

  IF NOT EXISTS (SELECT 1 FROM auth.users WHERE id = v_user) THEN
    INSERT INTO auth.users (
      instance_id, id, aud, role, email, encrypted_password, email_confirmed_at,
      raw_app_meta_data, raw_user_meta_data, created_at, updated_at,
      confirmation_token, recovery_token, email_change_token_new, email_change
    ) VALUES (
      '00000000-0000-0000-0000-000000000000',
      v_user,
      'authenticated',
      'authenticated',
      v_email,
      crypt(encode(gen_random_bytes(16), 'hex'), gen_salt('bf')),
      now(),
      '{"provider":"email","providers":["email"]}'::jsonb,
      jsonb_build_object('full_name', 'Hörmann', 'commercial_manufacturer', true),
      now(), now(),
      '', '', '', ''
    );
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM auth.identities WHERE user_id = v_user AND provider = 'email'
  ) THEN
    INSERT INTO auth.identities (
      id, user_id, identity_data, provider, provider_id, last_sign_in_at, created_at, updated_at
    ) VALUES (
      v_user,
      v_user,
      jsonb_build_object('sub', v_user::text, 'email', v_email),
      'email',
      v_user::text,
      now(), now(), now()
    );
  END IF;

  INSERT INTO public.profiles AS p (
    id, full_name, bio, website, phone, location, user_role, is_professional,
    service_latitude, service_longitude, avatar_url, profile_photo, languages,
    availability_status, is_verified, verification_level
  ) VALUES (
    v_user,
    'Hörmann',
    'Garage, industrial and entrance doors plus loading equipment for residential and commercial buildings.',
    'https://www.hormann.com',
    NULL,
    'Steinhagen, Germany',
    'company',
    true,
    52.0086,
    8.4144,
    'https://logo.clearbit.com/hormann.com',
    'https://logo.clearbit.com/hormann.com',
    ARRAY['DE', 'EN', 'FR', 'ES']::text[],
    'available',
    true,
    'gold'
  )
  ON CONFLICT (id) DO UPDATE SET
    full_name = EXCLUDED.full_name,
    bio = EXCLUDED.bio,
    website = EXCLUDED.website,
    phone = COALESCE(EXCLUDED.phone, p.phone),
    location = EXCLUDED.location,
    user_role = 'company',
    is_professional = true,
    service_latitude = EXCLUDED.service_latitude,
    service_longitude = EXCLUDED.service_longitude,
    avatar_url = EXCLUDED.avatar_url,
    profile_photo = EXCLUDED.profile_photo,
    languages = EXCLUDED.languages,
    is_verified = true,
    verification_level = 'gold';

  INSERT INTO public.manufacturer_profiles AS mfr (
    profile_id, slug, company_name, description, website, logo_url,
    public_email, public_phone, show_public_contacts,
    country, headquarters, categories, products,
    target_markets, countries_available, languages,
    agent_required, non_exclusive_representation, exclusive_representation,
    verification_status, is_published, images
  ) VALUES (
    v_user,
    'hormann',
    'Hörmann',
    'Garage, industrial and entrance doors plus loading equipment for residential and commercial buildings.',
    'https://www.hormann.com',
    'https://logo.clearbit.com/hormann.com',
    NULL,
    NULL,
    true,
    'Germany',
    'Steinhagen, Germany',
    ARRAY['manufacturers', 'construction']::text[],
    ARRAY['Garage doors', 'Industrial doors', 'Entrance doors']::text[],
    ARRAY['Germany', 'Spain', 'France', 'Poland', 'Italy', 'Ukraine', 'Romania']::text[],
    ARRAY['Germany', 'Spain', 'France', 'Poland', 'Italy', 'Ukraine', 'Romania']::text[],
    ARRAY['DE', 'EN', 'FR', 'ES']::text[],
    true,
    true,
    false,
    'verified',
    true,
    ARRAY['https://logo.clearbit.com/hormann.com']::text[]
  )
  ON CONFLICT (profile_id) DO UPDATE SET
    slug = EXCLUDED.slug,
    company_name = EXCLUDED.company_name,
    description = EXCLUDED.description,
    website = EXCLUDED.website,
    logo_url = EXCLUDED.logo_url,
    public_email = EXCLUDED.public_email,
    public_phone = EXCLUDED.public_phone,
    show_public_contacts = true,
    country = EXCLUDED.country,
    headquarters = EXCLUDED.headquarters,
    categories = EXCLUDED.categories,
    products = EXCLUDED.products,
    countries_available = EXCLUDED.countries_available,
    languages = EXCLUDED.languages,
    verification_status = 'verified',
    is_published = true,
    images = EXCLUDED.images,
    updated_at = now();

  -- Schüco
  v_user := 'a25fbe4f-e3f6-4e52-a5b3-e4eb539277a2'::uuid;
  v_email := 'directory+mfr-schueco@users.dimarket.app';

  IF NOT EXISTS (SELECT 1 FROM auth.users WHERE id = v_user) THEN
    INSERT INTO auth.users (
      instance_id, id, aud, role, email, encrypted_password, email_confirmed_at,
      raw_app_meta_data, raw_user_meta_data, created_at, updated_at,
      confirmation_token, recovery_token, email_change_token_new, email_change
    ) VALUES (
      '00000000-0000-0000-0000-000000000000',
      v_user,
      'authenticated',
      'authenticated',
      v_email,
      crypt(encode(gen_random_bytes(16), 'hex'), gen_salt('bf')),
      now(),
      '{"provider":"email","providers":["email"]}'::jsonb,
      jsonb_build_object('full_name', 'Schüco', 'commercial_manufacturer', true),
      now(), now(),
      '', '', '', ''
    );
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM auth.identities WHERE user_id = v_user AND provider = 'email'
  ) THEN
    INSERT INTO auth.identities (
      id, user_id, identity_data, provider, provider_id, last_sign_in_at, created_at, updated_at
    ) VALUES (
      v_user,
      v_user,
      jsonb_build_object('sub', v_user::text, 'email', v_email),
      'email',
      v_user::text,
      now(), now(), now()
    );
  END IF;

  INSERT INTO public.profiles AS p (
    id, full_name, bio, website, phone, location, user_role, is_professional,
    service_latitude, service_longitude, avatar_url, profile_photo, languages,
    availability_status, is_verified, verification_level
  ) VALUES (
    v_user,
    'Schüco',
    'Aluminium window, door and facade systems for residential and commercial buildings.',
    'https://www.schueco.com',
    NULL,
    'Bielefeld, Germany',
    'company',
    true,
    52.0302,
    8.5325,
    'https://logo.clearbit.com/schueco.com',
    'https://logo.clearbit.com/schueco.com',
    ARRAY['DE', 'EN', 'ES', 'FR']::text[],
    'available',
    true,
    'gold'
  )
  ON CONFLICT (id) DO UPDATE SET
    full_name = EXCLUDED.full_name,
    bio = EXCLUDED.bio,
    website = EXCLUDED.website,
    phone = COALESCE(EXCLUDED.phone, p.phone),
    location = EXCLUDED.location,
    user_role = 'company',
    is_professional = true,
    service_latitude = EXCLUDED.service_latitude,
    service_longitude = EXCLUDED.service_longitude,
    avatar_url = EXCLUDED.avatar_url,
    profile_photo = EXCLUDED.profile_photo,
    languages = EXCLUDED.languages,
    is_verified = true,
    verification_level = 'gold';

  INSERT INTO public.manufacturer_profiles AS mfr (
    profile_id, slug, company_name, description, website, logo_url,
    public_email, public_phone, show_public_contacts,
    country, headquarters, categories, products,
    target_markets, countries_available, languages,
    agent_required, non_exclusive_representation, exclusive_representation,
    verification_status, is_published, images
  ) VALUES (
    v_user,
    'schueco',
    'Schüco',
    'Aluminium window, door and facade systems for residential and commercial buildings.',
    'https://www.schueco.com',
    'https://logo.clearbit.com/schueco.com',
    NULL,
    NULL,
    true,
    'Germany',
    'Bielefeld, Germany',
    ARRAY['manufacturers', 'construction']::text[],
    ARRAY['Window systems', 'Facade systems', 'Doors']::text[],
    ARRAY['Germany', 'Spain', 'France', 'Poland', 'Italy', 'Ukraine']::text[],
    ARRAY['Germany', 'Spain', 'France', 'Poland', 'Italy', 'Ukraine']::text[],
    ARRAY['DE', 'EN', 'ES', 'FR']::text[],
    true,
    true,
    false,
    'verified',
    true,
    ARRAY['https://logo.clearbit.com/schueco.com']::text[]
  )
  ON CONFLICT (profile_id) DO UPDATE SET
    slug = EXCLUDED.slug,
    company_name = EXCLUDED.company_name,
    description = EXCLUDED.description,
    website = EXCLUDED.website,
    logo_url = EXCLUDED.logo_url,
    public_email = EXCLUDED.public_email,
    public_phone = EXCLUDED.public_phone,
    show_public_contacts = true,
    country = EXCLUDED.country,
    headquarters = EXCLUDED.headquarters,
    categories = EXCLUDED.categories,
    products = EXCLUDED.products,
    countries_available = EXCLUDED.countries_available,
    languages = EXCLUDED.languages,
    verification_status = 'verified',
    is_published = true,
    images = EXCLUDED.images,
    updated_at = now();

  -- Roca
  v_user := '05c73599-d4e2-4cd7-aec3-dd1f5577b8db'::uuid;
  v_email := 'directory+mfr-roca@users.dimarket.app';

  IF NOT EXISTS (SELECT 1 FROM auth.users WHERE id = v_user) THEN
    INSERT INTO auth.users (
      instance_id, id, aud, role, email, encrypted_password, email_confirmed_at,
      raw_app_meta_data, raw_user_meta_data, created_at, updated_at,
      confirmation_token, recovery_token, email_change_token_new, email_change
    ) VALUES (
      '00000000-0000-0000-0000-000000000000',
      v_user,
      'authenticated',
      'authenticated',
      v_email,
      crypt(encode(gen_random_bytes(16), 'hex'), gen_salt('bf')),
      now(),
      '{"provider":"email","providers":["email"]}'::jsonb,
      jsonb_build_object('full_name', 'Roca', 'commercial_manufacturer', true),
      now(), now(),
      '', '', '', ''
    );
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM auth.identities WHERE user_id = v_user AND provider = 'email'
  ) THEN
    INSERT INTO auth.identities (
      id, user_id, identity_data, provider, provider_id, last_sign_in_at, created_at, updated_at
    ) VALUES (
      v_user,
      v_user,
      jsonb_build_object('sub', v_user::text, 'email', v_email),
      'email',
      v_user::text,
      now(), now(), now()
    );
  END IF;

  INSERT INTO public.profiles AS p (
    id, full_name, bio, website, phone, location, user_role, is_professional,
    service_latitude, service_longitude, avatar_url, profile_photo, languages,
    availability_status, is_verified, verification_level
  ) VALUES (
    v_user,
    'Roca',
    'Bathroom ceramics and sanitary products for residential and commercial buildings.',
    'https://www.roca.com',
    NULL,
    'Barcelona, Spain',
    'company',
    true,
    41.3851,
    2.1734,
    'https://logo.clearbit.com/roca.com',
    'https://logo.clearbit.com/roca.com',
    ARRAY['ES', 'EN', 'FR']::text[],
    'available',
    true,
    'gold'
  )
  ON CONFLICT (id) DO UPDATE SET
    full_name = EXCLUDED.full_name,
    bio = EXCLUDED.bio,
    website = EXCLUDED.website,
    phone = COALESCE(EXCLUDED.phone, p.phone),
    location = EXCLUDED.location,
    user_role = 'company',
    is_professional = true,
    service_latitude = EXCLUDED.service_latitude,
    service_longitude = EXCLUDED.service_longitude,
    avatar_url = EXCLUDED.avatar_url,
    profile_photo = EXCLUDED.profile_photo,
    languages = EXCLUDED.languages,
    is_verified = true,
    verification_level = 'gold';

  INSERT INTO public.manufacturer_profiles AS mfr (
    profile_id, slug, company_name, description, website, logo_url,
    public_email, public_phone, show_public_contacts,
    country, headquarters, categories, products,
    target_markets, countries_available, languages,
    agent_required, non_exclusive_representation, exclusive_representation,
    verification_status, is_published, images
  ) VALUES (
    v_user,
    'roca',
    'Roca',
    'Bathroom ceramics and sanitary products for residential and commercial buildings.',
    'https://www.roca.com',
    'https://logo.clearbit.com/roca.com',
    NULL,
    NULL,
    true,
    'Spain',
    'Barcelona, Spain',
    ARRAY['manufacturers', 'construction']::text[],
    ARRAY['Bathroom ceramics', 'Sanitary ware', 'Bathroom furniture']::text[],
    ARRAY['Spain', 'France', 'Germany', 'Poland', 'Italy', 'Romania', 'Ukraine']::text[],
    ARRAY['Spain', 'France', 'Germany', 'Poland', 'Italy', 'Romania', 'Ukraine']::text[],
    ARRAY['ES', 'EN', 'FR']::text[],
    true,
    true,
    false,
    'verified',
    true,
    ARRAY['https://logo.clearbit.com/roca.com']::text[]
  )
  ON CONFLICT (profile_id) DO UPDATE SET
    slug = EXCLUDED.slug,
    company_name = EXCLUDED.company_name,
    description = EXCLUDED.description,
    website = EXCLUDED.website,
    logo_url = EXCLUDED.logo_url,
    public_email = EXCLUDED.public_email,
    public_phone = EXCLUDED.public_phone,
    show_public_contacts = true,
    country = EXCLUDED.country,
    headquarters = EXCLUDED.headquarters,
    categories = EXCLUDED.categories,
    products = EXCLUDED.products,
    countries_available = EXCLUDED.countries_available,
    languages = EXCLUDED.languages,
    verification_status = 'verified',
    is_published = true,
    images = EXCLUDED.images,
    updated_at = now();

  -- PORCELANOSA
  v_user := '3d3f1152-6c0d-4b7a-ac43-3bb7f70a3098'::uuid;
  v_email := 'directory+mfr-porcelanosa@users.dimarket.app';

  IF NOT EXISTS (SELECT 1 FROM auth.users WHERE id = v_user) THEN
    INSERT INTO auth.users (
      instance_id, id, aud, role, email, encrypted_password, email_confirmed_at,
      raw_app_meta_data, raw_user_meta_data, created_at, updated_at,
      confirmation_token, recovery_token, email_change_token_new, email_change
    ) VALUES (
      '00000000-0000-0000-0000-000000000000',
      v_user,
      'authenticated',
      'authenticated',
      v_email,
      crypt(encode(gen_random_bytes(16), 'hex'), gen_salt('bf')),
      now(),
      '{"provider":"email","providers":["email"]}'::jsonb,
      jsonb_build_object('full_name', 'PORCELANOSA', 'commercial_manufacturer', true),
      now(), now(),
      '', '', '', ''
    );
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM auth.identities WHERE user_id = v_user AND provider = 'email'
  ) THEN
    INSERT INTO auth.identities (
      id, user_id, identity_data, provider, provider_id, last_sign_in_at, created_at, updated_at
    ) VALUES (
      v_user,
      v_user,
      jsonb_build_object('sub', v_user::text, 'email', v_email),
      'email',
      v_user::text,
      now(), now(), now()
    );
  END IF;

  INSERT INTO public.profiles AS p (
    id, full_name, bio, website, phone, location, user_role, is_professional,
    service_latitude, service_longitude, avatar_url, profile_photo, languages,
    availability_status, is_verified, verification_level
  ) VALUES (
    v_user,
    'PORCELANOSA',
    'Ceramic tiles and interior surfaces for residential and commercial buildings.',
    'https://www.porcelanosa.com',
    NULL,
    'Vila-real, Spain',
    'company',
    true,
    39.9378,
    -0.1014,
    'https://logo.clearbit.com/porcelanosa.com',
    'https://logo.clearbit.com/porcelanosa.com',
    ARRAY['ES', 'EN', 'FR']::text[],
    'available',
    true,
    'gold'
  )
  ON CONFLICT (id) DO UPDATE SET
    full_name = EXCLUDED.full_name,
    bio = EXCLUDED.bio,
    website = EXCLUDED.website,
    phone = COALESCE(EXCLUDED.phone, p.phone),
    location = EXCLUDED.location,
    user_role = 'company',
    is_professional = true,
    service_latitude = EXCLUDED.service_latitude,
    service_longitude = EXCLUDED.service_longitude,
    avatar_url = EXCLUDED.avatar_url,
    profile_photo = EXCLUDED.profile_photo,
    languages = EXCLUDED.languages,
    is_verified = true,
    verification_level = 'gold';

  INSERT INTO public.manufacturer_profiles AS mfr (
    profile_id, slug, company_name, description, website, logo_url,
    public_email, public_phone, show_public_contacts,
    country, headquarters, categories, products,
    target_markets, countries_available, languages,
    agent_required, non_exclusive_representation, exclusive_representation,
    verification_status, is_published, images
  ) VALUES (
    v_user,
    'porcelanosa',
    'PORCELANOSA',
    'Ceramic tiles and interior surfaces for residential and commercial buildings.',
    'https://www.porcelanosa.com',
    'https://logo.clearbit.com/porcelanosa.com',
    NULL,
    NULL,
    true,
    'Spain',
    'Vila-real, Spain',
    ARRAY['manufacturers', 'construction']::text[],
    ARRAY['Ceramic tiles', 'Bathroom surfaces', 'Kitchen surfaces']::text[],
    ARRAY['Spain', 'France', 'Germany', 'Italy', 'Poland', 'Ukraine']::text[],
    ARRAY['Spain', 'France', 'Germany', 'Italy', 'Poland', 'Ukraine']::text[],
    ARRAY['ES', 'EN', 'FR']::text[],
    true,
    true,
    false,
    'verified',
    true,
    ARRAY['https://logo.clearbit.com/porcelanosa.com']::text[]
  )
  ON CONFLICT (profile_id) DO UPDATE SET
    slug = EXCLUDED.slug,
    company_name = EXCLUDED.company_name,
    description = EXCLUDED.description,
    website = EXCLUDED.website,
    logo_url = EXCLUDED.logo_url,
    public_email = EXCLUDED.public_email,
    public_phone = EXCLUDED.public_phone,
    show_public_contacts = true,
    country = EXCLUDED.country,
    headquarters = EXCLUDED.headquarters,
    categories = EXCLUDED.categories,
    products = EXCLUDED.products,
    countries_available = EXCLUDED.countries_available,
    languages = EXCLUDED.languages,
    verification_status = 'verified',
    is_published = true,
    images = EXCLUDED.images,
    updated_at = now();

  -- CORTIZO
  v_user := '27a6706c-1efb-4bca-a9c6-667a60137a40'::uuid;
  v_email := 'directory+mfr-cortizo@users.dimarket.app';

  IF NOT EXISTS (SELECT 1 FROM auth.users WHERE id = v_user) THEN
    INSERT INTO auth.users (
      instance_id, id, aud, role, email, encrypted_password, email_confirmed_at,
      raw_app_meta_data, raw_user_meta_data, created_at, updated_at,
      confirmation_token, recovery_token, email_change_token_new, email_change
    ) VALUES (
      '00000000-0000-0000-0000-000000000000',
      v_user,
      'authenticated',
      'authenticated',
      v_email,
      crypt(encode(gen_random_bytes(16), 'hex'), gen_salt('bf')),
      now(),
      '{"provider":"email","providers":["email"]}'::jsonb,
      jsonb_build_object('full_name', 'CORTIZO', 'commercial_manufacturer', true),
      now(), now(),
      '', '', '', ''
    );
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM auth.identities WHERE user_id = v_user AND provider = 'email'
  ) THEN
    INSERT INTO auth.identities (
      id, user_id, identity_data, provider, provider_id, last_sign_in_at, created_at, updated_at
    ) VALUES (
      v_user,
      v_user,
      jsonb_build_object('sub', v_user::text, 'email', v_email),
      'email',
      v_user::text,
      now(), now(), now()
    );
  END IF;

  INSERT INTO public.profiles AS p (
    id, full_name, bio, website, phone, location, user_role, is_professional,
    service_latitude, service_longitude, avatar_url, profile_photo, languages,
    availability_status, is_verified, verification_level
  ) VALUES (
    v_user,
    'CORTIZO',
    'Aluminium window, door and facade systems for residential and commercial buildings.',
    'https://www.cortizo.com',
    NULL,
    'Padrón, Spain',
    'company',
    true,
    42.7386,
    -8.6604,
    'https://logo.clearbit.com/cortizo.com',
    'https://logo.clearbit.com/cortizo.com',
    ARRAY['ES', 'EN', 'PT']::text[],
    'available',
    true,
    'gold'
  )
  ON CONFLICT (id) DO UPDATE SET
    full_name = EXCLUDED.full_name,
    bio = EXCLUDED.bio,
    website = EXCLUDED.website,
    phone = COALESCE(EXCLUDED.phone, p.phone),
    location = EXCLUDED.location,
    user_role = 'company',
    is_professional = true,
    service_latitude = EXCLUDED.service_latitude,
    service_longitude = EXCLUDED.service_longitude,
    avatar_url = EXCLUDED.avatar_url,
    profile_photo = EXCLUDED.profile_photo,
    languages = EXCLUDED.languages,
    is_verified = true,
    verification_level = 'gold';

  INSERT INTO public.manufacturer_profiles AS mfr (
    profile_id, slug, company_name, description, website, logo_url,
    public_email, public_phone, show_public_contacts,
    country, headquarters, categories, products,
    target_markets, countries_available, languages,
    agent_required, non_exclusive_representation, exclusive_representation,
    verification_status, is_published, images
  ) VALUES (
    v_user,
    'cortizo',
    'CORTIZO',
    'Aluminium window, door and facade systems for residential and commercial buildings.',
    'https://www.cortizo.com',
    'https://logo.clearbit.com/cortizo.com',
    NULL,
    NULL,
    true,
    'Spain',
    'Padrón, Spain',
    ARRAY['manufacturers', 'construction']::text[],
    ARRAY['Aluminium windows', 'Facade systems', 'Doors']::text[],
    ARRAY['Spain', 'France', 'Portugal', 'Germany', 'Poland', 'Italy']::text[],
    ARRAY['Spain', 'France', 'Portugal', 'Germany', 'Poland', 'Italy']::text[],
    ARRAY['ES', 'EN', 'PT']::text[],
    true,
    true,
    false,
    'verified',
    true,
    ARRAY['https://logo.clearbit.com/cortizo.com']::text[]
  )
  ON CONFLICT (profile_id) DO UPDATE SET
    slug = EXCLUDED.slug,
    company_name = EXCLUDED.company_name,
    description = EXCLUDED.description,
    website = EXCLUDED.website,
    logo_url = EXCLUDED.logo_url,
    public_email = EXCLUDED.public_email,
    public_phone = EXCLUDED.public_phone,
    show_public_contacts = true,
    country = EXCLUDED.country,
    headquarters = EXCLUDED.headquarters,
    categories = EXCLUDED.categories,
    products = EXCLUDED.products,
    countries_available = EXCLUDED.countries_available,
    languages = EXCLUDED.languages,
    verification_status = 'verified',
    is_published = true,
    images = EXCLUDED.images,
    updated_at = now();

  -- FAKRO
  v_user := '6be19e19-bd9e-4a9b-a6c4-dd3fd4a00e64'::uuid;
  v_email := 'directory+mfr-fakro@users.dimarket.app';

  IF NOT EXISTS (SELECT 1 FROM auth.users WHERE id = v_user) THEN
    INSERT INTO auth.users (
      instance_id, id, aud, role, email, encrypted_password, email_confirmed_at,
      raw_app_meta_data, raw_user_meta_data, created_at, updated_at,
      confirmation_token, recovery_token, email_change_token_new, email_change
    ) VALUES (
      '00000000-0000-0000-0000-000000000000',
      v_user,
      'authenticated',
      'authenticated',
      v_email,
      crypt(encode(gen_random_bytes(16), 'hex'), gen_salt('bf')),
      now(),
      '{"provider":"email","providers":["email"]}'::jsonb,
      jsonb_build_object('full_name', 'FAKRO', 'commercial_manufacturer', true),
      now(), now(),
      '', '', '', ''
    );
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM auth.identities WHERE user_id = v_user AND provider = 'email'
  ) THEN
    INSERT INTO auth.identities (
      id, user_id, identity_data, provider, provider_id, last_sign_in_at, created_at, updated_at
    ) VALUES (
      v_user,
      v_user,
      jsonb_build_object('sub', v_user::text, 'email', v_email),
      'email',
      v_user::text,
      now(), now(), now()
    );
  END IF;

  INSERT INTO public.profiles AS p (
    id, full_name, bio, website, phone, location, user_role, is_professional,
    service_latitude, service_longitude, avatar_url, profile_photo, languages,
    availability_status, is_verified, verification_level
  ) VALUES (
    v_user,
    'FAKRO',
    'Roof windows, loft ladders and daylight systems for residential buildings.',
    'https://www.fakro.com',
    NULL,
    'Nowy Sącz, Poland',
    'company',
    true,
    49.6218,
    20.6971,
    'https://logo.clearbit.com/fakro.com',
    'https://logo.clearbit.com/fakro.com',
    ARRAY['PL', 'EN', 'DE']::text[],
    'available',
    true,
    'gold'
  )
  ON CONFLICT (id) DO UPDATE SET
    full_name = EXCLUDED.full_name,
    bio = EXCLUDED.bio,
    website = EXCLUDED.website,
    phone = COALESCE(EXCLUDED.phone, p.phone),
    location = EXCLUDED.location,
    user_role = 'company',
    is_professional = true,
    service_latitude = EXCLUDED.service_latitude,
    service_longitude = EXCLUDED.service_longitude,
    avatar_url = EXCLUDED.avatar_url,
    profile_photo = EXCLUDED.profile_photo,
    languages = EXCLUDED.languages,
    is_verified = true,
    verification_level = 'gold';

  INSERT INTO public.manufacturer_profiles AS mfr (
    profile_id, slug, company_name, description, website, logo_url,
    public_email, public_phone, show_public_contacts,
    country, headquarters, categories, products,
    target_markets, countries_available, languages,
    agent_required, non_exclusive_representation, exclusive_representation,
    verification_status, is_published, images
  ) VALUES (
    v_user,
    'fakro',
    'FAKRO',
    'Roof windows, loft ladders and daylight systems for residential buildings.',
    'https://www.fakro.com',
    'https://logo.clearbit.com/fakro.com',
    NULL,
    NULL,
    true,
    'Poland',
    'Nowy Sącz, Poland',
    ARRAY['manufacturers', 'construction']::text[],
    ARRAY['Roof windows', 'Loft ladders', 'Daylight systems']::text[],
    ARRAY['Poland', 'Germany', 'Spain', 'France', 'Italy', 'Ukraine', 'Romania', 'Slovakia']::text[],
    ARRAY['Poland', 'Germany', 'Spain', 'France', 'Italy', 'Ukraine', 'Romania', 'Slovakia']::text[],
    ARRAY['PL', 'EN', 'DE']::text[],
    true,
    true,
    false,
    'verified',
    true,
    ARRAY['https://logo.clearbit.com/fakro.com']::text[]
  )
  ON CONFLICT (profile_id) DO UPDATE SET
    slug = EXCLUDED.slug,
    company_name = EXCLUDED.company_name,
    description = EXCLUDED.description,
    website = EXCLUDED.website,
    logo_url = EXCLUDED.logo_url,
    public_email = EXCLUDED.public_email,
    public_phone = EXCLUDED.public_phone,
    show_public_contacts = true,
    country = EXCLUDED.country,
    headquarters = EXCLUDED.headquarters,
    categories = EXCLUDED.categories,
    products = EXCLUDED.products,
    countries_available = EXCLUDED.countries_available,
    languages = EXCLUDED.languages,
    verification_status = 'verified',
    is_published = true,
    images = EXCLUDED.images,
    updated_at = now();

  -- MAPEI
  v_user := '31bd211f-4417-443b-aed6-eab83e952fd8'::uuid;
  v_email := 'directory+mfr-mapei@users.dimarket.app';

  IF NOT EXISTS (SELECT 1 FROM auth.users WHERE id = v_user) THEN
    INSERT INTO auth.users (
      instance_id, id, aud, role, email, encrypted_password, email_confirmed_at,
      raw_app_meta_data, raw_user_meta_data, created_at, updated_at,
      confirmation_token, recovery_token, email_change_token_new, email_change
    ) VALUES (
      '00000000-0000-0000-0000-000000000000',
      v_user,
      'authenticated',
      'authenticated',
      v_email,
      crypt(encode(gen_random_bytes(16), 'hex'), gen_salt('bf')),
      now(),
      '{"provider":"email","providers":["email"]}'::jsonb,
      jsonb_build_object('full_name', 'MAPEI', 'commercial_manufacturer', true),
      now(), now(),
      '', '', '', ''
    );
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM auth.identities WHERE user_id = v_user AND provider = 'email'
  ) THEN
    INSERT INTO auth.identities (
      id, user_id, identity_data, provider, provider_id, last_sign_in_at, created_at, updated_at
    ) VALUES (
      v_user,
      v_user,
      jsonb_build_object('sub', v_user::text, 'email', v_email),
      'email',
      v_user::text,
      now(), now(), now()
    );
  END IF;

  INSERT INTO public.profiles AS p (
    id, full_name, bio, website, phone, location, user_role, is_professional,
    service_latitude, service_longitude, avatar_url, profile_photo, languages,
    availability_status, is_verified, verification_level
  ) VALUES (
    v_user,
    'MAPEI',
    'Adhesives, sealants and chemical products for tiling, flooring and construction.',
    'https://www.mapei.com',
    NULL,
    'Milan, Italy',
    'company',
    true,
    45.4642,
    9.19,
    'https://logo.clearbit.com/mapei.com',
    'https://logo.clearbit.com/mapei.com',
    ARRAY['IT', 'EN', 'ES', 'DE']::text[],
    'available',
    true,
    'gold'
  )
  ON CONFLICT (id) DO UPDATE SET
    full_name = EXCLUDED.full_name,
    bio = EXCLUDED.bio,
    website = EXCLUDED.website,
    phone = COALESCE(EXCLUDED.phone, p.phone),
    location = EXCLUDED.location,
    user_role = 'company',
    is_professional = true,
    service_latitude = EXCLUDED.service_latitude,
    service_longitude = EXCLUDED.service_longitude,
    avatar_url = EXCLUDED.avatar_url,
    profile_photo = EXCLUDED.profile_photo,
    languages = EXCLUDED.languages,
    is_verified = true,
    verification_level = 'gold';

  INSERT INTO public.manufacturer_profiles AS mfr (
    profile_id, slug, company_name, description, website, logo_url,
    public_email, public_phone, show_public_contacts,
    country, headquarters, categories, products,
    target_markets, countries_available, languages,
    agent_required, non_exclusive_representation, exclusive_representation,
    verification_status, is_published, images
  ) VALUES (
    v_user,
    'mapei',
    'MAPEI',
    'Adhesives, sealants and chemical products for tiling, flooring and construction.',
    'https://www.mapei.com',
    'https://logo.clearbit.com/mapei.com',
    NULL,
    NULL,
    true,
    'Italy',
    'Milan, Italy',
    ARRAY['manufacturers', 'construction']::text[],
    ARRAY['Tile adhesives', 'Sealants', 'Flooring compounds']::text[],
    ARRAY['Italy', 'Spain', 'Germany', 'France', 'Poland', 'Romania', 'Ukraine']::text[],
    ARRAY['Italy', 'Spain', 'Germany', 'France', 'Poland', 'Romania', 'Ukraine']::text[],
    ARRAY['IT', 'EN', 'ES', 'DE']::text[],
    true,
    true,
    false,
    'verified',
    true,
    ARRAY['https://logo.clearbit.com/mapei.com']::text[]
  )
  ON CONFLICT (profile_id) DO UPDATE SET
    slug = EXCLUDED.slug,
    company_name = EXCLUDED.company_name,
    description = EXCLUDED.description,
    website = EXCLUDED.website,
    logo_url = EXCLUDED.logo_url,
    public_email = EXCLUDED.public_email,
    public_phone = EXCLUDED.public_phone,
    show_public_contacts = true,
    country = EXCLUDED.country,
    headquarters = EXCLUDED.headquarters,
    categories = EXCLUDED.categories,
    products = EXCLUDED.products,
    countries_available = EXCLUDED.countries_available,
    languages = EXCLUDED.languages,
    verification_status = 'verified',
    is_published = true,
    images = EXCLUDED.images,
    updated_at = now();

  -- Vaillant
  v_user := 'e1d0e6d4-1fc1-4fa1-a8c2-b0c61925dd52'::uuid;
  v_email := 'directory+mfr-vaillant@users.dimarket.app';

  IF NOT EXISTS (SELECT 1 FROM auth.users WHERE id = v_user) THEN
    INSERT INTO auth.users (
      instance_id, id, aud, role, email, encrypted_password, email_confirmed_at,
      raw_app_meta_data, raw_user_meta_data, created_at, updated_at,
      confirmation_token, recovery_token, email_change_token_new, email_change
    ) VALUES (
      '00000000-0000-0000-0000-000000000000',
      v_user,
      'authenticated',
      'authenticated',
      v_email,
      crypt(encode(gen_random_bytes(16), 'hex'), gen_salt('bf')),
      now(),
      '{"provider":"email","providers":["email"]}'::jsonb,
      jsonb_build_object('full_name', 'Vaillant', 'commercial_manufacturer', true),
      now(), now(),
      '', '', '', ''
    );
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM auth.identities WHERE user_id = v_user AND provider = 'email'
  ) THEN
    INSERT INTO auth.identities (
      id, user_id, identity_data, provider, provider_id, last_sign_in_at, created_at, updated_at
    ) VALUES (
      v_user,
      v_user,
      jsonb_build_object('sub', v_user::text, 'email', v_email),
      'email',
      v_user::text,
      now(), now(), now()
    );
  END IF;

  INSERT INTO public.profiles AS p (
    id, full_name, bio, website, phone, location, user_role, is_professional,
    service_latitude, service_longitude, avatar_url, profile_photo, languages,
    availability_status, is_verified, verification_level
  ) VALUES (
    v_user,
    'Vaillant',
    'Heat pumps, boilers and heating systems for residential and commercial buildings.',
    'https://www.vaillant.com',
    NULL,
    'Remscheid, Germany',
    'company',
    true,
    51.1788,
    7.1897,
    'https://logo.clearbit.com/vaillant.com',
    'https://logo.clearbit.com/vaillant.com',
    ARRAY['DE', 'EN', 'FR', 'ES']::text[],
    'available',
    true,
    'gold'
  )
  ON CONFLICT (id) DO UPDATE SET
    full_name = EXCLUDED.full_name,
    bio = EXCLUDED.bio,
    website = EXCLUDED.website,
    phone = COALESCE(EXCLUDED.phone, p.phone),
    location = EXCLUDED.location,
    user_role = 'company',
    is_professional = true,
    service_latitude = EXCLUDED.service_latitude,
    service_longitude = EXCLUDED.service_longitude,
    avatar_url = EXCLUDED.avatar_url,
    profile_photo = EXCLUDED.profile_photo,
    languages = EXCLUDED.languages,
    is_verified = true,
    verification_level = 'gold';

  INSERT INTO public.manufacturer_profiles AS mfr (
    profile_id, slug, company_name, description, website, logo_url,
    public_email, public_phone, show_public_contacts,
    country, headquarters, categories, products,
    target_markets, countries_available, languages,
    agent_required, non_exclusive_representation, exclusive_representation,
    verification_status, is_published, images
  ) VALUES (
    v_user,
    'vaillant',
    'Vaillant',
    'Heat pumps, boilers and heating systems for residential and commercial buildings.',
    'https://www.vaillant.com',
    'https://logo.clearbit.com/vaillant.com',
    NULL,
    NULL,
    true,
    'Germany',
    'Remscheid, Germany',
    ARRAY['manufacturers', 'construction']::text[],
    ARRAY['Heat pumps', 'Boilers', 'Heating systems']::text[],
    ARRAY['Germany', 'Spain', 'France', 'Poland', 'Italy', 'Ukraine', 'Slovakia']::text[],
    ARRAY['Germany', 'Spain', 'France', 'Poland', 'Italy', 'Ukraine', 'Slovakia']::text[],
    ARRAY['DE', 'EN', 'FR', 'ES']::text[],
    true,
    true,
    false,
    'verified',
    true,
    ARRAY['https://logo.clearbit.com/vaillant.com']::text[]
  )
  ON CONFLICT (profile_id) DO UPDATE SET
    slug = EXCLUDED.slug,
    company_name = EXCLUDED.company_name,
    description = EXCLUDED.description,
    website = EXCLUDED.website,
    logo_url = EXCLUDED.logo_url,
    public_email = EXCLUDED.public_email,
    public_phone = EXCLUDED.public_phone,
    show_public_contacts = true,
    country = EXCLUDED.country,
    headquarters = EXCLUDED.headquarters,
    categories = EXCLUDED.categories,
    products = EXCLUDED.products,
    countries_available = EXCLUDED.countries_available,
    languages = EXCLUDED.languages,
    verification_status = 'verified',
    is_published = true,
    images = EXCLUDED.images,
    updated_at = now();

  -- Daikin Europe
  v_user := '0d3cdc65-6349-452b-aa12-b32228ed9012'::uuid;
  v_email := 'directory+mfr-daikin-europe@users.dimarket.app';

  IF NOT EXISTS (SELECT 1 FROM auth.users WHERE id = v_user) THEN
    INSERT INTO auth.users (
      instance_id, id, aud, role, email, encrypted_password, email_confirmed_at,
      raw_app_meta_data, raw_user_meta_data, created_at, updated_at,
      confirmation_token, recovery_token, email_change_token_new, email_change
    ) VALUES (
      '00000000-0000-0000-0000-000000000000',
      v_user,
      'authenticated',
      'authenticated',
      v_email,
      crypt(encode(gen_random_bytes(16), 'hex'), gen_salt('bf')),
      now(),
      '{"provider":"email","providers":["email"]}'::jsonb,
      jsonb_build_object('full_name', 'Daikin Europe', 'commercial_manufacturer', true),
      now(), now(),
      '', '', '', ''
    );
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM auth.identities WHERE user_id = v_user AND provider = 'email'
  ) THEN
    INSERT INTO auth.identities (
      id, user_id, identity_data, provider, provider_id, last_sign_in_at, created_at, updated_at
    ) VALUES (
      v_user,
      v_user,
      jsonb_build_object('sub', v_user::text, 'email', v_email),
      'email',
      v_user::text,
      now(), now(), now()
    );
  END IF;

  INSERT INTO public.profiles AS p (
    id, full_name, bio, website, phone, location, user_role, is_professional,
    service_latitude, service_longitude, avatar_url, profile_photo, languages,
    availability_status, is_verified, verification_level
  ) VALUES (
    v_user,
    'Daikin Europe',
    'Air conditioning, heat pumps and ventilation systems for residential and commercial buildings.',
    'https://www.daikin.eu',
    NULL,
    'Ostend, Belgium',
    'company',
    true,
    51.2303,
    2.912,
    'https://logo.clearbit.com/daikin.eu',
    'https://logo.clearbit.com/daikin.eu',
    ARRAY['EN', 'FR', 'DE', 'ES', 'NL']::text[],
    'available',
    true,
    'gold'
  )
  ON CONFLICT (id) DO UPDATE SET
    full_name = EXCLUDED.full_name,
    bio = EXCLUDED.bio,
    website = EXCLUDED.website,
    phone = COALESCE(EXCLUDED.phone, p.phone),
    location = EXCLUDED.location,
    user_role = 'company',
    is_professional = true,
    service_latitude = EXCLUDED.service_latitude,
    service_longitude = EXCLUDED.service_longitude,
    avatar_url = EXCLUDED.avatar_url,
    profile_photo = EXCLUDED.profile_photo,
    languages = EXCLUDED.languages,
    is_verified = true,
    verification_level = 'gold';

  INSERT INTO public.manufacturer_profiles AS mfr (
    profile_id, slug, company_name, description, website, logo_url,
    public_email, public_phone, show_public_contacts,
    country, headquarters, categories, products,
    target_markets, countries_available, languages,
    agent_required, non_exclusive_representation, exclusive_representation,
    verification_status, is_published, images
  ) VALUES (
    v_user,
    'daikin-europe',
    'Daikin Europe',
    'Air conditioning, heat pumps and ventilation systems for residential and commercial buildings.',
    'https://www.daikin.eu',
    'https://logo.clearbit.com/daikin.eu',
    NULL,
    NULL,
    true,
    'Belgium',
    'Ostend, Belgium',
    ARRAY['manufacturers', 'construction']::text[],
    ARRAY['Air conditioning', 'Heat pumps', 'Ventilation']::text[],
    ARRAY['Belgium', 'Spain', 'Germany', 'France', 'Poland', 'Italy', 'Romania', 'Ukraine']::text[],
    ARRAY['Belgium', 'Spain', 'Germany', 'France', 'Poland', 'Italy', 'Romania', 'Ukraine']::text[],
    ARRAY['EN', 'FR', 'DE', 'ES', 'NL']::text[],
    true,
    true,
    false,
    'verified',
    true,
    ARRAY['https://logo.clearbit.com/daikin.eu']::text[]
  )
  ON CONFLICT (profile_id) DO UPDATE SET
    slug = EXCLUDED.slug,
    company_name = EXCLUDED.company_name,
    description = EXCLUDED.description,
    website = EXCLUDED.website,
    logo_url = EXCLUDED.logo_url,
    public_email = EXCLUDED.public_email,
    public_phone = EXCLUDED.public_phone,
    show_public_contacts = true,
    country = EXCLUDED.country,
    headquarters = EXCLUDED.headquarters,
    categories = EXCLUDED.categories,
    products = EXCLUDED.products,
    countries_available = EXCLUDED.countries_available,
    languages = EXCLUDED.languages,
    verification_status = 'verified',
    is_published = true,
    images = EXCLUDED.images,
    updated_at = now();

  -- Aluprof
  v_user := 'e479c307-f765-4f5b-ad16-8b26e86d4297'::uuid;
  v_email := 'directory+mfr-aluprof@users.dimarket.app';

  IF NOT EXISTS (SELECT 1 FROM auth.users WHERE id = v_user) THEN
    INSERT INTO auth.users (
      instance_id, id, aud, role, email, encrypted_password, email_confirmed_at,
      raw_app_meta_data, raw_user_meta_data, created_at, updated_at,
      confirmation_token, recovery_token, email_change_token_new, email_change
    ) VALUES (
      '00000000-0000-0000-0000-000000000000',
      v_user,
      'authenticated',
      'authenticated',
      v_email,
      crypt(encode(gen_random_bytes(16), 'hex'), gen_salt('bf')),
      now(),
      '{"provider":"email","providers":["email"]}'::jsonb,
      jsonb_build_object('full_name', 'Aluprof', 'commercial_manufacturer', true),
      now(), now(),
      '', '', '', ''
    );
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM auth.identities WHERE user_id = v_user AND provider = 'email'
  ) THEN
    INSERT INTO auth.identities (
      id, user_id, identity_data, provider, provider_id, last_sign_in_at, created_at, updated_at
    ) VALUES (
      v_user,
      v_user,
      jsonb_build_object('sub', v_user::text, 'email', v_email),
      'email',
      v_user::text,
      now(), now(), now()
    );
  END IF;

  INSERT INTO public.profiles AS p (
    id, full_name, bio, website, phone, location, user_role, is_professional,
    service_latitude, service_longitude, avatar_url, profile_photo, languages,
    availability_status, is_verified, verification_level
  ) VALUES (
    v_user,
    'Aluprof',
    'Aluminium window, door and facade systems for residential and commercial buildings.',
    'https://aluprof.com',
    NULL,
    'Bielsko-Biała, Poland',
    'company',
    true,
    49.8224,
    19.0469,
    'https://logo.clearbit.com/aluprof.com',
    'https://logo.clearbit.com/aluprof.com',
    ARRAY['PL', 'EN', 'DE']::text[],
    'available',
    true,
    'gold'
  )
  ON CONFLICT (id) DO UPDATE SET
    full_name = EXCLUDED.full_name,
    bio = EXCLUDED.bio,
    website = EXCLUDED.website,
    phone = COALESCE(EXCLUDED.phone, p.phone),
    location = EXCLUDED.location,
    user_role = 'company',
    is_professional = true,
    service_latitude = EXCLUDED.service_latitude,
    service_longitude = EXCLUDED.service_longitude,
    avatar_url = EXCLUDED.avatar_url,
    profile_photo = EXCLUDED.profile_photo,
    languages = EXCLUDED.languages,
    is_verified = true,
    verification_level = 'gold';

  INSERT INTO public.manufacturer_profiles AS mfr (
    profile_id, slug, company_name, description, website, logo_url,
    public_email, public_phone, show_public_contacts,
    country, headquarters, categories, products,
    target_markets, countries_available, languages,
    agent_required, non_exclusive_representation, exclusive_representation,
    verification_status, is_published, images
  ) VALUES (
    v_user,
    'aluprof',
    'Aluprof',
    'Aluminium window, door and facade systems for residential and commercial buildings.',
    'https://aluprof.com',
    'https://logo.clearbit.com/aluprof.com',
    NULL,
    NULL,
    true,
    'Poland',
    'Bielsko-Biała, Poland',
    ARRAY['manufacturers', 'construction']::text[],
    ARRAY['Aluminium windows', 'Facade systems', 'Doors']::text[],
    ARRAY['Poland', 'Germany', 'Spain', 'France', 'Italy', 'Ukraine', 'Slovakia', 'Romania']::text[],
    ARRAY['Poland', 'Germany', 'Spain', 'France', 'Italy', 'Ukraine', 'Slovakia', 'Romania']::text[],
    ARRAY['PL', 'EN', 'DE']::text[],
    true,
    true,
    false,
    'verified',
    true,
    ARRAY['https://logo.clearbit.com/aluprof.com']::text[]
  )
  ON CONFLICT (profile_id) DO UPDATE SET
    slug = EXCLUDED.slug,
    company_name = EXCLUDED.company_name,
    description = EXCLUDED.description,
    website = EXCLUDED.website,
    logo_url = EXCLUDED.logo_url,
    public_email = EXCLUDED.public_email,
    public_phone = EXCLUDED.public_phone,
    show_public_contacts = true,
    country = EXCLUDED.country,
    headquarters = EXCLUDED.headquarters,
    categories = EXCLUDED.categories,
    products = EXCLUDED.products,
    countries_available = EXCLUDED.countries_available,
    languages = EXCLUDED.languages,
    verification_status = 'verified',
    is_published = true,
    images = EXCLUDED.images,
    updated_at = now();

END $$;

NOTIFY pgrst, 'reload schema';

SELECT slug, company_name, website, country, logo_url IS NOT NULL AS has_logo
FROM public.manufacturer_profiles
WHERE is_published = true
ORDER BY company_name;
