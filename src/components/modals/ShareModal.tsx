import React from 'react';
import { X, Search, Copy, PlusSquare } from 'lucide-react';
import { initialData } from '../../data/mockData';
import type { User } from '../../types';

interface ShareModalProps {
  onClose: () => void;
  theme: string;
  showToast: (msg: string) => void;
  glassModal: string;
}

import OptimizedImage from '../OptimizedImage';

const ShareModal: React.FC<ShareModalProps> = ({ onClose, theme, showToast, glassModal }) => {
    // Note: In a real app you might want to pass these users as props or fetch them
    const users = [...initialData.messages.map(m => m.user), ...initialData.suggestedUsers].slice(0, 8) as User[]; 

    return (
        <div className="fixed inset-0 z-[100] bg-black/60 flex items-center justify-center p-4 animate-fade-in" onClick={onClose}>
            <div className={`w-full max-w-md rounded-xl overflow-hidden shadow-2xl ${glassModal} ${theme === 'dark' ? 'text-white' : 'text-black'}`} onClick={e => e.stopPropagation()}>
                <div className={`p-3 border-b text-center font-bold relative ${theme === 'dark' ? 'border-zinc-800' : 'border-zinc-200'}`}>
                   শেয়ার করুন
                   <X className="absolute right-3 top-3 cursor-pointer" onClick={onClose} />
                </div>
                <div className={`p-4 border-b ${theme === 'dark' ? 'border-zinc-700/50' : 'border-zinc-200'}`}>
                   <div className={`flex items-center gap-2 px-3 py-2 rounded-lg ${theme === 'dark' ? 'bg-[#262626]' : 'bg-gray-100'}`}>
                      <Search size={18} className="text-[#8e8e8e]" />
                      <input type="text" placeholder="অনুসন্ধান" className="bg-transparent border-none outline-none text-sm w-full" />
                   </div>
                </div>
                <div className="h-64 overflow-y-auto p-2">
                   {users.map((user, idx) => (
                      <div key={idx} className={`flex items-center justify-between p-2 rounded-lg ${theme === 'dark' ? 'hover:bg-white/5' : 'hover:bg-black/5'} cursor-pointer transition-colors`}>
                         <div className="flex items-center gap-3">
                            <div className="w-10 h-10 rounded-full overflow-hidden">
                               <OptimizedImage src={user.avatar} className="w-full h-full" alt={user.username} />
                            </div>
                            <div className="flex flex-col">
                               <span className="text-sm font-semibold">{user.username}</span>
                               <span className="text-xs opacity-70">{user.name || user.username}</span>
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
                   ))}
                </div>
                <div className={`p-4 border-t ${theme === 'dark' ? 'border-zinc-800' : 'border-zinc-200'} flex gap-4 overflow-x-auto`}>
                    <div className="flex flex-col items-center gap-1 cursor-pointer min-w-[60px]" onClick={() => { showToast('লিঙ্ক কপি করা হয়েছে'); onClose(); }}>
                       <div className={`w-12 h-12 rounded-full border flex items-center justify-center ${theme === 'dark' ? 'border-zinc-700 bg-black' : 'border-gray-300 bg-white'}`}>
                          <Copy size={20} />
                       </div>
                       <span className="text-xs">লিঙ্ক কপি</span>
                    </div>
                    <div className="flex flex-col items-center gap-1 cursor-pointer min-w-[60px]" onClick={() => { showToast('আপনার স্টোরিতে যোগ করা হয়েছে'); onClose(); }}>
                       <div className={`w-12 h-12 rounded-full border flex items-center justify-center ${theme === 'dark' ? 'border-zinc-700 bg-black' : 'border-gray-300 bg-white'}`}>
                          <PlusSquare size={20} />
                       </div>
                       <span className="text-xs">স্টোরিতে দিন</span>
                    </div>
                </div>
            </div>
        </div>
    );
}

export default ShareModal;