import React, { useEffect } from "react";
import dayjs from "dayjs";
import { useAppStore } from "../store/useAppStore";
import { useNavigate } from "react-router-dom";
import type { User, Notification } from "../types";
import { useGetNotifications } from "../hooks/queries/useGetNotifications";
import type { Database } from "../database.types";
import { useGetSuggestedUsers } from "../hooks/queries/useGetSuggestedUsers";
import { useAuth } from "../hooks/useAuth";
import { useFollowUser } from "../hooks/mutations/useFollowUser";

import { supabase } from "../lib/supabaseClient";
import OptimizedImage from "../components/OptimizedImage";
import VerifiedBadge from "../components/VerifiedBadge";

const NotificationsView: React.FC = () => {
  const { theme, setUnreadNotificationsCount } =
    useAppStore();
  const { mutate: followUser } = useFollowUser();

  const navigate = useNavigate();
  const { user } = useAuth();
  const buttonBg = "bg-[#006a4e] hover:bg-[#00523c]";
  const borderClass = theme === "dark" ? "border-zinc-800" : "border-zinc-200";
  const textSecondary = theme === "dark" ? "text-[#a8a8a8]" : "text-zinc-500";

  const { data: notifications = [], isLoading: notifLoading } =
    useGetNotifications(user?.id);
  const { data: suggestedUsers = [] } = useGetSuggestedUsers(user?.id);

  const { setViewingPost, setViewingReel } = useAppStore();

  useEffect(() => {
    // Reset unread count on mount
    setUnreadNotificationsCount(0);
    // Store current time as last read
    localStorage.setItem("lastNotificationReadTime", dayjs().toISOString());
  }, [setUnreadNotificationsCount]);

  const onUserClick = (user: User) => {
    navigate(`/profile/${user.username}`);
  };

  const handleNotificationClick = async (notif: Notification) => {
    if (notif.type === "follow") {
      if (notif.user) onUserClick(notif.user);
      return;
    }

    try {
      if (notif.postId) {
        const { data, error } = await supabase
          .from("posts")
          .select(
            `
                    *,
                    user:profiles(*),
                    likes(count),
                    comments(count)
                `,
          )
          .eq("id", notif.postId)
          .single();

        if (error || !data) throw error;

        // Define exact shape or cast to unknown first
        const postData =
          data as unknown as Database["public"]["Tables"]["posts"]["Row"] & {
            user: Database["public"]["Tables"]["profiles"]["Row"];
            likes: { count: number }[];
            comments: { count: number }[];
          };

        // Fetch if current user liked it
        const { count } = await supabase
          .from("likes")
          .select("*", { count: "exact", head: true })
          .eq("post_id", notif.postId)
          .eq("user_id", user?.id || "");

        const post = {
          id: postData.id,
          user: {
            username: postData.user.username,
            name: postData.user.full_name,
            avatar: postData.user.avatar_url,
          },
          content: {
            type: "image", // Assuming image for posts
            src: postData.image_url,
            poster: postData.image_url,
          },
          likes: postData.likes[0].count,
          comments: postData.comments[0].count,
          caption: postData.caption,
          time: dayjs(postData.created_at).fromNow(),
          hasLiked: count ? count > 0 : false,
          commentList: [],
        };
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        setViewingPost(post as any); // Post type mismatch slightly on 'content', ok for now
      } else if (notif.reelId) {
        const { data, error } = await supabase
          .from("reels")
          .select(
            `
                    *,
                    user:profiles(*),
                    likes(count),
                    comments(count)
                `,
          )
          .eq("id", notif.reelId)
          .single();

        if (error || !data) throw error;

        const reelData =
          data as unknown as Database["public"]["Tables"]["reels"]["Row"] & {
            user: Database["public"]["Tables"]["profiles"]["Row"];
            likes: { count: number }[];
            comments: { count: number }[];
          };

        const { count } = await supabase
          .from("likes")
          .select("*", { count: "exact", head: true })
          .eq("reel_id", notif.reelId)
          .eq("user_id", user?.id || "");

        const reel = {
          id: reelData.id,
          src: reelData.video_url,
          user: {
            username: reelData.user.username,
            name: reelData.user.full_name,
            avatar: reelData.user.avatar_url,
          },
          likes: reelData.likes[0].count,
          comments: reelData.comments[0].count,
          caption: reelData.caption || "",
          audio: reelData.audio_track_name || "",
          hasLiked: count ? count > 0 : false,
        };
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        setViewingReel(reel as any);
      }
    } catch (err) {
      console.error("Failed to load content", err);
    }
  };

  return (
    <div className="w-full max-w-[600px] flex flex-col gap-6">
      <div
        className={`md:hidden sticky top-0 z-10 border-b ${borderClass} p-4 flex items-center ${theme === "dark" ? "bg-black/95 backdrop-blur-md" : "bg-white/95 backdrop-blur-md"}`}
      >
        <h1 className="text-xl font-bold">নোটিফিকেশন</h1>
      </div>

      <div className="px-4 md:px-2 py-2 md:py-8 flex flex-col gap-6">
        <h1 className="text-2xl font-bold px-2 hidden md:block">নোটিফিকেশন</h1>
        <div>
          <h2 className="text-base font-bold mb-4 px-2">আগের</h2>
          <div className="flex flex-col gap-4">
            {notifLoading && (
              <div className="p-4 text-center">Loading notifications...</div>
            )}
            {!notifLoading && notifications.length === 0 && (
              <div className="p-4 text-center text-gray-500">
                কোনো নোটিফিকেশন নেই
              </div>
            )}

            {notifications.map((notif) => (
              <div
                key={notif.id}
                className="flex items-center justify-between px-2"
              >
                <div className="flex items-center gap-3">
                  {notif.type !== "system" && notif.user && (
                    <div
                      className="relative flex-shrink-0 cursor-pointer"
                      onClick={() => onUserClick(notif.user!)}
                    >
                      <div className="w-11 h-11 rounded-full overflow-hidden">
                        <OptimizedImage
                          src={notif.user.avatar}
                          className="w-full h-full"
                          alt="user"
                        />
                      </div>
                    </div>
                  )}
                  {notif.type === "system" && (
                    <div
                      className={`w-11 h-11 rounded-full border ${borderClass} flex items-center justify-center flex-shrink-0 overflow-hidden`}
                    >
                      <OptimizedImage
                        src="https://www.instagram.com/static/images/activity/meta-logo-pano-manual-padding-notif@2x.png/c2173431433e.png"
                        className="w-6 h-6 object-contain"
                        alt="Meta"
                      />
                    </div>
                  )}
                  <div className="text-sm">
                    {notif.user && (
                      <div className="inline-flex items-center">
                        <span
                          className={`font-semibold cursor-pointer ${theme === "dark" ? "hover:text-zinc-300" : "hover:text-zinc-600"}`}
                          onClick={() => handleNotificationClick(notif)}
                        >
                          {notif.user.username}
                        </span>
                        {notif.user.isVerified && <VerifiedBadge />}
                      </div>
                    )}
                    <span
                      className="ml-1 cursor-pointer hover:opacity-80"
                      onClick={() => handleNotificationClick(notif)}
                    >
                      {notif.text}
                    </span>
                    <span className={`${textSecondary} ml-1`}>
                      {notif.time}
                    </span>
                  </div>
                </div>
                {notif.isFollowing ? (
                  <button
                    className={`${theme === "dark" ? "bg-[#363636]" : "bg-gray-200 text-black"} px-4 py-1.5 rounded-lg text-sm font-semibold`}
                  >
                    ফলো করছেন
                  </button>
                ) : notif.type === "follow" ? (
                  <button
                    className={`${buttonBg} text-white px-4 py-1.5 rounded-lg text-sm font-semibold`}
                  >
                    ফলো
                  </button>
                ) : null}
              </div>
            ))}
          </div>
        </div>
        <div className={`border-t ${borderClass} pt-4`}>
          <h2 className="text-base font-bold mb-4 px-2">
            আপনার জন্য প্রস্তাবিত
          </h2>
          <div className="flex flex-col gap-4">
            {suggestedUsers.map((user, index) => {
              const u = user as User;
              const suggested = user as { subtitle: string };
              return (
                <div
                  key={index}
                  className="flex items-center justify-between px-2 hover:bg-white/5 p-2 rounded-lg transition-colors cursor-pointer"
                  onClick={() => onUserClick(u)}
                >
                  <div className="flex items-center gap-3">
                    <div className="w-11 h-11 rounded-full overflow-hidden flex-shrink-0">
                      <OptimizedImage
                        src={u.avatar}
                        alt={u.username}
                        className="w-full h-full"
                      />
                    </div>
                    <div className="flex flex-col text-sm overflow-hidden">
                      <div className="flex items-center gap-1">
                        <span
                          className={`font-semibold cursor-pointer truncate ${theme === "dark" ? "hover:text-zinc-300" : "hover:text-zinc-600"}`}
                        >
                          {u.username}
                        </span>
                        {u.isVerified && <VerifiedBadge />}
                      </div>
                      <span className={`${textSecondary} truncate`}>
                        {u.name}
                      </span>
                      <span className={`${textSecondary} text-xs truncate`}>
                        {suggested.subtitle}
                      </span>
                    </div>
                  </div>
                  <button
                    className={`${buttonBg} text-white px-4 py-1.5 rounded-lg text-sm font-semibold transition-colors whitespace-nowrap active:scale-95`}
                    onClick={(e) => {
                      e.stopPropagation();
                      if (user && u.id) {
                        followUser({
                          targetUserId: u.id,
                          currentUserId: user.id,
                          isFollowing: false,
                          targetUsername: u.username,
                        });
                      }
                    }}
                  >
                    ফলো
                  </button>
                </div>
              );
            })}
          </div>
        </div>
      </div>
    </div>
  );
};

export default NotificationsView;
