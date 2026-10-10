-- 1. Create is_admin() function
CREATE OR REPLACE FUNCTION public.is_admin()
RETURNS boolean AS $$
BEGIN
  -- For now, hardcode the admin email check.
  -- In the future, this can query a user_roles or profiles table.
  RETURN (auth.jwt() ->> 'email') = 'admin@mindflow.com';
END;
$$ LANGUAGE plpgsql STABLE SECURITY DEFINER SET search_path = public;

-- Grant execute to standard roles
GRANT EXECUTE ON FUNCTION public.is_admin() TO anon, authenticated;

-- 2. Drop existing policies on app_ui_config
DROP POLICY IF EXISTS "Public read access for app_ui_config" ON public.app_ui_config;
DROP POLICY IF EXISTS "Admin write access for app_ui_config" ON public.app_ui_config;
DROP POLICY IF EXISTS "Admin insert access for app_ui_config" ON public.app_ui_config;
DROP POLICY IF EXISTS "Admin update access for app_ui_config" ON public.app_ui_config;
DROP POLICY IF EXISTS "Admin delete access for app_ui_config" ON public.app_ui_config;

-- 3. Recreate policies using the new is_admin() function
CREATE POLICY "Public read access for app_ui_config"
    ON public.app_ui_config
    FOR SELECT
    USING (true);

CREATE POLICY "Admin insert access for app_ui_config"
    ON public.app_ui_config
    FOR INSERT
    WITH CHECK (public.is_admin());

CREATE POLICY "Admin update access for app_ui_config"
    ON public.app_ui_config
    FOR UPDATE
    USING (public.is_admin())
    WITH CHECK (public.is_admin());

CREATE POLICY "Admin delete access for app_ui_config"
    ON public.app_ui_config
    FOR DELETE
    USING (public.is_admin());
