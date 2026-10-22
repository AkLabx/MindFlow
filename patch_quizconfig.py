import re

with open('src/features/quiz/components/QuizConfig.tsx', 'r') as f:
    content = f.read()

# Add import for quizCreationService
if "quizCreationService" not in content:
    content = content.replace(
        "import { useQuestionIndex, filterQuestionsByIndex } from '../hooks/useQuestionIndex';",
        "import { quizCreationService } from '../services/quizCreationService';\nimport { useQuestionIndex, filterQuestionsByIndex } from '../hooks/useQuestionIndex';"
    )


# Replace createQuizWithQuestions
new_func = """  const createQuizWithQuestions = async (questionSubset: Question[], activeFilters: InitialFilters) => {
    try {
      setIsStartingQuiz(true);

      const finalName = quizName.trim() || `Quiz ${new Date().toLocaleDateString()} ${new Date().toLocaleTimeString()}`;

      const result = await quizCreationService.createQuiz(questionSubset, activeFilters, mode, finalName);

      if (result.error) {
        useNotificationStore.getState().showToast({ variant: 'error', message: result.error });
        setIsStartingQuiz(false);
        return;
      }

      if (result.reused) {
        useNotificationStore.getState().showToast({ variant: 'success', message: 'Resuming existing quiz session' });
      }

      // navigate to Saved route to fetch newly created (or reused) quiz directly from the cloud
      navigate('/quiz/library?tab=created');

    } catch (err) {
      console.error("Failed to create quiz:", err);
      useNotificationStore.getState().showToast({ variant: 'error', message: 'Failed to create quiz. Please try again.' });
    } finally {
      setIsStartingQuiz(false);
    }
  };"""

content = re.sub(
    r'  const createQuizWithQuestions = async \(questionSubset: Question\[\], activeFilters: InitialFilters\) => \{.*?\n    \} finally \{\n      setIsStartingQuiz\(false\);\n    \}\n  \};',
    new_func,
    content,
    flags=re.DOTALL
)

with open('src/features/quiz/components/QuizConfig.tsx', 'w') as f:
    f.write(content)
