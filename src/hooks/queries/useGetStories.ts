import { useQuery } from "@tanstack/react-query";
import { supabase } from "../../lib/supabaseClient";
import type { Story } from "../../types";
import type { Database } from "../../database.types";

export const STORIES_QUERY_KEY = ["stories"];

export const useGetStories = () => {
  return useQuery({
    queryKey: STORIES_QUERY_KEY,
    queryFn: async () => {
      // Fetch active stories (expires_at > now)
      const { data, error } = await supabase
        .from("stories")
        .select(`
          id,
          created_at,
          media_url,
          user_id,
          profiles (username, avatar_url)
        `)
        .gt("expires_at", new Date().toISOString())
        .order("created_at", { ascending: false });

      if (error) throw error;

      type StoryWithProfile = Database["public"]["Tables"]["stories"]["Row"] & {
        profiles: { username: string; avatar_url: string | null } | null;
      };

      const stories = data as unknown as StoryWithProfile[];

      return stories.map((story) => ({
        id: story.id,
        username: story.profiles?.username || "Unknown",
        img: story.media_url,
        isUser: false, // Logic to determine if it's the current user can be added in component
      })) as Story[];
    },
  });
};
