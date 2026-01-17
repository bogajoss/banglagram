import React, { useState } from "react";
import { Avatar, AvatarImage, AvatarFallback } from "@/components/ui/avatar";
import { Heart } from "lucide-react";
import dayjs from "dayjs";
import { cn } from "@/lib/utils";
import type { Comment } from "../hooks/queries/useGetComments";
import { useToggleCommentLike } from "../hooks/mutations/useToggleCommentLike";
import AudioPlayer from "./AudioPlayer";
import { useAuth } from "../hooks/useAuth";
import { useAppStore } from "../store/useAppStore";
import VerifiedBadge from "./VerifiedBadge";

interface CommentItemProps {
  comment: Comment;
  replies: Comment[];
  depth?: number;
  onReply: (comment: Comment) => void;
  targetId: string;
  type: "post" | "reel";
}

export const CommentItem: React.FC<CommentItemProps> = ({
  comment,
  replies,
  depth = 0,
  onReply,
  targetId,
  type,
}) => {
  const { showToast } = useAppStore();
  const { user } = useAuth();
  const { mutate: toggleLike } = useToggleCommentLike();
  const [showReplies, setShowReplies] = useState(false);

  const isNested = depth > 0;

  const handleLike = () => {
    if (!user) {
      showToast("Log in to like comments");
      return;
    }
    toggleLike({
      commentId: comment.id,
      hasLiked: comment.hasLiked,
      targetId,
      type,
    });
  };

  return (
    <div className={cn("flex gap-3 mb-4", isNested && "ml-8 md:ml-12")}>
      <Avatar className="w-8 h-8 shrink-0">
        <AvatarImage src={comment.user.avatar_url} />
        <AvatarFallback>{comment.user.username[0]?.toUpperCase()}</AvatarFallback>
      </Avatar>

      <div className="flex-1 min-w-0">
        <div className="flex flex-col">
            <div className="flex items-center gap-1">
                <span className="font-semibold text-sm">
                    {comment.user.username}
                </span>
                {comment.user.isVerified && <VerifiedBadge />}
                <span className="text-xs text-muted-foreground ml-1">
                    {dayjs(comment.created_at).fromNow(true)}
                </span>
            </div>

            {comment.audioUrl ? (
                <div className="mt-1">
                <AudioPlayer src={comment.audioUrl} />
                </div>
            ) : (
                <p className="text-sm dark:text-gray-200 leading-normal whitespace-pre-wrap break-words">
                {comment.text}
                </p>
            )}

            {/* Actions */}
            <div className="flex items-center gap-4 mt-1">
                <button
                    onClick={() => onReply(comment)}
                    className="text-xs font-semibold text-muted-foreground hover:text-foreground transition-colors"
                >
                    Reply
                </button>
                {replies.length > 0 && (
                     <button
                        onClick={() => setShowReplies(!showReplies)}
                        className="text-xs font-semibold text-muted-foreground hover:text-foreground transition-colors flex items-center gap-1"
                     >
                        <div className="w-6 h-[1px] bg-muted-foreground" />
                        {showReplies ? "Hide replies" : `View ${replies.length} replies`}
                     </button>
                )}
            </div>
        </div>

        {/* Nested Replies */}
        {showReplies && replies.length > 0 && (
            <div className="mt-4">
            {replies.map((reply) => (
                <CommentItem
                    key={reply.id}
                    comment={reply}
                    // eslint-disable-next-line @typescript-eslint/no-explicit-any
                    replies={(reply as any).replies || []}
                    depth={depth + 1}
                    onReply={onReply}
                    targetId={targetId}
                    type={type}
                />
            ))}
            </div>
        )}
      </div>

      <div className="flex flex-col items-center gap-0.5 pt-1">
        <button
          onClick={handleLike}
          className={cn(
            "transition-colors",
            comment.hasLiked
              ? "text-red-500"
              : "text-muted-foreground hover:text-muted-foreground/80",
          )}
        >
          <Heart
            className={cn("w-3 h-3", comment.hasLiked && "fill-current")}
          />
        </button>
        {comment.likes_count > 0 && (
          <span className="text-[10px] text-muted-foreground">
            {comment.likes_count}
          </span>
        )}
      </div>
    </div>
  );
};
