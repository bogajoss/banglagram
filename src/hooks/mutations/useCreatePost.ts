import { useMutation, useQueryClient } from "@tanstack/react-query";
import dayjs from "dayjs";
import { supabase } from "../../lib/supabaseClient";
import { FEED_QUERY_KEY } from "../queries/useGetFeed";
import { PROFILE_QUERY_KEY } from "../queries/useGetProfile";

interface CreatePostVariables {
  files: File[];
  caption: string;
  userId: string;
  username: string;
}

export const useCreatePost = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ files, caption, userId }: CreatePostVariables) => {
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
      
      // Store as JSON string if multiple, or single string if one? 
      // For consistency with "legacy", if 1 file, maybe just store string?
      // But to be "future proof" for carousel, JSON array string is better.
      // However, current PostItem expects simple string. I'll stick to JSON array string
      // and update PostItem to parse it. 
      // Wait, if I change it to JSON string, existing "simple string" readers might break 
      // if they don't expect it.
      // I will handle parsing in PostItem.
      
      const imageUrl = JSON.stringify(publicUrls);

      const { data, error: insertError } = await (supabase.from("posts") as any) // eslint-disable-line @typescript-eslint/no-explicit-any
        .insert({
          user_id: userId,
          caption,
          image_url: imageUrl,
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
