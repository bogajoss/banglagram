-- Create saves table for persistent saved posts
CREATE TABLE IF NOT EXISTS public.saves (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    user_id UUID REFERENCES public.profiles(id) NOT NULL,
    post_id UUID REFERENCES public.posts(id) NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
    UNIQUE(user_id, post_id)
);

-- Enable RLS
ALTER TABLE public.saves ENABLE ROW LEVEL SECURITY;

-- Policies
CREATE POLICY "Users can view their own saves" 
ON public.saves FOR SELECT 
USING (auth.uid() = user_id);

CREATE POLICY "Users can save posts" 
ON public.saves FOR INSERT 
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can unsave posts" 
ON public.saves FOR DELETE 
USING (auth.uid() = user_id);

-- Create post_tags table for tagged posts
CREATE TABLE IF NOT EXISTS public.post_tags (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    post_id UUID REFERENCES public.posts(id) NOT NULL,
    user_id UUID REFERENCES public.profiles(id) NOT NULL, -- The user TAGGED in the post
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
    UNIQUE(post_id, user_id)
);

-- Enable RLS
ALTER TABLE public.post_tags ENABLE ROW LEVEL SECURITY;

-- Policies
CREATE POLICY "Tags are viewable by everyone" 
ON public.post_tags FOR SELECT 
USING (true);

CREATE POLICY "Post owners can tag users" 
ON public.post_tags FOR INSERT 
WITH CHECK (
    auth.uid() IN (SELECT user_id FROM public.posts WHERE id = post_id)
);

CREATE POLICY "Post owners or tagged users can remove tags" 
ON public.post_tags FOR DELETE 
USING (
    auth.uid() IN (SELECT user_id FROM public.posts WHERE id = post_id) OR
    auth.uid() = user_id
);
