import React from "react";
import { X } from "lucide-react";
import type { User } from "../../types";

interface UserListModalProps {
  title: string;
  users: User[];
  onClose: () => void;
  theme: string;
  onUserClick: (user: User) => void;
  glassModal: string;
}

import OptimizedImage from "../OptimizedImage";

const UserListModal: React.FC<UserListModalProps> = ({
  title,
  users,
  onClose,
  theme,
  onUserClick,
  glassModal,
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
          {users.map((user, idx) => (
            <div
              key={idx}
              className={`flex items-center justify-between p-2 rounded-lg ${theme === "dark" ? "hover:bg-white/5" : "hover:bg-black/5"} cursor-pointer`}
              onClick={() => onUserClick(user)}
            >
              <div className="flex items-center gap-3">
                <div className="w-12 h-12 rounded-full overflow-hidden">
                  <OptimizedImage
                    src={user.avatar}
                    className="w-full h-full"
                    alt={user.username}
                  />
                </div>
                <div className="flex flex-col">
                  <span className="text-sm font-semibold">{user.username}</span>
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
          ))}
        </div>
      </div>
    </div>
  );
};

export default UserListModal;
