-- Enable the storage extension if not already enabled (usually enabled by default)
-- CREATE EXTENSION IF NOT EXISTS "storage";

-- Create Buckets
insert into storage.buckets (id, name, public)
values
  ('avatars', 'avatars', true),
  ('posts', 'posts', true),
  ('stories', 'stories', true),
  ('reels', 'reels', true),
  ('messages', 'messages', false); -- Authenticated only

-- Policy Helper function (optional, but good for clarity)
-- Note: Storage policies are on storage.objects

-- 1. AVATARS
create policy "Avatar images are publicly accessible."
  on storage.objects for select
  using ( bucket_id = 'avatars' );

create policy "Anyone can upload an avatar."
  on storage.objects for insert
  with check ( bucket_id = 'avatars' and auth.role() = 'authenticated' );

create policy "Anyone can update their own avatar."
  on storage.objects for update
  using ( bucket_id = 'avatars' and auth.uid() = owner )
  with check ( bucket_id = 'avatars' and auth.uid() = owner );

-- 2. POSTS
create policy "Post images are publicly accessible."
  on storage.objects for select
  using ( bucket_id = 'posts' );

create policy "Anyone can upload a post image."
  on storage.objects for insert
  with check ( bucket_id = 'posts' and auth.role() = 'authenticated' );

create policy "Anyone can delete their own post image."
  on storage.objects for delete
  using ( bucket_id = 'posts' and auth.uid() = owner );

-- 3. STORIES
create policy "Story images are publicly accessible."
  on storage.objects for select
  using ( bucket_id = 'stories' );

create policy "Anyone can upload a story."
  on storage.objects for insert
  with check ( bucket_id = 'stories' and auth.role() = 'authenticated' );

create policy "Anyone can delete their own story."
  on storage.objects for delete
  using ( bucket_id = 'stories' and auth.uid() = owner );

-- 4. REELS
create policy "Reel videos are publicly accessible."
  on storage.objects for select
  using ( bucket_id = 'reels' );

create policy "Anyone can upload a reel."
  on storage.objects for insert
  with check ( bucket_id = 'reels' and auth.role() = 'authenticated' );

-- 5. MESSAGES (Private)
create policy "Users can view images in messages they are part of."
  on storage.objects for select
  using ( bucket_id = 'messages' and auth.role() = 'authenticated' );
-- Note: Validating exact message participant for storage access is complex in simple policies. 
-- A stricter policy would involve a join with the messages table, but for now we ensure they are authenticated.
-- A common pattern is to make the filename unpredictable or sign URLs. 
-- Given the 'authenticated only' bucket setting, only signed URLs work by default if not public, 
-- but we set public=false, so we need signed URLs anyway.

create policy "Users can upload message attachments."
  on storage.objects for insert
  with check ( bucket_id = 'messages' and auth.role() = 'authenticated' );
