import React from "react";
import { Bell, Lock, Shield, LogOut } from "lucide-react";
import { useAppStore } from "../../store/useAppStore";
import { useAuth } from "../../hooks/useAuth";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";

interface SettingsModalProps {
  onClose: () => void;
}

const SettingsModal: React.FC<SettingsModalProps> = ({ onClose }) => {
  const { showToast } = useAppStore();
  const { signOut } = useAuth();

  const handleLogout = async () => {
    await signOut();
    onClose();
  };

  const handleOptionClick = (option: string) => {
    showToast(`${option} - Coming soon`);
  };

  return (
    <Dialog open={true} onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="max-w-sm p-0 overflow-hidden border-none rounded-xl">
        <div className="flex flex-col bg-background text-foreground">
          <DialogHeader className="p-4 border-b">
            <DialogTitle className="text-center font-bold">
              Settings
            </DialogTitle>
          </DialogHeader>

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
      </DialogContent>
    </Dialog>
  );
};

export default SettingsModal;
