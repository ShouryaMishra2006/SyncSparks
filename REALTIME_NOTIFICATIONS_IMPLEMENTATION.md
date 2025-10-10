# Real-time Join/Leave Notifications Implementation

## Overview

Implemented a complete real-time notification system that shows toast notifications when users join or leave a collaboration session, with live participant count updates.

## Features Implemented

### ✅ 1. **Toast Notifications**

- **Join notifications** (green) - Shows when a user joins the session
- **Leave notifications** (orange) - Shows when a user leaves the session
- **Auto-dismiss** - Notifications automatically disappear after 4 seconds
- **Smooth animations** - Slide-in-right animation for visual appeal
- **Icons** - Different icons for join/leave events

### ✅ 2. **Live Participant Count**

- Displayed in the header with a green pulsing indicator
- Updates in real-time as users join/leave
- Shows "X participant(s) online"

### ✅ 3. **WebSocket Message Routing**

- Distinguishes between Y.js binary updates and custom JSON messages
- Properly handles both types without interference
- Session-based client tracking

## Technical Implementation

### Backend Changes (`backend/src/index.ts`)

#### 1. **Session Management**

```typescript
interface ClientInfo {
  ws: any;
  userId: string;
  userName: string;
}

const sessions = new Map<string, Set<ClientInfo>>();
```

#### 2. **URL Parameters**

WebSocket connection now requires:

- `sessionId` - Collaboration session ID
- `userId` - User's unique ID
- `userName` - User's display name

Example: `ws://localhost:4000/yjs?sessionId=abc123&userId=xyz&userName=John%20Doe`

#### 3. **Message Types**

**User Joined:**

```json
{
  "type": "user-joined",
  "data": {
    "userId": "user123",
    "userName": "John Doe",
    "participantCount": 3,
    "timestamp": 1696848000000
  }
}
```

**User Left:**

```json
{
  "type": "user-left",
  "data": {
    "userId": "user123",
    "userName": "John Doe",
    "participantCount": 2,
    "timestamp": 1696848000000
  }
}
```

#### 4. **Message Handling**

- Binary messages (starting with 0, 1, or 2) → Y.js updates
- Other messages → Try to parse as JSON for custom events
- Broadcasts to session-specific clients only (not all clients)

#### 5. **Event Broadcasting**

- **On connect:** Sends join event to ALL clients in session (including self for initial count)
- **On disconnect:** Sends leave event to REMAINING clients
- **Session cleanup:** Removes empty sessions from memory

### Frontend Changes (`sync-sparkss/app/collab/canvas/[sessionId]/page.tsx`)

#### 1. **New State Variables**

```typescript
const [participantCount, setParticipantCount] = useState(0);
const [notifications, setNotifications] = useState<Notification[]>([]);
```

#### 2. **Notification Type**

```typescript
type Notification = {
  id: string;
  message: string;
  type: "success" | "info" | "warning";
};
```

#### 3. **WebSocket Connection with User Info**

```typescript
const provider = new WebsocketProvider(
  `ws://localhost:4000/yjs?sessionId=${sessionId}&userId=${
    user._id
  }&userName=${encodeURIComponent(user.name)}`,
  sessionId,
  ydoc
);
```

#### 4. **Message Listener**

Intercepts WebSocket messages without breaking Y.js functionality:

```typescript
const setupMessageListener = () => {
  if (provider.ws) {
    const originalOnMessage = provider.ws.onmessage;

    provider.ws.onmessage = (event) => {
      // Let y-websocket handle its messages first
      if (originalOnMessage && provider.ws) {
        originalOnMessage.call(provider.ws, event);
      }

      // Then check for custom JSON messages
      try {
        const data = JSON.parse(event.data);
        // Handle custom messages...
      } catch {
        // Not JSON, ignore
      }
    };
  }
};
```

#### 5. **Notification Helper**

```typescript
const showNotification = (
  message: string,
  type: "success" | "info" | "warning"
) => {
  const id = `notif-${Date.now()}`;
  setNotifications((prev) => [...prev, { id, message, type }]);

  setTimeout(() => {
    setNotifications((prev) => prev.filter((n) => n.id !== id));
  }, 4000);
};
```

#### 6. **UI Components**

**Header with Live Count:**

```tsx
<p className="text-sm text-gray-400 flex items-center gap-2">
  <span className="inline-block w-2 h-2 bg-green-500 rounded-full animate-pulse"></span>
  <span>
    {participantCount > 0
      ? participantCount
      : session?.participants?.length || 0}
    participant(s) online
  </span>
</p>
```

**Toast Notifications:**

```tsx
<div className="fixed bottom-6 right-6 z-50 space-y-2">
  {notifications.map((notification) => (
    <div key={notification.id} className={...}>
      {/* Icon based on type */}
      <p>{notification.message}</p>
    </div>
  ))}
</div>
```

## How It Works

### 1. **User Joins Session**

```
User A opens canvas
├─ WebSocket connects with userId & userName
├─ Backend adds user to session clients
├─ Backend broadcasts "user-joined" to ALL clients (including A)
├─ User A receives message, sets participantCount (doesn't show toast for self)
└─ Other users receive message, show toast + update count
```

### 2. **User Leaves Session**

```
User A closes browser/navigates away
├─ WebSocket "close" event fires
├─ Backend removes user from session clients
├─ Backend broadcasts "user-left" to REMAINING clients
├─ Other users receive message, show toast + update count
└─ Backend cleans up empty sessions
```

### 3. **Message Flow**

```
Client sends message
├─ Is it binary (0, 1, 2)?
│   ├─ Yes → Y.js update
│   │   ├─ Apply to Y.Doc
│   │   └─ Broadcast to session clients
│   └─ No → Try parse as JSON
│       ├─ Success → Handle custom message type
│       └─ Fail → Log error
```

## Testing Instructions

### Test Join Notifications

1. Open collaboration canvas in Browser 1 (User A)
2. Note participant count = 1
3. Open same session in Browser 2 (User B)
4. **Browser 1 should show:**
   - Toast: "User B has joined" (green, bottom-right)
   - Participant count updates to 2
5. **Browser 2 should show:**
   - Participant count = 2
   - No toast (doesn't notify self)

### Test Leave Notifications

1. With both browsers connected
2. Close Browser 2 or navigate away
3. **Browser 1 should show:**
   - Toast: "User B has left" (orange, bottom-right)
   - Participant count updates to 1

### Test Multiple Users

1. Open session in 3+ browsers with different users
2. Each new join should notify all existing users
3. Participant count should match actual connected users
4. Closing any browser should notify remaining users

### Test Y.js Sync

1. With multiple browsers connected
2. Create/edit/move cards in one browser
3. Changes should sync in real-time to all browsers
4. No interference with join/leave notifications

## Key Design Decisions

### Why Intercept WebSocket Messages?

- **Single connection:** Avoids overhead of multiple WebSocket connections
- **Y.js compatibility:** Doesn't break existing Y.js sync functionality
- **Simple backend:** No need for separate WebSocket server/path

### Why Not Show Toast for Self?

- **UX:** User already knows they joined (they initiated it)
- **Clean UI:** Reduces notification noise
- **Count still updates:** User sees their own count increase

### Why Session-Based Broadcasting?

- **Scalability:** Only broadcasts to relevant clients
- **Efficiency:** Doesn't send messages to unrelated sessions
- **Memory management:** Cleans up empty sessions

### Why Auto-Dismiss Notifications?

- **Non-intrusive:** Doesn't require user action
- **Prevents clutter:** Old notifications disappear automatically
- **Standard UX:** 4 seconds is industry standard for toast notifications

## Potential Enhancements

### 1. **User Avatars**

Show user avatar in notifications:

```tsx
<img src={data.userAvatar} className="w-6 h-6 rounded-full" />
<span>{data.userName} has joined</span>
```

### 2. **Sound Effects**

Play notification sound:

```typescript
const joinSound = new Audio("/sounds/join.mp3");
joinSound.play();
```

### 3. **Connection Status**

Show connection indicator:

```tsx
provider.on("status", ({ status }) => {
  setConnectionStatus(status); // "connected" | "disconnected"
});
```

### 4. **Participant List Modal**

Show all connected users:

```tsx
<button onClick={() => setShowParticipants(true)}>
  {participantCount} participants
</button>
```

### 5. **Typing Indicators**

Show when users are editing:

```typescript
ws.send(
  JSON.stringify({
    type: "typing",
    data: { userId, userName, elementId },
  })
);
```

### 6. **User Presence Cursors**

Show other users' mouse positions:

```typescript
ws.send(
  JSON.stringify({
    type: "cursor-move",
    data: { userId, userName, x, y },
  })
);
```

## Troubleshooting

### Notifications Not Showing

- ✅ Check browser console for errors
- ✅ Verify WebSocket connection URL includes userId and userName
- ✅ Ensure backend is running and accessible
- ✅ Check that user object is not null

### Participant Count Not Updating

- ✅ Check that `setParticipantCount` is being called
- ✅ Verify backend is sending `participantCount` in messages
- ✅ Check WebSocket message listener is set up correctly

### Y.js Sync Not Working

- ✅ Verify binary messages are still being handled
- ✅ Check that `originalOnMessage` is being called
- ✅ Ensure Y.js updates aren't being blocked

### Connection Fails

- ✅ Check that all URL parameters are present
- ✅ Verify user object exists and has \_id and name
- ✅ Check that encodeURIComponent is used for userName

## Files Modified

### Backend

- ✅ `backend/src/index.ts` - WebSocket server with session tracking

### Frontend

- ✅ `sync-sparkss/app/collab/canvas/[sessionId]/page.tsx` - Notifications UI and WebSocket listener

## Performance Considerations

- **Memory:** Each session stores Set of ClientInfo (lightweight)
- **Network:** JSON messages are small (~200 bytes)
- **CPU:** Message parsing is fast (JSON.parse)
- **Cleanup:** Empty sessions are removed automatically

## Security Considerations

- **Validation:** Backend validates required parameters
- **Session isolation:** Messages only broadcast to same session
- **No sensitive data:** Only userId and userName are shared
- **WebSocket closing:** Properly handled on both client and server

---

**Status:** ✅ Fully Implemented and Ready for Testing
**Date:** October 9, 2025
