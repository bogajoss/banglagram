import {
  useMutation,
  useQueryClient,
  type InfiniteData,
} from "@tanstack/react-query";
import dayjs from "dayjs";
import { supabase } from "../../lib/supabaseClient";
import { FEED_QUERY_KEY } from "../queries/useGetFeed";
import { REELS_QUERY_KEY } from "../queries/useGetReels";
import { useAuth } from "../../hooks/useAuth";
import type { Comment } from "../queries/useGetComments";
import type { Post, Reel } from "../../types";

interface CreateCommentVariables {
  targetId: string;
  type: "post" | "reel";
  text: string;
  userId: string;
  audioBlob?: Blob;
}

interface MutationContext {
  previousComments?: Comment[];
  previousFeed?: unknown;
  commentsKey: (string | undefined)[];
  feedKey: string[];
}

export const useCreateComment = () => {
  const queryClient = useQueryClient();
  const { profile } = useAuth();

  return useMutation({
    mutationFn: async ({
      targetId,
      type,
      text,
      userId,
      audioBlob,
    }: CreateCommentVariables) => {
      let audioUrl = null;

      if (audioBlob) {
        const filename = `${userId}/${Date.now()}.webm`;
        const { error: uploadError } = await supabase.storage
          .from("audio-messages")
          .upload(filename, audioBlob);

        if (uploadError) throw uploadError;

        const { data: publicUrlData } = supabase.storage
          .from("audio-messages")
          .getPublicUrl(filename);
        
        audioUrl = publicUrlData.publicUrl;
      }

      const payload =
        type === "post"
          ? { user_id: userId, post_id: targetId, text, audio_url: audioUrl }
          : { user_id: userId, reel_id: targetId, text, audio_url: audioUrl };

      const { data, error } = await (supabase.from("comments") as any) // eslint-disable-line @typescript-eslint/no-explicit-any
        .insert(payload)
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    onMutate: async ({ targetId, type, text, userId, audioBlob }) => {
      const commentsKey = ["comments", type, targetId];
      const feedKey = type === "post" ? FEED_QUERY_KEY : REELS_QUERY_KEY;

      await queryClient.cancelQueries({ queryKey: commentsKey });
      await queryClient.cancelQueries({ queryKey: feedKey });

      const previousComments = queryClient.getQueryData<Comment[]>(commentsKey);
      const previousFeed = queryClient.getQueryData(feedKey);

      const optimisticComment: Comment = {
        id: `temp-${dayjs().valueOf()}`,
        created_at: dayjs().toISOString(),
        text,
        user_id: userId,
        post_id: type === "post" ? targetId : undefined,
        reel_id: type === "reel" ? targetId : undefined,
        audio_url: audioBlob ? URL.createObjectURL(audioBlob) : undefined,
        user: {
          username: profile?.username || "You",
          avatar_url: profile?.avatar_url || "",
        },
      } as any; // Cast to any to avoid strict type checks for optimistic update matching

      // 1. Update comments list
      queryClient.setQueryData(commentsKey, (old: Comment[] = []) => {
        return [optimisticComment, ...old];
      });

      // 2. Update comment count in feed/reels
      queryClient.setQueryData(feedKey, (old: unknown) => {
        if (!old) return old;

        // Handle Infinite Query (Feed)
        if (type === "post" && (old as InfiniteData<Post[]>).pages) {
          const infiniteData = old as InfiniteData<Post[]>;
          return {
            ...infiniteData,
            pages: infiniteData.pages.map((page) =>
              page.map((post) => {
                if (post.id === targetId) {
                  return {
                    ...post,
                    comments: Number(post.comments) + 1,
                  };
                }
                return post;
              }),
            ),
          };
        }

        // Handle Array Query (Reels)
        if (type === "reel" && Array.isArray(old)) {
          return (old as Reel[]).map((reel) => {
            if (reel.id === targetId) {
              return {
                ...reel,
                comments: Number(reel.comments) + 1,
              };
            }
            return reel;
          });
        }

        return old;
      });

      return {
        previousComments,
        previousFeed,
        commentsKey,
        feedKey,
      } as MutationContext;
    },
    onError: (_err, _variables, context) => {
      const ctx = context as MutationContext;
      if (ctx?.previousComments) {
        queryClient.setQueryData(ctx.commentsKey, ctx.previousComments);
      }
      if (ctx?.previousFeed) {
        queryClient.setQueryData(ctx.feedKey, ctx.previousFeed);
      }
    },
    onSuccess: (_, variables) => {
      const feedKey =
        variables.type === "post" ? FEED_QUERY_KEY : REELS_QUERY_KEY;
      queryClient.invalidateQueries({ queryKey: feedKey });
      // Also invalidate comments to get real ID
      queryClient.invalidateQueries({
        queryKey: ["comments", variables.type, variables.targetId],
      });
    },
  });
};
