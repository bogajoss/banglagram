import React from 'react';
import { Outlet, useLocation } from 'react-router-dom';
import Sidebar from './Sidebar';
import MobileNav from './MobileNav';
import { useAppStore } from '../../store/useAppStore';

const Layout: React.FC = () => {
  const { theme } = useAppStore();
  const themeClasses = theme === 'dark' ? 'bg-black text-white' : 'bg-white text-black';
  const location = useLocation();
  const isMessages = location.pathname.startsWith('/messages');

  return (
    <div className={`min-h-screen font-['Hind_Siliguri'] flex flex-col md:flex-row transition-colors duration-300 ${themeClasses}`}>
      <Sidebar />
      <MobileNav />
      
      <main className={`flex-grow ${isMessages ? 'md:ml-[72px]' : 'md:ml-[245px]'} flex justify-center transition-all duration-300 pb-14 md:pb-0`}>
        <Outlet />
      </main>
    </div>
  );
}

export default Layout;
