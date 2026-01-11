import { useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "../../lib/supabaseClient";
import { FEED_QUERY_KEY } from "../queries/useGetFeed";
export const useToggleSave = () => {
    const queryClient = useQueryClient();

    return useMutation({
        mutationFn: async ({ postId, userId, hasSaved }: { postId: string; userId: string; hasSaved: boolean }) => {
            if (hasSaved) {
                const { error } = await supabase
                    .from("saves")
                    .delete()
                    .match({ user_id: userId, post_id: postId });
                if (error) throw error;
            } else {
                const { error } = await (supabase
                    .from("saves") as any)
                    .insert({ user_id: userId, post_id: postId });
                if (error) throw error;
            }
        },
        onSuccess: () => {
            // Invalidate relevant queries
            queryClient.invalidateQueries({ queryKey: FEED_QUERY_KEY });
            queryClient.invalidateQueries({ queryKey: ["savedPosts"] });
            // Also invalidate profile if we show saved count? Not usually shown.
        }
    });
};
