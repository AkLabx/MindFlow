-- 1. Create partial index for lightning-fast subject taxonomy aggregation
CREATE INDEX IF NOT EXISTS idx_questions_subject_taxonomy 
ON questions (subject, topic, "subTopic") 
WHERE deleted_at IS NULL;

-- 2. Create RPC for aggregated subject topics and subtopics hierarchy with counts
CREATE OR REPLACE FUNCTION get_subject_topics_summary(p_subject TEXT)
RETURNS JSONB AS $$
DECLARE
  v_result JSONB;
BEGIN
  SELECT jsonb_object_agg(
    topic,
    jsonb_build_object(
      'total', total_count,
      'subtopics', subtopics_map
    )
  )
  INTO v_result
  FROM (
    SELECT 
      topic,
      sum(cnt)::int as total_count,
      jsonb_object_agg(COALESCE("subTopic", 'General'), cnt) as subtopics_map
    FROM (
      SELECT 
        topic, 
        "subTopic", 
        count(*)::int as cnt
      FROM questions
      WHERE subject = p_subject 
        AND deleted_at IS NULL
        AND topic IS NOT NULL
        AND trim(topic) <> ''
      GROUP BY topic, "subTopic"
    ) sub_counts
    GROUP BY topic
  ) topic_counts;

  RETURN COALESCE(v_result, '{}'::jsonb);
END;
$$ LANGUAGE plpgsql STABLE SECURITY DEFINER;

-- 3. Create targeted RPC for single subtopic question metadata (JIT quiz launch fallback)
CREATE OR REPLACE FUNCTION get_subtopic_quiz_metadata(
  p_subject TEXT,
  p_topic TEXT,
  p_subtopic TEXT
)
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
  updated_at TIMESTAMP WITH TIME ZONE
) AS $$
BEGIN
  RETURN QUERY
  SELECT
    q.id,
    q.v1_id,
    q.subject,
    q.topic,
    q."subTopic",
    q."examName",
    q."examYear",
    q."examDateShift",
    q.difficulty,
    q."questionType",
    q.tags,
    q.updated_at
  FROM questions q
  WHERE q.subject = p_subject
    AND q.topic = p_topic
    AND (
      (p_subtopic IS NULL AND (q."subTopic" IS NULL OR q."subTopic" = ''))
      OR (p_subtopic IS NOT NULL AND (q."subTopic" = p_subtopic OR (p_subtopic = 'General' AND (q."subTopic" IS NULL OR q."subTopic" = ''))))
    )
    AND q.deleted_at IS NULL;
END;
$$ LANGUAGE plpgsql STABLE SECURITY DEFINER;
