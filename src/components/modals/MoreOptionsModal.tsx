import React from "react";

interface MoreOptionsModalProps {
  onClose: () => void;
  showToast: (msg: string) => void;
  theme: string;
  glassModal: string;
  shareUrl?: string;
  isOwner?: boolean;
  onEdit?: () => void;
}

const MoreOptionsModal: React.FC<MoreOptionsModalProps> = ({
  onClose,
  showToast,
  theme,
  glassModal,
  shareUrl,
  isOwner,
  onEdit,
}) => {
  return (
    <div
      className="fixed inset-0 z-[100] bg-black/60 flex items-center justify-center p-4"
      onClick={onClose}
    >
      <div
        className={`w-full max-w-[300px] rounded-xl overflow-hidden shadow-2xl ${glassModal} ${theme === "dark" ? "text-white" : "text-black"}`}
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex flex-col text-sm font-semibold">
          {isOwner && (
            <button
              className="py-3.5 border-b border-zinc-700/30 hover:bg-white/5 transition-colors"
              onClick={() => {
                onEdit?.();
                onClose();
              }}
            >
              Edit
            </button>
          )}
          <button
            className="py-3.5 text-[#f42a41] border-b border-zinc-700/30 hover:bg-white/5 transition-colors"
            onClick={() => {
              showToast("Reported");
              onClose();
            }}
          >
            Report
          </button>
          <button
            className="py-3.5 text-[#f42a41] border-b border-zinc-700/30 hover:bg-white/5 transition-colors"
            onClick={() => {
              showToast("Unfollowed");
              onClose();
            }}
          >
            Unfollow
          </button>
          <button
            className="py-3.5 border-b border-zinc-700/30 hover:bg-white/5 transition-colors"
            onClick={() => {
              showToast("Added to favorites");
              onClose();
            }}
          >
            Add to favorites
          </button>
          <button
            className="py-3.5 border-b border-zinc-700/30 hover:bg-white/5 transition-colors"
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
            className="py-3.5 hover:bg-white/5 transition-colors"
            onClick={onClose}
          >
            Cancel
          </button>
        </div>
      </div>
    </div>
  );
};

export default MoreOptionsModal;
