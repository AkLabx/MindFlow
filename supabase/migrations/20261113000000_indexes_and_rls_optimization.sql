-- Phase 5: High-Performance Database Indexing & RLS Scalar Subqueries
-- Additive migration (zero DROP statements):
-- 1. Covering B-tree indexes for all 64 unindexed foreign keys (Advisor 0001)
-- 2. Delta-sync and query-path indexes on questions, vocabulary, and analytics_events
-- 3. Security hardening on analytics_events and ai_user_usage_daily RLS policies
-- 4. Scalar subquery optimization ((SELECT auth.uid())) on all 107 flagged RLS policies (Advisor 0003)

-- ============================================================================
-- 1. COVERING INDEXES FOR ALL 64 UNINDEXED FOREIGN KEYS
-- ============================================================================

CREATE INDEX IF NOT EXISTS idx_ai_chat_conv_user_id ON public.ai_chat_conversations (user_id);
CREATE INDEX IF NOT EXISTS idx_ai_chat_msg_conv_id ON public.ai_chat_messages (conversation_id);
CREATE INDEX IF NOT EXISTS idx_ai_req_logs_question_id ON public.ai_request_logs (question_id);
CREATE INDEX IF NOT EXISTS idx_ai_tutor_cfg_updated_by ON public.ai_tutor_config (updated_by);
CREATE INDEX IF NOT EXISTS idx_ai_user_usage_feature ON public.ai_user_usage_daily (feature);
CREATE INDEX IF NOT EXISTS idx_app_ui_cfg_updated_by ON public.app_ui_config (updated_by);
CREATE INDEX IF NOT EXISTS idx_bp_seen_q_blueprint_id ON public.blueprint_seen_questions (blueprint_id);
CREATE INDEX IF NOT EXISTS idx_bp_seen_q_question_id ON public.blueprint_seen_questions (question_id);
CREATE INDEX IF NOT EXISTS idx_bridge_idioms_user_id ON public.bridge_saved_idioms (user_id);
CREATE INDEX IF NOT EXISTS idx_bridge_idioms_word_id ON public.bridge_saved_idioms (word_id);
CREATE INDEX IF NOT EXISTS idx_bridge_ows_user_id ON public.bridge_saved_ows (user_id);
CREATE INDEX IF NOT EXISTS idx_bridge_ows_word_id ON public.bridge_saved_ows (word_id);
CREATE INDEX IF NOT EXISTS idx_bridge_synonyms_user_id ON public.bridge_saved_synonyms (user_id);
CREATE INDEX IF NOT EXISTS idx_bridge_synonyms_word_id ON public.bridge_saved_synonyms (word_id);
CREATE INDEX IF NOT EXISTS idx_chat_msg_likes_user_id ON public.chat_message_likes (user_id);
CREATE INDEX IF NOT EXISTS idx_chat_participants_user_id ON public.chat_participants (user_id);
CREATE INDEX IF NOT EXISTS idx_chat_room_msgs_room_id ON public.chat_room_messages (room_id);
CREATE INDEX IF NOT EXISTS idx_chat_room_msgs_sender_id ON public.chat_room_messages (sender_id);
CREATE INDEX IF NOT EXISTS idx_comment_likes_user_id ON public.comment_likes (user_id);
CREATE INDEX IF NOT EXISTS idx_enrichment_dlq_word_id ON public.enrichment_dlq (word_id);
CREATE INDEX IF NOT EXISTS idx_enrichment_dlq_arch_word_id ON public.enrichment_dlq_archive (word_id);
CREATE INDEX IF NOT EXISTS idx_idiom_deck_hist_deck_id ON public.idiom_deck_history (deck_id);
CREATE INDEX IF NOT EXISTS idx_idiom_deck_hist_user_id ON public.idiom_deck_history (user_id);
CREATE INDEX IF NOT EXISTS idx_notifications_created_by ON public.notifications (created_by);
CREATE INDEX IF NOT EXISTS idx_notifications_receiver_id ON public.notifications (receiver_id);
CREATE INDEX IF NOT EXISTS idx_ows_deck_hist_deck_id ON public.ows_deck_history (deck_id);
CREATE INDEX IF NOT EXISTS idx_ows_deck_hist_user_id ON public.ows_deck_history (user_id);
CREATE INDEX IF NOT EXISTS idx_payments_user_id ON public.payments (user_id);
CREATE INDEX IF NOT EXISTS idx_post_comments_parent_id ON public.post_comments (parent_comment_id);
CREATE INDEX IF NOT EXISTS idx_post_comments_post_id ON public.post_comments (post_id);
CREATE INDEX IF NOT EXISTS idx_post_comments_user_id ON public.post_comments (user_id);
CREATE INDEX IF NOT EXISTS idx_post_likes_user_id ON public.post_likes (user_id);
CREATE INDEX IF NOT EXISTS idx_posts_user_id ON public.posts (user_id);
CREATE INDEX IF NOT EXISTS idx_push_subs_user_id ON public.push_subscriptions (user_id);
CREATE INDEX IF NOT EXISTS idx_questions_source_doc_id ON public.questions (source_document_id);
CREATE INDEX IF NOT EXISTS idx_reel_cmt_likes_user_id ON public.reel_comment_likes (user_id);
CREATE INDEX IF NOT EXISTS idx_reel_comments_parent_id ON public.reel_comments (parent_comment_id);
CREATE INDEX IF NOT EXISTS idx_reel_comments_reel_id ON public.reel_comments (reel_id);
CREATE INDEX IF NOT EXISTS idx_reel_comments_user_id ON public.reel_comments (user_id);
CREATE INDEX IF NOT EXISTS idx_reel_likes_user_id ON public.reel_likes (user_id);
CREATE INDEX IF NOT EXISTS idx_reels_user_id ON public.reels (user_id);
CREATE INDEX IF NOT EXISTS idx_reports_reporter_id ON public.reports (reporter_id);
CREATE INDEX IF NOT EXISTS idx_saved_idiom_decks_user_id ON public.saved_idiom_decks (user_id);
CREATE INDEX IF NOT EXISTS idx_saved_ows_decks_user_id ON public.saved_ows_decks (user_id);
CREATE INDEX IF NOT EXISTS idx_saved_synonym_decks_user_id ON public.saved_synonym_decks (user_id);
CREATE INDEX IF NOT EXISTS idx_source_docs_created_by ON public.source_documents (created_by);
CREATE INDEX IF NOT EXISTS idx_synonym_deck_hist_deck_id ON public.synonym_deck_history (deck_id);
CREATE INDEX IF NOT EXISTS idx_synonym_deck_hist_user_id ON public.synonym_deck_history (user_id);
CREATE INDEX IF NOT EXISTS idx_user_answers_question_id ON public.user_answers (question_id);
CREATE INDEX IF NOT EXISTS idx_user_blocks_blocked_id ON public.user_blocks (blocked_id);
CREATE INDEX IF NOT EXISTS idx_user_exam_bp_user_id ON public.user_exam_blueprints (user_id);
CREATE INDEX IF NOT EXISTS idx_user_followers_following_id ON public.user_followers (following_id);
CREATE INDEX IF NOT EXISTS idx_uidiom_deck_ans_attempt_id ON public.user_idiom_deck_answers (attempt_id);
CREATE INDEX IF NOT EXISTS idx_uidiom_deck_ans_user_id ON public.user_idiom_deck_answers (user_id);
CREATE INDEX IF NOT EXISTS idx_uidiom_deck_ans_word_id ON public.user_idiom_deck_answers (word_id);
CREATE INDEX IF NOT EXISTS idx_user_notifs_notif_id ON public.user_notifications (notification_id);
CREATE INDEX IF NOT EXISTS idx_uows_deck_ans_attempt_id ON public.user_ows_deck_answers (attempt_id);
CREATE INDEX IF NOT EXISTS idx_uows_deck_ans_user_id ON public.user_ows_deck_answers (user_id);
CREATE INDEX IF NOT EXISTS idx_uows_deck_ans_word_id ON public.user_ows_deck_answers (word_id);
CREATE INDEX IF NOT EXISTS idx_user_ows_inter_ows_id ON public.user_ows_interactions (ows_id);
CREATE INDEX IF NOT EXISTS idx_uq_mastery_last_quiz_id ON public.user_question_mastery (last_quiz_id);
CREATE INDEX IF NOT EXISTS idx_usyn_deck_ans_attempt_id ON public.user_synonym_deck_answers (attempt_id);
CREATE INDEX IF NOT EXISTS idx_usyn_deck_ans_user_id ON public.user_synonym_deck_answers (user_id);
CREATE INDEX IF NOT EXISTS idx_usyn_deck_ans_word_id ON public.user_synonym_deck_answers (word_id);

-- ============================================================================
-- 2. HIGH-TRAFFIC TELEMETRY, VOCABULARY & DELTA-SYNC INDEXES
-- ============================================================================

CREATE INDEX IF NOT EXISTS idx_analytics_events_name_time
  ON public.analytics_events (event_name, created_at DESC);

CREATE INDEX IF NOT EXISTS idx_idiom_id_text
  ON public.idiom ((id::text));

CREATE INDEX IF NOT EXISTS idx_idiom_updated_at
  ON public.idiom (updated_at);

CREATE INDEX IF NOT EXISTS idx_ows_updated_at
  ON public.ows (updated_at);

CREATE INDEX IF NOT EXISTS idx_synonym_updated_at
  ON public.synonym (updated_at);

CREATE INDEX IF NOT EXISTS idx_user_idiom_inter_user_updated
  ON public.user_idiom_interactions (user_id, updated_at);

CREATE INDEX IF NOT EXISTS idx_user_ows_inter_user_updated
  ON public.user_ows_interactions (user_id, updated_at);

CREATE INDEX IF NOT EXISTS idx_user_syn_inter_user_updated
  ON public.user_synonym_interactions (user_id, updated_at);

CREATE INDEX IF NOT EXISTS idx_questions_updated_at
  ON public.questions (updated_at);

CREATE INDEX IF NOT EXISTS idx_questions_examname_subject
  ON public.questions ("examName", subject)
  WHERE deleted_at IS NULL;

-- ============================================================================
-- 3. SECURITY FIXES ON MISCONFIGURED RLS POLICIES
-- ============================================================================

ALTER POLICY "Only admin can view stats"
  ON public.analytics_events
  TO authenticated
  USING ((SELECT public.is_admin()));

ALTER POLICY "Allow service role to manage ai_user_usage_daily"
  ON public.ai_user_usage_daily
  TO service_role
  USING (true)
  WITH CHECK (true);

-- ============================================================================
-- 4. OPTIMIZE ALL 107 AUTH_RLS_INITPLAN POLICIES TO SCALAR SUBQUERIES
-- ============================================================================

-- ai_chat_conversations
ALTER POLICY "Users can create their own conversations"
  ON public.ai_chat_conversations
  WITH CHECK ((SELECT auth.uid()) = user_id);

ALTER POLICY "Users can delete their own conversations"
  ON public.ai_chat_conversations
  USING ((SELECT auth.uid()) = user_id);

ALTER POLICY "Users can update their own conversations"
  ON public.ai_chat_conversations
  USING ((SELECT auth.uid()) = user_id)
  WITH CHECK ((SELECT auth.uid()) = user_id);

ALTER POLICY "Users can view their own conversations"
  ON public.ai_chat_conversations
  USING ((SELECT auth.uid()) = user_id);

-- ai_chat_messages
ALTER POLICY "Users can insert messages to their conversations"
  ON public.ai_chat_messages
  WITH CHECK (
    EXISTS (
      SELECT 1
      FROM public.ai_chat_conversations c
      WHERE c.id = ai_chat_messages.conversation_id
        AND c.user_id = (SELECT auth.uid())
    )
  );

ALTER POLICY "Users can view messages of their conversations"
  ON public.ai_chat_messages
  USING (
    EXISTS (
      SELECT 1
      FROM public.ai_chat_conversations c
      WHERE c.id = ai_chat_messages.conversation_id
        AND c.user_id = (SELECT auth.uid())
    )
  );

-- ai_user_usage_daily
ALTER POLICY "Allow read access to own ai_user_usage_daily"
  ON public.ai_user_usage_daily
  USING ((SELECT auth.uid()) = user_id);

-- blueprint_seen_questions
ALTER POLICY "Users can manage their own seen questions"
  ON public.blueprint_seen_questions
  USING ((SELECT auth.uid()) = user_id)
  WITH CHECK ((SELECT auth.uid()) = user_id);

-- bridge_saved_idioms / ows / synonyms
ALTER POLICY "Users can manage their own bridge_saved_idioms"
  ON public.bridge_saved_idioms
  USING ((SELECT auth.uid()) = user_id)
  WITH CHECK ((SELECT auth.uid()) = user_id);

ALTER POLICY "Users can manage their own bridge_saved_ows"
  ON public.bridge_saved_ows
  USING ((SELECT auth.uid()) = user_id)
  WITH CHECK ((SELECT auth.uid()) = user_id);

ALTER POLICY "Users can manage their own bridge_saved_synonyms"
  ON public.bridge_saved_synonyms
  USING ((SELECT auth.uid()) = user_id)
  WITH CHECK ((SELECT auth.uid()) = user_id);

-- chat_message_likes
ALTER POLICY "Users can add their own likes"
  ON public.chat_message_likes
  WITH CHECK (
    ((SELECT auth.uid()) = user_id)
    AND EXISTS (
      SELECT 1
      FROM public.chat_room_messages m
      JOIN public.chat_participants p ON m.room_id = p.room_id
      WHERE m.id = chat_message_likes.message_id
        AND p.user_id = (SELECT auth.uid())
    )
  );

ALTER POLICY "Users can remove their own likes"
  ON public.chat_message_likes
  USING ((SELECT auth.uid()) = user_id);

ALTER POLICY "Users can view likes for messages in their rooms"
  ON public.chat_message_likes
  USING (
    EXISTS (
      SELECT 1
      FROM public.chat_room_messages m
      JOIN public.chat_participants p ON m.room_id = p.room_id
      WHERE m.id = chat_message_likes.message_id
        AND p.user_id = (SELECT auth.uid())
    )
  );

-- chat_participants
ALTER POLICY "Users can insert participants"
  ON public.chat_participants
  WITH CHECK ((SELECT auth.uid()) IS NOT NULL);

ALTER POLICY "Users can view participants"
  ON public.chat_participants
  USING ((SELECT auth.uid()) IS NOT NULL);

-- chat_room_messages
ALTER POLICY "Auth insert messages"
  ON public.chat_room_messages
  WITH CHECK (
    ((SELECT auth.uid()) = sender_id)
    AND (
      room_id IN (
        SELECT chat_participants.room_id
        FROM public.chat_participants
        WHERE chat_participants.user_id = (SELECT auth.uid())
      )
    )
  );

ALTER POLICY "Auth read messages"
  ON public.chat_room_messages
  USING (
    room_id IN (
      SELECT chat_participants.room_id
      FROM public.chat_participants
      WHERE chat_participants.user_id = (SELECT auth.uid())
    )
  );

ALTER POLICY "Users can insert messages in their rooms"
  ON public.chat_room_messages
  WITH CHECK (
    ((SELECT auth.uid()) = sender_id)
    AND EXISTS (
      SELECT 1
      FROM public.chat_participants
      WHERE chat_participants.room_id = chat_room_messages.room_id
        AND chat_participants.user_id = (SELECT auth.uid())
    )
  );

ALTER POLICY "Users can view messages in their rooms"
  ON public.chat_room_messages
  USING (
    EXISTS (
      SELECT 1
      FROM public.chat_participants
      WHERE chat_participants.room_id = chat_room_messages.room_id
        AND chat_participants.user_id = (SELECT auth.uid())
    )
  );

-- chat_rooms
ALTER POLICY "Auth read chat rooms"
  ON public.chat_rooms
  USING (
    id IN (
      SELECT chat_participants.room_id
      FROM public.chat_participants
      WHERE chat_participants.user_id = (SELECT auth.uid())
    )
  );

ALTER POLICY "Users can create chat rooms"
  ON public.chat_rooms
  WITH CHECK ((SELECT auth.uid()) IS NOT NULL);

ALTER POLICY "Users can create rooms"
  ON public.chat_rooms
  WITH CHECK ((SELECT auth.uid()) IS NOT NULL);

ALTER POLICY "Users can view rooms"
  ON public.chat_rooms
  USING ((SELECT auth.uid()) IS NOT NULL);

ALTER POLICY "Users can view rooms they are in"
  ON public.chat_rooms
  USING (
    EXISTS (
      SELECT 1
      FROM public.chat_participants
      WHERE chat_participants.room_id = chat_rooms.id
        AND chat_participants.user_id = (SELECT auth.uid())
    )
  );

-- comment_likes
ALTER POLICY "Users can like comments"
  ON public.comment_likes
  WITH CHECK ((SELECT auth.uid()) = user_id);

ALTER POLICY "Users can unlike comments"
  ON public.comment_likes
  USING ((SELECT auth.uid()) = user_id);

-- exam_section_results
ALTER POLICY "Users can read own section results"
  ON public.exam_section_results
  USING (
    EXISTS (
      SELECT 1
      FROM public.exam_submissions sub
      WHERE sub.id = exam_section_results.submission_id
        AND sub.user_id = (SELECT auth.uid())
    )
  );

-- exam_submissions
ALTER POLICY "Users can delete own submissions"
  ON public.exam_submissions
  USING ((SELECT auth.uid()) = user_id);

ALTER POLICY "Users can insert own submissions"
  ON public.exam_submissions
  WITH CHECK ((SELECT auth.uid()) = user_id);

ALTER POLICY "Users can read own submissions"
  ON public.exam_submissions
  USING ((SELECT auth.uid()) = user_id);

ALTER POLICY "Users can update own submissions"
  ON public.exam_submissions
  USING ((SELECT auth.uid()) = user_id)
  WITH CHECK ((SELECT auth.uid()) = user_id);

-- idiom_deck_history
ALTER POLICY "Users can manage their own idiom_deck_history"
  ON public.idiom_deck_history
  USING ((SELECT auth.uid()) = user_id)
  WITH CHECK ((SELECT auth.uid()) = user_id);

-- notification_preferences
ALTER POLICY "Users can manage their preferences"
  ON public.notification_preferences
  USING ((SELECT auth.uid()) = user_id)
  WITH CHECK ((SELECT auth.uid()) = user_id);

-- notifications
ALTER POLICY "Users can only select their own notifications"
  ON public.notifications
  USING (((SELECT auth.uid()) = receiver_id) OR (receiver_id IS NULL));

ALTER POLICY "Users can only update their own notifications"
  ON public.notifications
  USING ((SELECT auth.uid()) = receiver_id)
  WITH CHECK ((SELECT auth.uid()) = receiver_id);

-- ows_deck_history
ALTER POLICY "Users can manage their own ows_deck_history"
  ON public.ows_deck_history
  USING ((SELECT auth.uid()) = user_id)
  WITH CHECK ((SELECT auth.uid()) = user_id);

-- payments
ALTER POLICY "Users can view their own payment records."
  ON public.payments
  USING ((SELECT auth.uid()) = user_id);

-- post_comments
ALTER POLICY "Post comments are viewable by non-blocked users"
  ON public.post_comments
  USING (NOT (user_id IN (SELECT public.get_blocked_users((SELECT auth.uid())))));

ALTER POLICY "Users can create comments"
  ON public.post_comments
  WITH CHECK ((SELECT auth.uid()) = user_id);

ALTER POLICY "Users can delete own comments"
  ON public.post_comments
  USING ((SELECT auth.uid()) = user_id);

ALTER POLICY "Users can delete their own comments"
  ON public.post_comments
  USING ((SELECT auth.uid()) = user_id);

ALTER POLICY "Users can update own comments"
  ON public.post_comments
  USING ((SELECT auth.uid()) = user_id)
  WITH CHECK ((SELECT auth.uid()) = user_id);

-- post_likes
ALTER POLICY "Auth modify post likes"
  ON public.post_likes
  USING ((SELECT auth.uid()) = user_id)
  WITH CHECK ((SELECT auth.uid()) = user_id);

ALTER POLICY "Users can delete their own likes"
  ON public.post_likes
  USING ((SELECT auth.uid()) = user_id);

ALTER POLICY "Users can insert their own likes"
  ON public.post_likes
  WITH CHECK ((SELECT auth.uid()) = user_id);

-- posts
ALTER POLICY "Auth insert posts"
  ON public.posts
  WITH CHECK ((SELECT auth.uid()) = user_id);

ALTER POLICY "Posts are viewable by non-blocked users"
  ON public.posts
  USING (NOT (user_id IN (SELECT public.get_blocked_users((SELECT auth.uid())))));

ALTER POLICY "Users can create posts"
  ON public.posts
  WITH CHECK ((SELECT auth.uid()) = user_id);

ALTER POLICY "Users can delete own posts"
  ON public.posts
  USING ((SELECT auth.uid()) = user_id);

ALTER POLICY "Users can delete their own posts"
  ON public.posts
  USING ((SELECT auth.uid()) = user_id);

ALTER POLICY "Users can insert posts"
  ON public.posts
  WITH CHECK ((SELECT auth.uid()) = user_id);

ALTER POLICY "Users can update own posts"
  ON public.posts
  USING ((SELECT auth.uid()) = user_id)
  WITH CHECK ((SELECT auth.uid()) = user_id);

-- profiles
ALTER POLICY "Public profiles are viewable by non-blocked users"
  ON public.profiles
  USING (NOT (id IN (SELECT public.get_blocked_users((SELECT auth.uid())))));

ALTER POLICY "Users can update their own profile."
  ON public.profiles
  USING ((SELECT auth.uid()) = id)
  WITH CHECK ((SELECT auth.uid()) = id);

ALTER POLICY "Users can view their own profile."
  ON public.profiles
  USING ((SELECT auth.uid()) = id);

-- push_subscriptions
ALTER POLICY "Users can manage their subscriptions"
  ON public.push_subscriptions
  USING ((SELECT auth.uid()) = user_id)
  WITH CHECK ((SELECT auth.uid()) = user_id);

-- quiz_history
ALTER POLICY "Users can manage their own quiz history"
  ON public.quiz_history
  USING ((SELECT auth.uid()) = user_id)
  WITH CHECK ((SELECT auth.uid()) = user_id);

-- reel_comment_likes
ALTER POLICY "Users can delete their own reel comment likes."
  ON public.reel_comment_likes
  USING ((SELECT auth.uid()) = user_id);

ALTER POLICY "Users can insert their own reel comment likes."
  ON public.reel_comment_likes
  WITH CHECK ((SELECT auth.uid()) = user_id);

-- reel_comments
ALTER POLICY "Reel comments are viewable by non-blocked users"
  ON public.reel_comments
  USING (NOT (user_id IN (SELECT public.get_blocked_users((SELECT auth.uid())))));

ALTER POLICY "Users can delete their own reel comments."
  ON public.reel_comments
  USING ((SELECT auth.uid()) = user_id);

ALTER POLICY "Users can insert their own reel comments."
  ON public.reel_comments
  WITH CHECK ((SELECT auth.uid()) = user_id);

ALTER POLICY "Users can update their own reel comments."
  ON public.reel_comments
  USING ((SELECT auth.uid()) = user_id)
  WITH CHECK ((SELECT auth.uid()) = user_id);

-- reel_likes
ALTER POLICY "Users can delete their own reel likes."
  ON public.reel_likes
  USING ((SELECT auth.uid()) = user_id);

ALTER POLICY "Users can insert their own reel likes."
  ON public.reel_likes
  WITH CHECK ((SELECT auth.uid()) = user_id);

-- reels
ALTER POLICY "Reels are viewable by non-blocked users"
  ON public.reels
  USING (NOT (user_id IN (SELECT public.get_blocked_users((SELECT auth.uid())))));

ALTER POLICY "Users can delete their own reels."
  ON public.reels
  USING ((SELECT auth.uid()) = user_id);

ALTER POLICY "Users can insert their own reels."
  ON public.reels
  WITH CHECK ((SELECT auth.uid()) = user_id);

ALTER POLICY "Users can update their own reels."
  ON public.reels
  USING ((SELECT auth.uid()) = user_id)
  WITH CHECK ((SELECT auth.uid()) = user_id);

-- reports
ALTER POLICY "Reporters can insert own reports"
  ON public.reports
  WITH CHECK ((SELECT auth.uid()) = reporter_id);

ALTER POLICY "Reporters can view own reports"
  ON public.reports
  USING ((SELECT auth.uid()) = reporter_id);

-- saved decks & history
ALTER POLICY "Users can manage their own saved_idiom_decks"
  ON public.saved_idiom_decks
  USING ((SELECT auth.uid()) = user_id)
  WITH CHECK ((SELECT auth.uid()) = user_id);

ALTER POLICY "Users can manage their own saved_ows_decks"
  ON public.saved_ows_decks
  USING ((SELECT auth.uid()) = user_id)
  WITH CHECK ((SELECT auth.uid()) = user_id);

ALTER POLICY "Users can manage their own saved_synonym_decks"
  ON public.saved_synonym_decks
  USING ((SELECT auth.uid()) = user_id)
  WITH CHECK ((SELECT auth.uid()) = user_id);

ALTER POLICY "Users can manage their own synonym_deck_history"
  ON public.synonym_deck_history
  USING ((SELECT auth.uid()) = user_id)
  WITH CHECK ((SELECT auth.uid()) = user_id);

-- user_active_sessions
ALTER POLICY "Enable delete for users based on user_id"
  ON public.user_active_sessions
  USING ((SELECT auth.uid()) = user_id);

ALTER POLICY "Enable insert for users based on user_id"
  ON public.user_active_sessions
  WITH CHECK ((SELECT auth.uid()) = user_id);

ALTER POLICY "Enable select for users based on user_id"
  ON public.user_active_sessions
  USING ((SELECT auth.uid()) = user_id);

ALTER POLICY "Enable update for users based on user_id"
  ON public.user_active_sessions
  USING ((SELECT auth.uid()) = user_id)
  WITH CHECK ((SELECT auth.uid()) = user_id);

ALTER POLICY "Users can delete their own active session"
  ON public.user_active_sessions
  USING ((SELECT auth.uid()) = user_id);

ALTER POLICY "Users can insert their own active session"
  ON public.user_active_sessions
  WITH CHECK ((SELECT auth.uid()) = user_id);

ALTER POLICY "Users can update their own active session"
  ON public.user_active_sessions
  USING ((SELECT auth.uid()) = user_id)
  WITH CHECK ((SELECT auth.uid()) = user_id);

ALTER POLICY "Users can view their own active session"
  ON public.user_active_sessions
  USING ((SELECT auth.uid()) = user_id);

-- user_answers
ALTER POLICY "Users can create and manage their own answers"
  ON public.user_answers
  USING ((SELECT auth.uid()) = user_id)
  WITH CHECK ((SELECT auth.uid()) = user_id);

-- user_blocks
ALTER POLICY "Users can create blocks"
  ON public.user_blocks
  WITH CHECK ((SELECT auth.uid()) = blocker_id);

ALTER POLICY "Users can remove their own blocks"
  ON public.user_blocks
  USING ((SELECT auth.uid()) = blocker_id);

ALTER POLICY "Users can view blocks they are involved in"
  ON public.user_blocks
  USING (((SELECT auth.uid()) = blocker_id) OR ((SELECT auth.uid()) = blocked_id));

-- user_bookmarks
ALTER POLICY "Users can manage their own bookmarks"
  ON public.user_bookmarks
  USING ((SELECT auth.uid()) = user_id)
  WITH CHECK ((SELECT auth.uid()) = user_id);

-- user_exam_blueprints
ALTER POLICY "Users can manage their own blueprints"
  ON public.user_exam_blueprints
  USING ((SELECT auth.uid()) = user_id)
  WITH CHECK ((SELECT auth.uid()) = user_id);

-- user_followers
ALTER POLICY "Followers are viewable by non-blocked users"
  ON public.user_followers
  USING (
    (NOT (follower_id IN (SELECT public.get_blocked_users((SELECT auth.uid())))))
    AND (NOT (following_id IN (SELECT public.get_blocked_users((SELECT auth.uid())))))
  );

ALTER POLICY "Users can follow others"
  ON public.user_followers
  WITH CHECK ((SELECT auth.uid()) = follower_id);

ALTER POLICY "Users can manage their own follows"
  ON public.user_followers
  USING ((SELECT auth.uid()) = follower_id)
  WITH CHECK ((SELECT auth.uid()) = follower_id);

ALTER POLICY "Users can unfollow others"
  ON public.user_followers
  USING ((SELECT auth.uid()) = follower_id);

-- user_idiom_deck_answers & interactions
ALTER POLICY "Users can manage their own user_idiom_deck_answers"
  ON public.user_idiom_deck_answers
  USING ((SELECT auth.uid()) = user_id)
  WITH CHECK ((SELECT auth.uid()) = user_id);

ALTER POLICY "Users can manage their own Idiom interactions."
  ON public.user_idiom_interactions
  USING ((SELECT auth.uid()) = user_id)
  WITH CHECK ((SELECT auth.uid()) = user_id);

-- user_notifications
ALTER POLICY "Users can manage their read receipts"
  ON public.user_notifications
  USING ((SELECT auth.uid()) = user_id)
  WITH CHECK ((SELECT auth.uid()) = user_id);

-- user_ows_deck_answers & interactions
ALTER POLICY "Users can manage their own user_ows_deck_answers"
  ON public.user_ows_deck_answers
  USING ((SELECT auth.uid()) = user_id)
  WITH CHECK ((SELECT auth.uid()) = user_id);

ALTER POLICY "Users can manage their own OWS interactions."
  ON public.user_ows_interactions
  USING ((SELECT auth.uid()) = user_id)
  WITH CHECK ((SELECT auth.uid()) = user_id);

-- user_synonym_deck_answers & interactions
ALTER POLICY "Users can manage their own user_synonym_deck_answers"
  ON public.user_synonym_deck_answers
  USING ((SELECT auth.uid()) = user_id)
  WITH CHECK ((SELECT auth.uid()) = user_id);

ALTER POLICY "Users can delete their own synonym interactions"
  ON public.user_synonym_interactions
  USING ((SELECT auth.uid()) = user_id);

ALTER POLICY "Users can insert their own synonym interactions"
  ON public.user_synonym_interactions
  WITH CHECK ((SELECT auth.uid()) = user_id);

ALTER POLICY "Users can select their own synonym interactions"
  ON public.user_synonym_interactions
  USING ((SELECT auth.uid()) = user_id);

ALTER POLICY "Users can update their own synonym interactions"
  ON public.user_synonym_interactions
  USING ((SELECT auth.uid()) = user_id)
  WITH CHECK ((SELECT auth.uid()) = user_id);

-- user_test_attempts
ALTER POLICY "Users can insert their own attempts"
  ON public.user_test_attempts
  WITH CHECK ((SELECT auth.uid()) = user_id);

ALTER POLICY "Users can update their own attempts"
  ON public.user_test_attempts
  USING ((SELECT auth.uid()) = user_id)
  WITH CHECK ((SELECT auth.uid()) = user_id);

ALTER POLICY "Users can view their own attempts"
  ON public.user_test_attempts
  USING ((SELECT auth.uid()) = user_id);
