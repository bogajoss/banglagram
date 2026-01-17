import React, { useState } from "react";
import {
  X,
  Heart,
  MessageCircle as CommentIcon,
  Send,
  Bookmark,
  Smile,
  MoreHorizontal,
  Loader2,
  Mic,
} from "lucide-react";

import EmojiPicker, { Theme as EmojiTheme } from "emoji-picker-react";
import { useAppStore } from "../../store/useAppStore";
import { useNavigate } from "react-router-dom";
import type { User, Post, Reel } from "../../types";
import { useAuth } from "../../hooks/useAuth";
import { motion } from "framer-motion";
import { useToggleLike } from "../../hooks/mutations/useToggleLike";
import { useCreateComment } from "../../hooks/mutations/useCreateComment";
import { useGetComments } from "../../hooks/queries/useGetComments";
import { useToggleSave } from "../../hooks/mutations/useToggleSave";
import { Avatar, AvatarImage, AvatarFallback } from "@/components/ui/avatar";
import { Separator } from "@/components/ui/separator";

import { ScrollArea } from "@/components/ui/scroll-area";
import VoiceRecorder from "../VoiceRecorder";

import OptimizedImage from "../OptimizedImage";
import AudioPlayer from "../AudioPlayer";
import VerifiedBadge from "../VerifiedBadge";

import dayjs from "dayjs";
import relativeTime from "dayjs/plugin/relativeTime";
import "dayjs/locale/en";
import RichText from "../RichText";

dayjs.extend(relativeTime);
dayjs.locale("en");

// Audio Player moved to standalone component


const PostDetailsModal: React.FC = () => {
  const {
    viewingPost,
    viewingReel,
    theme,
    showToast,
    savedPostIds,
    setViewingPost,
    setViewingReel,
  } = useAppStore();
  const { mutate: toggleSaveMutation } = useToggleSave();

  const navigate = useNavigate();

  const { user } = useAuth();

  const { mutate: toggleLike } = useToggleLike();
  const { mutate: createComment, isPending: isCommenting } = useCreateComment();

  const [newComment, setNewComment] = useState("");
  const [showEmojiPicker, setShowEmojiPicker] = useState(false);
  const [showRecorder, setShowRecorder] = useState(false);
  const emojiPickerRef = React.useRef<HTMLDivElement>(null);

  const activeItem = viewingPost || viewingReel;

  // Handle clicking outside emoji picker to close it
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
      showToast("Log in to like");
      return;
    }
    toggleLike({
      targetId: String(activeItem.id),
      type,
      userId: user.id,
      hasLiked: liked,
    });
  };

  const handleAddComment = (e?: React.FormEvent, audioBlob?: Blob) => {
    if (e) e.preventDefault();

    if (!user) {
      showToast("Log in to comment");
      return;
    }

    if (!audioBlob && !newComment.trim()) return;

    createComment(
      {
        targetId: String(activeItem.id),
        type,
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
        className={`w-full max-w-5xl h-[95vh] md:h-[650px] md:max-h-[90vh] rounded-t-[20px] md:rounded-lg overflow-hidden flex flex-col md:flex-row shadow-2xl ${glassModal} ${theme === "dark" ? "text-white" : "text-black"}`}
        onClick={(event) => event.stopPropagation()}
      >
        {/* Media Section */}
        <div className="hidden md:flex flex-1 bg-black items-center justify-center h-full border-r border-zinc-800 relative">
          {isReel ? (
            <video
              src={(activeItem as Reel).src}
              className="max-h-full max-w-full"
              controls
              autoPlay
              loop
            />
          ) : (
            <OptimizedImage
              src={
                (activeItem as Post).content?.src ||
                (activeItem as Post).content?.poster || ""
              }
              className="max-h-full max-w-full"
              imgClassName="object-contain"
              alt="post detail"
            />
          )}
        </div>

        {/* Details Section */}
        <div className="w-full md:w-[400px] flex flex-col h-full overflow-hidden bg-inherit">
          <div
            className={`p-4 flex items-center justify-between shrink-0`}
          >
            {/* Mobile Header: Comments Title */}
            <div className="md:hidden w-full text-center font-bold text-sm">
              Comments
            </div>

            {/* Desktop Header: User Profile */}
            <div
              className="hidden md:flex items-center gap-3 cursor-pointer"
              onClick={() => onUserClick(activeItem.user)}
            >
              <Avatar className="w-8 h-8 border border-zinc-700">
                <AvatarImage src={activeItem.user.avatar} />
                <AvatarFallback>{activeItem.user.username?.[0]?.toUpperCase() || "?"}</AvatarFallback>
              </Avatar>
              <div className="flex items-center">
                <span className="font-semibold text-sm hover:opacity-70">
                  {activeItem.user.username}
                </span>
                {activeItem.user.isVerified && <VerifiedBadge />}
              </div>
            </div>

            {/* Desktop Options Icon */}
            <motion.div
              whileHover={{ scale: 1.1 }}
              whileTap={{ scale: 0.9 }}
              className="hidden md:flex"
            >
              <MoreHorizontal size={20} className="cursor-pointer hover:opacity-70" />
            </motion.div>

            {/* Mobile Close Button */}
            <div
              className="absolute right-4 top-4 md:hidden cursor-pointer"
              onClick={onClose}
            >
              <X size={20} />
            </div>
          </div>

          <Separator />

          <div className="flex-1 min-h-0 overflow-hidden">
            <ScrollArea className="h-full w-full">
              <div className="p-4 space-y-4">
                <div className="flex gap-3">
                  <Avatar
                    className="w-8 h-8 cursor-pointer flex-shrink-0"
                    onClick={() => onUserClick(activeItem.user)}
                  >
                    <AvatarImage src={activeItem.user.avatar} />
                    <AvatarFallback>{activeItem.user.username[0].toUpperCase()}</AvatarFallback>
                  </Avatar>
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
                    <RichText text={activeItem.caption} />
                    <div className="text-xs text-zinc-500 mt-1">
                      {"createdAt" in activeItem && activeItem.createdAt ? dayjs(activeItem.createdAt).fromNow() : "time" in activeItem ? activeItem.time : ""}
                    </div>
                  </div>
                </div>

                {loadingComments ? (
                  <div className="text-center py-4 text-zinc-500 text-sm">
                    Loading...
                  </div>
                ) : comments && comments.length > 0 ? (
                  comments.map((c: { id: string; user_id: string; user: { username: string; avatar_url: string; is_verified?: boolean }; text: string; audio_url?: string; audioUrl?: string; created_at: string }) => {
                    const commentUser: User = {
                      id: c.user_id,
                      username: c.user.username,
                      name: c.user.username,
                      avatar: c.user.avatar_url,
                      isVerified: c.user.is_verified,
                    };
                    return (
                      <div
                        key={c.id}
                        className="flex gap-3 justify-between items-start group"
                      >
                        <div className="flex gap-3">
                          <Avatar
                            className="w-8 h-8 cursor-pointer flex-shrink-0"
                            onClick={() => onUserClick(commentUser)}
                          >
                            <AvatarImage src={c.user.avatar_url} />
                            <AvatarFallback>{c.user.username?.[0]?.toUpperCase() || "?"}</AvatarFallback>
                          </Avatar>
                          <div className="flex flex-col">
                            <div className="text-sm leading-tight">
                              <div className="flex items-center">
                                <span
                                  className="font-semibold mr-2 cursor-pointer hover:opacity-70"
                                  onClick={() => onUserClick(commentUser)}
                                >
                                  {c.user.username}
                                </span>
                                {c.user.is_verified && <VerifiedBadge />}
                              </div>
                              {c.audio_url || c.audioUrl ? (
                                <AudioPlayer src={(c.audio_url || c.audioUrl) as string} theme={theme} />
                              ) : (
                                <RichText text={c.text} />
                              )}
                            </div>
                            <div className="flex items-center gap-4 text-xs text-zinc-500 font-semibold mt-1.5">
                              <span>{dayjs(c.created_at).fromNow(true)}</span>
                              <span className="cursor-pointer hover:text-zinc-400">
                                0 likes
                              </span>
                              <span className="cursor-pointer hover:text-zinc-400">
                                Reply
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
                    No comments yet
                  </div>
                )}
              </div>
            </ScrollArea>
          </div>

          <Separator />

          <div
            className={`px-4 py-3 relative shrink-0 bg-inherit`}
          >            {/* Emoji Picker */}
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
                  width={300}
                  height={400}
                />
              </div>
            )}

            <div className="flex items-center justify-between mb-2">
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
                  onClick={() => showToast("Shared")}
                />
              </div>
              <Bookmark
                size={24}
                className={`cursor-pointer hover:opacity-70 ${isSaved ? "fill-current" : ""}`}
                onClick={() => {
                  if (user && activeItem) {
                    toggleSaveMutation({
                      postId: String(activeItem.id),
                      userId: user.id,
                      hasSaved: isSaved,
                    });
                  }
                }}
              />
            </div>

            <div className="flex flex-col mb-2">
              <span className="font-semibold text-sm">
                {activeItem.likes + " likes"}
              </span>
              <span className="text-[10px] text-zinc-500 uppercase">
                {"createdAt" in activeItem && activeItem.createdAt ? dayjs(activeItem.createdAt).fromNow() : "time" in activeItem ? activeItem.time : ""}
              </span>
            </div>

            {/* Quick Emojis */}
            {!showRecorder && (
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
            )}

            <div className="flex items-center gap-2 pt-2 border-t border-zinc-800">
              {showRecorder ? (
                <VoiceRecorder
                  onRecordingComplete={(blob) => handleAddComment(undefined, blob)}
                  onCancel={() => setShowRecorder(false)}
                />
              ) : (
                <form
                  onSubmit={(e) => handleAddComment(e)}
                  className="flex items-center gap-2 w-full relative"
                >
                  <Smile
                    size={20}
                    className={`cursor-pointer transition-colors flex-shrink-0 ${showEmojiPicker ? "text-[#006a4e]" : "text-zinc-500 hover:text-zinc-300"}`}
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
                      className="text-zinc-500 cursor-pointer hover:text-zinc-300 flex-shrink-0"
                      onClick={() => setShowRecorder(true)}
                    />
                  )}

                  <button
                    type="submit"
                    className="text-[#006a4e] text-sm font-semibold disabled:opacity-50 hover:text-[#004d39] flex-shrink-0"
                    disabled={!newComment || isCommenting}
                  >
                    {isCommenting ? <Loader2 className="h-4 w-4 animate-spin" /> : "Post"}
                  </button>
                </form>
              )}
            </div>
          </div>
        </div>
      </motion.div>
    </motion.div>
  );
};

export default PostDetailsModal;
