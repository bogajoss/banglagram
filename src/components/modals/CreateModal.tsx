import React, { useState } from "react";
import { ArrowLeft, X, MapPin, Loader2 } from "lucide-react";
import { useAppStore } from "../../store/useAppStore";
import { motion } from "framer-motion";
import { useAuth } from "../../hooks/useAuth";
import { useCreatePost } from "../../hooks/mutations/useCreatePost";
import { useCreateReel } from "../../hooks/mutations/useCreateReel";
import { useCreateStory } from "../../hooks/mutations/useCreateStory";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Avatar, AvatarImage, AvatarFallback } from "@/components/ui/avatar";

import OptimizedImage from "../OptimizedImage";
import FileUploader from "../FileUploader";
import ImageCropper from "../ImageCropper";
import { getCroppedImg } from "../../lib/cropImage";
import type { Area } from "react-easy-crop";

const CreateModal: React.FC = () => {
  const { theme, setCreateModalOpen, showToast } = useAppStore();
  const { user, profile } = useAuth();

  const glassModal =
    theme === "dark"
      ? "bg-[#121212]/90 backdrop-blur-2xl border border-white/10"
      : "bg-white/90 backdrop-blur-2xl border border-black/10";

  const [file, setFile] = useState<File | null>(null);
  const [preview, setPreview] = useState<string | null>(null);
  const [caption, setCaption] = useState("");
  const [location, setLocation] = useState("");
  const [isVideo, setIsVideo] = useState(false);
  const [createType, setCreateType] = useState<"post" | "reel" | "story" | null>(
    null,
  );
  const [croppedAreaPixels, setCroppedAreaPixels] = useState<Area | null>(null);
  const [isCropping, setIsCropping] = useState(false);

  const { mutate: createPost, isPending: isPostPending } = useCreatePost();
  const { mutate: createReel, isPending: isReelPending } = useCreateReel();
  const { mutate: createStory, isPending: isStoryPending } = useCreateStory();

  const isPending = isPostPending || isReelPending || isStoryPending;

  const onFileSelect = (selected: File) => {
    if (selected) {
      setFile(selected);
      const isVid = selected.type.startsWith("video/");
      setIsVideo(isVid);
      setPreview(URL.createObjectURL(selected));
      // Default type based on file
      if (isVid) {
        setCreateType("reel");
        setIsCropping(false);
      } else {
        setCreateType("post");
        setIsCropping(true); // Start cropping for images
      }
    }
  };

  const handleShare = async () => {
    if (!file || !user || !profile) return;

    let fileToUpload = file;

    if (createType === "post" && !isVideo && croppedAreaPixels && preview) {
      try {
        const croppedBlob = await getCroppedImg(preview, croppedAreaPixels);
        if (croppedBlob) {
          fileToUpload = new File([croppedBlob], file.name, { type: "image/jpeg" });
        }
      } catch (e) {
        console.error("Crop failed", e);
      }
    }

    if (createType === "reel") {
      createReel(
        {
          file: fileToUpload,
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
    } else if (createType === "story") {
      createStory(
        {
          file: fileToUpload,
          userId: user.id,
        },
        {
          onSuccess: () => {
            showToast("স্টোরি শেয়ার করা হয়েছে");
            setCreateModalOpen(false);
          },
          onError: () => showToast("স্টোরি শেয়ার করতে সমস্যা হয়েছে"),
        },
      );
    } else {
      createPost(
        {
          file: fileToUpload,
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
        className={`w-full max-w-4xl h-full md:h-[80vh] md:rounded-xl overflow-hidden shadow-2xl flex flex-col ${glassModal} ${theme === "dark" ? "text-white" : "text-black"}`}
        onClick={(e) => e.stopPropagation()}
      >

        {/* Header */}
        <div
          className={`p-3 border-b text-center font-bold relative flex items-center justify-between ${theme === "dark" ? "border-zinc-800" : "border-zinc-200"}`}
        >
          <div className="w-10">
            {preview && (
              <Button
                variant="ghost"
                size="icon"
                onClick={() => {
                  setPreview(null);
                  setFile(null);
                  setCreateType(null);
                }}
              >
                <ArrowLeft className="h-5 w-5" />
              </Button>
            )}
          </div>
          <span>
            {preview
              ? createType === "reel"
                ? "নতুন রিল"
                : createType === "story"
                  ? "নতুন স্টোরি"
                  : "নতুন পোস্ট"
              : "তৈরি করুন"}
          </span>
          <div className="w-10 flex justify-end">
            {preview ? (
              <Button
                variant="ghost"
                onClick={handleShare}
                disabled={isPending}
                className="text-[#0095f6] hover:text-[#0095f6] hover:bg-transparent p-0 h-auto font-bold"
              >
                {isPending ? <Loader2 className="h-4 w-4 animate-spin" /> : "শেয়ার"}
              </Button>
            ) : (
              <Button variant="ghost" size="icon" onClick={onClose}>
                <X className="h-5 w-5" />
              </Button>
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
                <div className="w-full h-full flex items-center justify-center">
                  {!isVideo && isCropping ? (
                    <ImageCropper
                      imageSrc={preview}
                      onCropComplete={setCroppedAreaPixels}
                    />
                  ) : (
                    <OptimizedImage
                      src={preview}
                      className="max-h-full max-w-full"
                      imgClassName="object-contain"
                      alt="preview"
                    />
                  )}
                </div>
              )
            ) : (
              <div className="w-full h-full p-6">
                <FileUploader onFileSelect={onFileSelect} />
              </div>
            )}
          </div>

          {/* Type & Detail Section */}
          {preview && (
            <div
              className={`w-full md:w-[350px] flex flex-col ${theme === "dark" ? "bg-zinc-900" : "bg-white"}`}
            >
              {/* Type Selector */}
              <div
                className={`p-4 border-b flex gap-2 ${theme === "dark" ? "border-zinc-800" : "border-zinc-200"}`}
              >
                {!isVideo && (
                  <Button
                    variant={createType === "post" ? "default" : "outline"}
                    size="sm"
                    onClick={() => setCreateType("post")}
                    className={`flex-1 text-xs font-bold ${createType === "post" ? "bg-[#006a4e] hover:bg-[#00523c]" : "bg-transparent"}`}
                  >
                    পোস্ট
                  </Button>
                )}
                <Button
                  variant={createType === (isVideo ? "reel" : "story") ? "default" : "outline"}
                  size="sm"
                  onClick={() => setCreateType(isVideo ? "reel" : "story")}
                  className={`flex-1 text-xs font-bold ${createType === (isVideo ? "reel" : "story") ? "bg-[#006a4e] hover:bg-[#00523c]" : "bg-transparent"}`}
                >
                  {isVideo ? "রিল" : "স্টোরি"}
                </Button>
              </div>

              <div className="p-4 flex items-center gap-3">
                <Avatar className="w-8 h-8">
                  <AvatarImage src={profile?.avatar_url || ""} />
                  <AvatarFallback>{profile?.username?.[0]?.toUpperCase()}</AvatarFallback>
                </Avatar>
                <span className="font-semibold text-sm">
                  {profile?.username}
                </span>
              </div>

              {createType !== "story" && (
                <>
                  <Textarea
                    className="flex-grow p-4 bg-transparent outline-none resize-none text-sm border-none focus-visible:ring-0"
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
                      <Input
                        type="text"
                        placeholder="লোকেশন"
                        className="w-full bg-transparent outline-none text-sm py-1 border-none focus-visible:ring-0 h-auto p-0"
                        value={location}
                        onChange={(e) => setLocation(e.target.value)}
                      />
                    </div>
                  )}
                </>
              )}

              {createType === "story" && (
                <div className="flex-grow flex items-center justify-center p-8 text-center">
                  <p className="text-sm text-zinc-500">
                    স্টোরি ২৪ ঘন্টার জন্য দৃশ্যমান থাকবে। স্টোরিতে কোনো ক্যাপশন
                    বা লোকেশন যোগ করা যায় না।
                  </p>
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
