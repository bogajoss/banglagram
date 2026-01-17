import React from "react";
import { Archive } from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";

interface ArchiveModalProps {
  onClose: () => void;
}

const ArchiveModal: React.FC<ArchiveModalProps> = ({ onClose }) => {
  return (
    <Dialog open={true} onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="max-w-sm rounded-xl overflow-hidden p-0 gap-0 border-none">
        <DialogHeader className="p-4 border-b flex flex-row items-center justify-between space-y-0">
          <div className="flex items-center gap-2">
            <DialogTitle className="font-bold flex items-center gap-2">
              <span>Archive</span>
              <Archive size={16} className="opacity-50" />
            </DialogTitle>
          </div>
        </DialogHeader>

        <div className="h-64 flex flex-col items-center justify-center p-6 text-center opacity-70 bg-background">
          <div className="p-4 rounded-full mb-4 bg-muted">
            <Archive size={32} />
          </div>
          <h3 className="font-bold text-lg mb-1">Archive is empty</h3>
          <p className="text-sm">
            When you archive posts or stories, they will appear here.
          </p>
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default ArchiveModal;