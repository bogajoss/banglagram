-- Enable the storage extension if not already enabled (usually enabled by default)
-- CREATE EXTENSION IF NOT EXISTS "storage";

-- Create Buckets
insert into storage.buckets (id, name, public)
values
  ('avatars', 'avatars', true),
  ('posts', 'posts', true),
  ('stories', 'stories', true),
  ('reels', 'reels', true),
  ('messages', 'messages', false)
ON CONFLICT (id) DO NOTHING;

-- Policy Helper function (optional, but good for clarity)
-- Note: Storage policies are on storage.objects

-- 1. AVATARS
DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE policyname = 'Avatar images are publicly accessible.' AND tablename = 'objects' AND schemaname = 'storage') THEN
        create policy "Avatar images are publicly accessible." on storage.objects for select using ( bucket_id = 'avatars' );
    END IF;
    IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE policyname = 'Anyone can upload an avatar.' AND tablename = 'objects' AND schemaname = 'storage') THEN
        create policy "Anyone can upload an avatar." on storage.objects for insert with check ( bucket_id = 'avatars' and auth.role() = 'authenticated' );
    END IF;
    IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE policyname = 'Anyone can update their own avatar.' AND tablename = 'objects' AND schemaname = 'storage') THEN
        create policy "Anyone can update their own avatar." on storage.objects for update using ( bucket_id = 'avatars' and auth.uid() = owner ) with check ( bucket_id = 'avatars' and auth.uid() = owner );
    END IF;
END
$$;

-- 2. POSTS
DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE policyname = 'Post images are publicly accessible.' AND tablename = 'objects' AND schemaname = 'storage') THEN
        create policy "Post images are publicly accessible." on storage.objects for select using ( bucket_id = 'posts' );
    END IF;
    IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE policyname = 'Anyone can upload a post image.' AND tablename = 'objects' AND schemaname = 'storage') THEN
        create policy "Anyone can upload a post image." on storage.objects for insert with check ( bucket_id = 'posts' and auth.role() = 'authenticated' );
    END IF;
    IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE policyname = 'Anyone can delete their own post image.' AND tablename = 'objects' AND schemaname = 'storage') THEN
        create policy "Anyone can delete their own post image." on storage.objects for delete using ( bucket_id = 'posts' and auth.uid() = owner );
    END IF;
END
$$;

-- 3. STORIES
DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE policyname = 'Story images are publicly accessible.' AND tablename = 'objects' AND schemaname = 'storage') THEN
        create policy "Story images are publicly accessible." on storage.objects for select using ( bucket_id = 'stories' );
    END IF;
    IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE policyname = 'Anyone can upload a story.' AND tablename = 'objects' AND schemaname = 'storage') THEN
        create policy "Anyone can upload a story." on storage.objects for insert with check ( bucket_id = 'stories' and auth.role() = 'authenticated' );
    END IF;
    IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE policyname = 'Anyone can delete their own story.' AND tablename = 'objects' AND schemaname = 'storage') THEN
        create policy "Anyone can delete their own story." on storage.objects for delete using ( bucket_id = 'stories' and auth.uid() = owner );
    END IF;
END
$$;

-- 4. REELS
DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE policyname = 'Reel videos are publicly accessible.' AND tablename = 'objects' AND schemaname = 'storage') THEN
        create policy "Reel videos are publicly accessible." on storage.objects for select using ( bucket_id = 'reels' );
    END IF;
    IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE policyname = 'Anyone can upload a reel.' AND tablename = 'objects' AND schemaname = 'storage') THEN
        create policy "Anyone can upload a reel." on storage.objects for insert with check ( bucket_id = 'reels' and auth.role() = 'authenticated' );
    END IF;
END
$$;

-- 5. MESSAGES
DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE policyname = 'Users can view images in messages they are part of.' AND tablename = 'objects' AND schemaname = 'storage') THEN
        create policy "Users can view images in messages they are part of." on storage.objects for select using ( bucket_id = 'messages' and auth.role() = 'authenticated' );
    END IF;
    IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE policyname = 'Users can upload message attachments.' AND tablename = 'objects' AND schemaname = 'storage') THEN
        create policy "Users can upload message attachments." on storage.objects for insert with check ( bucket_id = 'messages' and auth.role() = 'authenticated' );
    END IF;
END
$$;
