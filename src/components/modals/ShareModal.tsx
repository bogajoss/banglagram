import React, { useState, useEffect } from "react";
import { X, Search, Copy, PlusSquare, Loader2 } from "lucide-react";
import type { User } from "../../types";
import { useGetSuggestedUsers } from "../../hooks/queries/useGetSuggestedUsers";
import { useAuth } from "../../hooks/useAuth";
import { supabase } from "../../lib/supabaseClient";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Avatar, AvatarImage, AvatarFallback } from "@/components/ui/avatar";
import { useNavigate } from "react-router-dom";
import { useAppStore } from "../../store/useAppStore";

interface ShareModalProps {
  onClose: () => void;
  shareUrl?: string;
}

const ShareModal: React.FC<ShareModalProps> = ({ onClose, shareUrl }) => {
  const { showToast } = useAppStore();
  const navigate = useNavigate();
  const { user: authUser } = useAuth();
  const { data: suggestedUsers = [] } = useGetSuggestedUsers(authUser?.id);

  const [searchQuery, setSearchQuery] = useState("");
  const [searchResults, setSearchResults] = useState<User[]>([]);
  const [isSearching, setIsSearching] = useState(false);
  const [sendingTo, setSendingTo] = useState<string | null>(null);

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

  const users = searchQuery.trim()
    ? searchResults
    : (suggestedUsers.slice(0, 8) as User[]);

  return (
    <Dialog open={true} onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="max-w-md p-0 overflow-hidden border-none rounded-xl">
        <div className="bg-background text-foreground">
          <DialogHeader className="p-3 border-b text-center relative">
            <DialogTitle className="text-center font-bold">Share</DialogTitle>
          </DialogHeader>
          <div className="p-4 border-b border-border">
            <div className="flex items-center gap-2 px-3 py-2 rounded-lg bg-muted">
              <Search size={18} className="text-muted-foreground" />
              <input
                type="text"
                placeholder="Search"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="bg-transparent border-none outline-none text-sm w-full"
              />
              {searchQuery && (
                <X
                  size={18}
                  className="cursor-pointer text-muted-foreground"
                  onClick={() => setSearchQuery("")}
                />
              )}
            </div>
          </div>
          <div className="h-64 overflow-y-auto p-2">
            {isSearching ? (
              <div className="p-4 text-center text-sm text-muted-foreground">
                Searching...
              </div>
            ) : users.length === 0 ? (
              <div className="p-4 text-center text-sm text-muted-foreground">
                No results found
              </div>
            ) : (
              users.map((user, idx) => (
                <div
                  key={idx}
                  className="flex items-center justify-between p-2 rounded-lg hover:bg-muted cursor-pointer transition-colors"
                >
                  <div
                    className="flex items-center gap-3 flex-grow"
                    onClick={() => {
                      onClose();
                      navigate(`/profile/${user.username}`);
                    }}
                  >
                    <Avatar className="w-10 h-10">
                      <AvatarImage src={user.avatar} />
                      <AvatarFallback>
                        {user.username?.[0]?.toUpperCase() || "?"}
                      </AvatarFallback>
                    </Avatar>
                    <div className="flex flex-col">
                      <span className="text-sm font-semibold">
                        {user.username}
                      </span>
                      <span className="text-xs opacity-70">
                        {user.name || user.username}
                      </span>
                    </div>
                  </div>
                  <button
                    disabled={sendingTo === user.id}
                    className="px-4 py-1.5 rounded-lg text-sm font-semibold bg-[#006a4e] text-white hover:bg-[#00523c] transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
                    onClick={async (e) => {
                      e.stopPropagation();
                      if (!authUser?.id) {
                        showToast("Please login first");
                        return;
                      }
                      
                      setSendingTo(user.id);
                      try {
                        const { error } = await supabase.from("messages").insert([
                          {
                            sender_id: authUser.id,
                            receiver_id: user.id,
                            content: `Check this out: ${shareUrl || window.location.href}`,
                            created_at: new Date().toISOString(),
                          },
                        ]);

                        if (error) throw error;
                        showToast(`Sent to ${user.username}`);
                        onClose();
                      } catch (err) {
                        console.error("Error sending message:", err);
                        showToast("Failed to send message");
                      } finally {
                        setSendingTo(null);
                      }
                    }}
                  >
                    {sendingTo === user.id ? (
                      <>
                        <Loader2 size={16} className="animate-spin" />
                        <span>Sending...</span>
                      </>
                    ) : (
                      "Send"
                    )}
                  </button>
                </div>
              ))
            )}
          </div>
          <div className="p-4 border-t border-border flex gap-4 overflow-x-auto">
            <div
              className="flex flex-col items-center gap-1 cursor-pointer min-w-[60px]"
              onClick={() => {
                const url = shareUrl || window.location.href;
                navigator.clipboard.writeText(url);
                showToast("Link copied");
                onClose();
              }}
            >
              <div className="w-12 h-12 rounded-full border border-border flex items-center justify-center bg-background">
                <Copy size={20} />
              </div>
              <span className="text-xs">Copy Link</span>
            </div>
            <div
              className="flex flex-col items-center gap-1 cursor-pointer min-w-[60px]"
              onClick={() => {
                showToast("Added to your story");
                onClose();
              }}
            >
              <div className="w-12 h-12 rounded-full border border-border flex items-center justify-center bg-background">
                <PlusSquare size={20} />
              </div>
              <span className="text-xs">Add to story</span>
            </div>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default ShareModal;
