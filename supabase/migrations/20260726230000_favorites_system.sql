-- Favorites system: professionals, companies, projects, categories, searches

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema = 'public' AND table_name = 'saved_items' AND column_name = 'meta'
  ) THEN
    ALTER TABLE saved_items ADD COLUMN meta jsonb NOT NULL DEFAULT '{}'::jsonb;
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema = 'public' AND table_name = 'saved_items' AND column_name = 'title'
  ) THEN
    ALTER TABLE saved_items ADD COLUMN title text;
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema = 'public' AND table_name = 'saved_items' AND column_name = 'updated_at'
  ) THEN
    ALTER TABLE saved_items ADD COLUMN updated_at timestamptz NOT NULL DEFAULT now();
  END IF;
END $$;

-- Widen item_type constraint
ALTER TABLE saved_items DROP CONSTRAINT IF EXISTS saved_items_item_type_check;
ALTER TABLE saved_items
  ADD CONSTRAINT saved_items_item_type_check
  CHECK (item_type IN (
    'listing', 'profile', 'professional', 'company', 'project', 'category', 'search'
  ));

-- Allow non-uuid item ids for searches (use uuid still; meta holds payload)
-- Keep item_id as uuid; searches get a generated id

CREATE INDEX IF NOT EXISTS idx_saved_items_user_type_created
  ON saved_items (user_id, item_type, created_at DESC);

CREATE UNIQUE INDEX IF NOT EXISTS idx_saved_items_search_key
  ON saved_items (user_id, (meta->>'search_key'))
  WHERE item_type = 'search' AND meta ? 'search_key';

-- Backfill: profile → professional/company; listing service_request → project
UPDATE saved_items si
SET item_type = CASE
  WHEN p.user_role = 'company' THEN 'company'
  ELSE 'professional'
END,
updated_at = now()
FROM profiles p
WHERE si.item_type = 'profile'
  AND si.item_id = p.id;

UPDATE saved_items si
SET item_type = 'project',
    updated_at = now()
FROM listings l
WHERE si.item_type = 'listing'
  AND si.item_id = l.id
  AND l.listing_type = 'service_request';

ALTER TABLE saved_items ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Users manage own saved items" ON saved_items;
CREATE POLICY "Users manage own saved items"
  ON saved_items FOR ALL TO authenticated
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

-- Realtime for favorites sync across devices/tabs
DO $$
BEGIN
  BEGIN
    ALTER PUBLICATION supabase_realtime ADD TABLE saved_items;
  EXCEPTION WHEN duplicate_object THEN NULL;
  END;
END $$;
