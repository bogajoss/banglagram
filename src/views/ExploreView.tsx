import React from 'react';
import { Search, Heart, MessageCircle as CommentIcon } from 'lucide-react';
import { initialData } from '../data/mockData';

interface ExploreViewProps {
  theme: string;
  onPostClick: (post: any) => void;
}

const ExploreView: React.FC<ExploreViewProps> = ({ theme, onPostClick }) => {
   const posts = initialData.explore.map((src, i) => ({
      id: `explore-${i}`,
      content: { src, type: 'image' },
      likes: Math.floor(Math.random() * 5000),
      comments: Math.floor(Math.random() * 100),
      user: { username: 'explore_user', avatar: `https://api.dicebear.com/9.x/avataaars/svg?seed=${i}` },
      caption: 'Explore content',
      time: '1d',
      commentList: []
   }));

   return (
      <div className="w-full max-w-[935px] py-4 px-2">
         {/* Mobile Search Bar in Explore */}
         <div className={`md:hidden mb-4 sticky top-0 z-10 py-2 ${theme === 'dark' ? 'bg-black' : 'bg-white'}`}>
             <div className={`flex items-center gap-2 px-3 py-2 rounded-lg ${theme === 'dark' ? 'bg-[#262626]' : 'bg-gray-100'}`}>
                <Search size={18} className={theme === 'dark' ? 'text-[#8e8e8e]' : 'text-gray-500'} />
                <input type="text" placeholder="অনুসন্ধান" className="bg-transparent border-none outline-none text-sm w-full" />
             </div>
         </div>
         
         <div className="grid grid-cols-3 gap-1 md:gap-4 pb-14">
            {posts.map((post) => (
               <div key={post.id} className="relative aspect-square group cursor-pointer overflow-hidden" onClick={() => onPostClick(post)}>
                  <img src={post.content.src} className="w-full h-full object-cover transition-transform duration-300 group-hover:scale-110" alt="explore" />
                  <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 flex items-center justify-center gap-4 text-white font-bold transition-opacity duration-200">
                     <div className="flex items-center gap-1"><Heart fill="white" size={16} /> {post.likes}</div>
                     <div className="flex items-center gap-1"><CommentIcon fill="white" size={16} className="-scale-x-100" /> {post.comments}</div>
                  </div>
               </div>
            ))}
         </div>
      </div>
   )
}

export default ExploreView;
