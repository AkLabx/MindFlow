# Capacitor Mobile Integration Audit

## 1. App Reawakening / Lifecycle Hooks
**File:** `useAppVisibilityReawakening.ts`
**Analysis:** The app correctly binds to `CapacitorApp.addListener('appStateChange')` to detect foregrounding. It dispatches a custom window event (`auth:refresh`) and tells React Query to resume paused mutations (`onlineManager.setOnline(true)`).
**Risk:** This is incredibly brittle. If the OS kills the WebView to save memory while in the background (a standard Android behavior), this listener never fires; the app cold-starts instead. Critical offline mutations stored purely in React Query's memory cache will be permanently lost unless the `@tanstack/react-query-persist-client` IndexedDB persister is implemented.

## 2. Hardware Back Button Routing
**File:** `useHardwareBackButton.ts`
**Analysis:** Memory references indicate a centralized, deterministic hierarchical map instead of `navigate(-1)`. This is a highly robust enterprise pattern that prevents users from getting stuck in modals or exiting the app by accident.
**Risk:** If complex new features (like AI Tutor modals) are not explicitly registered in this hierarchy, the hardware back button will default to exiting the app or breaking the router history.

## 3. Immersive Fullscreen (Android)
**File:** `fix-android-immersive.patch` (Found in docs)
**Analysis:** The app relies on a custom patch and `styles.xml` configuration (`windowDrawsSystemBarBackgrounds`) rather than `hideSystemUI()` to render edge-to-edge.
**Risk:** When deploying Capacitor to newer Android APIs (API 34+), edge-to-edge is enforced by default, which may conflict with this patch and cause overlapping navigation bars.

## 4. Cloudinary Uploads on Mobile
**Analysis:** Video uploads from the camera bypass Supabase and go directly to Cloudinary via `XMLHttpRequest`.
**Risk:** Capacitor often strips or alters standard web headers, and deep-sleeping the app during a large video upload will sever the connection instantly. Mobile uploads require a dedicated background transfer plugin (`@capacitor/background-runner`) for reliability.
