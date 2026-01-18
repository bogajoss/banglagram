import React from "react";
import { useParams, useNavigate } from "react-router-dom";
import { useGetPost } from "../hooks/queries/useGetPost";
import { useAuth } from "../hooks/useAuth";
import PostItem from "../components/PostItem";
import { useAppStore } from "../store/useAppStore";
import { useToggleSave } from "../hooks/mutations/useToggleSave";
import { ChevronLeft, Loader2, X } from "lucide-react";
import { Button } from "@/components/ui/button";

const PostView: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const { user } = useAuth();
  const { setViewingPost } = useAppStore();
  const { mutate: toggleSaveMutation } = useToggleSave();
  const navigate = useNavigate();

  const { data: post, isLoading, isError } = useGetPost(id || "", user?.id);

  if (isLoading) {
    return (
      <div className="min-h-screen w-full flex items-center justify-center bg-background text-foreground">
        <div className="flex flex-col items-center gap-4">
          <Loader2 className="h-8 w-8 animate-spin text-[#006a4e]" />
          <p className="text-sm font-medium">Loading post...</p>
        </div>
      </div>
    );
  }

  if (isError || !post) {
    return (
      <div className="min-h-screen w-full flex flex-col items-center justify-center bg-background text-foreground p-4 text-center">
        <div className="w-20 h-20 bg-muted rounded-full flex items-center justify-center mb-4">
          <X className="h-10 w-10 text-muted-foreground" />
        </div>
        <h2 className="text-xl font-bold mb-2">Post not found</h2>
        <p className="text-muted-foreground mb-6">
          The link you followed may be broken, or the post may have been
          removed.
        </p>
        <Button
          onClick={() => navigate("/")}
          className="bg-[#006a4e] hover:bg-[#00523c] text-white px-8"
        >
          Go back to Home
        </Button>
      </div>
    );
  }

  return (
    <div className="min-h-screen w-full bg-background pt-4 md:pt-8">
      <div className="max-w-[600px] mx-auto px-0 md:px-4">
        {/* Mobile Header */}
        <div className="md:hidden flex items-center gap-4 px-4 mb-4">
          <button
            onClick={() => navigate(-1)}
            className="p-2 rounded-full hover:bg-muted"
          >
            <ChevronLeft size={24} />
          </button>
          <h1 className="text-lg font-bold">Post</h1>
        </div>

        <div className="md:border border-border md:rounded-lg overflow-hidden">
          <PostItem
            post={post}
            isSaved={!!post.hasSaved}
            onToggleSave={() => {
              if (user) {
                toggleSaveMutation({
                  postId: post.id,
                  userId: user.id,
                  hasSaved: !!post.hasSaved,
                });
              }
            }}
            onUserClick={(u) => navigate(`/profile/${u.username}`)}
            onPostClick={(p) => setViewingPost(p)}
          />
        </div>
      </div>
    </div>
  );
};

export default PostView;
