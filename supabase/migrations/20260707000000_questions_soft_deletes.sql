-- 1. Add deleted_at column to questions table
ALTER TABLE questions ADD COLUMN IF NOT EXISTS deleted_at TIMESTAMP WITH TIME ZONE;

-- Drop existing function because return type changes
DROP FUNCTION IF EXISTS get_filtered_quiz_metadata(TIMESTAMP WITH TIME ZONE);

-- 2. Update RPC for delta sync
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
        RETURN QUERY
        SELECT
            q.id, q.v1_id, q.subject, q.topic, q."subTopic", q."examName", q."examYear", q."examDateShift", q.difficulty, q."questionType", q.tags, q.updated_at, q.deleted_at
        FROM questions q
        WHERE q.deleted_at IS NULL;
    ELSE
        RETURN QUERY
        SELECT
            q.id, q.v1_id, q.subject, q.topic, q."subTopic", q."examName", q."examYear", q."examDateShift", q.difficulty, q."questionType", q.tags, q.updated_at, q.deleted_at
        FROM questions q
        WHERE q.updated_at > p_last_sync_at;
    END IF;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 3. Trigger for updated_at when deleted_at is updated
-- The existing trigger 'update_questions_updated_at' should handle this automatically
-- when an UPDATE is performed on the row to set deleted_at = NOW()
