-- Ensure messages bucket is public
UPDATE storage.buckets
SET public = true
WHERE id = 'messages';

-- Add a public access policy for messages bucket
-- This will error if it already exists, but the setup script handles that.
CREATE POLICY "Public Access for Messages" ON storage.objects FOR SELECT USING (bucket_id = 'messages');
