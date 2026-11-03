-- Migration: 20261103000000_optimize_quiz_library_performance.sql
-- Description: Indexes, RLS optimization, and schema hardening for Quiz Library

-- 1. Sanitize legacy state JSON: strip redundant bloated activeQuestions array
UPDATE public.saved_quizzes 
SET state = state - 'activeQuestions' 
WHERE state ? 'activeQuestions';

-- 2. Covering index for instant Quiz Library queries and sorting
CREATE INDEX IF NOT EXISTS idx_saved_quizzes_library 
ON public.saved_quizzes (user_id, status, created_at DESC) 
WHERE (deleted_at IS NULL);

-- 3. Covering index on foreign key question_id for bridge table
CREATE INDEX IF NOT EXISTS idx_bridge_saved_quiz_questions_question_id 
ON public.bridge_saved_quiz_questions (question_id);

-- 4. Auth RLS InitPlan Optimization for saved_quizzes
ALTER POLICY "Users can manage their own saved quizzes" 
ON public.saved_quizzes 
USING (((SELECT auth.uid()) = user_id)) 
WITH CHECK (((SELECT auth.uid()) = user_id));

-- 5. Auth RLS InitPlan Optimization for bridge_saved_quiz_questions
ALTER POLICY "Users can manage their own bridge saved quiz questions" 
ON public.bridge_saved_quiz_questions 
USING (((SELECT auth.uid()) = user_id)) 
WITH CHECK (((SELECT auth.uid()) = user_id));
