import React from 'react';
import ReelItem from '../components/ReelItem';
import { initialData } from '../data/mockData';

interface ReelsViewProps {
  theme: string;
  buttonBg: string;
  showToast: (msg: string) => void;
  onUserClick: (user: any) => void;
  glassModal: string;
}

const ReelsView: React.FC<ReelsViewProps> = ({ theme, showToast, onUserClick, glassModal }) => {
   return (
      <div className="h-screen w-full flex justify-center bg-black overflow-y-scroll snap-y snap-mandatory scrollbar-hide">
         <div className="w-full md:w-[400px] h-full">
            {initialData.reels.map((reel) => (
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
