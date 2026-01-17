import React, { useState } from "react";
import { ArrowLeft, X, MapPin, Loader2, Edit2, ChevronRight, Hash, AtSign } from "lucide-react";
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
import { cn } from "@/lib/utils";

import OptimizedImage from "../OptimizedImage";
import FileUploader from "../FileUploader";
import MediaEditor from "../media-editor/MediaEditor";

const CreateModal: React.FC = () => {
  const { theme, setCreateModalOpen, showToast } = useAppStore();
  const { user, profile } = useAuth();
  
  // Professional glass effect for modal
  const glassModal = theme === "dark"
      ? "bg-[#121212] md:bg-[#121212]/95 md:backdrop-blur-xl md:border md:border-zinc-800"
      : "bg-white md:bg-white/95 md:backdrop-blur-xl md:border md:border-zinc-200";

  const [file, setFile] = useState<File | null>(null);
  const [preview, setPreview] = useState<string | null>(null);
  const [caption, setCaption] = useState("");
  const [location, setLocation] = useState("");
  const [isVideo, setIsVideo] = useState(false);
  const [createType, setCreateType] = useState<"post" | "reel" | "story" | null>(null);

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

    if (createType === "reel") {
      createReel(
        { file, caption, userId: user.id, username: profile.username },
        {
          onSuccess: () => { showToast("Reel shared"); setCreateModalOpen(false); },
          onError: () => showToast("Failed to share reel"),
        },
      );
    } else if (createType === "story") {
      createStory(
        { file, userId: user.id },
        {
          onSuccess: () => { showToast("Story shared"); setCreateModalOpen(false); },
          onError: () => showToast("Failed to share story"),
        },
      );
    } else {
      createPost(
        { file, caption, location, userId: user.id, username: profile.username },
        {
          onSuccess: () => { showToast("Post shared"); setCreateModalOpen(false); },
          onError: () => showToast("Failed to share post"),
        },
      );
    }
  };

  const onClose = () => setCreateModalOpen(false);

  const onMediaSaved = (editedFile: File) => {
    setFile(editedFile);
    setPreview(URL.createObjectURL(editedFile));
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
        className="fixed inset-0 z-[100] bg-black/80 flex items-center justify-center md:p-4"
        onClick={onClose}
      >
        <motion.div
          initial={{ scale: 0.95, opacity: 0, y: 20 }}
          animate={{ scale: 1, opacity: 1, y: 0 }}
          exit={{ scale: 0.95, opacity: 0, y: 20 }}
          className={`w-full h-full md:w-full md:max-w-5xl md:h-[85vh] md:rounded-2xl overflow-hidden shadow-2xl flex flex-col ${glassModal} ${theme === "dark" ? "text-white" : "text-black"}`}
          onClick={(e) => e.stopPropagation()}
        >

          {/* Header */}
          <div className={cn(
            "px-4 h-14 border-b flex items-center justify-between shrink-0",
            theme === "dark" ? "border-zinc-800" : "border-zinc-200"
          )}>
            <div className="w-20 flex justify-start">
              {preview ? (
                <Button
                  variant="ghost"
                  size="icon"
                  className="-ml-2"
                  onClick={() => {
                    setPreview(null);
                    setFile(null);
                    setCreateType(null);
                  }}
                >
                  <ArrowLeft className="h-6 w-6" />
                </Button>
              ) : (
                <Button variant="ghost" size="icon" className="-ml-2" onClick={onClose}>
                  <X className="h-6 w-6" />
                </Button>
              )}
            </div>
            
            <span className="font-semibold text-lg">
              {preview
                ? createType === "reel" ? "New Reel" : createType === "story" ? "New Story" : "New Post"
                : "Create"}
            </span>
            
            <div className="w-20 flex justify-end">
              {preview && (
                <Button
                  variant="ghost"
                  onClick={handleShare}
                  disabled={isPending}
                  className="text-blue-500 hover:text-blue-600 hover:bg-blue-500/10 font-semibold px-2"
                >
                  {isPending ? <Loader2 className="h-5 w-5 animate-spin" /> : "Share"}
                </Button>
              )}
            </div>
          </div>

          {/* Body */}
          <div className="flex-grow flex flex-col md:flex-row overflow-hidden">
            
            {/* Left: Media Preview */}
            <div className={cn(
              "flex-1 bg-black relative flex items-center justify-center overflow-hidden",
              preview ? "md:border-r border-zinc-800" : ""
            )}>
              {preview ? (
                <div className="relative w-full h-full flex items-center justify-center bg-[#1a1a1a]">
                   {isVideo ? (
                    <video
                      src={preview}
                      controls
                      className="max-h-full max-w-full object-contain"
                    />
                  ) : (
                    <OptimizedImage
                      src={preview}
                      className="max-h-full max-w-full"
                      imgClassName="object-contain"
                      alt="preview"
                    />
                  )}

                  {/* Edit Button (Floating) */}
                  {!isVideo && (
                    <Button
                      size="icon"
                      className="absolute bottom-4 right-4 rounded-full bg-black/50 hover:bg-black/70 text-white backdrop-blur-md border border-white/10 shadow-lg h-12 w-12"
                      onClick={() => setIsEditingMedia(true)}
                    >
                      <Edit2 size={20} />
                    </Button>
                  )}
                </div>
              ) : (
                <div className="w-full h-full p-8 flex flex-col items-center justify-center">
                  <FileUploader onFileSelect={onFileSelect} />
                </div>
              )}
            </div>

            {/* Right: Details Form */}
            {preview && (
              <div className={cn(
                "w-full md:w-[400px] flex flex-col bg-background/50 backdrop-blur-sm",
                 theme === "dark" ? "bg-[#121212]" : "bg-white"
              )}>
                
                {/* User Profile Row */}
                <div className="p-4 flex items-center gap-3">
                  <Avatar className="w-10 h-10 border border-border">
                    <AvatarImage src={profile?.avatar_url || ""} />
                    <AvatarFallback>{profile?.username?.[0]?.toUpperCase()}</AvatarFallback>
                  </Avatar>
                  <span className="font-semibold text-sm">
                    {profile?.username}
                  </span>
                </div>

                {createType !== "story" ? (
                  <div className="flex-grow flex flex-col overflow-y-auto">
                    {/* Caption Input */}
                    <div className="px-4 pb-4">
                        <Textarea
                          className="w-full min-h-[120px] bg-transparent border-none focus-visible:ring-0 resize-none text-base p-0 placeholder:text-muted-foreground/50"
                          placeholder="Write a caption..."
                          value={caption}
                          onChange={(e) => setCaption(e.target.value)}
                        />
                    </div>

                    <div className={cn("h-px w-full", theme === "dark" ? "bg-zinc-800" : "bg-zinc-100")} />

                    {/* Meta Options List */}
                    <div className="flex flex-col">
                        {!isVideo && (
                            <div className="px-4 py-3 flex items-center justify-between cursor-pointer hover:bg-accent/50 transition-colors border-b border-border/50">
                                <div className="flex items-center gap-3 text-sm">
                                    <MapPin size={20} className="text-muted-foreground" />
                                    <Input 
                                        type="text" 
                                        placeholder="Add Location" 
                                        value={location}
                                        onChange={(e) => setLocation(e.target.value)}
                                        className="border-none bg-transparent h-auto p-0 focus-visible:ring-0 placeholder:text-foreground/80"
                                    />
                                </div>
                                <ChevronRight size={16} className="text-muted-foreground" />
                            </div>
                        )}
                        
                        <div className="px-4 py-3 flex items-center justify-between cursor-pointer hover:bg-accent/50 transition-colors border-b border-border/50">
                             <div className="flex items-center gap-3 text-sm">
                                <AtSign size={20} className="text-muted-foreground" />
                                <span>Tag People</span>
                            </div>
                             <ChevronRight size={16} className="text-muted-foreground" />
                        </div>

                         <div className="px-4 py-3 flex items-center justify-between cursor-pointer hover:bg-accent/50 transition-colors border-b border-border/50">
                             <div className="flex items-center gap-3 text-sm">
                                <Hash size={20} className="text-muted-foreground" />
                                <span>Add Topics</span>
                            </div>
                             <ChevronRight size={16} className="text-muted-foreground" />
                        </div>
                    </div>
                  </div>
                ) : (
                   <div className="flex-grow flex items-center justify-center p-8 text-center text-muted-foreground">
                    <p className="text-sm">
                      Stories are visible for 24 hours. Captions and locations are not supported on stories yet.
                    </p>
                  </div>
                )}

                {/* Bottom Type Selector */}
                <div className={cn(
                    "p-4 border-t",
                    theme === "dark" ? "border-zinc-800" : "border-zinc-200"
                )}>
                    <div className="grid grid-cols-2 gap-2 bg-muted/50 p-1 rounded-lg">
                         {!isVideo && (
                            <button
                                onClick={() => setCreateType("post")}
                                className={cn(
                                    "text-sm font-semibold py-2 rounded-md transition-all",
                                    createType === "post" 
                                        ? "bg-background text-foreground shadow-sm" 
                                        : "text-muted-foreground hover:text-foreground"
                                )}
                            >
                                Post
                            </button>
                         )}
                         <button
                            onClick={() => setCreateType(isVideo ? "reel" : "story")}
                             className={cn(
                                    "text-sm font-semibold py-2 rounded-md transition-all",
                                    createType === (isVideo ? "reel" : "story")
                                        ? "bg-background text-foreground shadow-sm" 
                                        : "text-muted-foreground hover:text-foreground"
                                )}
                         >
                            {isVideo ? "Reel" : "Story"}
                         </button>
                    </div>
                </div>

              </div>
            )}
          </div>
        </motion.div>
      </motion.div>
    </>
  );
};

export default CreateModal;