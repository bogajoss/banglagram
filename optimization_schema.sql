-- 1. Database Indexing
-- Speed up post filtering and sorting
CREATE INDEX IF NOT EXISTS idx_posts_user_id ON public.posts(user_id);
CREATE INDEX IF NOT EXISTS idx_posts_created_at ON public.posts(created_at DESC);

-- Speed up likes and comments lookups
CREATE INDEX IF NOT EXISTS idx_likes_post_id ON public.likes(post_id);
CREATE INDEX IF NOT EXISTS idx_comments_post_id ON public.comments(post_id);

-- Speed up follower lookups
CREATE INDEX IF NOT EXISTS idx_follows_following_id ON public.follows(following_id);

-- Speed up notification and message retrieval
CREATE INDEX IF NOT EXISTS idx_notifications_user_id_unread ON public.notifications(user_id) WHERE is_read = false;
CREATE INDEX IF NOT EXISTS idx_messages_conversation ON public.messages(sender_id, receiver_id);

-- 2. Profile Stats Optimization (Counter Cache)
-- Add columns to store counts directly in profiles
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS posts_count int DEFAULT 0;
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS followers_count int DEFAULT 0;
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS following_count int DEFAULT 0;

-- Function to update profile stats automatically
CREATE OR REPLACE FUNCTION public.update_profile_stats()
RETURNS trigger AS $$
BEGIN
    IF (TG_OP = 'INSERT') THEN
        IF (TG_TABLE_NAME = 'posts') THEN
            UPDATE public.profiles SET posts_count = posts_count + 1 WHERE id = NEW.user_id;
        ELSIF (TG_TABLE_NAME = 'follows') THEN
            UPDATE public.profiles SET followers_count = followers_count + 1 WHERE id = NEW.following_id;
            UPDATE public.profiles SET following_count = following_count + 1 WHERE id = NEW.follower_id;
        END IF;
    ELSIF (TG_OP = 'DELETE') THEN
        IF (TG_TABLE_NAME = 'posts') THEN
            UPDATE public.profiles SET posts_count = posts_count - 1 WHERE id = OLD.user_id;
        ELSIF (TG_TABLE_NAME = 'follows') THEN
            UPDATE public.profiles SET followers_count = followers_count - 1 WHERE id = OLD.following_id;
            UPDATE public.profiles SET following_count = following_count - 1 WHERE id = OLD.follower_id;
        END IF;
    END IF;
    RETURN NULL;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Triggers for posts
DROP TRIGGER IF EXISTS tr_update_posts_count ON public.posts;
CREATE TRIGGER tr_update_posts_count AFTER INSERT OR DELETE ON public.posts FOR EACH ROW EXECUTE FUNCTION public.update_profile_stats();

-- Triggers for follows
DROP TRIGGER IF EXISTS tr_update_follows_count ON public.follows;
CREATE TRIGGER tr_update_follows_count AFTER INSERT OR DELETE ON public.follows FOR EACH ROW EXECUTE FUNCTION public.update_profile_stats();

-- Initial sync of counts
UPDATE public.profiles p SET 
    posts_count = (SELECT count(*) FROM public.posts WHERE user_id = p.id),
    followers_count = (SELECT count(*) FROM public.follows WHERE following_id = p.id),
    following_count = (SELECT count(*) FROM public.follows WHERE follower_id = p.id)
WHERE true;
