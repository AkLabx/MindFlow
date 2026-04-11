import re

with open('src/App.tsx', 'r') as f:
    content = f.read()

# 1. Remove the old useRegisterSW import and implementation
content = re.sub(r"import \{ useRegisterSW \} from 'virtual:pwa-register/react';\n", "", content)

old_app_component = """const App: React.FC = () => {
  // PWA Auto Update Logic
  const {
    needRefresh: [needRefresh, setNeedRefresh],
    updateServiceWorker,
  } = useRegisterSW({
    onNeedRefresh() {
      // Background logic to handle auto update safely
      const checkAndReload = async () => {
        try {
          const quizStateStr = localStorage.getItem('mindflow-quiz-session');
          if (quizStateStr) {
             const quizState = JSON.parse(quizStateStr);
             if (quizState.status === 'quiz') {
               // We are in middle of quiz, let's pause and save it first
               const { db } = await import('./lib/db');
               const { supabase } = await import('./lib/supabase');
               const { data } = await supabase.auth.getSession();
               if (data.session) {
                 const currentTimer = quizState.quizTimeRemaining;
                 const pausedState = { ...quizState, isPaused: true };
                 localStorage.setItem('mindflow-quiz-session', JSON.stringify(pausedState));
                 await db.saveActiveSession(data.session.user.id, pausedState);
               }
             }
          }
        } catch (e) {
          console.error('Failed to parse or save quiz state before update:', e);
        } finally {
          // Perform the actual update and reload
          updateServiceWorker(true);
        }
      };

      checkAndReload();
    },
  });"""

new_app_component = """import { PWAUpdateManager } from './components/common/PWAUpdateManager';

const App: React.FC = () => {"""

content = content.replace(old_app_component, new_app_component)

# 2. Add the restore logic inside the initAuth useEffect
old_init_auth = """    const initAuth = async () => {
      // getSession() parses the URL hash for tokens if present (OAuth redirect)
      await supabase.auth.getSession();

      // Set ready state to render the router
      setIsReady(true);
    };"""

new_init_auth = """    const initAuth = async () => {
      // getSession() parses the URL hash for tokens if present (OAuth redirect)
      await supabase.auth.getSession();

      // Check for Smart Restore after an Auto-Update
      if (localStorage.getItem('mindflow_auto_updated') === 'true') {
         localStorage.removeItem('mindflow_auto_updated');
         // We inject a small delay to ensure providers and stores are mounted
         setTimeout(() => {
             import('./stores/useNotificationStore').then(({ useNotificationStore }) => {
                 useNotificationStore.getState().showToast({
                     title: "App Updated",
                     message: "Successfully updated! Resuming your quiz... 😎",
                     variant: "success"
                 });
             });
         }, 1000);
      }

      // Set ready state to render the router
      setIsReady(true);
    };"""

content = content.replace(old_init_auth, new_init_auth)

# 3. Add the PWAUpdateManager to the render tree
old_return = """    <HashRouter>
      <AppProvider>
        <AppRoutes />
      </AppProvider>
    </HashRouter>"""

new_return = """    <HashRouter>
      <AppProvider>
        <PWAUpdateManager />
        <AppRoutes />
      </AppProvider>
    </HashRouter>"""

content = content.replace(old_return, new_return)

with open('src/App.tsx', 'w') as f:
    f.write(content)
