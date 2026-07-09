import re

with open('src/features/admin/test-series/components/TestDrawer.tsx', 'r') as f:
    content = f.read()

content = content.replace("import { AlertCircle, CheckCircle2, XCircle, Info } from 'lucide-react';", "import { AlertCircle, CheckCircle2, XCircle, Info, Loader2 } from 'lucide-react';")

with open('src/features/admin/test-series/components/TestDrawer.tsx', 'w') as f:
    f.write(content)

with open('src/features/admin/question-builder/components/QuestionPreviewDrawer.tsx', 'r') as f:
    content = f.read()

# Fix difficulty not existing on Question model by casting or checking
# or just casting question to any for the preview
content = content.replace("question.difficulty", "(question as any).difficulty")

with open('src/features/admin/question-builder/components/QuestionPreviewDrawer.tsx', 'w') as f:
    f.write(content)
