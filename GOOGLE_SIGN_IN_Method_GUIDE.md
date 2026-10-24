# Native-Like Google Sign-In Implementation Guide for Diary Android App

This guide outlines the steps required to implement a native-feeling Google Sign-In experience in the Diary Android App, replicating the successful implementation found in the MindFlow app.

## 1. Root Cause Analysis

### Why does the Diary app open an external browser?
Currently, the Diary app is likely using the standard web-based OAuth flow provided by Supabase (e.g., `supabase.auth.signInWithOAuth({ provider: 'google' })`).
In a web browser, this works seamlessly. However, when wrapped in a Capacitor Android app, standard OAuth redirects the user to the system's default browser (or Custom Tabs) to handle the authentication. After a successful login, redirecting back into the Capacitor app (via deep linking) is often inconsistent, leading to users getting stuck in the browser instead of returning to the app.

## 2. The Solution: Native Google Auth Plugin

To resolve this, we need to bypass the web-based OAuth flow and instead utilize the native Google Sign-In SDK on Android.

We will use the `@codetrix-studio/capacitor-google-auth` plugin, which opens a native Google account picker dialog. Once the user selects their account natively, Google provides an **ID Token**. We then pass this ID token directly to Supabase using `supabase.auth.signInWithIdToken()`. This establishes the Supabase session entirely within the app, with no external browser required.

---

## 3. Step-by-Step Implementation

### Step 1: Install Dependencies

In your Diary app's root directory, install the required Capacitor plugin. We recommend the `rc` version if you are using Capacitor 6, or match the version compatible with your setup.

```bash
npm install @codetrix-studio/capacitor-google-auth
npx cap sync android
```

### Step 2: Configure `capacitor.config.ts`

You need to provide your Google Cloud Console **Web Client ID** (not the Android Client ID). This acts as the `serverClientId`.

Update your `capacitor.config.ts` to include the `GoogleAuth` plugin configuration:

```typescript
import type { CapacitorConfig } from '@capacitor/cli';

const config: CapacitorConfig = {
  appId: 'com.yourdomain.diary', // Replace with your Diary app ID
  appName: 'Diary',
  webDir: 'dist',
  plugins: {
    GoogleAuth: {
      scopes: ["profile", "email"],
      // Replace with the Web Client ID from your Google Cloud Console
      serverClientId: "YOUR_GOOGLE_WEB_CLIENT_ID.apps.googleusercontent.com",
      forceCodeForRefreshToken: true
    },
    // ... your other plugins
  },
};

export default config;
```

### Step 3: Update Android Configuration (`strings.xml`)

The native plugin requires the `server_client_id` to be present in your Android resources.

Open `android/app/src/main/res/values/strings.xml` and add the `server_client_id` string:

```xml
<?xml version='1.0' encoding='utf-8'?>
<resources>
    <!-- Your existing strings -->
    <string name="app_name">Diary</string>
    <string name="title_activity_main">Diary</string>
    <string name="package_name">com.yourdomain.diary</string>
    <string name="custom_url_scheme">com.yourdomain.diary</string>

    <!-- Add this line: Replace with your actual Web Client ID -->
    <string name="server_client_id">YOUR_GOOGLE_WEB_CLIENT_ID.apps.googleusercontent.com</string>
</resources>
```

### Step 4: Update Authentication Code (React/TypeScript)

Replace your existing `signInWithOAuth` call with the native plugin flow.

1. **Import the plugin and Capacitor core:**
```typescript
import { GoogleAuth } from '@codetrix-studio/capacitor-google-auth';
import { Capacitor } from '@capacitor/core';
import { supabase } from '../lib/supabase'; // Adjust path to your Supabase client
```

2. **Implement the sign-in function:**
Update your Google Sign-In button's `onClick` handler to use this logic:

```typescript
const handleGoogleSignIn = async () => {
  try {
    // 1. Check if we are running natively on Android/iOS via Capacitor
    if (Capacitor.isNativePlatform()) {

      // 2. Initialize the plugin (required on some platforms)
      await GoogleAuth.initialize();

      // 3. Trigger the native Google Account Picker
      const googleUser = await GoogleAuth.signIn();

      // 4. Verify we received the ID token
      if (googleUser && googleUser.authentication && googleUser.authentication.idToken) {

        // 5. Authenticate with Supabase using the ID Token
        const { data, error } = await supabase.auth.signInWithIdToken({
          provider: 'google',
          token: googleUser.authentication.idToken,
        });

        if (error) throw error;

        console.log('Successfully logged in natively!', data);
        // Navigate the user to the main app dashboard if not handled automatically

      } else {
        throw new Error("Failed to retrieve ID token from Google.");
      }
    } else {
      // Fallback for Web/Browser environment
      const { error } = await supabase.auth.signInWithOAuth({
        provider: 'google',
        options: {
          redirectTo: window.location.origin, // or your specific web redirect URL
        }
      });
      if (error) throw error;
    }
  } catch (error: any) {
    console.error("Google Sign-In Error:", error);
    // Display error to the user (e.g., using a toast or state variable)
  }
};
```

## 4. Important Considerations & Testing

1. **Web Client ID vs Android Client ID**: Ensure the `serverClientId` in `capacitor.config.ts` and `strings.xml` is the **Web Client ID** from Google Cloud Platform, NOT the Android Client ID. Supabase requires the Web Client ID for ID Token verification.
2. **Google Cloud Console Setup**: Ensure your Android app's package name and SHA-1 signing certificate fingerprint are added to your Google Cloud Console credentials under an "Android Client ID" (even though you use the Web Client ID in the code). This allows the Google Play Services on the device to verify the app.
3. **Testing**:
   - Test the flow on a real Android device or emulator with Google Play Services installed.
   - Verify that the native bottom-sheet account picker appears.
   - After selecting an account, verify that the Supabase session is created and persists after closing and reopening the app.
   - Test the failure scenario (e.g., dismissing the account picker) to ensure the app handles the error gracefully without crashing.
