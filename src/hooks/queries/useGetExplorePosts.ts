import { useInfiniteQuery } from "@tanstack/react-query";
import { supabase } from "../../lib/supabaseClient";
import type { Post } from "../../types";
import type { Database } from "../../database.types";

export const EXPLORE_POSTS_QUERY_KEY = ["explorePosts"];

export const useGetExplorePosts = () => {
  return useInfiniteQuery({
    queryKey: EXPLORE_POSTS_QUERY_KEY,
    queryFn: async ({ pageParam = 0 }) => {
      const from = pageParam * 15;
      const to = from + 14;

      const { data, error } = await supabase
        .from("posts")
        .select(
          `
          id,
          image_url,
          user_id,
          profiles (username, full_name, avatar_url, is_verified),
          likes (count),
          comments (count)
        `,
        )
        .order("created_at", { ascending: false })
        .range(from, to);

      if (error) throw error;

      type PostWithStatsAndProfile =
        Database["public"]["Tables"]["posts"]["Row"] & {
          profiles: {
            username: string;
            full_name: string | null;
            avatar_url: string | null;
            is_verified: boolean | null;
          } | null;
          likes: { count: number }[];
          comments: { count: number }[];
        };

      const posts = data as unknown as PostWithStatsAndProfile[];

      return posts.map((post) => {
        const profile = post.profiles;
        return {
          id: post.id,
          user: {
            id: post.user_id,
            username: profile?.username || "Unknown",
            name: profile?.full_name || "Unknown",
            avatar: profile?.avatar_url || "",
            isVerified: profile?.is_verified || false,
          },
          content: {
            type: "image",
            src: post.image_url,
          },
          likes: post.likes[0]?.count || 0,
          comments: post.comments[0]?.count || 0,
          caption: post.caption || "",
          time: "", // Add default
        };
      }) as Post[];
    },
    initialPageParam: 0,
    getNextPageParam: (lastPage, allPages) => {
      return lastPage.length === 15 ? allPages.length : undefined;
    },
  });
};
