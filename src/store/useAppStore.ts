import { create } from 'zustand';
import { initialData } from '../data/mockData';
import { User, Post, Story } from '../types';

interface AppState {
  // State
  currentUser: User;
  stories: Story[];
  posts: Post[];
  savedPostIds: Set<number | string>;
  followedUsers: Set<string>;
  theme: 'dark' | 'light';
  toastMessage: string | null;
  isCreateModalOpen: boolean;
  isEditProfileOpen: boolean;
  viewingStory: number | null;
  viewingPost: Post | null;

  // Actions
  toggleTheme: () => void;
  setToastMessage: (msg: string | null) => void;
  showToast: (msg: string) => void;
  setCreateModalOpen: (open: boolean) => void;
  setEditProfileOpen: (open: boolean) => void;
  setViewingStory: (id: number | null) => void;
  setViewingPost: (post: Post | null) => void;
  toggleSave: (postId: number | string) => void;
  toggleFollow: (username: string) => void;
  updateProfile: (name: string, bio: string, avatar: string) => void;
  addStory: (img: string) => void;
  createPost: (postData: { image: string; caption: string }) => void;
}

export const useAppStore = create<AppState>((set, get) => ({
  currentUser: initialData.currentUser as User,
  stories: initialData.stories as Story[],
  posts: initialData.posts as unknown as Post[],
  savedPostIds: new Set(),
  followedUsers: new Set(),
  theme: 'dark',
  toastMessage: null,
  isCreateModalOpen: false,
  isEditProfileOpen: false,
  viewingStory: null,
  viewingPost: null,

  toggleTheme: () =>
    set((state) => ({ theme: state.theme === 'dark' ? 'light' : 'dark' })),

  setToastMessage: (msg) => set({ toastMessage: msg }),

  showToast: (msg) => {
    set({ toastMessage: msg });
    setTimeout(() => {
      set({ toastMessage: null });
    }, 3000);
  },

  setCreateModalOpen: (open) => set({ isCreateModalOpen: open }),
  setEditProfileOpen: (open) => set({ isEditProfileOpen: open }),
  setViewingStory: (id) => set({ viewingStory: id }),
  setViewingPost: (post) => set({ viewingPost: post }),

  toggleSave: (postId) =>
    set((state) => {
      const newSaved = new Set(state.savedPostIds);
      if (newSaved.has(postId)) {
        newSaved.delete(postId);
        get().showToast('সেভ থেকে সরানো হয়েছে');
      } else {
        newSaved.add(postId);
        get().showToast('সেভ করা হয়েছে');
      }
      return { savedPostIds: newSaved };
    }),

  toggleFollow: (username) =>
    set((state) => {
      const newFollowed = new Set(state.followedUsers);
      const newStats = { ...state.currentUser.stats } as { posts: number, followers: number, following: number };

      if (newFollowed.has(username)) {
        newFollowed.delete(username);
        get().showToast(`${username}-কে আনফলো করা হয়েছে`);
        newStats.following = Math.max(0, newStats.following - 1);
      } else {
        newFollowed.add(username);
        get().showToast(`${username}-কে ফলো করা হচ্ছে`);
        newStats.following = newStats.following + 1;
      }

      return {
        followedUsers: newFollowed,
        currentUser: { ...state.currentUser, stats: newStats },
      };
    }),

  updateProfile: (name, bio, avatar) =>
    set((state) => {
      get().showToast('প্রোফাইল আপডেট করা হয়েছে');
      return {
        currentUser: { ...state.currentUser, name, bio, avatar },
      };
    }),

  addStory: (img) =>
    set((state) => {
      const newStory: Story = {
        id: Date.now(),
        username: state.currentUser.username,
        img,
        isUser: true,
      };
      get().showToast('স্টোরি যোগ করা হয়েছে');
      return {
        stories: [newStory, ...state.stories.filter((s) => !s.isUser)],
      };
    }),

  createPost: ({ image, caption }) =>
    set((state) => {
      const newPost: Post = {
        id: Date.now(),
        user: state.currentUser,
        content: { type: 'image', src: image },
        likes: '0',
        caption,
        comments: 0,
        time: 'এইমাত্র',
        isVerified: false,
        commentList: [],
      };
      get().showToast('পোস্ট শেয়ার করা হয়েছে');
      return { posts: [newPost, ...state.posts] };
    }),
}));