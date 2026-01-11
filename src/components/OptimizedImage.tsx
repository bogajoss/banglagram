import React, { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";

interface OptimizedImageProps extends React.ImgHTMLAttributes<HTMLImageElement> {
  fallbackColor?: string;
  imgClassName?: string;
}

const OptimizedImage: React.FC<OptimizedImageProps> = ({
  src,
  alt,
  className,
  imgClassName,
  fallbackColor,
  ...props
}) => {
  const [isLoaded, setIsLoaded] = useState(false);
  const [error, setError] = useState(false);

  const bgColor = fallbackColor || "bg-zinc-200 dark:bg-zinc-800";

  if (!src) {
    return (
        <div className={`relative overflow-hidden ${className} ${bgColor}`}>
            <div className="absolute inset-0 flex items-center justify-center text-zinc-400 text-xs">
                No Image
            </div>
        </div>
    );
  }

  return (
    <div className={`relative overflow-hidden ${className}`}>
      {/* Shimmer/Placeholder */}
      <AnimatePresence>
        {!isLoaded && !error && (
          <motion.div
            initial={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className={`absolute inset-0 z-10 ${bgColor} animate-pulse`}
          />
        )}
      </AnimatePresence>

      {/* Actual Image */}
      <img
        src={src}
        alt={alt}
        className={`w-full h-full transition-opacity duration-500 ${
          imgClassName || "object-cover"
        } ${isLoaded ? "opacity-100" : "opacity-0"}`}
        onLoad={() => setIsLoaded(true)}
        onError={() => setError(true)}
        loading="lazy"
        {...props}
      />

      {/* Error State */}
      {error && (
        <div className="absolute inset-0 flex items-center justify-center bg-zinc-100 dark:bg-zinc-900 text-zinc-400 text-xs">
          Load failed
        </div>
      )}
    </div>
  );
};

export default OptimizedImage;
