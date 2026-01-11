import React from "react";

interface MoreOptionsModalProps {
  onClose: () => void;
  showToast: (msg: string) => void;
  theme: string;
  glassModal: string;
  shareUrl?: string;
}

const MoreOptionsModal: React.FC<MoreOptionsModalProps> = ({
  onClose,
  showToast,
  theme,
  glassModal,
  shareUrl,
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
          <button
            className="py-3.5 text-[#f42a41] border-b border-zinc-700/30 hover:bg-white/5 transition-colors"
            onClick={() => {
              showToast("রিপোর্ট করা হয়েছে");
              onClose();
            }}
          >
            রিপোর্ট করুন
          </button>
          <button
            className="py-3.5 text-[#f42a41] border-b border-zinc-700/30 hover:bg-white/5 transition-colors"
            onClick={() => {
              showToast("আনফলো করা হয়েছে");
              onClose();
            }}
          >
            আনফলো
          </button>
          <button
            className="py-3.5 border-b border-zinc-700/30 hover:bg-white/5 transition-colors"
            onClick={() => {
              showToast("ফেভারিটে যোগ করা হয়েছে");
              onClose();
            }}
          >
            ফেভারিটে যোগ করুন
          </button>
          <button
            className="py-3.5 border-b border-zinc-700/30 hover:bg-white/5 transition-colors"
            onClick={() => {
              const url = shareUrl || window.location.href;
              navigator.clipboard.writeText(url);
              showToast("লিঙ্ক কপি করা হয়েছে");
              onClose();
            }}
          >
            লিঙ্ক কপি করুন
          </button>
          <button
            className="py-3.5 hover:bg-white/5 transition-colors"
            onClick={onClose}
          >
            বাতিল করুন
          </button>
        </div>
      </div>
    </div>
  );
};

export default MoreOptionsModal;
