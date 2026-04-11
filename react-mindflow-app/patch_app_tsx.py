with open('src/App.tsx', 'r') as f:
    content = f.read()

import_statement = "import { useRegisterSW } from 'virtual:pwa-register/react';\n"
if "virtual:pwa-register" not in content:
    content = import_statement + content

app_component = """
const App: React.FC = () => {
"""

app_component_replacement = """
const App: React.FC = () => {
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
  });
"""

content = content.replace(app_component, app_component_replacement)

with open('src/App.tsx', 'w') as f:
    f.write(content)
