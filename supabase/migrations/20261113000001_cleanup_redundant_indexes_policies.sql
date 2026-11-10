-- Phase 5 Cleanup: Drop Duplicate Indexes & Redundant Permissive Policies
-- Separated from 20261113000000_indexes_and_rls_optimization.sql so DROP statements
-- can be reviewed and applied cleanly.

-- 1. Drop duplicate indexes on public.questions, bridge_saved_quiz_questions, and synonym
DROP INDEX IF EXISTS public.questions_questiontype_idx;
DROP INDEX IF EXISTS public.questions_v1_id_idx;
DROP INDEX IF EXISTS public.idx_questions_v1_id;
DROP INDEX IF EXISTS public.questions_subtopic_idx;
DROP INDEX IF EXISTS public.questions_examname_idx;
DROP INDEX IF EXISTS public.questions_examyear_idx;
DROP INDEX IF EXISTS public.questions_examdateshift_idx;
DROP INDEX IF EXISTS public.bridge_saved_quiz_questions_quiz_id_idx;
DROP INDEX IF EXISTS public.idx_synonym_importance_score;

-- 2. Drop redundant or dead-permissive duplicate RLS policies
DROP POLICY IF EXISTS "Public can log events" ON public.analytics_events;
DROP POLICY IF EXISTS "Public read for official answer keys" ON public.official_answer_keys;
DROP POLICY IF EXISTS "Block all client-side mutations on payments." ON public.payments;
DROP POLICY IF EXISTS "Block all client-side mutations on questions" ON public.questions;
DROP POLICY IF EXISTS "Block users from deleting their answers" ON public.user_answers;
DROP POLICY IF EXISTS "Users can delete own comments" ON public.post_comments;
DROP POLICY IF EXISTS "Public read post likes" ON public.post_likes;
DROP POLICY IF EXISTS "Users can delete own posts" ON public.posts;
DROP POLICY IF EXISTS "Users can insert posts" ON public.posts;
DROP POLICY IF EXISTS "Auth insert posts" ON public.posts;
DROP POLICY IF EXISTS "Users can create rooms" ON public.chat_rooms;
DROP POLICY IF EXISTS "Users can delete their own active session" ON public.user_active_sessions;
DROP POLICY IF EXISTS "Users can insert their own active session" ON public.user_active_sessions;
DROP POLICY IF EXISTS "Users can update their own active session" ON public.user_active_sessions;
DROP POLICY IF EXISTS "Users can view their own active session" ON public.user_active_sessions;
