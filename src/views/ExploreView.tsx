import React, { useState, useEffect } from "react";
import { Search, Heart, MessageCircle as CommentIcon, X } from "lucide-react";
import { useAppStore } from "../store/useAppStore";
import type { Post, User } from "../types";
import { supabase } from "../lib/supabaseClient";
import { useNavigate } from "react-router-dom";
import { useGetExplorePosts } from "../hooks/queries/useGetExplorePosts";

import { motion } from "framer-motion";

import OptimizedImage from "../components/OptimizedImage";

const ExploreView: React.FC = () => {
  const { theme, setViewingPost } = useAppStore();
  const navigate = useNavigate();
  const [searchQuery, setSearchQuery] = useState("");
  const [searchResults, setSearchResults] = useState<User[]>([]);
  const [isSearching, setIsSearching] = useState(false);

  const { data: posts = [], isLoading } = useGetExplorePosts();

  useEffect(() => {
    const delayDebounceFn = setTimeout(async () => {
      if (searchQuery.trim().length > 0) {
        setIsSearching(true);
        const { data } = await supabase
          .from("profiles")
          .select("username, full_name, avatar_url")
          .ilike("username", `%${searchQuery}%`)
          .limit(10);

        if (data) {
          const users: User[] = (
            data as {
              username: string;
              full_name: string;
              avatar_url: string;
            }[]
          ).map((p) => ({
            username: p.username,
            name: p.full_name || p.username,
            avatar: p.avatar_url || "",
          }));
          setSearchResults(users);
        }
        setIsSearching(false);
      } else {
        setSearchResults([]);
      }
    }, 300);

    return () => clearTimeout(delayDebounceFn);
  }, [searchQuery]);

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
            placeholder="অনুসন্ধান"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className={`bg-transparent border-none outline-none text-sm w-full ${theme === "dark" ? "text-white" : "text-black"}`}
          />
          {searchQuery && (
            <X
              size={18}
              className="cursor-pointer"
              onClick={() => setSearchQuery("")}
            />
          )}
        </div>
      </div>

      {searchQuery ? (
        <div className="flex flex-col gap-2">
          {isSearching && <div className="p-4 text-center">Searching...</div>}
          {!isSearching && searchResults.length === 0 && (
            <div className="p-4 text-center text-gray-500">
              কোনো ফলাফল পাওয়া যায়নি
            </div>
          )}
          {searchResults.map((user) => (
            <div
              key={user.username}
              onClick={() => navigate(`/profile/${user.username}`)}
              className={`flex items-center gap-3 p-2 rounded-lg cursor-pointer ${theme === "dark" ? "hover:bg-white/10" : "hover:bg-gray-100"}`}
            >
              <OptimizedImage
                src={user.avatar}
                className="w-10 h-10 rounded-full"
                alt={user.username}
              />
              <div className="flex flex-col">
                <span className="font-semibold text-sm">{user.username}</span>
                <span className="text-xs text-gray-500">{user.name}</span>
              </div>
            </div>
          ))}
        </div>
      ) : (
        <>
          {isLoading ? (
            <div className="p-10 text-center">Loading explore...</div>
          ) : (
            <motion.div
              variants={containerVariants}
              initial="hidden"
              animate="visible"
              className="grid grid-cols-3 gap-1 md:gap-4 pb-14"
            >
              {posts.map((post) => (
                <motion.div
                  key={post.id}
                  variants={itemVariants}
                  whileHover={{ scale: 0.98 }}
                  className="relative aspect-square group cursor-pointer overflow-hidden"
                  onClick={() => setViewingPost(post as Post)}
                >
                  <OptimizedImage
                    src={post.content.src || post.content.poster}
                    className="w-full h-full transition-transform duration-300 group-hover:scale-110"
                    alt="explore"
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
            </motion.div>
          )}
        </>
      )}
    </div>
  );
};

export default ExploreView;
