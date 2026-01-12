import { useInfiniteQuery } from "@tanstack/react-query";
import { supabase } from "../../lib/supabaseClient";
import type { User } from "../../types";
import type { Database } from "../../database.types";

export type DbConversationMessage = Database["public"]["Tables"]["messages"]["Row"] & {
  sender: {
    id: string;
    username: string;
    full_name: string | null;
    avatar_url: string | null;
    is_verified: boolean;
  } | null;
  receiver: {
    id: string;
    username: string;
    full_name: string | null;
    avatar_url: string | null;
    is_verified: boolean;
  } | null;
};

export interface ConversationUser extends User {
  id: string;
}

export const CONVERSATIONS_QUERY_KEY = ["conversations"];


export const useGetConversations = (userId: string | undefined) => {
  return useInfiniteQuery({
    queryKey: CONVERSATIONS_QUERY_KEY,
    enabled: !!userId,
    initialPageParam: 0,
    queryFn: async ({ pageParam = 0 }) => {
      if (!userId) return [];


      const from = pageParam * 100;
      const to = from + 99;

      const { data, error } = await supabase
        .from("messages")
        .select(
          `
                  sender_id,
                  receiver_id,
                  created_at,
                  sender:profiles!sender_id(id, username, full_name, avatar_url, is_verified),
                  receiver:profiles!receiver_id(id, username, full_name, avatar_url, is_verified)
                `,
        )
        .or(`sender_id.eq.${userId},receiver_id.eq.${userId}`)
        .order("created_at", { ascending: false })
        .range(from, to);

      if (error) {
        console.error("Error fetching conversations", error);
        throw error;
      }
      return data;
    },
    getNextPageParam: (lastPage, allPages) => {
      return lastPage.length === 100 ? allPages.length : undefined;
    },
  });
};

export const getUniqueConversations = (pages: DbConversationMessage[][], userId: string) => {

  const usersMap = new Map<string, ConversationUser>();

  pages.flat().forEach((msg) => {
    const otherUser = msg.sender_id === userId ? msg.receiver : msg.sender;
    if (otherUser && !usersMap.has(otherUser.username)) {
      usersMap.set(otherUser.username, {
        id: otherUser.id,
        username: otherUser.username,
        name: otherUser.full_name || otherUser.username,
        avatar: otherUser.avatar_url || "",
        isVerified: otherUser.is_verified || false,
        stats: { posts: 0, followers: 0, following: 0 },
      });
    }
  });

  return Array.from(usersMap.values());
};

