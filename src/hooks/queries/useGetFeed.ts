import { useInfiniteQuery } from "@tanstack/react-query";
import dayjs from "dayjs";
import { supabase } from "../../lib/supabaseClient";

export const FEED_QUERY_KEY = ["feed"];

export const useGetFeed = (userId?: string) => {
  return useInfiniteQuery({
    queryKey: FEED_QUERY_KEY,
    queryFn: async ({ pageParam = 0 }) => {
      
      const { data, error } = await supabase.rpc("get_feed", {
        current_user_id: userId,
        limit_count: 10,
        offset_count: pageParam * 10
      } as any);

      if (error) throw error;

      const posts = (data as any[]) || [];

      return posts.map((post: any) => ({
        id: post.id,
        user: {
          id: post.user_id,
          username: post.username,
          name: post.full_name || post.username,
          avatar: post.avatar_url || "",
          isVerified: post.is_verified || false,
        },
        content: {
          type: "image" as const,
          src: post.image_url,
        },
        likes: post.likes_count || 0,
        caption: post.caption || "",
        comments: post.comments_count || 0,
        time: dayjs(post.created_at).fromNow(),
        createdAt: post.created_at,
        isVerified: post.is_verified || false,
        hasLiked: post.has_liked,
        hasSaved: post.has_saved,
      }));
    },
    initialPageParam: 0,
    getNextPageParam: (lastPage, allPages) => {
      return lastPage.length === 10 ? allPages.length : undefined;
    },
  });
};