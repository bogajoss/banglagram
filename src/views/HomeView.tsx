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

import { Avatar, AvatarImage, AvatarFallback } from "@/components/ui/avatar";

import { Plus } from "lucide-react";
import { Button } from "@/components/ui/button";
import dayjs from "dayjs";
import relativeTime from "dayjs/plugin/relativeTime";
import "dayjs/locale/en";

dayjs.extend(relativeTime);
dayjs.locale("en");

import { Skeleton } from "@/components/ui/skeleton";

const HomeView: React.FC = () => {
  const { currentUser, setViewingStory, setViewingPost, setCreateModalOpen } =
    useAppStore();

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
      <div className="w-full max-w-[630px] pt-10 flex flex-col items-center gap-8">
        {[1, 2].map((i) => (
          <div key={i} className="w-full space-y-4">
            <div className="flex items-center gap-3 px-4 md:px-0">
              <Skeleton className="h-10 w-10 rounded-full" />
              <div className="space-y-2">
                <Skeleton className="h-4 w-[150px]" />
                <Skeleton className="h-3 w-[100px]" />
              </div>
            </div>
            <Skeleton className="aspect-square w-full rounded-none md:rounded-md" />
          </div>
        ))}
      </div>
    );
  }

  if (feedError) {
    return (
      <div className="p-4 text-center text-muted-foreground">
        Error loading feed. Please try again.
      </div>
    );
  }

  return (
    <div className="w-full max-w-[630px] lg:max-w-5xl mx-auto pt-0 md:pt-[30px] flex flex-col lg:flex-row lg:items-start lg:justify-center lg:gap-8">
      <div className="md:hidden sticky top-0 z-10 border-b border-border px-4 h-[60px] flex items-center justify-between bg-background">
        <h1 className="text-2xl font-bold tracking-tight text-[#006a4e]">
          Banglagram
        </h1>
        <div className="flex items-center gap-5">
          <motion.div whileTap={{ scale: 0.9 }}>
            <Heart size={24} className="cursor-pointer" />
          </motion.div>
          <motion.div
            className="relative cursor-pointer"
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

      <div className="flex-grow w-full max-w-[470px] mx-auto lg:mx-0 px-0 md:px-0">
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
              className={`w-[66px] h-[66px] rounded-full p-[2px] ${userStories.length > 0 ? "bg-gradient-to-tr from-[#006a4e] to-[#004d39]" : "border border-muted-foreground/50"} group-hover:scale-105 transition-transform duration-200 relative`}
            >
              <div className="w-full h-full rounded-full p-[2px] bg-background">
                <Avatar className="w-full h-full">
                  <AvatarImage src={currentUser.avatar} />
                  <AvatarFallback>
                    {currentUser.username?.[0]?.toUpperCase() || "?"}
                  </AvatarFallback>
                </Avatar>
              </div>
              {userStories.length === 0 && (
                <div className="absolute bottom-0 right-0 bg-[#0095f6] border-2 border-background rounded-full p-0.5 text-white">
                  <Plus size={14} strokeWidth={4} />
                </div>
              )}
            </div>
            <span className="text-xs truncate w-full text-center text-muted-foreground">
              Your Story
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
                <div className="w-full h-full rounded-full p-[2px] bg-background">
                  <Avatar className="w-full h-full">
                    <AvatarImage src={story.userAvatar || story.img} />
                    <AvatarFallback>
                      {story.username?.[0]?.toUpperCase() || "?"}
                    </AvatarFallback>
                  </Avatar>
                </div>{" "}
              </div>
              <span className="text-xs truncate w-full text-center text-foreground">
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
          <div ref={ref} className="h-10 text-center text-muted-foreground">
            {isFetchingNextPage
              ? "Loading more..."
              : hasNextPage
                ? "Load more"
                : "No more posts"}
          </div>
        </div>
      </div>

      <div className="hidden lg:block w-[319px] px-4">
        <motion.div
          initial={{ opacity: 0, x: 20 }}
          animate={{ opacity: 1, x: 0 }}
          className="flex items-center justify-between mb-6 mt-2"
        >
          <div className="flex items-center gap-3">
            <Avatar className="w-11 h-11">
              <AvatarImage src={currentUser.avatar} />
              <AvatarFallback>
                {currentUser.username?.[0]?.toUpperCase() || "?"}
              </AvatarFallback>
            </Avatar>
            <div className="text-sm">
              <div className="font-semibold text-foreground">
                {currentUser.username}
              </div>
              <div className="text-muted-foreground">{currentUser.name}</div>
            </div>
          </div>
          <Button
            variant="ghost"
            className="text-xs font-semibold text-[#006a4e] hover:text-[#004d39] h-auto p-0"
          >
            Switch
          </Button>
        </motion.div>

        <div className="flex justify-between items-center mb-4">
          <span className="text-sm font-semibold text-muted-foreground">
            Suggested for you
          </span>
        </div>

        <motion.div
          variants={containerVariants}
          initial="hidden"
          animate="visible"
          className="flex flex-col gap-2"
        >
          {suggestedUsers.slice(0, 5).map((u, i) => (
            <motion.div
              key={i}
              variants={itemVariants}
              className="flex items-center justify-between hover:bg-muted p-1.5 rounded-lg transition-colors cursor-pointer"
              onClick={() => handleUserClick(u as User)}
            >
              <div className="flex items-center gap-3">
                <Avatar className="w-8 h-8">
                  <AvatarImage src={u.avatar} />
                  <AvatarFallback>
                    {u.username?.[0]?.toUpperCase() || "?"}
                  </AvatarFallback>
                </Avatar>
                <div className="flex flex-col">
                  <span className="text-xs font-semibold text-foreground">
                    {u.username}
                  </span>
                  <span className="text-[10px] text-muted-foreground">
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
                Follow
              </Button>
            </motion.div>
          ))}
        </motion.div>

        <div className="mt-4 text-xs text-muted-foreground space-y-4 px-0">
          <div className="flex flex-wrap gap-1">
            <span>About</span>•<span>Help</span>•<span>Press</span>•
            <span>API</span>•<span>Jobs</span>•<span>Privacy</span>•
            <span>Terms</span>
          </div>
          <div>© 2026 BANGLAGRAM FROM BOGAJOSS</div>
        </div>
      </div>
    </div>
  );
};

export default HomeView;
