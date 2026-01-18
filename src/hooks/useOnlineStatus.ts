import { useEffect } from "react";
import { supabase } from "../lib/supabaseClient";
import { useAuth } from "./useAuth";

const UPDATE_INTERVAL = 60 * 1000; // 1 minute

export const useOnlineStatus = () => {
  const { user } = useAuth();

  useEffect(() => {
    if (!user) return;

    const updateStatus = async () => {
      try {
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        await (supabase.from("profiles") as any)
          .update({
            is_online: true,
            last_seen: new Date().toISOString(),
          })
          .eq("id", user.id);
      } catch (error) {
        console.error("Error updating online status:", error);
      }
    };

    // Update immediately
    updateStatus();

    // Update periodically
    const interval = setInterval(updateStatus, UPDATE_INTERVAL);

    // Update on visibility change
    const handleVisibilityChange = () => {
      if (document.visibilityState === "visible") {
        updateStatus();
      }
    };
    document.addEventListener("visibilitychange", handleVisibilityChange);

    return () => {
      clearInterval(interval);
      document.removeEventListener("visibilitychange", handleVisibilityChange);
    };
  }, [user]);
};
