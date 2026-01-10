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
      
      let query = supabase
        .from("profiles")
        .select("username, full_name, avatar_url")
        .limit(5);

      if (currentUserId) {
        // This exclusionary logic is complex in a single simple query without RPC or complex join filtering on client.
        // For "zero mock data", simply fetching recent profiles is a good start.
        query = query.neq("id", currentUserId);
      }

      const { data, error } = await query;

      if (error) throw error;

      return data.map((p: any) => ({
        username: p.username,
        name: p.full_name || p.username,
        avatar: p.avatar_url || "",
        subtitle: "Suggested for you",
      })) as (User & { subtitle: string })[];
    },
  });
};
