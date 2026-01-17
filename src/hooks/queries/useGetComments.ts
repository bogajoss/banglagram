import { useQuery } from "@tanstack/react-query";
import { supabase } from "../../lib/supabaseClient";
import { useAuth } from "../../hooks/useAuth";

export interface Comment {
  id: string;
  created_at: string;
  text: string;
  user_id: string;
  post_id?: string;
  reel_id?: string;
  audioUrl?: string;
  parent_id?: string | null;
  likes_count: number;
  hasLiked: boolean;
  user: {
    username: string;
    avatar_url: string;
    isVerified?: boolean;
  };
}

export const useGetComments = (targetId: string, type: "post" | "reel") => {
  const { user } = useAuth();

  return useQuery({
    queryKey: ["comments", type, targetId, user?.id],
    queryFn: async () => {
      const column = type === "post" ? "post_id" : "reel_id";

      const { data: commentsData, error } = await supabase
        .from("comments")
        .select(
          `
          *,
          profiles:user_id (
            username,
            avatar_url,
            is_verified
          )
        `
        )
        .eq(column, targetId)
        .order("created_at", { ascending: false });

      if (error) throw error;
      if (!commentsData) return [];

      const likedCommentIds = new Set<string>();
      if (user) {
         // eslint-disable-next-line @typescript-eslint/no-explicit-any
         const commentIds = (commentsData as any[]).map(c => c.id);
         if (commentIds.length > 0) {
             // eslint-disable-next-line @typescript-eslint/no-explicit-any
             const { data: likesData } = await (supabase
                .from("comment_likes") as any)
                .select("comment_id")
                .eq("user_id", user.id)
                .in("comment_id", commentIds);
             
             if (likesData) {
                 // eslint-disable-next-line @typescript-eslint/no-explicit-any
                 (likesData as any[]).forEach(l => likedCommentIds.add(l.comment_id));
             }
         }
      }

      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      return commentsData.map((comment: any) => {
        let audioUrl = comment.audio_url || undefined;
        // Fix for missing /public/ in storage URLs
        if (audioUrl && audioUrl.includes("/storage/v1/object/audio-messages/") && !audioUrl.includes("/storage/v1/object/public/")) {
            audioUrl = audioUrl.replace("/storage/v1/object/audio-messages/", "/storage/v1/object/public/audio-messages/");
        }

        return {
          id: comment.id,
          created_at: comment.created_at,
          text: comment.text,
          user_id: comment.user_id,
          post_id: comment.post_id || undefined,
          reel_id: comment.reel_id || undefined,
          audioUrl: audioUrl,
          parent_id: comment.parent_id,
          likes_count: comment.likes_count || 0,
          hasLiked: likedCommentIds.has(comment.id),
          user: {
            username: comment.profiles?.username || "Guest",
            avatar_url:
              comment.profiles?.avatar_url ||
              "https://api.dicebear.com/9.x/avataaars/svg?seed=guest",
            isVerified: comment.profiles?.is_verified || false,
          },
        };
      }) as Comment[];
    },
    enabled: !!targetId,
  });
};
