import React from 'react';
import { Heart, MessageCircle } from 'lucide-react';
import PostItem from '../components/PostItem';
import { useAppStore } from '../store/useAppStore';
import { useNavigate } from 'react-router-dom';
import { initialData } from '../data/mockData';
import type { User, Post, Story } from '../types';
import { motion } from 'framer-motion';

import OptimizedImage from '../components/OptimizedImage';

const HomeView: React.FC = () => {
  const { 
    currentUser, 
    stories, 
    posts, 
    theme, 
    showToast, 
    toggleSave, 
    savedPostIds, 
    setViewingStory, 
    setViewingPost 
  } = useAppStore();
  
  const navigate = useNavigate();

  const borderClass = theme === 'dark' ? 'border-zinc-800' : 'border-zinc-200';
  const textSecondary = theme === 'dark' ? 'text-[#a8a8a8]' : 'text-zinc-500';
  
  const handleUserClick = (user: User) => {
    navigate(`/profile/${user.username}`);
  };

  const containerVariants = {
    hidden: { opacity: 0 },
    visible: {
      opacity: 1,
      transition: {
        staggerChildren: 0.1
      }
    }
  };

  const itemVariants = {
    hidden: { opacity: 0, scale: 0.8 },
    visible: { opacity: 1, scale: 1 }
  };

  return (
    <div className="w-full max-w-[630px] pt-0 md:pt-[30px] flex gap-16 flex-col">
      <div className={`md:hidden sticky top-0 z-10 border-b ${borderClass} px-4 h-[60px] flex items-center justify-between ${theme === 'dark' ? 'bg-black' : 'bg-white'}`}>
        <h1 className="text-2xl font-bold tracking-wide italic text-[#006a4e]">Instagram</h1>
        <div className="flex items-center gap-5">
          <motion.div whileTap={{ scale: 0.9 }}>
            <Heart size={24} onClick={() => showToast('নোটিফিকেশন')} />
          </motion.div>
          <motion.div className="relative" onClick={() => navigate('/messages')} whileTap={{ scale: 0.9 }}>
            <MessageCircle size={24} />
            <div className="absolute -top-1 -right-1 bg-[#f42a41] text-[10px] w-4 h-4 rounded-full flex items-center justify-center font-bold text-white">1</div>
          </motion.div>
        </div>
      </div>
      
      <div className="flex-grow w-full max-w-[470px] mx-auto px-0 md:px-0">
        <motion.div 
          variants={containerVariants}
          initial="hidden"
          animate="visible"
          className="flex gap-4 mb-6 overflow-x-auto scrollbar-hide py-4 px-4 md:px-0"
        >
          {stories.map((story: Story) => (
            <motion.div 
              key={story.id} 
              variants={itemVariants}
              whileHover={{ y: -5 }}
              className="flex flex-col items-center gap-1 cursor-pointer flex-shrink-0 w-[66px] group" 
              onClick={() => setViewingStory(story.id)}
            >
              <div className="w-[66px] h-[66px] rounded-full p-[2px] bg-gradient-to-tr from-[#006a4e] to-[#004d39] group-hover:scale-105 transition-transform duration-200">
                <div className={`w-full h-full rounded-full p-[2px] ${theme === 'dark' ? 'bg-black' : 'bg-white'}`}>
                  <OptimizedImage src={story.img} className="w-full h-full rounded-full" alt={story.username} />
                </div>
              </div>
              <span className={`text-xs truncate w-full text-center ${theme === 'dark' ? 'text-[#f5f5f5]' : 'text-black'}`}>{story.username}</span>
            </motion.div>
          ))}
        </motion.div>

        <div className="flex flex-col gap-4 pb-20">
          {posts.map((post: Post) => (
            <PostItem 
              key={post.id} 
              post={post} 
              isSaved={savedPostIds.has(post.id)} 
              onToggleSave={() => toggleSave(post.id)} 
              onUserClick={handleUserClick} 
              onPostClick={setViewingPost} 
            />
          ))}
        </div>
      </div>

      <div className="hidden lg:block w-[319px]">
         <motion.div 
          initial={{ opacity: 0, x: 20 }}
          animate={{ opacity: 1, x: 0 }}
          className="flex items-center justify-between mb-6 mt-2"
         >
            <div className="flex items-center gap-3">
               <OptimizedImage src={currentUser.avatar} className="w-11 h-11 rounded-full" alt="user" />
               <div className="text-sm">
                 <div className="font-semibold">{currentUser.username}</div>
                 <div className={textSecondary}>{currentUser.name}</div>
               </div>
            </div>
            <button className="text-xs font-semibold text-[#006a4e] hover:text-[#004d39]">Switch</button>
         </motion.div>

         <div className="flex justify-between items-center mb-4">
           <span className={`text-sm font-semibold ${textSecondary}`}>আপনার জন্য প্রস্তাবিত</span>
         </div>
         
         <motion.div 
           variants={containerVariants}
           initial="hidden"
           animate="visible"
           className="flex flex-col gap-3"
         >
            {initialData.suggestedUsers.slice(0,5).map((u,i) => (
               <motion.div 
                 key={i} 
                 variants={itemVariants}
                 className="flex items-center justify-between hover:bg-white/5 p-2 rounded-lg transition-colors cursor-pointer" 
                 onClick={() => handleUserClick(u as User)}
               >
                  <div className="flex items-center gap-3">
                     <OptimizedImage src={u.avatar} className="w-8 h-8 rounded-full" alt={u.username} />
                     <div className="flex flex-col">
                       <span className="text-xs font-semibold">{u.username}</span>
                       <span className={`text-[10px] ${textSecondary}`}>Suggested for you</span>
                     </div>
                  </div>
                  <button className={`text-xs font-semibold text-[#006a4e] hover:text-[#004d39]`} onClick={(e) => { e.stopPropagation(); showToast('ফলো করা হচ্ছে'); }}>ফলো</button>
               </motion.div>
            ))}
         </motion.div>
         
         <div className={`mt-8 text-xs ${textSecondary} space-y-4`}>
           <div className="flex flex-wrap gap-1">
             <span>About</span>•<span>Help</span>•<span>Press</span>•<span>API</span>•<span>Jobs</span>•<span>Privacy</span>•<span>Terms</span>
           </div>
           <div>© 2026 INSTAGRAM FROM META (BD)</div>
        </div>
      </div>
    </div>
  );
}

export default HomeView;