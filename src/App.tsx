import { useState, useEffect } from 'react';
import { initialData } from './data/mockData';
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

export default function App() {
  const [currentUser, setCurrentUser] = useState(initialData.currentUser);
  const [viewingProfile, setViewingProfile] = useState<any>(null); 
  const [savedPostIds, setSavedPostIds] = useState(new Set<number>());
  const [followedUsers, setFollowedUsers] = useState(new Set<string>());
  const [stories, setStories] = useState(initialData.stories);
  const [posts, setPosts] = useState(initialData.posts);
  const [currentView, setCurrentView] = useState('home'); 
  const [activeTab, setActiveTab] = useState('posts');
  const [viewingStory, setViewingStory] = useState<number | null>(null); 
  const [viewingPost, setViewingPost] = useState<any>(null); 
  const [theme, setTheme] = useState('dark');
  const [isLoading, setIsLoading] = useState(true);
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [isEditProfileOpen, setIsEditProfileOpen] = useState(false);
  const [toastMessage, setToastMessage] = useState<string | null>(null); 

  // Initialize view
  useEffect(() => {
    if (currentView === 'profile' && !viewingProfile) {
       setViewingProfile(currentUser);
    }
  }, [currentView, currentUser]);

  useEffect(() => {
    // Simulate loading
    const timer = setTimeout(() => setIsLoading(false), 1000);
    return () => clearTimeout(timer);
  }, []);

  // Handle user click to view profile
  const handleUserClick = (user: any) => {
    setViewingProfile(user);
    setCurrentView('profile');
    window.scrollTo(0, 0);
  };

  const showToast = (message: string) => {
    setToastMessage(message);
    setTimeout(() => setToastMessage(null), 3000);
  };

  const toggleSave = (postId: number) => {
    const newSaved = new Set(savedPostIds);
    if (newSaved.has(postId)) {
      newSaved.delete(postId);
      showToast('সেভ থেকে সরানো হয়েছে');
    } else {
      newSaved.add(postId);
      showToast('সেভ করা হয়েছে');
    }
    setSavedPostIds(newSaved);
  };

  const toggleFollow = (username: string) => {
    const newFollowed = new Set(followedUsers);
    
    if (newFollowed.has(username)) {
      newFollowed.delete(username);
      showToast(`${username}-কে আনফলো করা হয়েছে`);
      setCurrentUser(prev => ({
         ...prev,
         stats: { ...prev.stats, following: Math.max(0, prev.stats.following - 1) }
      }));
    } else {
      newFollowed.add(username);
      showToast(`${username}-কে ফলো করা হচ্ছে`);
      setCurrentUser(prev => ({
         ...prev,
         stats: { ...prev.stats, following: prev.stats.following + 1 }
      }));
    }
    setFollowedUsers(newFollowed);
  };

  const updateProfile = (name: string, bio: string, avatar: string) => {
    const updatedUser = { ...currentUser, name, bio, avatar };
    setCurrentUser(updatedUser);
    setViewingProfile(updatedUser); 
    setIsEditProfileOpen(false);
    showToast('প্রোফাইল আপডেট করা হয়েছে');
  };

  const addStory = (e: React.ChangeEvent<HTMLInputElement>) => {
     if(e.target.files && e.target.files[0]){
         const file = e.target.files[0];
         const reader = new FileReader();
         reader.onload = (ev) => {
             const newStory = {
                 id: Date.now(),
                 username: currentUser.username,
                 img: ev.target?.result as string,
                 isUser: true
             };
             setStories([newStory, ...stories.filter(s => !s.isUser)]);
             showToast('স্টোরি যোগ করা হয়েছে');
         }
         reader.readAsDataURL(file);
     }
  }

  // --- Create Post Function ---
  const handleCreatePost = (postData: { image: string, caption: string }) => {
     const newPost = {
        id: Date.now(),
        user: currentUser,
        content: { type: 'image', src: postData.image },
        likes: '0',
        caption: postData.caption,
        comments: 0,
        time: 'এইমাত্র',
        isVerified: false,
        commentList: []
     };
     setPosts([newPost, ...posts]);
     showToast('পোস্ট শেয়ার করা হয়েছে');
     setIsCreateModalOpen(false);
     
     if(currentView !== 'profile') {
        setCurrentView('home');
     }
  };

  const toggleTheme = () => {
    setTheme(prev => prev === 'dark' ? 'light' : 'dark');
  };

  const buttonBg = 'bg-[#006a4e] hover:bg-[#00523c]'; 
  const glassModal = theme === 'dark' ? 'bg-[#121212]/90 backdrop-blur-2xl border border-white/10' : 'bg-white/90 backdrop-blur-2xl border border-black/10';

  if (isLoading) {
    return (
      <div className={`min-h-screen flex items-center justify-center ${theme === 'dark' ? 'bg-black' : 'bg-white'}`}>
         <img src="https://upload.wikimedia.org/wikipedia/commons/a/a5/Instagram_icon.png" className="w-20 h-20 animate-pulse" alt="Loading" />
      </div>
    );
  }

  const savedPostsList = posts.filter(p => savedPostIds.has(p.id));

  return (
    <Layout
      theme={theme}
      currentView={currentView}
      setCurrentView={setCurrentView}
      toggleTheme={toggleTheme}
      currentUser={currentUser}
      viewingProfile={viewingProfile}
      setIsCreateModalOpen={setIsCreateModalOpen}
    >
      
      {toastMessage && (
        <div className="fixed bottom-16 md:bottom-8 left-1/2 transform -translate-x-1/2 z-[110] bg-[#333] text-white px-4 py-2 rounded-lg text-sm font-semibold shadow-lg animate-fade-in-up whitespace-nowrap">
           {toastMessage}
        </div>
      )}

      {/* Modals with Glassmorphism */}
      {isCreateModalOpen && <CreateModal onClose={() => setIsCreateModalOpen(false)} theme={theme} buttonBg={buttonBg} showToast={showToast} onCreate={handleCreatePost} glassModal={glassModal} />}
      {isEditProfileOpen && <EditProfileModal user={currentUser} onClose={() => setIsEditProfileOpen(false)} onSave={updateProfile} theme={theme} buttonBg={buttonBg} glassModal={glassModal} />}
      {viewingStory !== null && <StoryViewer stories={stories} initialStoryIndex={stories.findIndex(s => s.id === viewingStory)} onClose={() => setViewingStory(null)} showToast={showToast} />}
      {viewingPost !== null && <PostDetailsModal post={viewingPost} onClose={() => setViewingPost(null)} theme={theme} showToast={showToast} isSaved={savedPostIds.has(viewingPost.id)} onToggleSave={() => toggleSave(viewingPost.id)} onUserClick={handleUserClick} glassModal={glassModal} />}

      {currentView === 'home' && (
        <HomeView 
          currentUser={currentUser} 
          stories={stories} 
          posts={posts} 
          onMessageClick={() => setCurrentView('messages')} 
          onStoryClick={(id) => setViewingStory(id)} 
          onPostClick={(post) => setViewingPost(post)} 
          theme={theme} 
          buttonBg={buttonBg} 
          showToast={showToast} 
          toggleSave={toggleSave} 
          savedPostIds={savedPostIds} 
          onUserClick={handleUserClick} 
        />
      )}
      
      {currentView === 'profile' && (
        <ProfileView 
          user={viewingProfile || currentUser} 
          currentUser={currentUser} 
          posts={posts} 
          savedPosts={savedPostsList} 
          activeTab={activeTab} 
          setActiveTab={setActiveTab} 
          theme={theme} 
          buttonBg={buttonBg} 
          showToast={showToast} 
          onPostClick={(post) => setViewingPost(post)} 
          onEditProfile={() => setIsEditProfileOpen(true)} 
          onStoryUpload={addStory} 
          onFollow={toggleFollow} 
          isFollowing={followedUsers.has(viewingProfile?.username)} 
          onUserClick={handleUserClick} 
          onCreateClick={() => setIsCreateModalOpen(true)} 
        />
      )}
      
      {currentView === 'messages' && (
        <MessagesView 
          currentUser={currentUser} 
          theme={theme} 
          buttonBg={buttonBg} 
          showToast={showToast} 
        />
      )}
      
      {currentView === 'reels' && (
        <ReelsView 
          theme={theme} 
          buttonBg={buttonBg} 
          showToast={showToast} 
          onUserClick={handleUserClick} 
          glassModal={glassModal} 
        />
      )}
      
      {currentView === 'notifications' && (
        <NotificationsView 
          theme={theme} 
          buttonBg={buttonBg} 
          showToast={showToast} 
          followedUsers={followedUsers} 
          toggleFollow={toggleFollow} 
          onUserClick={handleUserClick} 
        />
      )}
      
      {currentView === 'explore' && (
        <ExploreView 
          theme={theme} 
          onPostClick={(post) => setViewingPost(post)} 
        />
      )}
    </Layout>
  );
}
