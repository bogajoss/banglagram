import { useInfiniteQuery } from "@tanstack/react-query";
import { supabase } from "../../lib/supabaseClient";
import type { Database } from "../../database.types";

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

      type PostWithProfile = Database["public"]["Tables"]["posts"]["Row"] & {
        profiles: { username: string; full_name: string | null; avatar_url: string | null } | null;
        likes: { count: number }[];
        comments: { count: number }[];
      };

      const posts = (postsData || []) as unknown as PostWithProfile[];
      const postIds = posts.map(p => p.id);

      // 2. Fetch User Likes and Saves (if logged in)
      const likedPostIds = new Set<string>();
      const savedPostIds = new Set<string>();

      if (userId && postIds.length > 0) {
        const { data: likesData } = await supabase
          .from("likes")
          .select("post_id")
          .eq("user_id", userId)
          .in("post_id", postIds);

        if (likesData) {
          (likesData as { post_id: string | null }[]).forEach((l) => {
            if (l.post_id) likedPostIds.add(l.post_id);
          });
        }

        const { data: savesData } = await supabase
          .from("saves")
          .select("post_id")
          .eq("user_id", userId)
          .in("post_id", postIds);

        if (savesData) {
          (savesData as { post_id: string | null }[]).forEach((s) => {
            if (s.post_id) savedPostIds.add(s.post_id);
          });
        }
      }

      // 3. Merge
      return posts.map((post) => {
        const profile = post.profiles;
        const likes = post.likes;
        const comments = post.comments;

        return {
          id: post.id,
          user: {
            username: profile?.username || "Unknown",
            name: profile?.full_name || "Unknown",
            avatar: profile?.avatar_url || "",
          },
          content: {
            type: "image" as const,
            src: post.image_url,
          },
          likes: likes[0]?.count || 0,
          caption: post.caption || "",
          comments: comments[0]?.count || 0,
          time: new Date(post.created_at).toLocaleDateString(),
          isVerified: false,
          hasLiked: likedPostIds.has(post.id),
          hasSaved: savedPostIds.has(post.id),
        };
      });
    },
    initialPageParam: 0,
    getNextPageParam: (lastPage, allPages) => {
      return lastPage.length === 10 ? allPages.length : undefined;
    },
  });
};