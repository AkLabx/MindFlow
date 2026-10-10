-- Create App UI Config Table
CREATE TABLE IF NOT EXISTS public.app_ui_config (
    id integer PRIMARY KEY DEFAULT 1,
    version integer NOT NULL DEFAULT 1,
    intro jsonb NOT NULL DEFAULT '{}'::jsonb,
    theme jsonb NOT NULL DEFAULT '{}'::jsonb,
    loading jsonb NOT NULL DEFAULT '{}'::jsonb,
    dashboard jsonb NOT NULL DEFAULT '{}'::jsonb,
    branding jsonb NOT NULL DEFAULT '{}'::jsonb,
    updated_at timestamp with time zone DEFAULT now(),
    updated_by uuid REFERENCES auth.users(id),

    -- Ensure only one row ever exists (Singleton pattern)
    CONSTRAINT ensure_single_row CHECK (id = 1)
);

-- Enable RLS
ALTER TABLE public.app_ui_config ENABLE ROW LEVEL SECURITY;

-- Add RLS Policies
-- Anyone can read the config
CREATE POLICY "Public read access for app_ui_config"
    ON public.app_ui_config
    FOR SELECT
    USING (true);

-- Only admins can update the config
CREATE POLICY "Admin write access for app_ui_config"
    ON public.app_ui_config
    FOR UPDATE
    USING (auth.jwt()->>'email' = 'admin@mindflow.com');

CREATE POLICY "Admin insert access for app_ui_config"
    ON public.app_ui_config
    FOR INSERT
    WITH CHECK (auth.jwt()->>'email' = 'admin@mindflow.com');


-- Trigger to auto-increment version and updated_at
CREATE OR REPLACE FUNCTION public.handle_app_ui_config_update()
RETURNS TRIGGER AS $$
BEGIN
    NEW.version = OLD.version + 1;
    NEW.updated_at = now();
    NEW.updated_by = auth.uid();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Drop trigger if it exists
DROP TRIGGER IF EXISTS on_app_ui_config_update ON public.app_ui_config;

CREATE TRIGGER on_app_ui_config_update
    BEFORE UPDATE ON public.app_ui_config
    FOR EACH ROW
    EXECUTE FUNCTION public.handle_app_ui_config_update();

-- Seed initial row
INSERT INTO public.app_ui_config (
    id,
    version,
    intro
) VALUES (
    1,
    1,
    '{"active": "blue", "duration": 2000, "skipDelay": 3000, "enabled": true}'::jsonb
)
ON CONFLICT (id) DO NOTHING;
