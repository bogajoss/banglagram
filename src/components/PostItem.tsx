import React, { useState } from "react";
import {
  Heart,
  MessageCircle as CommentIcon,
  Send,
  Bookmark,
  MoreHorizontal,
} from "lucide-react";
import MoreOptionsModal from "./modals/MoreOptionsModal";
import ShareModal from "./modals/ShareModal";
import { useAppStore } from "../store/useAppStore";
import type { Post, User } from "../types";
import { useToggleLike } from "../hooks/mutations/useToggleLike";
import { useCreateComment } from "../hooks/mutations/useCreateComment";
import { useAuth } from "../hooks/useAuth";

import { motion, AnimatePresence } from "framer-motion";

import OptimizedImage from "./OptimizedImage";
import VerifiedBadge from "./VerifiedBadge";

interface PostItemProps {
  post: Post;
  isSaved: boolean;
  onToggleSave: () => void;
  onUserClick: (user: User) => void;
  onPostClick: (post: Post) => void;
}

const PostItem: React.FC<PostItemProps> = ({
  post,
  isSaved,
  onToggleSave,
  onUserClick,
  onPostClick,
}) => {
  const { theme, showToast } = useAppStore();
  const { user } = useAuth();
  const { mutate: toggleLike } = useToggleLike();
  const { mutate: createComment, isPending: isCommenting } = useCreateComment();

  const [showHeart, setShowHeart] = useState(false);
  const [newComment, setNewComment] = useState("");
  const [isOptionsOpen, setIsOptionsOpen] = useState(false);
  const [isShareOpen, setIsShareOpen] = useState(false);

  const liked = post.hasLiked || false;
  const shareUrl = `${window.location.origin}/post/${post.id}`;

  const handleLike = () => {
    if (!user) return;
    toggleLike({
      targetId: String(post.id),
      type: "post",
      userId: user.id,
      hasLiked: liked,
    });
  };

  const handleDoubleClick = () => {
    handleLike();
    setShowHeart(true);
    setTimeout(() => setShowHeart(false), 1000);
  };

  const handleAddComment = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newComment.trim() || !user) return;

    createComment(
      {
        targetId: String(post.id),
        type: "post",
        text: newComment,
        userId: user.id,
      },
      {
        onSuccess: () => {
          showToast("কমেন্ট যোগ করা হয়েছে");
          setNewComment("");
        },
        onError: () => showToast("কমেন্ট যোগ করতে সমস্যা হয়েছে"),
      },
    );
  };

  const borderClass = theme === "dark" ? "border-zinc-800" : "border-zinc-200";
  const glassModal =
    theme === "dark"
      ? "bg-[#121212]/90 backdrop-blur-2xl border border-white/10"
      : "bg-white/90 backdrop-blur-2xl border border-black/10";

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, margin: "-50px" }}
      transition={{ duration: 0.4 }}
      className={`border-b pb-5 mb-4 ${borderClass}`}
    >
      {isOptionsOpen && (
        <MoreOptionsModal
          onClose={() => setIsOptionsOpen(false)}
          showToast={showToast}
          theme={theme}
          glassModal={glassModal}
          shareUrl={shareUrl}
        />
      )}
      {isShareOpen && (
        <ShareModal
          onClose={() => setIsShareOpen(false)}
          theme={theme}
          showToast={showToast}
          glassModal={glassModal}
          shareUrl={shareUrl}
        />
      )}

      <div className="flex items-center justify-between mb-3 px-3 md:px-0">
        <div
          className="flex items-center gap-2 cursor-pointer group"
          onClick={() => onUserClick(post.user)}
        >
          <div
            className={`w-8 h-8 rounded-full overflow-hidden ${theme === "dark" ? "bg-zinc-800" : "bg-gray-200"} group-hover:scale-105 transition-transform`}
          >
            <OptimizedImage
              src={post.user.avatar}
              className="w-full h-full"
              alt={post.user.username}
            />
          </div>
          <div className="flex items-center gap-1 text-sm font-semibold">
            <span className="group-hover:opacity-70 transition-opacity">
              {post.user.username}
            </span>
            {post.user.isVerified && <VerifiedBadge />}
            <span
              className={`${theme === "dark" ? "text-zinc-500" : "text-zinc-400"} font-normal`}
            >
              • {post.time}
            </span>
          </div>
        </div>
        <motion.div whileHover={{ scale: 1.1 }} whileTap={{ scale: 0.9 }}>
          <MoreHorizontal
            size={20}
            className="cursor-pointer hover:opacity-70"
            onClick={() => setIsOptionsOpen(true)}
          />
        </motion.div>
      </div>

      <div
        className={`w-full ${theme === "dark" ? "bg-zinc-900" : "bg-gray-100"} md:rounded-[4px] md:border ${borderClass} overflow-hidden mb-3 aspect-square md:aspect-auto relative cursor-pointer`}
        onDoubleClick={handleDoubleClick}
      >
        <OptimizedImage
          src={post.content.src || post.content.poster}
          className="w-full h-full"
          alt="Post content"
        />
        <AnimatePresence>
          {showHeart && (
            <motion.div
              initial={{ scale: 0, opacity: 0 }}
              animate={{ scale: 1.2, opacity: 1 }}
              exit={{ scale: 0, opacity: 0 }}
              className="absolute inset-0 flex items-center justify-center pointer-events-none z-10"
            >
              <Heart
                size={100}
                className="text-white fill-white drop-shadow-lg"
              />
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      <div className="flex items-center justify-between mb-2 px-3 md:px-0">
        <div className="flex items-center gap-4">
          <motion.div whileHover={{ scale: 1.1 }} whileTap={{ scale: 0.9 }}>
            <Heart
              size={24}
              className={`cursor-pointer transition-colors ${liked ? "fill-[#f42a41] text-[#f42a41]" : ""}`}
              onClick={handleLike}
            />
          </motion.div>
          <motion.div whileHover={{ scale: 1.1 }} whileTap={{ scale: 0.9 }}>
            <CommentIcon
              size={24}
              className="-scale-x-100 cursor-pointer hover:opacity-70 transition-opacity"
              onClick={() => onPostClick(post)}
            />
          </motion.div>
          <motion.div whileHover={{ scale: 1.1 }} whileTap={{ scale: 0.9 }}>
            <Send
              size={24}
              className="cursor-pointer hover:opacity-70 transition-opacity"
              onClick={() => setIsShareOpen(true)}
            />
          </motion.div>
        </div>
        <motion.div whileHover={{ scale: 1.1 }} whileTap={{ scale: 0.9 }}>
          <Bookmark
            size={24}
            className={`cursor-pointer hover:opacity-70 transition-all ${isSaved ? "fill-current" : ""}`}
            onClick={onToggleSave}
          />
        </motion.div>
      </div>

      <div className="text-sm px-3 md:px-0">
        <div className="font-semibold mb-1">{post.likes} লাইক</div>
        <div className="mb-1">
          <span
            className="font-semibold mr-2 cursor-pointer hover:opacity-70"
            onClick={() => onUserClick(post.user)}
          >
            {post.user.username}
          </span>
          <span>{post.caption}</span>
        </div>
        <div
          className={`${theme === "dark" ? "text-zinc-500" : "text-zinc-500"} cursor-pointer hover:underline`}
          onClick={() => onPostClick(post)}
        >
          সব {post.comments} কমেন্ট দেখুন
        </div>

        <form onSubmit={handleAddComment} className="flex gap-2 mt-2">
          <input
            type="text"
            placeholder="কমেন্ট যোগ করুন..."
            className={`bg-transparent text-sm w-full outline-none ${theme === "dark" ? "text-white" : "text-black"}`}
            value={newComment}
            onChange={(e) => setNewComment(e.target.value)}
            disabled={isCommenting}
          />
          <button
            type="submit"
            className="text-[#006a4e] text-sm font-semibold disabled:opacity-50 hover:text-[#004d39]"
            disabled={!newComment || isCommenting}
          >
            পোস্ট
          </button>
        </form>
      </div>
    </motion.div>
  );
};

export default PostItem;
