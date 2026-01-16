-- Enable Trigram extension for fast text search
CREATE EXTENSION IF NOT EXISTS pg_trgm;

-- Add search indexes
CREATE INDEX IF NOT EXISTS idx_posts_caption_trgm ON public.posts USING gin (caption gin_trgm_ops);
CREATE INDEX IF NOT EXISTS idx_profiles_username_trgm ON public.profiles USING gin (username gin_trgm_ops);
CREATE INDEX IF NOT EXISTS idx_profiles_fullname_trgm ON public.profiles USING gin (full_name gin_trgm_ops);

-- Add denormalized count columns
ALTER TABLE public.posts ADD COLUMN IF NOT EXISTS likes_count BIGINT DEFAULT 0;
ALTER TABLE public.posts ADD COLUMN IF NOT EXISTS comments_count BIGINT DEFAULT 0;

ALTER TABLE public.reels ADD COLUMN IF NOT EXISTS likes_count BIGINT DEFAULT 0;
ALTER TABLE public.reels ADD COLUMN IF NOT EXISTS comments_count BIGINT DEFAULT 0;

-- Function to update counts
CREATE OR REPLACE FUNCTION public.update_counts()
RETURNS TRIGGER AS $$
BEGIN
    IF (TG_OP = 'INSERT') THEN
        IF (TG_TABLE_NAME = 'likes') THEN
            IF (NEW.post_id IS NOT NULL) THEN
                UPDATE public.posts SET likes_count = likes_count + 1 WHERE id = NEW.post_id;
            ELSIF (NEW.reel_id IS NOT NULL) THEN
                UPDATE public.reels SET likes_count = likes_count + 1 WHERE id = NEW.reel_id;
            END IF;
        ELSIF (TG_TABLE_NAME = 'comments') THEN
             IF (NEW.post_id IS NOT NULL) THEN
                UPDATE public.posts SET comments_count = comments_count + 1 WHERE id = NEW.post_id;
            ELSIF (NEW.reel_id IS NOT NULL) THEN
                UPDATE public.reels SET comments_count = comments_count + 1 WHERE id = NEW.reel_id;
            END IF;
        END IF;
        RETURN NEW;
    ELSIF (TG_OP = 'DELETE') THEN
        IF (TG_TABLE_NAME = 'likes') THEN
            IF (OLD.post_id IS NOT NULL) THEN
                UPDATE public.posts SET likes_count = likes_count - 1 WHERE id = OLD.post_id;
            ELSIF (OLD.reel_id IS NOT NULL) THEN
                UPDATE public.reels SET likes_count = likes_count - 1 WHERE id = OLD.reel_id;
            END IF;
        ELSIF (TG_TABLE_NAME = 'comments') THEN
             IF (OLD.post_id IS NOT NULL) THEN
                UPDATE public.posts SET comments_count = comments_count - 1 WHERE id = OLD.post_id;
            ELSIF (OLD.reel_id IS NOT NULL) THEN
                UPDATE public.reels SET comments_count = comments_count - 1 WHERE id = OLD.reel_id;
            END IF;
        END IF;
        RETURN OLD;
    END IF;
    RETURN NULL;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Triggers
DROP TRIGGER IF EXISTS on_like_change ON public.likes;
CREATE TRIGGER on_like_change
AFTER INSERT OR DELETE ON public.likes
FOR EACH ROW EXECUTE FUNCTION public.update_counts();

DROP TRIGGER IF EXISTS on_comment_change ON public.comments;
CREATE TRIGGER on_comment_change
AFTER INSERT OR DELETE ON public.comments
FOR EACH ROW EXECUTE FUNCTION public.update_counts();

-- Backfill existing data
UPDATE public.posts p 
SET 
    likes_count = (SELECT count(*) FROM public.likes l WHERE l.post_id = p.id),
    comments_count = (SELECT count(*) FROM public.comments c WHERE c.post_id = p.id)
WHERE id IS NOT NULL;

UPDATE public.reels r
SET 
    likes_count = (SELECT count(*) FROM public.likes l WHERE l.reel_id = r.id),
    comments_count = (SELECT count(*) FROM public.comments c WHERE c.reel_id = r.id)
WHERE id IS NOT NULL;

-- Create Optimized Feed RPC
CREATE OR REPLACE FUNCTION public.get_feed(current_user_id uuid, limit_count int DEFAULT 10, offset_count int DEFAULT 0)
RETURNS TABLE (
    id uuid,
    created_at timestamptz,
    caption text,
    image_url text,
    likes_count bigint,
    comments_count bigint,
    user_id uuid,
    username text,
    full_name text,
    avatar_url text,
    is_verified boolean,
    has_liked boolean,
    has_saved boolean
)
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
    RETURN QUERY
    SELECT 
        p.id,
        p.created_at,
        p.caption,
        p.image_url,
        p.likes_count,
        p.comments_count,
        p.user_id,
        pr.username,
        pr.full_name,
        pr.avatar_url,
        pr.is_verified,
        CASE WHEN current_user_id IS NOT NULL THEN
            EXISTS (SELECT 1 FROM public.likes l WHERE l.post_id = p.id AND l.user_id = current_user_id)
        ELSE false END AS has_liked,
        CASE WHEN current_user_id IS NOT NULL THEN
            EXISTS (SELECT 1 FROM public.saves s WHERE s.post_id = p.id AND s.user_id = current_user_id)
        ELSE false END AS has_saved
    FROM public.posts p
    JOIN public.profiles pr ON p.user_id = pr.id
    ORDER BY p.created_at DESC
    LIMIT limit_count OFFSET offset_count;
END;
$$;