import React, { useState, useEffect } from 'react';
import { ChevronDown, Edit, Plus, Search, ChevronLeft, Phone, Video, Info, Camera, Smile, Image as ImageIcon, Heart, MessageCircle } from 'lucide-react';
import { initialData } from '../data/mockData';
import { useAppStore } from '../store/useAppStore';
import { User, Message, ChatMessage } from '../types';

const MessagesView: React.FC = () => {
  const { currentUser, theme, showToast } = useAppStore();
  const buttonBg = 'bg-[#006a4e] hover:bg-[#00523c]'; 

  const [selectedUser, setSelectedUser] = useState<User | null>((initialData.messages[0] as unknown as Message).user); 
  const borderClass = theme === 'dark' ? 'border-zinc-800' : 'border-zinc-200';
  const bgHover = theme === 'dark' ? 'hover:bg-zinc-900' : 'hover:bg-gray-100';
  
  useEffect(() => {
     const handlePopState = () => { if (selectedUser) setSelectedUser(null); };
     window.addEventListener('popstate', handlePopState);
     return () => window.removeEventListener('popstate', handlePopState);
  }, [selectedUser]);

  const handleSelectUser = (user: User) => {
     setSelectedUser(user);
     if (window.innerWidth < 768) {
        window.history.pushState({chat: true}, "");
     }
  }

  const activeConversation: ChatMessage[] = (initialData.messages as unknown as Message[]).find(m => m.user.username === selectedUser?.username)?.chatHistory || [];

  return (
    <div className="w-full max-w-[935px] flex h-full md:h-screen md:pt-4 md:pb-4 md:px-4 flex-col md:flex-row">
      <div className={`w-full h-full md:border ${borderClass} rounded-lg flex overflow-hidden relative shadow-lg`}>
        
        <div className={`w-full md:w-[397px] border-r ${borderClass} flex flex-col absolute md:relative inset-0 z-10 ${theme === 'dark' ? 'bg-black' : 'bg-white'} ${selectedUser ? 'hidden md:flex' : 'flex'}`}>
          <div className={`h-[75px] px-5 flex items-center justify-between border-b ${borderClass} shrink-0`}>
            <div className="flex items-center gap-2 cursor-pointer"><span className="font-bold text-xl">{currentUser.username}</span><ChevronDown size={20} /></div>
            <Edit size={24} className="cursor-pointer" />
          </div>

          {/* Notes Section */}
          <div className={`py-4 pl-4 overflow-x-auto scrollbar-hide flex gap-4 border-b ${borderClass}`}>
              <div className="flex flex-col items-center gap-1 cursor-pointer min-w-[70px]">
                 <div className="relative">
                    <img src={currentUser.avatar} className="w-14 h-14 rounded-full object-cover" alt="My note" />
                    <div className="absolute -top-4 -right-2 bg-white/90 text-black text-xs p-2 rounded-xl rounded-bl-none shadow-sm min-w-[60px] text-center z-10">
                       নোট দিন...
                    </div>
                    <div className="absolute bottom-0 right-0 bg-gray-200 rounded-full p-0.5 border-2 border-black z-20">
                      <Plus size={12} className="text-black" />
                    </div>
                 </div>
                 <span className={`text-xs ${theme === 'dark' ? 'text-gray-400' : 'text-gray-500'}`}>আপনার নোট</span>
              </div>

              {/* Mock Notes from initialData (using existing message users for demo) */}
              {(initialData.messages as unknown as Message[]).slice(0,3).map((msg, idx) => (
                 <div key={idx} className="flex flex-col items-center gap-1 cursor-pointer min-w-[70px]">
                    <div className="relative">
                       <img src={msg.user.avatar} className={`w-14 h-14 rounded-full object-cover border ${borderClass}`} alt="note user" />
                       <div className="absolute -top-6 left-1/2 transform -translate-x-1/2 bg-white/90 text-black text-[11px] px-2 py-1.5 rounded-xl rounded-bl-none shadow-sm whitespace-nowrap z-10 max-w-[90px] truncate">
                          {idx === 0 ? 'বিরিয়ানি 🍗' : idx === 1 ? 'জিম টাইম 💪' : 'কাজ আর কাজ 😫'}
                       </div>
                    </div>
                    <span className={`text-xs ${theme === 'dark' ? 'text-gray-400' : 'text-gray-500'} truncate w-16 text-center`}>{msg.user.username}</span>
                 </div>
              ))}
           </div>

          <div className="px-5 py-4 shrink-0">
             <div className={`flex items-center gap-2 px-3 py-2 rounded-lg ${theme === 'dark' ? 'bg-[#262626]' : 'bg-gray-100'}`}><Search size={16} className="text-[#8e8e8e]" /><input type="text" placeholder="অনুসন্ধান" className="bg-transparent border-none outline-none text-sm w-full placeholder-[#8e8e8e]" /></div>
          </div>
          <div className="flex-grow overflow-y-auto">
            {(initialData.messages as unknown as Message[]).map((msg) => (
              <div key={msg.id} onClick={() => handleSelectUser(msg.user)} className={`flex items-center gap-3 px-5 py-3 cursor-pointer transition-colors ${bgHover} ${selectedUser?.username === msg.user.username ? (theme === 'dark' ? 'bg-zinc-900' : 'bg-gray-100') : ''}`}>
                <div className="relative flex-shrink-0"><img src={msg.user.avatar} className="w-14 h-14 rounded-full object-cover" alt={msg.user.username} /></div>
                <div className="flex-grow min-w-0">
                  <div className="text-sm truncate font-bold">{msg.user.username}</div>
                  <div className={`text-xs truncate ${theme === 'dark' ? 'text-[#a8a8a8]' : 'text-gray-500'}`}>{msg.lastMessage} · {msg.time}</div>
                </div>
              </div>
            ))}
          </div>
        </div>

        <div className={`w-full flex-grow flex flex-col absolute md:relative inset-0 z-20 ${theme === 'dark' ? 'bg-black' : 'bg-white'} ${!selectedUser ? 'hidden md:flex' : 'flex'}`}>
          {selectedUser ? (
            <>
              <div className={`h-[75px] px-4 flex items-center justify-between border-b ${borderClass} shrink-0`}>
                <div className="flex items-center gap-3">
                  <div className="md:hidden cursor-pointer -ml-2 p-2" onClick={() => setSelectedUser(null)}><ChevronLeft size={28} /></div>
                  <img src={selectedUser.avatar} className="w-8 h-8 rounded-full object-cover" alt="chat user" />
                  <div className="font-semibold text-base truncate max-w-[150px]">{selectedUser.username}</div>
                </div>
                <div className="flex items-center gap-4"><Phone size={24} className="cursor-pointer" /><Video size={24} className="cursor-pointer" /><Info size={24} className="cursor-pointer" /></div>
              </div>
              <div className="flex-grow flex flex-col p-4 gap-4 overflow-y-auto">
                 {activeConversation.map((msg, idx) => (
                    <div key={idx} className={`flex gap-2 self-start max-w-[85%] items-end ${msg.type === 'date' ? 'w-full justify-center !max-w-full' : ''}`}>
                       {msg.type === 'date' ? <span className="text-xs text-gray-500 my-2">{msg.text}</span> : (
                         <>
                           {msg.contentType === 'text' && <div className={`rounded-2xl px-4 py-2 text-sm ${theme === 'dark' ? 'bg-[#262626] text-white' : 'bg-gray-200 text-black'}`}>{msg.text}</div>}
                           {msg.contentType === 'image' && <div className={`rounded-xl overflow-hidden border ${borderClass}`}><img src={msg.src} className="max-w-[200px]" alt="msg image" /></div>}
                           {msg.contentType === 'profile' && <div className={`rounded-xl p-3 border ${borderClass} flex items-center gap-3 ${theme === 'dark' ? 'bg-[#262626]' : 'bg-gray-100'}`}><img src={msg.avatar} className="w-10 h-10 rounded-full" alt="profile" /><div><div className="font-bold text-sm">{msg.username}</div><div className="text-xs opacity-70">প্রোফাইল দেখুন</div></div></div>}
                           {msg.contentType === 'post' && <div className={`rounded-xl overflow-hidden border ${borderClass} ${theme === 'dark' ? 'bg-[#262626]' : 'bg-gray-100'}`}><img src={msg.src} className="max-w-[200px]" alt="post" /><div className="p-2 text-xs opacity-80 truncate max-w-[200px]">{msg.caption}</div></div>}
                         </>
                       )}
                    </div>
                 ))}
                 <div className="self-end max-w-[70%] bg-[#006a4e] rounded-2xl px-4 py-2 text-sm text-white mt-auto">এখনই পাঠানো হয়েছে</div>
              </div>
              <div className="p-4 shrink-0">
                <div className={`border ${borderClass} rounded-full px-2 h-11 flex items-center gap-2 ${theme === 'dark' ? 'bg-black' : 'bg-white'}`}>
                   <div className={`${buttonBg} rounded-full p-2 cursor-pointer ml-1 text-white`}><Camera size={16} fill="currentColor" /></div>
                   <input type="text" placeholder="মেসেজ..." className={`bg-transparent border-none outline-none text-sm flex-grow px-2 ${theme === 'dark' ? 'text-white placeholder-[#a8a8a8]' : 'text-black placeholder-gray-500'}`} />
                   <div className="flex items-center gap-3 pr-2 text-zinc-500"><Smile size={24} /><ImageIcon size={24} /><Heart size={24} /></div>
                </div>
              </div>
            </>
          ) : (
            <div className="flex flex-col items-center justify-center h-full gap-4 text-center p-8">
               <div className={`w-24 h-24 rounded-full border-2 flex items-center justify-center mb-2 ${theme === 'dark' ? 'border-white' : 'border-black'}`}><MessageCircle size={48} strokeWidth={1} /></div>
               <div><h2 className="text-xl font-normal mb-1">আপনার মেসেজ</h2><button className={`${buttonBg} text-white px-4 py-1.5 rounded-lg text-sm font-semibold`} onClick={() => showToast('মেসেজ ফিচার শীঘ্রই আসছে')}>মেসেজ পাঠান</button></div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

export default MessagesView;
