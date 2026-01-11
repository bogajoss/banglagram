import { useQuery } from "@tanstack/react-query";
import { supabase } from "../../lib/supabaseClient";

export const MESSAGES_QUERY_KEY = (userId: string) => ["messages", userId];

export const useGetMessages = (
  currentUserId: string | undefined,
  otherUserId: string | undefined,
) => {
  return useQuery({
    queryKey: MESSAGES_QUERY_KEY(otherUserId || ""),
    enabled: !!currentUserId && !!otherUserId,
    queryFn: async () => {
      if (!currentUserId || !otherUserId) throw new Error("IDs required");

      const { data, error } = await supabase
        .from("messages")
        .select("*")
        .or(
          `and(sender_id.eq.${currentUserId},receiver_id.eq.${otherUserId}),and(sender_id.eq.${otherUserId},receiver_id.eq.${currentUserId})`,
        )
        .order("created_at", { ascending: true });

      if (error) throw error;
      return data;
    },
  });
};
