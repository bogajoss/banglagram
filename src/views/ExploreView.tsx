import React, { useState, useEffect } from "react";
import { Search, Heart, MessageCircle as CommentIcon, X } from "lucide-react";
import { useAppStore } from "../store/useAppStore";
import type { Post, User } from "../types";
import { supabase } from "../lib/supabaseClient";
import { useNavigate } from "react-router-dom";
import { useGetExplorePosts } from "../hooks/queries/useGetExplorePosts";
import { useSearchPosts } from "../hooks/queries/useSearchPosts";
import { motion } from "framer-motion";
import { useInView } from "react-intersection-observer";

import VerifiedBadge from "../components/VerifiedBadge";

import { Avatar, AvatarImage, AvatarFallback } from "@/components/ui/avatar";

const ExploreView: React.FC = () => {
  const { theme, setViewingPost } = useAppStore();
  const navigate = useNavigate();
  const [searchQuery, setSearchQuery] = useState("");
  const [searchType, setSearchType] = useState<"accounts" | "posts">("accounts");
  const [userResults, setUserResults] = useState<User[]>([]);
  const [isSearching, setIsSearching] = useState(false);
  const { ref, inView } = useInView({
    rootMargin: "1200px",
  });

  const {
    data: exploreData,
    isLoading: isExploreLoading,
    fetchNextPage,
    hasNextPage,
    isFetchingNextPage,
  } = useGetExplorePosts();

  const { data: postResults = [], isLoading: isPostsLoading } = useSearchPosts(
    searchType === "posts" ? searchQuery : ""
  );

  useEffect(() => {
    if (inView && hasNextPage && !searchQuery) {
      fetchNextPage();
    }
  }, [inView, hasNextPage, fetchNextPage, searchQuery]);

  useEffect(() => {
    const delayDebounceFn = setTimeout(async () => {
      if (searchQuery.trim().length > 0) {
        if (searchType === "accounts") {
          setIsSearching(true);
          const { data } = await supabase
            .from("profiles")
            .select("id, username, full_name, avatar_url, is_verified")
            .ilike("username", `%${searchQuery}%`)
            .limit(10);

          if (data) {
            const users: User[] = (
              data as {
                id: string;
                username: string;
                full_name: string;
                avatar_url: string;
                is_verified: boolean;
              }[]
            ).map((p) => ({
              id: p.id,
              username: p.username,
              name: p.full_name || p.username,
              avatar: p.avatar_url || "",
              isVerified: p.is_verified || false,
            }));
            setUserResults(users);
          }
          setIsSearching(false);
        }
      } else {
        setUserResults([]);
      }
    }, 300);

    return () => clearTimeout(delayDebounceFn);
  }, [searchQuery, searchType]);

  const containerVariants = {
    hidden: { opacity: 0 },
    visible: {
      opacity: 1,
      transition: {
        staggerChildren: 0.05,
      },
    },
  };

  const itemVariants = {
    hidden: { opacity: 0, scale: 0.9 },
    visible: { opacity: 1, scale: 1 },
  };

  return (
    <div className="w-full max-w-[935px] py-4 px-2">
      {/* Search Bar */}
      <div
        className={`mb-4 sticky top-0 z-30 py-2 ${theme === "dark" ? "bg-black" : "bg-white"}`}
      >
        <div
          className={`flex items-center gap-2 px-3 py-2 rounded-lg ${theme === "dark" ? "bg-[#262626]" : "bg-gray-100"}`}
        >
          <Search
            size={18}
            className={theme === "dark" ? "text-[#8e8e8e]" : "text-gray-500"}
          />
          <input
            type="text"
            placeholder="Search"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className={`bg-transparent border-none outline-none text-sm w-full p-0 h-auto ${theme === "dark" ? "text-white" : "text-black"}`}
          />
          {searchQuery && (
            <X
              size={18}
              className="cursor-pointer"
              onClick={() => setSearchQuery("")}
            />
          )}
        </div>

        {/* Search Type Tabs */}
        {searchQuery && (
          <div className="flex mt-2 border-b border-zinc-700">
            <button
              className={`flex-1 py-2 text-sm font-semibold ${searchType === "accounts" ? (theme === "dark" ? "text-white border-b-2 border-white" : "text-black border-b-2 border-black") : "text-zinc-500"}`}
              onClick={() => setSearchType("accounts")}
            >
              Accounts
            </button>
            <button
              className={`flex-1 py-2 text-sm font-semibold ${searchType === "posts" ? (theme === "dark" ? "text-white border-b-2 border-white" : "text-black border-b-2 border-black") : "text-zinc-500"}`}
              onClick={() => setSearchType("posts")}
            >
              Posts
            </button>
          </div>
        )}
      </div>

      {searchQuery ? (
        <div className="flex flex-col gap-2">
          {/* Accounts Results */}
          {searchType === "accounts" && (
            <>
              {isSearching && <div className="p-4 text-center">Searching...</div>}
              {!isSearching && userResults.length === 0 && (
                <div className="p-4 text-center text-gray-500">
                  No accounts found
                </div>
              )}
              {userResults.map((user) => (
                <div
                  key={user.username}
                  onClick={() => navigate(`/profile/${user.username}`)}
                  className={`flex items-center gap-3 p-2 rounded-lg cursor-pointer ${theme === "dark" ? "hover:bg-white/10" : "hover:bg-gray-100"}`}
                >
                  <Avatar className="w-10 h-10">
                    <AvatarImage src={user.avatar} />
                    <AvatarFallback>{user.username?.[0]?.toUpperCase() || "?"}</AvatarFallback>
                  </Avatar>
                  <div className="flex flex-col">
                    <div className="flex items-center gap-1">
                      <span className="font-semibold text-sm">{user.username}</span>
                      {user.isVerified && <VerifiedBadge />}
                    </div>
                    <span className="text-xs text-gray-500">{user.name}</span>
                  </div>
                </div>
              ))}
            </>
          )}

          {/* Posts Results */}
          {searchType === "posts" && (
            <>
              {isPostsLoading && <div className="p-4 text-center">Searching posts...</div>}
              {!isPostsLoading && postResults.length === 0 && (
                <div className="p-4 text-center text-gray-500">
                  No posts found
                </div>
              )}
              <div className="grid grid-cols-3 gap-1 md:gap-4">
                {postResults.map((post) => (
                  <motion.div
                    key={post.id}
                    variants={itemVariants}
                    whileHover={{ scale: 0.98 }}
                    className="relative aspect-square group cursor-pointer overflow-hidden"
                    onClick={() => setViewingPost(post as Post)}
                  >
                    <img
                      src={post.content.src || post.content.poster}
                      className="w-full h-full transition-transform duration-300 group-hover:scale-110 object-cover"
                      alt="search result"
                      loading="lazy"
                    />
                    <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 flex items-center justify-center gap-4 text-white font-bold transition-opacity duration-200 z-20">
                      <div className="flex items-center gap-1">
                        <Heart fill="white" size={16} /> {post.likes}
                      </div>
                      <div className="flex items-center gap-1">
                        <CommentIcon
                          fill="white"
                          size={16}
                          className="-scale-x-100"
                        />{" "}
                        {post.comments}
                      </div>
                    </div>
                  </motion.div>
                ))}
              </div>
            </>
          )}
        </div>
      ) : (
        <>
          {isExploreLoading ? (
            <div className="p-10 text-center">Loading explore...</div>
          ) : (
            <motion.div
              variants={containerVariants}
              initial="hidden"
              animate="visible"
              className="grid grid-cols-3 gap-1 md:gap-4"
            >
              {exploreData?.pages.map((page, i) => (
                <React.Fragment key={i}>
                  {page.map((post) => (
                    <motion.div
                      key={post.id}
                      variants={itemVariants}
                      whileHover={{ scale: 0.98 }}
                      className="relative aspect-square group cursor-pointer overflow-hidden"
                      onClick={() => setViewingPost(post as Post)}
                    >
                      <img
                        src={post.content.src || post.content.poster}
                        className="w-full h-full transition-transform duration-300 group-hover:scale-110 object-cover"
                        alt="explore"
                        loading="lazy"
                      />
                      <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 flex items-center justify-center gap-4 text-white font-bold transition-opacity duration-200 z-20">
                        <div className="flex items-center gap-1">
                          <Heart fill="white" size={16} /> {post.likes}
                        </div>
                        <div className="flex items-center gap-1">
                          <CommentIcon
                            fill="white"
                            size={16}
                            className="-scale-x-100"
                          />{" "}
                          {post.comments}
                        </div>
                      </div>
                    </motion.div>
                  ))}
                </React.Fragment>
              ))}
            </motion.div>
          )}
          <div ref={ref} className="h-10 text-center py-4 text-gray-500">
            {isFetchingNextPage
              ? "Loading more..."
              : hasNextPage
                ? "See below"
                : ""}
          </div>
        </>
      )}
    </div>
  );
};

export default ExploreView;
