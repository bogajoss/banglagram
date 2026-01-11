import React from "react";
import { useParams, useNavigate } from "react-router-dom";
import { useGetPost } from "../hooks/queries/useGetPost";
import { useAuth } from "../hooks/useAuth";
import PostItem from "../components/PostItem";
import { useAppStore } from "../store/useAppStore";
import { ChevronLeft } from "lucide-react";

const PostView: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const { user } = useAuth();
  const { theme, toggleSave, setViewingPost } = useAppStore();
  const navigate = useNavigate();

  const { data: post, isLoading, error } = useGetPost(id, user?.id);

  if (isLoading) {
    return (
      <div className={`min-h-screen w-full flex items-center justify-center ${theme === "dark" ? "bg-black text-white" : "bg-white text-black"}`}>
        <div className="w-8 h-8 border-4 border-[#006a4e] border-t-transparent rounded-full animate-spin"></div>
      </div>
    );
  }

  if (error || !post) {
    return (
      <div className={`min-h-screen w-full flex flex-col items-center justify-center ${theme === "dark" ? "bg-black text-white" : "bg-white text-black"}`}>
        <h2 className="text-xl font-bold mb-4">পোস্টটি খুঁজে পাওয়া যায়নি</h2>
        <button 
          onClick={() => navigate("/")}
          className="bg-[#006a4e] text-white px-4 py-2 rounded-lg font-semibold"
        >
          হোমে ফিরে যান
        </button>
      </div>
    );
  }

  return (
    <div className={`min-h-screen w-full ${theme === "dark" ? "bg-black" : "bg-white"} pt-4 md:pt-8`}>
      <div className="max-w-[600px] mx-auto px-4">
        <div className="flex items-center gap-4 mb-6">
          <button 
            onClick={() => navigate(-1)}
            className={`p-2 rounded-full ${theme === "dark" ? "hover:bg-zinc-800" : "hover:bg-gray-100"}`}
          >
            <ChevronLeft size={24} />
          </button>
          <h1 className="text-xl font-bold">পোস্ট</h1>
        </div>
        
        <PostItem 
          post={post}
          isSaved={post.hasSaved || false}
          onToggleSave={() => toggleSave(post.id)}
          onUserClick={(user) => navigate(`/profile/${user.username}`)}
          onPostClick={(p) => setViewingPost(p)}
        />
      </div>
    </div>
  );
};

export default PostView;
