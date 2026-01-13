import { useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "../../lib/supabaseClient";
import { FEED_QUERY_KEY } from "../queries/useGetFeed";
import { POST_QUERY_KEY } from "../queries/useGetPost";

interface UpdatePostVariables {
  postId: string;
  caption: string;
  location?: string;
}

export const useUpdatePost = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ postId, caption, location }: UpdatePostVariables) => {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const { data, error } = await (supabase.from("posts") as any)
        .update({ caption, location })
        .eq("id", postId)
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: (_, variables) => {
      // Invalidate feed
      queryClient.invalidateQueries({ queryKey: FEED_QUERY_KEY });
      // Invalidate single post if viewing
      queryClient.invalidateQueries({ queryKey: POST_QUERY_KEY(variables.postId) });
      // Also invalidate profile posts if we could guess the key, but feed is usually enough or specific invalidation
      queryClient.invalidateQueries({ queryKey: ["profile"] });
    },
  });
};
