import React from 'react';
import { NavLink } from 'react-router-dom';
import { Home, Search, Clapperboard, PlusSquare, MessageCircle } from 'lucide-react';
import { useAppStore } from '../../store/useAppStore';
import { motion } from 'framer-motion';
import OptimizedImage from '../OptimizedImage';

const MobileNav: React.FC = () => {
  const { theme, currentUser, setCreateModalOpen } = useAppStore();
  const borderClass = theme === 'dark' ? 'border-zinc-800' : 'border-zinc-200';
  const themeClasses = theme === 'dark' ? 'bg-black text-white' : 'bg-white text-black';

  const navItems = [
    { icon: <Home size={24} />, label: 'Home', path: '/' }, 
    { icon: <Search size={24} />, label: 'Explore', path: '/explore' }, 
    { icon: <Clapperboard size={24} />, label: 'Reels', path: '/reels' }, 
  ];

  return (
    <div className={`md:hidden fixed bottom-0 left-0 right-0 border-t ${borderClass} flex justify-around items-center h-12 z-50 px-2 pb-safe ${themeClasses} backdrop-blur-md bg-opacity-90`}>
      {navItems.map((item, index) => (
        <NavLink 
          key={index} 
          to={item.path}
          className={({ isActive }) => `block ${isActive ? 'text-[#006a4e]' : ''}`}
        >
           <motion.div whileTap={{ scale: 0.8 }} className="p-3">
             {item.icon}
           </motion.div>
        </NavLink>
      ))}

      {/* Create Button */}
      <motion.div whileTap={{ scale: 0.8 }} className="p-3" onClick={() => setCreateModalOpen(true)}>
         <PlusSquare size={24} />
      </motion.div>

      <NavLink to="/messages" className={({ isActive }) => `block ${isActive ? 'text-[#006a4e]' : ''}`}>
         <motion.div whileTap={{ scale: 0.8 }} className="p-3">
            <MessageCircle size={24} />
         </motion.div>
      </NavLink>

      <NavLink to={`/profile/${currentUser.username}`} className={({ isActive }) => `block ${isActive ? 'text-[#006a4e]' : ''}`}>
        {({ isActive }) => (
          <motion.div whileTap={{ scale: 0.8 }} className="p-3">
            <OptimizedImage src={currentUser.avatar} className={`w-6 h-6 rounded-full ${isActive ? 'border-2 border-[#006a4e]' : ''}`} alt="profile" />
          </motion.div>
        )}
      </NavLink>
    </div>
  );
}

export default MobileNav;
