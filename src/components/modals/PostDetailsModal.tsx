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
import type { User } from "../../types";
import { useAuth } from "../../hooks/useAuth";
import { motion } from "framer-motion";
import { useToggleLike } from "../../hooks/mutations/useToggleLike";
import { useCreateComment } from "../../hooks/mutations/useCreateComment";
import { useGetComments } from "../../hooks/queries/useGetComments";
import { useToggleSave } from "../../hooks/mutations/useToggleSave";
import { Button } from "@/components/ui/button";

import { Input } from "@/components/ui/input";
import { ScrollArea } from "@/components/ui/scroll-area";
import VoiceRecorder from "../VoiceRecorder";

import OptimizedImage from "../OptimizedImage";
import AudioPlayer from "../AudioPlayer";
import VerifiedBadge from "../VerifiedBadge";

import dayjs from "dayjs";
import relativeTime from "dayjs/plugin/relativeTime";
import "dayjs/locale/bn";
import RichText from "../RichText";

dayjs.extend(relativeTime);
dayjs.locale("bn");

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

  const handleEmojiClick = (emojiData: any) => {
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

  const handleAddComment = (e?: React.FormEvent, audioBlob?: Blob) => {
    if (e) e.preventDefault();

    if (!user) {
      showToast("কমেন্ট করতে লগ ইন করুন");
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
          showToast("কমেন্ট যোগ করা হয়েছে");
          setNewComment("");
          setShowRecorder(false);
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
        className={`w-full max-w-5xl h-[95vh] md:h-auto md:max-h-[90vh] rounded-t-[20px] md:rounded-lg overflow-hidden flex flex-col md:flex-row shadow-2xl ${glassModal} ${theme === "dark" ? "text-white" : "text-black"}`}
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
            <Button variant="ghost" size="icon" className="hidden md:flex">
              <MoreHorizontal size={20} />
            </Button>

            {/* Mobile Close Button */}
            <div
              className="absolute right-4 top-4 md:hidden cursor-pointer"
              onClick={onClose}
            >
              <X size={20} />
            </div>
          </div>

          <ScrollArea className="flex-grow p-4">
            <div className="space-y-4">
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
                  <RichText text={activeItem.caption} />
                  <div className="text-xs text-zinc-500 mt-1">                    {(activeItem as any).createdAt ? dayjs((activeItem as any).createdAt).fromNow() : (activeItem as any).time}
                  </div>
                </div>
              </div>

              {loadingComments ? (
                <div className="text-center py-4 text-zinc-500 text-sm">
                  लोड হচ্ছে...
                </div>
              ) : comments && comments.length > 0 ? (
                comments.map((c: any) => {
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
                            {c.audio_url || c.audioUrl ? (
                              <AudioPlayer src={c.audio_url || c.audioUrl} theme={theme} />
                            ) : (
                              <RichText text={c.text} />
                            )}
                          </div>
                          <div className="flex items-center gap-4 text-xs text-zinc-500 font-semibold mt-1.5">                            <span>{dayjs(c.created_at).fromNow(true)}</span>
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
          </ScrollArea>

          <div
            className={`p-4 border-t ${theme === "dark" ? "border-zinc-800" : "border-zinc-200"} relative`}
          >
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
                  width={300}
                  height={400}
                />
              </div>
            )}

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
            <div className="font-semibold text-sm mb-2">
              {activeItem.likes + " লাইক"}
            </div>
            <div className="text-xs text-zinc-500 uppercase mb-3">
              {(activeItem as any).createdAt ? dayjs((activeItem as any).createdAt).fromNow() : (activeItem as any).time}
            </div>

            {/* Quick Emojis */}
            {!showRecorder && (
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
            )}

            <div className="flex items-center gap-2 border-t pt-3 border-zinc-800">
              {showRecorder ? (
                <VoiceRecorder
                  onRecordingComplete={(blob) => handleAddComment(undefined, blob)}
                  onCancel={() => setShowRecorder(false)}
                />
              ) : (
                <form
                  onSubmit={(e) => handleAddComment(e)}
                  className="flex items-center gap-2 w-full"
                >
                  <Smile
                    size={24}
                    className={`cursor-pointer transition-colors ${showEmojiPicker ? "text-[#006a4e]" : "text-zinc-400 hover:text-zinc-200"}`}
                    onClick={() => setShowEmojiPicker(!showEmojiPicker)}
                  />
                  <Input
                    type="text"
                    placeholder="কমেন্ট যোগ করুন..."
                    className="bg-transparent text-sm w-full border-none focus-visible:ring-0 p-0 h-auto"
                    value={newComment}
                    onChange={(e) => setNewComment(e.target.value)}
                    onFocus={() => setShowEmojiPicker(false)}
                    disabled={isCommenting}
                  />

                  {!newComment && (
                    <Mic
                      size={24}
                      className="cursor-pointer text-zinc-400 hover:text-zinc-200"
                      onClick={() => setShowRecorder(true)}
                    />
                  )}

                  {newComment && (
                    <Button
                      type="submit"
                      variant="ghost"
                      className="text-[#006a4e] font-bold hover:text-[#004d39] hover:bg-transparent p-0 h-auto"
                      disabled={isCommenting}
                    >
                      {isCommenting ? <Loader2 className="h-4 w-4 animate-spin" /> : "পোস্ট"}
                    </Button>
                  )}
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
