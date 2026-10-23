import re

with open('src/features/quiz/components/QuizConfig.tsx', 'r') as f:
    content = f.read()

# Replace imports
import_search = "import { Question, InitialFilters, QuizMode, SavedQuiz } from '../types';"
import_replace = """import { Question, InitialFilters, QuizMode, SavedQuiz } from '../types';
import { useQuestionMetadata } from '../hooks/useQuestionMetadata';"""

if import_search in content:
    content = content.replace(import_search, import_replace)
else:
    print("Failed to replace imports")


# Replace fetching logic
fetch_logic_search = """  // State for Data Fetching & Sync
  const [metadata, setMetadata] = useState<Question[]>([]);
  const [isLoadingMetadata, setIsLoadingMetadata] = useState(true);
  const [isStartingQuiz, setIsStartingQuiz] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [progress, setProgress] = useState({ current: 0, total: 0 });
  const [showEmptyError, setShowEmptyError] = useState(false);

  const locState = location.state as any;
  const isFixedSubjectContext = locState?.fixedSubjectContext === true;
  const fixedSubject = isFixedSubjectContext ? locState?.initialFilters?.subject?.[0] : null;

  // 0. Fetch Metadata on Mount
  const loadMetadata = useCallback(async () => {
    try {
      setIsLoadingMetadata(true);
      setError(null);
      setProgress({ current: 0, total: 0 });

      // 1. Instantly load from cache
      const cachedMetadata = await db.getQuizMetadataCache();
      if (cachedMetadata && cachedMetadata.length > 0) {
        setMetadata(cachedMetadata);
        setIsLoadingMetadata(false); // Instantly render UI
      }

      // 2. Fetch delta in the background (or foreground if no cache)
      const data = await fetchQuestionMetadata((current, total) => {
        setProgress({ current, total });
      });

      // 3. Update state
      setMetadata(data);

      if (data.length === 0) {
        console.warn("No questions fetched from database.");
      }
    } catch (err) {
      console.error("Failed to load questions:", err);
      setError("Failed to load question bank. Please check your internet connection.");
    } finally {
      setIsLoadingMetadata(false);
    }
  }, []);

  useEffect(() => {
    loadMetadata();
  }, [loadMetadata]);"""

fetch_logic_replace = """  // State for Data Fetching & Sync
  const { metadata, isLoading: isLoadingMetadata, error, progress, refresh: loadMetadata } = useQuestionMetadata();
  const [isStartingQuiz, setIsStartingQuiz] = useState(false);
  const [showEmptyError, setShowEmptyError] = useState(false);

  const locState = location.state as any;
  const isFixedSubjectContext = locState?.fixedSubjectContext === true;
  const fixedSubject = isFixedSubjectContext ? locState?.initialFilters?.subject?.[0] : null;"""


if fetch_logic_search in content:
    content = content.replace(fetch_logic_search, fetch_logic_replace)
else:
    print("Failed to replace fetch logic")

with open('src/features/quiz/components/QuizConfig.tsx', 'w') as f:
    f.write(content)
