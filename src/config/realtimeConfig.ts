// Realtime Messaging Best Practices Configuration
// This file documents the optimization strategies used

export const REALTIME_CONFIG = {
  // Message polling/refetch strategy
  REFETCH_INTERVAL: 0, // No polling - rely on Realtime only
  STALE_TIME: 0, // Always treat cache as stale until confirmed

  // Optimistic updates
  OPTIMISTIC_UPDATE_ENABLED: true, // Show message immediately

  // Debouncing
  TYPING_INDICATOR_DELAY: 500, // ms before showing typing
  TYPING_CLEAR_TIMEOUT: 3000, // ms before clearing typing status

  // Scroll behavior
  AUTO_SCROLL_ENABLED: true, // Always scroll to latest message
  SCROLL_BEHAVIOR: "smooth", // Smooth scroll animation

  // Query configuration
  QUERY_CONFIG: {
    // Refetch active queries immediately
    refetchType: "active",
    // Stale time in milliseconds
    staleTime: 0,
  },
};

// Realtime subscription strategy:
// 1. Use Supabase Realtime for postgres_changes (INSERT/UPDATE/DELETE)
// 2. Use optimistic updates for immediate UI feedback
// 3. Use refetchQueries (not invalidate) to get fresh data immediately
// 4. Always scroll to bottom when new messages arrive
// 5. Use Presence channel for typing indicators and online status

export const REALTIME_BEST_PRACTICES = `
✅ Best Practices Implemented:

1. OPTIMISTIC UPDATES
   - Message shows immediately in UI
   - Rollback if server rejects

2. REAL-TIME SUBSCRIPTION
   - Listen to postgres_changes on messages table
   - Refetch queries automatically on new data
   - Handle connection failures gracefully

3. LOW LATENCY
   - refetchQueries instead of invalidateQueries
   - No polling - event-driven updates
   - Presence state for typing/online

4. AUTO-SCROLL
   - Always scroll to bottom on new messages
   - Smooth scroll animation for UX

5. TYPING INDICATORS
   - Supabase Presence channel
   - 3-second auto-clear
   - Don't show current user's indicator

6. ONLINE STATUS
   - Real-time presence tracking
   - Last seen timestamp
   - Green dot indicator

7. ERROR HANDLING
   - Retry on connection failure
   - Fallback to polling if needed
   - User-friendly error messages

8. PERFORMANCE
   - Infinite scroll for old messages
   - Pagination (20 messages per page)
   - Debounced typing updates
`;
