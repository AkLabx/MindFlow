import re

with open('src/features/dashboard/pages/subject/SubjectTopicsPage.tsx', 'r') as f:
    content = f.read()

# Add useQuestionMetadata import
import_search = "import { quizCreationService } from '@/features/quiz/services/quizCreationService';"
import_replace = """import { quizCreationService } from '@/features/quiz/services/quizCreationService';
import { useQuestionMetadata } from '@/features/quiz/hooks/useQuestionMetadata';"""

if import_search in content:
    content = content.replace(import_search, import_replace)


hook_injection_search = """  const [isCreatingQuiz, setIsCreatingQuiz] = React.useState(false);

  const setHideGlobalHeader = useLayoutStore((state) => state.setHideGlobalHeader);"""

hook_injection_replace = """  const [isCreatingQuiz, setIsCreatingQuiz] = React.useState(false);
  const { metadata: cachedMetadata, isLoading: isMetadataLoading } = useQuestionMetadata();

  const setHideGlobalHeader = useLayoutStore((state) => state.setHideGlobalHeader);"""

if hook_injection_search in content:
    content = content.replace(hook_injection_search, hook_injection_replace)

# Replace handleCreateQuiz metadata checking logic
fetch_logic_search = """    try {
      setIsCreatingQuiz(true);

      const cachedMetadata = await db.getQuizMetadataCache();
      if (!cachedMetadata || cachedMetadata.length === 0) {
         useNotificationStore.getState().showToast({ variant: "error", message: "Quiz metadata not found. Please sync." });
         setIsCreatingQuiz(false);
         return;
      }"""

fetch_logic_replace = """    try {
      setIsCreatingQuiz(true);

      if (!cachedMetadata || cachedMetadata.length === 0) {
         useNotificationStore.getState().showToast({ variant: "error", message: isMetadataLoading ? "Please wait, syncing quiz data..." : "Quiz data is empty. Please check your connection and try again." });
         setIsCreatingQuiz(false);
         return;
      }"""

if fetch_logic_search in content:
    content = content.replace(fetch_logic_search, fetch_logic_replace)


with open('src/features/dashboard/pages/subject/SubjectTopicsPage.tsx', 'w') as f:
    f.write(content)
