# Live Update Notification System (PWA)

## 1. Feature Overview

Modern web applications, especially Progressive Web Apps (PWAs), rely on Service Workers to cache assets and provide offline functionality. While caching improves performance and reliability, it introduces a critical challenge: **How do users get the latest version of the application when a new deployment occurs?**

The **Live Update Notification System** solves this by:
- Automatically detecting when a new version of the application is deployed to the server.
- Downloading the new assets in the background without interrupting the user.
- Prompting the user to apply the update seamlessly without requiring a hard manual refresh.

### Why is this needed?
By default, if a Service Worker is controlling a page, the browser serves assets from the cache. Even if you deploy a new version to the server, the browser will continue to serve the old cached version until all tabs running the app are closed, and the old Service Worker is terminated. This feature explicitly bypasses this default behavior, offering users a "Update Now" prompt that activates the new Service Worker immediately.

---

## 2. Architecture

The architecture relies heavily on standard Web APIs, specifically the **Service Worker API** and the **Cache API**.

### The Role of the Service Worker
The Service Worker acts as a network proxy. It intercepts all network requests made by the app.
- **Install Phase:** When first registered, it fetches and caches the static assets (HTML, CSS, JS, images).
- **Activate Phase:** It takes control of the page and cleans up old caches.
- **Fetch Phase:** It serves requests from the cache or network based on the defined strategy.

### Cache Versioning Strategy
Every time the application is built (e.g., via Vite/Webpack), the bundler generates unique hashes for the asset filenames (e.g., `main.[hash].js`). The Service Worker file itself (`sw.js`) is updated to reference these new filenames.

### How New Deployments Trigger the Update Flow
The browser periodically checks the server for a byte-for-byte difference in the `sw.js` file. If the file has changed (because the cached assets list changed during a new deployment), the browser determines an update is available.

---

## 3. The Complete Update Lifecycle

The update process involves several states defined by the Service Worker lifecycle:

1. **Detection:** The browser checks for a new `sw.js` file (either automatically on navigation or triggered programmatically via polling/visibility changes).
2. **Installation:** If a byte-for-byte difference is found, the new Service Worker is downloaded and installed in the background. It fetches the new assets into a new cache version.
3. **Waiting State:** The new Service Worker enters the `installed` state but **waits**. It cannot activate because the old Service Worker is still controlling the currently open pages.
4. **Notification:** The application code (frontend) detects that a new Service Worker is in the `waiting` state and triggers the UI prompt: *"A new version of the app is available. Update now?"*.
5. **Activation Command (`skipWaiting`):** When the user clicks "Update Now", the frontend sends a `postMessage` to the waiting Service Worker telling it to execute `skipWaiting()`.
6. **Activation (`clients.claim`):** The new Service Worker immediately activates and takes control of all clients (`clients.claim()`).
7. **Reload:** The frontend listens for the `controllerchange` event. When it fires, it calls `window.location.reload()` to refresh the page, loading the new assets from the new cache.

---

## 4. Flow and Sequence Diagrams

### High-Level Flow Diagram

```text
[ Server: New Deployment ]
           |
           v
[ Browser checks sw.js ] --(If Changed)--> [ Installs New SW in Background ]
                                                     |
                                                     v
                                       [ New SW enters 'Waiting' state ]
                                                     |
                                                     v
                                  [ App detects 'updatefound' / waiting SW ]
                                                     |
                                                     v
                                    [ UI Displays "Update Available" ]
                                                     |
                                              (User clicks Update)
                                                     |
                                                     v
                               [ App sends message {type: 'SKIP_WAITING'} ]
                                                     |
                                                     v
                            [ New SW calls skipWaiting() & clients.claim() ]
                                                     |
                                                     v
                                [ App detects 'controllerchange' event ]
                                                     |
                                                     v
                                        [ window.location.reload() ]
                                                     |
                                                     v
                                        [ User sees latest version ]
```

### Sequence Diagram

```text
App (Client)                Service Worker (Old)       Service Worker (New)            Server
     |                              |                          |                          |
     |--- (Poll / Visibility) ----> |                          |                          |
     |                              |--- Fetch sw.js -----------------------------------> |
     |                              |                          | <--- Returns new sw.js --|
     |                              |                          |                          |
     |                              |                  (Installs new SW)                  |
     |                              |                  (Fetches new assets)               |
     |                              |                          |                          |
     | <--- Event: updatefound -----|                          |                          |
     |                              |                  (Enters 'waiting' state)           |
     | <--- Event: waiting SW ------|                          |                          |
     |                              |                          |                          |
   (Show UI Prompt)                 |                          |                          |
     |                              |                          |                          |
   (User Clicks Update)             |                          |                          |
     |                              |                          |                          |
     |--- postMessage('SKIP_WAITING')------------------------> |                          |
     |                              |                          |                          |
     |                              |                  (Calls skipWaiting())              |
     |                              |                  (Calls clients.claim())            |
     |                              |                          |                          |
     | <--- Event: controllerchange ---------------------------|                          |
     |                              |                          |                          |
   (window.location.reload())       |                          |                          |
```

---

## 5. Implementation Guide (Framework-Agnostic Pseudo Code)

To implement this from scratch in any web app, you need two parts: the Service Worker file, and the Application Logic (Frontend).

### Part 1: Service Worker (`sw.js`)

```javascript
// Listen for messages from the client
self.addEventListener('message', (event) => {
  // When the client tells us to skip waiting, activate immediately
  if (event.data && event.data.type === 'SKIP_WAITING') {
    self.skipWaiting();
  }
});

self.addEventListener('activate', (event) => {
  // Take control of all clients immediately
  event.waitUntil(clients.claim());

  // Cleanup old caches here...
});
```

### Part 2: Application Logic (Frontend `index.js`)

```javascript
let newWorker;

if ('serviceWorker' in navigator) {
  navigator.serviceWorker.register('/sw.js').then(reg => {

    // 1. Check if a SW is already waiting (happens if user closed the prompt previously)
    if (reg.waiting) {
      newWorker = reg.waiting;
      showUpdatePrompt();
    }

    // 2. Listen for new SW installations
    reg.addEventListener('updatefound', () => {
      newWorker = reg.installing;

      newWorker.addEventListener('statechange', () => {
        // When the new SW is installed and waiting to activate
        if (newWorker.state === 'installed' && navigator.serviceWorker.controller) {
          showUpdatePrompt();
        }
      });
    });

    // 3. Optional: Polling strategy to check for updates
    setInterval(() => {
      reg.update();
    }, 60 * 60 * 1000); // Check every 1 hour

    // 4. Optional: Check on visibility change (user comes back to tab)
    document.addEventListener('visibilitychange', () => {
      if (document.visibilityState === 'visible') {
        reg.update();
      }
    });

  });

  // 5. Listen for the controlling SW to change
  let refreshing;
  navigator.serviceWorker.addEventListener('controllerchange', () => {
    if (refreshing) return;
    refreshing = true;
    window.location.reload();
  });
}

// UI Logic
function showUpdatePrompt() {
  // Display your UI notification
  const updateButton = document.getElementById('update-button');
  updateButton.style.display = 'block';

  updateButton.addEventListener('click', () => {
    // Send message to the waiting SW to activate
    if (newWorker) {
      newWorker.postMessage({ type: 'SKIP_WAITING' });
    }
  });
}
```

---

## 6. Our Current Implementation (Vite + React + vite-plugin-pwa)

Our project uses `vite-plugin-pwa` which abstracts much of the boilerplate API management.

### Configuration (`vite.config.ts`)
We configure `vite-plugin-pwa` to use the `'prompt'` strategy. This tells the plugin *not* to auto-update (which would break the app unexpectedly) but to allow the application to handle the update lifecycle manually.

```typescript
// vite.config.ts
VitePWA({
  registerType: 'prompt', // Critical for manual update flow
  // ... other configs (manifest, icons, caching rules)
})
```

### Application Logic (`src/components/common/PWAUpdateManager.tsx`)
We use the `useRegisterSW` hook provided by `virtual:pwa-register/react`.

```tsx
import React from 'react';
import { useRegisterSW } from 'virtual:pwa-register/react';
import { useNotification } from '../../stores/useNotificationStore';

export const PWAUpdateManager: React.FC = () => {
  const { showPopup } = useNotification();
  const intervalMS = 60 * 60 * 1000; // 1 hour

  const {
    needRefresh: [needRefresh],
    updateServiceWorker,
  } = useRegisterSW({
    onRegisteredSW(swUrl, r) {
      if (!r) return;

      // 1. Polling: Check for updates every hour.
      // This helps bypass aggressive caching from CDNs/GitHub Pages
      setInterval(() => {
        if (!(!r.installing && navigator)) return;
        if (('connection' in navigator) && !navigator.onLine) return; // Don't poll if offline
        r.update();
      }, intervalMS);

      // 2. Visibility Check: Force a check when the user switches back to the tab
      document.addEventListener('visibilitychange', () => {
         if (document.visibilityState === 'visible') {
             r.update();
         }
      });
    },

    // 3. Update Found: Triggered when a new SW is waiting
    onNeedRefresh() {
       showPopup({
           title: "Update Available",
           message: "A new version of the app is ready. Would you like to update now?",
           actions: [
             {
               label: "Update Now",
               onClick: () => {
                 // Sends the SKIP_WAITING message and handles the reload
                 updateServiceWorker(true);
               }
             },
             {
               label: "Later",
               onClick: () => { /* User dismisses, SW remains waiting */ }
             }
           ]
       });
    }
  });

  return null; // Silent background component
};
```

---

## 7. Best Practices & Common Pitfalls

### Best Practices
1. **Never forcefully reload the page:** Auto-updating without prompting can cause users to lose unsaved form data or disrupt their current task. Always use a prompt.
2. **Handle Offline Users:** Do not attempt to poll (`reg.update()`) if `navigator.onLine` is false.
3. **Throttle Polling:** Checking for updates every 1-minute wastes bandwidth and battery. 1 to 24 hours is standard, combined with visibility checks.
4. **Use `controllerchange` carefully:** Ensure you use a flag (like `refreshing` in the pseudo-code) to prevent infinite reload loops if multiple events fire.

### Common Pitfalls
- **Infinite Reload Loops:** If the new Service Worker activates but immediately encounters a fatal error, the page reloads, the SW tries to activate again, fails, and reloads again. Ensure the SW script is robust.
- **Cache Header Issues on `sw.js`:** The server **must not cache** the `sw.js` file. If the browser receives a cached `sw.js` from a CDN, it will never know an update occurred. Configure your server/CDN to serve `sw.js` with `Cache-Control: max-age=0, no-cache, no-store, must-revalidate`.
- **Multiple Tabs:** The `skipWaiting` command forces the new SW to take over *all* open tabs. If Tab A triggers the update, Tab B will also experience a `controllerchange` and reload. This is expected behavior but should be noted.
- **Zero Data Loss:** Before triggering `updateServiceWorker()`, ensure critical local state (like unsaved text in a textarea) is persisted to `localStorage` or `IndexedDB`, as the page will be hard-reloaded.

---

## 8. Testing Checklist

Testing this flow locally can be tricky because Vite's dev server does not use Service Workers in the same way as production.

1. **Build the app locally:** `npm run build`
2. **Serve the built files:** Use a local server like `npx serve -s dist` or `npm run preview`.
3. **Open the app in your browser.**
4. **Simulate a new deployment:**
   - Leave the browser open.
   - Make a visible change to your code.
   - Run `npm run build` again.
5. **Trigger the check:** Switch tabs away and back (to trigger `visibilitychange`), or wait for the polling interval.
6. **Verify:** The "Update Available" prompt should appear. Clicking it should refresh the page and show your new changes.

## 9. Troubleshooting

**Issue:** I deployed a new version, but the update prompt never shows up.
**Solutions:**
- Open DevTools -> Application -> Service Workers. Click "Update" to manually fetch the `sw.js`. If the prompt appears, your polling/visibility logic isn't firing.
- Check the Network tab for `sw.js`. Look at the Response Headers. If `Cache-Control` is missing or caching is enabled, your CDN/host is caching the file.
- Ensure `vite-plugin-pwa` is configured with `registerType: 'prompt'`. If set to `'autoUpdate'`, the prompt will never fire; it will just update automatically.
