import { useEffect, useState } from "react";
import { useInView } from "react-intersection-observer";
import { supabase } from "../lib/supabaseClient";

export const useViewTracker = (
  id: string,
  type: "post" | "reel",
  thresholdMs = 3000,
) => {
  const { ref, inView } = useInView({
    threshold: 0.6, // Item must be 60% visible
    triggerOnce: true, // Only trigger once to avoid spamming
  });

  const [hasViewed, setHasViewed] = useState(false);

  useEffect(() => {
    let timer: NodeJS.Timeout;

    if (inView && !hasViewed) {
      timer = setTimeout(async () => {
        try {
          await supabase.rpc("increment_view_count", {
            target_id: id,
            type: type,
            // eslint-disable-next-line @typescript-eslint/no-explicit-any
          } as any);
          setHasViewed(true);
        } catch (error) {
          console.error("Failed to track view", error);
        }
      }, thresholdMs);
    }

    return () => clearTimeout(timer);
  }, [inView, hasViewed, id, type, thresholdMs]);

  return { ref };
};
