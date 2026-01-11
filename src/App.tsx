import { useEffect, Suspense, lazy } from "react";
import { Routes, Route, useLocation } from "react-router-dom";
import { AnimatePresence } from "framer-motion";
import Layout from "./components/layout/Layout";
import { supabase } from "./lib/supabaseClient";
import { useQueryClient } from "@tanstack/react-query";
// Lazy load views for optimization
const HomeView = lazy(() => import("./views/HomeView"));
const ProfileView = lazy(() => import("./views/ProfileView"));
const MessagesView = lazy(() => import("./views/MessagesView"));
const ReelsView = lazy(() => import("./views/ReelsView"));
const NotificationsView = lazy(() => import("./views/NotificationsView"));
const ExploreView = lazy(() => import("./views/ExploreView"));
const AuthView = lazy(() => import("./views/AuthView"));

import CreateModal from "./components/modals/CreateModal";
import EditProfileModal from "./components/modals/EditProfileModal";
import StoryViewer from "./components/StoryViewer";
import PostDetailsModal from "./components/modals/PostDetailsModal";
import { useAppStore } from "./store/useAppStore";
import PageWrapper from "./components/PageWrapper";
import { useAuth } from "./hooks/useAuth";
import type { User as AppUser } from "./types";
import {
  useGetNotifications,
  NOTIFICATIONS_QUERY_KEY,
} from "./hooks/queries/useGetNotifications";

export default function App() {
  const {
    theme,
    toastMessage,
    isCreateModalOpen,
    isEditProfileOpen,
    viewingStory,
    viewingPost,
    viewingReel,
    setCurrentUser,
    setUnreadNotificationsCount,
    showToast,
  } = useAppStore();

  const { user, profile, loading: authLoading } = useAuth();
  const location = useLocation();
  const queryClient = useQueryClient();
  const { data: notifications = [] } = useGetNotifications(user?.id);

  // Define public routes that don't require authentication
  const isPublicRoute =
    location.pathname.startsWith("/reels/") &&
    location.pathname.split("/").length === 3;

  // Realtime Notifications Subscription
  useEffect(() => {
    if (!user) return;

    const channel = supabase
      .channel(`notifications_realtime_${user.id}`)
      .on(
        "postgres_changes",
        {
          event: "INSERT",
          schema: "public",
          table: "notifications",
          filter: `user_id=eq.${user.id}`,
        },
        (payload) => {
          console.log("New notification:", payload);
          queryClient.invalidateQueries({ queryKey: NOTIFICATIONS_QUERY_KEY });
          showToast("একটি নতুন নোটিফিকেশন এসেছে");
        },
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [user, queryClient, showToast]);

  useEffect(() => {
    const lastRead = localStorage.getItem("lastNotificationReadTime");
    const lastReadDate = lastRead ? new Date(lastRead) : new Date(0);
    const unread = notifications.filter(
      (n) => n.created_at && new Date(n.created_at) > lastReadDate,
    );
    setUnreadNotificationsCount(unread.length);
  }, [notifications, setUnreadNotificationsCount]);

  useEffect(() => {
    if (profile && user) {
      // Map Supabase profile to App User type
      const appUser: AppUser = {
        username: profile.username,
        name: profile.full_name || user.email || "User",
        avatar:
          profile.avatar_url ||
          "https://api.dicebear.com/9.x/avataaars/svg?seed=default",
        bio: profile.bio || "",
        isVerified: profile.is_verified || false,
        stats: {
          // These would ideally come from the DB too, simple default for now or fetch via hook
          posts: 0,
          followers: 0,
          following: 0,
        },
      };
      setCurrentUser(appUser);
    }
  }, [profile, user, setCurrentUser]);

  if (authLoading) {
    return (
      <div
        className={`min-h-screen flex items-center justify-center ${theme === "dark" ? "bg-black" : "bg-white"}`}
      >
        <img
          src="/icon.png"
          className="w-20 h-20 animate-pulse"
          alt="Loading"
        />
      </div>
    );
  }

  if (!user && !isPublicRoute) {
    return (
      <Suspense
        fallback={
          <div
            className={`min-h-screen flex items-center justify-center ${theme === "dark" ? "bg-black" : "bg-white"}`}
          >
            <img
              src="/icon.png"
              className="w-20 h-20 animate-pulse"
              alt="Loading"
            />
          </div>
        }
      >
        <AuthView />
      </Suspense>
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
      <AnimatePresence>{isCreateModalOpen && <CreateModal />}</AnimatePresence>
      <AnimatePresence>
        {isEditProfileOpen && <EditProfileModal />}
      </AnimatePresence>
      <AnimatePresence>
        {viewingStory !== null && <StoryViewer />}
      </AnimatePresence>
      <AnimatePresence>
        {(viewingPost !== null || viewingReel !== null) && (
          <PostDetailsModal key={viewingPost?.id || viewingReel?.id} />
        )}
      </AnimatePresence>

      <AnimatePresence mode="wait">
        <Suspense
          fallback={
            <div
              className={`min-h-screen w-full flex items-center justify-center ${theme === "dark" ? "bg-black" : "bg-white"}`}
            >
              <div className="w-8 h-8 border-4 border-[#006a4e] border-t-transparent rounded-full animate-spin"></div>
            </div>
          }
        >
          <Routes location={location} key={location.pathname}>
            <Route element={<Layout />}>
              <Route
                path="/"
                element={
                  <PageWrapper>
                    <HomeView />
                  </PageWrapper>
                }
              />
              <Route
                path="/explore"
                element={
                  <PageWrapper>
                    <ExploreView />
                  </PageWrapper>
                }
              />
              <Route
                path="/reels/:id?"
                element={
                  <PageWrapper>
                    <ReelsView />
                  </PageWrapper>
                }
              />
              <Route
                path="/messages/:username?"
                element={
                  <PageWrapper>
                    <MessagesView />
                  </PageWrapper>
                }
              />
              <Route
                path="/notifications"
                element={
                  <PageWrapper>
                    <NotificationsView />
                  </PageWrapper>
                }
              />
              <Route
                path="/profile/:username"
                element={
                  <PageWrapper>
                    <ProfileView />
                  </PageWrapper>
                }
              />
            </Route>
          </Routes>
        </Suspense>
      </AnimatePresence>
    </>
  );
}
