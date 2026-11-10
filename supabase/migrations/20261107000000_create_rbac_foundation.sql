-- ============================================================================
-- Phase 1: Enterprise RBAC Foundation, Schema, Constraints & Seed Backfill
-- Target: PostgreSQL 17 / Supabase
-- Standards: Idempotent, STABLE, SECURITY DEFINER, search_path = public
-- ============================================================================

SET statement_timeout = '10s';
SET lock_timeout = '2s';

-- 1. Idempotent App Role Enum Creation
DO $$ BEGIN
    CREATE TYPE public.app_role AS ENUM (
        'super_admin',
        'admin',
        'moderator',
        'content_creator',
        'teacher',
        'student'
    );
EXCEPTION
    WHEN duplicate_object THEN NULL;
END $$;

-- 2. Authoritative user_roles Junction Table
CREATE TABLE IF NOT EXISTS public.user_roles (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    role public.app_role NOT NULL,
    assigned_by UUID REFERENCES auth.users(id) ON DELETE SET NULL,
    created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    CONSTRAINT user_roles_user_role_unique UNIQUE (user_id, role)
);

-- Performance Indexes
CREATE INDEX IF NOT EXISTS idx_user_roles_assigned_by ON public.user_roles(assigned_by);
CREATE INDEX IF NOT EXISTS idx_user_roles_role ON public.user_roles(role);

-- 3. Row-Level Security for public.user_roles
ALTER TABLE public.user_roles ENABLE ROW LEVEL SECURITY;

-- 4. High-Performance Authorization Functions

-- 4a. Global is_admin() Function (authoritative user_roles check)
CREATE OR REPLACE FUNCTION public.is_admin()
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public, pg_temp
AS $$
    SELECT EXISTS (
        SELECT 1
        FROM public.user_roles
        WHERE user_id = (SELECT auth.uid())
          AND role IN ('super_admin'::public.app_role, 'admin'::public.app_role)
    );
$$;

-- 4b. Primary has_role(required_role) Function
CREATE OR REPLACE FUNCTION public.has_role(required_role public.app_role)
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public, pg_temp
AS $$
    SELECT EXISTS (
        SELECT 1
        FROM public.user_roles
        WHERE user_id = (SELECT auth.uid())
          AND (role = required_role OR role = 'super_admin'::public.app_role)
    );
$$;

-- 4c. Overload has_role(user_id, required_role)
CREATE OR REPLACE FUNCTION public.has_role(user_id uuid, required_role public.app_role)
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public, pg_temp
AS $$
    SELECT (
        has_role.user_id = (SELECT auth.uid())
        OR (SELECT current_user) IN ('postgres', 'service_role', 'supabase_admin')
        OR EXISTS (
            SELECT 1
            FROM public.user_roles admin_ur
            WHERE admin_ur.user_id = (SELECT auth.uid())
              AND admin_ur.role IN ('super_admin'::public.app_role, 'admin'::public.app_role)
        )
    )
    AND EXISTS (
        SELECT 1
        FROM public.user_roles ur
        WHERE ur.user_id = has_role.user_id
          AND (ur.role = required_role OR ur.role = 'super_admin'::public.app_role)
    );
$$;

-- 4d. Overload has_role(required_role text) with Safe Exception Handling
CREATE OR REPLACE FUNCTION public.has_role(required_role text)
RETURNS boolean
LANGUAGE plpgsql
STABLE
SECURITY DEFINER
SET search_path = public, pg_temp
AS $$
BEGIN
    RETURN public.has_role(required_role::public.app_role);
EXCEPTION
    WHEN invalid_text_representation THEN
        RETURN false;
END;
$$;

-- 4e. Overload has_role(user_id uuid, required_role text) with Safe Exception Handling
CREATE OR REPLACE FUNCTION public.has_role(user_id uuid, required_role text)
RETURNS boolean
LANGUAGE plpgsql
STABLE
SECURITY DEFINER
SET search_path = public, pg_temp
AS $$
BEGIN
    RETURN public.has_role(user_id, required_role::public.app_role);
EXCEPTION
    WHEN invalid_text_representation THEN
        RETURN false;
END;
$$;

-- 4f. Fetch Session Roles Array
CREATE OR REPLACE FUNCTION public.get_my_roles()
RETURNS public.app_role[]
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public, pg_temp
AS $$
    SELECT coalesce(
        array_agg(role ORDER BY role),
        ARRAY[]::public.app_role[]
    )
    FROM public.user_roles
    WHERE user_id = (SELECT auth.uid());
$$;

-- 5. RLS Policies on public.user_roles
DROP POLICY IF EXISTS "Users can view own roles" ON public.user_roles;
CREATE POLICY "Users can view own roles"
ON public.user_roles FOR SELECT
TO authenticated
USING (
    user_id = (SELECT auth.uid()) 
    OR (SELECT public.has_role('super_admin'::public.app_role))
);

DROP POLICY IF EXISTS "Super admins can insert user roles" ON public.user_roles;
CREATE POLICY "Super admins can insert user roles"
ON public.user_roles FOR INSERT
TO authenticated
WITH CHECK ((SELECT public.has_role('super_admin'::public.app_role)));

DROP POLICY IF EXISTS "Super admins can update user roles" ON public.user_roles;
CREATE POLICY "Super admins can update user roles"
ON public.user_roles FOR UPDATE
TO authenticated
USING ((SELECT public.has_role('super_admin'::public.app_role)))
WITH CHECK ((SELECT public.has_role('super_admin'::public.app_role)));

DROP POLICY IF EXISTS "Super admins can delete user roles" ON public.user_roles;
CREATE POLICY "Super admins can delete user roles"
ON public.user_roles FOR DELETE
TO authenticated
USING ((SELECT public.has_role('super_admin'::public.app_role)));

-- 6. Grant Permissions for Helper Functions
REVOKE EXECUTE ON FUNCTION public.is_admin() FROM PUBLIC, anon;
REVOKE EXECUTE ON FUNCTION public.has_role(public.app_role) FROM PUBLIC, anon;
REVOKE EXECUTE ON FUNCTION public.has_role(uuid, public.app_role) FROM PUBLIC, anon;
REVOKE EXECUTE ON FUNCTION public.has_role(text) FROM PUBLIC, anon;
REVOKE EXECUTE ON FUNCTION public.has_role(uuid, text) FROM PUBLIC, anon;
REVOKE EXECUTE ON FUNCTION public.get_my_roles() FROM PUBLIC, anon;

GRANT EXECUTE ON FUNCTION public.is_admin() TO authenticated;
GRANT EXECUTE ON FUNCTION public.has_role(public.app_role) TO authenticated;
GRANT EXECUTE ON FUNCTION public.has_role(uuid, public.app_role) TO authenticated;
GRANT EXECUTE ON FUNCTION public.has_role(text) TO authenticated;
GRANT EXECUTE ON FUNCTION public.has_role(uuid, text) TO authenticated;
GRANT EXECUTE ON FUNCTION public.get_my_roles() TO authenticated;

-- 7. Idempotent Seed Backfill for Initial Super Admin
INSERT INTO public.user_roles (user_id, role, assigned_by)
SELECT 
    id AS user_id,
    r.role::public.app_role,
    id AS assigned_by
FROM auth.users
CROSS JOIN (
    VALUES ('super_admin'::public.app_role), ('admin'::public.app_role)
) AS r(role)
WHERE email = 'admin@mindflow.com'
ON CONFLICT (user_id, role) DO NOTHING;
