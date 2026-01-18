import React, { useState } from "react";
import { ArrowLeft, Loader2, ChevronRight, Hash, AtSign } from "lucide-react";
import { useAppStore } from "../../store/useAppStore";
import { useAuth } from "../../hooks/useAuth";
import { useCreatePost } from "../../hooks/mutations/useCreatePost";
import { useCreateReel } from "../../hooks/mutations/useCreateReel";
import { useCreateStory } from "../../hooks/mutations/useCreateStory";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Avatar, AvatarImage, AvatarFallback } from "@/components/ui/avatar";
import { cn } from "@/lib/utils";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";

import FileUploader from "../FileUploader";
import ImageCarousel from "../ImageCarousel";

const CreateModal: React.FC = () => {
  const { isCreateModalOpen, setCreateModalOpen, showToast } = useAppStore();
  const { user, profile } = useAuth();

  const [files, setFiles] = useState<File[]>([]);
  const [previews, setPreviews] = useState<string[]>([]);
  
  const [caption, setCaption] = useState("");
  const [isVideo, setIsVideo] = useState(false);
  const [createType, setCreateType] = useState<
    "post" | "reel" | "story" | null
  >(null);

  const { mutate: createPost, isPending: isPostPending } = useCreatePost();
  const { mutate: createReel, isPending: isReelPending } = useCreateReel();
  const { mutate: createStory, isPending: isStoryPending } = useCreateStory();

  const isPending = isPostPending || isReelPending || isStoryPending;

  const onFileSelect = (selectedFiles: File[]) => {
    if (selectedFiles && selectedFiles.length > 0) {
      setFiles(selectedFiles);
      const isVid = selectedFiles[0].type.startsWith("video/");
      setIsVideo(isVid);
      
      const newPreviews = selectedFiles.map(f => URL.createObjectURL(f));
      setPreviews(newPreviews);

      // Default type based on file
      if (isVid) {
        setCreateType("reel");
      } else {
        setCreateType("post");
      }
    }
  };

  const handleShare = async () => {
    if (files.length === 0 || !user || !profile) return;

    if (createType === "reel") {
      createReel(
        { file: files[0], caption, userId: user.id, username: profile.username },
        {
          onSuccess: () => {
            showToast("Reel shared");
            setCreateModalOpen(false);
            resetForm();
          },
          onError: () => showToast("Failed to share reel"),
        },
      );
    } else if (createType === "story") {
      createStory(
        { file: files[0], userId: user.id },
        {
          onSuccess: () => {
            showToast("Story shared");
            setCreateModalOpen(false);
            resetForm();
          },
          onError: () => showToast("Failed to share story"),
        },
      );
    } else {
      createPost(
        { files, caption, userId: user.id, username: profile.username },
        {
          onSuccess: () => {
            showToast("Post shared");
            setCreateModalOpen(false);
            resetForm();
          },
          onError: () => showToast("Failed to share post"),
        },
      );
    }
  };

  const resetForm = () => {
    setFiles([]);
    setPreviews([]);
    setCaption("");
    setIsVideo(false);
    setCreateType(null);
  };

  const handleOpenChange = (open: boolean) => {
    if (!open) {
      setCreateModalOpen(false);
      if (!isPending) resetForm();
    }
  };

  return (
    <Dialog open={isCreateModalOpen} onOpenChange={handleOpenChange}>
      <DialogContent className="max-w-5xl h-[85vh] p-0 overflow-hidden flex flex-col gap-0 border-none sm:rounded-2xl">
        <DialogHeader className="px-4 h-14 border-b flex flex-row items-center justify-between shrink-0 space-y-0">
          <div className="w-20 flex justify-start">
            {previews.length > 0 && (
              <Button
                variant="ghost"
                size="icon"
                className="-ml-2"
                onClick={() => {
                  setPreviews([]);
                  setFiles([]);
                  setCreateType(null);
                }}
              >
                <ArrowLeft className="h-6 w-6" />
              </Button>
            )}
          </div>

          <DialogTitle className="font-semibold text-lg text-center flex-grow">
            {previews.length > 0
              ? createType === "reel"
                ? "New Reel"
                : createType === "story"
                  ? "New Story"
                  : "New Post"
              : "Create New Post"}
          </DialogTitle>

          <div className="w-20 flex justify-end">
            {previews.length > 0 && (
              <Button
                variant="ghost"
                onClick={handleShare}
                disabled={isPending}
                className="text-blue-500 hover:text-blue-600 hover:bg-blue-500/10 font-semibold px-2"
              >
                {isPending ? (
                  <Loader2 className="h-5 w-5 animate-spin" />
                ) : (
                  "Share"
                )}
              </Button>
            )}
          </div>
        </DialogHeader>

        {/* Body */}
        <div className="flex-grow flex flex-col md:flex-row overflow-hidden">
          {/* Left: Media Preview */}
          <div
            className={cn(
              "flex-1 bg-black relative flex items-center justify-center overflow-hidden",
              previews.length > 0 ? "md:border-r border-border" : "",
            )}
          >
            {previews.length > 0 ? (
              <div className="relative w-full h-full flex items-center justify-center bg-[#1a1a1a]">
                {isVideo ? (
                  <video
                    src={previews[0]}
                    controls
                    className="max-h-full max-w-full object-contain"
                  />
                ) : (
                    <ImageCarousel 
                        images={previews}
                        className="w-full h-full bg-black"
                        aspectRatio="max-h-full max-w-full"
                    />
                )}
              </div>
            ) : (
              <div className="w-full h-full p-8 flex flex-col items-center justify-center bg-background">
                <FileUploader onFileSelect={onFileSelect} multiple={true} />
              </div>
            )}
          </div>

          {/* Right: Details Form */}
          {previews.length > 0 && (
            <div className="w-full md:w-[400px] flex flex-col bg-background">
              {/* User Profile Row */}
              <div className="p-4 flex items-center gap-3">
                <Avatar className="w-10 h-10 border border-border">
                  <AvatarImage src={profile?.avatar_url || ""} />
                  <AvatarFallback>
                    {profile?.username?.[0]?.toUpperCase()}
                  </AvatarFallback>
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
                      className="w-full min-h-[120px] bg-transparent border-none focus-visible:ring-0 resize-none text-base p-1 placeholder:text-muted-foreground/50"
                      placeholder="Write a caption..."
                      value={caption}
                      onChange={(e) => setCaption(e.target.value)}
                    />
                  </div>

                  <div className="h-px w-full bg-border" />

                  {/* Meta Options List */}
                  <div className="flex flex-col">
                    <div className="px-4 py-3 flex items-center justify-between cursor-pointer hover:bg-accent/50 transition-colors border-b border-border/50">
                      <div className="flex items-center gap-3 text-sm">
                        <AtSign size={20} className="text-muted-foreground" />
                        <span>Tag People</span>
                      </div>
                      <ChevronRight
                        size={16}
                        className="text-muted-foreground"
                      />
                    </div>

                    <div className="px-4 py-3 flex items-center justify-between cursor-pointer hover:bg-accent/50 transition-colors border-b border-border/50">
                      <div className="flex items-center gap-3 text-sm">
                        <Hash size={20} className="text-muted-foreground" />
                        <span>Add Topics</span>
                      </div>
                      <ChevronRight
                        size={16}
                        className="text-muted-foreground"
                      />
                    </div>
                  </div>
                </div>
              ) : (
                <div className="flex-grow flex items-center justify-center p-8 text-center text-muted-foreground">
                  <p className="text-sm">
                    Stories are visible for 24 hours. Captions are not supported
                    on stories yet.
                  </p>
                </div>
              )}

              {/* Bottom Type Selector */}
              <div className="p-4 border-t border-border">
                <div className="grid grid-cols-2 gap-2 bg-muted/50 p-1 rounded-lg">
                  {!isVideo && (
                    <button
                      onClick={() => setCreateType("post")}
                      className={cn(
                        "text-sm font-semibold py-2 rounded-md transition-all",
                        createType === "post"
                          ? "bg-background text-foreground shadow-sm"
                          : "text-muted-foreground hover:text-foreground",
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
                        : "text-muted-foreground hover:text-foreground",
                    )}
                  >
                    {isVideo ? "Reel" : "Story"}
                  </button>
                </div>
              </div>
            </div>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default CreateModal;
