import re

with open('src/features/dashboard/pages/subject/SubjectTopicsPage.tsx', 'r') as f:
    content = f.read()

# Add import for quizCreationService
if "quizCreationService" not in content:
    content = content.replace(
        "import { initialState } from '@/features/quiz/stores/useQuizSessionStore';",
        "import { initialState } from '@/features/quiz/stores/useQuizSessionStore';\nimport { quizCreationService } from '@/features/quiz/services/quizCreationService';"
    )

new_func = """  const handleCreateQuiz = async (mode: 'learning' | 'mock', startImmediately: boolean) => {
    if (!selectedSubTopic) return;

    try {
      setIsCreatingQuiz(true);

      const cachedMetadata = await db.getQuizMetadataCache();
      if (!cachedMetadata || cachedMetadata.length === 0) {
         useNotificationStore.getState().showToast({ variant: "error", message: "Quiz metadata not found. Please sync." });
         setIsCreatingQuiz(false);
         return;
      }

      const filteredQuestions = cachedMetadata.filter(q =>
        (q.subject ?? q.classification?.subject) === decodedSubject &&
        (q.topic ?? q.classification?.topic) === selectedSubTopic.topic &&
        (q.subTopic ?? q.classification?.subTopic) === selectedSubTopic.subTopic
      );

      if (filteredQuestions.length === 0) {
        useNotificationStore.getState().showToast({ variant: "error", message: "No questions found for this subtopic." });
        setIsCreatingQuiz(false);
        return;
      }

      const finalName = `${selectedSubTopic.subTopic} Quiz`;

      const filters = {
        subject: [decodedSubject],
        topic: [selectedSubTopic.topic],
        subTopic: [selectedSubTopic.subTopic],
        difficulty: [],
        questionType: [],
        examName: [],
        examYear: [],
        examDateShift: [],
        tags: [],
      };

      const result = await quizCreationService.createQuiz(filteredQuestions, filters, mode, finalName);

      if (result.error) {
        useNotificationStore.getState().showToast({ variant: 'error', message: result.error });
        setIsCreatingQuiz(false);
        return;
      }

      setSelectedSubTopic(null);

      if (startImmediately) {
        if (result.reused) {
          useNotificationStore.getState().showToast({ variant: 'success', message: 'Resuming existing quiz session' });
        }
        // Navigate to the library first so it's in the back stack, then to the quiz player
        navigate('/quiz/library?tab=created', { replace: true });
        setTimeout(() => {
          navigate(mode === 'learning' ? ROUTES.QUIZ.SESSION.learning(result.quizId) : ROUTES.QUIZ.SESSION.mock(result.quizId));
        }, 50);
      } else {
        useNotificationStore.getState().showToast({
          variant: "success",
          duration: 7000,
          message: (
            <span>
              {result.reused ? 'Resumed existing quiz session.' : 'Quiz saved successfully.'}{' '}
              <a
                href="#/quiz/library?tab=created"
                className="underline font-semibold hover:text-indigo-700 dark:hover:text-indigo-300"
                onClick={(e) => {
                  const id = (e.target as any).closest('.relative')?.dataset?.toastId;
                  if (id) useNotificationStore.getState().removeToast(id);
                }}
              >
                View in Library
              </a>
            </span>
          )
        });
      }
    } catch (err: any) {
      console.error("Failed to create quiz:", err);
      useNotificationStore.getState().showToast({ variant: 'error', message: 'Failed to create quiz. Please try again.' });
    } finally {
      setIsCreatingQuiz(false);
    }
  };"""

content = re.sub(
    r'  const handleCreateQuiz = async \(mode: \'learning\' \| \'mock\', startImmediately: boolean\) => \{.*?\n      \}\n    \} catch \(err\) \{\n      console\.error\("Failed to create quiz:", err\);\n      useNotificationStore\.getState\(\)\.showToast\(\{ variant: "error", message: "An error occurred while creating the quiz\." \}\);\n    \} finally \{\n      setIsCreatingQuiz\(false\);\n    \}\n  \};',
    new_func,
    content,
    flags=re.DOTALL
)


# if the previous regex failed because of different catch block or string format
if "db.saveQuiz(newQuiz)" in content:
  content = re.sub(
      r'  const handleCreateQuiz = async \(mode: \'learning\' \| \'mock\', startImmediately: boolean\) => \{.*?\n      \}\n    \} catch \(err\) \{\n.*?\n    \} finally \{\n      setIsCreatingQuiz\(false\);\n    \}\n  \};',
      new_func,
      content,
      flags=re.DOTALL
  )

if "db.saveQuiz(newQuiz)" in content:
  content = re.sub(
      r'  const handleCreateQuiz = async \(mode: \'learning\' \| \'mock\', startImmediately: boolean\) => \{.*?\n      \}\n    \} catch \(err\) \{\n.*?\n    \} finally \{\n      setIsCreatingQuiz\(false\);\n    \}\n  \};',
      new_func,
      content,
      flags=re.DOTALL
  )


# Last resort fallback if regexes above fail:
if "db.saveQuiz(newQuiz)" in content:
  parts = content.split("const handleCreateQuiz = async (mode: 'learning' | 'mock', startImmediately: boolean) => {")
  if len(parts) == 2:
      rest = parts[1]
      end_idx = rest.find("  const closeBottomSheet = () => {")
      if end_idx == -1:
         end_idx = rest.find("  return (")

      new_content = parts[0] + new_func + "\n" + rest[end_idx:]
      content = new_content


with open('src/features/dashboard/pages/subject/SubjectTopicsPage.tsx', 'w') as f:
    f.write(content)
