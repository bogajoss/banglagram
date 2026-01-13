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
