-- Add audio_url column to comments table
ALTER TABLE public.comments
ADD COLUMN audio_url text;

-- Create storage bucket for audio messages if it doesn't exist
INSERT INTO storage.buckets (id, name, public)
VALUES ('audio-messages', 'audio-messages', true)
ON CONFLICT (id) DO NOTHING;

-- Policy to allow authenticated users to upload audio
CREATE POLICY "Authenticated users can upload audio"
ON storage.objects FOR INSERT
WITH CHECK (
  bucket_id = 'audio-messages' AND
  auth.role() = 'authenticated'
);

-- Policy to allow everyone to view audio
CREATE POLICY "Everyone can view audio"
ON storage.objects FOR SELECT
USING (bucket_id = 'audio-messages');

-- Policy to allow users to delete their own audio
CREATE POLICY "Users can delete their own audio"
ON storage.objects FOR DELETE
USING (
  bucket_id = 'audio-messages' AND
  auth.uid() = owner
);
