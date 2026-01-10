import React from 'react';
import { Home, Search, Clapperboard, PlusSquare, MessageCircle } from 'lucide-react';

interface MobileNavProps {
  currentView: string;
  setCurrentView: (view: string) => void;
  theme: string;
  currentUser: any;
  viewingProfile: any;
  setIsCreateModalOpen: (open: boolean) => void;
}

const MobileNav: React.FC<MobileNavProps> = ({ 
  currentView, 
  setCurrentView, 
  theme, 
  currentUser, 
  viewingProfile, 
  setIsCreateModalOpen 
}) => {
  const borderClass = theme === 'dark' ? 'border-zinc-800' : 'border-zinc-200';
  const themeClasses = theme === 'dark' ? 'bg-black text-white' : 'bg-white text-black';

  const handleNavClick = (viewName: string) => {
    if (viewName === 'Home') setCurrentView('home');
    if (viewName === 'Profile') setCurrentView('profile');
    if (viewName === 'Messages') setCurrentView('messages');
    if (viewName === 'Reels') setCurrentView('reels');
    if (viewName === 'Explore') setCurrentView('explore');
    if (viewName === 'Create') setIsCreateModalOpen(true);
  };

  const navItems = [
    { icon: <Home size={24} />, label: 'Home' }, 
    { icon: <Search size={24} />, label: 'Explore' }, 
    { icon: <Clapperboard size={24} />, label: 'Reels' }, 
    { icon: <PlusSquare size={24} />, label: 'Create' }, 
    { icon: <MessageCircle size={24} />, label: 'Messages' }, 
    { icon: <img src={currentUser.avatar} className="w-6 h-6 rounded-full" alt="profile" />, label: 'Profile' }
  ];

  return (
    <div className={`md:hidden fixed bottom-0 left-0 right-0 border-t ${borderClass} flex justify-around items-center h-12 z-50 px-2 pb-safe ${themeClasses} backdrop-blur-md bg-opacity-90`}>
      {navItems.map((item, index) => (
        <div key={index} className="p-3" onClick={() => handleNavClick(item.label)}>
           <div className={currentView === item.label.toLowerCase() || (item.label === 'Profile' && currentView === 'profile' && viewingProfile?.username === currentUser.username) ? 'text-[#006a4e]' : ''}>{item.icon}</div>
        </div>
      ))}
    </div>
  );
}

export default MobileNav;
