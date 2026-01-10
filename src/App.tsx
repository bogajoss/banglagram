import { useState, useEffect } from 'react';
import { Routes, Route, useLocation } from 'react-router-dom';
import { AnimatePresence } from 'framer-motion';
import Layout from './components/layout/Layout';
import HomeView from './views/HomeView';
import ProfileView from './views/ProfileView';
import MessagesView from './views/MessagesView';
import ReelsView from './views/ReelsView';
import NotificationsView from './views/NotificationsView';
import ExploreView from './views/ExploreView';
import CreateModal from './components/modals/CreateModal';
import EditProfileModal from './components/modals/EditProfileModal';
import StoryViewer from './components/StoryViewer';
import PostDetailsModal from './components/modals/PostDetailsModal';
import { useAppStore } from './store/useAppStore';
import PageWrapper from './components/PageWrapper';

export default function App() {
  const { 
    theme, 
    toastMessage, 
    isCreateModalOpen, 
    isEditProfileOpen,
    viewingStory, 
    viewingPost, 
  } = useAppStore();

  const [isLoading, setIsLoading] = useState(true);
  const location = useLocation();

  useEffect(() => {
    // Simulate loading
    const timer = setTimeout(() => setIsLoading(false), 1000);
    return () => clearTimeout(timer);
  }, []);

  if (isLoading) {
    return (
      <div className={`min-h-screen flex items-center justify-center ${theme === 'dark' ? 'bg-black' : 'bg-white'}`}>
         <img src="https://upload.wikimedia.org/wikipedia/commons/a/a5/Instagram_icon.png" className="w-20 h-20 animate-pulse" alt="Loading" />
      </div>
    );
  }

  return (
    <>
      {toastMessage && (
        <div className="fixed bottom-16 md:bottom-8 left-1/2 transform -translate-x-1/2 z-[110] bg-[#333] text-white px-4 py-2 rounded-lg text-sm font-semibold shadow-lg animate-fade-in-up whitespace-nowrap">
           {toastMessage}
        </div>
      )}

      {/* Modals with AnimatePresence */}
      <AnimatePresence>
        {isCreateModalOpen && <CreateModal />}
      </AnimatePresence>
      <AnimatePresence>
        {isEditProfileOpen && <EditProfileModal />}
      </AnimatePresence>
      <AnimatePresence>
        {viewingStory !== null && <StoryViewer />}
      </AnimatePresence>
      <AnimatePresence>
        {viewingPost !== null && <PostDetailsModal key={viewingPost.id} />}
      </AnimatePresence>

      <AnimatePresence mode="wait">
        <Routes location={location} key={location.pathname}>
          <Route element={<Layout />}>
              <Route path="/" element={<PageWrapper><HomeView /></PageWrapper>} />
              <Route path="/explore" element={<PageWrapper><ExploreView /></PageWrapper>} />
              <Route path="/reels" element={<PageWrapper><ReelsView /></PageWrapper>} />
              <Route path="/messages" element={<PageWrapper><MessagesView /></PageWrapper>} />
              <Route path="/notifications" element={<PageWrapper><NotificationsView /></PageWrapper>} />
              <Route path="/profile/:username" element={<PageWrapper><ProfileView /></PageWrapper>} />
          </Route>
        </Routes>
      </AnimatePresence>
    </>
  );
}
