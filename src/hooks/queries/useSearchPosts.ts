import { useQuery } from "@tanstack/react-query";
import { supabase } from "../../lib/supabaseClient";
import type { Post } from "../../types";
import type { Database } from "../../database.types";
import dayjs from "dayjs";

export const SEARCH_POSTS_QUERY_KEY = (query: string) => ["searchPosts", query];

export const useSearchPosts = (searchQuery: string) => {
  return useQuery({
    queryKey: SEARCH_POSTS_QUERY_KEY(searchQuery),
    enabled: !!searchQuery && searchQuery.length > 0,
    queryFn: async () => {
      const { data, error } = await supabase
        .from("posts")
        .select(
          `
          id,
          created_at,
          caption,
          image_url,
          user_id,
          profiles (username, full_name, avatar_url, is_verified),
          likes (count),
          comments (count)
        `,
        )
        .ilike("caption", `%${searchQuery}%`)
        .order("created_at", { ascending: false })
        .limit(20);

      if (error) throw error;

      type PostWithProfile = Database["public"]["Tables"]["posts"]["Row"] & {
        profiles: {
          username: string;
          full_name: string | null;
          avatar_url: string | null;
          is_verified: boolean | null;
        } | null;
        likes: { count: number }[];
        comments: { count: number }[];
      };

      const posts = (data || []) as unknown as PostWithProfile[];

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
            type: "image" as const,
            src: post.image_url,
          },
          likes: post.likes[0]?.count || 0,
          caption: post.caption || "",
          comments: post.comments[0]?.count || 0,
          time: dayjs(post.created_at).fromNow(),
          createdAt: post.created_at,
          isVerified: profile?.is_verified || false,
        };
      }) as Post[];
    },
  });
};
