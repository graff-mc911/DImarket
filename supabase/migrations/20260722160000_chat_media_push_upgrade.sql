-- Chat upgrade: video/voice media, richer attachment types, web-push hook

-- Expand attachment types
DO $$
DECLARE
  cname text;
BEGIN
  SELECT con.conname INTO cname
  FROM pg_constraint con
  JOIN pg_class rel ON rel.oid = con.conrelid
  JOIN pg_namespace nsp ON nsp.oid = rel.relnamespace
  WHERE nsp.nspname = 'public'
    AND rel.relname = 'message_attachments'
    AND con.contype = 'c'
    AND pg_get_constraintdef(con.oid) ILIKE '%attachment_type%';

  IF cname IS NOT NULL THEN
    EXECUTE format('ALTER TABLE message_attachments DROP CONSTRAINT %I', cname);
  END IF;
END $$;

ALTER TABLE message_attachments
  ADD CONSTRAINT message_attachments_attachment_type_check
  CHECK (attachment_type IN ('image', 'pdf', 'document', 'video', 'voice', 'audio', 'other'));

-- Enlarge chat-media bucket for video / voice
UPDATE storage.buckets
SET
  file_size_limit = 104857600,
  allowed_mime_types = ARRAY[
    'image/jpeg', 'image/png', 'image/webp', 'image/gif',
    'application/pdf',
    'video/mp4', 'video/webm', 'video/quicktime',
    'audio/webm', 'audio/mpeg', 'audio/mp4', 'audio/ogg', 'audio/wav', 'audio/x-m4a'
  ]
WHERE id = 'chat-media';

-- Ensure realtime includes attachments (idempotent)
DO $$
BEGIN
  ALTER PUBLICATION supabase_realtime ADD TABLE message_attachments;
EXCEPTION
  WHEN duplicate_object THEN NULL;
  WHEN undefined_object THEN NULL;
END $$;

DO $$
BEGIN
  ALTER PUBLICATION supabase_realtime ADD TABLE messages;
EXCEPTION
  WHEN duplicate_object THEN NULL;
  WHEN undefined_object THEN NULL;
END $$;

DO $$
BEGIN
  ALTER PUBLICATION supabase_realtime ADD TABLE conversations;
EXCEPTION
  WHEN duplicate_object THEN NULL;
  WHEN undefined_object THEN NULL;
END $$;

-- Optional: dispatch web push when in-app notification is created (requires pg_net)
CREATE OR REPLACE FUNCTION public.dispatch_web_push_on_notification()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  base_url text;
  service_key text;
BEGIN
  BEGIN
    base_url := nullif(current_setting('app.settings.supabase_url', true), '');
  EXCEPTION WHEN others THEN
    base_url := NULL;
  END;
  IF base_url IS NULL THEN
    base_url := nullif(current_setting('supabase.url', true), '');
  END IF;

  service_key := nullif(current_setting('app.settings.service_role_key', true), '');

  IF base_url IS NULL OR service_key IS NULL THEN
    RETURN NEW;
  END IF;

  BEGIN
    PERFORM net.http_post(
      url := rtrim(base_url, '/') || '/functions/v1/dispatch-web-push',
      headers := jsonb_build_object(
        'Content-Type', 'application/json',
        'Authorization', 'Bearer ' || service_key
      ),
      body := jsonb_build_object(
        'user_id', NEW.user_id,
        'title', NEW.title,
        'body', NEW.body,
        'url', COALESCE(NEW.link_path, '/messages')
      )
    );
  EXCEPTION
    WHEN undefined_function THEN NULL;
    WHEN others THEN NULL;
  END;

  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS trg_dispatch_web_push ON notifications;
CREATE TRIGGER trg_dispatch_web_push
  AFTER INSERT ON notifications
  FOR EACH ROW
  EXECUTE FUNCTION public.dispatch_web_push_on_notification();
