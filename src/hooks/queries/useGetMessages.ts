import { useInfiniteQuery } from "@tanstack/react-query";
import { supabase } from "../../lib/supabaseClient";

export const MESSAGES_QUERY_KEY = (userId: string) => ["messages", userId];

export const useGetMessages = (
  currentUserId: string | undefined,
  otherUserId: string | undefined,
) => {
  return useInfiniteQuery({
    queryKey: MESSAGES_QUERY_KEY(otherUserId || ""),
    enabled: !!currentUserId && !!otherUserId,
    initialPageParam: 0,
    queryFn: async ({ pageParam = 0 }) => {
      if (!currentUserId || !otherUserId) throw new Error("IDs required");

      const from = pageParam * 20;
      const to = from + 19;

      const { data, error } = await supabase
        .from("messages")
        .select("*")
        .or(
          `and(sender_id.eq.${currentUserId},receiver_id.eq.${otherUserId}),and(sender_id.eq.${otherUserId},receiver_id.eq.${currentUserId})`,
        )
        .order("created_at", { ascending: false })
        .range(from, to);

      if (error) throw error;
      return data;
    },
    getNextPageParam: (lastPage, allPages) => {
      return lastPage.length === 20 ? allPages.length : undefined;
    },
  });
};

