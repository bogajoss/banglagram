import React, { useState } from "react";
import { motion, AnimatePresence, type PanInfo } from "framer-motion";
import { ChevronLeft, ChevronRight } from "lucide-react";
import { cn } from "@/lib/utils";
import OptimizedImage from "./OptimizedImage";

interface ImageCarouselProps {
  images: string[];
  aspectRatio?: string; // e.g., "aspect-square", "aspect-[4/5]"
  className?: string;
  onDoubleClick?: () => void;
}

const ImageCarousel: React.FC<ImageCarouselProps> = ({
  images,
  aspectRatio = "aspect-square",
  className,
  onDoubleClick,
}) => {
  const [currentIndex, setCurrentIndex] = useState(0);
  const [direction, setDirection] = useState(0);

  // If only one image, just show it without carousel logic
  if (images.length <= 1) {
    return (
      <div
        className={cn("w-full relative overflow-hidden", aspectRatio, className)}
        onDoubleClick={onDoubleClick}
      >
        {images.length === 1 && (
          <OptimizedImage
            src={images[0]}
            className="w-full h-full object-cover"
            alt="Post content"
          />
        )}
      </div>
    );
  }

  const paginate = (newDirection: number) => {
    setDirection(newDirection);
    setCurrentIndex((prev) => {
      let next = prev + newDirection;
      if (next < 0) next = 0;
      if (next >= images.length) next = images.length - 1;
      return next;
    });
  };

  const handleDragEnd = (
    _e: MouseEvent | TouchEvent | PointerEvent,
    info: PanInfo
  ) => {
    const swipeThreshold = 50;
    if (info.offset.x < -swipeThreshold && currentIndex < images.length - 1) {
      paginate(1);
    } else if (info.offset.x > swipeThreshold && currentIndex > 0) {
      paginate(-1);
    }
  };

  const variants = {
    enter: (direction: number) => ({
      x: direction > 0 ? "100%" : "-100%",
      opacity: 1,
    }),
    center: {
      zIndex: 1,
      x: 0,
      opacity: 1,
    },
    exit: (direction: number) => ({
      zIndex: 0,
      x: direction < 0 ? "100%" : "-100%",
      opacity: 1,
    }),
  };

  return (
    <div
      className={cn(
        "w-full relative overflow-hidden group touch-pan-y",
        aspectRatio,
        className
      )}
      onDoubleClick={onDoubleClick}
    >
      <AnimatePresence initial={false} custom={direction} mode="popLayout">
        <motion.div
          key={currentIndex}
          custom={direction}
          variants={variants}
          initial="enter"
          animate="center"
          exit="exit"
          transition={{
            x: { type: "spring", stiffness: 300, damping: 30 },
            opacity: { duration: 0.2 },
          }}
          drag="x"
          dragConstraints={{ left: 0, right: 0 }}
          dragElastic={1}
          onDragEnd={handleDragEnd}
          className="absolute inset-0 w-full h-full"
        >
          <OptimizedImage
            src={images[currentIndex]}
            className="w-full h-full object-cover pointer-events-none" // prevent dragging the image element itself
            alt={`Slide ${currentIndex + 1}`}
          />
        </motion.div>
      </AnimatePresence>

      {/* Navigation Buttons (Instagram style) */}
      {currentIndex > 0 && (
        <button
          className="absolute left-2 top-1/2 -translate-y-1/2 bg-black/50 text-white p-1.5 rounded-full opacity-0 group-hover:opacity-100 transition-opacity z-10 hover:bg-black/70 backdrop-blur-sm"
          onClick={(e) => {
            e.stopPropagation();
            paginate(-1);
          }}
        >
          <ChevronLeft size={16} />
        </button>
      )}

      {currentIndex < images.length - 1 && (
        <button
          className="absolute right-2 top-1/2 -translate-y-1/2 bg-black/50 text-white p-1.5 rounded-full opacity-0 group-hover:opacity-100 transition-opacity z-10 hover:bg-black/70 backdrop-blur-sm"
          onClick={(e) => {
            e.stopPropagation();
            paginate(1);
          }}
        >
          <ChevronRight size={16} />
        </button>
      )}

      {/* Dots Indicator */}
      <div className="absolute bottom-4 left-0 right-0 flex justify-center gap-1.5 z-10 pointer-events-none">
        {images.map((_, idx) => (
          <div
            key={idx}
            className={cn(
              "w-1.5 h-1.5 rounded-full transition-all shadow-sm",
              idx === currentIndex
                ? "bg-white scale-125"
                : "bg-white/40"
            )}
          />
        ))}
      </div>

       {/* Count Indicator (Top Right) */}
        <div className="absolute top-4 right-4 bg-black/60 text-white text-xs px-2 py-1 rounded-full opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none z-10 backdrop-blur-sm">
            {currentIndex + 1}/{images.length}
        </div>
    </div>
  );
};

export default ImageCarousel;
