import React, { useMemo } from "react";
import { useGetComments, type Comment } from "../hooks/queries/useGetComments";
import { CommentItem } from "./CommentItem";
import { Skeleton } from "@/components/ui/skeleton";

interface CommentsSectionProps {
  targetId: string;
  type: "post" | "reel";
  onReply: (comment: Comment) => void;
}

export const CommentsSection: React.FC<CommentsSectionProps> = ({
  targetId,
  type,
  onReply,
}) => {
  const { data: comments = [], isLoading } = useGetComments(targetId, type);

  // Build the tree structure
  const rootComments = useMemo(() => {
    if (!comments) return [];
    
    const map = new Map<string, Comment & { replies: Comment[] }>();
    const roots: (Comment & { replies: Comment[] })[] = [];

    // First pass: create map entries
    comments.forEach((c) => {
      map.set(c.id, { ...c, replies: [] });
    });

    // Second pass: link parents
    comments.forEach((c) => {
      const node = map.get(c.id)!;
      if (c.parent_id && map.has(c.parent_id)) {
        map.get(c.parent_id)!.replies.push(node);
      } else {
        roots.push(node);
      }
    });

    // Sort by date (newest first for roots? usually oldest first for comments, but IG is mixed)
    // Let's do newest first for roots, and oldest first for replies?
    // Actually IG puts "top" comments first. For simple chrono, newest on top.
    
    // Reverse logic if we want oldest (conversation style) or newest (news style).
    // Let's stick to newest first as per query default.
    return roots;
  }, [comments]);


  if (isLoading) {
    return (
      <div className="p-4 space-y-4">
        {[1, 2, 3].map((i) => (
          <div key={i} className="flex gap-3">
             <Skeleton className="w-8 h-8 rounded-full" />
             <div className="flex-1 space-y-2">
                <Skeleton className="h-4 w-32" />
                <Skeleton className="h-3 w-full" />
             </div>
          </div>
        ))}
      </div>
    );
  }

  if (comments.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-12 text-center">
        <div className="text-2xl mb-2">💬</div>
        <h3 className="font-semibold text-lg">No comments yet.</h3>
        <p className="text-muted-foreground text-sm">Start the conversation.</p>
      </div>
    );
  }

  return (
    <div className="p-4 pb-20 md:pb-4">
      {rootComments.map((comment) => (
        <CommentItem
          key={comment.id}
          comment={comment}
          replies={comment.replies || []}
          onReply={onReply}
          targetId={targetId}
          type={type}
        />
      ))}
    </div>
  );
};
