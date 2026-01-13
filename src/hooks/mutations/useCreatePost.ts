import { useMutation, useQueryClient } from "@tanstack/react-query";
import dayjs from "dayjs";
import { supabase } from "../../lib/supabaseClient";
import { FEED_QUERY_KEY } from "../queries/useGetFeed";
import { PROFILE_QUERY_KEY } from "../queries/useGetProfile";

interface CreatePostVariables {
  file: File;
  caption: string;
  location: string;
  userId: string;
  username: string;
}

export const useCreatePost = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({
      file,
      caption,
      location,
      userId,
    }: CreatePostVariables) => {
      const fileExt = file.name.split(".").pop();
      const fileName = `${userId}/${dayjs().valueOf()}.${fileExt}`;
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

      // 2. Insert

      const { data, error: insertError } = await (supabase.from("posts") as any) // eslint-disable-line @typescript-eslint/no-explicit-any
        .insert({
          user_id: userId,
          caption,
          image_url: publicUrl,
          location,
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
