import { useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "../../lib/supabaseClient";
import { useAuth } from "../useAuth";

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
    mutationFn: async ({
      commentId,
      hasLiked,
    }: ToggleCommentLikeVariables) => {
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
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        const { error } = await (supabase
          .from("comment_likes") as any)
          .insert({ user_id: user.id, comment_id: commentId });
        if (error) throw error;
      }
    },
    onMutate: async ({ commentId, hasLiked, targetId, type }) => {
      await queryClient.cancelQueries({
        queryKey: ["comments", type, targetId, user?.id],
      });

      const previousComments = queryClient.getQueryData([
        "comments",
        type,
        targetId,
        user?.id,
      ]);

      // Optimistically update
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      queryClient.setQueryData(
        ["comments", type, targetId, user?.id],
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        (old: any) => {
          if (!old) return old;
          // eslint-disable-next-line @typescript-eslint/no-explicit-any
          return old.map((comment: any) => {
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
