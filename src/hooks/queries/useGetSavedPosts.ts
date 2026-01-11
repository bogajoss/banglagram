import { useQuery } from "@tanstack/react-query";
import { supabase } from "../../lib/supabaseClient";
import type { Post } from "../../types";

export const SAVED_POSTS_QUERY_KEY = ["savedPosts"];

export const useGetSavedPosts = (userId: string | undefined) => {
  return useQuery({
    queryKey: [...SAVED_POSTS_QUERY_KEY, userId],
    enabled: !!userId,
    queryFn: async () => {
      if (!userId) return [];

      const { data: deepData, error: deepError } = await supabase
        .from("saves")
        .select(
          `
            created_at,
            post:posts (
                *,
                likes (count),
                comments (count),
                user:profiles (
                    username, full_name, avatar_url, is_verified
                )
            )
        `,
        )
        .eq("user_id", userId)
        .order("created_at", { ascending: false });

      if (deepError) throw deepError;

      // Transform
      const posts: Post[] = deepData
        .map(
          (item: {
            post: {
              id: string;
              image_url: string;
              caption: string | null;
              created_at: string;
              likes: { count: number }[];
              comments: { count: number }[];
              user: {
                username: string;
                full_name: string | null;
                avatar_url: string | null;
                is_verified: boolean | null;
              } | null;
            } | null;
          }) => {
            const p = item.post;
            if (!p) return null; // Should not happen

            return {
              id: p.id,
              user: {
                username: p.user?.username || "Unknown",
                name: p.user?.full_name || "",
                avatar: p.user?.avatar_url || "",
                isVerified: p.user?.is_verified || false,
              },
              content: {
                type: "image",
                src: p.image_url,
              },
              likes: p.likes?.[0]?.count || 0,
              caption: p.caption || "",
              comments: p.comments?.[0]?.count || 0,
              time: new Date(p.created_at).toLocaleDateString(),
              hasLiked: false, // We don't check liked status here for now, can be improved.
              hasSaved: true, // Obviously true
              isVerified: p.user?.is_verified || false,
            };
          },
        )
        .filter(Boolean) as Post[];

      return posts;
    },
  });
};
