import React, { useState, memo, useMemo } from "react";
import {
  Heart,
  MessageCircle as CommentIcon,
  Send,
  Bookmark,
  MoreHorizontal,
  Smile,
  Mic,
  BarChart2,
  ChevronLeft,
  ChevronRight,
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
import { cn } from "@/lib/utils";

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
    const { ref: viewRef } = useViewTracker(post.id, "post");

    const [showHeart, setShowHeart] = useState(false);

    const [newComment, setNewComment] = useState("");
    const [isOptionsOpen, setIsOptionsOpen] = useState(false);
    const [isShareOpen, setIsShareOpen] = useState(false);
    const [isEditOpen, setIsEditOpen] = useState(false);
    const [showEmojiPicker, setShowEmojiPicker] = useState(false);
    const [showRecorder, setShowRecorder] = useState(false);
    
    const [currentImageIndex, setCurrentImageIndex] = useState(0);

    const emojiPickerRef = React.useRef<HTMLDivElement>(null);

    const liked = post.hasLiked || false;

    // Parse media sources
    const mediaList = useMemo(() => {
        if (post.content.type === "video") return [];
        const src = post.content.src;
        if (!src) return [];
        try {
            if (src.startsWith("[")) {
                return JSON.parse(src) as string[];
            }
            return [src];
        } catch (e) {
            return [src];
        }
    }, [post.content.src, post.content.type]);

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
      return () =>
        document.removeEventListener("mousedown", handleClickOutside);
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
    
    const nextImage = (e: React.MouseEvent) => {
        e.stopPropagation();
        if (currentImageIndex < mediaList.length - 1) {
            setCurrentImageIndex(prev => prev + 1);
        }
    };

    const prevImage = (e: React.MouseEvent) => {
        e.stopPropagation();
        if (currentImageIndex > 0) {
            setCurrentImageIndex(prev => prev - 1);
        }
    };

    return (
      <motion.div
        ref={viewRef}
        initial={{ opacity: 0, y: 20 }}
        whileInView={{ opacity: 1, y: 0 }}
        viewport={{ once: true, margin: "-50px" }}
        transition={{ duration: 0.4 }}
        className="border-b border-border pb-5 mb-4"
      >
        {isOptionsOpen && (
          <MoreOptionsModal
            onClose={() => setIsOptionsOpen(false)}
            showToast={showToast}
            shareUrl={shareUrl}
            isOwner={isOwner}
            onEdit={() => setIsEditOpen(true)}
          />
        )}
        {isShareOpen && (
          <ShareModal
            onClose={() => setIsShareOpen(false)}
            shareUrl={shareUrl}
          />
        )}
        {isEditOpen && (
          <EditPostModal post={post} onClose={() => setIsEditOpen(false)} />
        )}

        <div className="flex items-center justify-between mb-3 px-3 md:px-0">
          <div
            className="flex items-center gap-2 cursor-pointer group"
            onClick={() => onUserClick(post.user)}
          >
            <Avatar className="w-8 h-8 group-hover:scale-105 transition-transform">
              <AvatarImage src={post.user.avatar} />
              <AvatarFallback>
                {post.user.username[0].toUpperCase()}
              </AvatarFallback>
            </Avatar>
            <div className="flex items-center gap-1 text-sm font-semibold">
              <span className="group-hover:opacity-70 transition-opacity text-foreground">
                {post.user.username}
              </span>
              {post.user.isVerified && <VerifiedBadge />}
              <span className="text-muted-foreground font-normal">
                •{" "}
                {post.createdAt
                  ? dayjs(post.createdAt).fromNow(true)
                  : post.time}
              </span>
            </div>
          </div>
          <motion.div whileHover={{ scale: 1.1 }} whileTap={{ scale: 0.9 }}>
            <MoreHorizontal
              size={20}
              className="cursor-pointer hover:opacity-70 text-foreground"
              onClick={() => setIsOptionsOpen(true)}
            />
          </motion.div>
        </div>

        <div
          className="w-full bg-muted md:rounded-[4px] md:border border-border overflow-hidden mb-3 aspect-square md:aspect-auto relative cursor-pointer group"
          onDoubleClick={handleDoubleClick}
        >
            {mediaList.length > 0 ? (
                <>
                    <div className="w-full h-full relative">
                         <OptimizedImage
                            src={mediaList[currentImageIndex]}
                            className="w-full h-full object-cover"
                            alt={`Post content ${currentImageIndex + 1}`}
                            loading="lazy"
                        />
                    </div>
                    
                    {/* Navigation Buttons */}
                    {mediaList.length > 1 && (
                        <>
                            {currentImageIndex > 0 && (
                                <button 
                                    onClick={prevImage}
                                    className="absolute left-2 top-1/2 -translate-y-1/2 p-1.5 bg-black/50 rounded-full text-white opacity-0 group-hover:opacity-100 transition-opacity disabled:opacity-0"
                                >
                                    <ChevronLeft size={20} />
                                </button>
                            )}
                            
                            {currentImageIndex < mediaList.length - 1 && (
                                <button 
                                    onClick={nextImage}
                                    className="absolute right-2 top-1/2 -translate-y-1/2 p-1.5 bg-black/50 rounded-full text-white opacity-0 group-hover:opacity-100 transition-opacity disabled:opacity-0"
                                >
                                    <ChevronRight size={20} />
                                </button>
                            )}
                            
                            {/* Dots */}
                            <div className="absolute bottom-4 left-0 right-0 flex justify-center gap-1.5 pointer-events-none">
                                {mediaList.map((_, idx) => (
                                    <div 
                                        key={idx}
                                        className={cn(
                                            "w-1.5 h-1.5 rounded-full transition-colors shadow-sm",
                                            idx === currentImageIndex ? "bg-white" : "bg-white/40"
                                        )}
                                    />
                                ))}
                            </div>
                            
                            {/* Count Indicator (Instagram style top right) */}
                            <div className="absolute top-4 right-4 bg-black/60 text-white text-xs px-2 py-1 rounded-full opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none">
                                {currentImageIndex + 1}/{mediaList.length}
                            </div>
                        </>
                    )}
                </>
            ) : (
              <OptimizedImage
                src={post.content.src || post.content.poster}
                className="w-full h-full object-cover"
                alt="Post content"
                loading="lazy"
              />
            )}
         
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
                className={`cursor-pointer transition-colors ${liked ? "fill-[#f42a41] text-[#f42a41]" : "text-foreground"}`}
                onClick={handleLike}
              />
            </motion.div>
            <motion.div whileHover={{ scale: 1.1 }} whileTap={{ scale: 0.9 }}>
              <CommentIcon
                size={24}
                className="-scale-x-100 cursor-pointer hover:opacity-70 transition-opacity text-foreground"
                onClick={() => onPostClick(post)}
              />
            </motion.div>
            <motion.div whileHover={{ scale: 1.1 }} whileTap={{ scale: 0.9 }}>
              <Send
                size={24}
                className="cursor-pointer hover:opacity-70 transition-opacity text-foreground"
                onClick={() => setIsShareOpen(true)}
              />
            </motion.div>

            <div
              className="flex items-center gap-1 ml-2 opacity-60 text-foreground"
              title="Views"
            >
              <BarChart2 size={22} className="" />
              <span className="text-sm font-medium">
                {Intl.NumberFormat("en-US", {
                  notation: "compact",
                  maximumFractionDigits: 1,
                }).format(post.views || 0)}
              </span>
            </div>
          </div>
          <motion.div whileHover={{ scale: 1.1 }} whileTap={{ scale: 0.9 }}>
            <Bookmark
              size={24}
              className={`cursor-pointer hover:opacity-70 transition-all text-foreground ${isSaved ? "fill-current" : ""}`}
              onClick={onToggleSave}
            />
          </motion.div>
        </div>

        <div className="text-sm px-3 md:px-0 text-foreground">
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
            className="text-muted-foreground cursor-pointer hover:underline"
            onClick={() => onPostClick(post)}
          >
            View all {post.comments} comments
          </div>
          <div className="text-[10px] text-muted-foreground uppercase mt-1">
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
            <div className="mt-2 bg-muted p-2 rounded-xl">
              <VoiceRecorder
                onRecordingComplete={(blob) =>
                  handleAddComment(undefined, blob)
                }
                onCancel={() => setShowRecorder(false)}
              />
            </div>
          ) : (
            <form
              onSubmit={handleAddComment}
              className="flex gap-2 mt-2 items-center relative"
            >
              {/* Emoji Picker */}
              {showEmojiPicker && (
                <div
                  ref={emojiPickerRef}
                  className="absolute bottom-full left-0 z-50 shadow-2xl mb-2"
                >
                  <EmojiPicker
                    theme={
                      theme === "dark" ? EmojiTheme.DARK : EmojiTheme.LIGHT
                    }
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
                className={`cursor-pointer transition-colors ${showEmojiPicker ? "text-primary" : "text-muted-foreground hover:text-foreground"}`}
                onClick={() => setShowEmojiPicker(!showEmojiPicker)}
              />
              <input
                type="text"
                placeholder="Add a comment..."
                className="bg-transparent text-sm w-full outline-none text-foreground"
                value={newComment}
                onChange={(e) => setNewComment(e.target.value)}
                onFocus={() => setShowEmojiPicker(false)}
                disabled={isCommenting}
              />

              {!newComment && (
                <Mic
                  size={20}
                  className="text-muted-foreground cursor-pointer hover:text-foreground"
                  onClick={() => setShowRecorder(true)}
                />
              )}

              <button
                type="submit"
                className="text-primary text-sm font-semibold disabled:opacity-50 hover:text-primary/80"
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
