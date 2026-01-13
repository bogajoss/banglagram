import React, { useState, useEffect, useRef } from "react";
import {
  ChevronDown,
  Edit,
  Search,
  ChevronLeft,
  Info,
  Camera,
  MessageCircle,
  X,
  Check,
  CheckCheck,
  Smile,
  Mic,
} from "lucide-react";
import VoiceRecorder from "../components/VoiceRecorder";
import AudioPlayer from "../components/AudioPlayer";

import EmojiPicker, { Theme as EmojiTheme } from "emoji-picker-react";
import { useAppStore } from "../store/useAppStore";
import { supabase } from "../lib/supabaseClient";
import { useAuth } from "../hooks/useAuth";
import type { User } from "../types";
import {
  useGetMessages,
  MESSAGES_QUERY_KEY,
} from "../hooks/queries/useGetMessages";
import { useGetConversations, getUniqueConversations } from "../hooks/queries/useGetConversations";

import { useSendMessage } from "../hooks/mutations/useSendMessage";
import { useMarkMessagesRead } from "../hooks/mutations/useMarkMessagesRead";
import { useTypingIndicator } from "../hooks/useTypingIndicator";
import { useQueryClient } from "@tanstack/react-query";
import type { Database } from "../database.types";

import OptimizedImage from "../components/OptimizedImage";
import VerifiedBadge from "../components/VerifiedBadge";

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

  // Fetch profile if username is in param but not in state
  const { data: profileData } = useGetProfile(username || "", user?.id);

  // Derive selectedUser
  const selectedUser =
    (location.state?.user as User) || (profileData?.user as User) || null;

  const [newMessage, setNewMessage] = useState("");
  const [searchQuery, setSearchQuery] = useState("");
  const [searchResults, setSearchResults] = useState<User[]>([]);
  const [isSearching, setIsSearching] = useState(false);
  const [isUploading, setIsUploading] = useState(false);
  const [showEmojiPicker, setShowEmojiPicker] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const emojiPickerRef = useRef<HTMLDivElement>(null);
  const [showRecorder, setShowRecorder] = useState(false);


  const borderClass = theme === "dark" ? "border-zinc-800" : "border-zinc-200";
  const bgHover = theme === "dark" ? "hover:bg-zinc-900" : "hover:bg-gray-100";

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (
        emojiPickerRef.current &&
        !emojiPickerRef.current.contains(event.target as Node)
      ) {
        setShowEmojiPicker(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  // Search logic
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

  // Fetch conversations
  const {
    data: conversationsData,
    fetchNextPage: fetchNextConvos,
    hasNextPage: hasNextConvos,
  } = useGetConversations(user?.id);

  const conversations = React.useMemo(() => {
    if (!conversationsData || !user?.id) return [];
    return getUniqueConversations(conversationsData.pages, user.id);
  }, [conversationsData, user?.id]);

  // Derive selectedUserId
  const selectedUserId =
    selectedUser?.id ||
    conversations.find((c) => c.username === selectedUser?.username)?.id;


  // Use Hooks for Infinite Scroll
  const {
    data: messagesData,
    fetchNextPage,
    hasNextPage,
    isFetchingNextPage
  } = useGetMessages(user?.id, selectedUserId);

  const messages = React.useMemo<DbMessage[]>(() => {
    if (!messagesData) return [];
    const allMsgs = messagesData.pages.flat() as DbMessage[];
    return [...allMsgs].reverse();
  }, [messagesData]);


  const { mutate: sendMessage } = useSendMessage();
  const { mutate: markRead } = useMarkMessagesRead();
  const { typingUsers, setTyping } = useTypingIndicator(selectedUserId ? [user?.id, selectedUserId].sort().join("-") : "");

  // Mark messages as read when viewing
  useEffect(() => {
    if (user?.id && selectedUserId && messages.length > 0) {
      // Check if there are unread messages from the other user
      const hasUnread = (messages as DbMessage[]).some(
        (m: DbMessage) => m.sender_id === selectedUserId && !m.is_read
      );

      if (hasUnread) {
        markRead({ senderId: selectedUserId, receiverId: user.id });
      }
    }
  }, [messages, selectedUserId, user?.id, markRead]);

  // Typing indicator logic
  useEffect(() => {
    if (selectedUserId) {
      if (newMessage.length > 0) {
        setTyping(true);
      } else {
        setTyping(false);
      }
    }
  }, [newMessage, selectedUserId, setTyping]);

  // Realtime Subscription
  useEffect(() => {
    if (!user) return;

    const channel = supabase
      .channel("chat_messages_realtime")
      .on(
        "postgres_changes",
        {
          event: "*", // Listen to all events (INSERT, UPDATE)
          schema: "public",
          table: "messages",
        },
        (payload) => {
          if (!payload.new) return;
          const msg = payload.new as DbMessage;

          // Invalidate conversations to update last message/unread count
          queryClient.invalidateQueries({ queryKey: ["conversations"] });

          if (!selectedUserId) return;

          const isRelevant =
            (msg.sender_id === selectedUserId && msg.receiver_id === user.id) ||
            (msg.sender_id === user.id && msg.receiver_id === selectedUserId);


          if (isRelevant) {
            queryClient.invalidateQueries({
              queryKey: MESSAGES_QUERY_KEY(selectedUserId),
            });
          }
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [user, selectedUserId, queryClient]);

  const handleEmojiClick = (emojiData: { emoji: string }) => {
    setNewMessage((prev) => prev + emojiData.emoji);
  };

  const handleSendMessage = () => {
    if (!newMessage.trim() || !selectedUserId || !user) return;
    sendMessage({
      content: newMessage,
      senderId: user.id,
      receiverId: selectedUserId,
    });
    setNewMessage("");
    setTyping(false);
    setShowEmojiPicker(false);
  };

  const handleSendVoiceMessage = async (blob: Blob) => {
    if (!user || !selectedUserId) return;

    setIsUploading(true);
    try {
      const fileName = `${user.id}-${Date.now()}.webm`;
      const filePath = `${fileName}`;

      const { error: uploadError } = await supabase.storage
        .from("messages")
        .upload(filePath, blob);

      if (uploadError) throw uploadError;

      const { data: { publicUrl } } = supabase.storage
        .from("messages")
        .getPublicUrl(filePath);

      sendMessage({
        senderId: user.id,
        receiverId: selectedUserId,
        mediaUrl: publicUrl,
      });
      setShowRecorder(false);
    } catch (error) {
      showToast("ভয়েস মেসেজ পাঠাতে সমস্যা হয়েছে");
      console.error(error);
    } finally {
      setIsUploading(false);
    }
  };


  const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file || !user || !selectedUserId) return;

    setIsUploading(true);
    try {
      const fileExt = file.name.split(".").pop();
      const fileName = `${user.id}-${Date.now()}.${fileExt}`;
      const filePath = `${fileName}`;

      const { error: uploadError } = await supabase.storage
        .from("messages")
        .upload(filePath, file);

      if (uploadError) throw uploadError;

      const { data: { publicUrl } } = supabase.storage
        .from("messages")
        .getPublicUrl(filePath);

      sendMessage({
        senderId: user.id,
        receiverId: selectedUserId,
        mediaUrl: publicUrl,
      });
    } catch (error) {
      showToast("ছবি পাঠাতে সমস্যা হয়েছে");
      console.error(error);
    } finally {
      setIsUploading(false);
      if (fileInputRef.current) fileInputRef.current.value = "";
    }
  };

  const prevMessagesLength = useRef(0);
  useEffect(() => {
    // Only scroll to bottom if we have new messages (length increased) 
    // AND the last message is from the user or it's a very short list (initial load)
    if (messages.length > prevMessagesLength.current) {
      const lastMsg = messages[messages.length - 1];
      if (lastMsg?.sender_id === user?.id || messages.length < 25) {
        messagesEndRef.current?.scrollIntoView({ behavior: prevMessagesLength.current === 0 ? "auto" : "smooth" });
      }
    }
    prevMessagesLength.current = messages.length;
  }, [messages, typingUsers, user?.id]);


  const handleSelectUser = (user: User) => {
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
            <div className="flex items-center gap-2">
              <div
                className="md:hidden cursor-pointer -ml-2 p-1"
                onClick={() => navigate("/")}
              >
                <ChevronLeft size={28} />
              </div>
              <div className="flex items-center gap-2 cursor-pointer">
                <span className="font-bold text-xl">{profile?.username}</span>
                <ChevronDown size={20} />
              </div>
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
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="bg-transparent border-none outline-none text-sm w-full placeholder-[#8e8e8e]"
              />
              {searchQuery && (
                <X
                  size={16}
                  className="cursor-pointer text-[#8e8e8e]"
                  onClick={() => setSearchQuery("")}
                />
              )}
            </div>
          </div>
          <div className="flex-grow overflow-y-auto">
            {searchQuery ? (
              // Search Results
              <>
                {isSearching ? (
                  <div className="p-4 text-center text-sm text-gray-500">
                    অনুসন্ধান করা হচ্ছে...
                  </div>
                ) : searchResults.length === 0 ? (
                  <div className="p-4 text-center text-sm text-gray-500">
                    কোনো ফলাফল পাওয়া যায়নি
                  </div>
                ) : (
                  searchResults.map((u) => (
                    <div
                      key={u.username}
                      onClick={() => {
                        handleSelectUser(u);
                        setSearchQuery("");
                      }}
                      className={`flex items-center gap-3 px-5 py-3 cursor-pointer transition-colors ${bgHover}`}
                    >
                      <div className="relative flex-shrink-0 w-14 h-14 rounded-full overflow-hidden">
                        <OptimizedImage
                          src={u.avatar}
                          className="w-full h-full"
                          alt={u.username}
                        />
                      </div>
                      <div className="flex-grow min-w-0">
                        <div className="text-sm truncate font-bold flex items-center gap-1">
                          {u.username}
                          {u.isVerified && <VerifiedBadge />}
                        </div>
                        <div
                          className={`text-xs truncate ${theme === "dark" ? "text-[#a8a8a8]" : "text-gray-500"}`}
                        >
                          {u.name}
                        </div>
                      </div>
                    </div>
                  ))
                )}
              </>
            ) : (
              // Recent Conversations
              conversations.map((u) => (
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
                    <div className="text-sm truncate font-bold flex items-center gap-1">
                      {u.username}
                      {u.isVerified && <VerifiedBadge />}
                    </div>
                    <div
                      className={`text-xs truncate ${theme === "dark" ? "text-[#a8a8a8]" : "text-gray-500"}`}
                    >
                      মেসেজ...
                    </div>
                  </div>
                </div>
              ))
            )}
            {hasNextConvos && (
              <div className="p-4 text-center">
                <button
                  onClick={() => fetchNextConvos()}
                  className="text-xs text-[#006a4e] font-bold hover:underline"
                >
                  পুরানো চ্যাট লোড করুন
                </button>
              </div>
            )}
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
                    onClick={() => navigate("/messages")}
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
                    className="font-semibold text-base truncate max-w-[150px] cursor-pointer hover:underline flex items-center gap-1"
                    onClick={() =>
                      navigate(`/profile/${selectedUser.username}`)
                    }
                  >
                    {selectedUser.username}
                    {selectedUser.isVerified && <VerifiedBadge />}
                  </div>
                </div>
                <div className="flex items-center gap-4">
                  <Info size={24} className="cursor-pointer" />
                </div>
              </div>
              <div className="flex-grow flex flex-col p-4 gap-4 overflow-y-auto">
                {hasNextPage && (
                  <div className="flex justify-center py-2">
                    <button
                      onClick={() => fetchNextPage()}
                      disabled={isFetchingNextPage}
                      className="text-xs text-[#006a4e] font-bold py-1 px-3 rounded-full bg-zinc-100 dark:bg-zinc-800 hover:bg-zinc-200 dark:hover:bg-zinc-700 transition-colors"
                    >
                      {isFetchingNextPage ? "লোড হচ্ছে..." : "পুরানো মেসেজ দেখুন"}
                    </button>
                  </div>
                )}

                {messages.map((msg: DbMessage, idx: number) => (

                  <div
                    key={msg.id || idx}
                    className={`flex flex-col gap-1 max-w-[85%] ${msg.sender_id === user?.id ? "self-end items-end" : "self-start items-start"}`}
                  >
                    {msg.media_url && (
                      <div className="rounded-2xl overflow-hidden mb-1 border border-zinc-800">
                        {msg.media_url.endsWith(".webm") ? (
                          <AudioPlayer src={msg.media_url.includes("/storage/v1/object/messages/") && !msg.media_url.includes("/storage/v1/object/public/")
                            ? msg.media_url.replace("/storage/v1/object/messages/", "/storage/v1/object/public/messages/")
                            : msg.media_url}
                            theme={theme}
                          />
                        ) : (
                          <OptimizedImage
                            src={msg.media_url.includes("/storage/v1/object/messages/") && !msg.media_url.includes("/storage/v1/object/public/")
                              ? msg.media_url.replace("/storage/v1/object/messages/", "/storage/v1/object/public/messages/")
                              : msg.media_url}
                            width={300}
                            className="max-w-full h-auto max-h-[300px] object-cover"
                            alt="Shared image"
                          />
                        )}
                      </div>
                    )}

                    {msg.content && (
                      <div
                        className={`rounded-2xl px-4 py-2 text-sm ${msg.sender_id === user?.id ? "bg-[#006a4e] text-white" : theme === "dark" ? "bg-[#262626] text-white" : "bg-gray-200 text-black"}`}
                      >
                        {msg.content}
                      </div>
                    )}
                    {msg.sender_id === user?.id && (
                      <div className="text-[10px] text-gray-500 flex items-center gap-1">
                        {msg.is_read ? <CheckCheck size={12} className="text-blue-500" /> : <Check size={12} />}
                      </div>
                    )}
                  </div>
                ))}
                <div ref={messagesEndRef} />

                {/* Typing Indicator */}
                {typingUsers.length > 0 && (
                  <div className="text-xs text-gray-500 px-4 pb-2 animate-pulse">
                    {typingUsers.join(", ")} টাইপ করছে...
                  </div>
                )}
              </div>
              <div className="p-4 shrink-0 relative">
                {/* Emoji Picker */}
                {showEmojiPicker && (
                  <div
                    ref={emojiPickerRef}
                    className="absolute bottom-20 left-4 z-50 shadow-2xl"
                  >
                    <EmojiPicker
                      theme={theme === "dark" ? EmojiTheme.DARK : EmojiTheme.LIGHT}
                      onEmojiClick={handleEmojiClick}
                      lazyLoadEmojis={true}
                      skinTonesDisabled={true}
                      searchDisabled={false}
                    />
                  </div>
                )}

                {showRecorder ? (
                  <div className={`p-2 border ${borderClass} rounded-[24px] ${theme === "dark" ? "bg-black" : "bg-white"}`}>
                    <VoiceRecorder
                      onRecordingComplete={handleSendVoiceMessage}
                      onCancel={() => setShowRecorder(false)}
                    />
                  </div>
                ) : (

                  <form
                    className={`border ${borderClass} rounded-[24px] min-h-[44px] flex items-end gap-1 p-1 ${theme === "dark" ? "bg-black" : "bg-white"}`}
                    onSubmit={(e) => {
                      e.preventDefault();
                      handleSendMessage();
                    }}
                  >
                    {/* Emoji Button */}
                    <div
                      className={`p-2 shrink-0 cursor-pointer transition-colors rounded-full ${theme === "dark" ? "hover:bg-zinc-800 text-zinc-400" : "hover:bg-gray-100 text-zinc-500"}`}
                      onClick={() => setShowEmojiPicker(!showEmojiPicker)}
                    >
                      <Smile size={24} />
                    </div>

                    {!newMessage.trim() && (
                      <>
                        {/* Media Upload */}
                        <div
                          className={`p-2 shrink-0 cursor-pointer transition-colors rounded-full relative overflow-hidden ${theme === "dark" ? "hover:bg-zinc-800 text-zinc-400" : "hover:bg-gray-100 text-zinc-500"}`}
                        >
                          <Camera size={24} />
                          <input
                            type="file"
                            ref={fileInputRef}
                            accept="image/*"
                            className="absolute inset-0 opacity-0 cursor-pointer"
                            onChange={handleImageUpload}
                            disabled={isUploading}
                          />
                        </div>

                        {/* Voice Mic */}
                        <div
                          className={`p-2 shrink-0 cursor-pointer transition-colors rounded-full ${theme === "dark" ? "hover:bg-zinc-800 text-zinc-400" : "hover:bg-gray-100 text-zinc-500"}`}
                          onClick={() => setShowRecorder(true)}
                        >
                          <Mic size={24} />
                        </div>
                      </>
                    )}

                    <div className="flex-grow flex items-center min-w-0 h-full py-1">
                      <input
                        type="text"
                        placeholder="মেসেজ..."
                        value={newMessage}
                        onChange={(e) => setNewMessage(e.target.value)}
                        onFocus={() => setShowEmojiPicker(false)}
                        className={`bg-transparent border-none outline-none text-sm w-full px-2 py-1 ${theme === "dark" ? "text-white placeholder-[#a8a8a8]" : "text-black placeholder-gray-500"}`}
                      />
                    </div>

                    {newMessage.trim() || isUploading ? (
                      <button
                        type="submit"
                        className="text-blue-500 font-bold px-3 py-2 shrink-0 cursor-pointer hover:text-blue-600 disabled:opacity-50 transition-colors"
                        disabled={(!newMessage.trim() && !isUploading) || isUploading}
                      >
                        {isUploading ? "..." : "পাঠান"}
                      </button>
                    ) : null}
                  </form>

                )}

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
