import React from 'react';
import ReelItem from '../components/ReelItem';
import { initialData } from '../data/mockData';
import { useAppStore } from '../store/useAppStore';
import { useNavigate } from 'react-router-dom';
import type { Reel, User } from '../types';

const ReelsView: React.FC = () => {
   const { theme, showToast } = useAppStore();
   const navigate = useNavigate();
   const glassModal = theme === 'dark' ? 'bg-[#121212]/90 backdrop-blur-2xl border border-white/10' : 'bg-white/90 backdrop-blur-2xl border border-black/10';

   const onUserClick = (user: User) => {
      navigate(`/profile/${user.username}`);
   };

   return (
      <div className="h-screen w-full flex justify-center bg-black overflow-y-scroll snap-y snap-mandatory scrollbar-hide">
         <div className="w-full md:w-[400px] h-full">
            {(initialData.reels as unknown as Reel[]).map((reel) => (
               <ReelItem 
                  key={reel.id} 
                  reel={reel} 
                  showToast={showToast} 
                  theme={theme} 
                  onUserClick={onUserClick}
                  glassModal={glassModal} 
               />
            ))}
         </div>
      </div>
   );
}

export default ReelsView;
