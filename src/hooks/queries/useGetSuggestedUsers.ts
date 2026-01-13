import { useQuery } from "@tanstack/react-query";
import { supabase } from "../../lib/supabaseClient";
import type { User } from "../../types";
import type { Database } from "../../database.types";

export const SUGGESTED_USERS_QUERY_KEY = ["suggestedUsers"];

export const useGetSuggestedUsers = (currentUserId?: string) => {
  return useQuery({
    queryKey: SUGGESTED_USERS_QUERY_KEY,
    queryFn: async () => {
      const excludeIds: string[] = [];
      if (currentUserId) {
        excludeIds.push(currentUserId);
        const { data: follows } = await supabase
          .from("follows")
          .select("following_id")
          .eq("follower_id", currentUserId);

        if (follows) {
          (follows as { following_id: string }[]).forEach((f) =>
            excludeIds.push(f.following_id),
          );
        }
      }

      let query = supabase
        .from("profiles")
        .select("id, username, full_name, avatar_url, is_verified")
        .limit(20);

      if (excludeIds.length > 0 && excludeIds.length < 50) {
        query = query.not("id", "in", `(${excludeIds.join(",")})`);
      }

      const { data, error } = await query;
      if (error) throw error;

      type ProfileRow = Database["public"]["Tables"]["profiles"]["Row"];

      // Client side filter fallback
      const filtered = (data as ProfileRow[])
        .filter((p) => !excludeIds.includes(p.id))
        .slice(0, 5);

      return filtered.map((p) => ({
        id: p.id,
        username: p.username,
        name: p.full_name || p.username,
        avatar: p.avatar_url || "",
        subtitle: "Suggested for you",
        isVerified: p.is_verified || false,
        isFollowing: false,
      })) as (User & { subtitle: string })[];
    },
  });
};
