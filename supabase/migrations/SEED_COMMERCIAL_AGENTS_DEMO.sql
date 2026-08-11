-- ============================================================
-- Commercial Agents — demo seed (run AFTER schema migration)
-- Uses the site owner profile so no Auth Admin API is needed.
-- Safe to re-run (upsert by profile_id / title).
-- ============================================================

DO $$
DECLARE
  owner_id uuid;
  mfr_id uuid;
  agent_row_id uuid;
  opp_exists boolean;
BEGIN
  SELECT id INTO owner_id
  FROM public.profiles
  WHERE is_site_owner = true
     OR user_role = 'owner'
     OR lower(coalesce(full_name, '')) LIKE '%sovban%'
  ORDER BY
    CASE WHEN is_site_owner = true THEN 0 ELSE 1 END,
    created_at ASC NULLS LAST
  LIMIT 1;

  IF owner_id IS NULL THEN
    RAISE EXCEPTION 'No owner profile found in public.profiles — log in once on dimarket.app first';
  END IF;

  INSERT INTO public.manufacturer_profiles AS m (
    profile_id,
    slug,
    company_name,
    description,
    website,
    country,
    headquarters,
    categories,
    products,
    target_markets,
    countries_available,
    languages,
    minimum_experience_years,
    exclusive_representation,
    non_exclusive_representation,
    agent_required,
    verification_status,
    is_published,
    show_public_contacts
  ) VALUES (
    owner_id,
    'demo-iberia-hvac-systems',
    'Iberia HVAC Systems (Demo)',
    'Demo manufacturer seeking commercial agents across Spain and Portugal for HVAC and climate systems.',
    'https://dimarket.app/commercial-agents',
    'Spain',
    'Madrid',
    ARRAY['hvac', 'construction'],
    ARRAY['Heat pumps', 'VRV systems'],
    ARRAY['Spain', 'Portugal'],
    ARRAY['Spain', 'Portugal'],
    ARRAY['ES', 'EN', 'PT'],
    3,
    false,
    true,
    true,
    'verified',
    true,
    false
  )
  ON CONFLICT (profile_id) DO UPDATE SET
    slug = EXCLUDED.slug,
    company_name = EXCLUDED.company_name,
    description = EXCLUDED.description,
    country = EXCLUDED.country,
    categories = EXCLUDED.categories,
    verification_status = 'verified',
    is_published = true,
    updated_at = now()
  RETURNING id INTO mfr_id;

  SELECT id INTO mfr_id FROM public.manufacturer_profiles WHERE profile_id = owner_id;

  INSERT INTO public.agent_profiles AS a (
    profile_id,
    slug,
    full_name,
    company_name,
    description,
    country,
    city,
    service_regions,
    languages,
    categories,
    years_experience,
    available_for_new_brands,
    verification_status,
    is_published,
    show_public_contacts
  ) VALUES (
    owner_id,
    'demo-sofia-commercial-agent',
    'Sofía Mendes (Demo)',
    'Mendes Representation',
    'Demo independent commercial agent covering Iberia — HVAC, construction materials, and store fit-out.',
    'Spain',
    'Barcelona',
    ARRAY['Spain', 'Portugal'],
    ARRAY['ES', 'EN', 'PT'],
    ARRAY['hvac', 'stores', 'construction'],
    8,
    true,
    'verified',
    true,
    false
  )
  ON CONFLICT (profile_id) DO UPDATE SET
    slug = EXCLUDED.slug,
    full_name = EXCLUDED.full_name,
    description = EXCLUDED.description,
    country = EXCLUDED.country,
    categories = EXCLUDED.categories,
    verification_status = 'verified',
    is_published = true,
    available_for_new_brands = true,
    updated_at = now()
  RETURNING id INTO agent_row_id;

  SELECT id INTO agent_row_id FROM public.agent_profiles WHERE profile_id = owner_id;

  SELECT EXISTS (
    SELECT 1
    FROM public.representation_opportunities
    WHERE manufacturer_id = mfr_id
      AND title = 'HVAC commercial agent — Spain & Portugal (Demo)'
  ) INTO opp_exists;

  IF NOT opp_exists THEN
    INSERT INTO public.representation_opportunities (
      manufacturer_id,
      title,
      description,
      category,
      products,
      target_country,
      target_regions,
      required_languages,
      commission_range,
      exclusive,
      remote_possible,
      travel_required,
      status
    ) VALUES (
      mfr_id,
      'HVAC commercial agent — Spain & Portugal (Demo)',
      'Looking for an experienced commercial agent to open dealer channels for heat pumps and VRV. Demo opportunity for DImarket Commercial Agents.',
      'hvac',
      ARRAY['Heat pumps', 'VRV'],
      'Spain',
      ARRAY['Catalonia', 'Madrid', 'Lisbon'],
      ARRAY['ES', 'EN'],
      '8–12%',
      false,
      true,
      true,
      'published'
    );
  END IF;

  RAISE NOTICE 'CA demo seed OK — manufacturer %, agent %, owner %', mfr_id, agent_row_id, owner_id;
END $$;

NOTIFY pgrst, 'reload schema';

-- Quick check
SELECT 'manufacturers' AS kind, count(*)::int AS n FROM public.manufacturer_profiles WHERE is_published
UNION ALL
SELECT 'agents', count(*)::int FROM public.agent_profiles WHERE is_published
UNION ALL
SELECT 'opportunities', count(*)::int FROM public.representation_opportunities WHERE status = 'published';
