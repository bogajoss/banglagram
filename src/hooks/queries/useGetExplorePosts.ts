import { useQuery } from "@tanstack/react-query";
import { supabase } from "../../lib/supabaseClient";
import type { Post } from "../../types";

export const EXPLORE_POSTS_QUERY_KEY = ["explorePosts"];

export const useGetExplorePosts = () => {
  return useQuery({
    queryKey: EXPLORE_POSTS_QUERY_KEY,
    queryFn: async () => {
      // Fetch random posts or just latest posts
      const { data, error } = await supabase
        .from("posts")
        .select(`
          *,
          likes (count),
          comments (count)
        `)
        .limit(20)
        .order("created_at", { ascending: false });

      if (error) throw error;

      return data.map((post: any) => ({
        id: post.id,
        content: {
          type: "image",
          src: post.image_url,
        },
        likes: post.likes[0]?.count || 0,
        comments: post.comments[0]?.count || 0,
        // Minimal user info needed for explore grid if we don't show avatar
      })) as Post[];
    },
  });
};
