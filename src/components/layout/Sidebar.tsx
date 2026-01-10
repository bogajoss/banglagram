import React from 'react';
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

interface SidebarProps {
  currentView: string;
  setCurrentView: (view: string) => void;
  theme: string;
  toggleTheme: () => void;
  currentUser: any;
  viewingProfile: any;
  setIsCreateModalOpen: (open: boolean) => void;
}

const Sidebar: React.FC<SidebarProps> = ({ 
  currentView, 
  setCurrentView, 
  theme, 
  toggleTheme, 
  currentUser, 
  viewingProfile,
  setIsCreateModalOpen 
}) => {
  const borderClass = theme === 'dark' ? 'border-zinc-800' : 'border-zinc-200';
  const themeClasses = theme === 'dark' ? 'bg-black text-white' : 'bg-white text-black';

  const handleNavClick = (viewName: string) => {
    if (viewName === 'Home') setCurrentView('home');
    if (viewName === 'Profile') {
       // Logic to reset to current user should be handled in parent or here
       // For now, we just switch view. Parent handles "viewingProfile" state logic.
       setCurrentView('profile');
    }
    if (viewName === 'Messages') setCurrentView('messages');
    if (viewName === 'Reels') setCurrentView('reels');
    if (viewName === 'Notifications') setCurrentView('notifications');
    if (viewName === 'Explore') setCurrentView('explore');
    if (viewName === 'Create') setIsCreateModalOpen(true);
  };

  const menuItems = [
    { icon: <Home size={24} />, label: 'Home', active: currentView === 'home' },
    { icon: <Search size={24} />, label: 'Explore', active: currentView === 'explore' },
    { icon: <Clapperboard size={24} />, label: 'Reels', active: currentView === 'reels' },
    { icon: <MessageCircle size={24} />, label: 'Messages', badge: 1, active: currentView === 'messages' },
    { icon: <Heart size={24} />, label: 'Notifications', active: currentView === 'notifications' },
    { icon: <PlusSquare size={24} />, label: 'Create' },
    { icon: <img src={currentUser.avatar} alt="Profile" className={`w-6 h-6 rounded-full ${currentView === 'profile' && viewingProfile?.username === currentUser.username ? 'border-2 border-[#006a4e]' : ''}`} />, label: 'Profile', active: currentView === 'profile' && viewingProfile?.username === currentUser.username },
  ];

  return (
    <div className={`hidden md:flex flex-col ${currentView === 'messages' ? 'w-[72px]' : 'w-[245px]'} h-screen fixed border-r ${borderClass} p-4 pb-5 justify-between z-50 transition-all duration-300 ${themeClasses}`}>
      <div>
        <div className="mb-8 px-2 mt-4 cursor-pointer" onClick={() => setCurrentView('home')}>
           {currentView === 'messages' ? (
              <div className={`p-2 rounded-lg w-fit transition-colors ${theme === 'dark' ? 'hover:bg-zinc-900' : 'hover:bg-gray-100'}`}><Home size={24} color="#006a4e" /></div>
           ) : <h1 className="text-2xl font-bold tracking-wide italic text-[#006a4e]">Instagram</h1>}
        </div>
        <div className="flex flex-col gap-2">
          {menuItems.map((item, index) => (
            <div key={index} onClick={() => handleNavClick(item.label)} className={`flex items-center gap-4 p-3 rounded-lg transition-colors cursor-pointer group ${item.active ? 'font-bold' : ''} ${currentView === 'messages' ? 'justify-center' : ''} ${theme === 'dark' ? 'hover:bg-white/10' : 'hover:bg-black/5'}`}>
              <div className="relative group-hover:scale-105 transition-transform">
                <div className={item.active ? 'text-[#006a4e]' : ''}>{item.icon}</div>
                {item.badge && <div className="absolute -top-2 -right-2 bg-[#f42a41] text-white text-[10px] font-bold h-4 w-4 flex items-center justify-center rounded-full border-2 border-black">{item.badge}</div>}
              </div>
              {currentView !== 'messages' && <span className="text-base truncate">{item.label === 'Home' ? 'হোম' : item.label === 'Explore' ? 'এক্সপ্লোর' : item.label === 'Reels' ? 'রিলস' : item.label === 'Messages' ? 'মেসেজ' : item.label === 'Notifications' ? 'নোটিফিকেশন' : item.label === 'Create' ? 'তৈরি করুন' : 'প্রোফাইল'}</span>}
            </div>
          ))}
        </div>
      </div>
      <div onClick={toggleTheme} className={`flex items-center gap-4 p-3 rounded-lg transition-colors cursor-pointer ${currentView === 'messages' ? 'justify-center' : ''} ${theme === 'dark' ? 'hover:bg-white/10' : 'hover:bg-black/5'}`}>
        {theme === 'dark' ? <Sun size={24} /> : <Moon size={24} />}
        {currentView !== 'messages' && <span className="text-base">থিম পরিবর্তন</span>}
      </div>
    </div>
  );
}

export default Sidebar;
