import React from 'react';
import { NavLink, Link } from 'react-router-dom';
import { 
  Home, 
  Search, 
  Clapperboard, 
  MessageCircle, 
  Heart, 
  PlusSquare, 
  Sun, 
  Moon 
} from 'lucide-react';
import { useAppStore } from '../../store/useAppStore';

const Sidebar: React.FC = () => {
  const { theme, toggleTheme, currentUser, setCreateModalOpen } = useAppStore();
  const borderClass = theme === 'dark' ? 'border-zinc-800' : 'border-zinc-200';
  const themeClasses = theme === 'dark' ? 'bg-black text-white' : 'bg-white text-black';

  const menuItems = [
    { icon: <Home size={24} />, label: 'Home', path: '/' },
    { icon: <Search size={24} />, label: 'Explore', path: '/explore' },
    { icon: <Clapperboard size={24} />, label: 'Reels', path: '/reels' },
    { icon: <MessageCircle size={24} />, label: 'Messages', path: '/messages', badge: 1 },
    { icon: <Heart size={24} />, label: 'Notifications', path: '/notifications' },
  ];

  return (
    <div className={`hidden md:flex flex-col w-[245px] h-screen fixed border-r ${borderClass} p-4 pb-5 justify-between z-50 transition-all duration-300 ${themeClasses}`}>
      <div>
        <div className="mb-8 px-2 mt-4">
           <Link to="/" className="text-2xl font-bold tracking-wide italic text-[#006a4e] block">Instagram</Link>
        </div>
        <div className="flex flex-col gap-2">
          {menuItems.map((item, index) => (
            <NavLink 
              key={index} 
              to={item.path}
              className={({ isActive }) => `flex items-center gap-4 p-3 rounded-lg transition-colors cursor-pointer group ${isActive ? 'font-bold' : ''} ${theme === 'dark' ? 'hover:bg-white/10' : 'hover:bg-black/5'}`}
            >
              {({ isActive }) => (
                <>
                  <div className="relative group-hover:scale-105 transition-transform">
                    <div className={isActive ? 'text-[#006a4e]' : ''}>{item.icon}</div>
                    {item.badge && <div className="absolute -top-2 -right-2 bg-[#f42a41] text-white text-[10px] font-bold h-4 w-4 flex items-center justify-center rounded-full border-2 border-black">{item.badge}</div>}
                  </div>
                  <span className="text-base truncate">{item.label === 'Home' ? 'হোম' : item.label === 'Explore' ? 'এক্সপ্লোর' : item.label === 'Reels' ? 'রিলস' : item.label === 'Messages' ? 'মেসেজ' : item.label === 'Notifications' ? 'নোটিফিকেশন' : item.label}</span>
                </>
              )}
            </NavLink>
          ))}

          {/* Create Button (Modal Trigger) */}
          <div onClick={() => setCreateModalOpen(true)} className={`flex items-center gap-4 p-3 rounded-lg transition-colors cursor-pointer group ${theme === 'dark' ? 'hover:bg-white/10' : 'hover:bg-black/5'}`}>
             <div className="relative group-hover:scale-105 transition-transform">
                <PlusSquare size={24} />
             </div>
             <span className="text-base truncate">তৈরি করুন</span>
          </div>

          {/* Profile Link */}
          <NavLink 
              to={`/profile/${currentUser.username}`}
              className={({ isActive }) => `flex items-center gap-4 p-3 rounded-lg transition-colors cursor-pointer group ${isActive ? 'font-bold' : ''} ${theme === 'dark' ? 'hover:bg-white/10' : 'hover:bg-black/5'}`}
            >
              {({ isActive }) => (
                <>
                  <img src={currentUser.avatar} alt="Profile" className={`w-6 h-6 rounded-full group-hover:scale-105 transition-transform ${isActive ? 'border-2 border-[#006a4e]' : ''}`} />
                  <span className="text-base truncate">প্রোফাইল</span>
                </>
              )}
            </NavLink>

        </div>
      </div>
      <div onClick={toggleTheme} className={`flex items-center gap-4 p-3 rounded-lg transition-colors cursor-pointer ${theme === 'dark' ? 'hover:bg-white/10' : 'hover:bg-black/5'}`}>
        {theme === 'dark' ? <Sun size={24} /> : <Moon size={24} />}
        <span className="text-base">থিম পরিবর্তন</span>
      </div>
    </div>
  );
}

export default Sidebar;
