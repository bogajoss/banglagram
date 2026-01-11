
import { useQuery } from "@tanstack/react-query";
import { supabase } from "../../lib/supabaseClient";

export interface Comment {
    id: string;
    created_at: string;
    text: string;
    user_id: string;
    post_id?: string;
    reel_id?: string;
    user: {
        username: string;
        avatar_url: string;
    };
}

export const useGetComments = (targetId: string, type: 'post' | 'reel') => {
    return useQuery({
        queryKey: ["comments", type, targetId],
        queryFn: async () => {
            // Determine the column to filter by based on type
            const column = type === 'post' ? 'post_id' : 'reel_id';

            const { data, error } = await supabase
                .from("comments")
                .select(`
          id,
          created_at,
          text,
          user_id,
          post_id,
          reel_id,
          profiles:user_id (
            username,
            avatar_url
          )
        `)
                .eq(column, targetId)
                .order("created_at", { ascending: false });

            if (error) {
                throw error;
            }

            return data?.map((comment: any) => ({
                id: comment.id,
                created_at: comment.created_at,
                text: comment.text,
                user_id: comment.user_id,
                post_id: comment.post_id,
                reel_id: comment.reel_id,
                user: {
                    username: comment.profiles?.username || "Guest",
                    avatar_url: comment.profiles?.avatar_url || "https://api.dicebear.com/9.x/avataaars/svg?seed=guest"
                }
            })) as Comment[];
        },
        enabled: !!targetId, // Only fetch if we have a target ID
    });
};
