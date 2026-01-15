# Typing Indicator, Last Seen & Active Status - Implementation Guide

## Features Implemented

### 1. **Typing Indicator** ✅
- Real-time typing detection via Supabase Presence
- Shows which users are currently typing
- Auto-clears after 3 seconds of inactivity
- Bengali UI text

### 2. **Last Seen** ✅
- Tracks when user was last active
- Updates every 30 seconds while active
- Persists on page unload
- Shows relative time (minutes/hours/days ago)

### 3. **Active Status / Online Now** ✅
- Real-time online/offline status
- Green dot indicator on avatar
- Updates automatically when user enters/leaves chat
- Synced across the app via Supabase Realtime

---

## Database Schema Changes

Updated `/banglagram/scheme.sql` - Added to `profiles` table:
- `last_seen: timestamp with time zone` - When user was last active
- `is_online: boolean` - Current online status

---

## New Hooks Created

### 1. **`useLastSeen.ts`**
Tracks and updates user's last seen timestamp
```typescript
- Updates every 30 seconds while active
- Handles visibility change (tab hidden/shown)
- Updates on page unload
```

### 2. **`useActiveStatus.ts`**
Manages real-time online/offline status via Supabase Presence
```typescript
- Subscribes to presence changes
- Tracks other users' online status
- Broadcasts own status
- Syncs with database
```

### 3. **`useTypingIndicator.ts`** (Enhanced)
Improved from original implementation
```typescript
- Better presence sync handling
- Auto-clear after 3 seconds
- Join/leave event handling
```

---

## New Components

### 1. **`UserStatus.tsx`**
Displays user's online/offline status with last seen time
```tsx
- Green dot for "অ্যাক্টিভ এখনই" (Active now)
- Shows "শেষ সক্রিয়: X মিনিট আগে" (Last seen: X minutes ago)
- Bengali localized text
```

### 2. **`TypingIndicator.tsx`**
Animated component showing who's typing
```tsx
- Shows typing animation with bouncing dots
- Displays count or names of typing users
- Bengali UI text
```

---

## Integration in MessagesView

### Imports Added
```typescript
import { useActiveStatus } from "../hooks/useActiveStatus";
import { UserStatus } from "../components/UserStatus";
import { TypingIndicator } from "../components/TypingIndicator";
```

### Features Integrated
1. **Header Status** - Shows online/offline indicator + last seen
2. **Typing Indicator** - Displays below messages
3. **Auto Presence Tracking** - Activates when chat opens, deactivates on close

---

## App.tsx Changes

Added `useLastSeen()` hook at app root to:
- Initialize last seen tracking on app mount
- Update status on visibility change
- Update on unload

---

## Type Definitions

Updated `database.types.ts` with new fields:
```typescript
profiles: {
  Row: {
    ...
    last_seen: string | null;
    is_online: boolean;
  }
}
```

---

## How It Works

### User Presence Flow
```
1. User opens chat
   ↓
2. setOnlineStatus(true) called
   ↓
3. Presence broadcast via Supabase Realtime
   ↓
4. Other users see "অ্যাক্টিভ এখনই" (Active now)
   
When user leaves:
   ↓
5. setOnlineStatus(false) called
   ↓
6. last_seen timestamp saved
   ↓
7. Status shows "শেষ সক্রিয়: X মিনিট আগে"
```

### Typing Indicator Flow
```
1. User starts typing
   ↓
2. setTyping(true) broadcast
   ↓
3. Presence state syncs
   ↓
4. Other users see "X টাইপ করছে..." (X is typing)
   ↓
5. Auto-clears after 3 seconds of inactivity
```

### Last Seen Flow
```
1. App initializes
   ↓
2. useLastSeen() updates every 30 seconds
   ↓
3. On tab hidden → is_online = false
   ↓
4. On tab visible → is_online = true
   ↓
5. On page unload → saves last_seen
```

---

## File Changes Summary

| File | Changes |
|------|---------|
| `scheme.sql` | Added `last_seen`, `is_online` to profiles |
| `database.types.ts` | Added new field types |
| `App.tsx` | Import & init `useLastSeen()` |
| `MessagesView.tsx` | Integrated all 3 features |
| `useTypingIndicator.ts` | Enhanced with better sync |
| `useActiveStatus.ts` | New hook for presence |
| `useLastSeen.ts` | New hook for tracking |
| `UserStatus.tsx` | New display component |
| `TypingIndicator.tsx` | New display component |

---

## Testing Checklist

- [ ] Run database migration to add new columns
- [ ] User online status updates when entering chat
- [ ] Green dot appears on user avatar
- [ ] Last seen updates when user goes offline
- [ ] Typing indicator shows when user types
- [ ] Typing indicator auto-clears after 3 seconds
- [ ] Status persists on page reload
- [ ] Multiple users typing shows count
- [ ] Bengali UI text displays correctly

---

## Next Steps

1. Run SQL migration to update database schema
2. Test presence synchronization with real users
3. Monitor performance with multiple concurrent chats
4. Consider adding:
   - Read receipts
   - "Seen" indicator for messages
   - Custom presence status messages
