import { useEffect, useState, useRef } from "react";
import { supabase } from "../lib/supabaseClient";
import { useAuth } from "./useAuth";
import { RealtimeChannel } from "@supabase/supabase-js";

export const useTypingIndicator = (roomId: string) => {
  const { user, profile } = useAuth();
  const [typingUsers, setTypingUsers] = useState<string[]>([]);
  const channelRef = useRef<RealtimeChannel | null>(null);

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

    channel
      .on("presence", { event: "sync" }, () => {
        const state = channel.presenceState();
        const typing: string[] = [];
        
        Object.keys(state).forEach(key => {
            if (key === user.id) return;
            const presence = state[key] as Array<{ isTyping?: boolean; username?: string }>;
            presence.forEach(p => {
                if (p.isTyping && p.username) {
                    typing.push(p.username);
                }
            });
        });
        
        setTypingUsers([...new Set(typing)]);
      })
      .subscribe();

    return () => {
        supabase.removeChannel(channel);
        channelRef.current = null;
    };
  }, [roomId, user]);

  const setTyping = async (isTyping: boolean) => {
    if (channelRef.current) {
        await channelRef.current.track({ 
            isTyping, 
            username: profile?.username,
            online_at: new Date().toISOString(),
        });
    }
  };

  return { typingUsers, setTyping };
};