import { useQuery } from "@tanstack/react-query";
import { supabase } from "../../lib/supabaseClient";
import type { User } from "../../types";

export const SUGGESTED_USERS_QUERY_KEY = ["suggestedUsers"];

export const useGetSuggestedUsers = (currentUserId?: string) => {
  return useQuery({
    queryKey: SUGGESTED_USERS_QUERY_KEY,
    queryFn: async () => {
      // Simple logic: Fetch random users. 
      // Better logic: Fetch users NOT in 'follows' table where follower_id = currentUserId.

      let excludeIds: string[] = [];
      if (currentUserId) {
        excludeIds.push(currentUserId);
        const { data: follows } = await supabase
          .from("follows")
          .select("following_id")
          .eq("follower_id", currentUserId);

        if (follows) {
          follows.forEach((f: any) => excludeIds.push(f.following_id));
        }
      }

      // We can't easily do "NOT IN" huge array in Supabase JS basic filter if array is massive, 
      // but for this MVP size it's fine. 
      // Or we fetch chunk of profiles and filter client side.
      // Let's try basic NOT IN if list is small, else client filter.

      let query = supabase
        .from("profiles")
        .select("id, username, full_name, avatar_url")
        .limit(20); // Fetch more to allow filtering

      if (excludeIds.length > 0 && excludeIds.length < 50) {
        query = query.not("id", "in", `(${excludeIds.join(',')})`);
      }

      const { data, error } = await query;
      if (error) throw error;

      // Client side filter fallback if list was too big for query or just to be safe
      const filtered = data.filter((p: any) => !excludeIds.includes(p.id)).slice(0, 5);

      return filtered.map((p: any) => ({
        id: p.id,
        username: p.username,
        name: p.full_name || p.username,
        avatar: p.avatar_url || "",
        subtitle: "Suggested for you",
        isFollowing: false
      })) as (User & { subtitle: string })[];
    },
  });
};
