import { useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "../../lib/supabaseClient";
import { MESSAGES_QUERY_KEY } from "../queries/useGetMessages";
import type { Database } from "../../database.types";

type DbMessage = Database["public"]["Tables"]["messages"]["Row"];

interface SendMessageVariables {
  content: string;
  senderId: string;
  receiverId: string;
}

export const useSendMessage = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({
      content,
      senderId,
      receiverId,
    }: SendMessageVariables) => {
      const { data, error } = await (supabase.from("messages") as any) // eslint-disable-line @typescript-eslint/no-explicit-any
        .insert({
          sender_id: senderId,
          receiver_id: receiverId,
          content,
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
            id: "optimistic-" + Date.now(),
            sender_id: newMsg.senderId,
            receiver_id: newMsg.receiverId,
            content: newMsg.content,
            media_url: null,
            is_read: false,
            created_at: new Date().toISOString(),
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
