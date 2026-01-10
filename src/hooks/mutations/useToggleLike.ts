import { useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "../../lib/supabaseClient";
import { FEED_QUERY_KEY } from "../queries/useGetFeed";
import type { Post } from "../../types";

interface ToggleLikeVariables {
  postId: string;
  userId: string;
  hasLiked: boolean; // Current state
}

export const useToggleLike = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ postId, userId, hasLiked }: ToggleLikeVariables) => {
      if (hasLiked) {
        // Unlike
        const { error } = await supabase
          .from("likes")
          .delete()
          .match({ user_id: userId, post_id: postId });
        if (error) throw error;
      } else {
        // Like
        const { error } = await (supabase
          .from("likes") as any)
          .insert({ user_id: userId, post_id: postId });
        if (error) throw error;
      }
    },
    onMutate: async ({ postId, hasLiked }) => {
      // Cancel refetches
      await queryClient.cancelQueries({ queryKey: FEED_QUERY_KEY });

      // Snapshot previous value
      const previousFeed = queryClient.getQueryData(FEED_QUERY_KEY);

      // Optimistic update
      queryClient.setQueryData(FEED_QUERY_KEY, (old: { pages: Post[][] } | undefined) => {
        if (!old) return old;
        return {
          ...old,
          pages: old.pages.map((page) =>
             page.map((post) => {
                if (post.id === postId) {
                    const currentLikes = typeof post.likes === 'string' ? parseInt(post.likes) : post.likes;
                    return {
                        ...post,
                        hasLiked: !hasLiked,
                        likes: hasLiked ? Math.max(0, currentLikes - 1) : currentLikes + 1
                    }
                }
                return post;
             })
          )
        };
      });

      return { previousFeed };
    },
    onError: (err, _variables, context: { previousFeed?: unknown } | undefined) => {
        if (context?.previousFeed) {
            queryClient.setQueryData(FEED_QUERY_KEY, context.previousFeed);
        }
        console.error(err);
    },
    onSettled: () => {
        queryClient.invalidateQueries({ queryKey: FEED_QUERY_KEY });
    }
  });
};
