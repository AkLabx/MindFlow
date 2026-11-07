-- ============================================================================
-- Phase 2: Modernize RLS Policies Across All 18 Tables + Storage Buckets
-- Eliminates hardcoded emails and correlated subqueries
-- Scopes policies TO authenticated, uses cached (SELECT is_admin())
-- ============================================================================

SET statement_timeout = '10s';
SET lock_timeout = '2s';

-- ----------------------------------------------------------------------------
-- 1. Table: public.official_answer_keys (Fixes Linter ERROR: RLS Disabled)
-- ----------------------------------------------------------------------------
ALTER TABLE public.official_answer_keys ENABLE ROW LEVEL SECURITY;

REVOKE TRUNCATE, DELETE, UPDATE, INSERT ON public.official_answer_keys FROM anon;
REVOKE TRUNCATE, DELETE, UPDATE, INSERT ON public.official_answer_keys FROM authenticated;

DROP POLICY IF EXISTS "Public read for official answer keys" ON public.official_answer_keys;
DROP POLICY IF EXISTS "Admin and creator insert for official answer keys" ON public.official_answer_keys;
DROP POLICY IF EXISTS "Admin and creator update for official answer keys" ON public.official_answer_keys;
DROP POLICY IF EXISTS "Admin and creator delete for official answer keys" ON public.official_answer_keys;

CREATE POLICY "Public read for official answer keys"
ON public.official_answer_keys FOR SELECT
TO public
USING (true);

CREATE POLICY "Admin and creator insert for official answer keys"
ON public.official_answer_keys FOR INSERT
TO authenticated
WITH CHECK (
    (SELECT public.is_admin()) 
    OR (SELECT public.has_role('content_creator'::public.app_role))
);

CREATE POLICY "Admin and creator update for official answer keys"
ON public.official_answer_keys FOR UPDATE
TO authenticated
USING (
    (SELECT public.is_admin()) 
    OR (SELECT public.has_role('content_creator'::public.app_role))
)
WITH CHECK (
    (SELECT public.is_admin()) 
    OR (SELECT public.has_role('content_creator'::public.app_role))
);

CREATE POLICY "Admin and creator delete for official answer keys"
ON public.official_answer_keys FOR DELETE
TO authenticated
USING (
    (SELECT public.is_admin()) 
    OR (SELECT public.has_role('content_creator'::public.app_role))
);

-- ----------------------------------------------------------------------------
-- 2. Table: public.app_ui_config
-- ----------------------------------------------------------------------------
DROP POLICY IF EXISTS "Admin delete access for app_ui_config" ON public.app_ui_config;
DROP POLICY IF EXISTS "Admin insert access for app_ui_config" ON public.app_ui_config;
DROP POLICY IF EXISTS "Admin update access for app_ui_config" ON public.app_ui_config;
DROP POLICY IF EXISTS "Public read access for app_ui_config" ON public.app_ui_config;

CREATE POLICY "Public read access for app_ui_config"
ON public.app_ui_config FOR SELECT
TO public
USING (true);

CREATE POLICY "Admin insert access for app_ui_config"
ON public.app_ui_config FOR INSERT
TO authenticated
WITH CHECK ((SELECT public.is_admin()));

CREATE POLICY "Admin update access for app_ui_config"
ON public.app_ui_config FOR UPDATE
TO authenticated
USING ((SELECT public.is_admin()))
WITH CHECK ((SELECT public.is_admin()));

CREATE POLICY "Admin delete access for app_ui_config"
ON public.app_ui_config FOR DELETE
TO authenticated
USING ((SELECT public.is_admin()));

-- ----------------------------------------------------------------------------
-- 3. Table: public.study_materials
-- ----------------------------------------------------------------------------
DROP POLICY IF EXISTS "Admin Delete Access on study_materials" ON public.study_materials;
DROP POLICY IF EXISTS "Admin Insert Access on study_materials" ON public.study_materials;
DROP POLICY IF EXISTS "Admin Update Access on study_materials" ON public.study_materials;
DROP POLICY IF EXISTS "Admin and creator delete access on study_materials" ON public.study_materials;
DROP POLICY IF EXISTS "Admin and creator insert access on study_materials" ON public.study_materials;
DROP POLICY IF EXISTS "Admin and creator update access on study_materials" ON public.study_materials;
DROP POLICY IF EXISTS "Admin and creator view all study_materials" ON public.study_materials;

CREATE POLICY "Admin and creator insert access on study_materials"
ON public.study_materials FOR INSERT
TO authenticated
WITH CHECK (
    (SELECT public.is_admin()) 
    OR (SELECT public.has_role('content_creator'::public.app_role))
);

CREATE POLICY "Admin and creator update access on study_materials"
ON public.study_materials FOR UPDATE
TO authenticated
USING (
    (SELECT public.is_admin()) 
    OR (SELECT public.has_role('content_creator'::public.app_role))
)
WITH CHECK (
    (SELECT public.is_admin()) 
    OR (SELECT public.has_role('content_creator'::public.app_role))
);

CREATE POLICY "Admin and creator delete access on study_materials"
ON public.study_materials FOR DELETE
TO authenticated
USING (
    (SELECT public.is_admin()) 
    OR (SELECT public.has_role('content_creator'::public.app_role))
);

CREATE POLICY "Admin and creator view all study_materials"
ON public.study_materials FOR SELECT
TO authenticated
USING (
    (SELECT public.is_admin()) 
    OR (SELECT public.has_role('content_creator'::public.app_role))
);

-- ----------------------------------------------------------------------------
-- 4. Table: public.questions
-- ----------------------------------------------------------------------------
DROP POLICY IF EXISTS "Allow admin to delete questions" ON public.questions;
DROP POLICY IF EXISTS "Allow admin to insert questions" ON public.questions;
DROP POLICY IF EXISTS "Allow admin to update questions" ON public.questions;
DROP POLICY IF EXISTS "Allow admin and content_creator to insert questions" ON public.questions;
DROP POLICY IF EXISTS "Allow admin and content_creator to update questions" ON public.questions;
DROP POLICY IF EXISTS "Allow admin and content_creator to delete questions" ON public.questions;

CREATE POLICY "Allow admin and content_creator to insert questions"
ON public.questions FOR INSERT
TO authenticated
WITH CHECK (
    (SELECT public.is_admin()) 
    OR (SELECT public.has_role('content_creator'::public.app_role))
);

CREATE POLICY "Allow admin and content_creator to update questions"
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

CREATE POLICY "Allow admin and content_creator to delete questions"
ON public.questions FOR DELETE
TO authenticated
USING (
    (SELECT public.is_admin()) 
    OR (SELECT public.has_role('content_creator'::public.app_role))
);

-- ----------------------------------------------------------------------------
-- 5. Table: public.idiom
-- ----------------------------------------------------------------------------
DROP POLICY IF EXISTS "Allow admin to insert idiom" ON public.idiom;
DROP POLICY IF EXISTS "Allow admin to update idiom" ON public.idiom;
DROP POLICY IF EXISTS "Allow admin to delete idiom" ON public.idiom;
DROP POLICY IF EXISTS "Allow admin and content_creator to insert idiom" ON public.idiom;
DROP POLICY IF EXISTS "Allow admin and content_creator to update idiom" ON public.idiom;
DROP POLICY IF EXISTS "Allow admin and content_creator to delete idiom" ON public.idiom;

CREATE POLICY "Allow admin and content_creator to insert idiom"
ON public.idiom FOR INSERT
TO authenticated
WITH CHECK (
    (SELECT public.is_admin()) 
    OR (SELECT public.has_role('content_creator'::public.app_role))
);

CREATE POLICY "Allow admin and content_creator to update idiom"
ON public.idiom FOR UPDATE
TO authenticated
USING (
    (SELECT public.is_admin()) 
    OR (SELECT public.has_role('content_creator'::public.app_role))
)
WITH CHECK (
    (SELECT public.is_admin()) 
    OR (SELECT public.has_role('content_creator'::public.app_role))
);

CREATE POLICY "Allow admin and content_creator to delete idiom"
ON public.idiom FOR DELETE
TO authenticated
USING (
    (SELECT public.is_admin()) 
    OR (SELECT public.has_role('content_creator'::public.app_role))
);

-- ----------------------------------------------------------------------------
-- 6. Table: public.ows
-- ----------------------------------------------------------------------------
DROP POLICY IF EXISTS "Allow admin to insert ows" ON public.ows;
DROP POLICY IF EXISTS "Allow admin to update ows" ON public.ows;
DROP POLICY IF EXISTS "Allow admin to delete ows" ON public.ows;
DROP POLICY IF EXISTS "Allow admin and content_creator to insert ows" ON public.ows;
DROP POLICY IF EXISTS "Allow admin and content_creator to update ows" ON public.ows;
DROP POLICY IF EXISTS "Allow admin and content_creator to delete ows" ON public.ows;

CREATE POLICY "Allow admin and content_creator to insert ows"
ON public.ows FOR INSERT
TO authenticated
WITH CHECK (
    (SELECT public.is_admin()) 
    OR (SELECT public.has_role('content_creator'::public.app_role))
);

CREATE POLICY "Allow admin and content_creator to update ows"
ON public.ows FOR UPDATE
TO authenticated
USING (
    (SELECT public.is_admin()) 
    OR (SELECT public.has_role('content_creator'::public.app_role))
)
WITH CHECK (
    (SELECT public.is_admin()) 
    OR (SELECT public.has_role('content_creator'::public.app_role))
);

CREATE POLICY "Allow admin and content_creator to delete ows"
ON public.ows FOR DELETE
TO authenticated
USING (
    (SELECT public.is_admin()) 
    OR (SELECT public.has_role('content_creator'::public.app_role))
);

-- ----------------------------------------------------------------------------
-- 7. Table: public.synonym
-- ----------------------------------------------------------------------------
DROP POLICY IF EXISTS "Allow admin to insert synonym" ON public.synonym;
DROP POLICY IF EXISTS "Allow admin to update synonym" ON public.synonym;
DROP POLICY IF EXISTS "Allow admin to delete synonym" ON public.synonym;
DROP POLICY IF EXISTS "Allow admin and content_creator to insert synonym" ON public.synonym;
DROP POLICY IF EXISTS "Allow admin and content_creator to update synonym" ON public.synonym;
DROP POLICY IF EXISTS "Allow admin and content_creator to delete synonym" ON public.synonym;

CREATE POLICY "Allow admin and content_creator to insert synonym"
ON public.synonym FOR INSERT
TO authenticated
WITH CHECK (
    (SELECT public.is_admin()) 
    OR (SELECT public.has_role('content_creator'::public.app_role))
);

CREATE POLICY "Allow admin and content_creator to update synonym"
ON public.synonym FOR UPDATE
TO authenticated
USING (
    (SELECT public.is_admin()) 
    OR (SELECT public.has_role('content_creator'::public.app_role))
)
WITH CHECK (
    (SELECT public.is_admin()) 
    OR (SELECT public.has_role('content_creator'::public.app_role))
);

CREATE POLICY "Allow admin and content_creator to delete synonym"
ON public.synonym FOR DELETE
TO authenticated
USING (
    (SELECT public.is_admin()) 
    OR (SELECT public.has_role('content_creator'::public.app_role))
);

-- ----------------------------------------------------------------------------
-- 8. Table: public.reports (Delegated to Moderator)
-- ----------------------------------------------------------------------------
DROP POLICY IF EXISTS "Admins can view all reports" ON public.reports;
DROP POLICY IF EXISTS "Admins can update all reports" ON public.reports;
DROP POLICY IF EXISTS "Admins and moderators can view all reports" ON public.reports;
DROP POLICY IF EXISTS "Admins and moderators can update all reports" ON public.reports;

CREATE POLICY "Admins and moderators can view all reports"
ON public.reports FOR SELECT
TO authenticated
USING (
    (SELECT public.is_admin()) 
    OR (SELECT public.has_role('moderator'::public.app_role))
);

CREATE POLICY "Admins and moderators can update all reports"
ON public.reports FOR UPDATE
TO authenticated
USING (
    (SELECT public.is_admin()) 
    OR (SELECT public.has_role('moderator'::public.app_role))
)
WITH CHECK (
    (SELECT public.is_admin()) 
    OR (SELECT public.has_role('moderator'::public.app_role))
);

-- ----------------------------------------------------------------------------
-- 9. Table: public.notifications
-- ----------------------------------------------------------------------------
DROP POLICY IF EXISTS "Admins can manage notifications" ON public.notifications;

CREATE POLICY "Admins can manage notifications"
ON public.notifications FOR ALL
TO authenticated
USING ((SELECT public.is_admin()))
WITH CHECK ((SELECT public.is_admin()));

-- ----------------------------------------------------------------------------
-- 10. Table: public.source_documents (Eliminates Correlated Subquery Scan)
-- ----------------------------------------------------------------------------
DROP POLICY IF EXISTS "Admins can manage source_documents" ON public.source_documents;

CREATE POLICY "Admins can manage source_documents"
ON public.source_documents FOR ALL
TO authenticated
USING ((SELECT public.is_admin()))
WITH CHECK ((SELECT public.is_admin()));

-- ----------------------------------------------------------------------------
-- 11. Mock Test System: exam_categories, test_series, tests, user_test_attempts
-- ----------------------------------------------------------------------------
DROP POLICY IF EXISTS "Allow admin all exam categories" ON public.exam_categories;
CREATE POLICY "Allow admin all exam categories"
ON public.exam_categories FOR ALL
TO authenticated
USING ((SELECT public.is_admin()))
WITH CHECK ((SELECT public.is_admin()));

DROP POLICY IF EXISTS "Allow admin all test series" ON public.test_series;
CREATE POLICY "Allow admin all test series"
ON public.test_series FOR ALL
TO authenticated
USING ((SELECT public.is_admin()))
WITH CHECK ((SELECT public.is_admin()));

DROP POLICY IF EXISTS "Allow admin all tests" ON public.tests;
CREATE POLICY "Allow admin all tests"
ON public.tests FOR ALL
TO authenticated
USING ((SELECT public.is_admin()))
WITH CHECK ((SELECT public.is_admin()));

DROP POLICY IF EXISTS "Allow admin all user attempts" ON public.user_test_attempts;
CREATE POLICY "Allow admin all user attempts"
ON public.user_test_attempts FOR ALL
TO authenticated
USING ((SELECT public.is_admin()))
WITH CHECK ((SELECT public.is_admin()));

-- ----------------------------------------------------------------------------
-- 12. AI Pipeline Tables: ai_prompts, ai_request_logs, ai_task_config, enrichment_dlq, enrichment_dlq_archive
-- ----------------------------------------------------------------------------
DROP POLICY IF EXISTS "admin_delete_ai_prompts" ON public.ai_prompts;
DROP POLICY IF EXISTS "admin_insert_ai_prompts" ON public.ai_prompts;
DROP POLICY IF EXISTS "admin_select_ai_prompts" ON public.ai_prompts;
DROP POLICY IF EXISTS "admin_update_ai_prompts" ON public.ai_prompts;
DROP POLICY IF EXISTS "admin_manage_ai_prompts" ON public.ai_prompts;

CREATE POLICY "admin_manage_ai_prompts"
ON public.ai_prompts FOR ALL
TO authenticated
USING ((SELECT public.is_admin()))
WITH CHECK ((SELECT public.is_admin()));

DROP POLICY IF EXISTS "admin_delete_ai_request_logs" ON public.ai_request_logs;
DROP POLICY IF EXISTS "admin_insert_ai_request_logs" ON public.ai_request_logs;
DROP POLICY IF EXISTS "admin_select_ai_request_logs" ON public.ai_request_logs;
DROP POLICY IF EXISTS "admin_update_ai_request_logs" ON public.ai_request_logs;
DROP POLICY IF EXISTS "admin_manage_ai_request_logs" ON public.ai_request_logs;

CREATE POLICY "admin_manage_ai_request_logs"
ON public.ai_request_logs FOR ALL
TO authenticated
USING ((SELECT public.is_admin()))
WITH CHECK ((SELECT public.is_admin()));

DROP POLICY IF EXISTS "Allow admin full access to ai_task_config" ON public.ai_task_config;
DROP POLICY IF EXISTS "admin_delete_ai_task_config" ON public.ai_task_config;
DROP POLICY IF EXISTS "admin_insert_ai_task_config" ON public.ai_task_config;
DROP POLICY IF EXISTS "admin_select_ai_task_config" ON public.ai_task_config;
DROP POLICY IF EXISTS "admin_update_ai_task_config" ON public.ai_task_config;
DROP POLICY IF EXISTS "admin_manage_ai_task_config" ON public.ai_task_config;

CREATE POLICY "admin_manage_ai_task_config"
ON public.ai_task_config FOR ALL
TO authenticated
USING ((SELECT public.is_admin()))
WITH CHECK ((SELECT public.is_admin()));

DROP POLICY IF EXISTS "Enable ALL for admin on enrichment_dlq" ON public.enrichment_dlq;
DROP POLICY IF EXISTS "admin_delete_enrichment_dlq" ON public.enrichment_dlq;
DROP POLICY IF EXISTS "admin_insert_enrichment_dlq" ON public.enrichment_dlq;
DROP POLICY IF EXISTS "admin_select_enrichment_dlq" ON public.enrichment_dlq;
DROP POLICY IF EXISTS "admin_update_enrichment_dlq" ON public.enrichment_dlq;
DROP POLICY IF EXISTS "admin_manage_enrichment_dlq" ON public.enrichment_dlq;

CREATE POLICY "admin_manage_enrichment_dlq"
ON public.enrichment_dlq FOR ALL
TO authenticated
USING ((SELECT public.is_admin()))
WITH CHECK ((SELECT public.is_admin()));

DROP POLICY IF EXISTS "Enable ALL for admin on enrichment_dlq_archive" ON public.enrichment_dlq_archive;
DROP POLICY IF EXISTS "admin_delete_enrichment_dlq_archive" ON public.enrichment_dlq_archive;
DROP POLICY IF EXISTS "admin_insert_enrichment_dlq_archive" ON public.enrichment_dlq_archive;
DROP POLICY IF EXISTS "admin_select_enrichment_dlq_archive" ON public.enrichment_dlq_archive;
DROP POLICY IF EXISTS "admin_update_enrichment_dlq_archive" ON public.enrichment_dlq_archive;
DROP POLICY IF EXISTS "admin_manage_enrichment_dlq_archive" ON public.enrichment_dlq_archive;

CREATE POLICY "admin_manage_enrichment_dlq_archive"
ON public.enrichment_dlq_archive FOR ALL
TO authenticated
USING ((SELECT public.is_admin()))
WITH CHECK ((SELECT public.is_admin()));

-- ----------------------------------------------------------------------------
-- 13. Storage Objects: branding & study_materials
-- ----------------------------------------------------------------------------
DROP POLICY IF EXISTS "Admin Delete Access for Branding" ON storage.objects;
DROP POLICY IF EXISTS "Admin Insert Access for Branding" ON storage.objects;
DROP POLICY IF EXISTS "Admin Update Access for Branding" ON storage.objects;

CREATE POLICY "Admin Insert Access for Branding"
ON storage.objects FOR INSERT
TO authenticated
WITH CHECK (
    bucket_id = 'branding' AND (SELECT public.is_admin())
);

CREATE POLICY "Admin Update Access for Branding"
ON storage.objects FOR UPDATE
TO authenticated
USING (
    bucket_id = 'branding' AND (SELECT public.is_admin())
)
WITH CHECK (
    bucket_id = 'branding' AND (SELECT public.is_admin())
);

CREATE POLICY "Admin Delete Access for Branding"
ON storage.objects FOR DELETE
TO authenticated
USING (
    bucket_id = 'branding' AND (SELECT public.is_admin())
);

DROP POLICY IF EXISTS "Admin Delete Access on study materials" ON storage.objects;
DROP POLICY IF EXISTS "Admin Insert Access on study materials" ON storage.objects;
DROP POLICY IF EXISTS "Admin Update Access on study materials" ON storage.objects;
DROP POLICY IF EXISTS "Admin and creator Insert Access on study materials" ON storage.objects;
DROP POLICY IF EXISTS "Admin and creator Update Access on study materials" ON storage.objects;
DROP POLICY IF EXISTS "Admin and creator Delete Access on study materials" ON storage.objects;

CREATE POLICY "Admin and creator Insert Access on study materials"
ON storage.objects FOR INSERT
TO authenticated
WITH CHECK (
    bucket_id = 'study_materials' 
    AND ((SELECT public.is_admin()) OR (SELECT public.has_role('content_creator'::public.app_role)))
);

CREATE POLICY "Admin and creator Update Access on study materials"
ON storage.objects FOR UPDATE
TO authenticated
USING (
    bucket_id = 'study_materials' 
    AND ((SELECT public.is_admin()) OR (SELECT public.has_role('content_creator'::public.app_role)))
)
WITH CHECK (
    bucket_id = 'study_materials' 
    AND ((SELECT public.is_admin()) OR (SELECT public.has_role('content_creator'::public.app_role)))
);

CREATE POLICY "Admin and creator Delete Access on study materials"
ON storage.objects FOR DELETE
TO authenticated
USING (
    bucket_id = 'study_materials' 
    AND ((SELECT public.is_admin()) OR (SELECT public.has_role('content_creator'::public.app_role)))
);
