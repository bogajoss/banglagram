import { useQuery } from "@tanstack/react-query";
import { supabase } from "../../lib/supabaseClient";
import type { Post } from "../../types";

export const TAGGED_POSTS_QUERY_KEY = ["taggedPosts"];

export const useGetTaggedPosts = (userId: string | undefined) => {
    return useQuery({
        queryKey: [...TAGGED_POSTS_QUERY_KEY, userId],
        enabled: !!userId,
        queryFn: async () => {
            if (!userId) return [];

            const { data, error } = await supabase
                .from("post_tags")
                .select(`
            post:posts (
                *,
                likes (count),
                comments (count),
                user:profiles (
                    username, full_name, avatar_url
                )
            )
        `)
                .eq("user_id", userId)
                .order("created_at", { ascending: false });

            if (error) {
                // If table doesn't exist, return empty (graceful degradation)
                if (error.code === '42P01') return [];
                throw error;
            }

            const posts: Post[] = data.map((item: any) => {
                const p = item.post;
                if (!p) return null;

                return {
                    id: p.id,
                    user: {
                        username: p.user?.username || "Unknown",
                        name: p.user?.full_name || "",
                        avatar: p.user?.avatar_url || "",
                    },
                    content: {
                        type: "image",
                        src: p.image_url,
                    },
                    likes: p.likes?.[0]?.count || 0,
                    caption: p.caption || "",
                    comments: p.comments?.[0]?.count || 0,
                    time: new Date(p.created_at).toLocaleDateString(),
                    hasLiked: false,
                    hasSaved: false // Not checked here
                };
            }).filter(Boolean) as Post[];

            return posts;
        },
    });
};
