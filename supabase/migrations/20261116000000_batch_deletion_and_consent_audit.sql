-- Phase 8: Batched pg_cron Account Deletion & Consent Audit Trail
SET statement_timeout = '30s';
SET lock_timeout = '5s';

-- 1. Batch pg_cron account deletion (LIMIT 50) to prevent unbounded row locks on auth.users
CREATE OR REPLACE FUNCTION public.delete_scheduled_users()
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, pg_temp
AS $$
BEGIN
    DELETE FROM auth.users
    WHERE id IN (
        SELECT id
        FROM public.profiles
        WHERE status = 'pending_deletion'
          AND delete_requested_at < NOW() - INTERVAL '7 days'
        ORDER BY delete_requested_at ASC
        LIMIT 50
    );
END;
$$;

REVOKE ALL ON FUNCTION public.delete_scheduled_users() FROM PUBLIC, anon, authenticated;
GRANT EXECUTE ON FUNCTION public.delete_scheduled_users() TO postgres, service_role;

-- 2. Add statutory consent audit trail columns to public.profiles
ALTER TABLE public.profiles
    ADD COLUMN IF NOT EXISTS terms_accepted_version text,
    ADD COLUMN IF NOT EXISTS terms_accepted_at timestamp with time zone,
    ADD COLUMN IF NOT EXISTS age_confirmed text;

-- 3. Capture consent metadata during user creation in handle_new_user()
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, pg_temp
AS $$
DECLARE
    v_terms_version text;
    v_terms_at timestamptz;
    v_terms_at_raw text;
    v_age_confirmed text;
BEGIN
    v_terms_version := NULLIF(BTRIM(NEW.raw_user_meta_data->>'terms_accepted_version'), '');
    v_terms_at_raw := NULLIF(BTRIM(NEW.raw_user_meta_data->>'terms_accepted_at'), '');
    v_age_confirmed := NULLIF(BTRIM(NEW.raw_user_meta_data->>'age_confirmed'), '');

    IF v_terms_at_raw IS NOT NULL AND v_terms_at_raw ~ '^\d{4}-\d{2}-\d{2}[T ]\d{2}:\d{2}:\d{2}' THEN
        BEGIN
            v_terms_at := v_terms_at_raw::timestamptz;
        EXCEPTION WHEN OTHERS THEN
            v_terms_at := NOW();
        END;
    ELSIF v_terms_version IS NOT NULL THEN
        v_terms_at := NOW();
    ELSE
        v_terms_at := NULL;
    END IF;

    INSERT INTO public.profiles (
        id,
        full_name,
        avatar_url,
        email,
        bio,
        target_exam,
        phone,
        dob,
        terms_accepted_version,
        terms_accepted_at,
        age_confirmed
    )
    VALUES (
        NEW.id,
        COALESCE(NEW.raw_user_meta_data->>'full_name', NEW.raw_user_meta_data->>'name'),
        COALESCE(NEW.raw_user_meta_data->>'avatar_url', NEW.raw_user_meta_data->>'picture'),
        NEW.email,
        NEW.raw_user_meta_data->>'bio',
        NEW.raw_user_meta_data->>'target_exam',
        NEW.raw_user_meta_data->>'phone',
        NEW.raw_user_meta_data->>'dob',
        v_terms_version,
        v_terms_at,
        v_age_confirmed
    )
    ON CONFLICT (id) DO UPDATE SET
        full_name = COALESCE(EXCLUDED.full_name, public.profiles.full_name),
        avatar_url = COALESCE(EXCLUDED.avatar_url, public.profiles.avatar_url),
        email = COALESCE(EXCLUDED.email, public.profiles.email),
        bio = COALESCE(EXCLUDED.bio, public.profiles.bio),
        target_exam = COALESCE(EXCLUDED.target_exam, public.profiles.target_exam),
        phone = COALESCE(EXCLUDED.phone, public.profiles.phone),
        dob = COALESCE(EXCLUDED.dob, public.profiles.dob),
        terms_accepted_version = COALESCE(EXCLUDED.terms_accepted_version, public.profiles.terms_accepted_version),
        terms_accepted_at = COALESCE(EXCLUDED.terms_accepted_at, public.profiles.terms_accepted_at),
        age_confirmed = COALESCE(EXCLUDED.age_confirmed, public.profiles.age_confirmed);

    RETURN NEW;
END;
$$;

REVOKE ALL ON FUNCTION public.handle_new_user() FROM PUBLIC, anon, authenticated;
GRANT EXECUTE ON FUNCTION public.handle_new_user() TO postgres, service_role;

-- 4. Authenticated RPC (SECURITY INVOKER) to record consent for OAuth signups / updated legal notices
CREATE OR REPLACE FUNCTION public.record_user_consent(
    p_terms_version text,
    p_age_confirmed text
)
RETURNS void
LANGUAGE plpgsql
SECURITY INVOKER
SET search_path = public, pg_temp
AS $$
DECLARE
    v_uid uuid := (SELECT auth.uid());
    v_version text := NULLIF(BTRIM(p_terms_version), '');
    v_age text := NULLIF(BTRIM(p_age_confirmed), '');
BEGIN
    IF v_uid IS NULL THEN
        RAISE EXCEPTION 'Authentication required to record consent';
    END IF;

    IF v_version IS NULL OR v_age IS NULL THEN
        RAISE EXCEPTION 'Valid terms version and age confirmation are required';
    END IF;

    UPDATE public.profiles
    SET
        terms_accepted_version = v_version,
        terms_accepted_at = NOW(),
        age_confirmed = v_age
    WHERE id = v_uid;
END;
$$;

REVOKE ALL ON FUNCTION public.record_user_consent(text, text) FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.record_user_consent(text, text) TO authenticated;
