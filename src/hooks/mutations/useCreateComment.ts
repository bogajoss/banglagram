import { useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "../../lib/supabaseClient";
import { FEED_QUERY_KEY } from "../queries/useGetFeed";
import { REELS_QUERY_KEY } from "../queries/useGetReels";
import { useAuth } from "../../hooks/useAuth";
import type { Comment } from "../queries/useGetComments";

interface CreateCommentVariables {
  targetId: string;
  type: 'post' | 'reel';
  text: string;
  userId: string;
}

export const useCreateComment = () => {
  const queryClient = useQueryClient();
  const { profile } = useAuth();

  return useMutation({
    mutationFn: async ({ targetId, type, text, userId }: CreateCommentVariables) => {
      const payload = type === 'post'
        ? { user_id: userId, post_id: targetId, text }
        : { user_id: userId, reel_id: targetId, text };


      const { data, error } = await (supabase
        .from("comments") as any) // eslint-disable-line @typescript-eslint/no-explicit-any
        .insert(payload)
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    onMutate: async ({ targetId, type, text, userId }) => {
      const commentsKey = ["comments", type, targetId];
      await queryClient.cancelQueries({ queryKey: commentsKey });

      const previousComments = queryClient.getQueryData(commentsKey);

      const optimisticComment: Comment = {
        id: `temp-${Date.now()}`,
        created_at: new Date().toISOString(),
        text,
        user_id: userId,
        post_id: type === 'post' ? targetId : undefined,
        reel_id: type === 'reel' ? targetId : undefined,
        user: {
          username: profile?.username || "You",
          avatar_url: profile?.avatar_url || ""
        }
      };

      queryClient.setQueryData(commentsKey, (old: Comment[] = []) => {
        return [optimisticComment, ...old];
      });

      return { previousComments, commentsKey };
    },
    onError: (err, _variables, context) => {
      if (context?.previousComments) {
        queryClient.setQueryData(context.commentsKey, context.previousComments);
      }
    },
    onSuccess: (_, variables) => {
      const feedKey = variables.type === 'post' ? FEED_QUERY_KEY : REELS_QUERY_KEY;
      queryClient.invalidateQueries({ queryKey: feedKey });
      // Also invalidate comments to get real ID
      queryClient.invalidateQueries({ queryKey: ["comments", variables.type, variables.targetId] });
    },
  });
};
