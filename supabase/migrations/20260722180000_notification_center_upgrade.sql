-- Notification Center upgrade: types, prefs, secure create_notification, email/push dispatch hook

-- Expand notification types
DO $$
DECLARE
  cname text;
BEGIN
  SELECT con.conname INTO cname
  FROM pg_constraint con
  JOIN pg_class rel ON rel.oid = con.conrelid
  JOIN pg_namespace nsp ON nsp.oid = rel.relnamespace
  WHERE nsp.nspname = 'public'
    AND rel.relname = 'notifications'
    AND con.contype = 'c'
    AND pg_get_constraintdef(con.oid) ILIKE '%type%';

  IF cname IS NOT NULL THEN
    EXECUTE format('ALTER TABLE notifications DROP CONSTRAINT %I', cname);
  END IF;
END $$;

ALTER TABLE notifications
  ADD CONSTRAINT notifications_type_check
  CHECK (type IN (
    'message', 'lead', 'verification', 'review', 'listing', 'match', 'system',
    'booking', 'payment', 'project', 'quote'
  ));

-- Delivery tracking + channel metadata
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema = 'public' AND table_name = 'notifications' AND column_name = 'email_sent'
  ) THEN
    ALTER TABLE notifications ADD COLUMN email_sent boolean NOT NULL DEFAULT false;
  END IF;
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema = 'public' AND table_name = 'notifications' AND column_name = 'push_sent'
  ) THEN
    ALTER TABLE notifications ADD COLUMN push_sent boolean NOT NULL DEFAULT false;
  END IF;
END $$;

-- Per-channel / per-category preferences on profiles
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema = 'public' AND table_name = 'profiles' AND column_name = 'notification_prefs'
  ) THEN
    ALTER TABLE profiles ADD COLUMN notification_prefs jsonb NOT NULL DEFAULT '{
      "inapp": true,
      "push": true,
      "email": true,
      "categories": {
        "message": true,
        "project": true,
        "review": true,
        "payment": true,
        "verification": true,
        "booking": true,
        "match": true,
        "lead": true,
        "quote": true,
        "system": true
      }
    }'::jsonb;
  END IF;
END $$;

-- Map quote_received / booking inserts that may have failed historically are fine going forward

-- Secure notifier (bypasses RLS for cross-user inserts)
CREATE OR REPLACE FUNCTION public.create_notification(
  p_user_id uuid,
  p_type text,
  p_title text,
  p_body text,
  p_link_path text DEFAULT NULL,
  p_reference_type text DEFAULT NULL,
  p_reference_id uuid DEFAULT NULL
)
RETURNS uuid
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  prefs jsonb;
  enabled boolean;
  cat_ok boolean;
  inapp_ok boolean;
  new_id uuid;
  normalized_type text;
BEGIN
  IF p_user_id IS NULL OR p_title IS NULL OR p_body IS NULL THEN
    RETURN NULL;
  END IF;

  normalized_type := CASE
    WHEN p_type = 'quote_received' THEN 'quote'
    WHEN p_type = 'quote' THEN 'quote'
    ELSE p_type
  END;

  IF normalized_type NOT IN (
    'message', 'lead', 'verification', 'review', 'listing', 'match', 'system',
    'booking', 'payment', 'project', 'quote'
  ) THEN
    normalized_type := 'system';
  END IF;

  SELECT
    coalesce(notifications_enabled, true),
    coalesce(notification_prefs, '{}'::jsonb)
  INTO enabled, prefs
  FROM profiles
  WHERE id = p_user_id;

  IF enabled IS DISTINCT FROM true THEN
    RETURN NULL;
  END IF;

  inapp_ok := coalesce((prefs->>'inapp')::boolean, true);
  IF NOT inapp_ok THEN
    RETURN NULL;
  END IF;

  cat_ok := coalesce((prefs->'categories'->>normalized_type)::boolean, true);
  IF NOT cat_ok THEN
    RETURN NULL;
  END IF;

  INSERT INTO notifications (
    user_id, type, title, body, link_path, reference_type, reference_id
  ) VALUES (
    p_user_id, normalized_type, p_title, p_body, p_link_path, p_reference_type, p_reference_id
  )
  RETURNING id INTO new_id;

  RETURN new_id;
END;
$$;

GRANT EXECUTE ON FUNCTION public.create_notification(uuid, text, text, text, text, text, uuid)
  TO authenticated, service_role, anon;

-- Tighten RLS: users can read/update own; insert only own (for rare self-notes) OR use RPC
DROP POLICY IF EXISTS "notifications_own" ON notifications;

CREATE POLICY "notifications_select_own" ON notifications
  FOR SELECT TO authenticated
  USING (user_id = auth.uid());

CREATE POLICY "notifications_update_own" ON notifications
  FOR UPDATE TO authenticated
  USING (user_id = auth.uid())
  WITH CHECK (user_id = auth.uid());

CREATE POLICY "notifications_delete_own" ON notifications
  FOR DELETE TO authenticated
  USING (user_id = auth.uid());

-- Keep insert for own only (RPC is DEFINER and bypasses RLS)
CREATE POLICY "notifications_insert_own" ON notifications
  FOR INSERT TO authenticated
  WITH CHECK (user_id = auth.uid());

-- Dispatch email+push after insert (pg_net optional)
CREATE OR REPLACE FUNCTION public.dispatch_notification_channels()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  base_url text;
  service_key text;
  prefs jsonb;
  want_push boolean;
  want_email boolean;
  cat_ok boolean;
  master_ok boolean;
BEGIN
  SELECT coalesce(notifications_enabled, true), coalesce(notification_prefs, '{}'::jsonb)
  INTO master_ok, prefs
  FROM profiles WHERE id = NEW.user_id;

  IF master_ok IS DISTINCT FROM true THEN
    RETURN NEW;
  END IF;

  want_push := coalesce((prefs->>'push')::boolean, true);
  want_email := coalesce((prefs->>'email')::boolean, true);
  cat_ok := coalesce((prefs->'categories'->>NEW.type)::boolean, true);
  IF NOT cat_ok THEN
    RETURN NEW;
  END IF;

  BEGIN
    base_url := nullif(current_setting('app.settings.supabase_url', true), '');
  EXCEPTION WHEN others THEN
    base_url := NULL;
  END;
  IF base_url IS NULL THEN
    BEGIN
      base_url := nullif(current_setting('supabase.url', true), '');
    EXCEPTION WHEN others THEN
      base_url := NULL;
    END;
  END IF;
  BEGIN
    service_key := nullif(current_setting('app.settings.service_role_key', true), '');
  EXCEPTION WHEN others THEN
    service_key := NULL;
  END;

  IF base_url IS NULL OR service_key IS NULL THEN
    RETURN NEW;
  END IF;

  IF want_push OR want_email THEN
    BEGIN
      PERFORM net.http_post(
        url := rtrim(base_url, '/') || '/functions/v1/notify-dispatch',
        headers := jsonb_build_object(
          'Content-Type', 'application/json',
          'Authorization', 'Bearer ' || service_key
        ),
        body := jsonb_build_object(
          'notification_id', NEW.id,
          'user_id', NEW.user_id,
          'type', NEW.type,
          'title', NEW.title,
          'body', NEW.body,
          'url', COALESCE(NEW.link_path, '/'),
          'send_push', want_push,
          'send_email', want_email
        )
      );
    EXCEPTION
      WHEN undefined_function THEN NULL;
      WHEN others THEN NULL;
    END;
  END IF;

  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS trg_dispatch_web_push ON notifications;
DROP TRIGGER IF EXISTS trg_dispatch_notification_channels ON notifications;
CREATE TRIGGER trg_dispatch_notification_channels
  AFTER INSERT ON notifications
  FOR EACH ROW
  EXECUTE FUNCTION public.dispatch_notification_channels();

-- Update message trigger to keep using notifications insert (DEFINER already)
-- Optionally remap legacy quote_received if any rows exist — skip

COMMENT ON FUNCTION public.create_notification IS
  'Secure cross-user notification insert respecting notification_prefs';
