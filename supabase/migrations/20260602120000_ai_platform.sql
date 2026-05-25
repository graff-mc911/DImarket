-- AI platform: conversations, bot outputs, ad image variants, profile trust scores

-- Legacy tables (keep compatible)
-- ai_bot_sessions / ai_bot_messages from 20260601120000

-- ---------------------------------------------------------------------------
-- Core conversations (replaces ai_bot_sessions for new bots)
-- ---------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS ai_conversations (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid REFERENCES auth.users(id) ON DELETE SET NULL,
  bot_id text NOT NULL,
  locale text NOT NULL DEFAULT 'uk',
  status text NOT NULL DEFAULT 'active' CHECK (status IN ('active', 'completed', 'abandoned')),
  context jsonb NOT NULL DEFAULT '{}'::jsonb,
  reference_type text,
  reference_id uuid,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS ai_messages (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  conversation_id uuid NOT NULL REFERENCES ai_conversations(id) ON DELETE CASCADE,
  role text NOT NULL CHECK (role IN ('user', 'assistant', 'system')),
  content text NOT NULL,
  meta jsonb NOT NULL DEFAULT '{}'::jsonb,
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS ai_bot_tasks (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid REFERENCES auth.users(id) ON DELETE SET NULL,
  bot_id text NOT NULL,
  action text NOT NULL,
  status text NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'running', 'completed', 'failed')),
  input jsonb NOT NULL DEFAULT '{}'::jsonb,
  output jsonb,
  error_message text,
  created_at timestamptz NOT NULL DEFAULT now(),
  completed_at timestamptz
);

-- ---------------------------------------------------------------------------
-- Bot-specific result tables
-- ---------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS ai_leads (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid REFERENCES auth.users(id) ON DELETE SET NULL,
  conversation_id uuid REFERENCES ai_conversations(id) ON DELETE SET NULL,
  listing_id uuid REFERENCES listings(id) ON DELETE SET NULL,
  draft jsonb NOT NULL DEFAULT '{}'::jsonb,
  lead_quality_score numeric(5,2) CHECK (lead_quality_score >= 0 AND lead_quality_score <= 100),
  is_serious boolean,
  missing_fields text[] DEFAULT '{}',
  notes text,
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS ai_matches (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid REFERENCES auth.users(id) ON DELETE SET NULL,
  listing_id uuid REFERENCES listings(id) ON DELETE SET NULL,
  criteria jsonb NOT NULL DEFAULT '{}'::jsonb,
  matches jsonb NOT NULL DEFAULT '[]'::jsonb,
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS ai_translations (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  source_type text NOT NULL,
  source_id text NOT NULL,
  field_name text NOT NULL DEFAULT 'body',
  source_lang text NOT NULL,
  target_lang text NOT NULL,
  original_text text NOT NULL,
  translated_text text,
  fallback_used boolean NOT NULL DEFAULT false,
  provider text,
  created_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (source_type, source_id, field_name, target_lang)
);

CREATE TABLE IF NOT EXISTS ai_fraud_reports (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  reporter_id uuid REFERENCES auth.users(id) ON DELETE SET NULL,
  target_type text NOT NULL,
  target_id text NOT NULL,
  risk_score numeric(5,2) NOT NULL DEFAULT 0,
  trust_score numeric(5,2),
  flags text[] NOT NULL DEFAULT '{}',
  details jsonb NOT NULL DEFAULT '{}'::jsonb,
  moderation_status text NOT NULL DEFAULT 'open' CHECK (moderation_status IN ('open', 'reviewed', 'dismissed', 'actioned')),
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS ai_quote_estimates (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid REFERENCES auth.users(id) ON DELETE SET NULL,
  category_slug text,
  city text,
  country text,
  quantity numeric,
  unit text,
  description text,
  min_price numeric,
  max_price numeric,
  currency text NOT NULL DEFAULT 'EUR',
  explanation text,
  confidence numeric(5,2),
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS ai_ocr_documents (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid REFERENCES auth.users(id) ON DELETE SET NULL,
  storage_path text NOT NULL,
  mime_type text,
  status text NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'processed', 'failed')),
  extracted jsonb NOT NULL DEFAULT '{}'::jsonb,
  error_message text,
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS ai_profile_suggestions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  profile_id uuid NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  profile_quality_score numeric(5,2),
  suggestions jsonb NOT NULL DEFAULT '[]'::jsonb,
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS ai_review_analysis (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  review_id text NOT NULL,
  source_type text NOT NULL DEFAULT 'profile_review',
  sentiment text,
  risk_score numeric(5,2) DEFAULT 0,
  moderation_flag boolean NOT NULL DEFAULT false,
  flags text[] NOT NULL DEFAULT '{}',
  details jsonb NOT NULL DEFAULT '{}'::jsonb,
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS ai_voice_transcripts (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid REFERENCES auth.users(id) ON DELETE SET NULL,
  conversation_id uuid REFERENCES ai_conversations(id) ON DELETE SET NULL,
  audio_path text,
  transcript text NOT NULL,
  locale text,
  purpose text NOT NULL DEFAULT 'job_request',
  created_at timestamptz NOT NULL DEFAULT now()
);

-- Messaging integration placeholders (no tokens required)
CREATE TABLE IF NOT EXISTS ai_messaging_channels (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  channel text NOT NULL CHECK (channel IN ('telegram', 'whatsapp')),
  external_chat_id text,
  user_id uuid REFERENCES auth.users(id) ON DELETE SET NULL,
  metadata jsonb NOT NULL DEFAULT '{}'::jsonb,
  is_active boolean NOT NULL DEFAULT false,
  created_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (channel, external_chat_id)
);

-- ---------------------------------------------------------------------------
-- Ad image adaptation
-- ---------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS ad_image_assets (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  campaign_id uuid REFERENCES ad_campaigns(id) ON DELETE SET NULL,
  original_path text NOT NULL,
  original_url text NOT NULL,
  mime_type text NOT NULL,
  file_size_bytes bigint,
  status text NOT NULL DEFAULT 'original_uploaded' CHECK (
    status IN ('original_uploaded', 'processing', 'ready', 'failed')
  ),
  error_message text,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS ad_image_variants (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  asset_id uuid NOT NULL REFERENCES ad_image_assets(id) ON DELETE CASCADE,
  variant_key text NOT NULL CHECK (
    variant_key IN ('desktop_wide', 'sidebar', 'mobile_square', 'card')
  ),
  width int NOT NULL,
  height int NOT NULL,
  storage_path text NOT NULL,
  public_url text NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (asset_id, variant_key)
);

-- Profile trust (fraud bot updates)
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS trust_score numeric(5,2) DEFAULT 50;
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS risk_score numeric(5,2) DEFAULT 0;

-- Indexes
CREATE INDEX IF NOT EXISTS idx_ai_conversations_user ON ai_conversations(user_id, bot_id);
CREATE INDEX IF NOT EXISTS idx_ai_messages_conv ON ai_messages(conversation_id, created_at);
CREATE INDEX IF NOT EXISTS idx_ai_bot_tasks_user ON ai_bot_tasks(user_id, bot_id, status);
CREATE INDEX IF NOT EXISTS idx_ai_translations_lookup ON ai_translations(source_type, source_id, target_lang);
CREATE INDEX IF NOT EXISTS idx_ai_fraud_reports_status ON ai_fraud_reports(moderation_status, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_ad_image_assets_user ON ad_image_assets(user_id, status);

-- updated_at trigger
CREATE OR REPLACE FUNCTION ai_set_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS ai_conversations_updated ON ai_conversations;
CREATE TRIGGER ai_conversations_updated
  BEFORE UPDATE ON ai_conversations
  FOR EACH ROW EXECUTE FUNCTION ai_set_updated_at();

DROP TRIGGER IF EXISTS ad_image_assets_updated ON ad_image_assets;
CREATE TRIGGER ad_image_assets_updated
  BEFORE UPDATE ON ad_image_assets
  FOR EACH ROW EXECUTE FUNCTION ai_set_updated_at();

-- ---------------------------------------------------------------------------
-- RLS
-- ---------------------------------------------------------------------------
ALTER TABLE ai_conversations ENABLE ROW LEVEL SECURITY;
ALTER TABLE ai_messages ENABLE ROW LEVEL SECURITY;
ALTER TABLE ai_bot_tasks ENABLE ROW LEVEL SECURITY;
ALTER TABLE ai_leads ENABLE ROW LEVEL SECURITY;
ALTER TABLE ai_matches ENABLE ROW LEVEL SECURITY;
ALTER TABLE ai_translations ENABLE ROW LEVEL SECURITY;
ALTER TABLE ai_fraud_reports ENABLE ROW LEVEL SECURITY;
ALTER TABLE ai_quote_estimates ENABLE ROW LEVEL SECURITY;
ALTER TABLE ai_ocr_documents ENABLE ROW LEVEL SECURITY;
ALTER TABLE ai_profile_suggestions ENABLE ROW LEVEL SECURITY;
ALTER TABLE ai_review_analysis ENABLE ROW LEVEL SECURITY;
ALTER TABLE ai_voice_transcripts ENABLE ROW LEVEL SECURITY;
ALTER TABLE ai_messaging_channels ENABLE ROW LEVEL SECURITY;
ALTER TABLE ad_image_assets ENABLE ROW LEVEL SECURITY;
ALTER TABLE ad_image_variants ENABLE ROW LEVEL SECURITY;

-- Helper: site owner / admin
CREATE OR REPLACE FUNCTION public.is_ai_admin()
RETURNS boolean AS $$
  SELECT EXISTS (
    SELECT 1 FROM profiles
    WHERE id = auth.uid()
      AND (is_site_owner = true OR user_role = 'owner')
  );
$$ LANGUAGE sql SECURITY DEFINER STABLE SET search_path = public;

-- Conversations: own data
CREATE POLICY ai_conversations_own ON ai_conversations FOR ALL
  USING (user_id = auth.uid())
  WITH CHECK (user_id = auth.uid());

CREATE POLICY ai_messages_own ON ai_messages FOR ALL
  USING (
    EXISTS (SELECT 1 FROM ai_conversations c WHERE c.id = conversation_id AND c.user_id = auth.uid())
  )
  WITH CHECK (
    EXISTS (SELECT 1 FROM ai_conversations c WHERE c.id = conversation_id AND c.user_id = auth.uid())
  );

CREATE POLICY ai_bot_tasks_own ON ai_bot_tasks FOR ALL
  USING (user_id = auth.uid())
  WITH CHECK (user_id = auth.uid());

CREATE POLICY ai_leads_own ON ai_leads FOR ALL
  USING (user_id = auth.uid())
  WITH CHECK (user_id = auth.uid());

CREATE POLICY ai_matches_own ON ai_matches FOR ALL
  USING (user_id = auth.uid())
  WITH CHECK (user_id = auth.uid());

CREATE POLICY ai_quote_own ON ai_quote_estimates FOR ALL
  USING (user_id = auth.uid())
  WITH CHECK (user_id = auth.uid());

CREATE POLICY ai_ocr_own ON ai_ocr_documents FOR ALL
  USING (user_id = auth.uid())
  WITH CHECK (user_id = auth.uid());

CREATE POLICY ai_voice_own ON ai_voice_transcripts FOR ALL
  USING (user_id = auth.uid())
  WITH CHECK (user_id = auth.uid());

CREATE POLICY ai_channels_own ON ai_messaging_channels FOR ALL
  USING (user_id = auth.uid())
  WITH CHECK (user_id = auth.uid());

-- Translations: readable by authenticated (for UI), insert own
CREATE POLICY ai_translations_read ON ai_translations FOR SELECT
  TO authenticated
  USING (true);

CREATE POLICY ai_translations_insert ON ai_translations FOR INSERT
  TO authenticated
  WITH CHECK (true);

-- Profile suggestions: profile owner
CREATE POLICY ai_profile_suggestions_own ON ai_profile_suggestions FOR ALL
  USING (profile_id = auth.uid())
  WITH CHECK (profile_id = auth.uid());

-- Ad images: advertiser owns
CREATE POLICY ad_image_assets_own ON ad_image_assets FOR ALL
  USING (user_id = auth.uid())
  WITH CHECK (user_id = auth.uid());

CREATE POLICY ad_image_variants_own ON ad_image_variants FOR ALL
  USING (
    EXISTS (SELECT 1 FROM ad_image_assets a WHERE a.id = asset_id AND a.user_id = auth.uid())
  )
  WITH CHECK (
    EXISTS (SELECT 1 FROM ad_image_assets a WHERE a.id = asset_id AND a.user_id = auth.uid())
  );

-- Fraud + review analysis: admin read, users can insert reports on own submissions
CREATE POLICY ai_fraud_admin_read ON ai_fraud_reports FOR SELECT
  USING (public.is_ai_admin() OR reporter_id = auth.uid());

CREATE POLICY ai_fraud_insert ON ai_fraud_reports FOR INSERT
  WITH CHECK (reporter_id = auth.uid() OR reporter_id IS NULL);

CREATE POLICY ai_fraud_admin_update ON ai_fraud_reports FOR UPDATE
  USING (public.is_ai_admin());

CREATE POLICY ai_review_admin_read ON ai_review_analysis FOR SELECT
  USING (public.is_ai_admin());

CREATE POLICY ai_review_insert ON ai_review_analysis FOR INSERT
  TO authenticated
  WITH CHECK (true);

-- Migrate legacy bot sessions into ai_conversations (one-time compatible view optional)
COMMENT ON TABLE ai_conversations IS 'Unified AI bot conversations (sales, lead, voice, etc.)';
