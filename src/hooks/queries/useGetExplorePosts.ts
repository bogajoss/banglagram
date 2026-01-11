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

      // Fetch posts with pagination
      const { data, error } = await supabase
        .from("posts")
        .select(
          `
          id,
          image_url,
          likes (count),
          comments (count)
        `,
        )
        .order("created_at", { ascending: false })
        .range(from, to);

      if (error) throw error;

      type PostWithStats = Database["public"]["Tables"]["posts"]["Row"] & {
        likes: { count: number }[];
        comments: { count: number }[];
      };

      const posts = data as unknown as PostWithStats[];

      return posts.map((post) => ({
        id: post.id,
        content: {
          type: "image",
          src: post.image_url,
        },
        likes: post.likes[0]?.count || 0,
        comments: post.comments[0]?.count || 0,
      })) as Post[];
    },
    initialPageParam: 0,
    getNextPageParam: (lastPage, allPages) => {
      return lastPage.length === 15 ? allPages.length : undefined;
    },
  });
};
