import React, { useState, useMemo } from 'react';
import { ChevronLeft, ChevronDown, PlusSquare, Menu, Plus, Settings, Grid, Bookmark, UserCheck, Camera, Heart, MessageCircle as CommentIcon, AtSign } from 'lucide-react';
import { initialData } from '../data/mockData';
import UserListModal from '../components/modals/UserListModal';
import { useParams, useNavigate } from 'react-router-dom';
import { useAppStore } from '../store/useAppStore';
import type { User, Post, Message, Reel } from '../types';

import OptimizedImage from '../components/OptimizedImage';

const ProfileView: React.FC = () => {
  const { 
    currentUser, 
    posts, 
    savedPostIds, 
    theme, 
    setViewingPost, 
    setEditProfileOpen, 
    addStory, 
    toggleFollow, 
    followedUsers,
    setCreateModalOpen
  } = useAppStore();

  const { username } = useParams();
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState('posts');
  const [listModalType, setListModalType] = useState<'followers' | 'following' | null>(null);

  // Determine which user profile to show
  const user = useMemo((): User => {
    if (!username || username === currentUser.username) {
        return currentUser;
    }
    
    const suggested = initialData.suggestedUsers.find(u => u.username === username);
    if (suggested) return suggested as User;

    const messageUser = (initialData.messages as unknown as Message[]).find(m => m.user.username === username)?.user;
    if (messageUser) return messageUser;

    const reelUser = (initialData.reels as unknown as Reel[]).find(r => r.user.username === username)?.user;
    if (reelUser) return reelUser;
                    
    return {
        username: username,
        name: username,
        avatar: `https://api.dicebear.com/9.x/avataaars/svg?seed=${username}`,
        bio: 'This user is generated for the demo.',
        stats: { posts: 12, followers: 450, following: 300 }
    };
  }, [username, currentUser]);

  const borderClass = theme === 'dark' ? 'border-zinc-800' : 'border-zinc-200';
  const textSecondary = theme === 'dark' ? 'text-[#a8a8a8]' : 'text-zinc-500';
  const isMe = user.username === currentUser.username;
  const userIsFollowing = followedUsers.has(user.username);
  const buttonBg = 'bg-[#006a4e] hover:bg-[#00523c]'; 

  // Fake posts for other users if they don't have real ones in DB
  const userPosts = useMemo((): Post[] => isMe ? posts : initialData.explore.slice(0, 9).map((src, i) => ({
      id: `u-p-${i}`,
      content: { src, type: 'image' as const },
      likes: (i * 45 + 10) % 500,
      comments: (i * 3 + 5) % 50,
      user: user,
      caption: 'Awesome day!',
      time: '3d',
      commentList: []
  })), [isMe, posts, user]);

  const savedPostsList = useMemo(() => posts.filter(p => savedPostIds.has(p.id)), [posts, savedPostIds]);
  const displayPosts = activeTab === 'saved' ? savedPostsList : userPosts;

  const handleOpenList = (type: 'followers' | 'following') => setListModalType(type);
  const handleCloseList = () => setListModalType(null);

  // Generate fake users list for demo
  const getUsersList = () => {
    return initialData.suggestedUsers as User[];
  };

  const onUserClick = (u: User) => {
      navigate(`/profile/${u.username}`);
  }

  const handleStoryUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
      if(e.target.files && e.target.files[0]){
         const file = e.target.files[0];
         const reader = new FileReader();
         reader.onload = (ev) => {
             addStory(ev.target?.result as string);
         }
         reader.readAsDataURL(file);
     }
  }

  return (
    <div className="w-full max-w-[935px] px-0 md:px-5 py-0 md:py-[30px]">
      {listModalType && (
         <UserListModal 
            title={listModalType === 'followers' ? 'ফলোয়ার' : 'ফলোইং'} 
            users={getUsersList()} 
            onClose={handleCloseList} 
            theme={theme}
            onUserClick={(u) => { onUserClick(u); handleCloseList(); }}
            glassModal={theme === 'dark' ? 'bg-[#121212]/90 backdrop-blur-2xl border border-white/10' : 'bg-white/90 backdrop-blur-2xl border border-black/10'}
         />
      )}

      <div className={`md:hidden sticky top-0 z-10 border-b ${borderClass} px-4 h-[44px] flex items-center justify-between ${theme === 'dark' ? 'bg-black/90 backdrop-blur-md' : 'bg-white/90 backdrop-blur-md'}`}>
         <div className="flex items-center gap-1 font-bold text-lg">
           {!isMe && <ChevronLeft size={24} onClick={() => navigate(-1)} className="cursor-pointer mr-2" />}
           {user.username} 
           {isMe && <ChevronDown size={16} />}
         </div>
         <div className="flex gap-6"><PlusSquare size={24} onClick={() => { if(isMe) { setCreateModalOpen(true); } }} /><Menu size={24} /></div>
      </div>
      <header className="flex flex-col md:flex-row gap-6 md:gap-12 mb-4 md:mb-10 items-start md:items-stretch px-4 md:px-0 pt-4 md:pt-0">
        <div className="flex flex-row md:flex-col items-center gap-8 md:gap-0 w-full md:w-auto">
           <div className="flex-shrink-0 md:w-[290px] flex justify-start md:justify-center relative">
              <div className={`w-[77px] h-[77px] md:w-[150px] md:h-[150px] rounded-full overflow-hidden border ${borderClass} group cursor-pointer relative`}>
                 <OptimizedImage src={user.avatar} className="w-full h-full" alt="profile" />
              </div>
              {isMe && (
                  <label className="absolute bottom-0 right-10 md:right-16 bg-[#0095f6] rounded-full p-1 border-2 border-black cursor-pointer">
                     <Plus size={16} className="text-white" />
                     <input type="file" className="hidden" accept="image/*" onChange={handleStoryUpload} />
                  </label>
              )}
           </div>
           <div className="flex md:hidden justify-around flex-grow text-center">
              <div className="flex flex-col"><span className="font-semibold text-lg">{isMe ? user.stats?.posts : userPosts.length}</span><span className={`text-sm ${textSecondary}`}>পোস্ট</span></div>
              <div className="flex flex-col cursor-pointer" onClick={() => handleOpenList('followers')}><span className="font-semibold text-lg">{isMe ? user.stats?.followers : '256'}</span><span className={`text-sm ${textSecondary}`}>ফলোয়ার</span></div>
              <div className="flex flex-col cursor-pointer" onClick={() => handleOpenList('following')}><span className="font-semibold text-lg">{isMe ? user.stats?.following : '124'}</span><span className={`text-sm ${textSecondary}`}>ফলোইং</span></div>
           </div>
        </div>
        <div className="flex-grow flex flex-col gap-4 w-full">
          <div className="flex flex-col md:flex-row items-start md:items-center gap-4">
            <h2 className="text-xl font-normal mr-2 hidden md:block">{user.username}</h2>
            <div className="flex gap-2 w-full md:w-auto">
              {isMe ? (
                  <>
                    <button onClick={() => setEditProfileOpen(true)} className={`${theme === 'dark' ? 'bg-[#363636] hover:bg-[#262626]' : 'bg-gray-200 hover:bg-gray-300'} text-sm font-semibold px-4 py-[7px] rounded-lg transition-colors flex-grow md:flex-grow-0 text-center`}>এডিট প্রোফাইল</button>
                    <button className={`${theme === 'dark' ? 'bg-[#363636] hover:bg-[#262626]' : 'bg-gray-200 hover:bg-gray-300'} text-sm font-semibold px-4 py-[7px] rounded-lg transition-colors flex-grow md:flex-grow-0 text-center`}>আর্কাইভ দেখুন</button>
                  </>
              ) : (
                  <>
                    <button 
                        onClick={() => toggleFollow(user.username)}
                        className={`${userIsFollowing ? (theme === 'dark' ? 'bg-[#363636] hover:bg-[#262626]' : 'bg-gray-200') : buttonBg} ${userIsFollowing ? '' : 'text-white'} text-sm font-semibold px-6 py-[7px] rounded-lg transition-colors flex-grow md:flex-grow-0 text-center`}
                    >
                        {userIsFollowing ? 'ফলো করছেন' : 'ফলো'}
                    </button>
                    <button className={`${theme === 'dark' ? 'bg-[#363636] hover:bg-[#262626]' : 'bg-gray-200 hover:bg-gray-300'} text-sm font-semibold px-4 py-[7px] rounded-lg transition-colors flex-grow md:flex-grow-0 text-center`}>মেসেজ</button>
                  </>
              )}
            </div>
            {isMe && <button className={`hidden md:block ${theme === 'dark' ? 'text-white' : 'text-black'}`}><Settings size={24} /></button>}
          </div>
          <div className="hidden md:flex gap-10 text-base">
            <span><span className="font-semibold">{isMe ? user.stats?.posts : userPosts.length}</span> পোস্ট</span>
            <span className="cursor-pointer" onClick={() => handleOpenList('followers')}><span className="font-semibold">{isMe ? user.stats?.followers : '256'}</span> ফলোয়ার</span>
            <span className="cursor-pointer" onClick={() => handleOpenList('following')}><span className="font-semibold">{isMe ? user.stats?.following : '124'}</span> ফলোইং</span>
          </div>
          <div className="text-sm px-1 md:px-0">
            <div className="font-semibold">{user.name}</div>
            <div className="flex items-center gap-1 bg-[#262626] w-fit px-2 py-1 rounded-full text-xs text-[#a8a8a8] mt-1 mb-2 cursor-pointer hover:bg-[#363636]"><AtSign size={10} /> <span>থ্রেডস</span></div>
            <div className="whitespace-pre-wrap">{user.bio || 'লুলু'}</div>
          </div>
        </div>
      </header>

      {/* Highlights (Only show for me or if user has them - mocking none for others for now) */}
      {isMe && (
          <div className="mb-10 flex gap-4 overflow-x-auto pb-2 scrollbar-hide px-4 md:px-0">
            <div className="flex flex-col items-center gap-2 cursor-pointer group">
              <div className={`w-[64px] h-[64px] md:w-[77px] md:h-[77px] rounded-full border ${borderClass} ${theme === 'dark' ? 'bg-black' : 'bg-white'} flex items-center justify-center group-hover:bg-zinc-900 transition-colors`}>
                 <div className="w-[60px] h-[60px] md:w-[74px] md:h-[74px] rounded-full border-[2px] border-inherit flex items-center justify-center">
                    <PlusSquare size={24} strokeWidth={1} className="text-zinc-400 md:w-8 md:h-8" />
                 </div>
              </div>
              <span className="text-xs font-semibold">নতুন</span>
            </div>
          </div>
      )}

      <div className={`border-t ${borderClass}`}>
        <div className="flex justify-around md:justify-center gap-0 md:gap-12">
          <button onClick={() => setActiveTab('posts')} className={`flex items-center justify-center gap-2 h-[44px] md:h-[52px] border-t-2 md:border-t flex-1 md:flex-none text-xs font-semibold tracking-widest transition-colors ${activeTab === 'posts' ? (theme === 'dark' ? 'border-white text-white' : 'border-black text-black') : 'border-transparent text-[#a8a8a8]'}`}><Grid size={12} className="md:size-3 size-6" /><span className="hidden md:block">পোস্ট</span></button>
          {isMe && <button onClick={() => setActiveTab('saved')} className={`flex items-center justify-center gap-2 h-[44px] md:h-[52px] border-t-2 md:border-t flex-1 md:flex-none text-xs font-semibold tracking-widest transition-colors ${activeTab === 'saved' ? (theme === 'dark' ? 'border-white text-white' : 'border-black text-black') : 'border-transparent text-[#a8a8a8]'}`}><Bookmark size={12} className="md:size-3 size-6" /><span className="hidden md:block">সেভ করা</span></button>}
          <button onClick={() => setActiveTab('tagged')} className={`flex items-center justify-center gap-2 h-[44px] md:h-[52px] border-t-2 md:border-t flex-1 md:flex-none text-xs font-semibold tracking-widest transition-colors ${activeTab === 'tagged' ? (theme === 'dark' ? 'border-white text-white' : 'border-black text-black') : 'border-transparent text-[#a8a8a8]'}`}><UserCheck size={12} className="md:size-3 size-6" /><span className="hidden md:block">ট্যাগ করা</span></button>
        </div>
      </div>

      {displayPosts.length > 0 ? (
         <div className="grid grid-cols-3 gap-1 md:gap-8">
            {displayPosts.map(post => (
               <div 
                 key={post.id} 
                 className="relative aspect-square group cursor-pointer"
                 onClick={() => setViewingPost(post)}
               >
                  <OptimizedImage src={post.content.src || post.content.poster} className="w-full h-full" alt="post grid" />
                  <div className="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center gap-6 text-white font-bold z-20">
                     <div className="flex items-center gap-2"><Heart fill="white" size={20} /> {post.likes}</div>
                     <div className="flex items-center gap-2"><CommentIcon fill="white" size={20} className="-scale-x-100" /> {post.comments}</div>
                  </div>
               </div>
            ))}
         </div>
      ) : (
         <div className="flex flex-col items-center justify-center py-20 text-center">
            {isMe && <div className={`w-16 h-16 rounded-full border-2 flex items-center justify-center mb-4 ${theme === 'dark' ? 'border-white' : 'border-black'}`}><Camera size={34} strokeWidth={1} /></div>}
            <h2 className="text-xl font-bold mb-2 text-[#a8a8a8]">{activeTab === 'saved' ? 'কোনো সেভ করা পোস্ট নেই' : 'এখনো কিছু নেই'}</h2>
            {isMe && activeTab === 'posts' && (
                <>
                    <p className={`text-sm ${textSecondary} mb-4`}>আপনি যখন ফটো শেয়ার করবেন, তখন সেগুলো এখানে দেখা যাবে।</p>
                    <button className={`${buttonBg} text-white font-semibold text-sm px-4 py-2 rounded`}>প্রথম ফটো শেয়ার করুন</button>
                </>
            )}
         </div>
      )}
    </div>
  );
}

export default ProfileView;