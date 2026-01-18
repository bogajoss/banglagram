import { useMutation, useQueryClient } from "@tanstack/react-query";
import dayjs from "dayjs";
import { supabase } from "../../lib/supabaseClient";
import { REELS_QUERY_KEY } from "../queries/useGetReels";

interface CreateReelVariables {
  file: File;
  thumbnail?: File | null;
  caption: string;
  userId: string;
  username: string;
}

export const useCreateReel = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ file, thumbnail, caption, userId }: CreateReelVariables) => {
      const fileExt = file.name.split(".").pop();
      const fileName = `${userId}/${dayjs().valueOf()}.${fileExt}`;
      const { error: uploadError } = await supabase.storage
        .from("reels")
        .upload(fileName, file, {
          cacheControl: "3600",
          upsert: false,
          contentType: file.type,
        });

      if (uploadError) throw uploadError;

      const {
        data: { publicUrl: videoUrl },
      } = supabase.storage.from("reels").getPublicUrl(fileName);

      let thumbnailUrl = null;
      if (thumbnail) {
        const thumbName = `${userId}/${dayjs().valueOf()}_thumb.jpg`;
        const { error: thumbError } = await supabase.storage
            .from("reels")
            .upload(thumbName, thumbnail, {
                cacheControl: "3600",
                upsert: false,
                contentType: "image/jpeg"
            });
        
        if (!thumbError) {
            const { data } = supabase.storage.from("reels").getPublicUrl(thumbName);
            thumbnailUrl = data.publicUrl;
        }
      }

      // 2. Insert

      const { data, error: insertError } = await (supabase.from("reels") as any) // eslint-disable-line @typescript-eslint/no-explicit-any
        .insert({
          user_id: userId,
          caption,
          video_url: videoUrl,
          thumbnail_url: thumbnailUrl
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
