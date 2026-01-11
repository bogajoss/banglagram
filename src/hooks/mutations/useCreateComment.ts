import { useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "../../lib/supabaseClient";
import { FEED_QUERY_KEY } from "../queries/useGetFeed";
import { REELS_QUERY_KEY } from "../queries/useGetReels";

interface CreateCommentVariables {
  targetId: string;
  type: 'post' | 'reel';
  text: string;
  userId: string;
}

export const useCreateComment = () => {
  const queryClient = useQueryClient();

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
    onSuccess: (_, variables) => {
      const queryKey = variables.type === 'post' ? FEED_QUERY_KEY : REELS_QUERY_KEY;
      queryClient.invalidateQueries({ queryKey });
    },
  });
};
