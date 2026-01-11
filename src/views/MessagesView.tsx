import React, { useState, useEffect, useRef } from "react";
import {
  ChevronDown,
  Edit,
  Search,
  ChevronLeft,
  Phone,
  Video,
  Info,
  Camera,
  MessageCircle,
} from "lucide-react";
import { useAppStore } from "../store/useAppStore";
import { supabase } from "../lib/supabaseClient";
import { useAuth } from "../hooks/useAuth";
import type { User } from "../types";
import {
  useGetMessages,
  MESSAGES_QUERY_KEY,
} from "../hooks/queries/useGetMessages";
import { useGetConversations } from "../hooks/queries/useGetConversations";
import { useSendMessage } from "../hooks/mutations/useSendMessage";
import { useQueryClient } from "@tanstack/react-query";
import type { Database } from "../database.types";

import OptimizedImage from "../components/OptimizedImage";

type DbMessage = Database["public"]["Tables"]["messages"]["Row"];

import { useNavigate, useLocation, useParams } from "react-router-dom";
import { useGetProfile } from "../hooks/queries/useGetProfile";

const MessagesView: React.FC = () => {
  const { theme, showToast } = useAppStore();
  const { user, profile } = useAuth();
  const queryClient = useQueryClient();
  const navigate = useNavigate();
  const location = useLocation();
  const { username } = useParams<{ username: string }>();
  const buttonBg = "bg-[#006a4e] hover:bg-[#00523c]";

  // Fetch profile if username is in param but not in state (direct link access)
  const { data: profileData } = useGetProfile(username || "", user?.id);

  // Derive selectedUser from location state or fetched profile data
  const selectedUser = (location.state?.user as User) || (profileData?.user as User) || null;

  const [newMessage, setNewMessage] = useState("");
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const borderClass = theme === "dark" ? "border-zinc-800" : "border-zinc-200";
  const bgHover = theme === "dark" ? "hover:bg-zinc-900" : "hover:bg-gray-100";

  // Fetch conversations
  const { data: conversations = [] } = useGetConversations(user?.id);

  // Derive selectedUserId from selectedUser
  const selectedUserId =
    selectedUser?.id ||
    conversations.find((c) => c.username === selectedUser?.username)?.id;

  // Use Hooks
  const { data: messages = [] } = useGetMessages(user?.id, selectedUserId);
  const { mutate: sendMessage } = useSendMessage();

  // Realtime Subscription
  useEffect(() => {
    if (!user) return;

    const channel = supabase
      .channel("chat_messages_realtime")
      .on(
        "postgres_changes",
        {
          event: "INSERT",
          schema: "public",
          table: "messages",
        },
        (payload) => {
          const newMsg = payload.new as DbMessage;

          if (newMsg.receiver_id !== user.id && newMsg.sender_id !== user.id) {
            return;
          }

          queryClient.invalidateQueries({ queryKey: ["conversations"] });

          // Debug log
          console.log("Realtime msg:", newMsg, "Selected:", selectedUserId);

          const isRelevant =
            (newMsg.sender_id === selectedUserId &&
              newMsg.receiver_id === user.id) ||
            (newMsg.sender_id === user.id &&
              newMsg.receiver_id === selectedUserId);

          if (selectedUserId && isRelevant) {
            queryClient.setQueryData(
              MESSAGES_QUERY_KEY(selectedUserId),
              (old: DbMessage[] | undefined) => {
                // Check if we already have this message (dedup against optimistic or double-fire)
                if (old && old.some((m) => m.id === newMsg.id)) return old;

                // If we have "optimistic" messages, we might want to replace them or intelligent merge.
                // For simplicity, just appending if not present.
                // Optimistic usually has 'optimistic-' prefix id. Real one has UUID.
                // If we just append, we might show duplicates if optimistic one isn't removed.
                // useSendMessage's onSettled invalidates.
                // If invalidation happens, useGetMessages refetches and replaces everything.
                // So this manual update is for instant feedback BEFORE refetch completes.
                return old ? [...old, newMsg] : [newMsg];
              },
            );
            // Also invalidate to be sure
            queryClient.invalidateQueries({
              queryKey: MESSAGES_QUERY_KEY(selectedUserId),
            });
          }
        },
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [user, selectedUserId, queryClient]);

  const handleSendMessage = () => {
    console.log(
      "Attempting to send message:",
      newMessage,
      selectedUserId,
      user?.id,
      selectedUser,
    );
    if (!newMessage.trim() || !selectedUserId || !user) {
      console.warn("Send aborted: Missing data", {
        msg: newMessage,
        target: selectedUserId,
        user: user?.id,
        selectedObject: selectedUser,
      });
      return;
    }
    sendMessage({
      content: newMessage,
      senderId: user.id,
      receiverId: selectedUserId,
    });
    setNewMessage("");
  };

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  const handleSelectUser = (user: User) => {
    // Navigate to the user's specific route, passing user object in state to avoid fetch
    navigate(`/messages/${user.username}`, { state: { user } });
  };

  return (
    <div className="w-full flex h-full md:h-[calc(100vh-2rem)] md:pt-4 md:pb-4 md:px-4 flex-col md:flex-row">
      {/* Sidebar List */}
      <div
        className={`w-full h-full md:border ${borderClass} rounded-lg flex overflow-hidden relative shadow-lg`}
      >
        <div
          className={`w-full md:w-[397px] border-r ${borderClass} flex flex-col absolute md:relative inset-0 z-10 ${theme === "dark" ? "bg-black" : "bg-white"} ${selectedUser ? "hidden md:flex" : "flex"}`}
        >
          <div
            className={`h-[75px] px-5 flex items-center justify-between border-b ${borderClass} shrink-0`}
          >
            <div className="flex items-center gap-2 cursor-pointer">
              <span className="font-bold text-xl">{profile?.username}</span>
              <ChevronDown size={20} />
            </div>
            <Edit size={24} className="cursor-pointer" />
          </div>

          <div className="px-5 py-4 shrink-0">
            <div
              className={`flex items-center gap-2 px-3 py-2 rounded-lg ${theme === "dark" ? "bg-[#262626]" : "bg-gray-100"}`}
            >
              <Search size={16} className="text-[#8e8e8e]" />
              <input
                type="text"
                placeholder="অনুসন্ধান"
                className="bg-transparent border-none outline-none text-sm w-full placeholder-[#8e8e8e]"
              />
            </div>
          </div>
          <div className="flex-grow overflow-y-auto">
            {conversations.map((u) => (
              <div
                key={u.username}
                onClick={() => handleSelectUser(u)}
                className={`flex items-center gap-3 px-5 py-3 cursor-pointer transition-colors ${bgHover} ${selectedUser?.username === u.username ? (theme === "dark" ? "bg-zinc-900" : "bg-gray-100") : ""}`}
              >
                <div className="relative flex-shrink-0 w-14 h-14 rounded-full overflow-hidden">
                  <OptimizedImage
                    src={u.avatar}
                    className="w-full h-full"
                    alt={u.username}
                  />
                </div>
                <div className="flex-grow min-w-0">
                  <div className="text-sm truncate font-bold">{u.username}</div>
                  <div
                    className={`text-xs truncate ${theme === "dark" ? "text-[#a8a8a8]" : "text-gray-500"}`}
                  >
                    মেসেজ...
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Chat Area */}
        <div
          className={`w-full flex-grow flex flex-col absolute md:relative inset-0 z-20 ${theme === "dark" ? "bg-black" : "bg-white"} ${!selectedUser ? "hidden md:flex" : "flex"}`}
        >
          {selectedUser ? (
            <>
              <div
                className={`h-[75px] px-4 flex items-center justify-between border-b ${borderClass} shrink-0`}
              >
                <div className="flex items-center gap-3">
                  <div
                    className="md:hidden cursor-pointer -ml-2 p-2"
                    onClick={() => navigate('/messages')}
                  >
                    <ChevronLeft size={28} />
                  </div>
                  <div
                    className="w-8 h-8 rounded-full overflow-hidden cursor-pointer"
                    onClick={() =>
                      navigate(`/profile/${selectedUser.username}`)
                    }
                  >
                    <OptimizedImage
                      src={selectedUser.avatar}
                      className="w-full h-full"
                      alt="chat user"
                    />
                  </div>
                  <div
                    className="font-semibold text-base truncate max-w-[150px] cursor-pointer hover:underline"
                    onClick={() =>
                      navigate(`/profile/${selectedUser.username}`)
                    }
                  >
                    {selectedUser.username}
                  </div>
                </div>
                <div className="flex items-center gap-4">
                  <Phone size={24} className="cursor-pointer" />
                  <Video size={24} className="cursor-pointer" />
                  <Info size={24} className="cursor-pointer" />
                </div>
              </div>
              <div className="flex-grow flex flex-col p-4 gap-4 overflow-y-auto">
                {messages.map((msg: DbMessage, idx: number) => (
                  <div
                    key={msg.id || idx}
                    className={`flex gap-2 max-w-[85%] items-end ${msg.sender_id === user?.id ? "self-end justify-end" : "self-start"}`}
                  >
                    <>
                      {msg.content && (
                        <div
                          className={`rounded-2xl px-4 py-2 text-sm ${msg.sender_id === user?.id ? "bg-[#006a4e] text-white" : theme === "dark" ? "bg-[#262626] text-white" : "bg-gray-200 text-black"}`}
                        >
                          {msg.content}
                        </div>
                      )}
                    </>
                  </div>
                ))}
                <div ref={messagesEndRef} />
              </div>
              <div className="p-4 shrink-0">
                <form
                  className={`border ${borderClass} rounded-full px-2 h-11 flex items-center gap-2 ${theme === "dark" ? "bg-black" : "bg-white"}`}
                  onSubmit={(e) => {
                    e.preventDefault();
                    handleSendMessage();
                  }}
                >
                  <div
                    className={`${buttonBg} rounded-full p-2 cursor-pointer ml-1 text-white`}
                  >
                    <Camera size={16} fill="currentColor" />
                  </div>
                  <input
                    type="text"
                    placeholder="মেসেজ..."
                    value={newMessage}
                    onChange={(e) => setNewMessage(e.target.value)}
                    className={`bg-transparent border-none outline-none text-sm flex-grow px-2 ${theme === "dark" ? "text-white placeholder-[#a8a8a8]" : "text-black placeholder-gray-500"}`}
                  />
                  <button
                    type="submit"
                    className="text-blue-500 font-bold px-2 cursor-pointer hover:text-blue-600 disabled:opacity-50"
                    disabled={!newMessage.trim()}
                  >
                    পাঠান
                  </button>
                </form>
              </div>
            </>
          ) : (
            <div className="flex flex-col items-center justify-center h-full gap-4 text-center p-8">
              <div
                className={`w-24 h-24 rounded-full border-2 flex items-center justify-center mb-2 ${theme === "dark" ? "border-white" : "border-black"}`}
              >
                <MessageCircle size={48} strokeWidth={1} />
              </div>
              <div>
                <h2 className="text-xl font-normal mb-1">আপনার মেসেজ</h2>
                <button
                  className={`${buttonBg} text-white px-4 py-1.5 rounded-lg text-sm font-semibold`}
                  onClick={() => showToast("বাম পাশ থেকে চ্যাট শুরু করুন")}
                >
                  মেসেজ পাঠান
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default MessagesView;
