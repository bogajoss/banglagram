import React from "react";
import { X, Archive } from "lucide-react";
import { useAppStore } from "../../store/useAppStore";
import { motion } from "framer-motion";

interface ArchiveModalProps {
  onClose: () => void;
}

const ArchiveModal: React.FC<ArchiveModalProps> = ({ onClose }) => {
  const { theme } = useAppStore();

  const glassModal =
    theme === "dark"
      ? "bg-[#121212]/90 backdrop-blur-2xl border border-white/10"
      : "bg-white/90 backdrop-blur-2xl border border-black/10";

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="fixed inset-0 z-[100] bg-black/60 flex items-center justify-center p-4"
      onClick={onClose}
    >
      <motion.div
        initial={{ scale: 0.9, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        exit={{ scale: 0.9, opacity: 0 }}
        className={`w-full max-w-sm rounded-xl overflow-hidden shadow-2xl ${glassModal} ${theme === "dark" ? "text-white" : "text-black"}`}
        onClick={(e) => e.stopPropagation()}
      >
        <div
          className={`p-4 border-b font-bold flex justify-between items-center ${theme === "dark" ? "border-zinc-800" : "border-zinc-200"}`}
        >
          <div className="flex items-center gap-2">
            <span>আর্কাইভ</span>
            <Archive size={16} className="opacity-50" />
          </div>
          <X className="cursor-pointer" onClick={onClose} />
        </div>

        <div className="h-64 flex flex-col items-center justify-center p-6 text-center opacity-70">
          <div
            className={`p-4 rounded-full mb-4 ${theme === "dark" ? "bg-zinc-800" : "bg-gray-100"}`}
          >
            <Archive size={32} />
          </div>
          <h3 className="font-bold text-lg mb-1">আর্কাইভে কিছু নেই</h3>
          <p className="text-sm">
            আপনি যখন পোস্ট বা স্টোরি আর্কাইভ করবেন, তখন সেগুলো এখানে দেখা যাবে।
          </p>
        </div>
      </motion.div>
    </motion.div>
  );
};

export default ArchiveModal;
