-- ============================================================================
-- MindFlow v1.0.384 Migration
-- 1. Student ID (MIND-) & Order Code (ORD-) Rebrand
-- 2. Course Bundle Mapping (mock_series_bundle_items) & Polymorphic target_route
-- 3. Structured Shift Metadata (shift_slot, shift_timing) on public.mock_tests
-- ============================================================================

-- ----------------------------------------------------------------------------
-- a) Student ID (MIND-) Rebrand on public.profiles, payments, entitlements
-- ----------------------------------------------------------------------------
ALTER TABLE public.profiles
  DISABLE TRIGGER trg_profiles_student_id_immutable;

ALTER TABLE public.profiles
  DROP CONSTRAINT IF EXISTS profiles_student_id_format_check;

UPDATE public.profiles
SET student_id = regexp_replace(student_id, '^MF-', 'MIND-')
WHERE student_id ~ '^MF-';

UPDATE public.payments
SET student_id_snapshot = regexp_replace(student_id_snapshot, '^MF-', 'MIND-')
WHERE student_id_snapshot ~ '^MF-';

UPDATE public.user_course_entitlements
SET student_id_snapshot = regexp_replace(student_id_snapshot, '^MF-', 'MIND-')
WHERE student_id_snapshot ~ '^MF-';

SELECT setval(
  'public.student_id_seq',
  GREATEST(
    100000,
    COALESCE(
      (
        SELECT MAX(substring(student_id FROM '^(?:MIND|MF)-([0-9]+)$')::bigint)
        FROM public.profiles
        WHERE student_id ~ '^(?:MIND|MF)-[0-9]+$'
      ),
      100000
    )
  ),
  true
);

ALTER TABLE public.profiles
  ADD CONSTRAINT profiles_student_id_format_check CHECK (student_id ~ '^MIND-[0-9]{6,}$');

CREATE OR REPLACE FUNCTION public.trg_fn_profiles_student_id()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, pg_temp
AS $$
BEGIN
  IF TG_OP = 'INSERT' THEN
    IF NEW.student_id IS NULL OR BTRIM(NEW.student_id) = '' THEN
      NEW.student_id := 'MIND-' || LPAD(nextval('public.student_id_seq')::text, 6, '0');
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
      NEW.student_id := 'MIND-' || LPAD(nextval('public.student_id_seq')::text, 6, '0');
    END IF;
    RETURN NEW;
  END IF;

  RETURN NEW;
END;
$$;

REVOKE ALL ON FUNCTION public.trg_fn_profiles_student_id() FROM PUBLIC, anon, authenticated;

ALTER TABLE public.profiles
  ENABLE TRIGGER trg_profiles_student_id_immutable;

-- ----------------------------------------------------------------------------
-- b) Course Bundle Mapping & Target Route
-- ----------------------------------------------------------------------------
ALTER TABLE public.mock_series
  ADD COLUMN IF NOT EXISTS target_route text;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint
    WHERE conrelid = 'public.mock_series'::regclass
      AND conname = 'mock_series_target_route_check'
  ) THEN
    ALTER TABLE public.mock_series
      ADD CONSTRAINT mock_series_target_route_check CHECK (
        target_route IS NULL OR (target_route LIKE '/%' AND target_route NOT LIKE '//%')
      );
  END IF;
END $$;

CREATE TABLE IF NOT EXISTS public.mock_series_bundle_items (
  bundle_series_id uuid NOT NULL REFERENCES public.mock_series(id) ON DELETE CASCADE,
  child_series_id uuid NOT NULL REFERENCES public.mock_series(id) ON DELETE CASCADE,
  display_order integer NOT NULL DEFAULT 0,
  created_at timestamptz NOT NULL DEFAULT now(),
  PRIMARY KEY (bundle_series_id, child_series_id),
  CONSTRAINT msbi_no_self_bundle_check CHECK (bundle_series_id <> child_series_id)
);

CREATE INDEX IF NOT EXISTS idx_msbi_child_series_id
  ON public.mock_series_bundle_items (child_series_id);

ALTER TABLE public.mock_series_bundle_items ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Authenticated users can view published bundle items" ON public.mock_series_bundle_items;
CREATE POLICY "Authenticated users can view published bundle items"
  ON public.mock_series_bundle_items
  FOR SELECT
  TO authenticated
  USING (
    (SELECT public.is_admin())
    OR EXISTS (
      SELECT 1
      FROM public.mock_series ms
      WHERE ms.id = bundle_series_id
        AND ms.is_published = true
    )
  );

DROP POLICY IF EXISTS "Admins can insert bundle items" ON public.mock_series_bundle_items;
CREATE POLICY "Admins can insert bundle items"
  ON public.mock_series_bundle_items
  FOR INSERT
  TO authenticated
  WITH CHECK ((SELECT public.is_admin()));

DROP POLICY IF EXISTS "Admins can update bundle items" ON public.mock_series_bundle_items;
CREATE POLICY "Admins can update bundle items"
  ON public.mock_series_bundle_items
  FOR UPDATE
  TO authenticated
  USING ((SELECT public.is_admin()))
  WITH CHECK ((SELECT public.is_admin()));

DROP POLICY IF EXISTS "Admins can delete bundle items" ON public.mock_series_bundle_items;
CREATE POLICY "Admins can delete bundle items"
  ON public.mock_series_bundle_items
  FOR DELETE
  TO authenticated
  USING ((SELECT public.is_admin()));

-- ----------------------------------------------------------------------------
-- Updated RPCs: ORD- order codes + safe polymorphic target_route
-- ----------------------------------------------------------------------------
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
  v_clean_route text;
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

  SELECT s.id, s.name, s.price_inr, s.is_premium, s.validity_days, s.course_type, s.is_published, s.target_route
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

  PERFORM pg_advisory_xact_lock(hashtext('upi_ref:' || v_upi_clean));
  PERFORM pg_advisory_xact_lock(hashtext('pay_req:' || v_uid::text || ':' || p_series_id::text));

  IF EXISTS (
    SELECT 1
    FROM public.payments pay
    WHERE pay.upi_reference IS NOT NULL
      AND UPPER(REGEXP_REPLACE(BTRIM(pay.upi_reference), '\s+', '', 'g')) = v_upi_clean
      AND pay.status IN ('pending_verification', 'paid')
  ) THEN
    RAISE EXCEPTION 'This UPI Reference / UTR has already been submitted.' USING ERRCODE = '23505';
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
  v_clean_route := NULLIF(BTRIM(COALESCE(v_series.target_route, '')), '');
  IF v_clean_route IS NOT NULL AND v_clean_route LIKE '/%' AND v_clean_route NOT LIKE '//%' THEN
    v_target_route := v_clean_route;
  ELSE
    v_target_route := '/mcqs/test-series/series/' || v_series.id::text;
  END IF;
  v_order_code := 'ORD-' || to_char(timezone('UTC', now()), 'YYMMDD') || '-' || upper(substr(replace(gen_random_uuid()::text, '-', ''), 1, 6));

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
  v_clean_route text;
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

  SELECT s.id, s.name, s.price_inr, s.validity_days, s.course_type, s.target_route
  INTO v_series
  FROM public.mock_series s
  WHERE s.id = p_series_id;

  IF NOT FOUND THEN
    RAISE EXCEPTION 'Course series not found.' USING ERRCODE = 'P0002';
  END IF;

  v_days := GREATEST(1, LEAST(3650, COALESCE(p_validity_days, v_series.validity_days, 365)));
  v_clean_route := NULLIF(BTRIM(COALESCE(v_series.target_route, '')), '');
  IF v_clean_route IS NOT NULL AND v_clean_route LIKE '/%' AND v_clean_route NOT LIKE '//%' THEN
    v_target_route := v_clean_route;
  ELSE
    v_target_route := '/mcqs/test-series/series/' || v_series.id::text;
  END IF;

  PERFORM pg_advisory_xact_lock(hashtext('entitlement:' || v_profile.id::text || ':' || v_series.id::text));

  IF p_payment_id IS NOT NULL THEN
    SELECT pay.id, pay.user_id, pay.order_code, pay.series_id, pay.status
    INTO v_payment
    FROM public.payments pay
    WHERE pay.id = p_payment_id
    FOR UPDATE;

    IF NOT FOUND THEN
      RAISE EXCEPTION 'Payment request not found.' USING ERRCODE = 'P0002';
    END IF;

    IF v_payment.user_id IS DISTINCT FROM v_profile.id THEN
      RAISE EXCEPTION 'Payment request belongs to a different student account.' USING ERRCODE = '22023';
    END IF;

    IF COALESCE(v_payment.status, '') <> 'pending_verification' THEN
      RAISE EXCEPTION 'This payment request has already been processed and cannot be re-activated.' USING ERRCODE = '23505';
    END IF;

    IF v_payment.series_id IS NOT NULL AND v_payment.series_id IS DISTINCT FROM v_series.id THEN
      RAISE EXCEPTION 'Payment request belongs to a different course series.' USING ERRCODE = '22023';
    END IF;
  END IF;

  SELECT uce.valid_until
  INTO v_existing_valid_until
  FROM public.user_course_entitlements uce
  WHERE uce.user_id = v_profile.id
    AND uce.series_id = v_series.id
    AND uce.status = 'active'
  FOR UPDATE;

  v_valid_until := GREATEST(COALESCE(v_existing_valid_until, v_now), v_now) + make_interval(days => v_days);

  IF p_payment_id IS NOT NULL THEN
    v_order_code := COALESCE(
      NULLIF(BTRIM(v_payment.order_code), ''),
      'ORD-' || to_char(timezone('UTC', v_now), 'YYMMDD') || '-' || upper(substr(replace(v_payment.id::text, '-', ''), 1, 6))
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
    v_order_code := 'ORD-ADM-' || to_char(timezone('UTC', v_now), 'YYMMDD') || '-' || upper(substr(replace(gen_random_uuid()::text, '-', ''), 1, 6));

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

-- ----------------------------------------------------------------------------
-- c) Structured Shift Metadata on public.mock_tests + deterministic SSC backfill
-- ----------------------------------------------------------------------------
ALTER TABLE public.mock_tests
  ADD COLUMN IF NOT EXISTS shift_slot text,
  ADD COLUMN IF NOT EXISTS shift_timing text;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint
    WHERE conrelid = 'public.mock_tests'::regclass
      AND conname = 'mock_tests_shift_slot_check'
  ) THEN
    ALTER TABLE public.mock_tests
      ADD CONSTRAINT mock_tests_shift_slot_check CHECK (
        shift_slot IS NULL OR shift_slot IN ('morning', 'afternoon', 'evening')
      );
  END IF;
END $$;

WITH ssc_pyq_candidates AS (
  SELECT
    mt.id,
    mt.name,
    mt.description,
    COALESCE(mt.name, '') || ' ' || COALESCE(mt.description, '') AS haystack
  FROM public.mock_tests mt
  LEFT JOIN public.mock_series ms ON ms.id = mt.series_id
  WHERE (
    mt.test_type = 'PYQ'
    OR mt.name ~* 'SSC\s*CGL'
    OR COALESCE(mt.description, '') ~* 'SSC\s*CGL'
    OR ms.series_type = 'PYQ'
    OR COALESCE(ms.name, '') ~* 'SSC\s*CGL'
  )
),
parsed AS (
  SELECT
    id,
    CASE
      WHEN haystack ~* '\mShift[-\s]*1\M'
        OR haystack ~* '\m(08:30|09:00|09:30|10:00|10:30|11:00)\s*AM\M'
        OR haystack ~* '\mMorning\M'
        THEN 'morning'
      WHEN haystack ~* '\mShift[-\s]*2\M'
        OR haystack ~* '\m(12:00|12:30|12:45|01:00|01:30|02:00|02:30|03:00)\s*PM\M'
        OR haystack ~* '\mAfternoon\M'
        THEN 'afternoon'
      WHEN haystack ~* '\mShift[-\s]*(3|4)\M'
        OR haystack ~* '\m(03:30|04:00|04:30|05:00|05:15|05:30|06:00)\s*PM\M'
        OR haystack ~* '\mEvening\M'
        THEN 'evening'
      ELSE NULL
    END AS derived_slot,
    UPPER(
      REGEXP_REPLACE(
        BTRIM(
          COALESCE(
            substring(haystack FROM '([0-9]{1,2}:[0-9]{2}\s*(?:AM|PM)(?:\s*[-–]\s*[0-9]{1,2}:[0-9]{2}\s*(?:AM|PM))?)'),
            ''
          )
        ),
        '\s+',
        ' ',
        'g'
      )
    ) AS extracted_timing
  FROM ssc_pyq_candidates
)
UPDATE public.mock_tests mt
SET
  shift_slot = COALESCE(mt.shift_slot, p.derived_slot),
  shift_timing = COALESCE(
    NULLIF(BTRIM(mt.shift_timing), ''),
    NULLIF(p.extracted_timing, ''),
    CASE p.derived_slot
      WHEN 'morning' THEN '10:00 AM'
      WHEN 'afternoon' THEN '01:30 PM'
      WHEN 'evening' THEN '05:00 PM'
      ELSE NULL
    END
  )
FROM parsed p
WHERE mt.id = p.id
  AND (
    (mt.shift_slot IS NULL AND p.derived_slot IS NOT NULL)
    OR (
      (mt.shift_timing IS NULL OR BTRIM(mt.shift_timing) = '')
      AND (NULLIF(p.extracted_timing, '') IS NOT NULL OR p.derived_slot IS NOT NULL)
    )
  );
