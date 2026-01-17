import React, { useState, useEffect, useRef, memo } from "react";
import ReactPlayer from "react-player";
// eslint-disable-next-line @typescript-eslint/no-explicit-any
const Player = ReactPlayer as any;
import {
  Heart,
  MessageCircle as CommentIcon,
  Send,
  MoreHorizontal,
  Volume2,
  VolumeX,
  Music2,
  Play,
  BarChart2,
} from "lucide-react";
import MoreOptionsModal from "./modals/MoreOptionsModal";
import ShareModal from "./modals/ShareModal";
import type { Reel, User } from "../types";
import { useToggleLike } from "../hooks/mutations/useToggleLike";
import { useFollowUser } from "../hooks/mutations/useFollowUser";
import { useAuth } from "../hooks/useAuth";
import { useViewTracker } from "../hooks/useViewTracker";

interface ReelItemProps {
  reel: Reel;
  showToast: (msg: string) => void;
  theme: string;
  onUserClick: (user: User) => void;
  glassModal: string;
}

import { motion, AnimatePresence } from "framer-motion";

import { useAppStore } from "../store/useAppStore";
import VerifiedBadge from "./VerifiedBadge";

import { Avatar, AvatarImage, AvatarFallback } from "@/components/ui/avatar";

const ReelItem: React.FC<ReelItemProps> = memo(
  ({ reel, showToast, theme, onUserClick, glassModal }) => {
    const { setViewingReel } = useAppStore();
    const { user } = useAuth();
    const { mutate: toggleLike } = useToggleLike();
    const { mutate: followUser } = useFollowUser();
    
    // View Tracking
    const { ref: viewRef } = useViewTracker(reel.id, 'reel');

    const [showHeart, setShowHeart] = useState(false);
    const [isMuted, setIsMuted] = useState(true);
    const [isPlaying, setIsPlaying] = useState(true);

    const [isOptionsOpen, setIsOptionsOpen] = useState(false);
    const [isShareOpen, setIsShareOpen] = useState(false);
    const videoRef = useRef<HTMLDivElement>(null);
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const videoTagRef = useRef<any>(null);
    const shareUrl = `${window.location.origin}/reels/${reel.id}`;

    const isLiked = reel.hasLiked || false;

    const handleLike = () => {
      if (!user) {
        showToast("Log in to like");
        return;
      }
      toggleLike({
        targetId: reel.id,
        type: "reel",
        userId: user.id,
        hasLiked: isLiked,
      });
    };

    const handleFollow = () => {
      if (!user) {
        showToast("Log in to follow");
        return;
      }
      if (!reel.userId) return;
      followUser(
        {
          targetUserId: reel.userId,
          currentUserId: user.id,
          isFollowing: reel.user.isFollowing || false,
          targetUsername: reel.user.username,
        },
        {
          onSuccess: () => showToast("Followed"),
          onError: () => showToast("Failed to follow"),
        },
      );
    };

    const togglePlay = () => {
      if (videoTagRef.current) {
        if (isPlaying) {
          // videoTagRef.current.pause(); // ReactPlayer is declarative
          setIsPlaying(false);
        } else {
          // videoTagRef.current.play(); // ReactPlayer is declarative
          setIsPlaying(true);
        }
      }
    };

    useEffect(() => {
      const observer = new IntersectionObserver(
        ([entry]) => {
          if (entry.isIntersecting) {
            // videoTagRef.current?.play().catch(() => {});
            setIsPlaying(true);
            setIsMuted(false);
          } else {
            // videoTagRef.current?.pause();
            setIsPlaying(false);
            setIsMuted(true);
          }
        },
        { threshold: 0.6 },
      );
      if (videoRef.current) observer.observe(videoRef.current);
      return () => observer.disconnect();
    }, []);

    const handleDoubleClick = () => {
      handleLike();
      setShowHeart(true);
      setTimeout(() => setShowHeart(false), 1000);
    };

    return (
      <motion.div
        ref={viewRef}
        initial={{ opacity: 0, scale: 0.95 }}
        whileInView={{ opacity: 1, scale: 1 }}
        viewport={{ once: true }}
        transition={{ duration: 0.5 }}
        className="h-full w-full flex justify-center items-center snap-start relative md:pt-0"
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

        <div
          ref={videoRef}
          className="relative h-full md:h-[95vh] w-full md:w-[400px] bg-zinc-900 md:rounded-lg overflow-hidden border-zinc-800 md:border group shadow-2xl"
          onDoubleClick={handleDoubleClick}
        >
          {/* Render Video instead of Image for Reels if src is video */}
          {reel.src ? (
            <div className="w-full h-full cursor-pointer" onClick={togglePlay}>
              <Player
                ref={videoTagRef}
                url={reel.src}
                width="100%"
                height="100%"
                playing={isPlaying}
                muted={isMuted}
                loop={true}
                playsinline={true}
                style={{ objectFit: "cover" }}
                className="react-player pointer-events-none"
              />
            </div>
          ) : (
            <img
              src={reel.src}
              className="w-full h-full object-cover"
              onClick={() => setIsMuted(!isMuted)}
              alt="reel"
              loading="lazy"
            />
          )}

          {/* Play/Pause Center Indicator */}
          {!isPlaying && (
            <div className="absolute inset-0 flex items-center justify-center pointer-events-none z-20">
              <div className="bg-black/40 p-5 rounded-full backdrop-blur-sm">
                <Play className="text-white w-10 h-10 fill-white" />
              </div>
            </div>
          )}

          {/* Play/Mute Status */}
          <div
            className="absolute top-4 right-4 bg-black/50 p-2 rounded-full cursor-pointer transition-opacity hover:bg-black/70 z-30"
            onClick={(e) => {
              e.stopPropagation();
              setIsMuted(!isMuted);
            }}
          >
            {isMuted ? (
              <VolumeX className="text-white w-5 h-5" />
            ) : (
              <Volume2 className="text-white w-5 h-5" />
            )}
          </div>

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

          <div className="absolute bottom-0 left-0 w-full p-4 bg-gradient-to-t from-black/80 to-transparent pt-20 pb-20 md:pb-4">
            <div
              className="flex items-center gap-3 mb-3"
              onClick={() => onUserClick(reel.user)}
            >
              <Avatar className="w-8 h-8 border border-white/50 cursor-pointer">
                <AvatarImage src={reel.user.avatar} />
                <AvatarFallback>{reel.user.username[0].toUpperCase()}</AvatarFallback>
              </Avatar>
              <span className="font-semibold text-sm shadow-black drop-shadow-md text-white cursor-pointer hover:opacity-70 transition-opacity">
                {reel.user.username}
              </span>
              {reel.user.isVerified && <VerifiedBadge />}
              <motion.button
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                className={`border border-white/30 rounded-lg px-3 py-1 text-xs font-semibold backdrop-blur-sm transition-colors ${reel.user.isFollowing ? "bg-white/20 text-white" : "text-white hover:bg-white/10"}`}
                onClick={(e) => {
                  e.stopPropagation();
                  handleFollow();
                }}
              >
                {reel.user.isFollowing ? "Following" : "Follow"}
              </motion.button>
            </div>
            <div className="text-sm mb-3 line-clamp-2 drop-shadow-md text-white">
              {reel.caption}{" "}
              <span className="text-zinc-300 cursor-pointer font-semibold hover:text-white">
                More
              </span>
            </div>
            <div className="flex items-center gap-2 text-xs drop-shadow-md text-white opacity-80">
              <Music2 size={12} />
              <div className="truncate w-40">{reel.audio}</div>
            </div>
          </div>

          <div className="absolute bottom-20 md:bottom-4 right-2 flex flex-col items-center gap-6 md:gap-4 text-white pb-safe">
            <div className="flex flex-col items-center gap-1">
              <motion.div whileHover={{ scale: 1.1 }} whileTap={{ scale: 0.9 }}>
                <Heart
                  size={28}
                  strokeWidth={1.5}
                  className={`cursor-pointer transition-colors ${isLiked ? "fill-[#f42a41] text-[#f42a41]" : ""}`}
                  onClick={handleLike}
                />
              </motion.div>
              <span className="text-xs font-semibold drop-shadow-md">
                {reel.likes}
              </span>
            </div>
            <div className="flex flex-col items-center gap-1">
              <motion.div whileHover={{ scale: 1.1 }} whileTap={{ scale: 0.9 }}>
                <CommentIcon
                  size={28}
                  strokeWidth={1.5}
                  className="-scale-x-100 drop-shadow-lg cursor-pointer hover:opacity-80"
                  onClick={() => setViewingReel(reel)}
                />
              </motion.div>
              <span className="text-xs font-semibold drop-shadow-md">
                {reel.comments}
              </span>
            </div>
            <motion.div whileHover={{ scale: 1.1 }} whileTap={{ scale: 0.9 }}>
              <Send
                size={28}
                strokeWidth={1.5}
                className="cursor-pointer hover:opacity-80"
                onClick={() => setIsShareOpen(true)}
              />
            </motion.div>

            <div className="flex flex-col items-center gap-1">
              <BarChart2
                size={28}
                strokeWidth={1.5}
                className="text-white drop-shadow-md"
              />
               <span className="text-xs font-semibold drop-shadow-md">
                 {Intl.NumberFormat('en-US', { notation: "compact", maximumFractionDigits: 1 }).format(reel.views || 0)}
               </span>
            </div>

            <motion.div whileHover={{ scale: 1.1 }} whileTap={{ scale: 0.9 }}>
              <MoreHorizontal
                size={28}
                strokeWidth={1.5}
                className="cursor-pointer hover:opacity-80"
                onClick={() => setIsOptionsOpen(true)}
              />
            </motion.div>
            <Avatar
              className="w-6 h-6 border-2 border-white cursor-pointer mt-2"
              onClick={() => onUserClick(reel.user)}
            >
              <AvatarImage src={reel.user.avatar} />
              <AvatarFallback>{reel.user.username[0].toUpperCase()}</AvatarFallback>
            </Avatar>
          </div>
        </div>
      </motion.div>
    );
  },
);

export default ReelItem;
