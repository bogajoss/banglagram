import React, { useEffect } from "react";
import { Heart, MessageCircle } from "lucide-react";
import PostItem from "../components/PostItem";
import { useAppStore } from "../store/useAppStore";
import { useNavigate } from "react-router-dom";
import type { User, Story } from "../types";
import { motion } from "framer-motion";
import { useGetFeed } from "../hooks/queries/useGetFeed";
import { useGetStories } from "../hooks/queries/useGetStories";
import { useGetSuggestedUsers } from "../hooks/queries/useGetSuggestedUsers";
import { useAuth } from "../hooks/useAuth";
import { useInView } from "react-intersection-observer";
import { useFollowUser } from "../hooks/mutations/useFollowUser";
import { useToggleSave } from "../hooks/mutations/useToggleSave";

import OptimizedImage from "../components/OptimizedImage";

import { Plus } from "lucide-react";
import { Button } from "@/components/ui/button";
import dayjs from "dayjs";
import relativeTime from "dayjs/plugin/relativeTime";
import "dayjs/locale/bn";

dayjs.extend(relativeTime);
dayjs.locale("bn");

const HomeView: React.FC = () => {
  const {
    currentUser,
    theme,
    showToast,
    setViewingStory,
    setViewingPost,
    setCreateModalOpen,
  } = useAppStore();

  const { user } = useAuth();
  const navigate = useNavigate();
  const { ref, inView } = useInView({
    rootMargin: "1000px", // Trigger fetch 1000px before reaching the bottom
  });

  const {
    data: feedData,
    isLoading: feedLoading,
    isError: feedError,
    fetchNextPage,
    hasNextPage,
    isFetchingNextPage,
  } = useGetFeed(user?.id);

  const { data: stories = [] } = useGetStories(user?.id);
  const userStories = stories.filter((s) => s.isUser);
  const otherStories = stories.filter((s) => !s.isUser);

  const { data: suggestedUsers = [] } = useGetSuggestedUsers(user?.id);
  const { mutate: followUser } = useFollowUser();
  const { mutate: toggleSaveMutation } = useToggleSave();

  useEffect(() => {
    if (inView && hasNextPage) {
      fetchNextPage();
    }
  }, [inView, hasNextPage, fetchNextPage]);

  const borderClass = theme === "dark" ? "border-zinc-800" : "border-zinc-200";
  const textSecondary = theme === "dark" ? "text-[#a8a8a8]" : "text-zinc-500";

  const handleUserClick = (user: User) => {
    navigate(`/profile/${user.username}`);
  };

  const handleYourStoryClick = () => {
    if (userStories.length > 0) {
      setViewingStory(userStories[0].id);
    } else {
      setCreateModalOpen(true);
    }
  };

  const containerVariants = {
    hidden: { opacity: 0 },
    visible: {
      opacity: 1,
      transition: {
        staggerChildren: 0.1,
      },
    },
  };

  const itemVariants = {
    hidden: { opacity: 0, scale: 0.8 },
    visible: { opacity: 1, scale: 1 },
  };

  if (feedLoading) {
    return (
      <div className="w-full max-w-[630px] pt-10 flex flex-col items-center">
        <div className="w-full h-96 bg-gray-200 dark:bg-gray-800 animate-pulse rounded-md mb-4"></div>
        <div className="w-full h-96 bg-gray-200 dark:bg-gray-800 animate-pulse rounded-md"></div>
      </div>
    );
  }

  if (feedError) {
    return (
      <div className="p-4 text-center">
        Error loading feed. Please try again.
      </div>
    );
  }

  return (
    <div className="w-full max-w-[630px] pt-0 md:pt-[30px] flex gap-16 flex-col">
      <div
        className={`md:hidden sticky top-0 z-10 border-b ${borderClass} px-4 h-[60px] flex items-center justify-between ${theme === "dark" ? "bg-black" : "bg-white"}`}
      >
        <h1 className="text-2xl font-bold tracking-tight text-[#006a4e]">
          SysMed
        </h1>
        <div className="flex items-center gap-5">
          <motion.div whileTap={{ scale: 0.9 }}>
            <Heart size={24} onClick={() => showToast("নোটিফিকেশন")} />
          </motion.div>
          <motion.div
            className="relative"
            onClick={() => navigate("/messages")}
            whileTap={{ scale: 0.9 }}
          >
            <MessageCircle size={24} />
            <div className="absolute -top-1 -right-1 bg-[#f42a41] text-[10px] w-4 h-4 rounded-full flex items-center justify-center font-bold text-white">
              1
            </div>
          </motion.div>
        </div>
      </div>

      <div className="flex-grow w-full max-w-[470px] mx-auto px-0 md:px-0">
        <motion.div
          variants={containerVariants}
          initial="hidden"
          animate="visible"
          className="flex gap-4 mb-6 overflow-x-auto scrollbar-hide py-4 px-4 md:px-0"
        >
          {/* Permanent Add Story Button */}
          <motion.div
            variants={itemVariants}
            whileHover={{ y: -5 }}
            className="flex flex-col items-center gap-1 cursor-pointer flex-shrink-0 w-[66px] group"
            onClick={handleYourStoryClick}
          >
            <div
              className={`w-[66px] h-[66px] rounded-full p-[2px] ${userStories.length > 0 ? "bg-gradient-to-tr from-[#006a4e] to-[#004d39]" : "border border-zinc-500"} group-hover:scale-105 transition-transform duration-200 relative`}
            >
              <div
                className={`w-full h-full rounded-full p-[2px] ${theme === "dark" ? "bg-black" : "bg-white"}`}
              >
                <OptimizedImage
                  src={currentUser.avatar}
                  width={100}
                  className="w-full h-full rounded-full"
                  alt="Your story"
                />
              </div>
              {userStories.length === 0 && (
                <div className="absolute bottom-0 right-0 bg-[#0095f6] border-2 border-white dark:border-black rounded-full p-0.5 text-white">
                  <Plus size={14} strokeWidth={4} />
                </div>
              )}
            </div>
            <span
              className={`text-xs truncate w-full text-center ${theme === "dark" ? "text-[#a8a8a8]" : "text-zinc-500"}`}
            >
              আপনার স্টোরি
            </span>
          </motion.div>

          {otherStories.map((story: Story) => (
            <motion.div
              key={story.id}
              variants={itemVariants}
              whileHover={{ y: -5 }}
              className="flex flex-col items-center gap-1 cursor-pointer flex-shrink-0 w-[66px] group"
              onClick={() => setViewingStory(story.id)}
            >
              <div className="w-[66px] h-[66px] rounded-full p-[2px] bg-gradient-to-tr from-[#006a4e] to-[#004d39] group-hover:scale-105 transition-transform duration-200">
                <div
                  className={`w-full h-full rounded-full p-[2px] ${theme === "dark" ? "bg-black" : "bg-white"}`}
                >
                  <OptimizedImage
                    src={story.userAvatar || story.img}
                    width={100}
                    className="w-full h-full rounded-full"
                    alt={story.username}
                  />
                </div>
              </div>
              <span
                className={`text-xs truncate w-full text-center ${theme === "dark" ? "text-[#f5f5f5]" : "text-black"}`}
              >
                {story.username}
              </span>
            </motion.div>
          ))}
        </motion.div>

        <div className="flex flex-col gap-4 pb-20">
          {feedData?.pages.map((page, i) => (
            <React.Fragment key={i}>
              {page.map((post) => (
                <PostItem
                  key={post.id}
                  post={post}
                  isSaved={!!post.hasSaved}
                  onToggleSave={() =>
                    toggleSaveMutation({
                      postId: post.id,
                      userId: user?.id || "",
                      hasSaved: !!post.hasSaved,
                    })
                  }
                  onUserClick={handleUserClick}
                  onPostClick={setViewingPost}
                />
              ))}
            </React.Fragment>
          ))}
          <div ref={ref} className="h-10 text-center text-gray-500">
            {isFetchingNextPage
              ? "Loading more..."
              : hasNextPage
                ? "Load more"
                : "No more posts"}
          </div>
        </div>
      </div>

      <div className="hidden lg:block w-[319px]">
        <motion.div
          initial={{ opacity: 0, x: 20 }}
          animate={{ opacity: 1, x: 0 }}
          className="flex items-center justify-between mb-6 mt-2"
        >
          <div className="flex items-center gap-3">
            <OptimizedImage
              src={currentUser.avatar}
              width={100}
              className="w-11 h-11 rounded-full"
              alt="user"
            />
            <div className="text-sm">
              <div className="font-semibold">{currentUser.username}</div>
              <div className={textSecondary}>{currentUser.name}</div>
            </div>
          </div>
          <Button variant="ghost" className="text-xs font-semibold text-[#006a4e] hover:text-[#004d39] h-auto p-0">
            Switch
          </Button>
        </motion.div>

        <div className="flex justify-between items-center mb-4">
          <span className={`text-sm font-semibold ${textSecondary}`}>
            আপনার জন্য প্রস্তাবিত
          </span>
        </div>

        <motion.div
          variants={containerVariants}
          initial="hidden"
          animate="visible"
          className="flex flex-col gap-3"
        >
          {suggestedUsers.slice(0, 5).map((u, i) => (
            <motion.div
              key={i}
              variants={itemVariants}
              className="flex items-center justify-between hover:bg-white/5 p-2 rounded-lg transition-colors cursor-pointer"
              onClick={() => handleUserClick(u as User)}
            >
              <div className="flex items-center gap-3">
                <OptimizedImage
                  src={u.avatar}
                  width={100}
                  className="w-8 h-8 rounded-full"
                  alt={u.username}
                />
                <div className="flex flex-col">
                  <span className="text-xs font-semibold">{u.username}</span>
                  <span className={`text-[10px] ${textSecondary}`}>
                    {u.subtitle}
                  </span>
                </div>
              </div>
              <Button
                className="bg-[#006a4e] text-white hover:bg-[#00523c] h-8 px-4 text-sm font-semibold whitespace-nowrap"
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
              </Button>
            </motion.div>
          ))}
        </motion.div>

        <div className={`mt-8 text-xs ${textSecondary} space-y-4`}>
          <div className="flex flex-wrap gap-1">
            <span>About</span>•<span>Help</span>•<span>Press</span>•
            <span>API</span>•<span>Jobs</span>•<span>Privacy</span>•
            <span>Terms</span>
          </div>
          <div>© 2026 INSTAGRAM FROM META (BD)</div>
        </div>
      </div>
    </div>
  );
};

export default HomeView;
