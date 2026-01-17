CREATE OR REPLACE FUNCTION public.exec_sql(query text)
RETURNS json
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  EXECUTE query;
  RETURN json_build_object('status', 'success');
EXCEPTION WHEN OTHERS THEN
  RETURN json_build_object('status', 'error', 'message', SQLERRM);
END;
$$;

CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "pgcrypto";

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

DO $$
BEGIN
    CREATE POLICY "Public profiles are viewable by everyone." ON public.profiles FOR SELECT USING (true);
    CREATE POLICY "Users can insert their own profile." ON public.profiles FOR INSERT WITH CHECK (auth.uid() = id);
    CREATE POLICY "Users can update their own profile." ON public.profiles FOR UPDATE USING (auth.uid() = id);

    CREATE POLICY "Posts are viewable by everyone." ON public.posts FOR SELECT USING (true);
    CREATE POLICY "Users can insert their own posts." ON public.posts FOR INSERT WITH CHECK (auth.uid() = user_id);
    CREATE POLICY "Users can update their own posts." ON public.posts FOR UPDATE USING (auth.uid() = user_id);
    CREATE POLICY "Users can delete their own posts." ON public.posts FOR DELETE USING (
      auth.uid() = user_id
    );

    CREATE POLICY "Reels are viewable by everyone." ON public.reels FOR SELECT USING (true);
    CREATE POLICY "Users can insert their own reels." ON public.reels FOR INSERT WITH CHECK (auth.uid() = user_id);
    CREATE POLICY "Users can delete their own reels." ON public.reels FOR DELETE USING (
      auth.uid() = user_id OR 
      auth.uid() IN (SELEC

    CREATE POLICY "Likes are viewable by everyone." ON public.likes FOR SELECT USING (true);
    CREATE POLICY "Users can insert their own likes." ON public.likes FOR INSERT WITH CHECK (auth.uid() = user_id);
    CREATE POLICY "Users can delete their own likes." ON public.likes FOR DELETE USING (auth.uid() = user_id);

    CREATE POLICY "Comments are viewable by everyone." ON public.comments FOR SELECT USING (true);
    CREATE POLICY "Users can insert their own comments." ON public.comments FOR INSERT WITH CHECK (auth.uid() = user_id);
    CREATE POLICY "Users can delete their own comments." ON public.comments FOR DELETE USING (
      auth.uid() = user_id OR 
      auth.uid() IN (SELEC

    CREATE POLICY "Follows are viewable by everyone." ON public.follows FOR SELECT USING (true);
    CREATE POLICY "Users can follow others." ON public.follows FOR INSERT WITH CHECK (auth.uid() = follower_id);
    CREATE POLICY "Users can unfollow others." ON public.follows FOR DELETE USING (auth.uid() = follower_id);

    CREATE POLICY "Stories are viewable by everyone." ON public.stories FOR SELECT USING (true);
    CREATE POLICY "Users can insert their own stories." ON public.stories FOR INSERT WITH CHECK (auth.uid() = user_id);
    CREATE POLICY "Users can delete their own stories." ON public.stories FOR DELETE USING (auth.uid() = user_id);

    CREATE POLICY "Users can view their own messages." ON public.messages FOR SELECT USING (auth.uid() = sender_id OR auth.uid() = receiver_id);
    CREATE POLICY "Users can send messages." ON public.messages FOR INSERT WITH CHECK (auth.uid() = sender_id);
    CREATE POLICY "Users can update their own messages." ON public.messages FOR UPDATE USING (auth.uid() = sender_id);
    CREATE POLICY "Users can delete their own messages." ON public.messages FOR DELETE USING (auth.uid() = sender_id);

    CREATE POLICY "Users can view their own notifications." ON public.notifications FOR SELECT USING (auth.uid() = user_id);
    CREATE POLICY "Users can create notifications they triggered." ON public.notifications FOR INSERT WITH CHECK (auth.uid() = actor_id);

    CREATE POLICY "Users can view their own saves" ON public.saves FOR SELECT USING (auth.uid() = user_id);
    CREATE POLICY "Users can save posts" ON public.saves FOR INSERT WITH CHECK (auth.uid() = user_id);
    CREATE POLICY "Users can unsave posts" ON public.saves FOR DELETE USING (auth.uid() = user_id);

    CREATE POLICY "Tags are viewable by everyone" ON public.post_tags FOR SELECT USING (true);
    CREATE POLICY "Post owners can tag users" ON public.post_tags FOR INSERT WITH CHECK (auth.uid() IN (SELECT user_id FROM public.posts WHERE id = post_id));
    CREATE POLICY "Post owners or tagged users can remove tags" ON public.post_tags FOR DELETE USING (auth.uid() IN (SELECT user_id FROM public.posts WHERE id = post_id) OR auth.uid() = user_id);

EXCEPTION
    WHEN duplicate_object THEN
        NULL;
END
$$;

INSERT INTO storage.buckets (id, name, public)
VALUES
  ('avatars', 'avatars', true),
  ('posts', 'posts', true),
  ('stories', 'stories', true),
  ('reels', 'reels', true),
  ('messages', 'messages', true),
  ('audio-messages', 'audio-messages', true)
ON CONFLICT (id) DO UPDATE SET public = excluded.public;

DO $$
BEGIN
    CREATE POLICY "Avatar images are publicly accessible." ON storage.objects FOR SELECT USING ( bucket_id = 'avatars' );
    CREATE POLICY "Anyone can upload an avatar." ON storage.objects FOR INSERT WITH CHECK ( bucket_id = 'avatars' AND auth.role() = 'authenticated' );
    CREATE POLICY "Anyone can update their own avatar." ON storage.objects FOR UPDATE USING ( bucket_id = 'avatars' AND auth.uid() = owner );

    CREATE POLICY "Post images are publicly accessible." ON storage.objects FOR SELECT USING ( bucket_id = 'posts' );
    CREATE POLICY "Anyone can upload a post image." ON storage.objects FOR INSERT WITH CHECK ( bucket_id = 'posts' AND auth.role() = 'authenticated' );
    CREATE POLICY "Anyone can delete their own post image." ON storage.objects FOR DELETE USING ( bucket_id = 'posts' AND auth.uid() = owner );

    CREATE POLICY "Story images are publicly accessible." ON storage.objects FOR SELECT USING ( bucket_id = 'stories' );
    CREATE POLICY "Anyone can upload a story." ON storage.objects FOR INSERT WITH CHECK ( bucket_id = 'stories' AND auth.role() = 'authenticated' );
    CREATE POLICY "Anyone can delete their own story." ON storage.objects FOR DELETE USING ( bucket_id = 'stories' AND auth.uid() = owner );

    CREATE POLICY "Reel videos are publicly accessible." ON storage.objects FOR SELECT USING ( bucket_id = 'reels' );
    CREATE POLICY "Anyone can upload a reel." ON storage.objects FOR INSERT WITH CHECK ( bucket_id = 'reels' AND auth.role() = 'authenticated' );

    CREATE POLICY "Public Access for Messages" ON storage.objects FOR SELECT USING (bucket_id = 'messages');
    CREATE POLICY "Users can upload message attachments." ON storage.objects FOR INSERT WITH CHECK ( bucket_id = 'messages' AND auth.role() = 'authenticated' );

    CREATE POLICY "Public Access for Audio" ON storage.objects FOR SELECT USING (bucket_id = 'audio-messages');
    CREATE POLICY "Authenticated users can upload audio" ON storage.objects FOR INSERT WITH CHECK ( bucket_id = 'audio-messages' AND auth.role() = 'authenticated' );
    CREATE POLICY "Users can delete their own audio" ON storage.objects FOR DELETE USING ( bucket_id = 'audio-messages' AND auth.uid() = owner );

EXCEPTION
    WHEN duplicate_object THEN
        NULL;
END
$$;

CREATE INDEX IF NOT EXISTS idx_profiles_is_online ON public.profiles(is_online);
CREATE INDEX IF NOT EXISTS idx_profiles_last_seen ON public.profiles(last_seen DESC);

BEGIN;
  DO $$
  BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_publication WHERE pubname = 'supabase_realtime') THEN
      CREATE PUBLICATION supabase_realtime;
    END IF;
  END
  $$;

  ALTER PUBLICATION supabase_realtime ADD TABLE public.messages;
  ALTER PUBLICATION supabase_realtime ADD TABLE public.profiles;

  ALTER TABLE public.messages REPLICA IDENTITY FULL;
  ALTER TABLE public.profiles REPLICA IDENTITY FULL;
COMMIT;

CREATE EXTENSION IF NOT EXISTS pg_trgm;

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
    sender_id uuid
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
        lm.sender_id
    FROM latest_messages lm
    JOIN profiles p ON p.id = lm.partner_id
    ORDER BY lm.created_at DESC
    LIMIT limit_count OFFSET offset_count;
END;
$$;