-- Booking calendar: blocked dates, bookings, Google Calendar tokens

CREATE TABLE IF NOT EXISTS booking_blocked_dates (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  professional_id uuid NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  blocked_date date NOT NULL,
  reason text,
  created_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (professional_id, blocked_date)
);

CREATE INDEX IF NOT EXISTS idx_booking_blocked_pro_date
  ON booking_blocked_dates(professional_id, blocked_date);

CREATE TABLE IF NOT EXISTS bookings (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  professional_id uuid NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  customer_id uuid REFERENCES profiles(id) ON DELETE SET NULL,
  customer_name text NOT NULL,
  customer_email text,
  customer_phone text,
  starts_at timestamptz NOT NULL,
  ends_at timestamptz NOT NULL,
  status text NOT NULL DEFAULT 'pending'
    CHECK (status IN ('pending', 'accepted', 'declined', 'cancelled', 'completed')),
  notes text,
  google_event_id text,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  CONSTRAINT bookings_time_ok CHECK (ends_at > starts_at)
);

CREATE INDEX IF NOT EXISTS idx_bookings_pro_starts
  ON bookings(professional_id, starts_at);

CREATE INDEX IF NOT EXISTS idx_bookings_customer
  ON bookings(customer_id, starts_at DESC);

CREATE INDEX IF NOT EXISTS idx_bookings_status
  ON bookings(professional_id, status, starts_at);

CREATE TABLE IF NOT EXISTS google_calendar_connections (
  user_id uuid PRIMARY KEY REFERENCES profiles(id) ON DELETE CASCADE,
  access_token text NOT NULL,
  refresh_token text,
  token_expiry timestamptz,
  calendar_id text NOT NULL DEFAULT 'primary',
  scope text,
  connected_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE booking_blocked_dates ENABLE ROW LEVEL SECURITY;
ALTER TABLE bookings ENABLE ROW LEVEL SECURITY;
ALTER TABLE google_calendar_connections ENABLE ROW LEVEL SECURITY;

-- Blocked dates: public read for booking UI; owner manage
DROP POLICY IF EXISTS "blocked_dates_select" ON booking_blocked_dates;
CREATE POLICY "blocked_dates_select" ON booking_blocked_dates
  FOR SELECT TO authenticated, anon USING (true);

DROP POLICY IF EXISTS "blocked_dates_manage" ON booking_blocked_dates;
CREATE POLICY "blocked_dates_manage" ON booking_blocked_dates
  FOR ALL TO authenticated
  USING (professional_id = auth.uid())
  WITH CHECK (professional_id = auth.uid());

-- Bookings: participants can read; customer insert pending; pro update status; customer cancel own pending
DROP POLICY IF EXISTS "bookings_select" ON bookings;
CREATE POLICY "bookings_select" ON bookings
  FOR SELECT TO authenticated
  USING (professional_id = auth.uid() OR customer_id = auth.uid());

DROP POLICY IF EXISTS "bookings_insert" ON bookings;
CREATE POLICY "bookings_insert" ON bookings
  FOR INSERT TO authenticated
  WITH CHECK (
    customer_id = auth.uid()
    AND status = 'pending'
  );

DROP POLICY IF EXISTS "bookings_update_pro" ON bookings;
CREATE POLICY "bookings_update_pro" ON bookings
  FOR UPDATE TO authenticated
  USING (professional_id = auth.uid())
  WITH CHECK (professional_id = auth.uid());

DROP POLICY IF EXISTS "bookings_update_customer" ON bookings;
CREATE POLICY "bookings_update_customer" ON bookings
  FOR UPDATE TO authenticated
  USING (customer_id = auth.uid())
  WITH CHECK (customer_id = auth.uid() AND status = 'cancelled');

-- Google tokens: owner only
DROP POLICY IF EXISTS "gcal_own" ON google_calendar_connections;
CREATE POLICY "gcal_own" ON google_calendar_connections
  FOR ALL TO authenticated
  USING (user_id = auth.uid())
  WITH CHECK (user_id = auth.uid());

-- Public RPC: list blocked dates + accepted busy for a pro (for booking page without auth leak)
CREATE OR REPLACE FUNCTION public.get_professional_booking_availability(
  p_professional_id uuid,
  p_from date,
  p_to date
)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  blocked jsonb;
  busy jsonb;
BEGIN
  SELECT coalesce(jsonb_agg(blocked_date ORDER BY blocked_date), '[]'::jsonb)
  INTO blocked
  FROM booking_blocked_dates
  WHERE professional_id = p_professional_id
    AND blocked_date >= p_from
    AND blocked_date <= p_to;

  SELECT coalesce(
    jsonb_agg(jsonb_build_object(
      'starts_at', starts_at,
      'ends_at', ends_at,
      'status', status
    ) ORDER BY starts_at),
    '[]'::jsonb
  )
  INTO busy
  FROM bookings
  WHERE professional_id = p_professional_id
    AND status IN ('pending', 'accepted')
    AND starts_at::date <= p_to
    AND ends_at::date >= p_from;

  RETURN jsonb_build_object('blocked', blocked, 'busy', busy);
END;
$$;

GRANT EXECUTE ON FUNCTION public.get_professional_booking_availability(uuid, date, date) TO anon, authenticated;

-- Realtime
DO $$
BEGIN
  ALTER PUBLICATION supabase_realtime ADD TABLE bookings;
EXCEPTION WHEN duplicate_object THEN NULL; WHEN undefined_object THEN NULL;
END $$;

DO $$
BEGIN
  ALTER PUBLICATION supabase_realtime ADD TABLE booking_blocked_dates;
EXCEPTION WHEN duplicate_object THEN NULL; WHEN undefined_object THEN NULL;
END $$;
