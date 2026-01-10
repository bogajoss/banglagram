import React from 'react';
import { Heart, MessageCircle } from 'lucide-react';
import PostItem from '../components/PostItem';
import { initialData } from '../data/mockData';

interface HomeViewProps {
  currentUser: any;
  stories: any[];
  posts: any[];
  onMessageClick: () => void;
  onStoryClick: (id: number) => void;
  onPostClick: (post: any) => void;
  theme: string;
  buttonBg: string;
  showToast: (msg: string) => void;
  toggleSave: (id: number) => void;
  savedPostIds: Set<number>;
  onUserClick: (user: any) => void;
}

const HomeView: React.FC<HomeViewProps> = ({ 
  currentUser, 
  stories, 
  posts, 
  onMessageClick, 
  onStoryClick, 
  onPostClick, 
  theme, 
  showToast, 
  toggleSave, 
  savedPostIds, 
  onUserClick 
}) => {
  const borderClass = theme === 'dark' ? 'border-zinc-800' : 'border-zinc-200';
  const textSecondary = theme === 'dark' ? 'text-[#a8a8a8]' : 'text-zinc-500';
  
  return (
    <div className="w-full max-w-[630px] pt-0 md:pt-[30px] flex gap-16 flex-col">
      <div className={`md:hidden sticky top-0 z-10 border-b ${borderClass} px-4 h-[60px] flex items-center justify-between ${theme === 'dark' ? 'bg-black' : 'bg-white'}`}>
        <h1 className="text-2xl font-bold tracking-wide italic text-[#006a4e]">Instagram</h1>
        <div className="flex items-center gap-5"><Heart size={24} onClick={() => showToast('নোটিফিকেশন')} /><div className="relative" onClick={onMessageClick}><MessageCircle size={24} /><div className="absolute -top-1 -right-1 bg-[#f42a41] text-[10px] w-4 h-4 rounded-full flex items-center justify-center font-bold text-white">1</div></div></div>
      </div>
      <div className="flex-grow w-full max-w-[470px] mx-auto px-0 md:px-0">
        <div className="flex gap-4 mb-6 overflow-x-auto scrollbar-hide py-4 px-4 md:px-0">
          {stories.map((story) => (
            <div key={story.id} className="flex flex-col items-center gap-1 cursor-pointer flex-shrink-0 w-[66px] group" onClick={() => onStoryClick(story.id)}>
              <div className="w-[66px] h-[66px] rounded-full p-[2px] bg-gradient-to-tr from-[#006a4e] to-[#004d39] group-hover:scale-105 transition-transform duration-200"><div className={`w-full h-full rounded-full p-[2px] ${theme === 'dark' ? 'bg-black' : 'bg-white'}`}><img src={story.img} className="w-full h-full rounded-full object-cover" alt={story.username} /></div></div>
              <span className={`text-xs truncate w-full text-center ${theme === 'dark' ? 'text-[#f5f5f5]' : 'text-black'}`}>{story.username}</span>
            </div>
          ))}
        </div>
        <div className="flex flex-col gap-4 pb-20">
          {posts.map(post => <PostItem key={post.id} post={post} theme={theme} showToast={showToast} onPostClick={onPostClick} isSaved={savedPostIds.has(post.id)} onToggleSave={() => toggleSave(post.id)} onUserClick={onUserClick} />)}
        </div>
      </div>
      <div className="hidden lg:block w-[319px]">
         <div className="flex items-center justify-between mb-6 mt-2">
            <div className="flex items-center gap-3">
               <img src={currentUser.avatar} className="w-11 h-11 rounded-full object-cover" alt="user" />
               <div className="text-sm"><div className="font-semibold">{currentUser.username}</div><div className={textSecondary}>{currentUser.name}</div></div>
            </div>
            <button className="text-xs font-semibold text-[#006a4e] hover:text-[#004d39]">Switch</button>
         </div>
         <div className="flex justify-between items-center mb-4"><span className={`text-sm font-semibold ${textSecondary}`}>আপনার জন্য প্রস্তাবিত</span></div>
         <div className="flex flex-col gap-3">
            {initialData.suggestedUsers.slice(0,5).map((u,i) => (
               <div key={i} className="flex items-center justify-between hover:bg-white/5 p-2 rounded-lg transition-colors cursor-pointer" onClick={() => onUserClick(u)}>
                  <div className="flex items-center gap-3">
                     <img src={u.avatar} className="w-8 h-8 rounded-full object-cover" alt={u.username} />
                     <div className="flex flex-col"><span className="text-xs font-semibold">{u.username}</span><span className={`text-[10px] ${textSecondary}`}>Suggested for you</span></div>
                  </div>
                  <button className={`text-xs font-semibold text-[#006a4e] hover:text-[#004d39]`} onClick={(e) => { e.stopPropagation(); showToast('ফলো করা হচ্ছে'); }}>ফলো</button>
               </div>
            ))}
         </div>
         <div className={`mt-8 text-xs ${textSecondary} space-y-4`}>
           <div className="flex flex-wrap gap-1"><span>About</span>•<span>Help</span>•<span>Press</span>•<span>API</span>•<span>Jobs</span>•<span>Privacy</span>•<span>Terms</span></div>
           <div>© 2026 INSTAGRAM FROM META (BD)</div>
        </div>
      </div>
    </div>
  );
}

export default HomeView;
