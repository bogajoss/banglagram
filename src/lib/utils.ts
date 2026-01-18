import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export const generateVideoThumbnail = (file: File): Promise<File | null> => {
  return new Promise((resolve) => {
    const canvas = document.createElement("canvas");
    const video = document.createElement("video");

    // this is important
    video.autoplay = true;
    video.muted = true;
    video.playsInline = true;
    video.src = URL.createObjectURL(file);

    video.onloadeddata = () => {
      // Seek to 1s to avoid black frames
      video.currentTime = 1;
    };

    video.onseeked = () => {
      const ctx = canvas.getContext("2d");
      if (ctx) {
        canvas.width = video.videoWidth;
        canvas.height = video.videoHeight;
        ctx.drawImage(video, 0, 0, video.videoWidth, video.videoHeight);
        
        canvas.toBlob((blob) => {
            if (blob) {
                const thumbnailFile = new File([blob], "thumbnail.jpg", {
                    type: "image/jpeg",
                    lastModified: Date.now(),
                });
                resolve(thumbnailFile);
            } else {
                resolve(null);
            }
            URL.revokeObjectURL(video.src);
        }, "image/jpeg", 0.7);
      } else {
        resolve(null);
      }
    };
    
    video.onerror = () => {
        resolve(null);
    };
  });
};