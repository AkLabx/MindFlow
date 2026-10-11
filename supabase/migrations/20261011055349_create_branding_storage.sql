-- Create branding storage bucket
INSERT INTO storage.buckets (id, name, public)
VALUES ('branding', 'branding', true)
ON CONFLICT (id) DO NOTHING;

-- Set up RLS policies for the branding bucket
-- Public read access
CREATE POLICY "Public Read Access for Branding"
ON storage.objects FOR SELECT
USING (bucket_id = 'branding');

-- Admin write access (Insert)
CREATE POLICY "Admin Insert Access for Branding"
ON storage.objects FOR INSERT
WITH CHECK (
    bucket_id = 'branding'
    AND (auth.jwt()->>'email' = 'admin@mindflow.com')
);

-- Admin write access (Update)
CREATE POLICY "Admin Update Access for Branding"
ON storage.objects FOR UPDATE
USING (
    bucket_id = 'branding'
    AND (auth.jwt()->>'email' = 'admin@mindflow.com')
);

-- Admin write access (Delete)
CREATE POLICY "Admin Delete Access for Branding"
ON storage.objects FOR DELETE
USING (
    bucket_id = 'branding'
    AND (auth.jwt()->>'email' = 'admin@mindflow.com')
);
