import re

with open('src/features/tools/quiz-pdf-ppt-generator/QuizPdfPptGenerator.tsx', 'r') as f:
    content = f.read()

# Replace imports
import_search = "import { Question, InitialFilters } from '../../quiz/types';"
import_replace = """import { Question, InitialFilters } from '../../quiz/types';
import { useQuestionMetadata } from '../../quiz/hooks/useQuestionMetadata';"""

if import_search in content:
    content = content.replace(import_search, import_replace)

# Replace data fetching logic
fetch_logic_search = """  // State for Data Fetching & Sync
  const [metadata, setMetadata] = useState<Question[]>([]);
  const [isLoadingMetadata, setIsLoadingMetadata] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [progress, setProgress] = useState({ current: 0, total: 0 });
  const [showEmptyError, setShowEmptyError] = useState(false);

  // State for Generation
  const [isGenerating, setIsGenerating] = useState(false);
  const [genType, setGenType] = useState<'PDF' | 'PPT' | 'JSON' | null>(null);
  const [genProgress, setGenProgress] = useState(0);
  const [genDetails, setGenDetails] = useState('');

  // 0. Fetch Metadata on Mount
  const loadMetadata = useCallback(async () => {
    try {
      setIsLoadingMetadata(true);
      setError(null);
      setProgress({ current: 0, total: 0 });

      const data = await fetchQuestionMetadata((current, total) => {
        setProgress({ current, total });
      });

      setMetadata(data);
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
  const [showEmptyError, setShowEmptyError] = useState(false);

  // State for Generation
  const [isGenerating, setIsGenerating] = useState(false);
  const [genType, setGenType] = useState<'PDF' | 'PPT' | 'JSON' | null>(null);
  const [genProgress, setGenProgress] = useState(0);
  const [genDetails, setGenDetails] = useState('');"""

if fetch_logic_search in content:
    content = content.replace(fetch_logic_search, fetch_logic_replace)

with open('src/features/tools/quiz-pdf-ppt-generator/QuizPdfPptGenerator.tsx', 'w') as f:
    f.write(content)
