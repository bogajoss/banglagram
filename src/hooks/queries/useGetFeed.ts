import { useInfiniteQuery } from "@tanstack/react-query";
import dayjs from "dayjs";
import { supabase } from "../../lib/supabaseClient";

export const FEED_QUERY_KEY = ["feed"];

export const useGetFeed = (userId?: string) => {
  return useInfiniteQuery({
    queryKey: FEED_QUERY_KEY,
    queryFn: async ({ pageParam = 0 }) => {
      const { data, error } = await supabase.rpc("get_ranked_feed_v2", {
        current_user_id: userId,
        limit_count: 10,
        offset_count: pageParam * 10,
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
      } as any);

      if (error) throw error;

      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const posts = (data as any[]) || [];

      // Debug logging to verify incoming data structure
      if (posts.length > 0) {
        console.log("FIRST POST RAW DATA V2:", posts[0]);
        console.log("VIEW COUNT VALUE:", posts[0].view_count);
      }

      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      return posts.map((item: any) => ({
        id: item.id,
        user: {
          id: item.user_id,
          username: item.username,
          name: item.full_name || item.username,
          avatar: item.avatar_url || "",
          isVerified: item.is_verified || false,
        },
        content: {
          type: (item.type === "reel" ? "video" : "image") as "image" | "video",
          src: item.type === "reel" ? item.video_url : item.image_url,
        },
        likes: item.likes_count || 0,
        caption: item.caption || "",
        comments: item.comments_count || 0,
        views: Number(item.view_count || 0),
        time: dayjs(item.created_at).fromNow(),
        createdAt: item.created_at,
        isVerified: item.is_verified || false,
        hasLiked: item.has_liked,
        hasSaved: item.has_saved,
      }));
    },
    initialPageParam: 0,
    getNextPageParam: (lastPage, allPages) => {
      return lastPage.length === 10 ? allPages.length : undefined;
    },
  });
};
