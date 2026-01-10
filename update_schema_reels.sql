-- 1. Modify LIKES table to support Reels
ALTER TABLE public.likes ALTER COLUMN post_id DROP NOT NULL;
ALTER TABLE public.likes ADD COLUMN IF NOT EXISTS reel_id uuid REFERENCES public.reels(id) ON DELETE CASCADE;
-- Ensure we like either a post or a reel, not both, and not neither
ALTER TABLE public.likes DROP CONSTRAINT IF EXISTS likes_target_check;
ALTER TABLE public.likes ADD CONSTRAINT likes_target_check CHECK (
  (post_id IS NOT NULL AND reel_id IS NULL) OR 
  (post_id IS NULL AND reel_id IS NOT NULL)
);
-- Update unique constraint to allow one like per user per reel
-- Existing constraint is UNIQUE(user_id, post_id). This works for posts.
-- We need a unique constraint for reels too.
ALTER TABLE public.likes ADD CONSTRAINT likes_reel_unique UNIQUE (user_id, reel_id);


-- 2. Modify COMMENTS table to support Reels
ALTER TABLE public.comments ALTER COLUMN post_id DROP NOT NULL;
ALTER TABLE public.comments ADD COLUMN IF NOT EXISTS reel_id uuid REFERENCES public.reels(id) ON DELETE CASCADE;
ALTER TABLE public.comments DROP CONSTRAINT IF EXISTS comments_target_check;
ALTER TABLE public.comments ADD CONSTRAINT comments_target_check CHECK (
  (post_id IS NOT NULL AND reel_id IS NULL) OR 
  (post_id IS NULL AND reel_id IS NOT NULL)
);


-- 3. Modify NOTIFICATIONS table to support Reels
ALTER TABLE public.notifications ALTER COLUMN post_id DROP NOT NULL;
ALTER TABLE public.notifications ADD COLUMN IF NOT EXISTS reel_id uuid REFERENCES public.reels(id) ON DELETE CASCADE;


-- 4. Update Notifications Trigger for LIKES (Handle Reels)
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


-- 5. Update Notifications Trigger for COMMENTS (Handle Reels)
CREATE OR REPLACE FUNCTION public.handle_new_comment()
RETURNS trigger AS $$
DECLARE
  target_owner_id uuid;
  notification_type text := 'comment';
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
