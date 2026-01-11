import React, { useState } from "react";
import {
  X,
  Heart,
  MessageCircle as CommentIcon,
  Send,
  MoreHorizontal,
  Smile,
} from "lucide-react";
import { useAppStore } from "../../store/useAppStore";
import { useNavigate } from "react-router-dom";
import type { User } from "../../types";
import { motion } from "framer-motion";
import { useToggleLike } from "../../hooks/mutations/useToggleLike";
import { useCreateComment } from "../../hooks/mutations/useCreateComment";
import { useAuth } from "../../hooks/useAuth";

import { useGetComments } from "../../hooks/queries/useGetComments";
import OptimizedImage from "../OptimizedImage";

const ReelDetailsModal: React.FC = () => {
  const {
    viewingReel,
    theme,
    showToast,
    setViewingReel,
  } = useAppStore();
  const navigate = useNavigate();
  const { user } = useAuth();

  const { mutate: toggleLike } = useToggleLike();
  const { mutate: createComment, isPending: isCommenting } = useCreateComment();

  const [newComment, setNewComment] = useState("");

  // We can't access reel.id yet because viewingReel might be null
  // But we need to call hooks unconditionally.
  // Safest is to pass a dummy ID if viewingReel is null, and rely on `enabled` in useQuery
  const reelId = viewingReel ? String(viewingReel.id) : "";
  const { data: comments, isLoading: loadingComments } = useGetComments(reelId, 'reel');

  if (!viewingReel) return null;
  const reel = viewingReel;
  const liked = reel.hasLiked || false;

  const handleLike = () => {
    if (!user) return;
    toggleLike({ targetId: reel.id, type: 'reel', userId: user.id, hasLiked: liked });
  };

  const handleAddComment = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newComment.trim() || !user) return;

    createComment({
      targetId: String(reel.id),
      type: 'reel',
      text: newComment,
      userId: user.id
    }, {
      onSuccess: () => {
        showToast("কমেন্ট যোগ করা হয়েছে");
        setNewComment("");
      },
      onError: () => showToast("কমেন্ট যোগ করতে সমস্যা হয়েছে")
    });
  };

  const onClose = () => setViewingReel(null);

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
      className="fixed inset-0 z-[100] bg-black/80 backdrop-blur-md flex items-center justify-center p-4 md:p-8"
      onClick={onClose}
    >
      <motion.div
        initial={{ scale: 0.95, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        exit={{ scale: 0.95, opacity: 0 }}
        className={`w-full max-w-5xl max-h-[90vh] rounded-lg overflow-hidden flex flex-col md:flex-row shadow-2xl ${glassModal} ${theme === "dark" ? "text-white" : "text-black"}`}
        onClick={(e) => e.stopPropagation()}
      >
        {/* Media Section */}
        <div className="flex-1 bg-black flex items-center justify-center min-h-[300px] md:h-auto border-r border-zinc-800 relative">
          <video
            src={reel.src}
            className="max-h-full max-w-full"
            controls
            autoPlay
            loop
          />
        </div>

        {/* Details Section */}
        <div className="w-full md:w-[400px] flex flex-col h-full md:h-[90vh]">
          <div
            className={`p-4 border-b ${theme === "dark" ? "border-zinc-800" : "border-zinc-200"} flex items-center justify-between`}
          >
            <div
              className="flex items-center gap-3"
              onClick={() => onUserClick(reel.user)}
            >
              <div className="w-8 h-8 rounded-full border border-zinc-700 overflow-hidden cursor-pointer">
                <OptimizedImage
                  src={reel.user.avatar}
                  className="w-full h-full"
                  alt={reel.user.username}
                />
              </div>
              <span className="font-semibold text-sm hover:opacity-70 cursor-pointer">
                {reel.user.username}
              </span>
            </div>
            <MoreHorizontal
              size={20}
              className="cursor-pointer hover:opacity-70"
            />
          </div>

          <div className="flex-grow overflow-y-auto p-4 space-y-4">
            <div className="flex gap-3">
              <div
                className="w-8 h-8 rounded-full flex-shrink-0 overflow-hidden cursor-pointer"
                onClick={() => onUserClick(reel.user)}
              >
                <OptimizedImage
                  src={reel.user.avatar}
                  className="w-full h-full"
                  alt="user"
                />
              </div>
              <div className="text-sm">
                <span
                  className="font-semibold mr-2 cursor-pointer"
                  onClick={() => onUserClick(reel.user)}
                >
                  {reel.user.username}
                </span>
                <span>{reel.caption}</span>
              </div>
            </div>

            {loadingComments ? (
              <div className="text-center py-4 text-zinc-500 text-sm">लोड হচ্ছে...</div>
            ) : comments && comments.length > 0 ? (
              comments.map((c: any) => (
                <div key={c.id} className="flex gap-3">
                  <div className="w-8 h-8 rounded-full overflow-hidden flex-shrink-0">
                    <OptimizedImage
                      src={c.user.avatar_url}
                      className="w-full h-full"
                      alt={c.user.username}
                    />
                  </div>
                  <div className="text-sm">
                    <span className="font-semibold mr-2">{c.user.username}</span>
                    <span>{c.text}</span>
                  </div>
                </div>
              ))
            ) : (
              <div className="text-center py-10 text-zinc-500 text-sm">কোনো কমেন্ট নেই</div>
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
            </div>
            <div className="font-semibold text-sm mb-2">
              {reel.likes + " লাইক"}
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
      <button
        className="absolute top-4 right-4 text-white md:hidden p-2 bg-black/50 rounded-full"
        onClick={onClose}
      >
        <X size={24} />
      </button>
    </motion.div>
  );
};

export default ReelDetailsModal;
