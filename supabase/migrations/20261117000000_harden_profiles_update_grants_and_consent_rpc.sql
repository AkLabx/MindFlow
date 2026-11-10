-- Phase 8 Follow-up: Least-Privilege Column-Level UPDATE Grants on public.profiles & Hardened Consent RPC
-- Fixes 42501 ("permission denied for table profiles") when authenticated users invoke
-- SECURITY INVOKER public.record_user_consent(), update username, or update last_seen,
-- while protecting billing, quota, moderation, and account status columns from direct client tampering.

SET statement_timeout = '30s';
SET lock_timeout = '5s';

-- 1. Enforce least-privilege table & column ACLs on public.profiles
REVOKE INSERT, UPDATE, DELETE, TRUNCATE ON public.profiles FROM PUBLIC, anon;
REVOKE INSERT, UPDATE, DELETE, TRUNCATE ON public.profiles FROM authenticated;

-- Allow authenticated users (and SECURITY INVOKER RPCs) to update ONLY user-owned safe columns
GRANT UPDATE (
    terms_accepted_version,
    terms_accepted_at,
    age_confirmed,
    username,
    last_seen
) ON public.profiles TO authenticated;

-- 2. Scope the self-update RLS policy strictly to authenticated callers
ALTER POLICY "Users can update their own profile."
ON public.profiles
TO authenticated
USING ((SELECT auth.uid()) = id)
WITH CHECK ((SELECT auth.uid()) = id);

-- 3. Harden public.record_user_consent (SECURITY INVOKER) to guarantee row update verification
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

    IF NOT FOUND THEN
        RAISE EXCEPTION 'Profile record not found for authenticated user';
    END IF;
END;
$$;

REVOKE ALL ON FUNCTION public.record_user_consent(text, text) FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.record_user_consent(text, text) TO authenticated;
