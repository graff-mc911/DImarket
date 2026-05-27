-- Admin AI Assistant: knowledge base + action audit log

CREATE TABLE IF NOT EXISTS public.ai_knowledge_base (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  question text NOT NULL,
  answer text NOT NULL,
  source text NOT NULL DEFAULT 'manual'
    CHECK (source IN ('web', 'admin', 'codebase', 'manual')),
  confidence real NOT NULL DEFAULT 1.0,
  used_count int NOT NULL DEFAULT 0,
  created_by uuid REFERENCES auth.users(id) ON DELETE SET NULL,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_ai_knowledge_question
  ON public.ai_knowledge_base USING gin (to_tsvector('simple', question || ' ' || answer));

CREATE TABLE IF NOT EXISTS public.admin_ai_logs (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  admin_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  action_type text NOT NULL,
  payload jsonb NOT NULL DEFAULT '{}'::jsonb,
  result jsonb,
  success boolean NOT NULL DEFAULT true,
  error_message text,
  ip_hint text,
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_admin_ai_logs_admin_time
  ON public.admin_ai_logs (admin_id, created_at DESC);

ALTER TABLE public.ai_knowledge_base ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.admin_ai_logs ENABLE ROW LEVEL SECURITY;

-- Site owners only (matches marketing-agent pattern)
CREATE POLICY ai_knowledge_owner_select ON public.ai_knowledge_base
  FOR SELECT TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.profiles p
      WHERE p.id = auth.uid() AND (p.is_site_owner = true OR p.user_role = 'owner')
    )
  );

CREATE POLICY ai_knowledge_owner_write ON public.ai_knowledge_base
  FOR ALL TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.profiles p
      WHERE p.id = auth.uid() AND (p.is_site_owner = true OR p.user_role = 'owner')
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.profiles p
      WHERE p.id = auth.uid() AND (p.is_site_owner = true OR p.user_role = 'owner')
    )
  );

CREATE POLICY admin_ai_logs_owner_select ON public.admin_ai_logs
  FOR SELECT TO authenticated
  USING (admin_id = auth.uid());

COMMENT ON TABLE public.ai_knowledge_base IS 'Admin AI self-learning Q&A store';
COMMENT ON TABLE public.admin_ai_logs IS 'GDPR audit log for admin AI actions';
