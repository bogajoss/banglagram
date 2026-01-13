import React from "react";
import { X } from "lucide-react";
import type { User } from "../../types";
import VerifiedBadge from "../VerifiedBadge";
import { Avatar, AvatarImage, AvatarFallback } from "@/components/ui/avatar";

interface UserListModalProps {
  title: string;
  users: User[];
  onClose: () => void;
  theme: string;
  onUserClick: (user: User) => void;
  glassModal: string;
  loading?: boolean;
}

const UserListModal: React.FC<UserListModalProps> = ({
  title,
  users,
  onClose,
  theme,
  onUserClick,
  glassModal,
  loading,
}) => {
  return (
    <div
      className="fixed inset-0 z-[100] bg-black/60 flex items-center justify-center p-4 animate-fade-in"
      onClick={onClose}
    >
      <div
        className={`w-full max-w-md rounded-xl overflow-hidden shadow-2xl ${glassModal} ${theme === "dark" ? "text-white" : "text-black"}`}
        onClick={(e) => e.stopPropagation()}
      >
        <div
          className={`p-3 border-b text-center font-bold relative ${theme === "dark" ? "border-zinc-800" : "border-zinc-200"}`}
        >
          {title}
          <X
            className="absolute right-3 top-3 cursor-pointer"
            onClick={onClose}
          />
        </div>
        <div className="h-80 overflow-y-auto p-2">
          {loading ? (
            <div className="flex items-center justify-center h-full">
              <div className="w-8 h-8 border-4 border-[#006a4e] border-t-transparent rounded-full animate-spin"></div>
            </div>
          ) : (
            users.map((user, idx) => (
              <div
                key={idx}
                className={`flex items-center justify-between p-2 rounded-lg ${theme === "dark" ? "hover:bg-white/5" : "hover:bg-black/5"} cursor-pointer`}
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
                  className={`px-4 py-1.5 rounded-lg text-sm font-semibold bg-[#006a4e] text-white hover:bg-[#00523c]`}
                >
                  ফলো
                </button>
              </div>
            ))
          )}
          {!loading && users.length === 0 && (
            <div className="text-center py-10 text-sm opacity-60">
              তালিকা খালি
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default UserListModal;
