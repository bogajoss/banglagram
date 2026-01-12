import { useInfiniteQuery } from "@tanstack/react-query";
import { supabase } from "../../lib/supabaseClient";
import type { Post } from "../../types";
import type { Database } from "../../database.types";

type AdminPostRow = Database["public"]["Tables"]["posts"]["Row"] & {
    profiles: {
        username: string;
        full_name: string | null;
        avatar_url: string | null;
        is_verified: boolean;
    } | null;
    likes: { count: number }[];
    comments: { count: number }[];
};

export const ADMIN_POSTS_QUERY_KEY = ["admin", "posts"];

export const useAdminPosts = () => {
    return useInfiniteQuery({
        queryKey: ADMIN_POSTS_QUERY_KEY,
        initialPageParam: 0,
        queryFn: async ({ pageParam = 0 }) => {
            const from = pageParam * 20;
            const to = from + 19;

            const { data, error } = await supabase
                .from("posts")
                .select(`
          *,
          profiles (username, full_name, avatar_url, is_verified),
          likes (count),
          comments (count)
        `)
                .order("created_at", { ascending: false })
                .range(from, to);

            if (error) throw error;

            return (data || []).map((post) => {
                const p = post as unknown as AdminPostRow;
                return {
                    id: p.id,
                    userId: p.user_id,
                    user: {
                        id: p.user_id,
                        username: p.profiles?.username || "Unknown",
                        name: p.profiles?.full_name || "Unknown",
                        avatar: p.profiles?.avatar_url || "",
                        isVerified: p.profiles?.is_verified || false,
                    },
                    caption: p.caption || "",
                    content: {
                        type: "image",
                        src: p.image_url,
                        aspectRatio: 1, // Defaulting as we don't store AR yet
                    },
                    likes: p.likes?.[0]?.count || 0,
                    comments: p.comments?.[0]?.count || 0,
                    time: p.created_at, // Post interface requires time
                    hasLiked: false,
                    hasSaved: false,
                };
            }) as Post[];
        },
        getNextPageParam: (lastPage) => {
            return lastPage.length === 20 ? lastPage.length : undefined;
        },
    });
};
