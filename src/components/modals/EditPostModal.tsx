import React, { useState } from "react";
import { useAppStore } from "../../store/useAppStore";
import { useUpdatePost } from "../../hooks/mutations/useUpdatePost";
import { motion } from "framer-motion";
import type { Post } from "../../types";
import OptimizedImage from "../OptimizedImage";

interface EditPostModalProps {
  post: Post;
  onClose: () => void;
  theme: string;
  glassModal: string;
}

const EditPostModal: React.FC<EditPostModalProps> = ({
  post,
  onClose,
  theme,
  glassModal,
}) => {
  const { showToast } = useAppStore();
  const [caption, setCaption] = useState(post.caption || "");

  const { mutate: updatePost, isPending } = useUpdatePost();

  const handleSave = () => {
    if (!caption.trim()) {
      showToast("ক্যাপশন খালি রাখা যাবে না");
      return;
    }

    updatePost(
      { postId: post.id, caption },
      {
        onSuccess: () => {
          showToast("পোস্ট আপডেট করা হয়েছে");
          onClose();
        },
        onError: () => showToast("আপডেট করতে সমস্যা হয়েছে"),
      }
    );
  };

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="fixed inset-0 z-[110] bg-black/60 flex items-center justify-center p-4"
      onClick={onClose}
    >
      <motion.div
        initial={{ scale: 0.95, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        exit={{ scale: 0.95, opacity: 0 }}
        className={`w-full max-w-2xl rounded-xl overflow-hidden shadow-2xl flex flex-col md:flex-row ${glassModal} ${theme === "dark" ? "text-white" : "text-black"}`}
        onClick={(e) => e.stopPropagation()}
      >
        {/* Media Preview (Left/Top) */}
        <div className="md:w-1/2 bg-black flex items-center justify-center relative aspect-square md:aspect-auto">
           {post.content.type === "video" ? (
             <video src={post.content.src} className="max-h-full max-w-full" />
           ) : (
             <OptimizedImage 
                src={post.content.src || post.content.poster} 
                className="max-h-full max-w-full"
                imgClassName="object-contain"
                alt="preview"
             />
           )}
        </div>

        {/* Edit Form (Right/Bottom) */}
        <div className={`md:w-1/2 flex flex-col ${theme === "dark" ? "bg-zinc-900" : "bg-white"}`}>
          <div className={`p-3 border-b flex justify-between items-center ${theme === "dark" ? "border-zinc-800" : "border-zinc-200"}`}>
            <span className="font-semibold text-sm">এডিট ইনফো</span>
            <button 
                onClick={handleSave} 
                disabled={isPending}
                className="text-[#0095f6] font-bold text-sm hover:text-white disabled:opacity-50"
            >
                {isPending ? "সেভ হচ্ছে..." : "সম্পন্ন"}
            </button>
          </div>

          <div className="p-4 flex items-center gap-3">
            <div className="w-8 h-8 rounded-full overflow-hidden">
                <OptimizedImage src={post.user.avatar} className="w-full h-full" alt={post.user.username} />
            </div>
            <span className="font-semibold text-sm">{post.user.username}</span>
          </div>

          <textarea
            className={`flex-grow p-4 bg-transparent outline-none resize-none text-sm ${theme === "dark" ? "placeholder-zinc-500" : "placeholder-zinc-400"}`}
            placeholder="ক্যাপশন লিখুন..."
            value={caption}
            onChange={(e) => setCaption(e.target.value)}
            rows={6}
          />
          
          <div className="p-4 flex justify-end">
             <button onClick={onClose} className="text-sm font-semibold hover:opacity-70">বাতিল করুন</button>
          </div>
        </div>
      </motion.div>
    </motion.div>
  );
};

export default EditPostModal;
