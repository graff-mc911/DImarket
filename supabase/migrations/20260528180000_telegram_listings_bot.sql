-- Telegram bot sessions: intake job requests from Telegram → listings table

CREATE TABLE IF NOT EXISTS telegram_bot_sessions (
  chat_id bigint PRIMARY KEY,
  telegram_user_id bigint,
  locale text NOT NULL DEFAULT 'uk',
  step text NOT NULL DEFAULT 'idle',
  draft jsonb NOT NULL DEFAULT '{}'::jsonb,
  listing_id uuid REFERENCES listings(id) ON DELETE SET NULL,
  status text NOT NULL DEFAULT 'active' CHECK (status IN ('active', 'completed')),
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_telegram_bot_sessions_status
  ON telegram_bot_sessions(status, updated_at DESC);

ALTER TABLE telegram_bot_sessions ENABLE ROW LEVEL SECURITY;

COMMENT ON TABLE telegram_bot_sessions IS 'Conversation state for Dimarket listings Telegram bot (service role only).';
