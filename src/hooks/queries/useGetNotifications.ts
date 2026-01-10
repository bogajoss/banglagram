import { useQuery } from "@tanstack/react-query";
import { supabase } from "../../lib/supabaseClient";
import type { Notification } from "../../types";

export const NOTIFICATIONS_QUERY_KEY = ["notifications"];

export const useGetNotifications = (userId?: string) => {
  return useQuery({
    queryKey: NOTIFICATIONS_QUERY_KEY,
    enabled: !!userId,
    queryFn: async () => {
      const { data, error } = await supabase
        .from("notifications")
        .select(`
          *,
          actor:profiles!actor_id (username, avatar_url)
        `)
        .eq("user_id", userId as string)
        .order("created_at", { ascending: false });

      if (error) throw error;

      return data.map((n: any) => ({
        id: n.id,
        type: n.type as "follow" | "system", // Ensure DB types match or cast
        user: {
          username: n.actor?.username || "Unknown",
          avatar: n.actor?.avatar_url || "",
        },
        text: n.type === 'follow' ? "started following you." : "interacted with you.", // Simplified text logic
        time: new Date(n.created_at).toLocaleDateString(),
        isFollowing: false, // Need separate check for this
      })) as Notification[];
    },
  });
};
