import { useInfiniteQuery } from "@tanstack/react-query";
import { supabase } from "../../lib/supabaseClient";

export interface Conversation {
  id: string;
  username: string;
  name: string;
  avatar: string;
  isVerified: boolean;
  lastMessage?: string | null;
  lastMessageTime?: string | null;
  isRead?: boolean;
  lastSenderId?: string;
  isOnline?: boolean;
  lastSeen?: string | null;
}

export const CONVERSATIONS_QUERY_KEY = ["conversations"];

export const useGetConversations = (userId: string | undefined) => {
  return useInfiniteQuery({
    queryKey: CONVERSATIONS_QUERY_KEY,
    enabled: !!userId,
    initialPageParam: 0,
    queryFn: async ({ pageParam = 0 }) => {
      if (!userId) return [];

      // Cast params to any to avoid strict type checks if database.types.ts isn't perfectly synced
      const { data, error } = await supabase.rpc("get_conversations", {
        current_user_id: userId,
        limit_count: 20,
        offset_count: pageParam * 20,
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
      } as any);

      if (error) {
        console.error("Error fetching conversations", error);
        throw error;
      }

      // Map RPC result to Conversation interface
      // Force data to be treated as array
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const rpcData = (data as any[]) || [];

      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      return rpcData.map((c: any) => ({
        id: c.user_id,
        username: c.username,
        name: c.full_name || c.username,
        avatar: c.avatar_url || "",
        isVerified: c.is_verified || false,
        lastMessage: c.last_message,
        lastMessageTime: c.last_message_time,
        isRead: c.is_read,
        lastSenderId: c.sender_id,
        isOnline: c.is_online,
        lastSeen: c.last_seen,
      }));
    },
    getNextPageParam: (lastPage, allPages) => {
      return lastPage.length === 20 ? allPages.length : undefined;
    },
  });
};
