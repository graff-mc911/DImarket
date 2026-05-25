-- Phase 1: AI job leads, realtime chat, verification, reviews 2.0, notifications, matching
-- Safe to re-run: uses IF NOT EXISTS / conditional alters

-- =============================================================================
-- 1. AI JOB CREATION (persisted sessions)
-- =============================================================================
CREATE TABLE IF NOT EXISTS ai_job_sessions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid REFERENCES auth.users(id) ON DELETE SET NULL,
  locale text NOT NULL DEFAULT 'uk',
  status text NOT NULL DEFAULT 'active' CHECK (status IN ('active', 'completed', 'abandoned', 'published')),
  draft jsonb NOT NULL DEFAULT '{}'::jsonb,
  extracted jsonb NOT NULL DEFAULT '{}'::jsonb,
  listing_id uuid REFERENCES listings(id) ON DELETE SET NULL,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS ai_job_messages (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  session_id uuid NOT NULL REFERENCES ai_job_sessions(id) ON DELETE CASCADE,
  role text NOT NULL CHECK (role IN ('user', 'assistant', 'system')),
  content text NOT NULL,
  meta jsonb NOT NULL DEFAULT '{}'::jsonb,
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS ai_generated_jobs (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  session_id uuid NOT NULL REFERENCES ai_job_sessions(id) ON DELETE CASCADE,
  user_id uuid REFERENCES auth.users(id) ON DELETE SET NULL,
  listing_id uuid REFERENCES listings(id) ON DELETE SET NULL,
  draft jsonb NOT NULL DEFAULT '{}'::jsonb,
  title text,
  description text,
  published_at timestamptz,
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_ai_job_sessions_user ON ai_job_sessions(user_id, updated_at DESC);
CREATE INDEX IF NOT EXISTS idx_ai_job_messages_session ON ai_job_messages(session_id, created_at);
CREATE INDEX IF NOT EXISTS idx_ai_generated_jobs_listing ON ai_generated_jobs(listing_id);

-- =============================================================================
-- 2. CONVERSATIONS + CHAT ATTACHMENTS
-- =============================================================================
CREATE TABLE IF NOT EXISTS conversations (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  listing_id uuid REFERENCES listings(id) ON DELETE SET NULL,
  participant_a uuid NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  participant_b uuid NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  last_message_preview text,
  last_message_at timestamptz,
  typing_user_id uuid REFERENCES profiles(id) ON DELETE SET NULL,
  typing_at timestamptz,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  CONSTRAINT conversations_distinct_participants CHECK (participant_a <> participant_b)
);

CREATE UNIQUE INDEX IF NOT EXISTS idx_conversations_pair_listing
  ON conversations (
    LEAST(participant_a, participant_b),
    GREATEST(participant_a, participant_b),
    COALESCE(listing_id, '00000000-0000-0000-0000-000000000000'::uuid)
  );

CREATE TABLE IF NOT EXISTS message_attachments (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  message_id uuid NOT NULL REFERENCES messages(id) ON DELETE CASCADE,
  storage_path text NOT NULL,
  public_url text NOT NULL,
  file_name text,
  mime_type text,
  file_size_bytes bigint,
  attachment_type text NOT NULL DEFAULT 'file' CHECK (attachment_type IN ('image', 'pdf', 'document', 'other')),
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_message_attachments_message ON message_attachments(message_id);

-- Extend messages for delivery tracking
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'messages' AND column_name = 'delivery_status'
  ) THEN
    ALTER TABLE messages ADD COLUMN delivery_status text NOT NULL DEFAULT 'sent'
      CHECK (delivery_status IN ('sent', 'delivered', 'read'));
  END IF;
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'messages' AND column_name = 'attachment_count'
  ) THEN
    ALTER TABLE messages ADD COLUMN attachment_count int NOT NULL DEFAULT 0;
  END IF;
END $$;

-- =============================================================================
-- 3. CONTRACTOR VERIFICATION
-- =============================================================================
CREATE TABLE IF NOT EXISTS contractor_verifications (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  profile_id uuid NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  status text NOT NULL DEFAULT 'unverified' CHECK (status IN ('unverified', 'pending', 'verified', 'rejected')),
  business_name text,
  vat_number text,
  trade_license_ref text,
  insurance_ref text,
  trust_score numeric(5,2) DEFAULT 0 CHECK (trust_score >= 0 AND trust_score <= 100),
  reviewer_id uuid REFERENCES profiles(id) ON DELETE SET NULL,
  review_notes text,
  submitted_at timestamptz,
  reviewed_at timestamptz,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (profile_id)
);

CREATE TABLE IF NOT EXISTS verification_documents (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  verification_id uuid NOT NULL REFERENCES contractor_verifications(id) ON DELETE CASCADE,
  doc_type text NOT NULL CHECK (doc_type IN (
    'business_registration', 'trade_license', 'vat', 'insurance', 'certification', 'identity', 'portfolio_proof', 'other'
  )),
  storage_path text NOT NULL,
  public_url text NOT NULL,
  file_name text,
  mime_type text,
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS verification_reviews (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  verification_id uuid NOT NULL REFERENCES contractor_verifications(id) ON DELETE CASCADE,
  reviewer_id uuid NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  action text NOT NULL CHECK (action IN ('approve', 'reject', 'request_info')),
  notes text,
  created_at timestamptz NOT NULL DEFAULT now()
);

-- =============================================================================
-- 4. REVIEWS 2.0
-- =============================================================================
DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'reviews' AND column_name = 'reviewer_id') THEN
    ALTER TABLE reviews ADD COLUMN reviewer_id uuid REFERENCES profiles(id) ON DELETE SET NULL;
  END IF;
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'reviews' AND column_name = 'reviewer_role') THEN
    ALTER TABLE reviews ADD COLUMN reviewer_role text CHECK (reviewer_role IN ('client', 'professional', 'company'));
  END IF;
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'reviews' AND column_name = 'listing_id') THEN
    ALTER TABLE reviews ADD COLUMN listing_id uuid REFERENCES listings(id) ON DELETE SET NULL;
  END IF;
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'reviews' AND column_name = 'is_approved') THEN
    ALTER TABLE reviews ADD COLUMN is_approved boolean NOT NULL DEFAULT true;
  END IF;
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'reviews' AND column_name = 'is_hidden') THEN
    ALTER TABLE reviews ADD COLUMN is_hidden boolean NOT NULL DEFAULT false;
  END IF;
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'reviews' AND column_name = 'work_quality') THEN
    ALTER TABLE reviews ADD COLUMN work_quality smallint CHECK (work_quality BETWEEN 1 AND 5);
  END IF;
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'reviews' AND column_name = 'communication') THEN
    ALTER TABLE reviews ADD COLUMN communication smallint CHECK (communication BETWEEN 1 AND 5);
  END IF;
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'reviews' AND column_name = 'speed') THEN
    ALTER TABLE reviews ADD COLUMN speed smallint CHECK (speed BETWEEN 1 AND 5);
  END IF;
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'reviews' AND column_name = 'reliability') THEN
    ALTER TABLE reviews ADD COLUMN reliability smallint CHECK (reliability BETWEEN 1 AND 5);
  END IF;
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'reviews' AND column_name = 'would_recommend') THEN
    ALTER TABLE reviews ADD COLUMN would_recommend boolean;
  END IF;
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'reviews' AND column_name = 'moderation_flag') THEN
    ALTER TABLE reviews ADD COLUMN moderation_flag boolean NOT NULL DEFAULT false;
  END IF;
END $$;

CREATE TABLE IF NOT EXISTS review_reports (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  review_id uuid NOT NULL REFERENCES reviews(id) ON DELETE CASCADE,
  reporter_id uuid REFERENCES auth.users(id) ON DELETE SET NULL,
  reason text NOT NULL,
  details text,
  status text NOT NULL DEFAULT 'open' CHECK (status IN ('open', 'reviewed', 'dismissed', 'actioned')),
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE UNIQUE INDEX IF NOT EXISTS idx_reviews_unique_listing_reviewer
  ON reviews (listing_id, reviewer_id)
  WHERE listing_id IS NOT NULL AND reviewer_id IS NOT NULL;

-- =============================================================================
-- 5. NOTIFICATIONS
-- =============================================================================
CREATE TABLE IF NOT EXISTS notification_tokens (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  endpoint text NOT NULL,
  p256dh text NOT NULL,
  auth text NOT NULL,
  user_agent text,
  created_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (user_id, endpoint)
);

CREATE TABLE IF NOT EXISTS notifications (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  type text NOT NULL CHECK (type IN (
    'message', 'lead', 'verification', 'review', 'listing', 'match', 'system'
  )),
  title text NOT NULL,
  body text NOT NULL,
  link_path text,
  reference_type text,
  reference_id uuid,
  is_read boolean NOT NULL DEFAULT false,
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_notifications_user_unread ON notifications(user_id, is_read, created_at DESC);

-- =============================================================================
-- 6. MATCH SCORES (normalized from ai_matches)
-- =============================================================================
CREATE TABLE IF NOT EXISTS match_scores (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  listing_id uuid NOT NULL REFERENCES listings(id) ON DELETE CASCADE,
  contractor_id uuid NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  score numeric(6,2) NOT NULL DEFAULT 0,
  reasons text[] NOT NULL DEFAULT '{}',
  rank_position int,
  created_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (listing_id, contractor_id)
);

CREATE INDEX IF NOT EXISTS idx_match_scores_listing ON match_scores(listing_id, score DESC);

-- =============================================================================
-- STORAGE: chat-media + verification-docs
-- =============================================================================
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES (
  'chat-media',
  'chat-media',
  true,
  26214400,
  ARRAY['image/jpeg', 'image/png', 'image/webp', 'image/gif', 'application/pdf']
)
ON CONFLICT (id) DO UPDATE SET
  file_size_limit = EXCLUDED.file_size_limit,
  allowed_mime_types = EXCLUDED.allowed_mime_types;

INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES (
  'verification-docs',
  'verification-docs',
  false,
  26214400,
  ARRAY['image/jpeg', 'image/png', 'image/webp', 'application/pdf']
)
ON CONFLICT (id) DO UPDATE SET
  file_size_limit = EXCLUDED.file_size_limit;

-- =============================================================================
-- RPC: ensure conversation (UUID for messages)
-- =============================================================================
CREATE OR REPLACE FUNCTION public.ensure_conversation(
  p_other_user_id uuid,
  p_listing_id uuid DEFAULT NULL
)
RETURNS uuid
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_me uuid := auth.uid();
  v_a uuid;
  v_b uuid;
  v_id uuid;
BEGIN
  IF v_me IS NULL THEN
    RAISE EXCEPTION 'not_authenticated';
  END IF;
  IF p_other_user_id IS NULL OR p_other_user_id = v_me THEN
    RAISE EXCEPTION 'invalid_participant';
  END IF;

  v_a := LEAST(v_me, p_other_user_id);
  v_b := GREATEST(v_me, p_other_user_id);

  SELECT c.id INTO v_id
  FROM conversations c
  WHERE c.participant_a = v_a
    AND c.participant_b = v_b
    AND COALESCE(c.listing_id, '00000000-0000-0000-0000-000000000000'::uuid)
      = COALESCE(p_listing_id, '00000000-0000-0000-0000-000000000000'::uuid)
  LIMIT 1;

  IF v_id IS NOT NULL THEN
    RETURN v_id;
  END IF;

  INSERT INTO conversations (participant_a, participant_b, listing_id)
  VALUES (v_a, v_b, p_listing_id)
  RETURNING id INTO v_id;

  RETURN v_id;
END;
$$;

GRANT EXECUTE ON FUNCTION public.ensure_conversation(uuid, uuid) TO authenticated;

-- Notify participant on new message
CREATE OR REPLACE FUNCTION public.notify_new_message()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  IF NEW.recipient_id IS NOT NULL THEN
    INSERT INTO notifications (user_id, type, title, body, link_path, reference_type, reference_id)
    VALUES (
      NEW.recipient_id,
      'message',
      COALESCE(NEW.sender_name, 'New message'),
      LEFT(NEW.content, 120),
      '/messages',
      'conversation',
      NEW.conversation_id
    );
  END IF;
  UPDATE conversations
  SET
    last_message_preview = LEFT(NEW.content, 200),
    last_message_at = NEW.created_at,
    updated_at = now()
  WHERE id = NEW.conversation_id::uuid;
  RETURN NEW;
EXCEPTION
  WHEN others THEN
    RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS trg_notify_new_message ON messages;
CREATE TRIGGER trg_notify_new_message
  AFTER INSERT ON messages
  FOR EACH ROW
  WHEN (NEW.conversation_id IS NOT NULL)
  EXECUTE FUNCTION public.notify_new_message();

-- Update profile rating aggregate
CREATE OR REPLACE FUNCTION public.refresh_profile_rating(p_profile_id uuid)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_avg numeric;
  v_cnt int;
BEGIN
  SELECT AVG(rating)::numeric, COUNT(*)::int INTO v_avg, v_cnt
  FROM reviews
  WHERE professional_id = p_profile_id
    AND is_hidden = false
    AND (is_approved IS NULL OR is_approved = true);

  UPDATE profiles
  SET rating = COALESCE(v_avg, 0), total_reviews = COALESCE(v_cnt, 0)
  WHERE id = p_profile_id;
END;
$$;

GRANT EXECUTE ON FUNCTION public.refresh_profile_rating(uuid) TO authenticated;

-- =============================================================================
-- RLS
-- =============================================================================
ALTER TABLE ai_job_sessions ENABLE ROW LEVEL SECURITY;
ALTER TABLE ai_job_messages ENABLE ROW LEVEL SECURITY;
ALTER TABLE ai_generated_jobs ENABLE ROW LEVEL SECURITY;
ALTER TABLE conversations ENABLE ROW LEVEL SECURITY;
ALTER TABLE message_attachments ENABLE ROW LEVEL SECURITY;
ALTER TABLE contractor_verifications ENABLE ROW LEVEL SECURITY;
ALTER TABLE verification_documents ENABLE ROW LEVEL SECURITY;
ALTER TABLE verification_reviews ENABLE ROW LEVEL SECURITY;
ALTER TABLE review_reports ENABLE ROW LEVEL SECURITY;
ALTER TABLE notification_tokens ENABLE ROW LEVEL SECURITY;
ALTER TABLE notifications ENABLE ROW LEVEL SECURITY;
ALTER TABLE match_scores ENABLE ROW LEVEL SECURITY;

-- AI job sessions: owner
DROP POLICY IF EXISTS "ai_job_sessions_own" ON ai_job_sessions;
CREATE POLICY "ai_job_sessions_own" ON ai_job_sessions FOR ALL TO authenticated
  USING (user_id = auth.uid()) WITH CHECK (user_id = auth.uid());

DROP POLICY IF EXISTS "ai_job_messages_via_session" ON ai_job_messages;
CREATE POLICY "ai_job_messages_via_session" ON ai_job_messages FOR ALL TO authenticated
  USING (EXISTS (SELECT 1 FROM ai_job_sessions s WHERE s.id = session_id AND s.user_id = auth.uid()))
  WITH CHECK (EXISTS (SELECT 1 FROM ai_job_sessions s WHERE s.id = session_id AND s.user_id = auth.uid()));

DROP POLICY IF EXISTS "ai_generated_jobs_own" ON ai_generated_jobs;
CREATE POLICY "ai_generated_jobs_own" ON ai_generated_jobs FOR ALL TO authenticated
  USING (user_id = auth.uid()) WITH CHECK (user_id = auth.uid());

-- Conversations: participants only
DROP POLICY IF EXISTS "conversations_participants" ON conversations;
CREATE POLICY "conversations_participants_select" ON conversations FOR SELECT TO authenticated
  USING (auth.uid() = participant_a OR auth.uid() = participant_b);
CREATE POLICY "conversations_participants_update" ON conversations FOR UPDATE TO authenticated
  USING (auth.uid() = participant_a OR auth.uid() = participant_b);
CREATE POLICY "conversations_participants_insert" ON conversations FOR INSERT TO authenticated
  WITH CHECK (auth.uid() = participant_a OR auth.uid() = participant_b);

-- Message attachments via message access
DROP POLICY IF EXISTS "message_attachments_participants" ON message_attachments;
CREATE POLICY "message_attachments_participants" ON message_attachments FOR SELECT TO authenticated
  USING (EXISTS (
    SELECT 1 FROM messages m
    WHERE m.id = message_id AND (m.sender_id = auth.uid() OR m.recipient_id = auth.uid())
  ));
CREATE POLICY "message_attachments_insert" ON message_attachments FOR INSERT TO authenticated
  WITH CHECK (EXISTS (
    SELECT 1 FROM messages m WHERE m.id = message_id AND m.sender_id = auth.uid()
  ));

-- Verification
DROP POLICY IF EXISTS "contractor_verifications_own" ON contractor_verifications;
CREATE POLICY "contractor_verifications_own_select" ON contractor_verifications FOR SELECT TO authenticated
  USING (profile_id = auth.uid() OR EXISTS (SELECT 1 FROM profiles p WHERE p.id = auth.uid() AND p.is_site_owner = true));
CREATE POLICY "contractor_verifications_own_write" ON contractor_verifications FOR INSERT TO authenticated
  WITH CHECK (profile_id = auth.uid());
CREATE POLICY "contractor_verifications_own_update" ON contractor_verifications FOR UPDATE TO authenticated
  USING (profile_id = auth.uid() OR EXISTS (SELECT 1 FROM profiles p WHERE p.id = auth.uid() AND p.is_site_owner = true));

DROP POLICY IF EXISTS "verification_documents_own" ON verification_documents;
CREATE POLICY "verification_documents_own" ON verification_documents FOR ALL TO authenticated
  USING (EXISTS (
    SELECT 1 FROM contractor_verifications v
    WHERE v.id = verification_id AND (v.profile_id = auth.uid() OR EXISTS (SELECT 1 FROM profiles p WHERE p.id = auth.uid() AND p.is_site_owner))
  ))
  WITH CHECK (EXISTS (SELECT 1 FROM contractor_verifications v WHERE v.id = verification_id AND v.profile_id = auth.uid()));

-- Review reports
DROP POLICY IF EXISTS "review_reports_auth" ON review_reports;
CREATE POLICY "review_reports_insert" ON review_reports FOR INSERT TO authenticated WITH CHECK (reporter_id = auth.uid());
CREATE POLICY "review_reports_select" ON review_reports FOR SELECT TO authenticated
  USING (reporter_id = auth.uid() OR EXISTS (SELECT 1 FROM profiles p WHERE p.id = auth.uid() AND p.is_site_owner));

-- Notifications
DROP POLICY IF EXISTS "notifications_own" ON notifications;
CREATE POLICY "notifications_own" ON notifications FOR ALL TO authenticated
  USING (user_id = auth.uid()) WITH CHECK (user_id = auth.uid());

DROP POLICY IF EXISTS "notification_tokens_own" ON notification_tokens;
CREATE POLICY "notification_tokens_own" ON notification_tokens FOR ALL TO authenticated
  USING (user_id = auth.uid()) WITH CHECK (user_id = auth.uid());

-- Match scores public read for listing owners / matched pros
DROP POLICY IF EXISTS "match_scores_read" ON match_scores;
CREATE POLICY "match_scores_read" ON match_scores FOR SELECT TO authenticated USING (true);
CREATE POLICY "match_scores_insert" ON match_scores FOR INSERT TO authenticated WITH CHECK (true);

-- Storage chat-media
DROP POLICY IF EXISTS "chat_media_read" ON storage.objects;
CREATE POLICY "chat_media_read" ON storage.objects FOR SELECT TO public
  USING (bucket_id = 'chat-media');

DROP POLICY IF EXISTS "chat_media_upload" ON storage.objects;
CREATE POLICY "chat_media_upload" ON storage.objects FOR INSERT TO authenticated
  WITH CHECK (bucket_id = 'chat-media' AND (storage.foldername(name))[1] = 'messages');

DROP POLICY IF EXISTS "verification_docs_own" ON storage.objects;
CREATE POLICY "verification_docs_read" ON storage.objects FOR SELECT TO authenticated
  USING (
    bucket_id = 'verification-docs'
    AND (
      (storage.foldername(name))[1] = auth.uid()::text
      OR EXISTS (SELECT 1 FROM profiles p WHERE p.id = auth.uid() AND p.is_site_owner = true)
    )
  );
CREATE POLICY "verification_docs_upload" ON storage.objects FOR INSERT TO authenticated
  WITH CHECK (bucket_id = 'verification-docs' AND (storage.foldername(name))[1] = auth.uid()::text);

-- Realtime publication
DO $$
BEGIN
  ALTER PUBLICATION supabase_realtime ADD TABLE messages;
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;
DO $$
BEGIN
  ALTER PUBLICATION supabase_realtime ADD TABLE conversations;
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;
DO $$
BEGIN
  ALTER PUBLICATION supabase_realtime ADD TABLE notifications;
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;
