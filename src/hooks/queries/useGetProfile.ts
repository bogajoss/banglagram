import { useQuery } from "@tanstack/react-query";
import { supabase } from "../../lib/supabaseClient";
import type { User, Post } from "../../types";

export const PROFILE_QUERY_KEY = (username: string) => ["profile", username];

export const useGetProfile = (username: string | undefined, currentUserId?: string) => {
  return useQuery({
    queryKey: PROFILE_QUERY_KEY(username || ""),
    enabled: !!username,
    queryFn: async () => {
      if (!username) throw new Error("Username required");

      // 1. Fetch Profile
      const { data: profileData, error } = await supabase
        .from("profiles")
        .select("*")
        .eq("username", username)
        .single();

      if (error) throw error;
      const profile = profileData as any;

      // 2. Fetch Stats
      const { count: postsCount } = await supabase
        .from("posts")
        .select("*", { count: "exact", head: true })
        .eq("user_id", profile.id);

      const { count: followersCount } = await supabase
        .from("follows")
        .select("*", { count: "exact", head: true })
        .eq("following_id", profile.id);

      const { count: followingCount } = await supabase
        .from("follows")
        .select("*", { count: "exact", head: true })
        .eq("follower_id", profile.id);

      // 3. Fetch User's Posts
      const { data: postsData } = await supabase
        .from("posts")
        .select(`
           *,
           likes (count),
           comments (count)
        `)
        .eq("user_id", profile.id)
        .order("created_at", { ascending: false });

      // Check likes for these posts if currentUserId is provided
      const likedPostIds = new Set<string>();
      if (currentUserId && postsData && (postsData as any[]).length > 0) {
        const postIds = (postsData as any[]).map(p => p.id as string);
        const { data: likesData } = await supabase
          .from("likes")
          .select("post_id")
          .eq("user_id", currentUserId)
          .in("post_id", postIds);

        if (likesData) {
          (likesData as { post_id: string }[]).forEach(l => likedPostIds.add(l.post_id));
        }
      }

      // 4. Check Following Status
      let isFollowing = false;
      if (currentUserId && currentUserId !== profile.id) {
        const { count } = await supabase
          .from("follows")
          .select("*", { count: "exact", head: true })
          .match({ follower_id: currentUserId, following_id: profile.id });
        isFollowing = !!count && count > 0;
      }

      const formattedPosts: Post[] = ((postsData as any[]) || []).map((post) => {
        const likes = post.likes as { count: number }[];
        const comments = post.comments as { count: number }[];

        return {
          id: post.id,
          user: {
            username: profile.username,
            name: profile.full_name || profile.username,
            avatar: profile.avatar_url || ""
          },
          content: { type: "image", src: post.image_url },
          likes: likes[0]?.count || 0,
          caption: post.caption || "",
          comments: comments[0]?.count || 0,
          time: new Date(post.created_at).toLocaleDateString(),
          isVerified: false,
          hasLiked: likedPostIds.has(post.id)
        };
      });

      const user: User = {
        id: profile.id,
        username: profile.username,
        name: profile.full_name || "",
        avatar: profile.avatar_url || "",
        bio: profile.bio || "",
        stats: {
          posts: postsCount || 0,
          followers: followersCount || 0,
          following: followingCount || 0,
        },
        isFollowing,
      };

      return { user, posts: formattedPosts };
    },
  });
};
