import React from "react";
import type { User } from "../../types";
import VerifiedBadge from "../VerifiedBadge";
import { Avatar, AvatarImage, AvatarFallback } from "@/components/ui/avatar";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";

interface UserListModalProps {
  title: string;
  users: User[];
  onClose: () => void;
  onUserClick: (user: User) => void;
  loading?: boolean;
}

const UserListModal: React.FC<UserListModalProps> = ({
  title,
  users,
  onClose,
  onUserClick,
  loading,
}) => {
  return (
    <Dialog open={true} onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="max-w-md p-0 overflow-hidden border-none rounded-xl">
        <div className="bg-background text-foreground">
          <DialogHeader className="p-3 border-b text-center relative">
            <DialogTitle className="text-center font-bold">{title}</DialogTitle>
          </DialogHeader>
          <div className="h-80 overflow-y-auto p-2">
            {loading ? (
              <div className="flex items-center justify-center h-full">
                <div className="w-8 h-8 border-4 border-[#006a4e] border-t-transparent rounded-full animate-spin"></div>
              </div>
            ) : (
              users.map((user, idx) => (
                <div
                  key={idx}
                  className="flex items-center justify-between p-2 rounded-lg hover:bg-muted cursor-pointer"
                  onClick={() => onUserClick(user)}
                >
                  <div className="flex items-center gap-3">
                    <Avatar className="w-12 h-12">
                      <AvatarImage src={user.avatar} />
                      <AvatarFallback>{user.username?.[0]?.toUpperCase() || "?"}</AvatarFallback>
                    </Avatar>
                    <div className="flex flex-col">
                      <div className="flex items-center gap-1">
                        <span className="text-sm font-semibold">
                          {user.username}
                        </span>
                        {user.isVerified && <VerifiedBadge />}
                      </div>
                      <span className="text-xs opacity-70">
                        {user.name || user.username}
                      </span>
                    </div>
                  </div>
                  <button
                    className="px-4 py-1.5 rounded-lg text-sm font-semibold bg-[#006a4e] text-white hover:bg-[#00523c]"
                  >
                    Follow
                  </button>
                </div>
              ))
            )}
            {!loading && users.length === 0 && (
              <div className="text-center py-10 text-sm opacity-60">
                List is empty
              </div>
            )}
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default UserListModal;