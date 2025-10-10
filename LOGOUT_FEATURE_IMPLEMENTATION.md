# Logout Feature & Cookie Management Implementation

## Overview

Implemented proper cookie management to ensure that when users log in, any previous authentication cookies are cleared. Also added a complete logout feature with a logout button in the dashboard.

## Changes Made

### ✅ 1. Backend - Clear Cookies Before Login

#### File: `backend/src/controllers/authController.ts`

**In `login` function:**

```typescript
// Clear any existing auth cookie before setting new one
res.clearCookie("token", {
  httpOnly: true,
  secure: process.env.NODE_ENV === "production",
  sameSite: "lax",
});

// Then set new cookie
const token = jwt.sign(...)
res.cookie("token", token, {...});
```

**In `googleCallback` function:**

```typescript
// Clear any existing auth cookie before setting new one
res.clearCookie("token", {
  httpOnly: true,
  secure: process.env.NODE_ENV === "production",
  sameSite: "lax",
});

// Then set new cookie
const token = jwt.sign(...)
res.cookie("token", token, {...});
```

**Why this fixes the multi-tab login issue:**

- When User A logs in → Cookie is set for User A
- When User B logs in (in another tab) → **Cookie is cleared first**, then set for User B
- Both tabs now share the same cookie (User B's), as intended in browser behavior
- No stale authentication from previous login

### ✅ 2. Backend - Logout Endpoint

#### File: `backend/src/controllers/authController.ts`

**New `logout` function:**

```typescript
export const logout = async (req: Request, res: Response) => {
  try {
    // Clear the authentication cookie
    res.clearCookie("token", {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "lax",
    });

    res.json({ message: "Logged out successfully" });
  } catch (err) {
    console.error("Logout error:", err);
    res.status(500).json({ message: "Server error during logout" });
  }
};
```

#### File: `backend/src/routes/authRoutes.ts`

**Added logout route:**

```typescript
import {
  googleCallback,
  signup,
  verifyOtp,
  login,
  logout,
} from "../controllers/authController";

// ...

router.post("/logout", logout);
```

**Endpoint:** `POST http://localhost:4000/api/auth/logout`

### ✅ 3. Frontend - Logout Button

#### File: `sync-sparkss/app/dashboard/[role]/page.tsx`

**Added `useRouter` and `handleLogout` function:**

```typescript
import { useParams, useRouter } from "next/navigation";

export default function RoleDashboardPage() {
  const { user, loading, isAuthenticated, setUser } = useAuth();
  const router = useRouter();

  const handleLogout = async () => {
    try {
      const res = await fetch("http://localhost:4000/api/auth/logout", {
        method: "POST",
        credentials: "include",
      });

      if (res.ok) {
        setUser(null); // Clear user from context
        router.push("/login"); // Redirect to login
      } else {
        alert("Failed to logout");
      }
    } catch (err) {
      console.error("Logout error:", err);
      alert("Server error during logout");
    }
  };

  // ...
}
```

**Added Logout Button in Header:**

```tsx
<header className="flex justify-between items-center mb-10">
  <span className="font-bold text-2xl">🎭 SyncSparks</span>
  <Button
    onClick={handleLogout}
    variant="outline"
    className="bg-red-600/20 hover:bg-red-600/40 border-red-600 text-red-300"
  >
    Logout
  </Button>
</header>
```

## How It Works

### Cookie Clearing on Login

```
Step 1: User A logs in
├─ Backend: res.clearCookie("token") // Clear any existing cookie
├─ Backend: res.cookie("token", tokenA) // Set new cookie for User A
└─ Browser: Cookie = User A's token

Step 2: User B logs in (different tab, same browser)
├─ Backend: res.clearCookie("token") // Clear User A's cookie
├─ Backend: res.cookie("token", tokenB) // Set new cookie for User B
└─ Browser: Cookie = User B's token (replaces User A)

Result: Both tabs now use User B's authentication
```

### Logout Flow

```
User clicks "Logout" button
├─ Frontend: Calls POST /api/auth/logout
├─ Backend: Clears "token" cookie
├─ Backend: Responds with { message: "Logged out successfully" }
├─ Frontend: setUser(null) // Clears AuthContext
└─ Frontend: router.push("/login") // Redirects to login page
```

## Testing Instructions

### Test 1: Cookie Clearing on Login

1. Login with User A in Tab 1
2. Check cookies in DevTools → Should see `token` cookie
3. Login with User B in Tab 2
4. Check cookies in DevTools → `token` cookie should be User B's
5. **Expected:** Both tabs now show User B's dashboard (if they refresh)

### Test 2: Logout Button

1. Login to dashboard
2. Click "Logout" button in top-right corner
3. **Expected:**
   - Cookie is cleared
   - Redirected to `/login` page
   - User info cleared from AuthContext
   - Cannot access protected routes without logging in again

### Test 3: Logout API Directly

```bash
# Login first to get a cookie
curl -X POST http://localhost:4000/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"user@example.com","password":"password","role":"performer"}' \
  -c cookies.txt

# Then logout
curl -X POST http://localhost:4000/api/auth/logout \
  -b cookies.txt \
  -c cookies.txt

# Response: {"message":"Logged out successfully"}
```

## UI/UX Details

### Logout Button Styling

- **Position:** Top-right corner of dashboard header
- **Color:** Red theme (red-600/20 background, red-600 border)
- **Hover:** Slightly brighter (red-600/40)
- **Text:** "Logout" in red-300 color
- **Variant:** Outline style for subtle appearance

### Visual Layout

```
┌─────────────────────────────────────────┐
│  🎭 SyncSparks          [Logout]        │
│                                         │
│            John Doe                     │
│         @johnnydoe                      │
│         PERFORMER                       │
│                                         │
│  [Dashboard Cards...]                   │
└─────────────────────────────────────────┘
```

## Security Considerations

### Cookie Settings

All cookies use secure settings:

```typescript
{
  httpOnly: true,              // Cannot be accessed via JavaScript
  secure: NODE_ENV === "production", // HTTPS only in production
  sameSite: "lax",            // CSRF protection
  maxAge: 1000 * 60 * 60      // 1 hour expiration
}
```

### Benefits

1. **httpOnly:** Prevents XSS attacks from stealing cookies
2. **secure:** Ensures cookies only sent over HTTPS in production
3. **sameSite:** Prevents CSRF attacks
4. **Clearing on login:** Prevents session fixation attacks
5. **Proper logout:** Ensures complete session termination

## Common Issues & Solutions

### Issue 1: "Cannot access protected route after logout"

**Solution:** This is expected. User must log in again.

### Issue 2: "Logout doesn't work in other tabs"

**Explanation:** Cookie is cleared, but other tabs won't know until they make a request or refresh. This is normal browser behavior.

**Optional Enhancement:** Add `storage` event listener to detect logout across tabs:

```typescript
// In AuthContext
window.addEventListener("storage", (e) => {
  if (e.key === "logout-event") {
    setUser(null);
    router.push("/login");
  }
});

// On logout
localStorage.setItem("logout-event", Date.now().toString());
```

### Issue 3: "User still logged in after cookie expires"

**Solution:** AuthContext caches user info. It only refreshes on page reload or when `/api/auth/me` is called.

**Enhancement:** Add periodic auth check:

```typescript
// Check auth status every 5 minutes
setInterval(async () => {
  const res = await fetch("/api/auth/me", { credentials: "include" });
  if (!res.ok) setUser(null);
}, 5 * 60 * 1000);
```

## Where to Add More Logout Buttons

If you want logout buttons in other pages:

### 1. Performer Dashboard

```tsx
// File: app/performer/dashboard/page.tsx
// Add to header where user info is displayed
```

### 2. Collaboration Hub

```tsx
// File: app/collab/hub/page.tsx
// Add next to user name in top-right
```

### 3. Canvas Page

```tsx
// File: app/collab/canvas/[sessionId]/page.tsx
// Add to header next to "Back to Hub" button
```

## API Endpoints Summary

| Endpoint                    | Method | Purpose                                       | Auth Required |
| --------------------------- | ------ | --------------------------------------------- | ------------- |
| `/api/auth/login`           | POST   | Login user, clear old cookie, set new cookie  | No            |
| `/api/auth/google/callback` | GET    | OAuth login, clear old cookie, set new cookie | No            |
| `/api/auth/logout`          | POST   | Clear authentication cookie                   | No\*          |
| `/api/auth/me`              | GET    | Get current user info                         | Yes           |

\*Technically doesn't require auth, but only useful if user has a cookie to clear.

## Files Modified

### Backend

- ✅ `backend/src/controllers/authController.ts` - Added clearCookie + logout function
- ✅ `backend/src/routes/authRoutes.ts` - Added logout route

### Frontend

- ✅ `sync-sparkss/app/dashboard/[role]/page.tsx` - Added logout button & handler

## Future Enhancements

1. **Logout Confirmation Dialog**

   ```tsx
   <AlertDialog>
     <AlertDialogTrigger>Logout</AlertDialogTrigger>
     <AlertDialogContent>
       <AlertDialogTitle>Are you sure?</AlertDialogTitle>
       <AlertDialogDescription>
         You will be logged out and redirected to the login page.
       </AlertDialogDescription>
       <AlertDialogAction onClick={handleLogout}>Yes, logout</AlertDialogAction>
       <AlertDialogCancel>Cancel</AlertDialogCancel>
     </AlertDialogContent>
   </AlertDialog>
   ```

2. **Logout from All Devices**

   - Store session tokens in database
   - Invalidate all tokens on "Logout All" action

3. **Auto-logout on Inactivity**

   ```typescript
   useEffect(() => {
     let timeout = setTimeout(() => {
       handleLogout();
     }, 30 * 60 * 1000); // 30 minutes

     const resetTimer = () => {
       clearTimeout(timeout);
       timeout = setTimeout(handleLogout, 30 * 60 * 1000);
     };

     window.addEventListener("mousemove", resetTimer);
     return () => window.removeEventListener("mousemove", resetTimer);
   }, []);
   ```

4. **Cross-tab Logout Sync**
   - Use localStorage to broadcast logout events
   - All tabs logout simultaneously

---

**Status:** ✅ Fully Implemented and Tested
**Date:** October 9, 2025
