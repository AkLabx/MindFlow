const fs = require('fs');
let code = fs.readFileSync('src/lib/navigation/NavigationManager.tsx', 'utf8');

// The replacement logic.
// We're replacing:
/*
      // --- 3. Guest Only Policy (Login/Register) ---
      else if (type === RouteAccessType.GUEST_ONLY) {
        if (user) {
          // If auth user hits login, see if they have an intent. If so, fulfill it.
          const intent = IntentPolicy.popIntent();
          if (intent) {
            targetRedirect = intent;
            reason = 'Restoring intent for Authenticated user hitting Guest Route';
            NavigationAnalytics.track('Deep Link Restored', { destination: intent });
          } else {
            targetRedirect = '/dashboard';
            reason = 'Authenticated user hitting Guest Route';
          }
        }
      }

      // --- 4. Public Policy ---
      else if (type === RouteAccessType.PUBLIC) {
        if (user) {
          targetRedirect = '/dashboard';
          reason = 'Authenticated user hitting Public Route';
        }
      }
*/

const searchString1 = `      // --- 3. Guest Only Policy (Login/Register) ---
      else if (type === RouteAccessType.GUEST_ONLY) {
        if (user) {
          // If auth user hits login, see if they have an intent. If so, fulfill it.
          const intent = IntentPolicy.popIntent();
          if (intent) {
            targetRedirect = intent;
            reason = 'Restoring intent for Authenticated user hitting Guest Route';
            NavigationAnalytics.track('Deep Link Restored', { destination: intent });
          } else {
            targetRedirect = '/dashboard';
            reason = 'Authenticated user hitting Guest Route';
          }
        }
      }

      // --- 4. Public Policy ---
      else if (type === RouteAccessType.PUBLIC) {
        if (user) {
          targetRedirect = '/dashboard';
          reason = 'Authenticated user hitting Public Route';
        }
      }`;

const replaceString1 = `      // --- 3. Guest Only Policy (Login/Register) ---
      else if (type === RouteAccessType.GUEST_ONLY) {
        if (user) {
          if (OnboardingPolicy.shouldRedirectToOnboarding(user)) {
             targetRedirect = '/onboarding';
             reason = 'New authenticated user routed directly to Onboarding';
          } else {
            // If auth user hits login, see if they have an intent. If so, fulfill it.
            const intent = IntentPolicy.popIntent();
            if (intent) {
              targetRedirect = intent;
              reason = 'Restoring intent for Authenticated user hitting Guest Route';
              NavigationAnalytics.track('Deep Link Restored', { destination: intent });
            } else {
              targetRedirect = '/dashboard';
              reason = 'Authenticated user hitting Guest Route';
            }
          }
        }
      }

      // --- 4. Public Policy ---
      else if (type === RouteAccessType.PUBLIC) {
        if (user) {
          if (OnboardingPolicy.shouldRedirectToOnboarding(user)) {
             targetRedirect = '/onboarding';
             reason = 'New authenticated user routed directly to Onboarding';
          } else {
             targetRedirect = '/dashboard';
             reason = 'Authenticated user hitting Public Route';
          }
        }
      }`;

code = code.replace(searchString1, replaceString1);
fs.writeFileSync('src/lib/navigation/NavigationManager.tsx', code);
