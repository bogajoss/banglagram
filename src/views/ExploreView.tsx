import React, { useMemo } from "react";
import { Search, Heart, MessageCircle as CommentIcon } from "lucide-react";
import { initialData } from "../data/mockData";
import { useAppStore } from "../store/useAppStore";
import type { Post } from "../types";

import { motion } from "framer-motion";

import OptimizedImage from "../components/OptimizedImage";

const ExploreView: React.FC = () => {
  const { theme, setViewingPost } = useAppStore();

  const posts = useMemo(
    () =>
      initialData.explore.map((src, i) => ({
        id: `explore-${i}`,
        content: { src, type: "image" as const },
        likes: (i * 123 + 456) % 5000,
        comments: (i * 7 + 89) % 100,
        user: {
          username: "explore_user",
          avatar: `https://api.dicebear.com/9.x/avataaars/svg?seed=${i}`,
          name: "Explore User",
        },
        caption: "Explore content",
        time: "1d",
        commentList: [],
      })),
    [],
  );

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
      {/* Mobile Search Bar in Explore */}
      <div
        className={`md:hidden mb-4 sticky top-0 z-10 py-2 ${theme === "dark" ? "bg-black" : "bg-white"}`}
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
            className="bg-transparent border-none outline-none text-sm w-full"
          />
        </div>
      </div>

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
              src={post.content.src}
              className="w-full h-full transition-transform duration-300 group-hover:scale-110"
              alt="explore"
            />
            <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 flex items-center justify-center gap-4 text-white font-bold transition-opacity duration-200 z-20">
              <div className="flex items-center gap-1">
                <Heart fill="white" size={16} /> {post.likes}
              </div>
              <div className="flex items-center gap-1">
                <CommentIcon fill="white" size={16} className="-scale-x-100" />{" "}
                {post.comments}
              </div>
            </div>
          </motion.div>
        ))}
      </motion.div>
    </div>
  );
};

export default ExploreView;
