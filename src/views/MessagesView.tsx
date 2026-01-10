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
import { useGetMessages, MESSAGES_QUERY_KEY } from "../hooks/queries/useGetMessages";
import { useSendMessage } from "../hooks/mutations/useSendMessage";
import { useQueryClient } from "@tanstack/react-query";
import type { Database } from "../database.types";

import OptimizedImage from "../components/OptimizedImage";

type DbMessage = Database['public']['Tables']['messages']['Row'];

const MessagesView: React.FC = () => {
  const { theme, showToast } = useAppStore();
  const { user, profile } = useAuth();
  const queryClient = useQueryClient();
  const buttonBg = "bg-[#006a4e] hover:bg-[#00523c]";

  const [conversations, setConversations] = useState<(User & { id: string })[]>([]);
  const [selectedUser, setSelectedUser] = useState<User | null>(null);
  const [newMessage, setNewMessage] = useState("");
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const borderClass = theme === "dark" ? "border-zinc-800" : "border-zinc-200";
  const bgHover = theme === "dark" ? "hover:bg-zinc-900" : "hover:bg-gray-100";

  // Fetch unique users (Conversations)
  useEffect(() => {
    if (!user) return;

    const fetchConversations = async () => {
      interface ProfileJoin { id: string; username: string; full_name: string | null; avatar_url: string | null }
      
      const { data, error } = await supabase
        .from('messages')
        .select(`
          sender_id,
          receiver_id,
          created_at,
          sender:profiles!sender_id(id, username, full_name, avatar_url),
          receiver:profiles!receiver_id(id, username, full_name, avatar_url)
        `)
        .or(`sender_id.eq.${user.id},receiver_id.eq.${user.id}`)
        .order('created_at', { ascending: false });

      if (error) {
        console.error('Error fetching conversations', error);
        return;
      }

      const usersMap = new Map<string, User & { id: string }>();
      (data as { sender_id: string; receiver_id: string; sender: ProfileJoin; receiver: ProfileJoin }[]).forEach((msg) => {
        const otherUser = msg.sender_id === user.id ? msg.receiver : msg.sender;
        if (otherUser && !usersMap.has(otherUser.username)) {
           usersMap.set(otherUser.username, {
             id: otherUser.id,
             username: otherUser.username,
             name: otherUser.full_name || otherUser.username,
             avatar: otherUser.avatar_url || "",
             stats: { posts: 0, followers: 0, following: 0 }
           });
        }
      });
      setConversations(Array.from(usersMap.values()));
    };

    fetchConversations();
  }, [user]);

  // Derive selectedUserId from selectedUser
  const selectedUserId = selectedUser 
    ? conversations.find(c => c.username === selectedUser.username)?.id 
    : undefined;

  // Use Hooks
  const { data: messages = [] } = useGetMessages(user?.id, selectedUserId);
  const { mutate: sendMessage } = useSendMessage();

  // Realtime Subscription
  useEffect(() => {
    if (!user || !selectedUserId) return;

    const channel = supabase
      .channel('chat_messages_realtime')
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'messages',
          filter: `receiver_id=eq.${user.id}`, // Incoming messages
        },
        (payload) => {
          const newMsg = payload.new as DbMessage;
          if (newMsg.sender_id === selectedUserId) {
             queryClient.setQueryData(MESSAGES_QUERY_KEY(selectedUserId), (old: DbMessage[] | undefined) => {
                 return old ? [...old, newMsg] : [newMsg];
             });
          }
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [user, selectedUserId, queryClient]);


  const handleSendMessage = () => {
    if (!newMessage.trim() || !selectedUserId || !user) return;
    sendMessage({ content: newMessage, senderId: user.id, receiverId: selectedUserId });
    setNewMessage("");
  };

  useEffect(() => {
      messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  // Handle mobile back button
  useEffect(() => {
    const handlePopState = () => {
      if (selectedUser) setSelectedUser(null);
    };
    window.addEventListener("popstate", handlePopState);
    return () => window.removeEventListener("popstate", handlePopState);
  }, [selectedUser]);

  const handleSelectUser = (user: User) => {
    setSelectedUser(user);
    if (window.innerWidth < 768) {
      window.history.pushState({ chat: true }, "");
    }
  };

  return (
    <div className="w-full max-w-[935px] flex h-full md:h-screen md:pt-4 md:pb-4 md:px-4 flex-col md:flex-row">
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
                  <div className="text-sm truncate font-bold">
                    {u.username}
                  </div>
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
                    onClick={() => setSelectedUser(null)}
                  >
                    <ChevronLeft size={28} />
                  </div>
                  <div className="w-8 h-8 rounded-full overflow-hidden">
                    <OptimizedImage
                      src={selectedUser.avatar}
                      className="w-full h-full"
                      alt="chat user"
                    />
                  </div>
                  <div className="font-semibold text-base truncate max-w-[150px]">
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
                {messages.map((msg: any, idx: number) => (
                  <div
                    key={msg.id || idx}
                    className={`flex gap-2 self-start max-w-[85%] items-end ${msg.sender_id === user?.id ? "self-end justify-end" : ""}`}
                  >
                      <>
                        {msg.content && (
                          <div
                            className={`rounded-2xl px-4 py-2 text-sm ${msg.sender_id === user?.id ? "bg-[#006a4e] text-white" : (theme === "dark" ? "bg-[#262626] text-white" : "bg-gray-200 text-black")}`}
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
                <div
                  className={`border ${borderClass} rounded-full px-2 h-11 flex items-center gap-2 ${theme === "dark" ? "bg-black" : "bg-white"}`}
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
                    onKeyDown={(e) => e.key === 'Enter' && handleSendMessage()}
                    className={`bg-transparent border-none outline-none text-sm flex-grow px-2 ${theme === "dark" ? "text-white placeholder-[#a8a8a8]" : "text-black placeholder-gray-500"}`}
                  />
                  <button onClick={handleSendMessage} className="text-blue-500 font-bold px-2">পাঠান</button>
                </div>
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
