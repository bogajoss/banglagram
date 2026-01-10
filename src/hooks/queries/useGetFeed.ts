import { useInfiniteQuery } from "@tanstack/react-query";
import { supabase } from "../../lib/supabaseClient";

export const FEED_QUERY_KEY = ["feed"];

export const useGetFeed = (userId?: string) => {
  return useInfiniteQuery({
    queryKey: FEED_QUERY_KEY,
    queryFn: async ({ pageParam = 0 }) => {
      const from = pageParam * 10;
      const to = from + 9;

      // 1. Fetch Posts
      const { data: postsData, error: postsError } = await supabase
        .from("posts")
        .select(`
          *,
          profiles (username, full_name, avatar_url),
          likes (count),
          comments (count)
        `)
        .order("created_at", { ascending: false })
        .range(from, to);

      if (postsError) throw postsError;
      
      const posts = (postsData || []) as any[];
      const postIds = posts.map(p => p.id as string);
      
      // 2. Fetch User Likes (if logged in)
      const likedPostIds = new Set<string>();
      if (userId && postIds.length > 0) {
        const { data: likesData } = await supabase
          .from("likes")
          .select("post_id")
          .eq("user_id", userId)
          .in("post_id", postIds);
        
        if (likesData) {
          (likesData as { post_id: string }[]).forEach(l => likedPostIds.add(l.post_id));
        }
      }

      // 3. Merge
      return posts.map((post) => {
        const profile = post.profiles as { username: string; full_name: string | null; avatar_url: string | null } | null;
        const likes = post.likes as { count: number }[];
        const comments = post.comments as { count: number }[];

        return {
          id: post.id,
          user: {
            username: profile?.username || "Unknown",
            name: profile?.full_name || "Unknown",
            avatar: profile?.avatar_url || "",
          },
          content: {
            type: "image" as const,
            src: post.image_url as string,
          },
          likes: likes[0]?.count || 0,
          caption: (post.caption as string) || "",
          comments: comments[0]?.count || 0,
          time: new Date(post.created_at as string).toLocaleDateString(),
          isVerified: false,
          hasLiked: likedPostIds.has(post.id),
        };
      });
    },
    initialPageParam: 0,
    getNextPageParam: (lastPage, allPages) => {
      return lastPage.length === 10 ? allPages.length : undefined;
    },
  });
};