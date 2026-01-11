import React, { useState, useEffect } from "react";
import { X, Search, Copy, PlusSquare } from "lucide-react";
import type { User } from "../../types";
import { useGetSuggestedUsers } from "../../hooks/queries/useGetSuggestedUsers";
import { useAuth } from "../../hooks/useAuth";
import { supabase } from "../../lib/supabaseClient";

interface ShareModalProps {
  onClose: () => void;
  theme: string;
  showToast: (msg: string) => void;
  glassModal: string;
  shareUrl?: string;
}

import OptimizedImage from "../OptimizedImage";

import { useNavigate } from "react-router-dom";

const ShareModal: React.FC<ShareModalProps> = ({
  onClose,
  theme,
  showToast,
  glassModal,
  shareUrl,
}) => {
  const navigate = useNavigate();
  const { user: authUser } = useAuth();
  const { data: suggestedUsers = [] } = useGetSuggestedUsers(authUser?.id);

  const [searchQuery, setSearchQuery] = useState("");
  const [searchResults, setSearchResults] = useState<User[]>([]);
  const [isSearching, setIsSearching] = useState(false);

  useEffect(() => {
    const delayDebounceFn = setTimeout(async () => {
      if (searchQuery.trim().length > 0) {
        setIsSearching(true);
        const { data } = await supabase
          .from("profiles")
          .select("id, username, full_name, avatar_url, is_verified")
          .ilike("username", `%${searchQuery}%`)
          .limit(10);

        if (data) {
          const users: User[] = (
            data as {
              id: string;
              username: string;
              full_name: string;
              avatar_url: string;
              is_verified: boolean;
            }[]
          ).map((p) => ({
            id: p.id,
            username: p.username,
            name: p.full_name || p.username,
            avatar: p.avatar_url || "",
            isVerified: p.is_verified || false,
          }));
          setSearchResults(users);
        }
        setIsSearching(false);
      } else {
        setSearchResults([]);
      }
    }, 300);

    return () => clearTimeout(delayDebounceFn);
  }, [searchQuery]);

  // If searching, use searchResults, otherwise use suggestedUsers
  const users = searchQuery.trim() ? searchResults : (suggestedUsers.slice(0, 8) as User[]);

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
          শেয়ার করুন
          <X
            className="absolute right-3 top-3 cursor-pointer"
            onClick={onClose}
          />
        </div>
        <div
          className={`p-4 border-b ${theme === "dark" ? "border-zinc-700/50" : "border-zinc-200"}`}
        >
          <div
            className={`flex items-center gap-2 px-3 py-2 rounded-lg ${theme === "dark" ? "bg-[#262626]" : "bg-gray-100"}`}
          >
            <Search size={18} className="text-[#8e8e8e]" />
            <input
              type="text"
              placeholder="অনুসন্ধান"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="bg-transparent border-none outline-none text-sm w-full"
            />
            {searchQuery && (
              <X
                size={18}
                className="cursor-pointer text-[#8e8e8e]"
                onClick={() => setSearchQuery("")}
              />
            )}
          </div>
        </div>
        <div className="h-64 overflow-y-auto p-2">
          {isSearching ? (
            <div className="p-4 text-center text-sm text-gray-500">
              অনুসন্ধান করা হচ্ছে...
            </div>
          ) : users.length === 0 ? (
            <div className="p-4 text-center text-sm text-gray-500">
              কোনো ফলাফল পাওয়া যায়নি
            </div>
          ) : (
            users.map((user, idx) => (
            <div
              key={idx}
              className={`flex items-center justify-between p-2 rounded-lg ${theme === "dark" ? "hover:bg-white/5" : "hover:bg-black/5"} cursor-pointer transition-colors`}
            >
              <div
                className="flex items-center gap-3 flex-grow"
                onClick={() => {
                  onClose();
                  navigate(`/profile/${user.username}`);
                }}
              >
                <div className="w-10 h-10 rounded-full overflow-hidden">
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
                className={`px-4 py-1.5 rounded-lg text-sm font-semibold bg-[#006a4e] text-white hover:bg-[#00523c] transition-colors`}
                onClick={(e) => {
                  e.stopPropagation();
                  showToast(`${user.username}-কে পাঠানো হয়েছে`);
                  onClose();
                }}
              >
                পাঠান
              </button>
            </div>
          )))}
        </div>
        <div
          className={`p-4 border-t ${theme === "dark" ? "border-zinc-800" : "border-zinc-200"} flex gap-4 overflow-x-auto`}
        >
          <div
            className="flex flex-col items-center gap-1 cursor-pointer min-w-[60px]"
            onClick={() => {
              const url = shareUrl || window.location.href;
              navigator.clipboard.writeText(url);
              showToast("লিঙ্ক কপি করা হয়েছে");
              onClose();
            }}
          >
            <div
              className={`w-12 h-12 rounded-full border flex items-center justify-center ${theme === "dark" ? "border-zinc-700 bg-black" : "border-gray-300 bg-white"}`}
            >
              <Copy size={20} />
            </div>
            <span className="text-xs">লিঙ্ক কপি</span>
          </div>
          <div
            className="flex flex-col items-center gap-1 cursor-pointer min-w-[60px]"
            onClick={() => {
              showToast("আপনার স্টোরিতে যোগ করা হয়েছে");
              onClose();
            }}
          >
            <div
              className={`w-12 h-12 rounded-full border flex items-center justify-center ${theme === "dark" ? "border-zinc-700 bg-black" : "border-gray-300 bg-white"}`}
            >
              <PlusSquare size={20} />
            </div>
            <span className="text-xs">স্টোরিতে দিন</span>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ShareModal;
