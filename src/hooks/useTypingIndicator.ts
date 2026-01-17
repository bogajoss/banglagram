import { useEffect, useState, useRef } from "react";
import { supabase } from "../lib/supabaseClient";
import { useAuth } from "./useAuth";
import { RealtimeChannel } from "@supabase/supabase-js";

export const useTypingIndicator = (roomId: string) => {
  const { user, profile } = useAuth();
  const [typingUsers, setTypingUsers] = useState<string[]>([]);
  const channelRef = useRef<RealtimeChannel | null>(null);
  const typingTimeoutRef = useRef<Record<string, NodeJS.Timeout>>({});

  useEffect(() => {
    if (!user || !roomId) return;

    const channel = supabase.channel(`typing:${roomId}`, {
      config: {
        presence: {
          key: user.id,
        },
      },
    });

    channelRef.current = channel;

    const handlePresenceSync = () => {
      const state = channel.presenceState();
      const typing: string[] = [];

      Object.keys(state).forEach((key) => {
        const presenceArray = state[key] as Array<{
          isTyping?: boolean;
          username?: string;
          userId?: string;
        }>;
        presenceArray.forEach((p) => {
          // Don't show current user's typing indicator
          if (p.isTyping && p.username && p.userId !== user?.id) {
            typing.push(p.username);
          }
        });
      });

      setTypingUsers([...new Set(typing)]);
    };

    channel
      .on("presence", { event: "sync" }, handlePresenceSync)
      .on("presence", { event: "join" }, () => {
        handlePresenceSync();
      })
      .on("presence", { event: "leave" }, () => {
        handlePresenceSync();
      })
      .subscribe();

    // Capture ref value for cleanup
    const timeouts = typingTimeoutRef.current;

    return () => {
      supabase.removeChannel(channel);
      channelRef.current = null;
      // Clear all timeouts
      Object.values(timeouts).forEach(clearTimeout);
    };
  }, [roomId, user]);

  const setTyping = async (isTyping: boolean) => {
    if (channelRef.current && user && profile) {
      const presenceData = {
        isTyping,
        username: profile.username,
        userId: user.id,
      };

      await channelRef.current.track(presenceData);

      // Auto-clear typing status after 3 seconds of inactivity
      if (isTyping) {
        if (typingTimeoutRef.current[user.id]) {
          clearTimeout(typingTimeoutRef.current[user.id]);
        }

        typingTimeoutRef.current[user.id] = setTimeout(async () => {
          if (channelRef.current) {
            await channelRef.current.track({
              isTyping: false,
              username: profile.username,
              userId: user.id,
            });
          }
        }, 3000);
      } else {
        if (typingTimeoutRef.current[user.id]) {
          clearTimeout(typingTimeoutRef.current[user.id]);
        }
      }
    }
  };

  return { typingUsers, setTyping };
};