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

      return data.map((n: any) => {
        let text = "interacted with you.";
        if (n.type === 'follow') text = "started following you.";
        else if (n.type === 'like') text = "liked your " + (n.reel_id ? "reel." : "post.");
        else if (n.type === 'comment') text = "commented on your " + (n.reel_id ? "reel." : "post.");

        return {
          id: n.id,
          type: n.type as "follow" | "like" | "comment" | "system",
          user: {
            username: n.actor?.username || "Unknown",
            name: n.actor?.full_name || n.actor?.username || "Unknown",
            avatar: n.actor?.avatar_url || "",
          },
          text,
          time: new Date(n.created_at).toLocaleDateString(),
          isFollowing: false, // You might want to fetch this properly if needed
          post_id: n.post_id,
          reel_id: n.reel_id,
        };
      }) as Notification[];
    },
  });
};
