import { useQuery } from "@tanstack/react-query";
import dayjs from "dayjs";
import { supabase } from "../../lib/supabaseClient";
import type { Notification } from "../../types";
import type { Database } from "../../database.types";

export const NOTIFICATIONS_QUERY_KEY = ["notifications"];

export const useGetNotifications = (userId?: string) => {
  return useQuery({
    queryKey: NOTIFICATIONS_QUERY_KEY,
    enabled: !!userId,
    queryFn: async () => {
      const { data, error } = await supabase
        .from("notifications")
        .select(
          `
          id,
          created_at,
          type,
          post_id,
          reel_id,
          actor_id,
          actor:profiles!actor_id (username, avatar_url, is_verified)
        `,
        )
        .eq("user_id", userId as string)
        .order("created_at", { ascending: false });

      if (error) throw error;

      type NotificationWithActor =
        Database["public"]["Tables"]["notifications"]["Row"] & {
          actor: {
            username: string;
            avatar_url: string | null;
            is_verified: boolean | null;
          } | null;
        };

      const notifications = (data || []) as unknown as NotificationWithActor[];

      return notifications.map((n) => {
        let text = "interacted with you.";
        if (n.type === "follow") text = "started following you.";
        else if (n.type === "like")
          text = "liked your " + (n.reel_id ? "reel." : "post.");
        else if (n.type === "comment")
          text = "commented on your " + (n.reel_id ? "reel." : "post.");

        return {
          id: n.id,
          created_at: n.created_at,
          type: n.type as "follow" | "like" | "comment" | "system",
          user: {
            id: n.actor_id || "",
            username: n.actor?.username || "Unknown",
            name: n.actor?.username || "Unknown", // Fallback as full_name might not be in the join if not selected. Wait, I selected username, avatar_url.
            // In step 122 I added full_name to the select list?
            // Checking previous file content... line 16 selects 'username, avatar_url'.
            // I should add full_name to the query to be safe or just use username.
            // Let's stick to what is selected: username.
            avatar: n.actor?.avatar_url || "",
            isVerified: n.actor?.is_verified || false,
          },
          text,
          time: dayjs(n.created_at).fromNow(),
          isFollowing: false,
          post_id: n.post_id || undefined,
          reel_id: n.reel_id || undefined,
        };
      }) as Notification[];
    },
  });
};
