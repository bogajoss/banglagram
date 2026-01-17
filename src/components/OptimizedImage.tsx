import React, { useState } from 'react';
import { ImageOff } from 'lucide-react';
import { Skeleton } from '@/components/ui/skeleton';

interface OptimizedImageProps extends React.ImgHTMLAttributes<HTMLImageElement> {
  fallbacknode?: React.ReactNode;
}

const OptimizedImage: React.FC<OptimizedImageProps> = ({ 
  src, 
  alt, 
  className, 
  fallbacknode,
  ...props 
}) => {
  const [error, setError] = useState(false);
  const [loading, setLoading] = useState(true);

  if (!src || error) {
    if (fallbacknode) return <>{fallbacknode}</>;
    
    return (
      <div className={`flex items-center justify-center bg-gray-100 dark:bg-zinc-800 text-gray-400 ${className}`}>
        <ImageOff size={24} />
      </div>
    );
  }

  return (
    <>
      {loading && (
        <Skeleton className={`absolute inset-0 ${className}`} />
      )}
      <img
        src={src}
        alt={alt}
        className={`${className} ${loading ? 'opacity-0' : 'opacity-100'} transition-opacity duration-300`}
        onError={() => {
            setError(true);
            setLoading(false);
        }}
        onLoad={() => setLoading(false)}
        {...props}
      />
    </>
  );
};

export default OptimizedImage;
