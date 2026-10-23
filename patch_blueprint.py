import re

with open('src/features/blueprints/components/BlueprintBuilder.tsx', 'r') as f:
    content = f.read()

# Add useQuestionMetadata import
import_search = "import { Question } from '@/features/quiz/types';"
import_replace = """import { Question } from '@/features/quiz/types';
import { useQuestionMetadata } from '@/features/quiz/hooks/useQuestionMetadata';"""
if import_search in content:
    content = content.replace(import_search, import_replace)

# Replace the data loading section
fetch_logic_search = """  const [metadata, setMetadata] = useState<Question[]>([]);
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    if (!propMetadataIndex) {
      setIsLoading(true);
      fetchQuestionMetadata().then(data => {
        setMetadata(data);
        setIsLoading(false);
      });
    }
  }, [propMetadataIndex]);"""

fetch_logic_replace = """  const { metadata: fetchedMetadata, isLoading: isLoadingMetadata } = useQuestionMetadata();
  const [metadata, setMetadata] = useState<Question[]>([]);
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    if (!propMetadataIndex) {
       setIsLoading(isLoadingMetadata);
       setMetadata(fetchedMetadata);
    }
  }, [propMetadataIndex, fetchedMetadata, isLoadingMetadata]);"""

if fetch_logic_search in content:
    content = content.replace(fetch_logic_search, fetch_logic_replace)


with open('src/features/blueprints/components/BlueprintBuilder.tsx', 'w') as f:
    f.write(content)
