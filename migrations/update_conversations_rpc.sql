-- 1. Ensure Columns Exist for Online Status
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS is_online boolean DEFAULT false;
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS last_seen timestamp with time zone;

-- 2. Update get_conversations RPC
DROP FUNCTION IF EXISTS public.get_conversations(uuid, int, int);

CREATE OR REPLACE FUNCTION public.get_conversations(current_user_id uuid, limit_count int DEFAULT 20, offset_count int DEFAULT 0)
RETURNS TABLE (
    user_id uuid,
    username text,
    full_name text,
    avatar_url text,
    is_verified boolean,
    last_message text,
    last_message_time timestamp with time zone,
    is_read boolean,
    sender_id uuid,
    is_online boolean,
    last_seen timestamp with time zone
)
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
    RETURN QUERY
    WITH latest_messages AS (
        SELECT DISTINCT ON (partner_id)
            m.id,
            m.content,
            m.created_at,
            m.is_read,
            m.sender_id,
            CASE 
                WHEN m.sender_id = current_user_id THEN m.receiver_id 
                ELSE m.sender_id 
            END AS partner_id
        FROM messages m
        WHERE m.sender_id = current_user_id OR m.receiver_id = current_user_id
        ORDER BY partner_id, m.created_at DESC
    )
    SELECT 
        p.id AS user_id,
        p.username,
        p.full_name,
        p.avatar_url,
        p.is_verified,
        lm.content AS last_message,
        lm.created_at AS last_message_time,
        lm.is_read,
        lm.sender_id,
        p.is_online,
        p.last_seen
    FROM latest_messages lm
    JOIN profiles p ON p.id = lm.partner_id
    ORDER BY lm.created_at DESC
    LIMIT limit_count OFFSET offset_count;
END;
$$;

-- 3. Fix: Add get_ranked_feed_v2 RPC (Fixes 404 error)
DROP FUNCTION IF EXISTS public.get_ranked_feed_v2(uuid, int, int);

CREATE OR REPLACE FUNCTION public.get_ranked_feed_v2(
  current_user_id uuid,
  limit_count int DEFAULT 10,
  offset_count int DEFAULT 0
)
RETURNS TABLE (
  id uuid,
  user_id uuid,
  caption text,
  image_url text,
  video_url text,
  created_at timestamp with time zone,
  likes_count bigint,
  comments_count bigint,
  view_count bigint,
  has_liked boolean,
  has_saved boolean,
  type text,
  username text,
  full_name text,
  avatar_url text,
  is_verified boolean
) AS $$
BEGIN
  RETURN QUERY
  WITH all_content AS (
      SELECT 
          p.id, p.user_id, p.caption, p.image_url, NULL::text as video_url, 
          p.created_at, p.engagement_score, 'post' as content_type,
          (SELECT count(*) FROM public.likes l WHERE l.post_id = p.id) as likes_count,
          (SELECT count(*) FROM public.comments c WHERE c.post_id = p.id) as comments_count,
          p.view_count
      FROM public.posts p
      UNION ALL
      SELECT 
          r.id, r.user_id, r.caption, NULL::text as image_url, r.video_url, 
          r.created_at, r.engagement_score, 'reel' as content_type,
          (SELECT count(*) FROM public.likes l WHERE l.reel_id = r.id) as likes_count,
          (SELECT count(*) FROM public.comments c WHERE c.reel_id = r.id) as comments_count,
          r.view_count
      FROM public.reels r
  ),
  scored_content AS (
      SELECT 
          ac.*,
          (
              (coalesce(ac.engagement_score, 0) * 0.4) + 
              (coalesce(ua.score, 0) * 0.6)
          ) as final_rank
      FROM all_content ac
      JOIN public.profiles pr ON ac.user_id = pr.id
      LEFT JOIN public.user_affinities ua ON ua.user_id = current_user_id AND ua.target_user_id = ac.user_id
  )
  SELECT 
      sc.id,
      sc.user_id,
      sc.caption,
      sc.image_url,
      sc.video_url,
      sc.created_at,
      sc.likes_count,
      sc.comments_count,
      sc.view_count,
      EXISTS(SELECT 1 FROM public.likes l WHERE (l.post_id = sc.id OR l.reel_id = sc.id) AND l.user_id = current_user_id) as has_liked,
      EXISTS(SELECT 1 FROM public.saves s WHERE s.post_id = sc.id AND s.user_id = current_user_id) as has_saved,
      sc.content_type as type,
      pr.username,
      pr.full_name,
      pr.avatar_url,
      pr.is_verified
  FROM scored_content sc
  JOIN public.profiles pr ON sc.user_id = pr.id
  WHERE 
    true
  ORDER BY 
    (CASE WHEN sc.user_id IN (SELECT following_id FROM public.follows WHERE follower_id = current_user_id) THEN 1 ELSE 0 END) DESC,
    sc.final_rank DESC, 
    sc.created_at DESC
  LIMIT limit_count OFFSET offset_count;
END;
$$ LANGUAGE plpgsql;
