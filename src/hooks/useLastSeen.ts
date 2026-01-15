import { useEffect, useCallback } from "react";
import { supabase } from "../lib/supabaseClient";
import { useAuth } from "./useAuth";

export const useLastSeen = () => {
  const { user } = useAuth();

  const updateLastSeen = useCallback(async () => {
    if (!user) return;

    try {
      const now = new Date().toISOString();
      await (supabase
        .from("profiles") as any)
        .update({
          last_seen: now,
          is_online: true,
        })
        .eq("id", user.id);
    } catch (error) {
      console.error("Error updating last seen:", error);
    }
  }, [user]);

  const updateOfflineStatus = useCallback(async () => {
    if (!user) return;

    try {
      const now = new Date().toISOString();
      await (supabase
        .from("profiles") as any)
        .update({
          last_seen: now,
          is_online: false,
        })
        .eq("id", user.id);
    } catch (error) {
      console.error("Error updating offline status:", error);
    }
  }, [user]);

  // Update last_seen periodically when active
  useEffect(() => {
    if (!user) return;

    // Update immediately
    updateLastSeen();

    // Update every 30 seconds while active
    const interval = setInterval(updateLastSeen, 30000);

    // Handle visibility change
    const handleVisibilityChange = () => {
      if (document.hidden) {
        updateOfflineStatus();
      } else {
        updateLastSeen();
      }
    };

    // Handle page unload
    const handleBeforeUnload = () => {
      updateOfflineStatus();
    };

    document.addEventListener("visibilitychange", handleVisibilityChange);
    window.addEventListener("beforeunload", handleBeforeUnload);

    return () => {
      clearInterval(interval);
      document.removeEventListener("visibilitychange", handleVisibilityChange);
      window.removeEventListener("beforeunload", handleBeforeUnload);
    };
  }, [user, updateLastSeen, updateOfflineStatus]);

  return { updateLastSeen, updateOfflineStatus };
};
