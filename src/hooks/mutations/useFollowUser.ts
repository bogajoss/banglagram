import { useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "../../lib/supabaseClient";
import { PROFILE_QUERY_KEY } from "../queries/useGetProfile";

interface FollowUserVariables {
    targetUserId: string;
    currentUserId: string;
    isFollowing: boolean;
    targetUsername: string; // for invalidation
}

export const useFollowUser = () => {
    const queryClient = useQueryClient();

    return useMutation({
        mutationFn: async ({ targetUserId, currentUserId, isFollowing }: FollowUserVariables) => {
            if (isFollowing) {
                const { error } = await supabase
                    .from("follows")
                    .delete()
                    .match({ follower_id: currentUserId, following_id: targetUserId });
                if (error) throw error;
            } else {

                const { error } = await (supabase
                    .from("follows") as any) // eslint-disable-line @typescript-eslint/no-explicit-any
                    .insert({ follower_id: currentUserId, following_id: targetUserId });
                if (error) throw error;
            }
        },
        onSuccess: (_, variables) => {
            queryClient.invalidateQueries({ queryKey: PROFILE_QUERY_KEY(variables.targetUsername) });
            // Also invalidate current user's profile to update "following" count
            // We can't easily guess current user username here unless passed, 
            // but usually we care more about the profile we are looking at.
        }
    });
};
