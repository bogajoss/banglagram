import { useEffect, Suspense, lazy } from "react";
import dayjs from "dayjs";
import { Routes, Route, useLocation } from "react-router-dom";
import { AnimatePresence } from "framer-motion";
import Layout from "./components/layout/Layout";
import { supabase } from "./lib/supabaseClient";
import { useQueryClient } from "@tanstack/react-query";
import { useLastSeen } from "./hooks/useLastSeen";
import { useOnlineStatus } from "./hooks/useOnlineStatus";
const HomeView = lazy(() => import("./views/HomeView"));
const ProfileView = lazy(() => import("./views/ProfileView"));
const MessagesView = lazy(() => import("./views/MessagesView"));
const ReelsView = lazy(() => import("./views/ReelsView"));
const NotificationsView = lazy(() => import("./views/NotificationsView"));
const ExploreView = lazy(() => import("./views/ExploreView"));
const AuthView = lazy(() => import("./views/AuthView"));
const PostView = lazy(() => import("./views/PostView"));


import CreateModal from "./components/modals/CreateModal";
import EditProfileModal from "./components/modals/EditProfileModal";
import StoryViewer from "./components/StoryViewer";
import PostDetailsModal from "./components/modals/PostDetailsModal";
import { useAppStore } from "./store/useAppStore";
import PageWrapper from "./components/PageWrapper";
import AppSkeleton from "./components/layout/AppSkeleton";
import { useAuth } from "./hooks/useAuth";
import type { User as AppUser } from "./types";
import {
  useGetNotifications,
  NOTIFICATIONS_QUERY_KEY,
} from "./hooks/queries/useGetNotifications";
import { Toaster } from "@/components/ui/sonner";

export default function App() {
  const {
    theme,
    viewingStory,
    setCurrentUser,
    setUnreadNotificationsCount,
    showToast,
  } = useAppStore();

  const { user, profile, loading: authLoading } = useAuth();
  const location = useLocation();
  const queryClient = useQueryClient();
  
  // Initialize Global Hooks
  useOnlineStatus();

  const { data: notifications = [] } = useGetNotifications(user?.id);

  const isPublicRoute =
    (location.pathname.startsWith("/reels/") &&
      location.pathname.split("/").length === 3) ||
    (location.pathname.startsWith("/post/") &&
      location.pathname.split("/").length === 3);

  useEffect(() => {
    if (theme === "dark") {
      document.documentElement.classList.add("dark");
    } else {
      document.documentElement.classList.remove("dark");
    }
  }, [theme]);

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
          showToast("New notification received");
        },
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [user, queryClient, showToast]);

  useEffect(() => {
    const lastRead = localStorage.getItem("lastNotificationReadTime");
    const lastReadDate = lastRead ? dayjs(lastRead) : dayjs(0);
    const unread = notifications.filter(
      (n) => n.created_at && dayjs(n.created_at).isAfter(lastReadDate),
    );
    setUnreadNotificationsCount(unread.length);
  }, [notifications, setUnreadNotificationsCount]);

  // Initialize last seen tracking
  useLastSeen();

  useEffect(() => {
    if (profile && user) {
      const appUser: AppUser = {
        id: user.id,
        username: profile.username,
        name: profile.full_name || user.email || "User",
        avatar:
          profile.avatar_url ||
          "https://api.dicebear.com/9.x/avataaars/svg?seed=default",
        bio: profile.bio || "",
        isVerified: profile.is_verified || false,
        stats: {
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
        className="min-h-screen flex items-center justify-center bg-background"
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
            className="min-h-screen flex items-center justify-center bg-background"
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
      <Toaster />

      {/* Modals rendered unconditionally as they manage their own Dialog state */}
      <CreateModal />
      <EditProfileModal />
      <PostDetailsModal />

      <AnimatePresence>
        {viewingStory !== null && <StoryViewer />}
      </AnimatePresence>

      <AnimatePresence mode="wait">
        <Suspense fallback={<AppSkeleton />}>
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
                path="/post/:id"
                element={
                  <PageWrapper>
                    <PostView />
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