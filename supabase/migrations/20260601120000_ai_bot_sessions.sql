-- AI bot infrastructure: sessions + messages (sales chatbot → job requests)

CREATE TABLE IF NOT EXISTS ai_bot_sessions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid REFERENCES auth.users(id) ON DELETE SET NULL,
  bot_type text NOT NULL DEFAULT 'sales' CHECK (bot_type IN ('sales')),
  locale text NOT NULL DEFAULT 'uk',
  step text NOT NULL DEFAULT 'welcome',
  draft jsonb NOT NULL DEFAULT '{}'::jsonb,
  listing_id uuid REFERENCES listings(id) ON DELETE SET NULL,
  status text NOT NULL DEFAULT 'active' CHECK (status IN ('active', 'completed', 'abandoned')),
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS ai_bot_messages (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  session_id uuid NOT NULL REFERENCES ai_bot_sessions(id) ON DELETE CASCADE,
  role text NOT NULL CHECK (role IN ('user', 'assistant', 'system')),
  content text NOT NULL,
  meta jsonb NOT NULL DEFAULT '{}'::jsonb,
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_ai_bot_sessions_user ON ai_bot_sessions(user_id);
CREATE INDEX IF NOT EXISTS idx_ai_bot_messages_session ON ai_bot_messages(session_id, created_at);

ALTER TABLE ai_bot_sessions ENABLE ROW LEVEL SECURITY;
ALTER TABLE ai_bot_messages ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users manage own bot sessions"
  ON ai_bot_sessions FOR ALL
  USING (user_id = auth.uid())
  WITH CHECK (user_id = auth.uid());

CREATE POLICY "Users read own bot messages"
  ON ai_bot_messages FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM ai_bot_sessions s
      WHERE s.id = session_id AND s.user_id = auth.uid()
    )
  );

CREATE POLICY "Users insert bot messages for own sessions"
  ON ai_bot_messages FOR INSERT
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM ai_bot_sessions s
      WHERE s.id = session_id AND s.user_id = auth.uid()
    )
  );
