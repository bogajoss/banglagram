import React, { useState } from "react";
import { ArrowLeft, X, MapPin, Loader2, Edit2 } from "lucide-react";
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
import MediaEditor from "../media-editor/MediaEditor";

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

  const [isEditingMedia, setIsEditingMedia] = useState(false);

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
      } else {
        setCreateType("post");
      }
    }
  };

  const handleShare = async () => {
    if (!file || !user || !profile) return;

    let fileToUpload = file;
    // Cropping is handled by MediaEditor destructively, no need for extra logic here

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

  const onMediaSaved = (editedFile: File) => {
    setFile(editedFile);
    setPreview(URL.createObjectURL(editedFile)); // Revoke old url if needed in prod
    setIsEditingMedia(false);
  };

  return (
    <>
      {isEditingMedia && file && (
        <MediaEditor
          file={file}
          onSave={onMediaSaved}
          onCancel={() => setIsEditingMedia(false)}
        />
      )}

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
                <div className="relative w-full h-full flex items-center justify-center">
                  {isVideo ? (
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
                  )}

                  {/* Edit Button Overlay */}
                  <Button
                    size="icon"
                    className="absolute bottom-4 right-4 rounded-full bg-black/50 hover:bg-black/70 text-white z-10"
                    onClick={() => setIsEditingMedia(true)}
                  >
                    <Edit2 size={20} />
                  </Button>
                </div>
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
    </>
  );
};

export default CreateModal;
