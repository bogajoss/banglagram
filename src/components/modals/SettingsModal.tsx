import React from "react";
import { X, Bell, Lock, Shield, LogOut } from "lucide-react";
import { useAppStore } from "../../store/useAppStore";
import { useAuth } from "../../hooks/useAuth";
import { motion } from "framer-motion";
import { Button } from "@/components/ui/button";


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
    showToast(`${option} - Coming soon`);
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
        <div className="flex flex-col">
          <div
            className={`p-4 border-b font-bold flex justify-between items-center ${theme === "dark" ? "border-zinc-800" : "border-zinc-200"}`}
          >
            <span>Settings</span>
            <Button variant="ghost" size="icon" onClick={onClose}>
              <X className="h-5 w-5" />
            </Button>
          </div>

          <Button
            variant="ghost"
            onClick={() => handleOptionClick("Notifications")}
            className="flex items-center justify-start gap-3 p-4 h-auto w-full rounded-none border-b border-border"
          >
            <Bell size={20} />
            <span>Notifications and Sounds</span>
          </Button>
          <Button
            variant="ghost"
            onClick={() => handleOptionClick("Privacy")}
            className="flex items-center justify-start gap-3 p-4 h-auto w-full rounded-none border-b border-border"
          >
            <Lock size={20} />
            <span>Privacy and Security</span>
          </Button>
          <Button
            variant="ghost"
            onClick={() => handleOptionClick("Account")}
            className="flex items-center justify-start gap-3 p-4 h-auto w-full rounded-none border-b border-border"
          >
            <Shield size={20} />
            <span>Account Center</span>
          </Button>
          <Button
            variant="ghost"
            onClick={handleLogout}
            className="flex items-center justify-start gap-3 p-4 h-auto w-full rounded-none text-red-500 hover:text-red-600 hover:bg-red-500/10"
          >
            <LogOut size={20} />
            <span>Log Out</span>
          </Button>
        </div>
      </motion.div>
    </motion.div>
  );
};

export default SettingsModal;
