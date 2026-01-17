-- CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
-- CREATE EXTENSION IF NOT EXISTS "pgcrypto";

CREATE TABLE IF NOT EXISTS public.profiles (
  id uuid REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL PRIMARY KEY,
  username text UNIQUE NOT NULL,
  full_name text,
  avatar_url text,
  bio text,
  website text,
  is_verified boolean DEFAULT false,
  last_seen timestamp with time zone,
  is_online boolean DEFAULT false,
  updated_at timestamp with time zone DEFAULT now() NOT NULL
);

CREATE TABLE IF NOT EXISTS public.posts (
  id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id uuid DEFAULT auth.uid() REFERENCES public.profiles(id) ON DELETE CASCADE NOT NULL,
  caption text,
  image_url text NOT NULL,
  created_at timestamp with time zone DEFAULT now() NOT NULL
);

CREATE TABLE IF NOT EXISTS public.reels (
  id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id uuid DEFAULT auth.uid() REFERENCES public.profiles(id) ON DELETE CASCADE NOT NULL,
  video_url text NOT NULL,
  caption text,
  audio_track_name text,
  created_at timestamp with time zone DEFAULT now() NOT NULL
);

CREATE TABLE IF NOT EXISTS public.likes (
  id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id uuid DEFAULT auth.uid() REFERENCES public.profiles(id) ON DELETE CASCADE NOT NULL,
  post_id uuid REFERENCES public.posts(id) ON DELETE CASCADE,
  reel_id uuid REFERENCES public.reels(id) ON DELETE CASCADE,
  created_at timestamp with time zone DEFAULT now() NOT NULL,
  CONSTRAINT likes_target_check CHECK (
    (post_id IS NOT NULL AND reel_id IS NULL) OR 
    (post_id IS NULL AND reel_id IS NOT NULL)
  ),
  UNIQUE (user_id, post_id),
  UNIQUE (user_id, reel_id)
);

CREATE TABLE IF NOT EXISTS public.comments (
  id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id uuid DEFAULT auth.uid() REFERENCES public.profiles(id) ON DELETE CASCADE NOT NULL,
  post_id uuid REFERENCES public.posts(id) ON DELETE CASCADE,
  reel_id uuid REFERENCES public.reels(id) ON DELETE CASCADE,
  text text NOT NULL,
  audio_url text,
  created_at timestamp with time zone DEFAULT now() NOT NULL,
  CONSTRAINT comments_target_check CHECK (
    (post_id IS NOT NULL AND reel_id IS NULL) OR 
    (post_id IS NULL AND reel_id IS NOT NULL)
  )
);

CREATE TABLE IF NOT EXISTS public.follows (
  follower_id uuid DEFAULT auth.uid() REFERENCES public.profiles(id) ON DELETE CASCADE NOT NULL,
  following_id uuid REFERENCES public.profiles(id) ON DELETE CASCADE NOT NULL,
  created_at timestamp with time zone DEFAULT now() NOT NULL,
  PRIMARY KEY (follower_id, following_id)
);

CREATE TABLE IF NOT EXISTS public.stories (
  id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id uuid DEFAULT auth.uid() REFERENCES public.profiles(id) ON DELETE CASCADE NOT NULL,
  media_url text NOT NULL,
  created_at timestamp with time zone DEFAULT now() NOT NULL,
  expires_at timestamp with time zone DEFAULT (now() + interval '24 hours') NOT NULL
);

CREATE TABLE IF NOT EXISTS public.messages (
  id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  sender_id uuid DEFAULT auth.uid() REFERENCES public.profiles(id) ON DELETE CASCADE NOT NULL,
  receiver_id uuid REFERENCES public.profiles(id) ON DELETE CASCADE NOT NULL,
  content text,
  media_url text,
  is_read boolean DEFAULT false NOT NULL,
  created_at timestamp with time zone DEFAULT now() NOT NULL
);

CREATE TABLE IF NOT EXISTS public.notifications (
  id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id uuid REFERENCES public.profiles(id) ON DELETE CASCADE NOT NULL,
  actor_id uuid DEFAULT auth.uid() REFERENCES public.profiles(id) ON DELETE CASCADE NOT NULL,
  type text NOT NULL,
  post_id uuid REFERENCES public.posts(id) ON DELETE CASCADE,
  reel_id uuid REFERENCES public.reels(id) ON DELETE CASCADE,
  is_read boolean DEFAULT false NOT NULL,
  created_at timestamp with time zone DEFAULT now() NOT NULL
);

CREATE TABLE IF NOT EXISTS public.saves (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    user_id UUID DEFAULT auth.uid() REFERENCES public.profiles(id) NOT NULL,
    post_id UUID REFERENCES public.posts(id) NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT now() NOT NULL,
    UNIQUE(user_id, post_id)
);

CREATE TABLE IF NOT EXISTS public.post_tags (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    post_id UUID REFERENCES public.posts(id) NOT NULL,
    user_id UUID REFERENCES public.profiles(id) NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT now() NOT NULL,
    UNIQUE(post_id, user_id)
);

CREATE INDEX IF NOT EXISTS idx_posts_user_id ON public.posts(user_id);
CREATE INDEX IF NOT EXISTS idx_posts_created_at ON public.posts(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_likes_post_id ON public.likes(post_id);
CREATE INDEX IF NOT EXISTS idx_likes_reel_id ON public.likes(reel_id);
CREATE INDEX IF NOT EXISTS idx_comments_post_id ON public.comments(post_id);
CREATE INDEX IF NOT EXISTS idx_comments_reel_id ON public.comments(reel_id);
CREATE INDEX IF NOT EXISTS idx_follows_following_id ON public.follows(following_id);
CREATE INDEX IF NOT EXISTS idx_notifications_user_id_unread ON public.notifications(user_id) WHERE is_read = false;
CREATE INDEX IF NOT EXISTS idx_messages_conversation ON public.messages(sender_id, receiver_id);

CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger AS $$
BEGIN
  INSERT INTO public.profiles (id, username, full_name, avatar_url)
  VALUES (
    new.id,
    new.raw_user_meta_data->>'username',
    new.raw_user_meta_data->>'full_name',
    new.raw_user_meta_data->>'avatar_url'
  );
  RETURN new;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE PROCEDURE public.handle_new_user();

CREATE OR REPLACE FUNCTION public.handle_new_like()
RETURNS trigger AS $$
DECLARE
  target_owner_id uuid;
  notification_type text := 'like';
BEGIN
  IF new.post_id IS NOT NULL THEN
    SELECT user_id INTO target_owner_id FROM public.posts WHERE id = new.post_id;
    IF target_owner_id IS NOT NULL AND target_owner_id != new.user_id THEN
      INSERT INTO public.notifications (user_id, actor_id, type, post_id)
      VALUES (target_owner_id, new.user_id, notification_type, new.post_id);
    END IF;
  ELSIF new.reel_id IS NOT NULL THEN
    SELECT user_id INTO target_owner_id FROM public.reels WHERE id = new.reel_id;
    IF target_owner_id IS NOT NULL AND target_owner_id != new.user_id THEN
      INSERT INTO public.notifications (user_id, actor_id, type, reel_id)
      VALUES (target_owner_id, new.user_id, notification_type, new.reel_id);
    END IF;
  END IF;
  
  return new;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

DROP TRIGGER IF EXISTS on_like_created ON public.likes;
CREATE TRIGGER on_like_created
  AFTER INSERT ON public.likes
  FOR EACH ROW EXECUTE PROCEDURE public.handle_new_like();

CREATE OR REPLACE FUNCTION public.handle_new_follow()
RETURNS trigger AS $$
BEGIN
  INSERT INTO public.notifications (user_id, actor_id, type)
  VALUES (new.following_id, new.follower_id, 'follow');
  return new;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

DROP TRIGGER IF EXISTS on_follow_created ON public.follows;
CREATE TRIGGER on_follow_created
  AFTER INSERT ON public.follows
  FOR EACH ROW EXECUTE PROCEDURE public.handle_new_follow();

CREATE OR REPLACE FUNCTION public.handle_new_comment()
RETURNS trigger AS $$
DECLARE
  target_owner_id uuid;
  notification_type text := 'comment';
  mention_record RECORD;
  mentioned_user_id uuid;
BEGIN
  IF new.post_id IS NOT NULL THEN
    SELECT user_id INTO target_owner_id FROM public.posts WHERE id = new.post_id;
    IF target_owner_id IS NOT NULL AND target_owner_id != new.user_id THEN
      INSERT INTO public.notifications (user_id, actor_id, type, post_id)
      VALUES (target_owner_id, new.user_id, notification_type, new.post_id);
    END IF;
  ELSIF new.reel_id IS NOT NULL THEN
    SELECT user_id INTO target_owner_id FROM public.reels WHERE id = new.reel_id;
    IF target_owner_id IS NOT NULL AND target_owner_id != new.user_id THEN
      INSERT INTO public.notifications (user_id, actor_id, type, reel_id)
      VALUES (target_owner_id, new.user_id, notification_type, new.reel_id);
    END IF;
  END IF;

  FOR mention_record IN 
    SELECT DISTINCT (regexp_matches(new.text, '@([a-zA-Z0-9_]+)', 'g'))[1] as username
  LOOP
    SELECT id INTO mentioned_user_id FROM public.profiles WHERE username = mention_record.username;
    
    IF mentioned_user_id IS NOT NULL 
       AND mentioned_user_id != new.user_id 
       AND (target_owner_id IS NULL OR mentioned_user_id != target_owner_id) 
    THEN
      INSERT INTO public.notifications (user_id, actor_id, type, post_id, reel_id)
      VALUES (mentioned_user_id, new.user_id, 'mention', new.post_id, new.reel_id);
    END IF;
  END LOOP;

  return new;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

DROP TRIGGER IF EXISTS on_comment_created ON public.comments;
CREATE TRIGGER on_comment_created
  AFTER INSERT ON public.comments
  FOR EACH ROW EXECUTE PROCEDURE public.handle_new_comment();

ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.posts ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.reels ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.likes ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.comments ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.follows ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.stories ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.messages ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.notifications ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.saves ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.post_tags ENABLE ROW LEVEL SECURITY;

-- Profiles
DROP POLICY IF EXISTS "Public profiles are viewable by everyone." ON public.profiles;
DROP POLICY IF EXISTS "Users can insert their own profile." ON public.profiles;
DROP POLICY IF EXISTS "Users can update their own profile." ON public.profiles;
CREATE POLICY "Public profiles are viewable by everyone." ON public.profiles FOR SELECT USING (true);
CREATE POLICY "Users can insert their own profile." ON public.profiles FOR INSERT WITH CHECK (auth.uid() = id);
CREATE POLICY "Users can update their own profile." ON public.profiles FOR UPDATE USING (auth.uid() = id);

-- Posts
DROP POLICY IF EXISTS "Posts are viewable by everyone." ON public.posts;
DROP POLICY IF EXISTS "Users can insert their own posts." ON public.posts;
DROP POLICY IF EXISTS "Users can update their own posts." ON public.posts;
DROP POLICY IF EXISTS "Users can delete their own posts." ON public.posts;
CREATE POLICY "Posts are viewable by everyone." ON public.posts FOR SELECT USING (true);
CREATE POLICY "Users can insert their own posts." ON public.posts FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can update their own posts." ON public.posts FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "Users can delete their own posts." ON public.posts FOR DELETE USING (auth.uid() = user_id);

-- Reels
DROP POLICY IF EXISTS "Reels are viewable by everyone." ON public.reels;
DROP POLICY IF EXISTS "Users can insert their own reels." ON public.reels;
DROP POLICY IF EXISTS "Users can delete their own reels." ON public.reels;
CREATE POLICY "Reels are viewable by everyone." ON public.reels FOR SELECT USING (true);
CREATE POLICY "Users can insert their own reels." ON public.reels FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can delete their own reels." ON public.reels FOR DELETE USING (auth.uid() = user_id);

-- Likes
DROP POLICY IF EXISTS "Likes are viewable by everyone." ON public.likes;
DROP POLICY IF EXISTS "Users can insert their own likes." ON public.likes;
DROP POLICY IF EXISTS "Users can delete their own likes." ON public.likes;
CREATE POLICY "Likes are viewable by everyone." ON public.likes FOR SELECT USING (true);
CREATE POLICY "Users can insert their own likes." ON public.likes FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can delete their own likes." ON public.likes FOR DELETE USING (auth.uid() = user_id);

-- Comments
DROP POLICY IF EXISTS "Comments are viewable by everyone." ON public.comments;
DROP POLICY IF EXISTS "Users can insert their own comments." ON public.comments;
DROP POLICY IF EXISTS "Users can delete their own comments." ON public.comments;
CREATE POLICY "Comments are viewable by everyone." ON public.comments FOR SELECT USING (true);
CREATE POLICY "Users can insert their own comments." ON public.comments FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can delete their own comments." ON public.comments FOR DELETE USING (
  auth.uid() = user_id OR 
  auth.uid() IN (SELECT user_id FROM public.posts WHERE id = post_id) OR
  auth.uid() IN (SELECT user_id FROM public.reels WHERE id = reel_id)
);

-- Follows
DROP POLICY IF EXISTS "Follows are viewable by everyone." ON public.follows;
DROP POLICY IF EXISTS "Users can follow others." ON public.follows;
DROP POLICY IF EXISTS "Users can unfollow others." ON public.follows;
CREATE POLICY "Follows are viewable by everyone." ON public.follows FOR SELECT USING (true);
CREATE POLICY "Users can follow others." ON public.follows FOR INSERT WITH CHECK (auth.uid() = follower_id);
CREATE POLICY "Users can unfollow others." ON public.follows FOR DELETE USING (auth.uid() = follower_id);

-- Stories
DROP POLICY IF EXISTS "Stories are viewable by everyone." ON public.stories;
DROP POLICY IF EXISTS "Users can insert their own stories." ON public.stories;
DROP POLICY IF EXISTS "Users can delete their own stories." ON public.stories;
CREATE POLICY "Stories are viewable by everyone." ON public.stories FOR SELECT USING (true);
CREATE POLICY "Users can insert their own stories." ON public.stories FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can delete their own stories." ON public.stories FOR DELETE USING (auth.uid() = user_id);

-- Messages
DROP POLICY IF EXISTS "Users can view their own messages." ON public.messages;
DROP POLICY IF EXISTS "Users can send messages." ON public.messages;
DROP POLICY IF EXISTS "Users can update their own messages." ON public.messages;
DROP POLICY IF EXISTS "Users can delete their own messages." ON public.messages;
CREATE POLICY "Users can view their own messages." ON public.messages FOR SELECT USING (auth.uid() = sender_id OR auth.uid() = receiver_id);
CREATE POLICY "Users can send messages." ON public.messages FOR INSERT WITH CHECK (auth.uid() = sender_id);
CREATE POLICY "Users can update their own messages." ON public.messages FOR UPDATE USING (auth.uid() = sender_id);
CREATE POLICY "Users can delete their own messages." ON public.messages FOR DELETE USING (auth.uid() = sender_id);

-- Notifications
DROP POLICY IF EXISTS "Users can view their own notifications." ON public.notifications;
DROP POLICY IF EXISTS "Users can create notifications they triggered." ON public.notifications;
CREATE POLICY "Users can view their own notifications." ON public.notifications FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can create notifications they triggered." ON public.notifications FOR INSERT WITH CHECK (auth.uid() = actor_id);

-- Saves
DROP POLICY IF EXISTS "Users can view their own saves" ON public.saves;
DROP POLICY IF EXISTS "Users can save posts" ON public.saves;
DROP POLICY IF EXISTS "Users can unsave posts" ON public.saves;
CREATE POLICY "Users can view their own saves" ON public.saves FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can save posts" ON public.saves FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can unsave posts" ON public.saves FOR DELETE USING (auth.uid() = user_id);

-- Post Tags
DROP POLICY IF EXISTS "Tags are viewable by everyone" ON public.post_tags;
DROP POLICY IF EXISTS "Post owners can tag users" ON public.post_tags;
DROP POLICY IF EXISTS "Post owners or tagged users can remove tags" ON public.post_tags;
CREATE POLICY "Tags are viewable by everyone" ON public.post_tags FOR SELECT USING (true);
CREATE POLICY "Post owners can tag users" ON public.post_tags FOR INSERT WITH CHECK (auth.uid() IN (SELECT user_id FROM public.posts WHERE id = post_id));
CREATE POLICY "Post owners or tagged users can remove tags" ON public.post_tags FOR DELETE USING (auth.uid() IN (SELECT user_id FROM public.posts WHERE id = post_id) OR auth.uid() = user_id);

-- Comment Likes
DROP POLICY IF EXISTS "Comment likes are viewable by everyone" ON public.comment_likes;
DROP POLICY IF EXISTS "Users can like comments" ON public.comment_likes;
DROP POLICY IF EXISTS "Users can unlike comments" ON public.comment_likes;
CREATE POLICY "Comment likes are viewable by everyone" ON public.comment_likes FOR SELECT USING (true);
CREATE POLICY "Users can like comments" ON public.comment_likes FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can unlike comments" ON public.comment_likes FOR DELETE USING (auth.uid() = user_id);

INSERT INTO storage.buckets (id, name, public)
VALUES
  ('avatars', 'avatars', true),
  ('posts', 'posts', true),
  ('stories', 'stories', true),
  ('reels', 'reels', true),
  ('messages', 'messages', true),
  ('audio-messages', 'audio-messages', true)
ON CONFLICT (id) DO UPDATE SET public = excluded.public;

-- Storage Policies

-- Avatars
DROP POLICY IF EXISTS "Avatar images are publicly accessible." ON storage.objects;
DROP POLICY IF EXISTS "Anyone can upload an avatar." ON storage.objects;
DROP POLICY IF EXISTS "Anyone can update their own avatar." ON storage.objects;
CREATE POLICY "Avatar images are publicly accessible." ON storage.objects FOR SELECT USING ( bucket_id = 'avatars' );
CREATE POLICY "Anyone can upload an avatar." ON storage.objects FOR INSERT WITH CHECK ( bucket_id = 'avatars' AND auth.role() = 'authenticated' );
CREATE POLICY "Anyone can update their own avatar." ON storage.objects FOR UPDATE USING ( bucket_id = 'avatars' AND auth.uid() = owner );

-- Posts
DROP POLICY IF EXISTS "Post images are publicly accessible." ON storage.objects;
DROP POLICY IF EXISTS "Anyone can upload a post image." ON storage.objects;
DROP POLICY IF EXISTS "Anyone can delete their own post image." ON storage.objects;
CREATE POLICY "Post images are publicly accessible." ON storage.objects FOR SELECT USING ( bucket_id = 'posts' );
CREATE POLICY "Anyone can upload a post image." ON storage.objects FOR INSERT WITH CHECK ( bucket_id = 'posts' AND auth.role() = 'authenticated' );
CREATE POLICY "Anyone can delete their own post image." ON storage.objects FOR DELETE USING ( bucket_id = 'posts' AND auth.uid() = owner );

-- Stories
DROP POLICY IF EXISTS "Story images are publicly accessible." ON storage.objects;
DROP POLICY IF EXISTS "Anyone can upload a story." ON storage.objects;
DROP POLICY IF EXISTS "Anyone can delete their own story." ON storage.objects;
CREATE POLICY "Story images are publicly accessible." ON storage.objects FOR SELECT USING ( bucket_id = 'stories' );
CREATE POLICY "Anyone can upload a story." ON storage.objects FOR INSERT WITH CHECK ( bucket_id = 'stories' AND auth.role() = 'authenticated' );
CREATE POLICY "Anyone can delete their own story." ON storage.objects FOR DELETE USING ( bucket_id = 'stories' AND auth.uid() = owner );

-- Reels
DROP POLICY IF EXISTS "Reel videos are publicly accessible." ON storage.objects;
DROP POLICY IF EXISTS "Anyone can upload a reel." ON storage.objects;
CREATE POLICY "Reel videos are publicly accessible." ON storage.objects FOR SELECT USING ( bucket_id = 'reels' );
CREATE POLICY "Anyone can upload a reel." ON storage.objects FOR INSERT WITH CHECK ( bucket_id = 'reels' AND auth.role() = 'authenticated' );

-- Messages
DROP POLICY IF EXISTS "Public Access for Messages" ON storage.objects;
DROP POLICY IF EXISTS "Users can upload message attachments." ON storage.objects;
CREATE POLICY "Public Access for Messages" ON storage.objects FOR SELECT USING (bucket_id = 'messages');
CREATE POLICY "Users can upload message attachments." ON storage.objects FOR INSERT WITH CHECK ( bucket_id = 'messages' AND auth.role() = 'authenticated' );

-- Audio Messages
DROP POLICY IF EXISTS "Public Access for Audio" ON storage.objects;
DROP POLICY IF EXISTS "Authenticated users can upload audio" ON storage.objects;
DROP POLICY IF EXISTS "Users can delete their own audio" ON storage.objects;
CREATE POLICY "Public Access for Audio" ON storage.objects FOR SELECT USING (bucket_id = 'audio-messages');
CREATE POLICY "Authenticated users can upload audio" ON storage.objects FOR INSERT WITH CHECK ( bucket_id = 'audio-messages' AND auth.role() = 'authenticated' );
CREATE POLICY "Users can delete their own audio" ON storage.objects FOR DELETE USING ( bucket_id = 'audio-messages' AND auth.uid() = owner );

CREATE INDEX IF NOT EXISTS idx_profiles_is_online ON public.profiles(is_online);
CREATE INDEX IF NOT EXISTS idx_profiles_last_seen ON public.profiles(last_seen DESC);

  DO $$
  BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_publication WHERE pubname = 'supabase_realtime') THEN
      CREATE PUBLICATION supabase_realtime;
    END IF;
  END
  $$;

  DO $$
  BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_publication_tables WHERE pubname = 'supabase_realtime' AND tablename = 'messages') THEN
      ALTER PUBLICATION supabase_realtime ADD TABLE public.messages;
    END IF;
    IF NOT EXISTS (SELECT 1 FROM pg_publication_tables WHERE pubname = 'supabase_realtime' AND tablename = 'profiles') THEN
      ALTER PUBLICATION supabase_realtime ADD TABLE public.profiles;
    END IF;
  END
  $$;

  ALTER TABLE public.messages REPLICA IDENTITY FULL;
  ALTER TABLE public.profiles REPLICA IDENTITY FULL;

-- CREATE EXTENSION IF NOT EXISTS pg_trgm;

CREATE INDEX IF NOT EXISTS idx_posts_caption_trgm ON public.posts USING gin (caption gin_trgm_ops);
CREATE INDEX IF NOT EXISTS idx_profiles_username_trgm ON public.profiles USING gin (username gin_trgm_ops);
CREATE INDEX IF NOT EXISTS idx_profiles_fullname_trgm ON public.profiles USING gin (full_name gin_trgm_ops);

ALTER TABLE public.posts ADD COLUMN IF NOT EXISTS likes_count BIGINT DEFAULT 0;
ALTER TABLE public.posts ADD COLUMN IF NOT EXISTS comments_count BIGINT DEFAULT 0;

ALTER TABLE public.reels ADD COLUMN IF NOT EXISTS likes_count BIGINT DEFAULT 0;
ALTER TABLE public.reels ADD COLUMN IF NOT EXISTS comments_count BIGINT DEFAULT 0;

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

DROP TRIGGER IF EXISTS on_like_change ON public.likes;
CREATE TRIGGER on_like_change
AFTER INSERT OR DELETE ON public.likes
FOR EACH ROW EXECUTE FUNCTION public.update_counts();

DROP TRIGGER IF EXISTS on_comment_change ON public.comments;
CREATE TRIGGER on_comment_change
AFTER INSERT OR DELETE ON public.comments
FOR EACH ROW EXECUTE FUNCTION public.update_counts();

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

CREATE INDEX IF NOT EXISTS idx_messages_sender_id ON public.messages(sender_id);
CREATE INDEX IF NOT EXISTS idx_messages_receiver_id ON public.messages(receiver_id);

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

-- Enhance Comments: Nested Replies and Heart Reactions

-- 1. Add parent_id for nested replies
ALTER TABLE public.comments 
ADD COLUMN IF NOT EXISTS parent_id uuid REFERENCES public.comments(id) ON DELETE CASCADE;

-- 2. Add likes_count for heart reactions caching
ALTER TABLE public.comments 
ADD COLUMN IF NOT EXISTS likes_count bigint DEFAULT 0;

-- 3. Create comment_likes table
CREATE TABLE IF NOT EXISTS public.comment_likes (
  id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id uuid DEFAULT auth.uid() REFERENCES public.profiles(id) ON DELETE CASCADE NOT NULL,
  comment_id uuid REFERENCES public.comments(id) ON DELETE CASCADE NOT NULL,
  created_at timestamp with time zone DEFAULT now() NOT NULL,
  UNIQUE(user_id, comment_id)
);

-- 4. Enable RLS on new table
ALTER TABLE public.comment_likes ENABLE ROW LEVEL SECURITY;

-- 5. Add RLS Policies for comment_likes
DO $$
BEGIN
    CREATE POLICY "Comment likes are viewable by everyone" ON public.comment_likes FOR SELECT USING (true);
    CREATE POLICY "Users can like comments" ON public.comment_likes FOR INSERT WITH CHECK (auth.uid() = user_id);
    CREATE POLICY "Users can unlike comments" ON public.comment_likes FOR DELETE USING (auth.uid() = user_id);
EXCEPTION
    WHEN duplicate_object THEN NULL;
END
$$;

-- 6. Trigger to update comment likes count
CREATE OR REPLACE FUNCTION public.update_comment_likes_count()
RETURNS TRIGGER AS $$
BEGIN
    IF (TG_OP = 'INSERT') THEN
        UPDATE public.comments SET likes_count = likes_count + 1 WHERE id = NEW.comment_id;
        RETURN NEW;
    ELSIF (TG_OP = 'DELETE') THEN
        UPDATE public.comments SET likes_count = GREATEST(likes_count - 1, 0) WHERE id = OLD.comment_id;
        RETURN OLD;
    END IF;
    RETURN NULL;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

DROP TRIGGER IF EXISTS on_comment_like_change ON public.comment_likes;
CREATE TRIGGER on_comment_like_change
  AFTER INSERT OR DELETE ON public.comment_likes
  FOR EACH ROW EXECUTE PROCEDURE public.update_comment_likes_count();

-- 7. Add index for performance
CREATE INDEX IF NOT EXISTS idx_comments_parent_id ON public.comments(parent_id);
CREATE INDEX IF NOT EXISTS idx_comment_likes_comment_id ON public.comment_likes(comment_id);
CREATE OR REPLACE FUNCTION public.handle_new_comment()
RETURNS trigger AS $$
DECLARE
  target_owner_id uuid;
  notification_type text := 'comment';
  mention_record RECORD;
  mentioned_user_id uuid;
BEGIN
  -- Notify Post/Reel Owner
  IF new.post_id IS NOT NULL THEN
    SELECT user_id INTO target_owner_id FROM public.posts WHERE id = new.post_id;
    IF target_owner_id IS NOT NULL AND target_owner_id != new.user_id THEN
      INSERT INTO public.notifications (user_id, actor_id, type, post_id)
      VALUES (target_owner_id, new.user_id, notification_type, new.post_id);
    END IF;
  ELSIF new.reel_id IS NOT NULL THEN
    SELECT user_id INTO target_owner_id FROM public.reels WHERE id = new.reel_id;
    IF target_owner_id IS NOT NULL AND target_owner_id != new.user_id THEN
      INSERT INTO public.notifications (user_id, actor_id, type, reel_id)
      VALUES (target_owner_id, new.user_id, notification_type, new.reel_id);
    END IF;
  END IF;

  -- Handle Mentions (@username)
  FOR mention_record IN 
    SELECT DISTINCT (regexp_matches(new.text, '@([a-zA-Z0-9_]+)', 'g'))[1] as username
  LOOP
    SELECT id INTO mentioned_user_id FROM public.profiles WHERE username = mention_record.username;
    
    IF mentioned_user_id IS NOT NULL 
       AND mentioned_user_id != new.user_id 
       AND (target_owner_id IS NULL OR mentioned_user_id != target_owner_id) 
    THEN
      INSERT INTO public.notifications (user_id, actor_id, type, post_id, reel_id)
      VALUES (mentioned_user_id, new.user_id, 'mention', new.post_id, new.reel_id);
    END IF;
  END LOOP;

  return new;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
-- Enhance Comments: Nested Replies and Heart Reactions

-- 1. Add parent_id for nested replies
ALTER TABLE public.comments 
ADD COLUMN IF NOT EXISTS parent_id uuid REFERENCES public.comments(id) ON DELETE CASCADE;

-- 2. Add likes_count for heart reactions caching
ALTER TABLE public.comments 
ADD COLUMN IF NOT EXISTS likes_count bigint DEFAULT 0;

-- 3. Create comment_likes table
CREATE TABLE IF NOT EXISTS public.comment_likes (
  id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id uuid DEFAULT auth.uid() REFERENCES public.profiles(id) ON DELETE CASCADE NOT NULL,
  comment_id uuid REFERENCES public.comments(id) ON DELETE CASCADE NOT NULL,
  created_at timestamp with time zone DEFAULT now() NOT NULL,
  UNIQUE(user_id, comment_id)
);

-- 4. Enable RLS on new table
ALTER TABLE public.comment_likes ENABLE ROW LEVEL SECURITY;

-- 5. Add RLS Policies for comment_likes
DO $$
BEGIN
    CREATE POLICY "Comment likes are viewable by everyone" ON public.comment_likes FOR SELECT USING (true);
    CREATE POLICY "Users can like comments" ON public.comment_likes FOR INSERT WITH CHECK (auth.uid() = user_id);
    CREATE POLICY "Users can unlike comments" ON public.comment_likes FOR DELETE USING (auth.uid() = user_id);
EXCEPTION
    WHEN duplicate_object THEN NULL;
END
$$;

-- 6. Trigger to update comment likes count
CREATE OR REPLACE FUNCTION public.update_comment_likes_count()
RETURNS TRIGGER AS $$
BEGIN
    IF (TG_OP = 'INSERT') THEN
        UPDATE public.comments SET likes_count = likes_count + 1 WHERE id = NEW.comment_id;
        RETURN NEW;
    ELSIF (TG_OP = 'DELETE') THEN
        UPDATE public.comments SET likes_count = GREATEST(likes_count - 1, 0) WHERE id = OLD.comment_id;
        RETURN OLD;
    END IF;
    RETURN NULL;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

DROP TRIGGER IF EXISTS on_comment_like_change ON public.comment_likes;
CREATE TRIGGER on_comment_like_change
  AFTER INSERT OR DELETE ON public.comment_likes
  FOR EACH ROW EXECUTE PROCEDURE public.update_comment_likes_count();

-- 7. Add index for performance
CREATE INDEX IF NOT EXISTS idx_comments_parent_id ON public.comments(parent_id);
CREATE INDEX IF NOT EXISTS idx_comment_likes_comment_id ON public.comment_likes(comment_id);
-- 1. Add Viral Metrics Columns
ALTER TABLE public.posts ADD COLUMN IF NOT EXISTS view_count bigint DEFAULT 0;
ALTER TABLE public.posts ADD COLUMN IF NOT EXISTS share_count bigint DEFAULT 0;
ALTER TABLE public.posts ADD COLUMN IF NOT EXISTS engagement_score float DEFAULT 0;

ALTER TABLE public.reels ADD COLUMN IF NOT EXISTS view_count bigint DEFAULT 0;
ALTER TABLE public.reels ADD COLUMN IF NOT EXISTS share_count bigint DEFAULT 0;
ALTER TABLE public.reels ADD COLUMN IF NOT EXISTS engagement_score float DEFAULT 0;

ALTER TABLE public.comments ADD COLUMN IF NOT EXISTS likes_count int DEFAULT 0;

-- 2. User Affinity Tracking (The "Bond" between users)
CREATE TABLE IF NOT EXISTS public.user_affinities (
    id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
    user_id uuid REFERENCES public.profiles(id) ON DELETE CASCADE NOT NULL,
    target_user_id uuid REFERENCES public.profiles(id) ON DELETE CASCADE NOT NULL,
    score float DEFAULT 0,
    last_interaction timestamp with time zone DEFAULT now(),
    UNIQUE(user_id, target_user_id)
);

CREATE INDEX IF NOT EXISTS idx_user_affinities_user ON public.user_affinities(user_id);

-- 3. Function to Calculate Engagement Score
CREATE OR REPLACE FUNCTION public.calculate_engagement_score(
    p_likes bigint,
    p_comments bigint,
    p_shares bigint,
    p_views bigint,
    p_created_at timestamp with time zone
) RETURNS float AS $$
DECLARE
    w_like constant float := 1.0;
    w_comment constant float := 3.0;
    w_share constant float := 5.0;
    w_save constant float := 4.0; 
    age_hours float;
    raw_score float;
    decay_factor float;
BEGIN
    -- Base score from interactions
    raw_score := (p_likes * w_like) + 
                 (p_comments * w_comment) + 
                 (p_shares * w_share);
                 
    -- Normalize by views (High signals with low views = Quality)
    -- If views are 0, we treat it as 1 to avoid division by zero or weird boosts
    IF p_views > 0 THEN
       -- Logarithmic dampening of views so super-viral posts don't break the scale
       raw_score := raw_score * (1 + (1.0 / GREATEST(log(p_views + 1), 1.0))); 
    END IF;

    -- Time Decay: The "Gravity"
    age_hours := EXTRACT(EPOCH FROM (now() - p_created_at)) / 3600;
    
    -- Gravity Formula: Score / (Age + 2)^1.5
    -- This ensures fresh content (<2h) competes with viral content (24h+)
    decay_factor := POWER(GREATEST(age_hours, 0.0) + 2.0, 1.5);
    
    RETURN raw_score / decay_factor;
END;
$$ LANGUAGE plpgsql IMMUTABLE;

-- 4. Trigger to Auto-Update Score on New Like/Comment
CREATE OR REPLACE FUNCTION public.update_post_score()
RETURNS trigger AS $$
DECLARE
    target_post_id uuid;
    target_reel_id uuid;
    v_likes bigint;
    v_comments bigint;
    v_shares bigint;
    v_views bigint;
    v_created_at timestamp with time zone;
    new_score float;
BEGIN
    -- Determine if it's a post or reel update
    IF (TG_TABLE_NAME = 'likes') THEN
        target_post_id := NEW.post_id;
        target_reel_id := NEW.reel_id;
    ELSIF (TG_TABLE_NAME = 'comments') THEN
        target_post_id := NEW.post_id;
        target_reel_id := NEW.reel_id;
    END IF;

    IF target_post_id IS NOT NULL THEN
        SELECT count(*) INTO v_likes FROM public.likes WHERE post_id = target_post_id;
        SELECT count(*) INTO v_comments FROM public.comments WHERE post_id = target_post_id;
        -- SELECT count(*) INTO v_shares FROM public.shares WHERE post_id = target_post_id; -- Pending shares table
        v_shares := 0; 
        
        SELECT view_count, created_at, share_count INTO v_views, v_created_at, v_shares 
        FROM public.posts WHERE id = target_post_id;
        
        new_score := public.calculate_engagement_score(v_likes, v_comments, v_shares, v_views, v_created_at);
        
        UPDATE public.posts SET engagement_score = new_score WHERE id = target_post_id;
    
    ELSIF target_reel_id IS NOT NULL THEN
        -- Same logic for reels
         SELECT count(*) INTO v_likes FROM public.likes WHERE reel_id = target_reel_id;
         SELECT count(*) INTO v_comments FROM public.comments WHERE reel_id = target_reel_id;
         
         SELECT view_count, created_at, share_count INTO v_views, v_created_at, v_shares
         FROM public.reels WHERE id = target_reel_id;
         
         new_score := public.calculate_engagement_score(v_likes, v_comments, v_shares, v_views, v_created_at);
         
         UPDATE public.reels SET engagement_score = new_score WHERE id = target_reel_id;
    END IF;

    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Apply triggers
DROP TRIGGER IF EXISTS tr_update_score_likes ON public.likes;
CREATE TRIGGER tr_update_score_likes
AFTER INSERT OR DELETE ON public.likes
FOR EACH ROW EXECUTE PROCEDURE public.update_post_score();

DROP TRIGGER IF EXISTS tr_update_score_comments ON public.comments;
CREATE TRIGGER tr_update_score_comments
AFTER INSERT OR DELETE ON public.comments
FOR EACH ROW EXECUTE PROCEDURE public.update_post_score();


-- 5. RPC Function to Increment View Count (Called from Frontend)
-- Usage: supabase.rpc('increment_view_count', { target_id: '...', type: 'post' })
CREATE OR REPLACE FUNCTION public.increment_view_count(target_id uuid, type text)
RETURNS void AS $$
BEGIN
  IF type = 'post' THEN
    UPDATE public.posts 
    SET view_count = view_count + 1 
    WHERE id = target_id;
  ELSIF type = 'reel' THEN
    UPDATE public.reels 
    SET view_count = view_count + 1 
    WHERE id = target_id;
  END IF;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;


-- 6. The "BanglaRank" Feed Algorithm
-- Returns mixed feed of posts based on score and affinity
DROP FUNCTION IF EXISTS public.get_ranked_feed(uuid, int, int);

CREATE OR REPLACE FUNCTION public.get_ranked_feed(
  current_user_id uuid,
  limit_count int DEFAULT 10,
  offset_count int DEFAULT 0
)
RETURNS TABLE (
  id uuid,
  user_id uuid,
  caption text,
  image_url text, -- For posts
  video_url text, -- For reels (null if post)
  created_at timestamp with time zone,
  likes_count bigint,
  comments_count bigint,
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
      -- Select Posts
      SELECT 
          p.id, p.user_id, p.caption, p.image_url, NULL::text as video_url, 
          p.created_at, p.engagement_score, 'post' as content_type,
          (SELECT count(*) FROM public.likes l WHERE l.post_id = p.id) as likes_count,
          (SELECT count(*) FROM public.comments c WHERE c.post_id = p.id) as comments_count
      FROM public.posts p
      
      UNION ALL
      
      -- Select Reels
      SELECT 
          r.id, r.user_id, r.caption, NULL::text as image_url, r.video_url, 
          r.created_at, r.engagement_score, 'reel' as content_type,
          (SELECT count(*) FROM public.likes l WHERE l.reel_id = r.id) as likes_count,
          (SELECT count(*) FROM public.comments c WHERE c.reel_id = r.id) as comments_count
      FROM public.reels r
  ),
  scored_content AS (
      SELECT 
          ac.*,
          -- Final Rank = Algorithm Score + Affinity Boost
          (
              (coalesce(ac.engagement_score, 0) * 0.4) + 
              (coalesce(ua.score, 0) * 0.6)
          ) as final_rank
      FROM all_content ac
      JOIN public.profiles pr ON ac.user_id = pr.id
      -- Join Affinity to boost friends posts
      LEFT JOIN public.user_affinities ua ON ua.user_id = current_user_id AND ua.target_user_id = ac.user_id
      WHERE 
          -- Logic: 
          -- 1. Content from people I follow
          ac.user_id IN (SELECT following_id FROM public.follows WHERE follower_id = current_user_id)
          -- 2. OR high viral content (My personal explore in feed)
          OR (ac.engagement_score > 50)
          -- 3. OR Content from people I interact with a lot even if not following (Shadow follow)
          OR (ua.score > 20)
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
      EXISTS(SELECT 1 FROM public.likes l WHERE (l.post_id = sc.id OR l.reel_id = sc.id) AND l.user_id = current_user_id) as has_liked,
      EXISTS(SELECT 1 FROM public.saves s WHERE s.post_id = sc.id AND s.user_id = current_user_id) as has_saved,
      sc.content_type as type,
      pr.username,
      pr.full_name,
      pr.avatar_url,
      pr.is_verified
  FROM scored_content sc
  JOIN public.profiles pr ON sc.user_id = pr.id
  ORDER BY sc.final_rank DESC, sc.created_at DESC
  LIMIT limit_count OFFSET offset_count;
END;
$$ LANGUAGE plpgsql;

-- 7. Interaction Tracker (Updates Affinity)
-- Call this RPC whenever a user visits a profile or DMs someone
CREATE OR REPLACE FUNCTION public.track_user_interaction(
    target_user_id uuid,
    interaction_type text -- 'visit', 'like', 'comment', 'dm'
) RETURNS void AS $$
DECLARE
    score_increment float := 0;
BEGIN
    CASE interaction_type
        WHEN 'visit' THEN score_increment := 0.5;
        WHEN 'like' THEN score_increment := 1.0;
        WHEN 'comment' THEN score_increment := 3.0;
        WHEN 'dm' THEN score_increment := 5.0;
        ELSE score_increment := 0.1;
    END CASE;

    INSERT INTO public.user_affinities (user_id, target_user_id, score, last_interaction)
    VALUES (auth.uid(), target_user_id, score_increment, now())
    ON CONFLICT (user_id, target_user_id) 
    DO UPDATE SET 
        score = public.user_affinities.score + EXCLUDED.score,
        last_interaction = now();
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;


-- 8. Auto-Update Affinity on Like/Comment
CREATE OR REPLACE FUNCTION public.auto_update_affinity()
RETURNS trigger AS $$
DECLARE
    target_owner_id uuid;
    interaction_score float;
BEGIN
    -- Determine Interaction Type & Target Owner
    IF (TG_TABLE_NAME = 'likes') THEN
        interaction_score := 1.0;
        IF NEW.post_id IS NOT NULL THEN
             SELECT user_id INTO target_owner_id FROM public.posts WHERE id = NEW.post_id;
        ELSIF NEW.reel_id IS NOT NULL THEN
             SELECT user_id INTO target_owner_id FROM public.reels WHERE id = NEW.reel_id;
        END IF;
    ELSIF (TG_TABLE_NAME = 'comments') THEN
        interaction_score := 3.0;
         IF NEW.post_id IS NOT NULL THEN
             SELECT user_id INTO target_owner_id FROM public.posts WHERE id = NEW.post_id;
        ELSIF NEW.reel_id IS NOT NULL THEN
             SELECT user_id INTO target_owner_id FROM public.reels WHERE id = NEW.reel_id;
        END IF;
    ELSIF (TG_TABLE_NAME = 'follows') THEN
        interaction_score := 5.0;
        target_owner_id := NEW.following_id;
    END IF;

    -- Update Affinity if target is found and not self-interaction
    IF target_owner_id IS NOT NULL AND target_owner_id != NEW.user_id THEN
        -- Calls the interaction tracker logic internally or duplicates simple update
        INSERT INTO public.user_affinities (user_id, target_user_id, score, last_interaction)
        VALUES (NEW.user_id, target_owner_id, interaction_score, now())
        ON CONFLICT (user_id, target_user_id) 
        DO UPDATE SET 
            score = public.user_affinities.score + EXCLUDED.score,
            last_interaction = now();
    END IF;

    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Apply Affinity Triggers
DROP TRIGGER IF EXISTS tr_affinity_likes ON public.likes;
CREATE TRIGGER tr_affinity_likes
AFTER INSERT ON public.likes
FOR EACH ROW EXECUTE PROCEDURE public.auto_update_affinity();

DROP TRIGGER IF EXISTS tr_affinity_comments ON public.comments;
CREATE TRIGGER tr_affinity_comments
AFTER INSERT ON public.comments
FOR EACH ROW EXECUTE PROCEDURE public.auto_update_affinity();

DROP TRIGGER IF EXISTS tr_affinity_follows ON public.follows;
CREATE TRIGGER tr_affinity_follows
AFTER INSERT ON public.follows
FOR EACH ROW EXECUTE PROCEDURE public.auto_update_affinity();
-- 1. BACKFILL: Force calculate scores for existing content ensuring they are non-zero
UPDATE public.posts 
SET engagement_score = GREATEST(
    public.calculate_engagement_score(
        (SELECT count(*) FROM public.likes WHERE post_id = public.posts.id),
        (SELECT count(*) FROM public.comments WHERE post_id = public.posts.id),
        0, 
        view_count,
        created_at
    ),
    1.0 
)
WHERE id IS NOT NULL;

UPDATE public.reels
SET engagement_score = GREATEST(
    public.calculate_engagement_score(
        (SELECT count(*) FROM public.likes WHERE reel_id = public.reels.id),
        (SELECT count(*) FROM public.comments WHERE reel_id = public.reels.id),
        0, 
        view_count,
        created_at
    ),
    1.0
)
WHERE id IS NOT NULL;

-- 2. DROP AND RECREATE FUNCTION
-- CRITICAL: We MUST drop the function first because we are changing the return return type (adding views_count)
-- Postgres will NOT allow replacing a function if the return table signature changes.
DROP FUNCTION IF EXISTS public.get_ranked_feed(uuid, int, int);

CREATE OR REPLACE FUNCTION public.get_ranked_feed(
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
  views_count bigint, -- <--- Added this column
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
          p.view_count as views_count
      FROM public.posts p
      UNION ALL
      SELECT 
          r.id, r.user_id, r.caption, NULL::text as image_url, r.video_url, 
          r.created_at, r.engagement_score, 'reel' as content_type,
          (SELECT count(*) FROM public.likes l WHERE l.reel_id = r.id) as likes_count,
          (SELECT count(*) FROM public.comments c WHERE c.reel_id = r.id) as comments_count,
          r.view_count as views_count
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
      sc.views_count,
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
    (true)
  ORDER BY 
    (CASE WHEN sc.user_id IN (SELECT following_id FROM public.follows WHERE follower_id = current_user_id) THEN 1 ELSE 0 END) DESC,
    sc.final_rank DESC, 
    sc.created_at DESC
  LIMIT limit_count OFFSET offset_count;
END;
$$ LANGUAGE plpgsql;
-- VERSION 2 OF THE FEED ALGORITHM
-- We are creating a NEW function to ensure no caching/update conflicts occur.

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
