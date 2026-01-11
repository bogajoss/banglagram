/* eslint-disable @typescript-eslint/no-explicit-any */
import React, { useState } from "react";
import {
  X,
  Heart,
  MessageCircle as CommentIcon,
  Send,
  Bookmark,
  Smile,
  MoreHorizontal,
} from "lucide-react";
import { useAppStore } from "../../store/useAppStore";
import { useNavigate } from "react-router-dom";
import type { User } from "../../types";
import { motion } from "framer-motion";
import { useToggleLike } from "../../hooks/mutations/useToggleLike";
import { useCreateComment } from "../../hooks/mutations/useCreateComment";
import { useGetComments } from "../../hooks/queries/useGetComments";
import { useAuth } from "../../hooks/useAuth";

import OptimizedImage from "../OptimizedImage";
import VerifiedBadge from "../VerifiedBadge";

const PostDetailsModal: React.FC = () => {
  const {
    viewingPost,
    viewingReel,
    theme,
    showToast,
    savedPostIds,
    toggleSave,
    setViewingPost,
    setViewingReel,
  } = useAppStore();
  const navigate = useNavigate();

  const { user } = useAuth();

  const { mutate: toggleLike } = useToggleLike();
  const { mutate: createComment, isPending: isCommenting } = useCreateComment();

  const [newComment, setNewComment] = useState("");

  const activeItem = viewingPost || viewingReel;
  const isReel = !!viewingReel;
  const type = isReel ? "reel" : "post";
  const itemId = activeItem ? String(activeItem.id) : "";

  const { data: comments, isLoading: loadingComments } = useGetComments(
    itemId,
    type,
  );

  if (!activeItem) return null;

  const isSaved = savedPostIds.has(activeItem.id);
  const liked = activeItem.hasLiked || false;

  const handleLike = () => {
    if (!user) {
      showToast("লাইক করতে লগ ইন করুন");
      return;
    }
    toggleLike({
      targetId: String(activeItem.id),
      type,
      userId: user.id,
      hasLiked: liked,
    });
  };

  const handleAddComment = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newComment.trim()) return;
    if (!user) {
      showToast("কমেন্ট করতে লগ ইন করুন");
      return;
    }

    createComment(
      {
        targetId: String(activeItem.id),
        type,
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

  const onClose = () => {
    if (viewingPost) setViewingPost(null);
    if (viewingReel) setViewingReel(null);
  };

  const onUserClick = (user: User) => {
    onClose();
    navigate(`/profile/${user.username}`);
  };

  const glassModal =
    theme === "dark"
      ? "bg-[#121212]/90 backdrop-blur-2xl border border-white/10"
      : "bg-white/90 backdrop-blur-2xl border border-black/10";

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="fixed inset-0 z-[100] bg-black/80 backdrop-blur-md flex items-end md:items-center justify-center p-0 md:p-8"
      onClick={onClose}
    >
      <motion.div
        initial={{ y: "100%" }}
        animate={{ y: 0 }}
        exit={{ y: "100%" }}
        transition={{ type: "spring", damping: 25, stiffness: 300 }}
        className={`w-full max-w-5xl h-[80vh] md:h-auto md:max-h-[90vh] rounded-t-xl md:rounded-lg overflow-hidden flex flex-col md:flex-row shadow-2xl ${glassModal} ${theme === "dark" ? "text-white" : "text-black"}`}
        onClick={(event) => event.stopPropagation()}
      >
        {/* Media Section */}
        <div className="hidden md:flex flex-1 bg-black items-center justify-center min-h-[300px] md:h-auto border-r border-zinc-800 relative">
          {isReel ? (
            <video
              src={(activeItem as any).src}
              className="max-h-full max-w-full"
              controls
              autoPlay
              loop
            />
          ) : (
            <OptimizedImage
              src={
                (activeItem as any).content?.src ||
                (activeItem as any).content?.poster
              }
              className="max-h-full max-w-full"
              imgClassName="object-contain"
              alt="post detail"
            />
          )}
        </div>

        {/* Details Section */}
        <div className="w-full md:w-[400px] flex flex-col h-full">
          <div
            className={`p-4 border-b ${theme === "dark" ? "border-zinc-800" : "border-zinc-200"} flex items-center justify-between shrink-0`}
          >
            {/* Mobile Header: Comments Title */}
            <div className="md:hidden w-full text-center font-bold text-sm">
              কমেন্ট
            </div>

            {/* Desktop Header: User Profile */}
            <div
              className="hidden md:flex items-center gap-3"
              onClick={() => onUserClick(activeItem.user)}
            >
              <div className="w-8 h-8 rounded-full border border-zinc-700 overflow-hidden cursor-pointer">
                <OptimizedImage
                  src={activeItem.user.avatar}
                  className="w-full h-full"
                  alt={activeItem.user.username}
                />
              </div>
              <div className="flex items-center">
                <span className="font-semibold text-sm hover:opacity-70 cursor-pointer">
                  {activeItem.user.username}
                </span>
                {activeItem.user.isVerified && <VerifiedBadge />}
              </div>
            </div>

            {/* Desktop Options Icon */}
            <MoreHorizontal
              size={20}
              className="hidden md:block cursor-pointer hover:opacity-70"
            />

            {/* Mobile Close Button */}
            <div
              className="absolute right-4 top-4 md:hidden cursor-pointer"
              onClick={onClose}
            >
              <X size={20} />
            </div>
          </div>

          <div className="flex-grow overflow-y-auto p-4 space-y-4">
            <div className="flex gap-3">
              <div
                className="w-8 h-8 rounded-full flex-shrink-0 overflow-hidden cursor-pointer"
                onClick={() => onUserClick(activeItem.user)}
              >
                <OptimizedImage
                  src={activeItem.user.avatar}
                  className="w-full h-full"
                  alt="user"
                />
              </div>
              <div className="text-sm">
                <div className="flex items-center">
                  <span
                    className="font-semibold mr-2 cursor-pointer"
                    onClick={() => onUserClick(activeItem.user)}
                  >
                    {activeItem.user.username}
                  </span>
                  {activeItem.user.isVerified && <VerifiedBadge />}
                </div>
                <span>{activeItem.caption}</span>
                <div className="text-xs text-zinc-500 mt-1">
                  {(activeItem as any).time}
                </div>
              </div>
            </div>

            {loadingComments ? (
              <div className="text-center py-4 text-zinc-500 text-sm">
                लोड হচ্ছে...
              </div>
            ) : comments && comments.length > 0 ? (
              comments.map((c: any) => {
                // Simple time ago helper
                const timeAgo = (dateStr: string) => {
                  try {
                    const diff =
                      (new Date().getTime() - new Date(dateStr).getTime()) /
                      1000;
                    if (diff < 60) return "এখনই";
                    if (diff < 3600) return `${Math.floor(diff / 60)}মি`;
                    if (diff < 86400) return `${Math.floor(diff / 3600)}ঘ`;
                    return `${Math.floor(diff / 86400)}দিন`;
                  } catch {
                    return "";
                  }
                };

                return (
                  <div
                    key={c.id}
                    className="flex gap-3 justify-between items-start group"
                  >
                    <div className="flex gap-3">
                      <div
                        className="w-8 h-8 rounded-full overflow-hidden flex-shrink-0 cursor-pointer"
                        onClick={() =>
                          onUserClick({
                            username: c.user.username,
                            name: c.user.username,
                            avatar: c.user.avatar_url,
                          } as User)
                        }
                      >
                        <OptimizedImage
                          src={c.user.avatar_url}
                          className="w-full h-full"
                          alt={c.user.username}
                        />
                      </div>
                      <div className="flex flex-col">
                        <div className="text-sm leading-tight">
                          <div className="flex items-center">
                            <span
                              className="font-semibold mr-2 cursor-pointer hover:opacity-70"
                              onClick={() =>
                                onUserClick({
                                  username: c.user.username,
                                  name: c.user.username,
                                  avatar: c.user.avatar_url,
                                } as User)
                              }
                            >
                              {c.user.username}
                            </span>
                            {c.user.isVerified && <VerifiedBadge />}
                          </div>
                          <span>{c.text}</span>
                        </div>
                        <div className="flex items-center gap-4 text-xs text-zinc-500 font-semibold mt-1.5">
                          <span>{timeAgo(c.created_at)}</span>
                          <span className="cursor-pointer hover:text-zinc-400">
                            0 লাইক
                          </span>
                          <span className="cursor-pointer hover:text-zinc-400">
                            রিপ্লাই
                          </span>
                        </div>
                      </div>
                    </div>
                    <Heart
                      size={12}
                      className="cursor-pointer text-zinc-500 hover:opacity-50 mt-2"
                    />
                  </div>
                );
              })
            ) : (
              <div className="text-center py-10 text-zinc-500 text-sm">
                কোনো কমেন্ট নেই
              </div>
            )}
          </div>

          <div
            className={`p-4 border-t ${theme === "dark" ? "border-zinc-800" : "border-zinc-200"}`}
          >
            <div className="flex items-center justify-between mb-3">
              <div className="flex items-center gap-4">
                <Heart
                  size={24}
                  className={`cursor-pointer hover:opacity-70 transition-transform active:scale-90 ${liked ? "fill-[#f42a41] text-[#f42a41]" : ""}`}
                  onClick={handleLike}
                />
                <CommentIcon
                  size={24}
                  className="-scale-x-100 cursor-pointer hover:opacity-70"
                />
                <Send
                  size={24}
                  className="cursor-pointer hover:opacity-70"
                  onClick={() => showToast("শেয়ার করা হয়েছে")}
                />
              </div>
              <Bookmark
                size={24}
                className={`cursor-pointer hover:opacity-70 ${isSaved ? "fill-current" : ""}`}
                onClick={() => toggleSave(String(activeItem.id))}
              />
            </div>
            <div className="font-semibold text-sm mb-2">
              {activeItem.likes + " লাইক"}
            </div>
            <div className="text-xs text-zinc-500 uppercase mb-3">
              {(activeItem as any).time && (activeItem as any).time + " আগে"}
            </div>

            {/* Quick Emojis */}
            <div className="flex justify-between px-2 mb-3 mt-1 overflow-x-auto gap-4 scrollbar-hide">
              {["❤️", "🙌", "🔥", "👏", "😢", "😍", "😮", "😂"].map((emoji) => (
                <span
                  key={emoji}
                  className="text-2xl cursor-pointer hover:scale-125 transition-transform"
                  onClick={() => setNewComment((prev) => prev + emoji)}
                >
                  {emoji}
                </span>
              ))}
            </div>

            <form
              onSubmit={handleAddComment}
              className="flex items-center gap-2 border-t pt-3 border-zinc-800"
            >
              <Smile
                size={24}
                className="text-zinc-400 cursor-pointer hover:text-zinc-200"
              />
              <input
                type="text"
                placeholder="কমেন্ট যোগ করুন..."
                className="bg-transparent text-sm w-full outline-none"
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
        </div>
      </motion.div>
    </motion.div>
  );
};

export default PostDetailsModal;
