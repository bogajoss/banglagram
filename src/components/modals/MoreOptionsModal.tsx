import React from "react";
import { Dialog, DialogContent, DialogTitle } from "@/components/ui/dialog";

interface MoreOptionsModalProps {
  onClose: () => void;
  showToast: (msg: string) => void;
  shareUrl?: string;
  isOwner?: boolean;
  onEdit?: () => void;
}

const MoreOptionsModal: React.FC<MoreOptionsModalProps> = ({
  onClose,
  showToast,
  shareUrl,
  isOwner,
  onEdit,
}) => {
  return (
    <Dialog open={true} onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="max-w-[300px] p-0 overflow-hidden border-none rounded-xl">
        <DialogTitle className="sr-only">Post Options</DialogTitle>
        <div className="flex flex-col text-sm font-semibold bg-background">
          {isOwner && (
            <button
              className="py-3.5 border-b border-border hover:bg-muted transition-colors"
              onClick={() => {
                onEdit?.();
                onClose();
              }}
            >
              Edit
            </button>
          )}
          <button
            className="py-3.5 text-[#f42a41] border-b border-border hover:bg-muted transition-colors"
            onClick={() => {
              showToast("Reported");
              onClose();
            }}
          >
            Report
          </button>
          <button
            className="py-3.5 text-[#f42a41] border-b border-border hover:bg-muted transition-colors"
            onClick={() => {
              showToast("Unfollowed");
              onClose();
            }}
          >
            Unfollow
          </button>
          <button
            className="py-3.5 border-b border-border hover:bg-muted transition-colors"
            onClick={() => {
              showToast("Added to favorites");
              onClose();
            }}
          >
            Add to favorites
          </button>
          <button
            className="py-3.5 border-b border-border hover:bg-muted transition-colors"
            onClick={() => {
              const url = shareUrl || window.location.href;
              navigator.clipboard.writeText(url);
              showToast("Link copied");
              onClose();
            }}
          >
            Copy link
          </button>
          <button
            className="py-3.5 hover:bg-muted transition-colors"
            onClick={onClose}
          >
            Cancel
          </button>
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default MoreOptionsModal;
