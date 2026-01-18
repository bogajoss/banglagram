import { useEffect, useRef, useState } from "react";
import { supabase } from "../lib/supabaseClient";
import { useAuth } from "./useAuth";
import { RealtimeChannel } from "@supabase/supabase-js";

export interface UserPresence {
  userId: string;
  username: string;
  isOnline: boolean;
  lastSeen: string | null;
}

export const useActiveStatus = (roomId: string) => {
  const { user, profile } = useAuth();
  const [presenceState, setPresenceState] = useState<
    Record<string, UserPresence>
  >({});
  const channelRef = useRef<RealtimeChannel | null>(null);

  // Subscribe to presence changes
  useEffect(() => {
    if (!user || !roomId || !profile) return;

    const channel = supabase.channel(`presence:${roomId}`, {
      config: {
        presence: {
          key: user.id,
        },
      },
    });

    channelRef.current = channel;

    channel
      .on("presence", { event: "sync" }, () => {
        const state = channel.presenceState();
        const presence: Record<string, UserPresence> = {};

        Object.keys(state).forEach((key) => {
          const userPresence = state[key] as Array<{
            userId?: string;
            username?: string;
            isOnline?: boolean;
            lastSeen?: string;
          }>;

          if (userPresence && userPresence.length > 0) {
            const p = userPresence[0];
            if (p.userId && p.username) {
              presence[p.userId] = {
                userId: p.userId,
                username: p.username,
                isOnline: p.isOnline ?? false,
                lastSeen: p.lastSeen ?? null,
              };
            }
          }
        });

        setPresenceState(presence);
      })
      .on("presence", { event: "join" }, ({ newPresences }) => {
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        newPresences.forEach((presence: any) => {
          if (presence.userId && presence.username) {
            setPresenceState((prev) => ({
              ...prev,
              [presence.userId]: {
                userId: presence.userId,
                username: presence.username,
                isOnline: presence.isOnline ?? true,
                lastSeen: presence.lastSeen ?? null,
              },
            }));
          }
        });
      })
      .on("presence", { event: "leave" }, ({ leftPresences }) => {
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        leftPresences.forEach((presence: any) => {
          if (presence.userId) {
            setPresenceState((prev) => {
              const updated = { ...prev };
              delete updated[presence.userId];
              return updated;
            });
          }
        });
      })
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
      channelRef.current = null;
    };
  }, [roomId, user, profile]);

  // Track user's own online status
  const setOnlineStatus = async (isOnline: boolean) => {
    if (channelRef.current && user && profile) {
      const now = new Date().toISOString();
      const presenceData = {
        userId: user.id,
        username: profile.username,
        isOnline,
        lastSeen: isOnline ? null : now,
      };

      await channelRef.current.track(presenceData);

      // Also update the database
      if (!isOnline) {
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        await (supabase.from("profiles") as any)
          .update({
            is_online: false,
            last_seen: now,
          })
          .eq("id", user.id);
      } else {
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        await (supabase.from("profiles") as any)
          .update({
            is_online: true,
          })
          .eq("id", user.id);
      }
    }
  };

  const getPresenceStatus = (userId: string) => {
    return presenceState[userId] || null;
  };

  return {
    presenceState,
    setOnlineStatus,
    getPresenceStatus,
  };
};
