import { useMutation, useQueryClient } from "@tanstack/react-query";
import dayjs from "dayjs";
import { supabase } from "../../lib/supabaseClient";
import { MESSAGES_QUERY_KEY } from "../queries/useGetMessages";
import type { Database } from "../../database.types";

type DbMessage = Database["public"]["Tables"]["messages"]["Row"];

interface SendMessageVariables {
  content?: string;
  senderId: string;
  receiverId: string;
  mediaUrl?: string;
}

export const useSendMessage = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({
      content,
      senderId,
      receiverId,
      mediaUrl,
    }: SendMessageVariables) => {
      const { data, error } = await (supabase.from("messages") as any) // eslint-disable-line @typescript-eslint/no-explicit-any
        .insert({
          sender_id: senderId,
          receiver_id: receiverId,
          content: content || null,
          media_url: mediaUrl || null,
        })
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    onMutate: async (newMsg) => {
      const queryKey = MESSAGES_QUERY_KEY(newMsg.receiverId);
      await queryClient.cancelQueries({ queryKey });

      const previousMessages = queryClient.getQueryData<DbMessage[]>(queryKey);

      // Optimistic update
      if (previousMessages) {
        queryClient.setQueryData<DbMessage[]>(queryKey, [
          ...previousMessages,
          {
            id: "optimistic-" + dayjs().valueOf(),
            sender_id: newMsg.senderId,
            receiver_id: newMsg.receiverId,
            content: newMsg.content || null,
            media_url: newMsg.mediaUrl || null,
            is_read: false,
            created_at: dayjs().toISOString(),
          },
        ]);
      }

      return { previousMessages };
    },
    onError: (
      err,
      newMsg,
      context: { previousMessages?: DbMessage[] } | undefined,
    ) => {
      if (context?.previousMessages) {
        queryClient.setQueryData(
          MESSAGES_QUERY_KEY(newMsg.receiverId),
          context.previousMessages,
        );
      }
      console.error(err);
    },
    onSettled: (_, __, variables) => {
      queryClient.invalidateQueries({
        queryKey: MESSAGES_QUERY_KEY(variables.receiverId),
      });
      queryClient.invalidateQueries({ queryKey: ["conversations"] });
    },
  });
};
