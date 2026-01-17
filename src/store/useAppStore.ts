import { create } from "zustand";
import type { User, Post, Story, Reel } from "../types";
import { toast } from "sonner";

interface AppState {
  // State
  currentUser: User;
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
  setCurrentUser: (user: User) => void;
  addStory: (img: string) => void;
}

export const useAppStore = create<AppState>((set, get) => ({
  currentUser: {
    id: "",
    username: "",
    name: "",
    avatar: "",
    stats: { posts: 0, followers: 0, following: 0 },
  },
  stories: [],
  posts: [],
  savedPostIds: new Set<string>(),
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
    toast(msg);
  },

  setCreateModalOpen: (open) => set({ isCreateModalOpen: open }),
  setEditProfileOpen: (open) => set({ isEditProfileOpen: open }),
  setViewingStory: (id) => set({ viewingStory: id }),
  setViewingPost: (post) => set({ viewingPost: post }),
  setViewingReel: (reel) => set({ viewingReel: reel }),
  setCurrentUser: (user) => set({ currentUser: user }),

  addStory: (img) =>
    set((state) => {
      const newStory: Story = {
        id: String(Date.now()),
        username: state.currentUser.username,
        img,
        isUser: true,
      };
      get().showToast("Story added");
      return {
        stories: [newStory, ...state.stories.filter((s) => !s.isUser)],
      };
    }),
}));
