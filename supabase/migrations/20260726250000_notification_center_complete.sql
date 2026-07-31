-- Notification Center: archive, application type, unread count RPC

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
    'booking', 'payment', 'project', 'quote', 'application'
  ));

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema = 'public' AND table_name = 'notifications' AND column_name = 'is_archived'
  ) THEN
    ALTER TABLE notifications ADD COLUMN is_archived boolean NOT NULL DEFAULT false;
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema = 'public' AND table_name = 'notifications' AND column_name = 'archived_at'
  ) THEN
    ALTER TABLE notifications ADD COLUMN archived_at timestamptz;
  END IF;
END $$;

CREATE INDEX IF NOT EXISTS idx_notifications_user_inbox
  ON notifications (user_id, is_archived, is_read, created_at DESC);

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
  prefs_key text;
BEGIN
  IF p_user_id IS NULL OR p_title IS NULL OR p_body IS NULL THEN
    RETURN NULL;
  END IF;

  normalized_type := CASE
    WHEN p_type = 'quote_received' THEN 'quote'
    WHEN p_type = 'application' THEN 'application'
    ELSE p_type
  END;

  IF normalized_type NOT IN (
    'message', 'lead', 'verification', 'review', 'listing', 'match', 'system',
    'booking', 'payment', 'project', 'quote', 'application'
  ) THEN
    normalized_type := 'system';
  END IF;

  -- Map application prefs to project category if application key missing
  prefs_key := CASE
    WHEN normalized_type = 'application' THEN 'application'
    ELSE normalized_type
  END;

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

  cat_ok := coalesce(
    (prefs->'categories'->>prefs_key)::boolean,
    (prefs->'categories'->>'project')::boolean,
    true
  );
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

CREATE OR REPLACE FUNCTION public.count_unread_notifications(p_user_id uuid DEFAULT NULL)
RETURNS integer
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT COUNT(*)::integer
  FROM notifications n
  WHERE n.user_id = coalesce(p_user_id, auth.uid())
    AND n.is_read = false
    AND coalesce(n.is_archived, false) = false
    AND (p_user_id IS NULL OR p_user_id = auth.uid() OR public.is_site_owner());
$$;

GRANT EXECUTE ON FUNCTION public.count_unread_notifications(uuid) TO authenticated;

-- Notify listing author when a professional applies (if table exists)
DO $$
BEGIN
  IF to_regclass('public.project_applications') IS NULL THEN
    RETURN;
  END IF;

  EXECUTE $fn$
    CREATE OR REPLACE FUNCTION public.notify_on_project_application()
    RETURNS trigger
    LANGUAGE plpgsql
    SECURITY DEFINER
    SET search_path = public
    AS $body$
    DECLARE
      v_author uuid;
      v_title text;
      v_pro_name text;
    BEGIN
      IF TG_OP = 'UPDATE' AND OLD.status IS NOT DISTINCT FROM NEW.status THEN
        RETURN NEW;
      END IF;

      IF NEW.status IS DISTINCT FROM 'applied' THEN
        RETURN NEW;
      END IF;

      SELECT author_id, title INTO v_author, v_title
      FROM listings WHERE id = NEW.listing_id;

      IF v_author IS NULL OR v_author = NEW.professional_id THEN
        RETURN NEW;
      END IF;

      SELECT coalesce(full_name, 'A professional') INTO v_pro_name
      FROM profiles WHERE id = NEW.professional_id;

      PERFORM public.create_notification(
        v_author,
        'application',
        'New application',
        left(coalesce(v_pro_name, 'A professional') || ' applied to “' || coalesce(v_title, 'your project') || '”', 180),
        '/listing/' || NEW.listing_id::text,
        'project_application',
        NEW.id
      );

      RETURN NEW;
    END;
    $body$;
  $fn$;

  EXECUTE 'DROP TRIGGER IF EXISTS trg_notify_project_application ON project_applications';
  EXECUTE $trg$
    CREATE TRIGGER trg_notify_project_application
      AFTER INSERT OR UPDATE OF status ON project_applications
      FOR EACH ROW
      EXECUTE FUNCTION public.notify_on_project_application()
  $trg$;
END $$;
