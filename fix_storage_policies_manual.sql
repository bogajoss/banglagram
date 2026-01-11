-- Safe Storage Policy Fix (Run this in Supabase SQL Editor)

-- 1. Ensure Buckets Exist
insert into storage.buckets (id, name, public)
values
  ('avatars', 'avatars', true),
  ('posts', 'posts', true),
  ('stories', 'stories', true),
  ('reels', 'reels', true),
  ('messages', 'messages', false)
ON CONFLICT (id) DO NOTHING;

-- 2. Create Policies Safely (Skip if exists to avoid ownership errors)
DO $$
BEGIN
    -- AVATARS
    IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE policyname = 'Avatar images are publicly accessible.' AND tablename = 'objects' AND schemaname = 'storage') THEN
        CREATE POLICY "Avatar images are publicly accessible." ON storage.objects FOR SELECT USING (bucket_id = 'avatars');
    END IF;
    IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE policyname = 'Anyone can upload an avatar.' AND tablename = 'objects' AND schemaname = 'storage') THEN
        CREATE POLICY "Anyone can upload an avatar." ON storage.objects FOR INSERT WITH CHECK (bucket_id = 'avatars' AND auth.role() = 'authenticated');
    END IF;
    IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE policyname = 'Anyone can update their own avatar.' AND tablename = 'objects' AND schemaname = 'storage') THEN
        CREATE POLICY "Anyone can update their own avatar." ON storage.objects FOR UPDATE USING (bucket_id = 'avatars' AND auth.uid() = owner);
    END IF;

    -- POSTS
    IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE policyname = 'Post images are publicly accessible.' AND tablename = 'objects' AND schemaname = 'storage') THEN
        CREATE POLICY "Post images are publicly accessible." ON storage.objects FOR SELECT USING (bucket_id = 'posts');
    END IF;
    IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE policyname = 'Anyone can upload a post image.' AND tablename = 'objects' AND schemaname = 'storage') THEN
        CREATE POLICY "Anyone can upload a post image." ON storage.objects FOR INSERT WITH CHECK (bucket_id = 'posts' AND auth.role() = 'authenticated');
    END IF;
    IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE policyname = 'Anyone can delete their own post image.' AND tablename = 'objects' AND schemaname = 'storage') THEN
        CREATE POLICY "Anyone can delete their own post image." ON storage.objects FOR DELETE USING (bucket_id = 'posts' AND auth.uid() = owner);
    END IF;

    -- STORIES
    IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE policyname = 'Story images are publicly accessible.' AND tablename = 'objects' AND schemaname = 'storage') THEN
        CREATE POLICY "Story images are publicly accessible." ON storage.objects FOR SELECT USING (bucket_id = 'stories');
    END IF;
    IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE policyname = 'Anyone can upload a story.' AND tablename = 'objects' AND schemaname = 'storage') THEN
        CREATE POLICY "Anyone can upload a story." ON storage.objects FOR INSERT WITH CHECK (bucket_id = 'stories' AND auth.role() = 'authenticated');
    END IF;
    IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE policyname = 'Anyone can delete their own story.' AND tablename = 'objects' AND schemaname = 'storage') THEN
        CREATE POLICY "Anyone can delete their own story." ON storage.objects FOR DELETE USING (bucket_id = 'stories' AND auth.uid() = owner);
    END IF;

    -- REELS
    IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE policyname = 'Reel videos are publicly accessible.' AND tablename = 'objects' AND schemaname = 'storage') THEN
        CREATE POLICY "Reel videos are publicly accessible." ON storage.objects FOR SELECT USING (bucket_id = 'reels');
    END IF;
    IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE policyname = 'Anyone can upload a reel.' AND tablename = 'objects' AND schemaname = 'storage') THEN
        CREATE POLICY "Anyone can upload a reel." ON storage.objects FOR INSERT WITH CHECK (bucket_id = 'reels' AND auth.role() = 'authenticated');
    END IF;

    -- MESSAGES
    IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE policyname = 'Users can view images in messages they are part of.' AND tablename = 'objects' AND schemaname = 'storage') THEN
        CREATE POLICY "Users can view images in messages they are part of." ON storage.objects FOR SELECT USING (bucket_id = 'messages' AND auth.role() = 'authenticated');
    END IF;
    IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE policyname = 'Users can upload message attachments.' AND tablename = 'objects' AND schemaname = 'storage') THEN
        CREATE POLICY "Users can upload message attachments." ON storage.objects FOR INSERT WITH CHECK (bucket_id = 'messages' AND auth.role() = 'authenticated');
    END IF;
END
$$;