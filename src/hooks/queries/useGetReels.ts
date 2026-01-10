import { useQuery } from "@tanstack/react-query";
import { supabase } from "../../lib/supabaseClient";
import type { Reel } from "../../types";

export const REELS_QUERY_KEY = ["reels"];

export const useGetReels = () => {
  return useQuery({
    queryKey: REELS_QUERY_KEY,
    queryFn: async () => {
      const { data, error } = await supabase
        .from("reels")
        .select(`
          *,
          profiles (username, full_name, avatar_url)
        `)
        .order("created_at", { ascending: false });

      if (error) throw error;

      return data.map((reel: any) => ({
        id: reel.id,
        user: {
          username: reel.profiles?.username || "Unknown",
          name: reel.profiles?.full_name || "Unknown",
          avatar: reel.profiles?.avatar_url || "",
        },
        src: reel.video_url,
        likes: 0, 
        comments: 0,
        caption: reel.caption || "",
        audio: reel.audio_track_name || "Original Audio",
      })) as Reel[];
    },
  });
};
