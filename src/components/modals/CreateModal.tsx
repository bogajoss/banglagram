import React, { useState } from "react";
import { ArrowLeft, X, MapPin, Video, Image as ImageIcon } from "lucide-react";
import { useAppStore } from "../../store/useAppStore";
import { motion } from "framer-motion";
import { useAuth } from "../../hooks/useAuth";
import { useCreatePost } from "../../hooks/mutations/useCreatePost";
import { useCreateReel } from "../../hooks/mutations/useCreateReel";

import OptimizedImage from "../OptimizedImage";

const CreateModal: React.FC = () => {
  const { theme, setCreateModalOpen, showToast } = useAppStore();
  const { user, profile } = useAuth();
  const buttonBg = "bg-[#006a4e] hover:bg-[#00523c]";
  const glassModal =
    theme === "dark"
      ? "bg-[#121212]/90 backdrop-blur-2xl border border-white/10"
      : "bg-white/90 backdrop-blur-2xl border border-black/10";

  const [file, setFile] = useState<File | null>(null);
  const [preview, setPreview] = useState<string | null>(null);
  const [caption, setCaption] = useState("");
  const [location, setLocation] = useState("");
  const [isVideo, setIsVideo] = useState(false);

  const { mutate: createPost, isPending: isPostPending } = useCreatePost();
  const { mutate: createReel, isPending: isReelPending } = useCreateReel();

  const isPending = isPostPending || isReelPending;

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const selected = e.target.files?.[0];
    if (selected) {
      setFile(selected);
      const isVid = selected.type.startsWith("video/");
      setIsVideo(isVid);
      setPreview(URL.createObjectURL(selected));
    }
  };

  const handleShare = () => {
    if (!file || !user || !profile) return;

    if (isVideo) {
      createReel(
        {
          file,
          caption,
          userId: user.id,
          username: profile.username,
        },
        {
          onSuccess: () => {
            showToast("রিল শেয়ার করা হয়েছে");
            setCreateModalOpen(false);
          },
          onError: () => showToast("রিল শেয়ার করতে সমস্যা হয়েছে"),
        },
      );
    } else {
      createPost(
        {
          file,
          caption,
          location,
          userId: user.id,
          username: profile.username,
        },
        {
          onSuccess: () => {
            showToast("পোস্ট শেয়ার করা হয়েছে");
            setCreateModalOpen(false);
          },
          onError: () => showToast("পোস্ট শেয়ার করতে সমস্যা হয়েছে"),
        },
      );
    }
  };

  const onClose = () => setCreateModalOpen(false);

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="fixed inset-0 z-[100] bg-black/60 flex items-center justify-center p-4"
      onClick={onClose}
    >
      <motion.div
        initial={{ scale: 0.9, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        exit={{ scale: 0.9, opacity: 0 }}
        className={`w-full max-w-4xl h-[70vh] md:h-[80vh] rounded-xl overflow-hidden shadow-2xl flex flex-col ${glassModal} ${theme === "dark" ? "text-white" : "text-black"}`}
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div
          className={`p-3 border-b text-center font-bold relative flex items-center justify-between ${theme === "dark" ? "border-zinc-800" : "border-zinc-200"}`}
        >
          <div className="w-10">
            {preview && (
              <ArrowLeft
                className="cursor-pointer"
                onClick={() => {
                  setPreview(null);
                  setFile(null);
                }}
              />
            )}
          </div>
          <span>
            {preview ? (isVideo ? "নতুন রিল" : "নতুন পোস্ট") : "তৈরি করুন"}
          </span>
          <div className="w-10 flex justify-end">
            {preview ? (
              <button
                onClick={handleShare}
                disabled={isPending}
                className="text-[#0095f6] text-sm font-bold hover:text-white disabled:opacity-50"
              >
                {isPending ? "শেয়ার হচ্ছে..." : "শেয়ার"}
              </button>
            ) : (
              <X className="cursor-pointer" onClick={onClose} />
            )}
          </div>
        </div>

        {/* Body */}
        <div className="flex-grow flex flex-col md:flex-row overflow-hidden">
          {/* Image/Video Section */}
          <div
            className={`flex-1 flex items-center justify-center bg-black relative ${preview ? "md:border-r border-zinc-800" : ""}`}
          >
            {preview ? (
              isVideo ? (
                <video
                  src={preview}
                  controls
                  className="max-h-full max-w-full"
                />
              ) : (
                <OptimizedImage
                  src={preview}
                  className="max-h-full max-w-full"
                  imgClassName="object-contain"
                  alt="preview"
                />
              )
            ) : (
              <div className="flex flex-col items-center gap-4">
                <div className="flex gap-4 mb-2">
                  <ImageIcon
                    size={40}
                    className={theme === "dark" ? "text-white" : "text-black"}
                  />
                  <Video
                    size={40}
                    className={theme === "dark" ? "text-white" : "text-black"}
                  />
                </div>
                <p className="text-xl font-light">
                  ফটো বা ভিডিও এখানে টেনে আনুন
                </p>
                <label
                  className={`${buttonBg} text-white px-4 py-2 rounded-lg text-sm font-semibold transition-colors cursor-pointer`}
                >
                  কম্পিউটার থেকে নির্বাচন করুন
                  <input
                    type="file"
                    className="hidden"
                    accept="image/*,video/*"
                    onChange={handleFileChange}
                  />
                </label>
              </div>
            )}
          </div>

          {/* Caption Section */}
          {preview && (
            <div
              className={`w-full md:w-[350px] flex flex-col ${theme === "dark" ? "bg-zinc-900" : "bg-white"}`}
            >
              <div className="p-4 flex items-center gap-3">
                <div className="w-8 h-8 rounded-full overflow-hidden">
                  <OptimizedImage
                    src={
                      user?.user_metadata?.avatar_url ||
                      "https://api.dicebear.com/9.x/avataaars/svg?seed=default"
                    }
                    className="w-full h-full"
                    alt="user"
                  />
                </div>
                <span className="font-semibold text-sm">
                  {user?.user_metadata?.username}
                </span>
              </div>
              <textarea
                className={`flex-grow p-4 bg-transparent outline-none resize-none text-sm ${theme === "dark" ? "placeholder-gray-500" : "placeholder-gray-400"}`}
                placeholder="ক্যাপশন লিখুন..."
                value={caption}
                onChange={(e) => setCaption(e.target.value)}
              />
              {!isVideo && (
                <div
                  className={`p-4 border-t ${theme === "dark" ? "border-zinc-800" : "border-zinc-200"}`}
                >
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-sm text-gray-400">
                      লোকেশন যোগ করুন
                    </span>
                    <MapPin size={16} className="text-gray-400" />
                  </div>
                  <input
                    type="text"
                    placeholder="লোকেশন"
                    className="w-full bg-transparent outline-none text-sm py-1"
                    value={location}
                    onChange={(e) => setLocation(e.target.value)}
                  />
                </div>
              )}
            </div>
          )}
        </div>
      </motion.div>
    </motion.div>
  );
};

export default CreateModal;
