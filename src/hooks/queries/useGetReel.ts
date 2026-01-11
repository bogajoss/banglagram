import { useQuery } from "@tanstack/react-query";
import { supabase } from "../../lib/supabaseClient";
import type { Reel } from "../../types";
import type { Database } from "../../database.types";

export const REEL_QUERY_KEY = (id: string) => ["reel", id];

export const useGetReel = (reelId: string | undefined, currentUserId?: string) => {
  return useQuery({
    queryKey: REEL_QUERY_KEY(reelId || ""),
    enabled: !!reelId,
    queryFn: async () => {
      if (!reelId) throw new Error("Reel ID required");

      const { data, error } = await supabase
        .from("reels")
        .select(
          `
          *,
          profiles (username, full_name, avatar_url, is_verified),
          likes (count),
          comments (count)
        `,
        )
        .eq("id", reelId)
        .single();

      if (error) throw error;

      type ReelWithProfile = Database["public"]["Tables"]["reels"]["Row"] & {
        profiles: {
          username: string;
          full_name: string | null;
          avatar_url: string | null;
          is_verified: boolean | null;
        } | null;
        likes: { count: number }[];
        comments: { count: number }[];
      };

      const reel = data as unknown as ReelWithProfile;

      // Check if current user liked this reel
      let hasLiked = false;
      let isFollowing = false;

      if (currentUserId) {
        const { count: likeCount } = await supabase
          .from("likes")
          .select("*", { count: "exact", head: true })
          .eq("reel_id", reelId)
          .eq("user_id", currentUserId);
        
        hasLiked = !!likeCount && likeCount > 0;

        const { count: followCount } = await supabase
          .from("follows")
          .select("*", { count: "exact", head: true })
          .eq("follower_id", currentUserId)
          .eq("following_id", reel.user_id);
        
        isFollowing = !!followCount && followCount > 0;
      }

      return {
        id: reel.id,
        userId: reel.user_id,
        user: {
          id: reel.user_id,
          username: reel.profiles?.username || "Unknown",
          name: reel.profiles?.full_name || "Unknown",
          avatar: reel.profiles?.avatar_url || "",
          isVerified: reel.profiles?.is_verified || false,
          isFollowing,
        },
        src: reel.video_url,
        likes: reel.likes?.[0]?.count || 0,
        comments: reel.comments?.[0]?.count || 0,
        caption: reel.caption || "",
        audio: reel.audio_track_name || "Original Audio",
        hasLiked,
      } as Reel;
    },
  });
};
