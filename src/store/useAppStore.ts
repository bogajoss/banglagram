import { create } from "zustand";
import type { User, Post, Story, Reel } from "../types";

interface AppState {
  // State
  currentUser: User; // We'll keep this typed but it gets overwritten by AuthContext usually
  stories: Story[];
  posts: Post[];
  savedPostIds: Set<number | string>;
  followedUsers: Set<string>;
  theme: "dark" | "light";
  toastMessage: string | null;
  isCreateModalOpen: boolean;
  isEditProfileOpen: boolean;
  viewingStory: string | null;
  viewingPost: Post | null;
  viewingReel: Reel | null;
  isSidebarExpanded: boolean;
  unreadNotificationsCount: number;
  unreadMessagesCount: number;

  // Actions
  toggleTheme: () => void;
  setToastMessage: (msg: string | null) => void;
  showToast: (msg: string) => void;
  setCreateModalOpen: (open: boolean) => void;
  setEditProfileOpen: (open: boolean) => void;
  setViewingStory: (id: string | null) => void;
  setViewingPost: (post: Post | null) => void;
  setViewingReel: (reel: Reel | null) => void;
  toggleSidebar: () => void;
  setUnreadNotificationsCount: (count: number) => void;
  setUnreadMessagesCount: (count: number) => void;
  toggleSave: (postId: string) => void;
  toggleFollow: (username: string) => void;
  updateProfile: (name: string, bio: string, avatar: string) => void;
  setCurrentUser: (user: User) => void;
  addStory: (img: string) => void;
  createPost: (postData: { image: string; caption: string }) => void;
}

export const useAppStore = create<AppState>((set, get) => ({
  currentUser: {
    username: "",
    name: "",
    avatar: "",
    stats: { posts: 0, followers: 0, following: 0 },
  },
  stories: [],
  posts: [],
  savedPostIds: new Set<string>(), // Standardize on string
  followedUsers: new Set(),
  theme: "dark",
  toastMessage: null,
  isCreateModalOpen: false,
  isEditProfileOpen: false,
  viewingStory: null,
  viewingPost: null,
  viewingReel: null,
  isSidebarExpanded: true,
  unreadNotificationsCount: 0,
  unreadMessagesCount: 0,

  setUnreadNotificationsCount: (count) =>
    set({ unreadNotificationsCount: count }),
  setUnreadMessagesCount: (count) => set({ unreadMessagesCount: count }),

  toggleSidebar: () =>
    set((state) => ({ isSidebarExpanded: !state.isSidebarExpanded })),

  toggleTheme: () =>
    set((state) => ({ theme: state.theme === "dark" ? "light" : "dark" })),

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
  setViewingReel: (reel) => set({ viewingReel: reel }),

  toggleSave: (postId) =>
    set((state) => {
      const newSaved = new Set<string>(
        state.savedPostIds as unknown as Iterable<string>,
      );
      if (newSaved.has(postId)) {
        newSaved.delete(postId);
        get().showToast("সেভ থেকে সরানো হয়েছে");
      } else {
        newSaved.add(postId);
        get().showToast("সেভ করা হয়েছে");
      }
      return { savedPostIds: newSaved };
    }),

  toggleFollow: (username) =>
    set((state) => {
      const newFollowed = new Set(state.followedUsers);
      const newStats = { ...state.currentUser.stats } as {
        posts: number;
        followers: number;
        following: number;
      };

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
      get().showToast("প্রোফাইল আপডেট করা হয়েছে");
      return {
        currentUser: { ...state.currentUser, name, bio, avatar },
      };
    }),

  setCurrentUser: (user) => set({ currentUser: user }),

  addStory: (img) =>
    set((state) => {
      // Optimistic update for stories - though real app would upload
      const newStory: Story = {
        id: String(Date.now()),
        username: state.currentUser.username,
        img,
        isUser: true,
      };
      get().showToast("স্টোরি যোগ করা হয়েছে");
      return {
        stories: [newStory, ...state.stories.filter((s) => !s.isUser)],
      };
    }),

  createPost: ({ image, caption }) =>
    set((state) => {
      // This is now largely handled by React Query mutation, but keeping for compatibility if needed
      const newPost: Post = {
        id: String(Date.now()),
        user: state.currentUser,
        content: { type: "image", src: image, poster: image },
        likes: 0,
        caption,
        comments: 0,
        time: "এইমাত্র",
        commentList: [],
        hasLiked: false,
      };
      // get().showToast("পোস্ট শেয়ার করা হয়েছে");
      return { posts: [newPost, ...state.posts] };
    }),
}));
