import React from "react";
import { X, Bell, Lock, Shield, LogOut } from "lucide-react";
import { useAppStore } from "../../store/useAppStore";
import { useAuth } from "../../hooks/useAuth";
import { motion } from "framer-motion";

interface SettingsModalProps {
  onClose: () => void;
}

const SettingsModal: React.FC<SettingsModalProps> = ({ onClose }) => {
  const { theme, showToast } = useAppStore();
  const { signOut } = useAuth();

  const glassModal =
    theme === "dark"
      ? "bg-[#121212]/90 backdrop-blur-2xl border border-white/10"
      : "bg-white/90 backdrop-blur-2xl border border-black/10";

  const handleLogout = async () => {
    await signOut();
    onClose();
    // AuthContext handles redirect / state update
  };

  const handleOptionClick = (option: string) => {
    showToast(`${option} - শীঘ্রই আসছে`);
  };

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
          <span>সেটিংস</span>
          <X className="cursor-pointer" onClick={onClose} />
        </div>
        <div className="flex flex-col">
          <button
            onClick={() => handleOptionClick("নোটিফিকেশন")}
            className={`flex items-center gap-3 p-4 w-full text-left hover:bg-white/5 transition-colors border-b ${theme === "dark" ? "border-zinc-800" : "border-zinc-100"}`}
          >
            <Bell size={20} />
            <span>নোটিফিকেশন এবং সাউন্ড</span>
          </button>
          <button
            onClick={() => handleOptionClick("প্রাইভেন্সি")}
            className={`flex items-center gap-3 p-4 w-full text-left hover:bg-white/5 transition-colors border-b ${theme === "dark" ? "border-zinc-800" : "border-zinc-100"}`}
          >
            <Lock size={20} />
            <span>প্রাইভেন্সি এবং সিকিউরিটি</span>
          </button>
          <button
            onClick={() => handleOptionClick("অ্যাকাউন্ট")}
            className={`flex items-center gap-3 p-4 w-full text-left hover:bg-white/5 transition-colors border-b ${theme === "dark" ? "border-zinc-800" : "border-zinc-100"}`}
          >
            <Shield size={20} />
            <span>অ্যাকাউন্ট সেন্টার</span>
          </button>
          <button
            onClick={handleLogout}
            className="flex items-center gap-3 p-4 w-full text-left hover:bg-red-500/10 text-red-500 transition-colors font-semibold"
          >
            <LogOut size={20} />
            <span>লগ আউট</span>
          </button>
        </div>
      </motion.div>
    </motion.div>
  );
};

export default SettingsModal;
