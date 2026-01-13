import { useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "../../lib/supabaseClient";


export const useAdminActions = () => {
    const queryClient = useQueryClient();

    const { mutate: verifyUser, isPending: isVerifying } = useMutation({
        mutationFn: async ({ userId, status }: { userId: string; status: boolean }) => {
            const { error } = await supabase
                .from("profiles")
                .update({ is_verified: status })

                .eq("id", userId);


            if (error) throw error;
        },
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ["admin", "users"] });
            queryClient.invalidateQueries({ queryKey: ["profile"] });
        },
    });

    const { mutate: restrictUser, isPending: isRestricting } = useMutation({
        mutationFn: async ({ userId, role }: { userId: string; role: string }) => {
            const { error } = await supabase
                .from("profiles")
                // @ts-expect-error Supabase update type inference failing
                .update({ role: role })

                .eq("id", userId);


            if (error) throw error;
        },
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ["admin", "users"] });
        },
    });

    const { mutate: deleteUser, isPending: isDeletingUser } = useMutation({
        mutationFn: async (userId: string) => {
            // Warning: This only deletes from public.profiles if relying on cascade. 
            // Real user deletion requires supabase.auth.admin.deleteUser which is server-side only.
            // For this demo, we'll try to delete from public.profiles (soft detatchment) or assume policies allow.
            const { error } = await supabase
                .from("profiles")
                .delete()
                .eq("id", userId);
            if (error) throw error;
        },
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ["admin", "users"] });
        },
    });


    // --- CONTENT ACTIONS ---

    const { mutate: deletePost, isPending: isDeletingPost } = useMutation({
        mutationFn: async (postId: string) => {
            const { error } = await supabase.from("posts").delete().eq("id", postId);
            if (error) throw error;
        },
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ["admin", "posts"] });
            queryClient.invalidateQueries({ queryKey: ["feed"] });
        },
    });

    return {
        verifyUser,
        isVerifying,
        restrictUser,
        isRestricting,
        deleteUser,
        isDeletingUser,
        deletePost,
        isDeletingPost,
    };
};
