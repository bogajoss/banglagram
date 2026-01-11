
import { useQuery } from "@tanstack/react-query";
import { supabase } from "../../lib/supabaseClient";
import type { User } from "../../types";

export interface ConversationUser extends User {
    id: string;
}

export const CONVERSATIONS_QUERY_KEY = ["conversations"];

export const useGetConversations = (userId: string | undefined) => {
    return useQuery({
        queryKey: CONVERSATIONS_QUERY_KEY,
        enabled: !!userId,
        queryFn: async () => {
            if (!userId) return [];

            interface ProfileJoin { id: string; username: string; full_name: string | null; avatar_url: string | null }

            const { data, error } = await supabase
                .from('messages')
                .select(`
                  sender_id,
                  receiver_id,
                  created_at,
                  sender:profiles!sender_id(id, username, full_name, avatar_url),
                  receiver:profiles!receiver_id(id, username, full_name, avatar_url)
                `)
                .or(`sender_id.eq.${userId},receiver_id.eq.${userId}`)
                .order('created_at', { ascending: false });

            if (error) {
                console.error('Error fetching conversations', error);
                throw error;
            }

            const usersMap = new Map<string, ConversationUser>();
            (data as { sender_id: string; receiver_id: string; sender: ProfileJoin; receiver: ProfileJoin }[]).forEach((msg) => {
                const otherUser = msg.sender_id === userId ? msg.receiver : msg.sender;
                if (otherUser && !usersMap.has(otherUser.username)) {
                    usersMap.set(otherUser.username, {
                        id: otherUser.id,
                        username: otherUser.username,
                        name: otherUser.full_name || otherUser.username,
                        avatar: otherUser.avatar_url || "",
                        stats: { posts: 0, followers: 0, following: 0 }
                    });
                }
            });
            return Array.from(usersMap.values());
        }
    });
};
