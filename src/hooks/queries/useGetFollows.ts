import { useQuery } from "@tanstack/react-query";
import { supabase } from "../../lib/supabaseClient";
import type { User } from "../../types";

export const useGetFollows = (
  userId: string,
  type: "followers" | "following" | null,
) => {
  return useQuery({
    queryKey: ["follows", userId, type],
    queryFn: async () => {
      if (!userId || !type) return [];

      let query = supabase.from("follows").select(`
        follower_id,
        following_id,
        follower:profiles!follower_id(username, full_name, avatar_url, id, is_verified),
        following:profiles!following_id(username, full_name, avatar_url, id, is_verified)
      `);

      if (type === "followers") {
        query = query.eq("following_id", userId);
      } else {
        query = query.eq("follower_id", userId);
      }

      const { data, error } = await query;

      if (error) throw error;

      // Map to User type
      const users: User[] = (data || [])
        .map(
          (row: {
            follower: {
              username: string;
              full_name: string | null;
              avatar_url: string | null;
              id: string;
              is_verified: boolean | null;
            } | null;
            following: {
              username: string;
              full_name: string | null;
              avatar_url: string | null;
              id: string;
              is_verified: boolean | null;
            } | null;
          }) => {
            const profile = type === "followers" ? row.follower : row.following;
            if (!profile) return null;

            return {
              username: profile.username,
              name: profile.full_name || profile.username || "User",
              avatar: profile.avatar_url || "",
              id: profile.id, // Ensure we pass ID often needed for follow actions
              isVerified: profile.is_verified || false,
              // Default stats, not fetched here usually
              stats: { posts: 0, followers: 0, following: 0 },
              // We can't easily know if WE follow THEM in this same query without complex logic or auth context
              // For now, isFollowing false or handled by UserListModal if it checks individually
              isFollowing: false,
            };
          },
        )
        .filter(Boolean) as User[];

      return users;
    },
    enabled: !!userId && !!type,
  });
};
