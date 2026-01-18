import React, { useRef, useState, useEffect } from "react";
import { Play, Volume2, VolumeX } from "lucide-react";
import { cn } from "@/lib/utils";
import { useInView } from "react-intersection-observer";

interface VideoPlayerProps {
  src: string;
  poster?: string;
  className?: string;
  videoClassName?: string;
  autoPlay?: boolean; // If true, tries to autoplay when in view
  controls?: boolean; // Whether to show custom controls
  loop?: boolean;
  muted?: boolean;
  onEnded?: () => void;
  onClick?: () => void;
}

const VideoPlayer: React.FC<VideoPlayerProps> = ({
  src,
  poster,
  className,
  videoClassName,
  autoPlay = true,
  controls = true,
  loop = true,
  muted = true,
  onEnded,
  onClick,
}) => {
  const videoRef = useRef<HTMLVideoElement>(null);
  const [isPlaying, setIsPlaying] = useState(false);
  const [isMuted, setIsMuted] = useState(muted);
  const [isLoaded, setIsLoaded] = useState(false);
  
  const { ref: inViewRef, inView } = useInView({
    threshold: 0.6,
  });

  // Combine refs
  const setRefs = (node: HTMLVideoElement) => {
    videoRef.current = node;
    inViewRef(node);
  };

  useEffect(() => {
    if (!videoRef.current) return;

    if (autoPlay && inView) {
      const playPromise = videoRef.current.play();
      if (playPromise !== undefined) {
        playPromise.catch((error) => {
          console.log("Autoplay blocked:", error);
        });
      }
    } else if (autoPlay && !inView) {
      videoRef.current.pause();
    }
  }, [inView, autoPlay, src]);

  const togglePlay = (e?: React.MouseEvent) => {
    e?.stopPropagation();
    if (videoRef.current) {
      if (videoRef.current.paused) {
        videoRef.current.play();
      } else {
        videoRef.current.pause();
      }
    }
    if (onClick) onClick();
  };

  const toggleMute = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (videoRef.current) {
      videoRef.current.muted = !isMuted;
      setIsMuted(!isMuted);
    }
  };

  return (
    <div className={cn("relative w-full h-full bg-black group", className)}>
      <video
        ref={setRefs}
        src={src}
        poster={poster}
        className={cn("w-full h-full", videoClassName || "object-cover")}
        loop={loop}
        muted={isMuted}
        playsInline
        onLoadedData={() => setIsLoaded(true)}
        onPlay={() => setIsPlaying(true)}
        onPause={() => setIsPlaying(false)}
        onEnded={() => {
            if(onEnded) onEnded();
        }}
        onClick={togglePlay}
      />

      {/* Loading State - could add spinner here if needed */}
      
      {controls && (
        <>
          {/* Center Play Button Overlay (only when paused) */}
          {!isPlaying && isLoaded && (
            <div 
                className="absolute inset-0 flex items-center justify-center bg-black/20 cursor-pointer z-10"
                onClick={togglePlay}
            >
              <div className="bg-black/50 p-4 rounded-full backdrop-blur-sm">
                <Play className="w-8 h-8 text-white fill-white ml-1" />
              </div>
            </div>
          )}

          {/* Mute Toggle (Top Right) */}
          <button
            onClick={toggleMute}
            className="absolute bottom-4 right-4 z-20 bg-black/50 p-2 rounded-full text-white hover:bg-black/70 transition-colors backdrop-blur-sm"
          >
            {isMuted ? <VolumeX size={20} /> : <Volume2 size={20} />}
          </button>
        </>
      )}
    </div>
  );
};

export default VideoPlayer;
