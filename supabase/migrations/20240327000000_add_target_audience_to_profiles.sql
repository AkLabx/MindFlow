-- Add target_audience column to public.profiles table
ALTER TABLE public.profiles
ADD COLUMN IF NOT EXISTS target_audience text DEFAULT 'competitive'::text;

-- Comment for the new column
COMMENT ON COLUMN public.profiles.target_audience IS 'Stores the user''s target audience preference: "competitive" or "school"';
