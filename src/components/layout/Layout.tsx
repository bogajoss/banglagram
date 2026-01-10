import React from 'react';
import Sidebar from './Sidebar';
import MobileNav from './MobileNav';

interface LayoutProps {
  children: React.ReactNode;
  theme: string;
  currentView: string;
  setCurrentView: (view: string) => void;
  toggleTheme: () => void;
  currentUser: any;
  viewingProfile: any;
  setIsCreateModalOpen: (open: boolean) => void;
}

const Layout: React.FC<LayoutProps> = ({ 
  children, 
  theme, 
  currentView, 
  setCurrentView, 
  toggleTheme, 
  currentUser, 
  viewingProfile, 
  setIsCreateModalOpen 
}) => {
  const themeClasses = theme === 'dark' ? 'bg-black text-white' : 'bg-white text-black';

  return (
    <div className={`min-h-screen font-['Hind_Siliguri'] flex flex-col md:flex-row transition-colors duration-300 ${themeClasses}`}>
      <Sidebar 
        currentView={currentView}
        setCurrentView={setCurrentView}
        theme={theme}
        toggleTheme={toggleTheme}
        currentUser={currentUser}
        viewingProfile={viewingProfile}
        setIsCreateModalOpen={setIsCreateModalOpen}
      />
      <MobileNav 
        currentView={currentView}
        setCurrentView={setCurrentView}
        theme={theme}
        currentUser={currentUser}
        viewingProfile={viewingProfile}
        setIsCreateModalOpen={setIsCreateModalOpen}
      />
      
      <main className={`flex-grow ${currentView === 'messages' ? 'md:ml-[72px]' : 'md:ml-[245px]'} flex justify-center transition-all duration-300 pb-14 md:pb-0`}>
        {children}
      </main>
    </div>
  );
}

export default Layout;
