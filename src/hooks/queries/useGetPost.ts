import { useQuery } from "@tanstack/react-query";
import dayjs from "dayjs";
import { supabase } from "../../lib/supabaseClient";
import type { Post } from "../../types";
import type { Database } from "../../database.types";

export const POST_QUERY_KEY = (id: string) => ["post", id];

export const useGetPost = (
  postId: string | undefined,
  currentUserId?: string,
) => {
  return useQuery({
    queryKey: POST_QUERY_KEY(postId || ""),
    enabled: !!postId,
    queryFn: async () => {
      if (!postId) throw new Error("Post ID required");

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
        .eq("id", postId)
        .single();

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

      const postData = data as unknown as PostWithProfile;

      // Check if current user liked/saved this post
      let hasLiked = false;
      let hasSaved = false;

      if (currentUserId) {
        const { count: likeCount } = await supabase
          .from("likes")
          .select("*", { count: "exact", head: true })
          .eq("post_id", postId)
          .eq("user_id", currentUserId);

        hasLiked = !!likeCount && likeCount > 0;

        const { count: saveCount } = await supabase
          .from("saves")
          .select("*", { count: "exact", head: true })
          .eq("post_id", postId)
          .eq("user_id", currentUserId);

        hasSaved = !!saveCount && saveCount > 0;
      }

      return {
        id: postData.id,
        user: {
          id: postData.user_id,
          username: postData.profiles?.username || "Unknown",
          name: postData.profiles?.full_name || "Unknown",
          avatar: postData.profiles?.avatar_url || "",
          isVerified: postData.profiles?.is_verified || false,
        },
        content: {
          type: "image" as const,
          src: postData.image_url,
        },
        likes: postData.likes[0]?.count || 0,
        caption: postData.caption || "",
        comments: postData.comments[0]?.count || 0,
        time: dayjs(postData.created_at).fromNow(),
        hasLiked,
        hasSaved,
      } as Post;
    },
  });
};
