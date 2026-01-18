import { useMutation, useQueryClient } from "@tanstack/react-query";
import dayjs from "dayjs";
import { supabase } from "../../lib/supabaseClient";
import { FEED_QUERY_KEY } from "../queries/useGetFeed";
import { PROFILE_QUERY_KEY } from "../queries/useGetProfile";

interface CreatePostVariables {
  files: File[];
  thumbnail?: File | null;
  caption: string;
  userId: string;
  username: string;
}

export const useCreatePost = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ files, thumbnail, caption, userId }: CreatePostVariables) => {
      const uploadPromises = files.map(async (file) => {
        const fileExt = file.name.split(".").pop();
        const fileName = `${userId}/${dayjs().valueOf()}_${Math.random().toString(36).substr(2, 9)}.${fileExt}`;
        const { error: uploadError } = await supabase.storage
          .from("posts")
          .upload(fileName, file, {
            cacheControl: "3600",
            upsert: false,
            contentType: file.type,
          });

        if (uploadError) throw uploadError;

        const {
          data: { publicUrl },
        } = supabase.storage.from("posts").getPublicUrl(fileName);
        
        return publicUrl;
      });

      const publicUrls = await Promise.all(uploadPromises);
      
      const imageUrl = JSON.stringify(publicUrls);

      let thumbnailUrl = null;
      if (thumbnail) {
        const thumbName = `${userId}/${dayjs().valueOf()}_thumb.jpg`;
        const { error: thumbError } = await supabase.storage
            .from("posts")
            .upload(thumbName, thumbnail, {
                cacheControl: "3600",
                upsert: false,
                contentType: "image/jpeg"
            });
        
        if (!thumbError) {
            const { data } = supabase.storage.from("posts").getPublicUrl(thumbName);
            thumbnailUrl = data.publicUrl;
        }
      }

      const { data, error: insertError } = await (supabase.from("posts") as any) // eslint-disable-line @typescript-eslint/no-explicit-any
        .insert({
          user_id: userId,
          caption,
          image_url: imageUrl,
          thumbnail_url: thumbnailUrl
        })
        .select()
        .single();

      if (insertError) throw insertError;
      return data;
    },
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: FEED_QUERY_KEY });
      queryClient.invalidateQueries({
        queryKey: PROFILE_QUERY_KEY(variables.username),
      });
    },
  });
};
