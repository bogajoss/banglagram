-- Migration: Add presence tracking columns (last_seen and is_online) to profiles table
-- Created: 2026-01-14
-- Description: Adds support for tracking user's last activity and online status

-- ============================================================
-- STEP 1: Add presence tracking columns to profiles
-- ============================================================

-- Add last_seen column if it doesn't exist
ALTER TABLE public.profiles 
ADD COLUMN IF NOT EXISTS last_seen timestamp with time zone;

-- Add is_online column if it doesn't exist
ALTER TABLE public.profiles 
ADD COLUMN IF NOT EXISTS is_online boolean DEFAULT false;

-- Create index on is_online for faster queries
CREATE INDEX IF NOT EXISTS idx_profiles_is_online ON public.profiles(is_online);

-- Create index on last_seen for sorting/filtering
CREATE INDEX IF NOT EXISTS idx_profiles_last_seen ON public.profiles(last_seen DESC);

-- Update existing records to have current timestamp as last_seen
UPDATE public.profiles 
SET last_seen = now() 
WHERE last_seen IS NULL;

-- ============================================================
-- STEP 2: Ensure messages table has RLS enabled
-- ============================================================

ALTER TABLE public.messages ENABLE ROW LEVEL SECURITY;

-- ============================================================
-- STEP 3: Add RLS policies for messages table (Realtime support)
-- ============================================================

-- Drop existing policies if they exist
DROP POLICY IF EXISTS "Users can view their own messages" ON public.messages;
DROP POLICY IF EXISTS "Users can insert their own messages" ON public.messages;
DROP POLICY IF EXISTS "Users can update their own messages" ON public.messages;
DROP POLICY IF EXISTS "Users can delete their own messages" ON public.messages;

-- Create new policies
CREATE POLICY "Users can view their own messages" ON public.messages 
FOR SELECT USING (
  auth.uid() = sender_id OR auth.uid() = receiver_id
);

CREATE POLICY "Users can insert their own messages" ON public.messages 
FOR INSERT WITH CHECK (auth.uid() = sender_id);

CREATE POLICY "Users can update their own messages" ON public.messages 
FOR UPDATE USING (auth.uid() = sender_id);

CREATE POLICY "Users can delete their own messages" ON public.messages 
FOR DELETE USING (auth.uid() = sender_id);

-- ============================================================
-- STEP 4: Verification queries
-- ============================================================

-- Check profiles columns
SELECT 
  column_name, 
  data_type, 
  is_nullable 
FROM information_schema.columns 
WHERE table_name = 'profiles' 
  AND column_name IN ('last_seen', 'is_online')
ORDER BY ordinal_position;

-- Check messages RLS policies
SELECT 
  policyname,
  tablename,
  permissive,
  roles,
  qual
FROM pg_policies 
WHERE tablename = 'messages'
ORDER BY policyname;

-- Check if RLS is enabled on messages
SELECT 
  schemaname,
  tablename,
  rowsecurity
FROM pg_tables 
WHERE tablename = 'messages';
