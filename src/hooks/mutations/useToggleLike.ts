import { useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "../../lib/supabaseClient";
import { FEED_QUERY_KEY } from "../queries/useGetFeed";
import { REELS_QUERY_KEY } from "../queries/useGetReels";
import type { Post, Reel } from "../../types";

interface ToggleLikeVariables {
  targetId: string;
  type: 'post' | 'reel';
  userId: string;
  hasLiked: boolean;
}

export const useToggleLike = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ targetId, type, userId, hasLiked }: ToggleLikeVariables) => {
      const matchCriteria = type === 'post'
        ? { user_id: userId, post_id: targetId }
        : { user_id: userId, reel_id: targetId };

      if (hasLiked) {
        // Unlike
        const { error } = await supabase
          .from("likes")
          .delete()
          .match(matchCriteria);
        if (error) throw error;
      } else {
        // Like
        const { error } = await (supabase
          .from("likes") as any)
          .insert(matchCriteria);
        if (error) throw error;

        // Manual Notification Trigger (since DB trigger for likes might be missing)
        try {
          let ownerId: string | null = null;
          if (type === 'post') {
            const { data: p } = await supabase.from('posts').select('user_id').eq('id', targetId).single();
            ownerId = (p as any)?.user_id;
          } else {
            const { data: r } = await supabase.from('reels').select('user_id').eq('id', targetId).single();
            ownerId = (r as any)?.user_id;
          }

          if (ownerId && ownerId !== userId) {
            await (supabase.from('notifications') as any).insert({
              user_id: ownerId,
              actor_id: userId,
              type: 'like',
              post_id: type === 'post' ? targetId : null,
              reel_id: type === 'reel' ? targetId : null,
              is_read: false
            });
          }
        } catch (notifError) {
          console.error("Failed to create notification", notifError);
          // Don't fail the like action if notification fails
        }
      }
    },
    onMutate: async ({ targetId, type, hasLiked }) => {
      const queryKey = type === 'post' ? FEED_QUERY_KEY : REELS_QUERY_KEY;

      // Cancel refetches
      await queryClient.cancelQueries({ queryKey });

      // Snapshot previous value
      const previousData = queryClient.getQueryData(queryKey);

      // Optimistic update
      queryClient.setQueryData(queryKey, (old: unknown) => {
        if (!old) return old;

        // Handle Infinite Query (Feed)
        if (type === 'post' && typeof old === 'object' && old !== null && 'pages' in old) {
          const pagesOld = old as { pages: Post[][] };
          return {
            ...pagesOld,
            pages: pagesOld.pages.map((page: Post[]) =>
              page.map((post) => {
                if (post.id === targetId) {
                  const currentLikes = Number(post.likes);
                  return {
                    ...post,
                    hasLiked: !hasLiked,
                    likes: hasLiked ? Math.max(0, currentLikes - 1) : currentLikes + 1
                  };
                }
                return post;
              })
            )
          };
        }

        // Handle Array Query (Reels)
        if (type === 'reel' && Array.isArray(old)) {
          return old.map((reel: Reel) => {
            if (reel.id === targetId) {
              const currentLikes = Number(reel.likes);
              return {
                ...reel,
                hasLiked: !hasLiked,
                likes: hasLiked ? Math.max(0, currentLikes - 1) : currentLikes + 1
              };
            }
            return reel;
          });
        }

        return old;
      });

      return { previousData, queryKey };
    },
    onError: (err, _variables, context: { previousData?: unknown; queryKey: string[] } | undefined) => {
      if (context?.previousData) {
        queryClient.setQueryData(context.queryKey, context.previousData);
      }
      console.error(err);
    },
    onSettled: (_, __, { type }) => {
      const queryKey = type === 'post' ? FEED_QUERY_KEY : REELS_QUERY_KEY;
      queryClient.invalidateQueries({ queryKey });
    }
  });
};
