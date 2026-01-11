import React, { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Blurhash } from "react-blurhash";

interface OptimizedImageProps extends React.ImgHTMLAttributes<HTMLImageElement> {
  fallbackColor?: string;
  imgClassName?: string;
  width?: number;
  height?: number;
  quality?: number;
  blurHash?: string;
}

const OptimizedImage: React.FC<OptimizedImageProps> = ({
  src,
  alt,
  className,
  imgClassName,
  fallbackColor,
  width: customWidth,
  height: customHeight,
  quality = 75,
  blurHash,
  ...props
}) => {
  const [isLoaded, setIsLoaded] = useState(false);
  const [error, setError] = useState(false);

  // Apply Supabase Image Transformation if it's a Supabase storage URL
  let optimizedSrc = src;
  if (src && src.includes("storage.v1/object/public/")) {
    const transformParams = [];
    if (customWidth) transformParams.push(`width=${customWidth}`);
    if (customHeight) transformParams.push(`height=${customHeight}`);
    transformParams.push(`quality=${quality}`);
    transformParams.push(`format=webp`); // WebP is smaller and better for web

    const separator = src.includes("?") ? "&" : "?";
    optimizedSrc = `${src}${separator}render=image&${transformParams.join("&")}`;
  }

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
            className={`absolute inset-0 z-10 ${bgColor} ${!blurHash ? "animate-pulse" : ""}`}
          >
            {blurHash && (
              <Blurhash
                hash={blurHash}
                width="100%"
                height="100%"
                resolutionX={32}
                resolutionY={32}
                punch={1}
              />
            )}
          </motion.div>
        )}
      </AnimatePresence>

      {/* Actual Image */}
      <img
        src={optimizedSrc}
        alt={alt}
        className={`w-full h-full transition-opacity duration-500 ${imgClassName || "object-cover"
          } ${isLoaded ? "opacity-100" : "opacity-0"}`}
        onLoad={() => setIsLoaded(true)}
        onError={() => setError(true)}
        loading="lazy"
        {...props}
      />

      {/* Error State */}
      {
        error && (
          <div className="absolute inset-0 flex items-center justify-center bg-zinc-100 dark:bg-zinc-900 text-zinc-400 text-xs">
            Load failed
          </div>
        )
      }
    </div >
  );
};

export default OptimizedImage;
