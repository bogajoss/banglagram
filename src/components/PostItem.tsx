import React, { useState, memo } from "react";
import {
  Heart,
  MessageCircle as CommentIcon,
  Send,
  Bookmark,
  MoreHorizontal,
  Smile,
  Mic,
  BarChart2,
} from "lucide-react";
import VoiceRecorder from "./VoiceRecorder";
import OptimizedImage from "./OptimizedImage";

import EmojiPicker, { Theme as EmojiTheme } from "emoji-picker-react";
import MoreOptionsModal from "./modals/MoreOptionsModal";
import ShareModal from "./modals/ShareModal";
import EditPostModal from "./modals/EditPostModal";
import { useAppStore } from "../store/useAppStore";
import type { Post, User } from "../types";
import { useToggleLike } from "../hooks/mutations/useToggleLike";
import { useCreateComment } from "../hooks/mutations/useCreateComment";
import { useAuth } from "../hooks/useAuth";
import { useViewTracker } from "../hooks/useViewTracker";

import { motion, AnimatePresence } from "framer-motion";

import { Avatar, AvatarImage, AvatarFallback } from "@/components/ui/avatar";
import VerifiedBadge from "./VerifiedBadge";
import dayjs from "dayjs";
import relativeTime from "dayjs/plugin/relativeTime";
import "dayjs/locale/en";

dayjs.extend(relativeTime);
dayjs.locale("en");


interface PostItemProps {
  post: Post;
  isSaved: boolean;
  onToggleSave: () => void;
  onUserClick: (user: User) => void;
  onPostClick: (post: Post) => void;
}

const PostItem: React.FC<PostItemProps> = memo(
  ({ post, isSaved, onToggleSave, onUserClick, onPostClick }) => {
    const { theme, showToast } = useAppStore();
    const { user } = useAuth();
    const { mutate: toggleLike } = useToggleLike();
    const { mutate: createComment, isPending: isCommenting } =
      useCreateComment();

    // View Tracking
    const { ref: viewRef } = useViewTracker(post.id, 'post');

    const [showHeart, setShowHeart] = useState(false);

    const [newComment, setNewComment] = useState("");
    const [isOptionsOpen, setIsOptionsOpen] = useState(false);
    const [isShareOpen, setIsShareOpen] = useState(false);
    const [isEditOpen, setIsEditOpen] = useState(false);
    const [showEmojiPicker, setShowEmojiPicker] = useState(false);
    const [showRecorder, setShowRecorder] = useState(false);

    const emojiPickerRef = React.useRef<HTMLDivElement>(null);

    const liked = post.hasLiked || false;

    React.useEffect(() => {
      const handleClickOutside = (event: MouseEvent) => {
        if (
          emojiPickerRef.current &&
          !emojiPickerRef.current.contains(event.target as Node)
        ) {
          setShowEmojiPicker(false);
        }
      };
      document.addEventListener("mousedown", handleClickOutside);
      return () => document.removeEventListener("mousedown", handleClickOutside);
    }, []);

    const handleEmojiClick = (emojiData: { emoji: string }) => {
      setNewComment((prev) => prev + emojiData.emoji);
    };

    const shareUrl = `${window.location.origin}/post/${post.id}`;
    const isOwner = user?.id === post.user.id;

    const handleLike = () => {
      if (!user) {
        showToast("Log in to like");
        return;
      }
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

    const handleAddComment = (e?: React.FormEvent, audioBlob?: Blob) => {
      if (e) e.preventDefault();
      if (!user) return;
      if (!newComment.trim() && !audioBlob) return;

      createComment(
        {
          targetId: String(post.id),
          type: "post",
          text: audioBlob ? "Voice Message" : newComment,
          userId: user.id,
          audioBlob,
        },
        {
          onSuccess: () => {
            showToast("Comment added");
            setNewComment("");
            setShowRecorder(false);
          },
          onError: () => showToast("Failed to add comment"),
        },
      );
    };


    const borderClass =
      theme === "dark" ? "border-zinc-800" : "border-zinc-200";
    const glassModal =
      theme === "dark"
        ? "bg-[#121212]/90 backdrop-blur-2xl border border-white/10"
        : "bg-white/90 backdrop-blur-2xl border border-black/10";

    return (
      <motion.div
        ref={viewRef}
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
            isOwner={isOwner}
            onEdit={() => setIsEditOpen(true)}
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
        {isEditOpen && (
          <EditPostModal
            post={post}
            onClose={() => setIsEditOpen(false)}
            theme={theme}
            glassModal={glassModal}
          />
        )}

        <div className="flex items-center justify-between mb-3 px-3 md:px-0">
          <div
            className="flex items-center gap-2 cursor-pointer group"
            onClick={() => onUserClick(post.user)}
          >
            <Avatar className="w-8 h-8 group-hover:scale-105 transition-transform">
              <AvatarImage src={post.user.avatar} />
              <AvatarFallback>{post.user.username[0].toUpperCase()}</AvatarFallback>
            </Avatar>
            <div className="flex items-center gap-1 text-sm font-semibold">
              <span className="group-hover:opacity-70 transition-opacity">
                {post.user.username}
              </span>
              {post.user.isVerified && <VerifiedBadge />}
              <span
                className={`${theme === "dark" ? "text-zinc-500" : "text-zinc-400"} font-normal`}
              >
                • {post.createdAt ? dayjs(post.createdAt).fromNow(true) : post.time}
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
            className="w-full h-full object-cover"
            alt="Post content"
            loading="lazy"
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
            
            <div className="flex items-center gap-1 ml-2 opacity-60" title="Views">
               <BarChart2 size={22} className="" />
               <span className="text-sm font-medium">
                {Intl.NumberFormat('en-US', { notation: "compact", maximumFractionDigits: 1 }).format(post.views || 0)}
               </span>
            </div>
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
          <div className="font-semibold mb-1">{post.likes} likes</div>
          <div className="mb-1">
            <span
              className="font-semibold mr-2 cursor-pointer hover:opacity-70"
              onClick={() => onUserClick(post.user)}
            >
              {post.user.username}
            </span>
            <span className="whitespace-pre-wrap">{post.caption}</span>
          </div>
          <div
            className={`${theme === "dark" ? "text-zinc-500" : "text-zinc-500"} cursor-pointer hover:underline`}
            onClick={() => onPostClick(post)}
          >
            View all {post.comments} comments
          </div>
          <div className="text-[10px] text-zinc-500 uppercase mt-1">
            {post.createdAt ? dayjs(post.createdAt).fromNow() : post.time}
          </div>

          {/* Quick Emojis */}
          <div className="flex gap-4 mt-2 mb-1 overflow-x-auto scrollbar-hide py-1">
            {["❤️", "🙌", "🔥", "👏", "😢", "😍", "😮", "😂"].map((emoji) => (
              <span
                key={emoji}
                className="text-xl cursor-pointer hover:scale-125 transition-transform"
                onClick={() => setNewComment((prev) => prev + emoji)}
              >
                {emoji}
              </span>
            ))}
          </div>

          {showRecorder ? (
            <div className="mt-2 bg-zinc-900/50 p-2 rounded-xl">
              <VoiceRecorder
                onRecordingComplete={(blob) => handleAddComment(undefined, blob)}
                onCancel={() => setShowRecorder(false)}
              />
            </div>
          ) : (
            <form onSubmit={handleAddComment} className="flex gap-2 mt-2 items-center relative">
              {/* Emoji Picker */}
              {showEmojiPicker && (
                <div
                  ref={emojiPickerRef}
                  className="absolute bottom-full left-0 z-50 shadow-2xl mb-2"
                >
                  <EmojiPicker
                    theme={theme === "dark" ? EmojiTheme.DARK : EmojiTheme.LIGHT}
                    onEmojiClick={handleEmojiClick}
                    lazyLoadEmojis={true}
                    skinTonesDisabled={true}
                    searchDisabled={false}
                    width={280}
                    height={350}
                  />
                </div>
              )}

              <Smile
                size={20}
                className={`cursor-pointer transition-colors ${showEmojiPicker ? "text-[#006a4e]" : "text-zinc-500 hover:text-zinc-300"}`}
                onClick={() => setShowEmojiPicker(!showEmojiPicker)}
              />
              <input
                type="text"
                placeholder="Add a comment..."
                className={`bg-transparent text-sm w-full outline-none ${theme === "dark" ? "text-white" : "text-black"}`}
                value={newComment}
                onChange={(e) => setNewComment(e.target.value)}
                onFocus={() => setShowEmojiPicker(false)}
                disabled={isCommenting}
              />

              {!newComment && (
                <Mic
                  size={20}
                  className="text-zinc-500 cursor-pointer hover:text-zinc-300"
                  onClick={() => setShowRecorder(true)}
                />
              )}

              <button
                type="submit"
                className="text-[#006a4e] text-sm font-semibold disabled:opacity-50 hover:text-[#004d39]"
                disabled={!newComment || isCommenting}
              >
                Post
              </button>
            </form>
          )}

        </div>
      </motion.div>
    );
  },
);

export default PostItem;
