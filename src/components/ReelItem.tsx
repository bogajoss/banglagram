import React, { useState, useEffect, useRef } from 'react';
import { Heart, MessageCircle as CommentIcon, Send, MoreHorizontal, Volume2, VolumeX, Music2 } from 'lucide-react';
import MoreOptionsModal from './modals/MoreOptionsModal';
import ShareModal from './modals/ShareModal';

interface ReelItemProps {
  reel: any;
  showToast: (msg: string) => void;
  theme: string;
  onUserClick: (user: any) => void;
  glassModal: string;
}

const ReelItem: React.FC<ReelItemProps> = ({ reel, showToast, theme, onUserClick, glassModal }) => {
  const [isLiked, setIsLiked] = useState(false);
  const [showHeart, setShowHeart] = useState(false);
  const [isMuted, setIsMuted] = useState(true);
  const [isOptionsOpen, setIsOptionsOpen] = useState(false);
  const [isShareOpen, setIsShareOpen] = useState(false);
  const videoRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
           setIsMuted(false); 
        } else {
           setIsMuted(true);
        }
      },
      { threshold: 0.6 }
    );
    if (videoRef.current) observer.observe(videoRef.current);
    return () => observer.disconnect();
  }, []);

  const handleDoubleClick = () => {
     setIsLiked(true);
     setShowHeart(true);
     setTimeout(() => setShowHeart(false), 1000);
  }

  return (
    <div className="h-full w-full flex justify-center items-center snap-start relative md:pt-0">
      {isOptionsOpen && <MoreOptionsModal onClose={() => setIsOptionsOpen(false)} showToast={showToast} theme={theme} glassModal={glassModal} />}
      {isShareOpen && <ShareModal onClose={() => setIsShareOpen(false)} theme={theme} showToast={showToast} glassModal={glassModal} />}

      <div 
        ref={videoRef}
        className="relative h-full md:h-[95vh] w-full md:w-[400px] bg-zinc-900 md:rounded-lg overflow-hidden border-zinc-800 md:border group shadow-2xl"
        onDoubleClick={handleDoubleClick}
      >
        <img src={reel.src} className="w-full h-full object-cover" onClick={() => setIsMuted(!isMuted)} alt="reel" />
        
        {/* Play/Mute Status */}
        <div className="absolute top-4 right-4 bg-black/50 p-2 rounded-full pointer-events-none transition-opacity">
           {isMuted ? <VolumeX className="text-white w-5 h-5" /> : <Volume2 className="text-white w-5 h-5" />}
        </div>
        
        {showHeart && (
           <div className="absolute inset-0 flex items-center justify-center pointer-events-none z-10">
             <Heart size={100} className="text-[#f42a41] fill-[#f42a41] animate-bounce" />
           </div>
        )}

        <div className="absolute bottom-0 left-0 w-full p-4 bg-gradient-to-t from-black/80 to-transparent pt-20 pb-20 md:pb-4">
          <div className="flex items-center gap-3 mb-3" onClick={() => onUserClick(reel.user)}>
            <img src={reel.user.avatar} className="w-8 h-8 rounded-full border border-white/50 object-cover cursor-pointer" alt="reel user" />
            <span className="font-semibold text-sm shadow-black drop-shadow-md text-white cursor-pointer">{reel.user.username}</span>
            <button className="border border-white/30 rounded-lg px-3 py-1 text-xs font-semibold backdrop-blur-sm text-white hover:bg-white/10 transition-colors" onClick={(e) => { e.stopPropagation(); showToast('ফলো করা হচ্ছে'); }}>ফলো</button>
          </div>
          <div className="text-sm mb-3 line-clamp-2 drop-shadow-md text-white">
            {reel.caption} <span className="text-zinc-300 cursor-pointer font-semibold">আরও</span>
          </div>
          <div className="flex items-center gap-2 text-xs drop-shadow-md text-white">
            <Music2 size={12} />
            <div className="truncate w-40">{reel.audio}</div>
          </div>
        </div>

        <div className="absolute bottom-20 md:bottom-4 right-2 flex flex-col items-center gap-6 md:gap-4 text-white pb-safe">
          <div className="flex flex-col items-center gap-1">
            <Heart size={28} strokeWidth={1.5} className={`cursor-pointer transition-transform active:scale-90 ${isLiked ? 'fill-[#f42a41] text-[#f42a41]' : ''}`} onClick={() => setIsLiked(!isLiked)} />
            <span className="text-xs font-semibold drop-shadow-md">{isLiked ? '1' : reel.likes}</span>
          </div>
          <div className="flex flex-col items-center gap-1">
            <CommentIcon size={28} strokeWidth={1.5} className="-scale-x-100 drop-shadow-lg cursor-pointer hover:opacity-80" />
            <span className="text-xs font-semibold drop-shadow-md">{reel.comments}</span>
          </div>
          <Send size={28} strokeWidth={1.5} className="cursor-pointer hover:opacity-80" onClick={() => setIsShareOpen(true)} />
          <MoreHorizontal size={28} strokeWidth={1.5} className="cursor-pointer hover:opacity-80" onClick={() => setIsOptionsOpen(true)} />
          <div className="w-6 h-6 border-2 border-white rounded-md overflow-hidden mt-2" onClick={() => onUserClick(reel.user)}>
             <img src={reel.user.avatar} className="w-full h-full object-cover cursor-pointer" alt="user thumb" />
          </div>
        </div>
      </div>
    </div>
  );
}

export default ReelItem;
