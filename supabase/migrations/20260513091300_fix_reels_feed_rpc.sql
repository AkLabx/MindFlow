CREATE OR REPLACE FUNCTION get_reels_feed(p_limit INT, p_cursor TIMESTAMPTZ DEFAULT NULL)
RETURNS TABLE (
    id UUID,
    user_id UUID,
    video_url TEXT,
    caption TEXT,
    created_at TIMESTAMPTZ,
    updated_at TIMESTAMPTZ,
    likes_count BIGINT,
    comments_count BIGINT,
    score FLOAT
) AS $$
BEGIN
    RETURN QUERY
    SELECT
        r.id,
        r.user_id,
        r.video_url,
        r.caption,
        r.created_at,
        r.updated_at,
        COALESCE(lc.likes_count, 0) AS likes_count,
        COALESCE(cc.comments_count, 0) AS comments_count,
        (
            (COALESCE(lc.likes_count, 0) * 2.0) +
            (COALESCE(cc.comments_count, 0) * 3.0) -
            (EXTRACT(EPOCH FROM (now() - r.created_at)) / 3600.0 * 0.5)
        )::FLOAT AS score
    FROM
        public.reels r
    LEFT JOIN (
        SELECT reel_id, COUNT(*) AS likes_count
        FROM public.reel_likes
        GROUP BY reel_id
    ) lc ON r.id = lc.reel_id
    LEFT JOIN (
        SELECT reel_id, COUNT(*) AS comments_count
        FROM public.reel_comments
        GROUP BY reel_id
    ) cc ON r.id = cc.reel_id
    WHERE
        (p_cursor IS NULL OR r.created_at < p_cursor)
    ORDER BY
        score DESC, r.created_at DESC
    LIMIT p_limit;
END;
$$ LANGUAGE plpgsql;
