import { useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "../../lib/supabaseClient";
import { useAuth } from "../useAuth";
import type { Comment } from "../queries/useGetComments";

interface ToggleCommentLikeVariables {
  commentId: string;
  hasLiked: boolean;
  targetId: string; // post/reel id to invalidate queries
  type: "post" | "reel";
}

export const useToggleCommentLike = () => {
  const queryClient = useQueryClient();
  const { user } = useAuth();

  return useMutation({
    mutationFn: async ({ commentId, hasLiked }: ToggleCommentLikeVariables) => {
      if (!user) throw new Error("Not authenticated");

      if (hasLiked) {
        // Unlike
        const { error } = await supabase
          .from("comment_likes")
          .delete()
          .match({ user_id: user.id, comment_id: commentId });
        if (error) throw error;
      } else {
        // Like
        const { error } = await (
          supabase.from("comment_likes") as unknown as {
            insert: (data: {
              user_id: string;
              comment_id: string;
            }) => Promise<{ error: Error | null }>;
          }
        ).insert({ user_id: user.id, comment_id: commentId });
        if (error) throw error;
      }
    },
    onMutate: async ({ commentId, hasLiked, targetId, type }) => {
      await queryClient.cancelQueries({
        queryKey: ["comments", type, targetId, user?.id],
      });

      const previousComments = queryClient.getQueryData<Comment[]>([
        "comments",
        type,
        targetId,
        user?.id,
      ]);

      // Optimistically update
      queryClient.setQueryData<Comment[]>(
        ["comments", type, targetId, user?.id],
        (old) => {
          if (!old) return old;
          return old.map((comment) => {
            if (comment.id === commentId) {
              return {
                ...comment,
                hasLiked: !hasLiked,
                likes_count: hasLiked
                  ? comment.likes_count - 1
                  : comment.likes_count + 1,
              };
            }
            return comment;
          });
        },
      );

      return { previousComments };
    },
    onError: (_err, variables, context) => {
      // Rollback
      if (context?.previousComments) {
        queryClient.setQueryData(
          ["comments", variables.type, variables.targetId, user?.id],
          context.previousComments,
        );
      }
    },
    onSettled: (_data, _error, variables) => {
      queryClient.invalidateQueries({
        queryKey: ["comments", variables.type, variables.targetId, user?.id],
      });
    },
  });
};
