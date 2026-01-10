-- Trigger for LIKES
CREATE OR REPLACE FUNCTION public.handle_new_like()
RETURNS trigger AS $$
DECLARE
  post_owner_id uuid;
BEGIN
  -- Get the post owner
  SELECT user_id INTO post_owner_id FROM public.posts WHERE id = new.post_id;

  -- Only insert notification if the liker is not the owner
  IF post_owner_id IS NOT NULL AND post_owner_id != new.user_id THEN
    INSERT INTO public.notifications (user_id, actor_id, type, post_id)
    VALUES (post_owner_id, new.user_id, 'like', new.post_id);
  END IF;
  return new;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

DROP TRIGGER IF EXISTS on_like_created ON public.likes;
CREATE TRIGGER on_like_created
  AFTER INSERT ON public.likes
  FOR EACH ROW EXECUTE PROCEDURE public.handle_new_like();


-- Trigger for FOLLOWS
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


-- Trigger for COMMENTS (Future proofing)
CREATE OR REPLACE FUNCTION public.handle_new_comment()
RETURNS trigger AS $$
DECLARE
  post_owner_id uuid;
BEGIN
  SELECT user_id INTO post_owner_id FROM public.posts WHERE id = new.post_id;

  IF post_owner_id IS NOT NULL AND post_owner_id != new.user_id THEN
    INSERT INTO public.notifications (user_id, actor_id, type, post_id)
    VALUES (post_owner_id, new.user_id, 'comment', new.post_id);
  END IF;
  return new;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

DROP TRIGGER IF EXISTS on_comment_created ON public.comments;
CREATE TRIGGER on_comment_created
  AFTER INSERT ON public.comments
  FOR EACH ROW EXECUTE PROCEDURE public.handle_new_comment();
