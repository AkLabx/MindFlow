-- ============================================================================
-- MindFlow v1.0.383 Migration
-- 1. Immutable sequence-backed student_id (MF-XXXXXX) on public.profiles
-- 2. Pricing, MRP, validity, demo count & course_type on public.mock_series
-- 3. Free demo & live schedule columns on public.mock_tests
-- 4. Nullable razorpay_payment_id + UPI/Admin receipt metadata on public.payments
-- 5. public.user_course_entitlements + strict non-overlapping RLS
-- 6. SECURITY DEFINER RPCs for UPI verification requests & Admin activation
-- ============================================================================

-- 1. Immutable Student ID on public.profiles
CREATE SEQUENCE IF NOT EXISTS public.student_id_seq
  AS bigint
  START WITH 100001
  INCREMENT BY 1
  NO MAXVALUE
  CACHE 1;

REVOKE ALL ON SEQUENCE public.student_id_seq FROM PUBLIC, anon, authenticated;

ALTER TABLE public.profiles
  ADD COLUMN IF NOT EXISTS student_id text;

WITH ordered_profiles AS (
  SELECT
    id,
    row_number() OVER (ORDER BY created_at ASC, id ASC) AS rn
  FROM public.profiles
  WHERE student_id IS NULL OR BTRIM(student_id) = ''
),
max_existing AS (
  SELECT COALESCE(
    (
      SELECT MAX(substring(student_id FROM '^MF-([0-9]+)$')::bigint)
      FROM public.profiles
      WHERE student_id ~ '^MF-[0-9]+$'
    ),
    100000
  ) AS base_val
)
UPDATE public.profiles p
SET student_id = 'MF-' || LPAD((me.base_val + op.rn)::text, 6, '0')
FROM ordered_profiles op
CROSS JOIN max_existing me
WHERE p.id = op.id;

SELECT setval(
  'public.student_id_seq',
  GREATEST(
    100000,
    COALESCE(
      (
        SELECT MAX(substring(student_id FROM '^MF-([0-9]+)$')::bigint)
        FROM public.profiles
        WHERE student_id ~ '^MF-[0-9]+$'
      ),
      100000
    )
  ),
  true
);

ALTER TABLE public.profiles
  ALTER COLUMN student_id SET NOT NULL;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint
    WHERE conrelid = 'public.profiles'::regclass
      AND conname = 'profiles_student_id_unique'
  ) THEN
    ALTER TABLE public.profiles
      ADD CONSTRAINT profiles_student_id_unique UNIQUE (student_id);
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint
    WHERE conrelid = 'public.profiles'::regclass
      AND conname = 'profiles_student_id_format_check'
  ) THEN
    ALTER TABLE public.profiles
      ADD CONSTRAINT profiles_student_id_format_check CHECK (student_id ~ '^MF-[0-9]{6,}$');
  END IF;
END $$;

CREATE OR REPLACE FUNCTION public.trg_fn_profiles_student_id()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, pg_temp
AS $$
BEGIN
  IF TG_OP = 'INSERT' THEN
    IF NEW.student_id IS NULL OR BTRIM(NEW.student_id) = '' THEN
      NEW.student_id := 'MF-' || LPAD(nextval('public.student_id_seq')::text, 6, '0');
    ELSE
      NEW.student_id := UPPER(BTRIM(NEW.student_id));
    END IF;
    RETURN NEW;
  END IF;

  IF TG_OP = 'UPDATE' THEN
    IF OLD.student_id IS NOT NULL AND NEW.student_id IS DISTINCT FROM OLD.student_id THEN
      RAISE EXCEPTION 'profiles.student_id is immutable and cannot be changed once assigned.'
        USING ERRCODE = '42501';
    END IF;
    IF OLD.student_id IS NULL AND (NEW.student_id IS NULL OR BTRIM(NEW.student_id) = '') THEN
      NEW.student_id := 'MF-' || LPAD(nextval('public.student_id_seq')::text, 6, '0');
    END IF;
    RETURN NEW;
  END IF;

  RETURN NEW;
END;
$$;

REVOKE ALL ON FUNCTION public.trg_fn_profiles_student_id() FROM PUBLIC, anon, authenticated;

DROP TRIGGER IF EXISTS trg_profiles_student_id_immutable ON public.profiles;
CREATE TRIGGER trg_profiles_student_id_immutable
  BEFORE INSERT OR UPDATE ON public.profiles
  FOR EACH ROW
  EXECUTE FUNCTION public.trg_fn_profiles_student_id();

-- 2. Pricing & Course Metadata on public.mock_series
ALTER TABLE public.mock_series
  ADD COLUMN IF NOT EXISTS price_inr integer NOT NULL DEFAULT 0,
  ADD COLUMN IF NOT EXISTS mrp_inr integer,
  ADD COLUMN IF NOT EXISTS validity_days integer NOT NULL DEFAULT 365,
  ADD COLUMN IF NOT EXISTS free_demo_count integer NOT NULL DEFAULT 1,
  ADD COLUMN IF NOT EXISTS course_type text NOT NULL DEFAULT 'mock_series';

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint
    WHERE conrelid = 'public.mock_series'::regclass
      AND conname = 'mock_series_price_inr_check'
  ) THEN
    ALTER TABLE public.mock_series
      ADD CONSTRAINT mock_series_price_inr_check CHECK (price_inr >= 0 AND price_inr <= 1000000);
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint
    WHERE conrelid = 'public.mock_series'::regclass
      AND conname = 'mock_series_mrp_inr_check'
  ) THEN
    ALTER TABLE public.mock_series
      ADD CONSTRAINT mock_series_mrp_inr_check CHECK (mrp_inr IS NULL OR (mrp_inr >= price_inr AND mrp_inr <= 1000000));
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint
    WHERE conrelid = 'public.mock_series'::regclass
      AND conname = 'mock_series_validity_days_check'
  ) THEN
    ALTER TABLE public.mock_series
      ADD CONSTRAINT mock_series_validity_days_check CHECK (validity_days BETWEEN 1 AND 3650);
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint
    WHERE conrelid = 'public.mock_series'::regclass
      AND conname = 'mock_series_free_demo_count_check'
  ) THEN
    ALTER TABLE public.mock_series
      ADD CONSTRAINT mock_series_free_demo_count_check CHECK (free_demo_count BETWEEN 0 AND 50);
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint
    WHERE conrelid = 'public.mock_series'::regclass
      AND conname = 'mock_series_course_type_check'
  ) THEN
    ALTER TABLE public.mock_series
      ADD CONSTRAINT mock_series_course_type_check CHECK (course_type = ANY (ARRAY['mock_series'::text, 'bundle'::text, 'video'::text, 'pdf'::text]));
  END IF;
END $$;

-- 3. Free Demo & Live Test Schedule Metadata on public.mock_tests
ALTER TABLE public.mock_tests
  ADD COLUMN IF NOT EXISTS is_free_demo boolean NOT NULL DEFAULT false,
  ADD COLUMN IF NOT EXISTS is_live boolean NOT NULL DEFAULT false,
  ADD COLUMN IF NOT EXISTS live_start_at timestamptz,
  ADD COLUMN IF NOT EXISTS live_end_at timestamptz;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint
    WHERE conrelid = 'public.mock_tests'::regclass
      AND conname = 'mock_tests_live_window_check'
  ) THEN
    ALTER TABLE public.mock_tests
      ADD CONSTRAINT mock_tests_live_window_check CHECK (
        live_start_at IS NULL OR live_end_at IS NULL OR live_end_at > live_start_at
      );
  END IF;
END $$;

CREATE INDEX IF NOT EXISTS idx_mock_tests_live_published
  ON public.mock_tests (is_published, is_live, live_end_at)
  WHERE is_published = true AND is_live = true;

-- 4. Receipt & Manual UPI / Admin Grant Extensions on public.payments
ALTER TABLE public.payments
  ALTER COLUMN razorpay_payment_id DROP NOT NULL;

ALTER TABLE public.payments
  ADD COLUMN IF NOT EXISTS order_code text,
  ADD COLUMN IF NOT EXISTS series_id uuid REFERENCES public.mock_series(id) ON DELETE SET NULL,
  ADD COLUMN IF NOT EXISTS course_type text NOT NULL DEFAULT 'mock_series',
  ADD COLUMN IF NOT EXISTS target_route text,
  ADD COLUMN IF NOT EXISTS validity_days integer,
  ADD COLUMN IF NOT EXISTS valid_until timestamptz,
  ADD COLUMN IF NOT EXISTS payment_method text NOT NULL DEFAULT 'upi_manual',
  ADD COLUMN IF NOT EXISTS upi_reference text,
  ADD COLUMN IF NOT EXISTS student_id_snapshot text,
  ADD COLUMN IF NOT EXISTS granted_by uuid REFERENCES auth.users(id) ON DELETE SET NULL,
  ADD COLUMN IF NOT EXISTS admin_note text;

UPDATE public.payments
SET payment_method = 'razorpay'
WHERE razorpay_payment_id IS NOT NULL
  AND payment_method = 'upi_manual';

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint
    WHERE conrelid = 'public.payments'::regclass
      AND conname = 'payments_order_code_key'
  ) THEN
    ALTER TABLE public.payments
      ADD CONSTRAINT payments_order_code_key UNIQUE (order_code);
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint
    WHERE conrelid = 'public.payments'::regclass
      AND conname = 'payments_course_type_check'
  ) THEN
    ALTER TABLE public.payments
      ADD CONSTRAINT payments_course_type_check CHECK (course_type = ANY (ARRAY['mock_series'::text, 'bundle'::text, 'video'::text, 'pdf'::text]));
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint
    WHERE conrelid = 'public.payments'::regclass
      AND conname = 'payments_validity_days_check'
  ) THEN
    ALTER TABLE public.payments
      ADD CONSTRAINT payments_validity_days_check CHECK (validity_days IS NULL OR validity_days BETWEEN 1 AND 3650);
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint
    WHERE conrelid = 'public.payments'::regclass
      AND conname = 'payments_payment_method_check'
  ) THEN
    ALTER TABLE public.payments
      ADD CONSTRAINT payments_payment_method_check CHECK (payment_method = ANY (ARRAY['upi_manual'::text, 'admin_grant'::text, 'razorpay'::text]));
  END IF;
END $$;

CREATE INDEX IF NOT EXISTS idx_payments_user_created_at
  ON public.payments (user_id, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_payments_status_created_at
  ON public.payments (status, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_payments_series_id
  ON public.payments (series_id);
CREATE INDEX IF NOT EXISTS idx_payments_granted_by
  ON public.payments (granted_by);

ALTER POLICY "Users can view their own payment records."
  ON public.payments
  TO authenticated
  USING (((SELECT auth.uid()) = user_id) OR (SELECT public.is_admin()));

-- 5. Course Entitlements Ledger (user_course_entitlements)
CREATE TABLE IF NOT EXISTS public.user_course_entitlements (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  student_id_snapshot text NOT NULL,
  series_id uuid NOT NULL REFERENCES public.mock_series(id) ON DELETE CASCADE,
  course_type text NOT NULL DEFAULT 'mock_series'
    CHECK (course_type = ANY (ARRAY['mock_series'::text, 'bundle'::text, 'video'::text, 'pdf'::text])),
  target_route text,
  payment_id uuid REFERENCES public.payments(id) ON DELETE SET NULL,
  status text NOT NULL DEFAULT 'active'
    CHECK (status = ANY (ARRAY['pending'::text, 'active'::text, 'expired'::text, 'revoked'::text])),
  starts_at timestamptz NOT NULL DEFAULT now(),
  valid_until timestamptz NOT NULL,
  granted_by uuid REFERENCES auth.users(id) ON DELETE SET NULL,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  CONSTRAINT uce_user_series_unique UNIQUE (user_id, series_id),
  CONSTRAINT uce_valid_window_check CHECK (valid_until > starts_at)
);

CREATE INDEX IF NOT EXISTS idx_uce_user_status_valid
  ON public.user_course_entitlements (user_id, status, valid_until);
CREATE INDEX IF NOT EXISTS idx_uce_series_status
  ON public.user_course_entitlements (series_id, status);
CREATE INDEX IF NOT EXISTS idx_uce_payment_id
  ON public.user_course_entitlements (payment_id);
CREATE INDEX IF NOT EXISTS idx_uce_granted_by
  ON public.user_course_entitlements (granted_by);

ALTER TABLE public.user_course_entitlements ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Users and admins can view course entitlements" ON public.user_course_entitlements;
CREATE POLICY "Users and admins can view course entitlements"
  ON public.user_course_entitlements
  FOR SELECT
  TO authenticated
  USING (((SELECT auth.uid()) = user_id) OR (SELECT public.is_admin()));

DROP POLICY IF EXISTS "Admins can insert course entitlements" ON public.user_course_entitlements;
CREATE POLICY "Admins can insert course entitlements"
  ON public.user_course_entitlements
  FOR INSERT
  TO authenticated
  WITH CHECK ((SELECT public.is_admin()));

DROP POLICY IF EXISTS "Admins can update course entitlements" ON public.user_course_entitlements;
CREATE POLICY "Admins can update course entitlements"
  ON public.user_course_entitlements
  FOR UPDATE
  TO authenticated
  USING ((SELECT public.is_admin()))
  WITH CHECK ((SELECT public.is_admin()));

DROP POLICY IF EXISTS "Admins can delete course entitlements" ON public.user_course_entitlements;
CREATE POLICY "Admins can delete course entitlements"
  ON public.user_course_entitlements
  FOR DELETE
  TO authenticated
  USING ((SELECT public.is_admin()));

-- 6. SECURITY DEFINER RPCs for Student UPI Requests & Admin Student-ID Fulfillment
CREATE OR REPLACE FUNCTION public.submit_course_payment_request(
  p_series_id uuid,
  p_upi_reference text
)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, pg_temp
AS $$
DECLARE
  v_uid uuid := auth.uid();
  v_upi_clean text;
  v_student_id text;
  v_series record;
  v_existing_pending uuid;
  v_order_code text;
  v_validity_days integer;
  v_target_route text;
  v_payment_id uuid;
  v_created_at timestamptz;
BEGIN
  IF v_uid IS NULL THEN
    RAISE EXCEPTION 'Authentication required to submit a payment request.' USING ERRCODE = '42501';
  END IF;

  v_upi_clean := UPPER(REGEXP_REPLACE(BTRIM(COALESCE(p_upi_reference, '')), '\s+', '', 'g'));
  IF LENGTH(v_upi_clean) < 6 OR LENGTH(v_upi_clean) > 64 OR v_upi_clean !~ '^[A-Z0-9._/-]+$' THEN
    RAISE EXCEPTION 'Enter a valid UPI Transaction Reference / UTR (6 to 64 characters).' USING ERRCODE = '22023';
  END IF;

  SELECT s.id, s.name, s.price_inr, s.is_premium, s.validity_days, s.course_type, s.is_published
  INTO v_series
  FROM public.mock_series s
  WHERE s.id = p_series_id;

  IF NOT FOUND OR COALESCE(v_series.is_published, false) = false THEN
    RAISE EXCEPTION 'Selected course is not available for purchase.' USING ERRCODE = 'P0002';
  END IF;

  IF COALESCE(v_series.price_inr, 0) <= 0 AND COALESCE(v_series.is_premium, false) = false THEN
    RAISE EXCEPTION 'This course is already free and does not require purchase.' USING ERRCODE = '22023';
  END IF;

  SELECT p.student_id
  INTO v_student_id
  FROM public.profiles p
  WHERE p.id = v_uid;

  IF v_student_id IS NULL THEN
    RAISE EXCEPTION 'Student profile could not be verified.' USING ERRCODE = 'P0002';
  END IF;

  SELECT pay.id
  INTO v_existing_pending
  FROM public.payments pay
  WHERE pay.user_id = v_uid
    AND pay.series_id = p_series_id
    AND pay.status = 'pending_verification'
  LIMIT 1;

  IF v_existing_pending IS NOT NULL THEN
    RAISE EXCEPTION 'A payment verification request is already pending for this course.' USING ERRCODE = '23505';
  END IF;

  v_validity_days := GREATEST(1, LEAST(3650, COALESCE(v_series.validity_days, 365)));
  v_target_route := '/mcqs/test-series/series/' || v_series.id::text;
  v_order_code := 'MF-' || to_char(timezone('UTC', now()), 'YYMMDD') || '-' || upper(substr(replace(gen_random_uuid()::text, '-', ''), 1, 6));

  INSERT INTO public.payments (
    user_id,
    razorpay_payment_id,
    razorpay_order_id,
    order_code,
    amount,
    currency,
    status,
    plan_purchased,
    series_id,
    course_type,
    target_route,
    validity_days,
    payment_method,
    upi_reference,
    student_id_snapshot
  )
  VALUES (
    v_uid,
    NULL,
    v_order_code,
    v_order_code,
    GREATEST(0, COALESCE(v_series.price_inr, 0)),
    'INR',
    'pending_verification',
    v_series.name,
    v_series.id,
    COALESCE(v_series.course_type, 'mock_series'),
    v_target_route,
    v_validity_days,
    'upi_manual',
    v_upi_clean,
    v_student_id
  )
  RETURNING id, created_at INTO v_payment_id, v_created_at;

  RETURN jsonb_build_object(
    'ok', true,
    'payment_id', v_payment_id,
    'order_code', v_order_code,
    'status', 'pending_verification',
    'student_id', v_student_id,
    'amount_inr', GREATEST(0, COALESCE(v_series.price_inr, 0)),
    'series_id', v_series.id,
    'series_name', v_series.name,
    'target_route', v_target_route,
    'validity_days', v_validity_days,
    'upi_reference', v_upi_clean,
    'created_at', v_created_at
  );
END;
$$;

REVOKE ALL ON FUNCTION public.submit_course_payment_request(uuid, text) FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.submit_course_payment_request(uuid, text) TO authenticated;

CREATE OR REPLACE FUNCTION public.lookup_student_for_enrollment(
  p_student_id text
)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, pg_temp
AS $$
DECLARE
  v_clean_id text;
  v_profile record;
  v_entitlements jsonb;
BEGIN
  IF NOT (SELECT public.is_admin()) THEN
    RAISE EXCEPTION 'Only administrators can look up student enrollment accounts.' USING ERRCODE = '42501';
  END IF;

  v_clean_id := UPPER(BTRIM(COALESCE(p_student_id, '')));
  IF v_clean_id = '' THEN
    RETURN jsonb_build_object('found', false, 'profile', NULL, 'entitlements', '[]'::jsonb);
  END IF;

  SELECT p.id, p.student_id, p.full_name, p.email, p.target_exam, p.created_at
  INTO v_profile
  FROM public.profiles p
  WHERE UPPER(p.student_id) = v_clean_id
  LIMIT 1;

  IF NOT FOUND THEN
    RETURN jsonb_build_object('found', false, 'profile', NULL, 'entitlements', '[]'::jsonb);
  END IF;

  SELECT COALESCE(
    jsonb_agg(
      jsonb_build_object(
        'id', uce.id,
        'series_id', uce.series_id,
        'series_name', ms.name,
        'course_type', uce.course_type,
        'status', uce.status,
        'starts_at', uce.starts_at,
        'valid_until', uce.valid_until
      )
      ORDER BY uce.valid_until DESC
    ),
    '[]'::jsonb
  )
  INTO v_entitlements
  FROM public.user_course_entitlements uce
  LEFT JOIN public.mock_series ms ON ms.id = uce.series_id
  WHERE uce.user_id = v_profile.id;

  RETURN jsonb_build_object(
    'found', true,
    'profile', jsonb_build_object(
      'id', v_profile.id,
      'student_id', v_profile.student_id,
      'full_name', v_profile.full_name,
      'email', v_profile.email,
      'target_exam', v_profile.target_exam,
      'created_at', v_profile.created_at
    ),
    'entitlements', v_entitlements
  );
END;
$$;

REVOKE ALL ON FUNCTION public.lookup_student_for_enrollment(text) FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.lookup_student_for_enrollment(text) TO authenticated;

CREATE OR REPLACE FUNCTION public.admin_activate_course_entitlement(
  p_student_id text,
  p_series_id uuid,
  p_validity_days integer DEFAULT NULL,
  p_payment_id uuid DEFAULT NULL,
  p_admin_note text DEFAULT NULL
)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, pg_temp
AS $$
DECLARE
  v_admin_uid uuid := auth.uid();
  v_clean_id text;
  v_profile record;
  v_series record;
  v_payment record;
  v_existing_valid_until timestamptz;
  v_now timestamptz := now();
  v_days integer;
  v_valid_until timestamptz;
  v_target_route text;
  v_order_code text;
  v_payment_id uuid;
  v_entitlement_id uuid;
  v_clean_note text := NULLIF(BTRIM(COALESCE(p_admin_note, '')), '');
BEGIN
  IF v_admin_uid IS NULL OR NOT (SELECT public.is_admin()) THEN
    RAISE EXCEPTION 'Only administrators can activate course entitlements.' USING ERRCODE = '42501';
  END IF;

  v_clean_id := UPPER(BTRIM(COALESCE(p_student_id, '')));
  IF v_clean_id = '' THEN
    RAISE EXCEPTION 'Student ID is required.' USING ERRCODE = '22023';
  END IF;

  SELECT p.id, p.student_id, p.full_name, p.email
  INTO v_profile
  FROM public.profiles p
  WHERE UPPER(p.student_id) = v_clean_id
  LIMIT 1;

  IF NOT FOUND THEN
    RAISE EXCEPTION 'No student found with Student ID %.', v_clean_id USING ERRCODE = 'P0002';
  END IF;

  SELECT s.id, s.name, s.price_inr, s.validity_days, s.course_type
  INTO v_series
  FROM public.mock_series s
  WHERE s.id = p_series_id;

  IF NOT FOUND THEN
    RAISE EXCEPTION 'Course series not found.' USING ERRCODE = 'P0002';
  END IF;

  v_days := GREATEST(1, LEAST(3650, COALESCE(p_validity_days, v_series.validity_days, 365)));
  v_target_route := '/mcqs/test-series/series/' || v_series.id::text;

  SELECT uce.valid_until
  INTO v_existing_valid_until
  FROM public.user_course_entitlements uce
  WHERE uce.user_id = v_profile.id
    AND uce.series_id = v_series.id
    AND uce.status = 'active';

  v_valid_until := GREATEST(COALESCE(v_existing_valid_until, v_now), v_now) + make_interval(days => v_days);

  IF p_payment_id IS NOT NULL THEN
    SELECT pay.id, pay.user_id, pay.order_code, pay.series_id
    INTO v_payment
    FROM public.payments pay
    WHERE pay.id = p_payment_id;

    IF NOT FOUND THEN
      RAISE EXCEPTION 'Payment request not found.' USING ERRCODE = 'P0002';
    END IF;

    IF v_payment.user_id IS DISTINCT FROM v_profile.id THEN
      RAISE EXCEPTION 'Payment request belongs to a different student account.' USING ERRCODE = '22023';
    END IF;

    v_order_code := COALESCE(
      v_payment.order_code,
      'MF-' || to_char(timezone('UTC', v_now), 'YYMMDD') || '-' || upper(substr(replace(v_payment.id::text, '-', ''), 1, 6))
    );

    UPDATE public.payments
    SET
      status = 'paid',
      order_code = v_order_code,
      razorpay_order_id = COALESCE(razorpay_order_id, v_order_code),
      series_id = v_series.id,
      course_type = COALESCE(v_series.course_type, 'mock_series'),
      plan_purchased = COALESCE(NULLIF(BTRIM(plan_purchased), ''), v_series.name),
      target_route = v_target_route,
      validity_days = v_days,
      valid_until = v_valid_until,
      student_id_snapshot = v_profile.student_id,
      granted_by = v_admin_uid,
      admin_note = COALESCE(v_clean_note, admin_note)
    WHERE id = v_payment.id;

    v_payment_id := v_payment.id;
  ELSE
    v_order_code := 'MF-ADM-' || to_char(timezone('UTC', v_now), 'YYMMDD') || '-' || upper(substr(replace(gen_random_uuid()::text, '-', ''), 1, 6));

    INSERT INTO public.payments (
      user_id,
      razorpay_payment_id,
      razorpay_order_id,
      order_code,
      amount,
      currency,
      status,
      plan_purchased,
      series_id,
      course_type,
      target_route,
      validity_days,
      valid_until,
      payment_method,
      student_id_snapshot,
      granted_by,
      admin_note
    )
    VALUES (
      v_profile.id,
      NULL,
      v_order_code,
      v_order_code,
      GREATEST(0, COALESCE(v_series.price_inr, 0)),
      'INR',
      'paid',
      v_series.name,
      v_series.id,
      COALESCE(v_series.course_type, 'mock_series'),
      v_target_route,
      v_days,
      v_valid_until,
      'admin_grant',
      v_profile.student_id,
      v_admin_uid,
      COALESCE(v_clean_note, 'Activated by Admin via Student ID')
    )
    RETURNING id INTO v_payment_id;
  END IF;

  INSERT INTO public.user_course_entitlements (
    user_id,
    student_id_snapshot,
    series_id,
    course_type,
    target_route,
    payment_id,
    status,
    starts_at,
    valid_until,
    granted_by,
    updated_at
  )
  VALUES (
    v_profile.id,
    v_profile.student_id,
    v_series.id,
    COALESCE(v_series.course_type, 'mock_series'),
    v_target_route,
    v_payment_id,
    'active',
    v_now,
    v_valid_until,
    v_admin_uid,
    v_now
  )
  ON CONFLICT (user_id, series_id) DO UPDATE SET
    student_id_snapshot = EXCLUDED.student_id_snapshot,
    course_type = EXCLUDED.course_type,
    target_route = EXCLUDED.target_route,
    payment_id = EXCLUDED.payment_id,
    status = 'active',
    starts_at = EXCLUDED.starts_at,
    valid_until = EXCLUDED.valid_until,
    granted_by = EXCLUDED.granted_by,
    updated_at = v_now
  RETURNING id INTO v_entitlement_id;

  RETURN jsonb_build_object(
    'ok', true,
    'entitlement_id', v_entitlement_id,
    'payment_id', v_payment_id,
    'order_code', v_order_code,
    'user_id', v_profile.id,
    'student_id', v_profile.student_id,
    'full_name', v_profile.full_name,
    'series_id', v_series.id,
    'series_name', v_series.name,
    'target_route', v_target_route,
    'starts_at', v_now,
    'valid_until', v_valid_until,
    'validity_days', v_days
  );
END;
$$;

REVOKE ALL ON FUNCTION public.admin_activate_course_entitlement(text, uuid, integer, uuid, text) FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.admin_activate_course_entitlement(text, uuid, integer, uuid, text) TO authenticated;

CREATE OR REPLACE FUNCTION public.admin_reject_course_payment_request(
  p_payment_id uuid,
  p_admin_note text DEFAULT NULL
)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, pg_temp
AS $$
DECLARE
  v_admin_uid uuid := auth.uid();
  v_clean_note text := NULLIF(BTRIM(COALESCE(p_admin_note, '')), '');
  v_updated_id uuid;
BEGIN
  IF v_admin_uid IS NULL OR NOT (SELECT public.is_admin()) THEN
    RAISE EXCEPTION 'Only administrators can reject payment requests.' USING ERRCODE = '42501';
  END IF;

  UPDATE public.payments
  SET
    status = 'rejected',
    granted_by = v_admin_uid,
    admin_note = COALESCE(v_clean_note, 'UPI payment reference could not be verified')
  WHERE id = p_payment_id
    AND status = 'pending_verification'
  RETURNING id INTO v_updated_id;

  IF v_updated_id IS NULL THEN
    RAISE EXCEPTION 'Pending payment verification request not found.' USING ERRCODE = 'P0002';
  END IF;

  RETURN jsonb_build_object(
    'ok', true,
    'payment_id', v_updated_id,
    'status', 'rejected'
  );
END;
$$;

REVOKE ALL ON FUNCTION public.admin_reject_course_payment_request(uuid, text) FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.admin_reject_course_payment_request(uuid, text) TO authenticated;
