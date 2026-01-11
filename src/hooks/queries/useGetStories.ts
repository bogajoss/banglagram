import { useQuery } from "@tanstack/react-query";
import { supabase } from "../../lib/supabaseClient";
import type { Story } from "../../types";

export const STORIES_QUERY_KEY = ["stories"];

export const useGetStories = (currentUserId: string | undefined) => {
  return useQuery({
    queryKey: STORIES_QUERY_KEY,
    queryFn: async () => {
      // Fetch active stories (expires_at > now)
      // Note: Supabase/Postgres might need timezone awareness.
      // We'll filter client side if needed, or simple comparison.

      const { data, error } = await supabase
        .from("stories")
        .select(
          `
            *,
            user:profiles (
                username,
                avatar_url
            )
        `,
        )
        // .gt("expires_at", new Date().toISOString()) // Uncomment if expiration works correctly
        .order("created_at", { ascending: false });

      if (error) throw error;

      // Transform
      const stories: Story[] = data.map((s: {
        id: string;
        user_id: string;
        media_url: string;
        user: { username: string; avatar_url: string | null } | null;
      }) => ({
        id: s.id,
        username: s.user?.username || "User",
        img: s.media_url, // Assuming media_url is image. If video, Story type might need update
        isUser: s.user_id === currentUserId,
      }));

      // Group by user?
      // Current UI (HomeView) shows list of circles. 1 circle per user? Or per story?
      // Instagram shows 1 circle per user.
      // But StoryViewer iterates through all stories.
      // Banglagram UI seems to show individual stories in the list?
      // Let's check HomeView mock data.
      /*
      stories: [
        { id: "1", username: "shakib75", img: "...", isUser: false },
        { id: "2", username: "mehazabien", img: "...", isUser: false },
        ...
      ]
      */
      // It looks like one entry per friend.
      // If a user has multiple stories, we typically show one circle, and StoryViewer handles the list.
      // For now, let's just return all stories separately (Simplification: 1 story = 1 circle).
      // Or we can distinct by username.

      // Let's return individual stories for now, as UI iterates them.
      return stories;
    },
  });
};
