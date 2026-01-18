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
  parentId?: string;
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
      parentId,
    }: CreateCommentVariables) => {
      let audioUrl = null;

      if (audioBlob) {
        const filename = `${userId}/${Date.now()}.webm`;
        const { error: uploadError } = await supabase.storage
          .from("audio-messages")
          .upload(filename, audioBlob);

        if (uploadError) throw uploadError;

        const { data } = supabase.storage
          .from("audio-messages")
          .getPublicUrl(filename);

        audioUrl = data.publicUrl;
      }

      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const { data, error } = await (supabase.from("comments") as any)
        .insert({
          user_id: userId,
          post_id: type === "post" ? targetId : null,
          reel_id: type === "reel" ? targetId : null,
          text,
          audio_url: audioUrl,
          parent_id: parentId,
        })
        .select(
          `
          *,
          user:profiles(username, avatar_url, is_verified)
        `,
        )
        .single();

      if (error) throw error;

      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const anyData = data as any;
      return {
        id: anyData.id,
        created_at: anyData.created_at,
        text: anyData.text,
        user_id: anyData.user_id,
        post_id: anyData.post_id,
        reel_id: anyData.reel_id,
        parent_id: anyData.parent_id,
        likes_count: 0,
        hasLiked: false,
        audioUrl: anyData.audio_url,
        user: {
          username: anyData.user?.username,
          avatar_url: anyData.user?.avatar_url,
          isVerified: anyData.user?.is_verified,
        },
      } as unknown as Comment;
    },
    onMutate: async ({ targetId, type, text, userId, audioBlob, parentId }) => {
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
        audioUrl: audioBlob ? URL.createObjectURL(audioBlob) : undefined,
        parent_id: parentId,
        likes_count: 0,
        hasLiked: false,
        user: {
          username: profile?.username || "You",
          avatar_url: profile?.avatar_url || "",
          isVerified: false,
        },
      };

      queryClient.setQueryData(commentsKey, (old: Comment[] = []) => {
        return [optimisticComment, ...old];
      });

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
