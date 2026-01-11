import { useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "../../lib/supabaseClient";
import { STORIES_QUERY_KEY } from "../queries/useGetStories";

interface CreateStoryVariables {
  file: File;
  userId: string;
}

export const useCreateStory = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ file, userId }: CreateStoryVariables) => {
      // 1. Upload Image
      const fileExt = file.name.split(".").pop();
      const fileName = `${userId}-${Date.now()}.${fileExt}`;
      const filePath = `${fileName}`;

      const { error: uploadError } = await supabase.storage
        .from("stories")
        .upload(filePath, file);

      if (uploadError) throw uploadError;

      // 2. Get Public URL
      const {
        data: { publicUrl },
      } = supabase.storage.from("stories").getPublicUrl(filePath);

      // 3. Create Record
      // Expires in 24 hours
      const expiresAt = new Date();
      expiresAt.setDate(expiresAt.getDate() + 1);

      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const { error: dbError } = await (supabase.from("stories") as any).insert(
        {
          user_id: userId,
          media_url: publicUrl,
          expires_at: expiresAt.toISOString(),
        },
      );

      if (dbError) throw dbError;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: STORIES_QUERY_KEY });
    },
  });
};
