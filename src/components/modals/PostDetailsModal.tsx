import React, { useState } from "react";
import {
  Heart,
  MessageCircle as CommentIcon,
  Send,
  Bookmark,
  Smile,
  MoreHorizontal,
  Loader2,
  Mic,
  X,
} from "lucide-react";

import EmojiPicker, { Theme as EmojiTheme } from "emoji-picker-react";
import { useAppStore } from "../../store/useAppStore";
import { useNavigate } from "react-router-dom";
import type { User, Post, Reel } from "../../types";
import { useAuth } from "../../hooks/useAuth";
import { useToggleLike } from "../../hooks/mutations/useToggleLike";
import { useCreateComment } from "../../hooks/mutations/useCreateComment";
import { useToggleSave } from "../../hooks/mutations/useToggleSave";
import { Avatar, AvatarImage, AvatarFallback } from "@/components/ui/avatar";
import { Separator } from "@/components/ui/separator";

import { ScrollArea } from "@/components/ui/scroll-area";
import VoiceRecorder from "../VoiceRecorder";

import VerifiedBadge from "../VerifiedBadge";

import dayjs from "dayjs";
import relativeTime from "dayjs/plugin/relativeTime";
import "dayjs/locale/en";
import { CommentsSection } from "../CommentsSection";
import type { Comment } from "../../hooks/queries/useGetComments";
import {
  Dialog,
  DialogContent,
  DialogTitle,
} from "@/components/ui/dialog";

dayjs.extend(relativeTime);
dayjs.locale("en");

const PostDetailsModal: React.FC = () => {
  const {
    viewingPost,
    viewingReel,
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
  const [replyingTo, setReplyingTo] = useState<Comment | null>(null);
  
  const emojiPickerRef = React.useRef<HTMLDivElement>(null);
  const inputRef = React.useRef<HTMLInputElement>(null);

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

  const handleReply = (comment: Comment) => {
      setReplyingTo(comment);
      inputRef.current?.focus();
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
        parentId: replyingTo?.id
      },
      {
        onSuccess: () => {
          showToast("Comment added");
          setNewComment("");
          setShowRecorder(false);
          setReplyingTo(null);
        },
        onError: () => showToast("Failed to add comment"),
      },
    );
  };

  const onClose = () => {
    if (viewingPost) setViewingPost(null);
    if (viewingReel) setViewingReel(null);
    setReplyingTo(null);
  };

  const onUserClick = (user: User) => {
    onClose();
    navigate(`/profile/${user.username}`);
  };

  return (
    <Dialog open={true} onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="max-w-5xl h-[95vh] md:h-[650px] md:max-h-[90vh] p-0 overflow-hidden border-none sm:rounded-lg">
        <DialogTitle className="sr-only">Post by {activeItem.user.username}</DialogTitle>
        <div className="flex flex-col md:flex-row h-full w-full bg-background">
          {/* Media Section */}
          <div className="hidden md:flex flex-1 bg-black items-center justify-center h-full border-r border-border relative">
            {isReel ? (
              <video
                src={(activeItem as Reel).src}
                className="max-h-full max-w-full"
                controls
                autoPlay
                loop
              />
            ) : (
              <img
                src={
                  (activeItem as Post).content?.src ||
                  (activeItem as Post).content?.poster || ""
                }
                className="max-h-full max-w-full object-contain"
                alt="post detail"
                loading="lazy"
              />
            )}
          </div>

          {/* Details Section */}
          <div className="w-full md:w-[400px] flex flex-col h-full overflow-hidden">
            <div className="p-4 flex items-center justify-between shrink-0">
              {/* Mobile Header: Comments Title */}
              <div className="md:hidden w-full text-center font-bold text-sm">
                Comments
              </div>

              {/* Desktop Header: User Profile */}
              <div
                className="hidden md:flex items-center gap-3 cursor-pointer"
                onClick={() => onUserClick(activeItem.user)}
              >
                <Avatar className="w-8 h-8 border border-border">
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
              <MoreHorizontal size={20} className="hidden md:block cursor-pointer hover:opacity-70" />
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
                      <span className="whitespace-pre-wrap">{activeItem.caption}</span>
                      <div className="text-xs text-muted-foreground mt-1">
                        {"createdAt" in activeItem && activeItem.createdAt ? dayjs(activeItem.createdAt).fromNow() : "time" in activeItem ? activeItem.time : ""}
                      </div>
                    </div>
                  </div>

                  <CommentsSection 
                    targetId={itemId}
                    type={type}
                    onReply={handleReply}
                  />
                </div>
              </ScrollArea>
            </div>

            <Separator />

            <div className="px-4 py-3 relative shrink-0">
            {/* Emoji Picker */}
            {showEmojiPicker && (
              <div
                ref={emojiPickerRef}
                className="absolute bottom-full left-0 z-50 shadow-2xl mb-2"
              >
                <EmojiPicker
                  theme={document.documentElement.classList.contains("dark") ? EmojiTheme.DARK : EmojiTheme.LIGHT}
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
                    onClick={() => inputRef.current?.focus()}
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
                <span className="text-[10px] text-muted-foreground uppercase">
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

              <div className="flex bg-muted rounded-full px-3 py-1.5 focus-within:ring-1 ring-primary/50 items-center justify-between border border-transparent transition-all">
                 {replyingTo && (
                  <div className="flex items-center gap-2 mr-2 bg-primary/10 px-2 py-0.5 rounded text-xs text-primary whitespace-nowrap">
                     <span>@{replyingTo.user.username}</span>
                     <button onClick={() => setReplyingTo(null)}>
                         <X className="w-3 h-3" />
                     </button>
                  </div>
                 )}

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
                      className={`cursor-pointer transition-colors flex-shrink-0 ${showEmojiPicker ? "text-primary" : "text-muted-foreground hover:text-foreground"}`}
                      onClick={() => setShowEmojiPicker(!showEmojiPicker)}
                    />
                    <input
                      ref={inputRef}
                      type="text"
                      placeholder={`Add a comment...`}
                      className="bg-transparent text-sm w-full outline-none text-foreground"
                      value={newComment}
                      onChange={(e) => setNewComment(e.target.value)}
                      onFocus={() => setShowEmojiPicker(false)}
                      disabled={isCommenting}
                    />

                    {!newComment && (
                      <Mic
                        size={20}
                        className="text-muted-foreground cursor-pointer hover:text-foreground flex-shrink-0"
                        onClick={() => setShowRecorder(true)}
                      />
                    )}

                    <button
                      type="submit"
                      className="text-primary text-sm font-semibold disabled:opacity-50 hover:text-primary/80 flex-shrink-0"
                      disabled={!newComment || isCommenting}
                    >
                      {isCommenting ? <Loader2 className="h-4 w-4 animate-spin" /> : "Post"}
                    </button>
                  </form>
                )}
              </div>
            </div>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default PostDetailsModal;