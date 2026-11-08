-- Migration: Add explanation image URL to questions and verify RLS
-- Description: Adds explanation_image_url column for admin image uploads and ensures UPDATE policy exists.

-- 1. Add explanation_image_url column
ALTER TABLE public.questions ADD COLUMN IF NOT EXISTS explanation_image_url TEXT;

-- 2. Add RLS policy for updating questions (ensuring idempotent creation)
-- 20261107000001 modernized the RLS policies and added "Allow admin and content_creator to update questions".
-- In case it's missing or we want an explicit one for images, we use a distinct, safe name.
DROP POLICY IF EXISTS "Allow admin and content_creator to update questions images" ON public.questions;

CREATE POLICY "Allow admin and content_creator to update questions images"
ON public.questions FOR UPDATE
TO authenticated
USING (
    (SELECT public.is_admin())
    OR (SELECT public.has_role('content_creator'::public.app_role))
)
WITH CHECK (
    (SELECT public.is_admin())
    OR (SELECT public.has_role('content_creator'::public.app_role))
);
