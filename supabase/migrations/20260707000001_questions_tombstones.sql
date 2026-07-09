-- 1. Create the tombstone table
CREATE TABLE IF NOT EXISTS deleted_question_logs (
    id UUID PRIMARY KEY,
    deleted_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 2. Create the trigger function to capture hard deletes
CREATE OR REPLACE FUNCTION log_deleted_question()
RETURNS TRIGGER AS $$
BEGIN
    INSERT INTO deleted_question_logs (id, deleted_at)
    VALUES (OLD.id, NOW())
    ON CONFLICT (id) DO UPDATE SET deleted_at = NOW();
    RETURN OLD;
END;
$$ LANGUAGE plpgsql;

-- 3. Attach the trigger to the questions table
DROP TRIGGER IF EXISTS trigger_log_deleted_question ON questions;
CREATE TRIGGER trigger_log_deleted_question
AFTER DELETE ON questions
FOR EACH ROW
EXECUTE FUNCTION log_deleted_question();

-- 4. Set up the 30-day retention cron job
-- Note: Requires pg_cron extension, which Supabase supports.
CREATE EXTENSION IF NOT EXISTS pg_cron;

SELECT cron.schedule(
    'purge-deleted-question-logs',
    '0 3 * * *', -- Run every day at 3:00 AM
    $$ DELETE FROM deleted_question_logs WHERE deleted_at < NOW() - INTERVAL '30 days'; $$
);

-- 5. Update RPC to include both soft deletes and hard deletes (tombstones)
DROP FUNCTION IF EXISTS get_filtered_quiz_metadata(TIMESTAMP WITH TIME ZONE);

CREATE OR REPLACE FUNCTION get_filtered_quiz_metadata(p_last_sync_at TIMESTAMP WITH TIME ZONE DEFAULT NULL)
RETURNS TABLE (
    id UUID,
    v1_id TEXT,
    subject TEXT,
    topic TEXT,
    "subTopic" TEXT,
    "examName" TEXT,
    "examYear" INTEGER,
    "examDateShift" TEXT,
    difficulty TEXT,
    "questionType" TEXT,
    tags TEXT[],
    updated_at TIMESTAMP WITH TIME ZONE,
    deleted_at TIMESTAMP WITH TIME ZONE
) AS $$
BEGIN
    IF p_last_sync_at IS NULL THEN
        -- Fresh install: ONLY return active records (skip soft deletes and tombstones)
        RETURN QUERY
        SELECT
            q.id, q.v1_id, q.subject, q.topic, q."subTopic", q."examName", q."examYear", q."examDateShift", q.difficulty, q."questionType", q.tags, q.updated_at, q.deleted_at
        FROM questions q
        WHERE q.deleted_at IS NULL;
    ELSE
        -- Delta sync: Return updated records, soft-deleted records, AND hard-deleted tombstones
        RETURN QUERY
        SELECT
            q.id, q.v1_id, q.subject, q.topic, q."subTopic", q."examName", q."examYear", q."examDateShift", q.difficulty, q."questionType", q.tags, q.updated_at, q.deleted_at
        FROM questions q
        WHERE q.updated_at > p_last_sync_at

        UNION ALL

        SELECT
            t.id,
            NULL::TEXT as v1_id,
            NULL::TEXT as subject,
            NULL::TEXT as topic,
            NULL::TEXT as "subTopic",
            NULL::TEXT as "examName",
            NULL::INTEGER as "examYear",
            NULL::TEXT as "examDateShift",
            NULL::TEXT as difficulty,
            NULL::TEXT as "questionType",
            NULL::TEXT[] as tags,
            t.deleted_at as updated_at, -- Treat deleted_at as updated_at for sorting/delta logic
            t.deleted_at
        FROM deleted_question_logs t
        WHERE t.deleted_at > p_last_sync_at;
    END IF;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
