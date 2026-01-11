import { useQuery } from "@tanstack/react-query";
import { supabase } from "../../lib/supabaseClient";
import type { Reel } from "../../types";
import type { Database } from "../../database.types";

export const REELS_QUERY_KEY = ["reels"];

export const useGetReels = (currentUserId?: string) => {
  return useQuery({
    queryKey: REELS_QUERY_KEY,
    queryFn: async () => {
      const { data, error } = await supabase
        .from("reels")
        .select(`
          *,
          profiles (username, full_name, avatar_url),
          likes (count),
          comments (count)
        `)
        .order("created_at", { ascending: false });

      if (error) throw error;

      type ReelWithProfile = Database["public"]["Tables"]["reels"]["Row"] & {
        profiles: { username: string; full_name: string | null; avatar_url: string | null } | null;
        likes: { count: number }[];
        comments: { count: number }[];
      };

      const reelsData = (data || []) as unknown as ReelWithProfile[];

      // Check if current user liked these reels
      const reelIds = reelsData.map((r) => r.id);
      const likedReelIds = new Set<string>();

      const uniqueUserIds = Array.from(new Set(reelsData.map(r => r.user_id)));
      const followedUserIds = new Set<string>();

      if (currentUserId) {
        if (reelIds.length > 0) {
          const { data: likesData } = await supabase
            .from("likes")
            .select("reel_id")
            .eq("user_id", currentUserId)
            .in("reel_id", reelIds);

          if (likesData) {
            (likesData as { reel_id: string | null }[]).forEach((l) => likedReelIds.add(l.reel_id || ""));
          }
        }

        if (uniqueUserIds.length > 0) {
          const { data: followsData } = await supabase
            .from("follows")
            .select("following_id")
            .eq("follower_id", currentUserId)
            .in("following_id", uniqueUserIds);

          if (followsData) {
            (followsData as { following_id: string }[]).forEach((f) => followedUserIds.add(f.following_id));
          }
        }
      }

      return reelsData.map((reel) => ({
        id: reel.id,
        userId: reel.user_id,
        user: {
          id: reel.user_id,
          username: reel.profiles?.username || "Unknown",
          name: reel.profiles?.full_name || "Unknown",
          avatar: reel.profiles?.avatar_url || "",
          isFollowing: followedUserIds.has(reel.user_id),
        },
        src: reel.video_url,
        likes: reel.likes?.[0]?.count || 0,
        comments: reel.comments?.[0]?.count || 0,
        caption: reel.caption || "",
        audio: reel.audio_track_name || "Original Audio",
        hasLiked: likedReelIds.has(reel.id),
      })) as Reel[];
    },
  });
};
