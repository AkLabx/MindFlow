# Cross-Platform App Guide: GitHub Pages Web App to Android Native App (Capacitor)

This guide explains the architecture and steps required to build a single codebase that serves both as a Web Application (hosted on GitHub Pages) and a Native Android App (published on the Google Play Store).

We use **React/Vite** for the frontend, **GitHub Pages** for web hosting, and **Capacitor** by Ionic to wrap the web app into a native Android container.

---

## 1. Architecture Overview

### How it Works
1. **The Web App:** You build a standard Single Page Application (SPA) using React and Vite. When built (`npm run build`), it generates static HTML, CSS, and JS files.
2. **Web Deployment (GitHub Pages):** These static files are pushed to a `gh-pages` branch. GitHub serves them as a standard website accessible via a browser.
3. **Native Wrapper (Capacitor):** Capacitor takes those exact same built web assets (from the `dist` folder) and injects them into a native Android WebView. It also provides a bridge, allowing your JavaScript to call native device APIs (like Haptics, Camera, or File System) when running on a phone.

---

## 2. Setting Up the Web Project for GitHub Pages

When building for GitHub Pages, there are two major architectural requirements: **Routing** and **Base Paths**.

### 1. Routing: Use `HashRouter` instead of `BrowserRouter`
GitHub Pages does not support single-page application routing natively. If a user navigates directly to `yoursite.com/dashboard`, GitHub's server will look for a physical `dashboard.html` file, fail to find it, and return a 404 error.

**Solution:** Use Hash Routing.
The URL will look like `yoursite.com/#/dashboard`. The browser never sends the part after the `#` to the server, so GitHub Pages always serves `index.html`. Your React router then takes over and renders the correct component.

```tsx
// App.tsx
import { HashRouter as Router, Routes, Route } from 'react-router-dom';

function App() {
  return (
    <Router>
      <Routes>
        <Route path="/" element={<Home />} />
        <Route path="/dashboard" element={<Dashboard />} />
      </Routes>
    </Router>
  );
}
```

### 2. Vite Base Path Configuration
If your GitHub Pages repository is named `my-app` (resulting in the URL `username.github.io/my-app`), you must configure Vite to serve assets from `/my-app/` instead of the root `/`.

```typescript
// vite.config.ts
import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

export default defineConfig(({ mode }) => {
  const isProduction = mode === 'production';

  return {
    plugins: [react()],
    // If deploying to username.github.io/RepoName, base must be '/RepoName/'
    base: isProduction ? '/RepoName/' : '/',
  };
});
```

---

## 3. Integrating Capacitor for Android

Capacitor bridges your web app to the native platform.

### Step 1: Install Capacitor
Run these commands in the root of your web project:

```bash
npm install @capacitor/core
npm install -D @capacitor/cli
```

### Step 2: Initialize Capacitor
```bash
npx cap init
```
This creates a `capacitor.config.ts` file. Configure it to point to your Vite build directory (`dist`):

```typescript
// capacitor.config.ts
import { CapacitorConfig } from '@capacitor/cli';

const config: CapacitorConfig = {
  appId: 'com.yourcompany.yourapp', // Important: Must match your Play Store package name
  appName: 'Your App Name',
  webDir: 'dist',
  bundledWebRuntime: false
};

export default config;
```

### Step 3: Add the Android Platform
```bash
npm install @capacitor/android
npx cap add android
```
This command creates a physical `android` folder in your project root containing a complete Android Studio project.

### Step 4: Sync Your Web Code to Android
Every time you update your React code and want to test it on Android:
1. Build the web app: `npm run build`
2. Copy the new build to the Android folder: `npx cap sync android`

---

## 4. Developing for Both Platforms

When you run your app, it needs to know whether it's running in a normal web browser or inside the Capacitor Android wrapper.

### Detecting the Platform
Capacitor provides an API to check the current platform. This is crucial if you want to use native features (like device vibration) on Android, but fall back to web standards on GitHub Pages.

```typescript
import { Capacitor } from '@capacitor/core';
import { Haptics, ImpactStyle } from '@capacitor/haptics';

export const triggerVibration = async () => {
  if (Capacitor.isNativePlatform()) {
    // Running on Android/iOS app
    await Haptics.impact({ style: ImpactStyle.Medium });
  } else {
    // Running on the Web (GitHub Pages)
    if (navigator.vibrate) {
      navigator.vibrate(50);
    }
  }
};
```

### Managing App Versions
You now have **two** versions to manage:
1. **Web Version:** Managed in your `package.json` and optionally exposed via Vite environment variables.
2. **Native Version:** Managed in `android/app/build.gradle`.
   - `versionCode`: An integer that must increase by at least 1 every time you upload to the Play Store.
   - `versionName`: The user-facing string (e.g., "1.0.5").

---

## 5. Cross-Platform Gotchas & Best Practices

### 1. CORS (Cross-Origin Resource Sharing)
- **Web (GitHub Pages):** Your app runs on `https://username.github.io`. Your backend APIs (e.g., Supabase) must allow this origin.
- **Android (Capacitor):** By default, the WebView serves your app from `http://localhost`. Your backend MUST also allow `http://localhost` as a permitted origin for CORS, or API calls will fail on Android.

### 2. Updates & Live Reloads
- **Web App:** To update the web app, simply commit your code and push to the `gh-pages` branch. The Live Update Notification System (Service Worker) will handle the rest.
- **Android App:** Pushing to GitHub does **not** update the Android app! The web assets are bundled inside the `.apk` or `.aab` file at build time. To update the Android app, you must rebuild the app in Android Studio, increment the `versionCode`, and submit a new release to the Google Play Store.

### 3. External Links (OAuth, Payments)
When a user clicks a link in the web app, it opens in a new tab. In Capacitor, it might take over the WebView, trapping the user. Use the `@capacitor/browser` plugin to open external links safely.

```typescript
import { Browser } from '@capacitor/browser';

const openLink = async (url: string) => {
  if (Capacitor.isNativePlatform()) {
    await Browser.open({ url });
  } else {
    window.open(url, '_blank');
  }
};
```

### 4. Back Button Handling on Android
Android phones have a hardware back button. By default, Capacitor might just close the app when this is pressed. You must handle it to navigate your React router backward.

```typescript
import { App as CapacitorApp } from '@capacitor/app';
import { useNavigate } from 'react-router-dom';
import { useEffect } from 'react';

export const useHardwareBackButton = () => {
  const navigate = useNavigate();

  useEffect(() => {
    const handleBackButton = CapacitorApp.addListener('backButton', ({ canGoBack }) => {
      if (canGoBack) {
        navigate(-1);
      } else {
        CapacitorApp.exitApp();
      }
    });

    return () => { handleBackButton.remove(); };
  }, [navigate]);
};
```

---

## 6. Building and Publishing to the Play Store

When you are ready to publish:

1. **Build the Web App:** `npm run build`
2. **Sync to Capacitor:** `npx cap sync android`
3. **Open Android Studio:** `npx cap open android`
4. **Generate Signed Bundle:**
   - In Android Studio, go to `Build` > `Generate Signed Bundle / APK`.
   - Select `Android App Bundle`.
   - Create or select an existing Keystore file. (KEEP THIS SAFE. If you lose it, you can never update your app on the Play Store again).
   - Click `Finish`.
5. **Upload:** Take the resulting `.aab` file (usually located in `android/app/release/`) and upload it to the Google Play Console.
