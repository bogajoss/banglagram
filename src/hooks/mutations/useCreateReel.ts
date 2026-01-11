import { useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "../../lib/supabaseClient";
import { REELS_QUERY_KEY } from "../queries/useGetReels";

interface CreateReelVariables {
  file: File;
  caption: string;
  userId: string;
  username: string;
}

export const useCreateReel = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ file, caption, userId }: CreateReelVariables) => {
      // 1. Upload
      const fileExt = file.name.split(".").pop();
      const fileName = `${userId}/${Date.now()}.${fileExt}`;
      const { error: uploadError } = await supabase.storage
        .from("reels")
        .upload(fileName, file, {
          cacheControl: "3600",
          upsert: false,
          contentType: file.type,
        });

      if (uploadError) throw uploadError;

      const {
        data: { publicUrl },
      } = supabase.storage.from("reels").getPublicUrl(fileName);

      // 2. Insert

      const { data, error: insertError } = await (supabase.from("reels") as any) // eslint-disable-line @typescript-eslint/no-explicit-any
        .insert({
          user_id: userId,
          caption,
          video_url: publicUrl,
        })
        .select()
        .single();

      if (insertError) throw insertError;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: REELS_QUERY_KEY });
    },
  });
};
