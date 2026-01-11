/* eslint-disable @typescript-eslint/no-explicit-any */
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "../../lib/supabaseClient";
import { useAppStore } from "../../store/useAppStore";

interface UpdateProfileVariables {
  userId: string;
  name: string;
  bio: string;
  avatar: string;
}

export const useUpdateProfile = () => {
  const queryClient = useQueryClient();
  const { showToast, setCurrentUser, currentUser } = useAppStore();

  return useMutation({
    mutationFn: async ({
      userId,
      name,
      bio,
      avatar,
    }: UpdateProfileVariables) => {
      const { data, error } = await (supabase.from("profiles") as any)
        .update({
          full_name: name,
          bio: bio,
          avatar_url: avatar,
        })
        .eq("id", userId)
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: (data: any) => {
      showToast("প্রোফাইল আপডেট করা হয়েছে");

      // Update local store
      setCurrentUser({
        ...currentUser,
        name: data?.full_name || "",
        bio: data?.bio || "",
        avatar: data?.avatar_url || "",
      });

      // Invalidate profile query to refetch fresh data
      queryClient.invalidateQueries({ queryKey: ["profile"] });
      if (data?.username) {
        queryClient.invalidateQueries({ queryKey: ["profile", data.username] });
      }
    },
    onError: (error) => {
      console.error("Update profile error:", error);
      showToast("প্রোফাইল আপডেট করতে সমস্যা হয়েছে");
    },
  });
};
