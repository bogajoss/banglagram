import React, { useState, useMemo } from "react";
import { useAppStore } from "../../store/useAppStore";
import { useUpdatePost } from "../../hooks/mutations/useUpdatePost";
import type { Post } from "../../types";
import { Avatar, AvatarImage, AvatarFallback } from "@/components/ui/avatar";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { ChevronLeft, ChevronRight } from "lucide-react";
import { cn } from "@/lib/utils";

interface EditPostModalProps {
  post: Post;
  onClose: () => void;
}

import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormMessage,
} from "@/components/ui/form";
import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import * as z from "zod";

const editPostSchema = z.object({
  caption: z.string().min(1, "Caption cannot be empty").max(2200),
});

type EditPostFormValues = z.infer<typeof editPostSchema>;

const EditPostModal: React.FC<EditPostModalProps> = ({ post, onClose }) => {
  const { showToast } = useAppStore();
  const { mutate: updatePost, isPending } = useUpdatePost();
  const [currentImageIndex, setCurrentImageIndex] = useState(0);

  const form = useForm<EditPostFormValues>({
    resolver: zodResolver(editPostSchema),
    defaultValues: {
      caption: post.caption || "",
    },
  });

  const onSubmit = (values: EditPostFormValues) => {
    updatePost(
      { postId: post.id, caption: values.caption },
      {
        onSuccess: () => {
          showToast("Post updated");
          onClose();
        },
        onError: () => showToast("Failed to update post"),
      },
    );
  };
  
    const mediaList = useMemo(() => {
        if (post.content.type === "video") return [];
        const src = post.content.src;
        if (!src) return [];
        try {
            if (src.startsWith("[")) {
                return JSON.parse(src) as string[];
            }
            return [src];
        } catch (e) {
            return [src];
        }
    }, [post.content.src, post.content.type]);
    
    const nextImage = (e: React.MouseEvent) => {
        e.stopPropagation();
        e.preventDefault();
        if (currentImageIndex < mediaList.length - 1) {
            setCurrentImageIndex(prev => prev + 1);
        }
    };

    const prevImage = (e: React.MouseEvent) => {
        e.stopPropagation();
        e.preventDefault();
        if (currentImageIndex > 0) {
            setCurrentImageIndex(prev => prev - 1);
        }
    };

  return (
    <Dialog open={true} onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="max-w-2xl p-0 overflow-hidden border-none sm:rounded-xl">
        <div className="flex flex-col md:flex-row h-full">
          {/* Media Preview (Left/Top) */}
          <div className="md:w-1/2 bg-black flex items-center justify-center relative aspect-square md:aspect-auto group">
            {post.content.type === "video" ? (
              <video src={post.content.src} className="max-h-full max-w-full" />
            ) : (
                <>
                  <img
                    src={mediaList[currentImageIndex] || post.content.poster}
                    className="max-h-full max-w-full object-contain"
                    alt="preview"
                    loading="lazy"
                  />
                  
                   {/* Navigation Buttons */}
                    {mediaList.length > 1 && (
                        <>
                            {currentImageIndex > 0 && (
                                <button 
                                    onClick={prevImage}
                                    className="absolute left-2 top-1/2 -translate-y-1/2 p-1.5 bg-black/50 rounded-full text-white opacity-0 group-hover:opacity-100 transition-opacity"
                                >
                                    <ChevronLeft size={20} />
                                </button>
                            )}
                            
                            {currentImageIndex < mediaList.length - 1 && (
                                <button 
                                    onClick={nextImage}
                                    className="absolute right-2 top-1/2 -translate-y-1/2 p-1.5 bg-black/50 rounded-full text-white opacity-0 group-hover:opacity-100 transition-opacity"
                                >
                                    <ChevronRight size={20} />
                                </button>
                            )}
                            
                            {/* Dots */}
                            <div className="absolute bottom-2 left-0 right-0 flex justify-center gap-1.5 pointer-events-none">
                                {mediaList.map((_, idx) => (
                                    <div 
                                        key={idx}
                                        className={cn(
                                            "w-1.5 h-1.5 rounded-full transition-colors shadow-sm",
                                            idx === currentImageIndex ? "bg-white" : "bg-white/40"
                                        )}
                                    />
                                ))}
                            </div>
                        </>
                    )}
                </>
            )}
          </div>

          {/* Edit Form (Right/Bottom) */}
          <div className="md:w-1/2 flex flex-col bg-background">
            <Form {...form}>
              <form
                onSubmit={form.handleSubmit(onSubmit)}
                className="flex flex-col h-full"
              >
                <DialogHeader className="p-3 border-b flex flex-row justify-between items-center space-y-0">
                  <DialogTitle className="font-semibold text-sm">
                    Edit Info
                  </DialogTitle>
                  <Button
                    type="submit"
                    variant="ghost"
                    disabled={isPending}
                    className="text-[#0095f6] font-bold text-sm hover:bg-transparent h-auto p-0"
                  >
                    {isPending ? "Saving..." : "Done"}
                  </Button>
                </DialogHeader>

                <div className="p-4 flex items-center gap-3">
                  <Avatar className="w-8 h-8">
                    <AvatarImage src={post.user.avatar} />
                    <AvatarFallback>
                      {post.user.username?.[0]?.toUpperCase() || "?"}
                    </AvatarFallback>
                  </Avatar>
                  <span className="font-semibold text-sm">
                    {post.user.username}
                  </span>
                </div>

                <FormField
                  control={form.control}
                  name="caption"
                  render={({ field }) => (
                    <FormItem className="flex-grow">
                      <FormControl>
                        <textarea
                          {...field}
                          className="w-full h-full p-4 bg-transparent outline-none resize-none text-sm placeholder:text-muted-foreground"
                          placeholder="Write a caption..."
                          rows={6}
                        />
                      </FormControl>
                      <FormMessage className="px-4" />
                    </FormItem>
                  )}
                />

                <div className="p-4 flex justify-end">
                  <Button
                    type="button"
                    variant="ghost"
                    onClick={onClose}
                    className="text-sm font-semibold h-auto p-0 hover:bg-transparent"
                  >
                    Cancel
                  </Button>
                </div>
              </form>
            </Form>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default EditPostModal;
