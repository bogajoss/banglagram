import { useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "../../lib/supabaseClient";
import { MESSAGES_QUERY_KEY } from "../queries/useGetMessages";

export const useMarkMessagesRead = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ senderId, receiverId }: { senderId: string; receiverId: string }) => {
      const { error } = await (supabase.from("messages") as any) // eslint-disable-line @typescript-eslint/no-explicit-any
        .update({ is_read: true })
        .eq("sender_id", senderId)
        .eq("receiver_id", receiverId)
        .eq("is_read", false);

      if (error) throw error;
    },
    onSuccess: (_, { senderId }) => {
        // Invalidate the conversation with this sender so unread counts update
        queryClient.invalidateQueries({ queryKey: MESSAGES_QUERY_KEY(senderId) });
        queryClient.invalidateQueries({ queryKey: ["conversations"] });
    },
  });
};
